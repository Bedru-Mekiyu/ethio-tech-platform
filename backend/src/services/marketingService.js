import Submission from "../models/Submission.js";
import Hub from "../models/Hub.js";
import HubAttendance from "../models/HubAttendance.js";
import Track from "../models/Track.js";
import User from "../models/User.js";

const toCompactCount = (value) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
};

const getMarketingMetrics = async () => {
  const [activeLearners, mentorNetwork, trackCount, submissionSummary] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "mentor" }),
    Track.countDocuments({ isActive: true }),
    Submission.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const submissionStats = submissionSummary[0] || { total: 0, approved: 0 };
  const approvalRate = submissionStats.total
    ? Math.round((submissionStats.approved / submissionStats.total) * 100)
    : 0;

  return {
    activeLearners,
    mentorNetwork,
    trackCount,
    approvalRate,
    compact: {
      activeLearners: toCompactCount(activeLearners),
      mentorNetwork: toCompactCount(mentorNetwork),
      trackCount: toCompactCount(trackCount),
    },
  };
};

export const getMarketingHomeData = async () => {
  const [metrics, featuredTracks, featuredMentors, featuredLearners] = await Promise.all([
    getMarketingMetrics(),
    Track.find({ isActive: true })
      .sort({ xpReward: -1, createdAt: 1 })
      .limit(3)
      .populate("modules", "title order")
      .select("title description category xpReward modules")
      .lean(),
    User.find({ role: "mentor" })
      .sort({ mentorScore: -1, totalSessions: -1, createdAt: 1 })
      .limit(3)
      .select("fullName avatar mentorScore totalSessions expertise currentCompany")
      .lean(),
    User.find({ role: "student" })
      .sort({ xp: -1, level: -1, createdAt: 1 })
      .limit(3)
      .select("fullName avatar xp level gradeLevel")
      .lean(),
  ]);

  return {
    stats: metrics,
    hero: {
      activeLearners: metrics.activeLearners,
      topLearnerXp: featuredLearners[0]?.xp ?? 0,
      topMentorScore: featuredMentors[0]?.mentorScore ?? 0,
      topMentorName: featuredMentors[0]?.fullName ?? "",
    },
    featuredTracks: featuredTracks.map((track) => ({
      _id: track._id,
      title: track.title,
      description: track.description,
      category: track.category,
      xpReward: track.xpReward,
      moduleCount: track.modules?.length ?? 0,
    })),
    featuredMentors: featuredMentors.map((mentor) => ({
      _id: mentor._id,
      fullName: mentor.fullName,
      avatar: mentor.avatar,
      mentorScore: mentor.mentorScore ?? 0,
      totalSessions: mentor.totalSessions ?? 0,
      expertise: mentor.expertise ?? [],
      currentCompany: mentor.currentCompany ?? "",
    })),
    featuredLearners: featuredLearners.map((learner) => ({
      _id: learner._id,
      fullName: learner.fullName,
      avatar: learner.avatar,
      xp: learner.xp ?? 0,
      level: learner.level ?? 1,
      gradeLevel: learner.gradeLevel,
    })),
    compact: {
      ...metrics.compact,
    },
  };
};

export const getMarketingAboutData = async () => {
  const metrics = await getMarketingMetrics();

  return {
    stats: metrics,
    hero: {
      eyebrow: "About EthioTech",
      title: "Empowering the Next Generation of Ethiopian Tech Leaders",
      description:
        "We are building a national learning network that blends practical engineering, mentor support, and immersive digital classrooms into one scalable ecosystem.",
      highlights: ["Real projects", "Mentor guided", "Built for mobile"],
    },
    mission: {
      title: "Our Mission",
      description:
        "Open access to practical, future-ready technology education so learners can build confidence, ship real work, and grow with support from a trusted community.",
    },
    vision: {
      title: "Our Vision",
      description:
        "A connected Ethiopia where every motivated learner can access world-class digital education, mentorship, and a clear path into the technology economy.",
    },
    bridge: {
      eyebrow: "The problem",
      title: "Bridging the Tech Education Gap",
      description:
        "Many learners still encounter theory-heavy instruction, limited mentorship, and little access to real-world projects. EthioTech closes that gap with structured pathways, live support, and hands-on practice.",
      bullets: [
        "Project-based learning that proves skill through delivery",
        "Live mentor support for feedback, guidance, and accountability",
        "Mobile-friendly experiences for low-end devices and unstable networks",
      ],
    },
    roadmap: [
      {
        year: "2022",
        title: "The Genesis",
        description: "EthioTech began as a response to the practical skills gap in digital education.",
      },
      {
        year: "2023",
        title: "Platform Launch",
        description: "The first learning tracks, mentors, and classroom workflows came online.",
      },
      {
        year: "2024",
        title: "Immersive Growth",
        description: "Gamified learning, badges, and live collaboration made progression more visible.",
      },
      {
        year: "2025",
        title: "Scaling Nationwide",
        description: "Partnerships and hub-based access extended the platform to more learners.",
      },
    ],
    cta: {
      title: "Ready to shape the future?",
      description:
        "Whether you want to learn, mentor, or help scale the ecosystem, there is a clear way to contribute.",
      primary: { to: "/register?role=student", label: "Join as a Student" },
      secondary: { to: "/register?role=mentor", label: "Become a Mentor" },
      tertiary: { to: "/how-it-works", label: "Explore the learning flow" },
    },
  };
};

const normalizeExpertise = (value = "") => value.trim().toLowerCase();

export const getMarketingMentorsData = async () => {
  const mentors = await User.find({ role: "mentor" })
    .sort({ mentorScore: -1, totalSessions: -1, createdAt: 1 })
    .select("fullName avatar bio currentCompany mentorScore totalSessions expertise isVerified")
    .lean();

  const totalSessions = mentors.reduce((sum, mentor) => sum + (mentor.totalSessions ?? 0), 0);
  const averageScore = mentors.length
    ? Math.round(mentors.reduce((sum, mentor) => sum + (mentor.mentorScore ?? 0), 0) / mentors.length)
    : 0;
  const verifiedCount = mentors.filter((mentor) => mentor.isVerified).length;

  const expertiseCounts = new Map();
  for (const mentor of mentors) {
    for (const skill of mentor.expertise ?? []) {
      const key = normalizeExpertise(skill);
      if (!key) continue;
      expertiseCounts.set(key, (expertiseCounts.get(key) || 0) + 1);
    }
  }

  const topExpertise = [...expertiseCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([label, count]) => ({
      label: label
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .replace(/\bAi\b/g, "AI")
        .replace(/\bUi\b/g, "UI")
        .replace(/\bUx\b/g, "UX"),
      count,
    }));

  const mapMentor = (mentor) => ({
    _id: mentor._id,
    fullName: mentor.fullName,
    avatar: mentor.avatar,
    bio: mentor.bio ?? "",
    currentCompany: mentor.currentCompany ?? "",
    mentorScore: mentor.mentorScore ?? 0,
    totalSessions: mentor.totalSessions ?? 0,
    expertise: mentor.expertise ?? [],
    isVerified: Boolean(mentor.isVerified),
  });

  return {
    stats: {
      totalMentors: mentors.length,
      verifiedMentors: verifiedCount,
      totalSessions,
      averageScore,
    },
    hero: {
      eyebrow: "Global mentor network",
      title: "Learn from the Best in Global Technology",
      description:
        "EthioTech connects learners with experienced mentors who blend practical engineering, career guidance, and live feedback into one supportive network.",
      highlights: ["Verified mentors", "Live sessions", "Project reviews"],
    },
    featuredMentors: mentors.slice(0, 3).map(mapMentor),
    discoverMentors: mentors.slice(3, 12).map(mapMentor),
    filters: [
      { label: "All mentors", value: "all", count: mentors.length },
      ...topExpertise.map((item) => ({ label: item.label, value: item.label.toLowerCase(), count: item.count })),
    ],
    focusAreas: topExpertise,
    cta: {
      title: "Want to mentor the next generation?",
      description:
        "Join the mentor network, run live sessions, and help learners turn curiosity into practical skill.",
      primary: { to: "/register?role=mentor", label: "Apply as a mentor" },
      secondary: { to: "/contact", label: "Talk to the team" },
    },
  };
};

export const getMarketingHubsData = async () => {
  const [hubs, attendanceSummary] = await Promise.all([
    Hub.find({ isActive: true })
      .populate("mentorInCharge", "fullName avatar mentorScore")
      .sort({ city: 1 })
      .lean(),
    HubAttendance.aggregate([
      {
        $group: {
          _id: "$hub",
          visits: { $sum: 1 },
        },
      },
    ]),
  ]);

  const visitMap = new Map(attendanceSummary.map((item) => [String(item._id), item.visits]));
  const totalSeats = hubs.reduce((sum, hub) => sum + (hub.capacity ?? 0), 0);
  const availableSeats = hubs.reduce((sum, hub) => sum + (hub.computersAvailable ?? 0), 0);

  return {
    stats: {
      hubCount: hubs.length,
      totalSeats,
      availableSeats,
      activeMentors: hubs.filter((hub) => hub.mentorInCharge).length,
    },
    hero: {
      eyebrow: "Community hubs",
      title: "Nationwide Learning Hubs",
      description:
        "Learning spaces across Ethiopia connect students to fast internet, mentor support, and practical collaboration rooms.",
      highlights: ["Map-based access", "Community support", "Open to learners"],
    },
    hubs: hubs.map((hub, index) => ({
      _id: hub._id,
      city: hub.city,
      address: hub.address ?? "Address coming soon",
      capacity: hub.capacity ?? 0,
      computersAvailable: hub.computersAvailable ?? 0,
      mentorInCharge: hub.mentorInCharge ? { fullName: hub.mentorInCharge.fullName, avatar: hub.mentorInCharge.avatar } : null,
      visits: visitMap.get(String(hub._id)) ?? 0,
      rank: index + 1,
    })),
    legend: [
      { label: "Open seats", tone: "primary" },
      { label: "Mentor supported", tone: "purple" },
      { label: "High demand", tone: "warning" },
    ],
    cta: {
      title: "Want your community to host a hub?",
      description:
        "Schools and partners can work with EthioTech to bring learning closer to the students who need it most.",
      primary: { to: "/contact", label: "Talk to the team" },
      secondary: { to: "/register", label: "Join the platform" },
    },
  };
};
