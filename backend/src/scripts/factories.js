import { hashPassword, nowMinusDays } from "./utils.js";
import { ETHIOPIAN_CITIES, FIRST_NAMES, LAST_NAMES } from "./datasets.js";

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export function makeUser({ role = 'student', city, fullName, email, password = 'Passw0rd!' } = {}) {
  const first = fullName ? fullName.split(' ')[0] : pick(FIRST_NAMES);
  const last = fullName ? fullName.split(' ')[1] ?? pick(LAST_NAMES) : pick(LAST_NAMES);
  const name = fullName || `${first} ${last}`;
  const userEmail = email || `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;
  const avatar = `/avatars/${first.toLowerCase()}_${last.toLowerCase()}.png`;

  const createdAt = nowMinusDays(randomInt(5, 400));
  const lastActive = nowMinusDays(randomInt(0, 5));

  const user = {
    fullName: name,
    email: userEmail,
    password: hashPassword(password),
    role,
    avatar,
    bio: `Passionate ${role === 'mentor' ? 'mentor' : 'learner'} from ${city || pick(ETHIOPIAN_CITIES)} focused on practical projects that impact local communities.`,
    phone: `+251${randomInt(900000000, 999999999)}`,
    gradeLevel: role === 'student' ? randomInt(8, 12) : undefined,
    level: role === 'student' ? randomInt(1, 10) : undefined,
    xp: role === 'student' ? randomInt(0, 12000) : undefined,
    isVerified: role === 'mentor',
    createdAt,
    updatedAt: lastActive,
  };
  return user;
}

export function makeMentorProfile({ fullName, company, expertise = [], origin } = {}) {
  return {
    fullName,
    currentCompany: company || 'Remote Tech',
    expertise,
    bio: `Ethiopian software engineer with experience at ${company || 'international tech companies'}, mentoring students in ${expertise.join(', ')}.`,
    origin: origin || pick(ETHIOPIAN_CITIES),
    mentorScore: randomInt(50, 500),
    totalSessions: randomInt(10, 200),
  };
}
