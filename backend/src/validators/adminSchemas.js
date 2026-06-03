import { z } from "zod";
import { ROLES } from "../config/permissions.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const adminUserSchemas = {
  idParam: z.object({
    id: objectId,
  }),

  create: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(/[A-Za-z]/, "Password must include a letter")
      .regex(/\d/, "Password must include a number"),
    role: z.enum(Object.values(ROLES)).optional(),
    gradeLevel: z.coerce.number().int().min(8).max(12).optional(),
    city: z.string().trim().min(2).max(120).optional(),
    bio: z.string().max(1000).optional(),
    phone: z.string().trim().max(40).optional(),
    expertise: z.array(z.string().trim().min(2).max(80)).max(20).optional(),
    currentCompany: z.string().trim().min(2).max(120).optional(),
    learningInterests: z.array(z.string().trim().min(2).max(80)).max(12).optional(),
  }),

  update: z.object({
    fullName: z.string().trim().min(2).max(120).optional(),
    bio: z.string().max(1000).optional(),
    phone: z.string().trim().max(40).optional(),
    city: z.string().trim().min(2).max(120).optional(),
    gradeLevel: z.coerce.number().int().min(8).max(12).optional(),
    expertise: z.array(z.string().trim().min(2).max(80)).max(20).optional(),
    currentCompany: z.string().trim().min(2).max(120).optional(),
    learningInterests: z.array(z.string().trim().min(2).max(80)).max(12).optional(),
  }).refine((data) => Object.keys(data).length > 0, "At least one field is required"),

  changeRole: z.object({
    role: z.enum(Object.values(ROLES)),
  }),

  suspendBan: z.object({
    reason: z.string().trim().min(2).max(500).optional(),
  }),

  resetPassword: z.object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(/[A-Za-z]/, "Password must include a letter")
      .regex(/\d/, "Password must include a number"),
  }),

  bulkAction: z.object({
    action: z.enum(["approve", "reject", "suspend", "reactivate", "soft_delete", "verify"]),
    userIds: z.array(objectId).min(1).max(100),
    reason: z.string().trim().max(500).optional(),
  }),

  announcement: z.object({
    recipientIds: z.array(objectId).min(1).max(500),
    message: z.string().trim().min(2).max(2000),
    link: z.string().url().optional(),
  }),

  reviewMentor: z.object({
    status: z.enum(["approved", "rejected"]),
    reviewedNotes: z.string().min(2).max(2000).optional(),
  }),

  rejectMentor: z.object({
    rejectionReason: z.string().trim().min(2).max(1000),
  }),

  requestChangesMentor: z.object({
    reviewNotes: z.string().trim().min(2).max(2000),
  }),
};

export const mentorApplicationUpdateSchemas = {
  reviewMentorApplication: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
    reviewedNotes: z.string().min(2).max(2000).optional(),
  }),
};
