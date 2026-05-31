import {
  hashPassword,
  nowMinusDays,
  pick,
  randomInt,
  pickMany,
  generateEmail,
  generatePhoneNumber,
  generateAvatarUrl,
  calculateLevel,
  daysAgo,
  hoursAgo,
} from "./utils.js";

import {
  ETHIOPIAN_CITIES,
  FIRST_NAMES,
  LAST_NAMES,
  GLOBAL_TECH_COMPANIES,
  EXPERTISE_AREAS,
  MENTOR_ORIGINS,
  STUDENT_LEARNING_GOALS,
} from "./datasets.js";

// ====== USER FACTORIES ======

export function createStudent({
  firstName = pick(FIRST_NAMES),
  lastName = pick(LAST_NAMES),
  email = null,
  city = pick(ETHIOPIAN_CITIES),
  gradeLevel = randomInt(8, 12),
  xp = randomInt(0, 15000),
  isActive = Math.random() > 0.2, // 80% active students
} = {}) {
  const createdAt = nowMinusDays(randomInt(10, 300));
  const lastActivityDays = isActive ? randomInt(0, 7) : randomInt(7, 90);
  const updatedAt = nowMinusDays(lastActivityDays);
  // Add random number to ensure email uniqueness
  const uniqueSuffix = randomInt(10000, 99999);

  return {
    fullName: `${firstName} ${lastName}`,
    email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}${uniqueSuffix}@example.com`.replace(/[^a-z0-9@.]/g, ""),
    password: hashPassword("Passw0rd!"),
    role: "student",
    avatar: generateAvatarUrl(firstName, lastName),
    bio: `Passionate learner from ${city} interested in ${pick(STUDENT_LEARNING_GOALS).toLowerCase()}. Building skills in tech to create impact.`,
    phone: generatePhoneNumber(),
    gradeLevel,
    level: calculateLevel(xp),
    xp,
    credits: randomInt(0, 500),
    isVerified: Math.random() > 0.3,
    city,
    learningGoals: pickMany(STUDENT_LEARNING_GOALS, randomInt(1, 3)),
    createdAt,
    updatedAt,
  };
}

export function createMentor({
  firstName = pick(FIRST_NAMES),
  lastName = pick(LAST_NAMES),
  email = null,
  currentCompany = pick(GLOBAL_TECH_COMPANIES),
  expertise = pickMany(EXPERTISE_AREAS, randomInt(2, 5)),
  mentorScore = randomInt(100, 1000),
  totalSessions = randomInt(10, 300),
  origin = pick(MENTOR_ORIGINS),
  bio = null,
} = {}) {
  const createdAt = nowMinusDays(randomInt(30, 365));
  const updatedAt = nowMinusDays(randomInt(0, 14));
  const uniqueSuffix = randomInt(10000, 99999);

  return {
    fullName: `${firstName} ${lastName}`,
    email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}${uniqueSuffix}@mentor.tech`.replace(/[^a-z0-9@.]/g, ""),
    password: hashPassword("Passw0rd!"),
    role: "mentor",
    avatar: generateAvatarUrl(firstName, lastName),
    bio:
      bio ||
      `${expertise.length > 0 ? "Experienced in " + expertise.join(", ") + "." : ""} Currently at ${currentCompany}. Passionate about mentoring the next generation of African technologists.`,
    phone: generatePhoneNumber(),
    currentCompany,
    expertise,
    mentorScore,
    totalSessions,
    isVerified: true,
    origin,
    linkedIn: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
    twitter: `@${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    website: Math.random() > 0.5 ? `https://${firstName.toLowerCase()}.dev` : null,
    createdAt,
    updatedAt,
  };
}

export function createAdmin({
  firstName = "Admin",
  lastName = "User",
  email = null,
} = {}) {
  return {
    fullName: `${firstName} ${lastName}`,
    email: email || generateEmail(firstName, lastName, "admin.ethiotech.com"),
    password: hashPassword("Passw0rd!"),
    role: "admin",
    avatar: generateAvatarUrl(firstName, lastName),
    bio: "Platform administrator managing community and content.",
    phone: generatePhoneNumber(),
    isVerified: true,
    createdAt: nowMinusDays(400),
    updatedAt: daysAgo(1),
  };
}

export function createParent({
  firstName = pick(FIRST_NAMES),
  lastName = pick(LAST_NAMES),
  email = null,
} = {}) {
  return {
    fullName: `${firstName} ${lastName}`,
    email: email || generateEmail(firstName, lastName, "parent.ethiotech.com"),
    password: hashPassword("Passw0rd!"),
    role: "parent",
    avatar: generateAvatarUrl(firstName, lastName),
    bio: "Parent monitoring student progress",
    phone: generatePhoneNumber(),
    isVerified: true,
    createdAt: nowMinusDays(randomInt(30, 200)),
    updatedAt: nowMinusDays(randomInt(0, 7)),
  };
}

// ====== BADGE FACTORIES ======

export function createBadge({
  name,
  description,
  xpRequired = 0,
  xpBonus = 0,
  category = "achievement",
} = {}) {
  return {
    name,
    description,
    icon: `/badges/${name.toLowerCase().replace(/\s+/g, "-")}.png`,
    xpRequired,
    xpBonus,
    category,
  };
}

// ====== XP LOG FACTORIES ======

export function createXPLog(userId, amount, reason, sourceType, sourceId) {
  return {
    user: userId,
    amount,
    reason,
    sourceType,
    sourceId,
    createdAt: nowMinusDays(randomInt(0, 30)),
  };
}

// ====== LEVEL CONFIG ======

export function createLevelConfig(level) {
  const basePerk = Math.floor(level / 2);
  const perks = [
    `Unlock ${basePerk + 5} new lessons`,
    `Access to ${basePerk + 2} advanced projects`,
    `Mentor up to ${basePerk + 1} students`,
    `Join premium community groups`,
    `Download exclusive resources`,
  ];

  return {
    level,
    title: ["Starter", "Builder", "Creator", "Innovator", "Leader", "Architect", "Champion"][
      Math.min(level - 1, 6)
    ],
    xpRequired: Math.floor(200 * Math.pow(1.5, level - 1)),
    perks: perks.slice(0, Math.min(basePerk + 1, perks.length)),
  };
}

// ====== USER STREAK FACTORIES ======

export function createUserStreak(userId, currentStreak = 0, longestStreak = currentStreak) {
  const today = new Date();
  const lastActiveDate = currentStreak > 0 ? today.toISOString().split("T")[0] : null;

  return {
    user: userId,
    currentStreak,
    longestStreak,
    lastActiveDate,
  };
}

// ====== DAILY CHALLENGE FACTORIES ======

export function createDailyChallenge(date, index) {
  const challenges = [
    {
      title: "Complete one lesson",
      description: "Finish any lesson in your track to earn bonus XP.",
      xpReward: 25,
    },
    {
      title: "Code for 30 minutes",
      description: "Spend at least 30 minutes coding or learning.",
      xpReward: 30,
    },
    {
      title: "Help a peer",
      description: "Answer a question from another student in the community.",
      xpReward: 35,
    },
    {
      title: "Review a project",
      description: "Review and provide feedback on a peer's submission.",
      xpReward: 40,
    },
    {
      title: "Participate in discussion",
      description: "Start or join a meaningful community discussion.",
      xpReward: 20,
    },
    {
      title: "Complete a quiz",
      description: "Pass a lesson quiz with 80% or higher score.",
      xpReward: 25,
    },
    {
      title: "Join a session",
      description: "Attend a live mentor-led classroom session.",
      xpReward: 50,
    },
    {
      title: "Submit a project",
      description: "Submit your completed project for review.",
      xpReward: 100,
    },
  ];

  const challenge = challenges[index % challenges.length];

  return {
    title: challenge.title,
    description: challenge.description,
    xpReward: challenge.xpReward,
    activeDate: date,
    isActive: date <= new Date(),
  };
}

// ====== CERTIFICATE FACTORIES ======

export function createCertificate(studentId, trackId) {
  return {
    student: studentId,
    track: trackId,
    certificateUrl: `/certificates/${studentId}-${trackId}.pdf`,
  };
}

// ====== HUB FACTORIES ======

export function createHub(city, mentorId) {
  return {
    city,
    address: `Tech Hub, ${city}, Ethiopia`,
    capacity: randomInt(20, 100),
    mentorInCharge: mentorId,
    computersAvailable: randomInt(10, 50),
    isActive: true,
  };
}

// ====== MENTOR AVAILABILITY ======

export function createMentorAvailability(mentorId) {
  const days = [0, 1, 2, 3, 4, 5]; // Monday-Saturday
  const slots = [];

  for (const dayOfWeek of days) {
    if (Math.random() > 0.3) {
      // 70% availability
      const startHour = randomInt(14, 18); // Afternoon/evening (Ethiopian time)
      slots.push({
        mentor: mentorId,
        dayOfWeek,
        startMinutes: startHour * 60,
        endMinutes: (startHour + 2) * 60,
        timezone: "EAT",
        isActive: true,
      });
    }
  }

  return slots;
}

// ====== SESSION FACTORIES ======

export function createSession({
  mentorId,
  title = null,
  scheduledAt = hoursAgo(-randomInt(1, 72)), // Future sessions
  durationMinutes = randomInt(45, 120),
  status = "scheduled",
} = {}) {
  const sessionTitles = [
    "Web Development Q&A",
    "React Advanced Patterns",
    "Career Development Workshop",
    "Code Review Session",
    "Building Scalable Backend",
    "Front-end Performance Optimization",
    "Data Structures & Algorithms",
    "System Design Masterclass",
    "Open Source Contribution Guide",
    "Interview Preparation",
  ];

  return {
    title: title || pick(sessionTitles),
    mentor: mentorId,
    participants: [],
    scheduledAt,
    durationMinutes,
    classroomMode: Math.random() > 0.3 ? "immersive-3d" : "standard",
    liveProvider: "custom",
    whiteboardEnabled: true,
    codeCollabEnabled: true,
    xpPerAttendee: randomInt(50, 150),
    status,
    liveRoomId: status === "live" ? `room-${Date.now()}` : null,
    liveStartedAt: status === "live" || status === "ended" ? hoursAgo(randomInt(0, 2)) : null,
    liveEndedAt: status === "ended" ? hoursAgo(randomInt(0, 1)) : null,
  };
}

// ====== SUBMISSION FACTORIES ======

export function createSubmission({
  studentId,
  projectId,
  status = "pending",
  reviewedBy = null,
} = {}) {
  const createdAt = nowMinusDays(randomInt(1, 60));
  let updatedAt = createdAt;
  let feedback = null;

  if (status === "reviewed" || status === "approved" || status === "rejected") {
    updatedAt = nowMinusDays(randomInt(0, 7));
    const feedbackTemplates = [
      "Great work! Your solution demonstrates solid understanding of the concepts.",
      "Good effort! Consider implementing the additional features mentioned.",
      "Excellent submission. Shows mastery of advanced concepts.",
      "Needs revision. Please address the issues mentioned in the feedback.",
      "Well done! Your code is clean and efficient.",
    ];
    feedback = pick(feedbackTemplates);
  }

  return {
    student: studentId,
    project: projectId,
    githubLink: `https://github.com/${studentId}-${projectId}/project`,
    deployedUrl: Math.random() > 0.3 ? `https://project-${studentId}-${projectId}.netlify.app` : null,
    files: [`project.zip`, `README.md`, `package.json`],
    feedback,
    grade: status === "approved" ? randomInt(85, 100) : status === "rejected" ? randomInt(40, 60) : null,
    status,
    reviewedBy,
    flagged: status === "rejected" ? Math.random() > 0.8 : false,
    flagReason: status === "rejected" && Math.random() > 0.8 ? "Plagiarism suspected" : null,
    createdAt,
    updatedAt,
  };
}

// ====== PEER GROUP FACTORIES ======

export function createPeerGroup(trackId, leaderId, memberIds = []) {
  const groupNames = [
    "Web Warriors",
    "AI Innovators",
    "Cyber Guardians",
    "Mobile Mavericks",
    "Code Crusaders",
    "Tech Titans",
    "Dev Dreamers",
    "Future Founders",
    "Learning Leaders",
    "Community Champions",
  ];

  return {
    name: pick(groupNames),
    members: memberIds,
    leader: leaderId,
    track: trackId,
    groupXP: memberIds.length * randomInt(50, 500),
    isActive: true,
  };
}

// ====== CHAT MESSAGE FACTORIES ======

export function createChatMessage(roomId, userId, text = null) {
  const messages = [
    "Can someone help me understand closures?",
    "Just completed my first project! 🎉",
    "Anyone available for a study session?",
    "How do I deploy my app to production?",
    "Great session today, learned so much!",
    "Check out my new blog post about React",
    "Who wants to collaborate on a project?",
    "This debugging technique is game-changing",
    "Excited to join the mentorship program",
    "Does anyone have resources on data structures?",
  ];

  return {
    roomId,
    userId,
    text: text || pick(messages),
    messageId: `msg-${Date.now()}-${randomInt(1000, 9999)}`,
    createdAt: nowMinusDays(randomInt(0, 14)),
  };
}
