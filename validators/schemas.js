import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const isoDateString = z.string().datetime({ offset: true });
const httpUrl = z.string().url();

const atLeastOneField = (schema, message) =>
  schema.refine((value) => Object.keys(value).length > 0, message);

export const commonSchemas = {
  idParam: z.object({ id: objectId }),
};

export const trackSchemas = {
  create: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    category: z.enum(["awareness", "beginner", "intermediate", "advanced"]).optional(),
    xpReward: z.number().int().nonnegative().optional(),
    estimatedWeeks: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
  update: atLeastOneField(
    z.object({
      title: z.string().min(2).optional(),
      description: z.string().optional(),
      category: z.enum(["awareness", "beginner", "intermediate", "advanced"]).optional(),
      xpReward: z.number().int().nonnegative().optional(),
      estimatedWeeks: z.number().int().positive().optional(),
      isActive: z.boolean().optional(),
    }),
    { message: "At least one field is required" }
  ),
};

export const moduleSchemas = {
  create: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    track: objectId,
    order: z.number().int().nonnegative().optional(),
  }),
  update: atLeastOneField(
    z.object({
      title: z.string().min(2).optional(),
      description: z.string().optional(),
      track: objectId.optional(),
      order: z.number().int().nonnegative().optional(),
    }),
    { message: "At least one field is required" }
  ),
};

export const lessonSchemas = {
  create: z.object({
    title: z.string().min(2),
    content: z.string().optional(),
    videoUrl: httpUrl.optional(),
    codeSandboxUrl: httpUrl.optional(),
    xpReward: z.number().int().nonnegative().optional(),
    module: objectId,
    durationMinutes: z.number().int().positive().optional(),
    order: z.number().int().nonnegative().optional(),
    quiz: z.array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).min(2),
        correctIndex: z.number().int().nonnegative(),
      })
    ).optional(),
  }),
  update: atLeastOneField(
    z.object({
      title: z.string().min(2).optional(),
      content: z.string().optional(),
      videoUrl: httpUrl.optional(),
      codeSandboxUrl: httpUrl.optional(),
      xpReward: z.number().int().nonnegative().optional(),
      module: objectId.optional(),
      durationMinutes: z.number().int().positive().optional(),
      order: z.number().int().nonnegative().optional(),
      quiz: z.array(
        z.object({
          question: z.string().min(1),
          options: z.array(z.string().min(1)).min(2),
          correctIndex: z.number().int().nonnegative(),
        })
      ).optional(),
    }),
    { message: "At least one field is required" }
  ),
};

export const projectSchemas = {
  create: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    track: objectId,
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    xpReward: z.number().int().nonnegative().optional(),
    githubTemplate: httpUrl.optional(),
    requirements: z.array(z.string()).optional(),
  }),
  update: atLeastOneField(
    z.object({
      title: z.string().min(2).optional(),
      description: z.string().optional(),
      track: objectId.optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      xpReward: z.number().int().nonnegative().optional(),
      githubTemplate: httpUrl.optional(),
      requirements: z.array(z.string()).optional(),
    }),
    { message: "At least one field is required" }
  ),
};

export const submissionSchemas = {
  create: z.object({
    project: objectId,
    githubLink: httpUrl.optional(),
    deployedUrl: httpUrl.optional(),
    files: z.array(z.string()).optional(),
  }),
  review: z.object({
    status: z.enum(["reviewed", "approved", "rejected"]),
    feedback: z.string().optional(),
    grade: z.number().min(0).max(100).optional(),
  }),
};

export const sessionSchemas = {
  create: z.object({
    title: z.string().min(2),
    scheduledAt: isoDateString,
    durationMinutes: z.number().int().positive().optional(),
    classroomMode: z.enum(["standard", "immersive-3d"]).optional(),
    liveProvider: z.enum(["custom", "agora", "twilio", "daily", "zoom"]).optional(),
    meetingLink: httpUrl.optional(),
    recordingUrl: httpUrl.optional(),
    xpPerAttendee: z.number().int().nonnegative().optional(),
    whiteboardEnabled: z.boolean().optional(),
    codeCollabEnabled: z.boolean().optional(),
  }),
  update: atLeastOneField(
    z.object({
      title: z.string().min(2).optional(),
      scheduledAt: isoDateString.optional(),
      durationMinutes: z.number().int().positive().optional(),
      classroomMode: z.enum(["standard", "immersive-3d"]).optional(),
      liveProvider: z.enum(["custom", "agora", "twilio", "daily", "zoom"]).optional(),
      meetingLink: httpUrl.optional(),
      recordingUrl: httpUrl.optional(),
      xpPerAttendee: z.number().int().nonnegative().optional(),
      whiteboardEnabled: z.boolean().optional(),
      codeCollabEnabled: z.boolean().optional(),
      status: z.enum(["scheduled", "live", "ended", "canceled"]).optional(),
    }),
    { message: "At least one field is required" }
  ),
  feedback: z.object({
    quality: z.number().int().min(1).max(5),
    engagement: z.number().int().min(1).max(5),
    impact: z.number().int().min(1).max(5),
    comment: z.string().optional(),
  }),
};

export const xpSchemas = {
  grant: z.object({
    userId: objectId,
    amount: z.number().positive(),
    reason: z.string().min(2),
    sourceType: z.enum(["lesson", "project", "session", "hub", "badge", "manual"]).optional(),
    sourceId: objectId.optional(),
  }),
};

export const notificationSchemas = {
  create: z.object({
    recipient: objectId,
    type: z.enum(["system", "mentor", "project", "session", "badge", "xp"]),
    message: z.string().min(2),
    link: z.string().optional(),
  }),
};

export const hubSchemas = {
  create: z.object({
    city: z.string().min(2),
    address: z.string().optional(),
    capacity: z.number().int().nonnegative().optional(),
    mentorInCharge: objectId.optional(),
    computersAvailable: z.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
  }),
  update: atLeastOneField(
    z.object({
      city: z.string().min(2).optional(),
      address: z.string().optional(),
      capacity: z.number().int().nonnegative().optional(),
      mentorInCharge: objectId.optional(),
      computersAvailable: z.number().int().nonnegative().optional(),
      isActive: z.boolean().optional(),
    }),
    { message: "At least one field is required" }
  ),
  attendance: z.object({
    hubId: objectId,
    studentId: objectId,
    date: isoDateString,
  }),
};

export const badgeSchemas = {
  create: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    icon: z.string().optional(),
    xpBonus: z.number().int().nonnegative().optional(),
    category: z.enum(["achievement", "skill", "community"]).optional(),
  }),
  assign: z.object({
    userId: objectId,
    badgeId: objectId,
  }),
};

export const certificateSchemas = {
  issue: z.object({
    student: objectId,
    track: objectId,
    certificateUrl: httpUrl.optional(),
  }),
};
