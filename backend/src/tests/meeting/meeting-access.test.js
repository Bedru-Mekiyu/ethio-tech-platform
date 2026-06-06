import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../../models/User.js";
import Session from "../../models/Session.js";
import SessionParticipant from "../../models/SessionParticipant.js";
import { canUserAccessMeeting } from "../../services/meetingService.js";

let mongo;
let mentor;
let student;
let otherStudent;
let admin;
let session;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({}), SessionParticipant.deleteMany({})]);

  mentor = await User.create({
    fullName: "Mentor One",
    email: `mentor-${Date.now()}@example.com`,
    password: "Passw0rd!",
    role: "mentor",
    status: "active",
  });
  student = await User.create({
    fullName: "Student One",
    email: `student-${Date.now()}@example.com`,
    password: "Passw0rd!",
    role: "student",
    status: "active",
  });
  otherStudent = await User.create({
    fullName: "Student Two",
    email: `other-${Date.now()}@example.com`,
    password: "Passw0rd!",
    role: "student",
    status: "active",
  });
  admin = await User.create({
    fullName: "Admin One",
    email: `admin-${Date.now()}@example.com`,
    password: "Passw0rd!",
    role: "admin",
    status: "active",
  });

  session = await Session.create({
    title: "Mentorship Session",
    mentor: mentor._id,
    participants: [student._id],
    scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    durationMinutes: 60,
    status: "scheduled",
  });
});

describe("canUserAccessMeeting", () => {
  it("grants mentor access to their own meeting", async () => {
    expect(await canUserAccessMeeting(mentor, session)).toBe(true);
  });

  it("grants student access when they are a participant", async () => {
    expect(await canUserAccessMeeting(student, session)).toBe(true);
  });

  it("denies a different student access", async () => {
    expect(await canUserAccessMeeting(otherStudent, session)).toBe(false);
  });

  it("grants admin access to any meeting", async () => {
    expect(await canUserAccessMeeting(admin, session)).toBe(true);
  });

  it("grants access when the user only has a SessionParticipant record", async () => {
    const joined = await User.create({
      fullName: "Joined Late",
      email: `joined-${Date.now()}@example.com`,
      password: "Passw0rd!",
      role: "student",
      status: "active",
    });
    await SessionParticipant.create({
      session: session._id,
      user: joined._id,
      status: "joined",
      role: "participant",
    });
    expect(await canUserAccessMeeting(joined, session)).toBe(true);
  });

  it("denies when user is null", async () => {
    expect(await canUserAccessMeeting(null, session)).toBe(false);
  });

  it("denies when session is null", async () => {
    expect(await canUserAccessMeeting(student, null)).toBe(false);
  });
});
