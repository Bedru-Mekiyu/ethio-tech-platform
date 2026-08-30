import { api, type ApiResponse } from "./api";

export type HubWorkstationType =
  | "standard_pc"
  | "gpu_workstation"
  | "collaborative_pod"
  | "silent_desk"
  | "mentor_booth";

export type HubTimeSlot = "morning" | "afternoon" | "full_day" | "evening";

export type HubPurpose =
  | "self_study"
  | "mentor_session"
  | "pair_programming"
  | "offline_assessment"
  | "hackathon";

export type HubBookingStatus = "confirmed" | "checked_in" | "cancelled" | "completed";

export interface HubMentor {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  specialties: string[];
  availableSlots?: HubTimeSlot[];
}

export interface RegionalHubProfile {
  id: string;
  city: string;
  district: string;
  region: string;
  address: string;
  capacity: number;
  workstations: number;
  availableSeats: number;
  mentorLead: string;
  mentorRole: string;
  connectionType: string;
  powerBackup: string;
  focusSpecialty: string;
  offlineServerStatus: "active" | "syncing";
  meetupSchedule: string;
  tags: string[];
  phone?: string;
  email?: string;
  operatingHours: string;
  onDutyMentors: HubMentor[];
  amenities: string[];
  coordinates: { top: string; left: string; regionLabel: string };
}

export interface HubSlotAvailability {
  slot: HubTimeSlot;
  label: string;
  timeRange: string;
  availableSeats: number;
  totalSeats: number;
  status: "available" | "limited" | "full";
}

export interface HubAvailability {
  hubId: string;
  hubCity: string;
  date: string;
  slots: HubSlotAvailability[];
  workstationsAvailable: Record<HubWorkstationType, number>;
  onDutyMentors: HubMentor[];
}

export interface BookHubSeatPayload {
  hubId: string;
  city: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  visitDate: string; // YYYY-MM-DD
  slot: HubTimeSlot;
  workstationType: HubWorkstationType;
  purpose?: HubPurpose;
  mentorId?: string;
  mentorName?: string;
  notes?: string;
}

export interface HubBooking {
  id: string;
  passCode: string; // e.g. "ETH-ADD-8392"
  qrPayload: string;
  hubId: string;
  hubCity: string;
  hubAddress: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  visitDate: string;
  slot: HubTimeSlot;
  slotLabel: string;
  slotTimeRange: string;
  workstationType: HubWorkstationType;
  workstationLabel: string;
  mentorId?: string;
  mentorName?: string;
  purpose: HubPurpose;
  notes?: string;
  status: HubBookingStatus;
  xpAwarded: number;
  checkedInAt?: string;
  createdAt: string;
}

export interface CheckInHubPayload {
  passCode?: string;
  bookingId?: string;
  hubId?: string;
}

export interface CheckInResult {
  success: boolean;
  booking: HubBooking;
  xpAwarded: number;
  message: string;
  checkedInAt: string;
}

export const WORKSTATION_CONFIG: Record<
  HubWorkstationType,
  { label: string; description: string; spec: string; iconKey: string }
> = {
  standard_pc: {
    label: "Standard Dev Station",
    description: "Equipped with dual 27\" 4K monitors, Ubuntu/Linux, VS Code, Node & Rust preinstalled.",
    spec: "Core i7 / 32GB RAM / 1TB NVMe / 1Gbps LAN",
    iconKey: "Monitor",
  },
  gpu_workstation: {
    label: "AI & ML Compute Rig",
    description: "High-throughput GPU rig for local model fine-tuning, PyTorch scripts, and computer vision pipelines.",
    spec: "NVIDIA RTX 4090 24GB / 64GB DDR5 / Local Ollama/CUDA",
    iconKey: "Cpu",
  },
  collaborative_pod: {
    label: "Pair Programming Pod",
    description: "Quad-desk pod with 65\" shared presentation display, magnetic whiteboard, and conference mic.",
    spec: "4x Workstations + 65\" 4K Screen + Team Whiteboard",
    iconKey: "Users",
  },
  silent_desk: {
    label: "Silent Focus Desk",
    description: "Acoustically shielded individual study bay with active noise isolation and ergonomic mesh chair.",
    spec: "Ergonomic Desk / ANC Headsets / USB-C Docking Station",
    iconKey: "Headphones",
  },
  mentor_booth: {
    label: "Mentor 1-on-1 Consultation Booth",
    description: "Private consultation booth for code reviews, portfolio teardowns, and career roadmap sessions.",
    spec: "Dual Shared Display + High-Definition Camera + Soundproof",
    iconKey: "UserCheck",
  },
};

export const TIME_SLOT_CONFIG: Record<
  HubTimeSlot,
  { label: string; timeRange: string; defaultCapacityFraction: number }
> = {
  morning: {
    label: "Morning Session",
    timeRange: "08:30 AM – 01:00 PM",
    defaultCapacityFraction: 0.35,
  },
  afternoon: {
    label: "Afternoon Session",
    timeRange: "01:30 PM – 06:00 PM",
    defaultCapacityFraction: 0.45,
  },
  full_day: {
    label: "Full Day All-Access",
    timeRange: "08:30 AM – 08:30 PM",
    defaultCapacityFraction: 0.2,
  },
  evening: {
    label: "Evening Code Lab",
    timeRange: "06:00 PM – 09:30 PM",
    defaultCapacityFraction: 0.25,
  },
};

export const CANONICAL_REGIONAL_HUBS: RegionalHubProfile[] = [
  {
    id: "hub-addis",
    city: "Addis Ababa",
    district: "Arat Kilo & Bole ICT Corridor",
    region: "National HQ & Innovation Center",
    address: "King George VI St, Arat Kilo Innovation Center, 4th Floor",
    capacity: 120,
    workstations: 100,
    availableSeats: 38,
    mentorLead: "Dawit Abebe",
    mentorRole: "Principal Systems Architect",
    connectionType: "Ethio Telecom 1Gbps Fiber + Starlink Satellite Failover",
    powerBackup: "15kVA Solar + Redundant Lithium Inverter Microgrid",
    focusSpecialty: "Full-Stack Web, AI/ML & Cloud Distributed Systems",
    offlineServerStatus: "active",
    meetupSchedule: "Saturdays 2:00 PM – Weekly Open Hackathon & Demo Night",
    tags: ["HQ Node", "AI Compute Lab", "1Gbps Fiber", "Solar Powered"],
    phone: "+251 11 123 4567",
    email: "addis.hub@ethiotech.org",
    operatingHours: "Mon – Sat: 08:00 AM – 09:30 PM | Sun: 10:00 AM – 06:00 PM",
    amenities: ["1Gbps Fiber", "Solar Microgrid", "Offline Edge Cache", "GPU Lab", "Café & Lounge", "Hardware Lab"],
    coordinates: { top: "52%", left: "48%", regionLabel: "Central Hub / Sheger" },
    onDutyMentors: [
      {
        id: "mentor-dawit",
        name: "Dawit Abebe",
        role: "Principal Systems Architect",
        specialties: ["Go", "Kubernetes", "Distributed Systems", "PostgreSQL"],
        availableSlots: ["morning", "afternoon", "full_day"],
      },
      {
        id: "mentor-bethelhem",
        name: "Bethelhem Tadesse",
        role: "AI & Computer Vision Fellow",
        specialties: ["PyTorch", "Python", "Local LLMs", "FastAPI"],
        availableSlots: ["afternoon", "evening"],
      },
      {
        id: "mentor-yonas",
        name: "Yonas Bekele",
        role: "Senior Full-Stack Engineer",
        specialties: ["React", "TypeScript", "Node.js", "System Design"],
        availableSlots: ["morning", "afternoon"],
      },
    ],
  },
  {
    id: "hub-hawassa",
    city: "Hawassa",
    district: "Lake Hub Tech Zone",
    region: "Sidama Region",
    address: "Tabor Sub-City, Hawassa Industrial Tech Park Building 2",
    capacity: 75,
    workstations: 60,
    availableSeats: 24,
    mentorLead: "Selamawit Girma",
    mentorRole: "Mobile & IoT Lead",
    connectionType: "High-Speed Fiber + Local Mesh Network",
    powerBackup: "10kVA Solar Hybrid Array (100% Uptime)",
    focusSpecialty: "Mobile Engineering (Flutter/React Native) & Agro-Tech IoT",
    offlineServerStatus: "active",
    meetupSchedule: "Fridays 4:00 PM – Code Jam & Peer Code Reviews",
    tags: ["Mobile Lab", "IoT Hardware", "Solar Microgrid", "Offline Sync"],
    phone: "+251 46 220 1144",
    email: "hawassa.hub@ethiotech.org",
    operatingHours: "Mon – Sat: 08:30 AM – 08:30 PM",
    amenities: ["Dedicated Fiber", "Solar Hybrid Array", "IoT Workbench", "Offline Mirror", "Quiet Pods"],
    coordinates: { top: "72%", left: "50%", regionLabel: "Sidama Region" },
    onDutyMentors: [
      {
        id: "mentor-selamawit",
        name: "Selamawit Girma",
        role: "Mobile Systems Lead",
        specialties: ["Flutter", "Dart", "Android", "Offline Architecture"],
        availableSlots: ["morning", "afternoon", "full_day"],
      },
      {
        id: "mentor-abel",
        name: "Abel Tesfaye",
        role: "Embedded IoT Specialist",
        specialties: ["ESP32", "Rust", "MQTT", "Agro-Sensors"],
        availableSlots: ["afternoon", "evening"],
      },
    ],
  },
  {
    id: "hub-bahirdar",
    city: "Bahir Dar",
    district: "Lake Tana Innovation Corridor",
    region: "Amhara Region",
    address: "Kebele 04, Bahir Dar Digital Innovation Centre",
    capacity: 70,
    workstations: 55,
    availableSeats: 19,
    mentorLead: "Yohannes Mengistu",
    mentorRole: "Full Stack & DevOps Specialist",
    connectionType: "Dedicated Regional Fiber + Local Cache Node",
    powerBackup: "8kVA Solar Battery Storage System",
    focusSpecialty: "Web Engineering, Embedded C/Rust & Data Systems",
    offlineServerStatus: "active",
    meetupSchedule: "Saturdays 10:00 AM – Open Source Contribution Sprint",
    tags: ["Full Stack", "Embedded Lab", "Local Cache", "Solar Backed"],
    phone: "+251 58 220 3388",
    email: "bahirdar.hub@ethiotech.org",
    operatingHours: "Mon – Sat: 08:30 AM – 08:30 PM",
    amenities: ["Fiber Uplink", "Solar Battery System", "Local Package Mirror", "DevOps Server", "Team Whiteboards"],
    coordinates: { top: "30%", left: "36%", regionLabel: "Amhara Region" },
    onDutyMentors: [
      {
        id: "mentor-yohannes",
        name: "Yohannes Mengistu",
        role: "DevOps & Cloud Specialist",
        specialties: ["Docker", "Linux", "CI/CD", "Go", "PostgreSQL"],
        availableSlots: ["morning", "afternoon", "full_day"],
      },
      {
        id: "mentor-hanna",
        name: "Hanna Worku",
        role: "Frontend Architect",
        specialties: ["React", "Tailwind CSS", "Next.js", "UI/UX Accessibility"],
        availableSlots: ["afternoon", "evening"],
      },
    ],
  },
  {
    id: "hub-diredawa",
    city: "Dire Dawa",
    district: "Railway Triangle Innovation Node",
    region: "Eastern Trade Corridor",
    address: "Kezira Commercial & Tech Zone, Ethio-Djibouti Corridor Hub",
    capacity: 65,
    workstations: 50,
    availableSeats: 21,
    mentorLead: "Ahmed Mustefa",
    mentorRole: "Fintech & Security Specialist",
    connectionType: "High-Capacity Metro Fiber + Dual WAN",
    powerBackup: "10kVA Solar Array + UPS Redundancy",
    focusSpecialty: "Fintech, Payment Rails, Cryptography & Trade Logistics",
    offlineServerStatus: "active",
    meetupSchedule: "Sundays 3:00 PM – Fintech & Security Masterclass",
    tags: ["Fintech Sandbox", "Dual WAN", "Solar Power", "Trade Tech"],
    phone: "+251 25 111 8899",
    email: "diredawa.hub@ethiotech.org",
    operatingHours: "Mon – Sat: 08:30 AM – 08:30 PM | Sun: 01:00 PM – 06:00 PM",
    amenities: ["Dual Fiber WAN", "Solar UPS Backup", "Telebirr Sandbox", "Security Sandbox", "Presentation Pod"],
    coordinates: { top: "42%", left: "74%", regionLabel: "Charter City / Eastern" },
    onDutyMentors: [
      {
        id: "mentor-ahmed",
        name: "Ahmed Mustefa",
        role: "Fintech & Security Specialist",
        specialties: ["Payment Rails", "API Security", "Node.js", "Cryptography"],
        availableSlots: ["morning", "afternoon", "full_day"],
      },
      {
        id: "mentor-fatima",
        name: "Fatima Zahra",
        role: "Backend Engineer",
        specialties: ["Python", "Django", "REST APIs", "Redis"],
        availableSlots: ["afternoon", "evening"],
      },
    ],
  },
  {
    id: "hub-mekelle",
    city: "Mekelle",
    district: "Northern Technology Center",
    region: "Tigray Region",
    address: "Ayder Innovation Hub, Mekelle Tech Zone",
    capacity: 80,
    workstations: 65,
    availableSeats: 27,
    mentorLead: "Meron Gebremedhin",
    mentorRole: "Systems Engineering Lead",
    connectionType: "Dedicated Fiber + Satellite Backup",
    powerBackup: "12kVA Solar Inverter Microgrid",
    focusSpecialty: "Backend Architecture, Go/Rust & Resilient Networks",
    offlineServerStatus: "active",
    meetupSchedule: "Saturdays 1:00 PM – Systems Architecture Workshop",
    tags: ["Systems Lab", "Resilient Mesh", "Solar Microgrid", "Go/Rust"],
    phone: "+251 34 440 7722",
    email: "mekelle.hub@ethiotech.org",
    operatingHours: "Mon – Sat: 08:00 AM – 08:30 PM",
    amenities: ["Satellite Failover", "12kVA Solar Microgrid", "Offline Dev Cache", "Linux Lab", "Study Cabins"],
    coordinates: { top: "16%", left: "56%", regionLabel: "Tigray Region" },
    onDutyMentors: [
      {
        id: "mentor-meron",
        name: "Meron Gebremedhin",
        role: "Systems Engineering Lead",
        specialties: ["Go", "Rust", "Distributed Databases", "Linux Kernel"],
        availableSlots: ["morning", "afternoon", "full_day"],
      },
      {
        id: "mentor-daniel",
        name: "Daniel Berhe",
        role: "Database Architect",
        specialties: ["PostgreSQL", "SQLite Sync", "Data Modeling", "Redis"],
        availableSlots: ["afternoon", "evening"],
      },
    ],
  },
  {
    id: "hub-jimma",
    city: "Jimma",
    district: "Western Agro-Tech Center",
    region: "Oromia Region",
    address: "Jimma University Tech Park, Innovation Zone Block C",
    capacity: 70,
    workstations: 55,
    availableSeats: 22,
    mentorLead: "Chala Tolosa",
    mentorRole: "Agri-Informatics & Cloud Lead",
    connectionType: "Regional Campus Fiber + Local Edge Cache Server",
    powerBackup: "8kVA Solar Hybrid Microgrid",
    focusSpecialty: "Agri-Informatics, Python/Data Science & Cloud APIs",
    offlineServerStatus: "active",
    meetupSchedule: "Thursdays 5:00 PM – Data Science & Python Roundtables",
    tags: ["Agri-Tech", "Data Science", "Offline Edge", "Solar Powered"],
    phone: "+251 47 111 4455",
    email: "jimma.hub@ethiotech.org",
    operatingHours: "Mon – Sat: 08:30 AM – 08:30 PM",
    amenities: ["Campus High-Speed Fiber", "Solar Hybrid Microgrid", "Data Science Rig", "Offline Docs Server", "Collaboration Area"],
    coordinates: { top: "62%", left: "32%", regionLabel: "Oromia Region" },
    onDutyMentors: [
      {
        id: "mentor-chala",
        name: "Chala Tolosa",
        role: "Agri-Informatics & Cloud Lead",
        specialties: ["Python", "Pandas", "FastAPI", "Geo-Spatial Data"],
        availableSlots: ["morning", "afternoon", "full_day"],
      },
      {
        id: "mentor-lensa",
        name: "Lensa Negash",
        role: "Cloud Infrastructure Specialist",
        specialties: ["AWS", "Terraform", "Serverless", "CI/CD"],
        availableSlots: ["afternoon", "evening"],
      },
    ],
  },
];

const LOCAL_STORAGE_BOOKINGS_KEY = "ethiotech_hub_bookings_v2";

function getStoredBookings(): HubBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BOOKINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredBookings(bookings: HubBooking[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
  } catch {
    // ignore quota errors
  }
}

function generatePassCode(city: string): string {
  const prefix = city.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "HUB");
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ETH-${prefix}-${randomNum}`;
}

export async function fetchHubs(params?: { city?: string; search?: string }): Promise<RegionalHubProfile[]> {
  try {
    // Attempt to fetch live data from backend
    const { data } = await api.get<ApiResponse<{ hubs: Array<{ city: string; capacity?: number; computersAvailable?: number; address?: string }> }>>("/hubs");
    const backendHubs = data?.data?.hubs ?? [];
    const backendMap = new Map(backendHubs.map((h) => [h.city.toLowerCase(), h]));

    return CANONICAL_REGIONAL_HUBS.map((profile) => {
      const backend = backendMap.get(profile.city.toLowerCase());
      if (!backend) return profile;
      return {
        ...profile,
        capacity: backend.capacity || profile.capacity,
        workstations: backend.computersAvailable || profile.workstations,
        address: backend.address || profile.address,
      };
    }).filter((hub) => {
      if (params?.city && params.city !== "all" && hub.city.toLowerCase() !== params.city.toLowerCase()) {
        return false;
      }
      if (params?.search) {
        const query = params.search.toLowerCase();
        return (
          hub.city.toLowerCase().includes(query) ||
          hub.district.toLowerCase().includes(query) ||
          hub.focusSpecialty.toLowerCase().includes(query) ||
          hub.tags.some((t) => t.toLowerCase().includes(query))
        );
      }
      return true;
    });
  } catch {
    // Seamless fallback to canonical offline directory
    return CANONICAL_REGIONAL_HUBS.filter((hub) => {
      if (params?.city && params.city !== "all" && hub.city.toLowerCase() !== params.city.toLowerCase()) {
        return false;
      }
      if (params?.search) {
        const query = params.search.toLowerCase();
        return (
          hub.city.toLowerCase().includes(query) ||
          hub.district.toLowerCase().includes(query) ||
          hub.focusSpecialty.toLowerCase().includes(query) ||
          hub.tags.some((t) => t.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }
}

export async function fetchHubAvailability(hubId: string, date: string): Promise<HubAvailability> {
  const hub = CANONICAL_REGIONAL_HUBS.find((h) => h.id === hubId) || CANONICAL_REGIONAL_HUBS[0];
  const existingBookings = getStoredBookings().filter(
    (b) => b.hubId === hub.id && b.visitDate === date && b.status !== "cancelled"
  );

  const slots: HubSlotAvailability[] = (Object.keys(TIME_SLOT_CONFIG) as HubTimeSlot[]).map((slotKey) => {
    const config = TIME_SLOT_CONFIG[slotKey];
    const totalSlotCapacity = Math.floor(hub.capacity * config.defaultCapacityFraction);
    const bookedForSlot = existingBookings.filter((b) => b.slot === slotKey || b.slot === "full_day").length;
    const availableSeats = Math.max(0, totalSlotCapacity - bookedForSlot);

    let status: "available" | "limited" | "full" = "available";
    if (availableSeats === 0) status = "full";
    else if (availableSeats < 5) status = "limited";

    return {
      slot: slotKey,
      label: config.label,
      timeRange: config.timeRange,
      availableSeats,
      totalSeats: totalSlotCapacity,
      status,
    };
  });

  const workstationsAvailable: Record<HubWorkstationType, number> = {
    standard_pc: Math.max(1, Math.floor(hub.workstations * 0.45)),
    gpu_workstation: Math.max(1, Math.floor(hub.workstations * 0.15)),
    collaborative_pod: Math.max(1, Math.floor(hub.workstations * 0.15)),
    silent_desk: Math.max(1, Math.floor(hub.workstations * 0.15)),
    mentor_booth: Math.max(1, Math.floor(hub.workstations * 0.1)),
  };

  return {
    hubId: hub.id,
    hubCity: hub.city,
    date,
    slots,
    workstationsAvailable,
    onDutyMentors: hub.onDutyMentors,
  };
}

export async function bookHubSeat(payload: BookHubSeatPayload): Promise<HubBooking> {
  const hub = CANONICAL_REGIONAL_HUBS.find((h) => h.id === payload.hubId) || CANONICAL_REGIONAL_HUBS[0];
  const passCode = generatePassCode(hub.city);
  const slotConfig = TIME_SLOT_CONFIG[payload.slot] || TIME_SLOT_CONFIG.morning;
  const wsConfig = WORKSTATION_CONFIG[payload.workstationType] || WORKSTATION_CONFIG.standard_pc;

  const newBooking: HubBooking = {
    id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    passCode,
    qrPayload: JSON.stringify({
      code: passCode,
      hub: hub.city,
      holder: payload.visitorName,
      date: payload.visitDate,
      slot: payload.slot,
      issuedAt: new Date().toISOString(),
      type: "ETHIO_TECH_HUB_PASS_V1",
    }),
    hubId: hub.id,
    hubCity: hub.city,
    hubAddress: hub.address,
    visitorName: payload.visitorName,
    visitorEmail: payload.visitorEmail,
    visitorPhone: payload.visitorPhone,
    visitDate: payload.visitDate,
    slot: payload.slot,
    slotLabel: slotConfig.label,
    slotTimeRange: slotConfig.timeRange,
    workstationType: payload.workstationType,
    workstationLabel: wsConfig.label,
    mentorId: payload.mentorId,
    mentorName: payload.mentorName,
    purpose: payload.purpose || "self_study",
    notes: payload.notes,
    status: "confirmed",
    xpAwarded: 50,
    createdAt: new Date().toISOString(),
  };

  const stored = getStoredBookings();
  const updated = [newBooking, ...stored];
  saveStoredBookings(updated);

  // Optional background sync to backend attendance/booking endpoint if online
  try {
    await api.post("/hubs/attendance", {
      hubId: hub.id,
      studentId: "anonymous",
      date: payload.visitDate,
    }).catch(() => {
      // Ignored for non-authenticated public passes
    });
  } catch {
    // Silently continue
  }

  return newBooking;
}

export async function checkInHub(payload: CheckInHubPayload): Promise<CheckInResult> {
  const bookings = getStoredBookings();
  let targetIndex = -1;

  if (payload.passCode) {
    const clean = payload.passCode.trim().toUpperCase();
    targetIndex = bookings.findIndex((b) => b.passCode.toUpperCase() === clean);
  } else if (payload.bookingId) {
    targetIndex = bookings.findIndex((b) => b.id === payload.bookingId);
  }

  const nowIso = new Date().toISOString();

  if (targetIndex >= 0) {
    const booking = bookings[targetIndex];
    const updatedBooking: HubBooking = {
      ...booking,
      status: "checked_in",
      checkedInAt: nowIso,
    };
    bookings[targetIndex] = updatedBooking;
    saveStoredBookings(bookings);

    // Attempt backend attendance sync
    try {
      await api.post("/hubs/attendance", {
        hubId: booking.hubId,
        date: booking.visitDate,
      }).catch(() => {});
    } catch {
      // Continue gracefully
    }

    return {
      success: true,
      booking: updatedBooking,
      xpAwarded: 50,
      message: `Welcome to ${booking.hubCity} Tech Hub! Check-in verified successfully.`,
      checkedInAt: nowIso,
    };
  }

  // If no booking found but passCode provided, create an on-the-spot drop-in checkin
  const hub = CANONICAL_REGIONAL_HUBS.find((h) => h.id === payload.hubId) || CANONICAL_REGIONAL_HUBS[0];
  const passCode = payload.passCode?.trim().toUpperCase() || generatePassCode(hub.city);

  const dropInBooking: HubBooking = {
    id: `book-dropin-${Date.now()}`,
    passCode,
    qrPayload: JSON.stringify({ code: passCode, hub: hub.city, type: "DROP_IN_PASS" }),
    hubId: hub.id,
    hubCity: hub.city,
    hubAddress: hub.address,
    visitorName: "Community Member",
    visitorEmail: "member@ethiotech.org",
    visitDate: new Date().toISOString().split("T")[0],
    slot: "full_day",
    slotLabel: TIME_SLOT_CONFIG.full_day.label,
    slotTimeRange: TIME_SLOT_CONFIG.full_day.timeRange,
    workstationType: "standard_pc",
    workstationLabel: WORKSTATION_CONFIG.standard_pc.label,
    purpose: "self_study",
    status: "checked_in",
    xpAwarded: 50,
    checkedInAt: nowIso,
    createdAt: nowIso,
  };

  saveStoredBookings([dropInBooking, ...bookings]);

  return {
    success: true,
    booking: dropInBooking,
    xpAwarded: 50,
    message: `Physical check-in registered for ${hub.city} Hub.`,
    checkedInAt: nowIso,
  };
}

export async function fetchMyHubBookings(): Promise<HubBooking[]> {
  return getStoredBookings();
}
