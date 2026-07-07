import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { createAssignedAvatar } from "./avatarService.js";
import {
  ROLES,
  USER_STATUS,
  MENTOR_STATUS,
  MENTOR_ACCOUNT_STATUS,
  CREDENTIALS_DELIVERY_METHOD,
} from "../config/permissions.js";
import { getEnv } from "../config/env.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const generateSecurePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.randomBytes(16);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

export const generateActivationToken = () => crypto.randomBytes(32).toString("hex");

export const getCredentialsExpiryDate = () => {
  const hours = getEnv().credentialsExpiryHours || 24;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

export const syncApplicationToUser = (user, application) => {
  user.expertise = application.expertise ?? user.expertise ?? [];
  user.currentCompany = application.currentCompany ?? user.currentCompany;
  user.bio = application.whyMentor ?? user.bio;
  if (application.location && !user.city) {
    user.city = application.location;
  }
  user.linkedApplicationId = application._id;
  return user;
};

export const upgradeExistingUser = async (user, application, actorId) => {
  const previousRole = user.role;
  user.role = ROLES.MENTOR;
  user.mentorStatus = MENTOR_STATUS.APPROVED;
  user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.INVITED;
  user.isVerified = true;
  user.verifiedAt = new Date();
  user.verifiedBy = actorId;
  user.status = USER_STATUS.ACTIVE;
  user.statusChangedAt = new Date();
  user.statusChangedBy = actorId;
  user.mustChangePassword = true;
  user.credentialsExpiresAt = getCredentialsExpiryDate();
  user.onboardingSteps = {
    passwordChanged: false,
    termsAccepted: false,
    profileCompleted: false,
    photoUploaded: user.avatarType === "uploaded",
    availabilitySet: false,
  };
  syncApplicationToUser(user, application);

  await user.save();
  return { user, accountCreated: false, roleUpgraded: previousRole !== ROLES.MENTOR };
};

export const createMentorUser = async (application, actorId) => {
  const email = application.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "User already exists with this email");
  }

  const tempPassword = generateSecurePassword();
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  const avatar = createAssignedAvatar({ role: ROLES.MENTOR, seed: email });

  const user = await User.create({
    fullName: application.fullName,
    email,
    password: hashedPassword,
    role: ROLES.MENTOR,
    status: USER_STATUS.ACTIVE,
    statusChangedAt: new Date(),
    statusChangedBy: actorId,
    mentorStatus: MENTOR_STATUS.APPROVED,
    mentorAccountStatus: MENTOR_ACCOUNT_STATUS.INVITED,
    isVerified: true,
    verifiedAt: new Date(),
    verifiedBy: actorId,
    mustChangePassword: true,
    credentialsExpiresAt: getCredentialsExpiryDate(),
    expertise: application.expertise ?? [],
    currentCompany: application.currentCompany,
    bio: application.whyMentor,
    city: application.location,
    linkedApplicationId: application._id,
    avatar: avatar.avatarUrl,
    avatarUrl: avatar.avatarUrl,
    avatarType: avatar.avatarType,
    avatarSource: avatar.avatarSource,
    avatarPublicId: avatar.avatarPublicId,
    onboardingSteps: {
      passwordChanged: false,
      termsAccepted: false,
      profileCompleted: false,
      photoUploaded: false,
      availabilitySet: false,
    },
  });

  return { user, accountCreated: true, roleUpgraded: false, tempPassword };
};

export const setActivationToken = async (user) => {
  const token = generateActivationToken();
  user.activationTokenHash = hashToken(token);
  user.activationTokenExpiresAt = getCredentialsExpiryDate();
  user.mentorAccountStatus = MENTOR_ACCOUNT_STATUS.INVITED;
  await user.save();
  return token;
};

export const provisionOnApproval = async ({ application, actorId }) => {
  let user = await User.findOne({ email: application.email.toLowerCase() });
  let accountCreated = false;
  let roleUpgraded = false;
  let tempPassword;

  if (user) {
    if (user.role === ROLES.MENTOR && user.mentorStatus === MENTOR_STATUS.APPROVED) {
      syncApplicationToUser(user, application);
      user.mentorAccountStatus = user.mentorAccountStatus || MENTOR_ACCOUNT_STATUS.ACTIVE;
      await user.save();
      return { user, accountCreated: false, roleUpgraded: false, alreadyProvisioned: true };
    }
    const result = await upgradeExistingUser(user, application, actorId);
    user = result.user;
    roleUpgraded = result.roleUpgraded;
  } else {
    const result = await createMentorUser(application, actorId);
    user = result.user;
    accountCreated = result.accountCreated;
    tempPassword = result.tempPassword;
  }

  application.userId = user._id;
  application.provisionedAt = new Date();
  application.provisionedBy = actorId;
  await application.save();

  return { user, accountCreated, roleUpgraded, tempPassword, alreadyProvisioned: false };
};

export const regenerateCredentials = async (userId, actorId) => {
  const user = await User.findById(userId).select(
    "+password +activationTokenHash +activationTokenExpiresAt +mustChangePassword"
  );
  if (!user) throw new ApiError(404, "User not found");
  if (user.role !== ROLES.MENTOR) {
    throw new ApiError(400, "User is not a mentor");
  }

  const tempPassword = generateSecurePassword();
  user.password = await bcrypt.hash(tempPassword, 10);
  user.mustChangePassword = true;
  user.credentialsExpiresAt = getCredentialsExpiryDate();
  user.refreshTokenHash = undefined;
  user.refreshTokenExpiresAt = undefined;
  user.verifiedBy = actorId;

  const activationToken = await setActivationToken(user);

  return { user, activationToken, tempPassword };
};

export const markCredentialsDelivered = async (application, method) => {
  application.credentialsSentAt = new Date();
  application.credentialsDeliveryMethod = method;
  await application.save();
};

export const isCredentialsExpired = (user) => {
  if (!user.credentialsExpiresAt) return false;
  return user.credentialsExpiresAt < new Date();
};

export const CREDENTIALS_DELIVERY = CREDENTIALS_DELIVERY_METHOD;
