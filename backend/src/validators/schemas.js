import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const isoDateString = z.string().datetime({ offset: true });
const httpUrl = z.string().url();
const systemAvatarUrl = z
  .string()
  .refine((value) => /^\/avatars\/[a-z0-9-]+\.svg$/i.test(value), "Invalid system avatar URL");

const atLeastOneField = (schema, message) => schema.refine((value) => Object.keys(value).length > 0, message);

export const commonSchemas = {
  idParam: z.object({ id: objectId }),
};

export const contactSchemas = {
  submit: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    message: z.string().trim().min(10).max(2000),
  }),
};

const cloudinaryAvatarUrl = z
  .string()
  .url()
  .refine((url) => /^https:\/\/res\.cloudinary\.com\//.test(url), "Avatar must be a Cloudinary URL");

const avatarUrl = z.union([cloudinaryAvatarUrl, systemAvatarUrl]);

export const userSchemas = {
  updateProfile: atLeastOneField(
    z.object({
      fullName: z.string().trim().min(2).max(120).optional(),
      avatar: avatarUrl.optional(),
      avatarUrl: avatarUrl.optional(),
      avatarType: z.enum(["uploaded", "default"]).optional(),
      avatarSource: z.enum(["cloudinary", "system"]).optional(),
      bio: z.string().max(1000).optional(),
      phone: z.string().trim().max(40).optional(),
      city: z.string().trim().min(2).max(120).optional(),
      learningInterests: z.array(z.string().trim().min(2).max(80)).max(12).optional(),
      gradeLevel: z.coerce.number().int().min(8).max(12).optional(),
      expertise: z.array(z.string().trim().min(2).max(80)).max(20).optional(),
      currentCompany: z.string().trim().min(2).max(120).optional(),
    }),
    { message: "At least one field is required" },
  ),
};

export const avatarSchemas = {
  avatarIdParam: z.object({
    avatarId: z.string().regex(/^(student|mentor)-\d{2}$/i, "Invalid avatar id"),
  }),
};

export const authSchemas = {
  register: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(/[A-Za-z]/, "Password must include a letter")
      .regex(/\d/, "Password must include a number"),
    gradeLevel: z.coerce.number().int().min(8).max(12).optional(),
    city: z.string().trim().min(2).max(120).optional(),
    learningInterests: z.array(z.string().trim().min(2).max(80)).max(12).optional(),
  }),
  login: z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(128),
  }),
  refresh: z.object({
    refreshToken: z.string().min(20).max(2000),
  }),
  forgotPassword: z.object({
    email: z.string().trim().toLowerCase().email(),
  }),
  resetPassword: z.object({
    token: z.string().min(20).max(200),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(/[A-Za-z]/, "Password must include a letter")
      .regex(/\d/, "Password must include a number"),
  }),
  changePassword: z.object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(/[A-Za-z]/, "Password must include a letter")
      .regex(/\d/, "Password must include a number"),
  }),
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
    { message: "At least one field is required" },
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
    { message: "At least one field is required" },
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
    quiz: z
      .array(
        z.object({
          question: z.string().min(1),
          options: z.array(z.string().min(1)).min(2),
          correctIndex: z.number().int().nonnegative(),
        }),
      )
      .optional(),
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
      quiz: z
        .array(
          z.object({
            question: z.string().min(1),
            options: z.array(z.string().min(1)).min(2),
            correctIndex: z.number().int().nonnegative(),
          }),
        )
        .optional(),
    }),
    { message: "At least one field is required" },
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
    { message: "At least one field is required" },
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
    liveProvider: z.enum(["custom", "jitsi", "twilio", "daily", "zoom"]).optional(),
    meetingLink: httpUrl.optional(),
    recordingUrl: httpUrl.optional(),
    xpPerAttendee: z.number().int().nonnegative().optional(),
    whiteboardEnabled: z.boolean().optional(),
    codeCollabEnabled: z.boolean().optional(),
    maxParticipants: z.number().int().min(0).optional(),
    admissionMode: z.enum(["open", "waiting-room"]).optional(),
    isPublic: z.boolean().optional(),
  }),
  update: atLeastOneField(
    z.object({
      title: z.string().min(2).optional(),
      scheduledAt: isoDateString.optional(),
      durationMinutes: z.number().int().positive().optional(),
      classroomMode: z.enum(["standard", "immersive-3d"]).optional(),
      liveProvider: z.enum(["custom", "jitsi", "twilio", "daily", "zoom"]).optional(),
      meetingLink: httpUrl.optional(),
      recordingUrl: httpUrl.optional(),
      xpPerAttendee: z.number().int().nonnegative().optional(),
      whiteboardEnabled: z.boolean().optional(),
      codeCollabEnabled: z.boolean().optional(),
      maxParticipants: z.number().int().min(0).optional(),
      admissionMode: z.enum(["open", "waiting-room"]).optional(),
      isPublic: z.boolean().optional(),
    }),
    { message: "At least one field is required" },
  ),
  cancel: z.object({
    reason: z.string().trim().min(2).max(500),
  }),
  reschedule: z.object({
    scheduledAt: isoDateString,
    reason: z.string().trim().min(2).max(500),
  }),
  invite: z.object({
    inviteeId: objectId,
    method: z.enum(["direct", "cohort", "track", "mentor", "link"]).optional(),
    message: z.string().trim().max(500).optional(),
  }),
  admissionAction: z.object({
    userId: objectId,
  }),
  setRole: z.object({
    userId: objectId,
    role: z.enum(["cohost", "moderator", "participant", "observer"]),
  }),
  availability: z.object({
    id: objectId,
  }),
  feedback: z.object({
    quality: z.number().int().min(1).max(5),
    engagement: z.number().int().min(1).max(5),
    impact: z.number().int().min(1).max(5),
    comment: z.string().optional(),
  }),
  idParam: z.object({
    id: objectId,
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
    { message: "At least one field is required" },
  ),
  attendance: z.object({
    hubId: objectId,
    studentId: objectId,
    date: isoDateString,
  }),
};

export const mentorApplicationSchemas = {
  create: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    currentRole: z.string().min(2),
    currentCompany: z.string().min(2).optional(),
    location: z.string().min(2).optional(),
    yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
    expertise: z.array(z.string().min(2)).min(2),
    availability: z.enum(["weeknights", "weekends", "flexible", "ad-hoc"]).optional(),
    mentoringStyle: z.array(z.enum(["live-sessions", "project-reviews", "office-hours", "cohort-support"])).min(1),
    whyMentor: z.string().min(20),
    linkedin: z.string().url().optional(),
    portfolio: z.string().url().optional(),
    consent: z.literal(true),
  }),
};

export const adminSchemas = {
  reviewMentorApplication: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
    reviewedNotes: z.string().min(2).max(1000).optional(),
  }),
};

export const badgeSchemas = {
  create: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    icon: z.string().optional(),
    xpRequired: z.number().int().nonnegative().optional(),
    xpBonus: z.number().int().nonnegative().optional(),
    category: z.enum(["achievement", "skill", "community"]).optional(),
  }),
  assign: z.object({
    userId: objectId,
    badgeId: objectId,
  }),
};

export const mentorAvailabilitySchemas = {
  set: z.object({
    slots: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          startMinutes: z.number().int().min(0).max(1439),
          endMinutes: z.number().int().min(1).max(1440),
          timezone: z.string().trim().max(64).optional(),
        }),
      )
      .min(1)
      .max(21),
  }),
  book: z.object({
    mentorId: objectId,
    title: z.string().trim().min(3).max(200),
    scheduledAt: isoDateString,
    durationMinutes: z.number().int().min(15).max(180).optional(),
  }),
};

export const certificateSchemas = {
  issue: z.object({
    student: objectId,
    track: objectId,
    certificateUrl: httpUrl.optional(),
  }),
};

export const meetingSchemas = {
  forceEnd: z
    .object({
      reason: z.string().trim().min(2).max(500).optional(),
    })
    .optional()
    .default({}),
};
