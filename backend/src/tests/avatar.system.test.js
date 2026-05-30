import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { registerUser } from "../services/authService.js";
import { serializeAuthUser } from "../utils/serializeUser.js";
import { createAssignedAvatar, getSystemAvatarCatalog } from "../services/avatarService.js";
import { removeMyAvatar, uploadMyAvatar } from "../controllers/userController.js";

const usersDb = [];

vi.mock("../models/User.js", () => {
  const makeQuery = (value) => ({
    select: () => makeQuery(value),
    populate: () => makeQuery(value),
    then: (onFulfilled, onRejected) => Promise.resolve(value).then(onFulfilled, onRejected),
    catch: (onRejected) => Promise.resolve(value).catch(onRejected),
  });

  return {
    default: {
      create: async (data) => {
        const doc = {
          _id: `mock-${usersDb.length + 1}`,
          ...data,
          save: async function () {
            const index = usersDb.findIndex((item) => item._id === this._id);
            if (index !== -1) {
              usersDb[index] = this;
            }
            return this;
          },
        };
        usersDb.push(doc);
        return doc;
      },
      findOne: (query) => {
        const found = usersDb.find((item) => Object.entries(query).every(([key, value]) => item[key] === value));
        return makeQuery(found ?? null);
      },
      findById: (id) => {
        const found = usersDb.find((item) => item._id === id) ?? null;
        return makeQuery(found);
      },
      findByIdAndUpdate: (id, updates) => {
        const index = usersDb.findIndex((item) => item._id === id);
        if (index === -1) {
          return makeQuery(null);
        }
        usersDb[index] = { ...usersDb[index], ...updates };
        return makeQuery(usersDb[index]);
      },
    },
  };
});

vi.mock("cloudinary", () => {
  const destroy = vi.fn(async () => ({ result: "ok" }));
  const upload_stream = vi.fn((_options, cb) => ({
    end: () =>
      cb(null, {
        secure_url: "https://res.cloudinary.com/demo/image/upload/v1/avatars/uploaded-avatar.webp",
        public_id: "avatars/uploaded-avatar",
      }),
  }));

  return {
    v2: {
      config: vi.fn(),
      uploader: { upload_stream, destroy },
      utils: { api_sign_request: vi.fn(() => "signature") },
    },
  };
});

const buildRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

describe("avatar system", () => {
  beforeEach(() => {
    usersDb.splice(0, usersDb.length);
    process.env.JWT_SECRET = "test-jwt-secret-min-16-chars";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-min-16";
    process.env.CLOUDINARY_CLOUD_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "demo";
    process.env.CLOUDINARY_API_SECRET = "demo";
  });

  it("assigns a system avatar when registering a user", async () => {
    const user = await registerUser({
      fullName: "Aster Bekele",
      email: "aster@example.com",
      password: "Password1",
      role: "student",
    });

    expect(user.avatarUrl).toMatch(/^\/avatars\/student-/);
    expect(user.avatarType).toBe("default");
    expect(user.avatarSource).toBe("system");
    expect(getSystemAvatarCatalog()).toHaveLength(8);
  });

  it("serializes legacy users with a fallback avatar", () => {
    const payload = serializeAuthUser({
      _id: "legacy-user",
      fullName: "Legacy User",
      email: "legacy@example.com",
      role: "mentor",
      level: 2,
      xp: 40,
      isVerified: true,
    });

    expect(payload.avatarUrl).toMatch(/^\/avatars\/mentor-/);
    expect(payload.avatarType).toBe("default");
    expect(payload.avatarSource).toBe("system");
  });

  it("preserves legacy uploaded avatars when they exist", () => {
    const payload = serializeAuthUser({
      _id: "legacy-uploaded-user",
      fullName: "Legacy Upload",
      email: "upload@example.com",
      role: "student",
      avatar: "https://res.cloudinary.com/demo/image/upload/v1/avatars/old-avatar.webp",
    });

    expect(payload.avatarUrl).toBe("https://res.cloudinary.com/demo/image/upload/v1/avatars/old-avatar.webp");
    expect(payload.avatarType).toBe("uploaded");
    expect(payload.avatarSource).toBe("cloudinary");
  });

  it("uploads a replacement avatar and deletes the previous Cloudinary asset", async () => {
    const existing = await User.create({
      fullName: "Avatar Replace",
      email: "replace@example.com",
      password: await bcrypt.hash("Password1", 10),
      role: "student",
      avatar: "https://res.cloudinary.com/demo/image/upload/v1/avatars/old-avatar.webp",
      avatarUrl: "https://res.cloudinary.com/demo/image/upload/v1/avatars/old-avatar.webp",
      avatarType: "uploaded",
      avatarSource: "cloudinary",
      avatarPublicId: "avatars/old-avatar",
    });

    const req = {
      file: { buffer: Buffer.from("avatar") },
      user: { _id: existing._id },
      app: { get: () => ({ emit: vi.fn() }) },
    };
    const res = buildRes();

    await uploadMyAvatar(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.avatarUrl).toContain("res.cloudinary.com");
    expect(res.body.data.user.avatarType).toBe("uploaded");
  });

  it("reverts to a system avatar when removing a custom avatar", async () => {
    const existing = await User.create({
      fullName: "Avatar Reset",
      email: "reset@example.com",
      password: await bcrypt.hash("Password1", 10),
      role: "mentor",
      avatar: "https://res.cloudinary.com/demo/image/upload/v1/avatars/mentor-old.webp",
      avatarUrl: "https://res.cloudinary.com/demo/image/upload/v1/avatars/mentor-old.webp",
      avatarType: "uploaded",
      avatarSource: "cloudinary",
      avatarPublicId: "avatars/mentor-old",
    });

    const req = {
      user: { _id: existing._id },
      app: { get: () => ({ emit: vi.fn() }) },
    };
    const res = buildRes();

    await removeMyAvatar(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.avatarUrl).toMatch(/^\/avatars\/mentor-/);
    expect(res.body.data.user.avatarSource).toBe("system");
  });

  it("keeps assigned avatars stable for the same seed", () => {
    const first = createAssignedAvatar({ role: "student", seed: "stable-seed" });
    const second = createAssignedAvatar({ role: "student", seed: "stable-seed" });

    expect(first.avatarUrl).toBe(second.avatarUrl);
  });
});
