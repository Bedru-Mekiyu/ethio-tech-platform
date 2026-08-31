import { useState, useMemo, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  Award,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Globe,
  MapPin,
  Monitor,
  RefreshCw,
  Search,
  Server,
  Sparkles,
  UserCheck,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { QueryError } from "@/components/composites/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/composites/ToastProvider";
import { useAuthStore } from "@/store/authStore";
import {
  CANONICAL_REGIONAL_HUBS,
  WORKSTATION_CONFIG,
  TIME_SLOT_CONFIG,
  fetchHubs,
  fetchHubAvailability,
  bookHubSeat,
  checkInHub,
  fetchMyHubBookings,
  type RegionalHubProfile,
  type HubWorkstationType,
  type HubTimeSlot,
  type HubPurpose,
  type HubBooking,
  type BookHubSeatPayload,
} from "@/services/hubsService";

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function QrCodeIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  );
}

function TicketIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

const OFFLINE_SYNC_PILLARS = [
  {
    icon: Server,
    title: "LAN Edge Caching Nodes",
    description:
      "Every hub runs an on-premise Linux caching engine preloaded with gigabytes of offline docs, video modules, and local package registries.",
  },
  {
    icon: RefreshCw,
    title: "Automatic Delta Sync",
    description:
      "When regional fiber connectivity fluctuates, student code commits, quiz submissions, and XP queue locally and sync upstream upon uplink restoration.",
  },
  {
    icon: Zap,
    title: "Solar & Microgrid Resilience",
    description:
      "Dedicated photovoltaic arrays and lithium storage guarantee 100% uninterrupted power during municipal grid shedding.",
  },
  {
    icon: Users,
    title: "Weekly Engineering Meetups",
    description:
      "Vibrant peer spaces host weekly Saturday hackathons, mentor office hours, live project defenses, and hiring partner demos.",
  },
];

// Clean visual SVG QR Code generator
function DigitalPassQRCode({ passCode, size = 160 }: { passCode: string; size?: number }) {
  const hash = useMemo(() => {
    let h = 0;
    for (let i = 0; i < passCode.length; i++) {
      h = (Math.imul(31, h) + passCode.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }, [passCode]);

  const cells = useMemo(() => {
    const grid: boolean[][] = Array.from({ length: 15 }, () => Array(15).fill(false));
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const inTopLeft = r < 4 && c < 4;
        const inTopRight = r < 4 && c >= 11;
        const inBottomLeft = r >= 11 && c < 4;
        const isCornerFinder =
          (inTopLeft && (r === 0 || r === 3 || c === 0 || c === 3 || (r === 1 && c === 1))) ||
          (inTopRight && (r === 0 || r === 3 || c === 11 || c === 14 || (r === 1 && c === 12))) ||
          (inBottomLeft && (r === 11 || r === 14 || c === 0 || c === 3 || (r === 12 && c === 1)));

        if (isCornerFinder) {
          grid[r][c] = true;
        } else if (!inTopLeft && !inTopRight && !inBottomLeft) {
          const val = (hash * (r * 15 + c + 7)) % 100;
          grid[r][c] = val > 45;
        }
      }
    }
    return grid;
  }, [hash]);

  const cellSize = size / 15;

  return (
    <div className="relative inline-flex items-center justify-center rounded-2xl bg-white p-3 shadow-md">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shape-rendering-crispEdges select-none"
        aria-label={`QR Code for pass ${passCode}`}
      >
        <rect width={size} height={size} fill="#ffffff" />
        {cells.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize - 0.4}
                height={cellSize - 0.4}
                rx={1}
                fill="#0f172a"
              />
            ) : null,
          ),
        )}
      </svg>
      <div className="absolute flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm border border-white">
        <Sparkles size={14} className="text-white" />
      </div>
    </div>
  );
}

function HubsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 space-y-12">
      <div className="mx-auto max-w-4xl text-center space-y-4">
        <Skeleton className="mx-auto h-6 w-48 rounded-full" />
        <Skeleton className="mx-auto h-12 w-full max-w-2xl" />
        <Skeleton className="mx-auto h-6 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-[460px] rounded-3xl" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

export function HubsPage() {
  const reduceMotion = useReducedMotion();
  const toast = useToast();
  const authUser = useAuthStore((s) => s.user);

  // View & Filter States
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"directory" | "passes">("directory");

  // Booking Modal States
  const [bookingHub, setBookingHub] = useState<RegionalHubProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<HubTimeSlot>("morning");
  const [selectedWorkstation, setSelectedWorkstation] = useState<HubWorkstationType>("standard_pc");
  const [selectedPurpose, setSelectedPurpose] = useState<HubPurpose>("self_study");
  const [selectedMentorId, setSelectedMentorId] = useState<string>("");
  const [visitorName, setVisitorName] = useState<string>(authUser?.fullName || "");
  const [visitorEmail, setVisitorEmail] = useState<string>(authUser?.email || "");
  const visitorPhone = authUser?.phone || "";
  const [specialNotes, setSpecialNotes] = useState<string>("");

  // Digital Pass / Check-In Modal States
  const [viewingPass, setViewingPass] = useState<HubBooking | null>(null);
  const [checkInCodeInput, setCheckInCodeInput] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [checkInCelebration, setCheckInCelebration] = useState<boolean>(false);

  // Fetch Hubs Query
  const {
    data: hubs = CANONICAL_REGIONAL_HUBS,
    isLoading,
    isError,
    error,
    refetch: refetchHubs,
  } = useQuery({
    queryKey: ["hubs", selectedCity, searchQuery],
    queryFn: () => fetchHubs({ city: selectedCity, search: searchQuery }),
  });

  // Fetch User's Bookings Query
  const { data: myBookings = [], refetch: refetchBookings } = useQuery({
    queryKey: ["myHubBookings"],
    queryFn: fetchMyHubBookings,
  });

  // Availability Query for selected modal hub
  const { data: availability } = useQuery({
    queryKey: ["hubAvailability", bookingHub?.id, selectedDate],
    queryFn: () => (bookingHub ? fetchHubAvailability(bookingHub.id, selectedDate) : null),
    enabled: Boolean(bookingHub),
  });

  // Book Mutation
  const bookMutation = useMutation({
    mutationFn: (payload: BookHubSeatPayload) => bookHubSeat(payload),
    onSuccess: (newBooking) => {
      void refetchBookings();
      setBookingHub(null);
      setViewingPass(newBooking);
      toast.success(`Workstation pass confirmed for ${newBooking.hubCity}!`);
    },
    onError: () => {
      toast.error("Unable to complete booking. Please verify your details.");
    },
  });

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (payload: { passCode?: string; bookingId?: string; hubId?: string }) => checkInHub(payload),
    onSuccess: (result) => {
      void refetchBookings();
      setViewingPass(result.booking);
      setCheckInCelebration(true);
      toast.success(`🎉 +${result.xpAwarded} XP Awarded! Check-in verified at ${result.booking.hubCity} Hub.`);
      setTimeout(() => setCheckInCelebration(false), 5000);
    },
    onError: () => {
      toast.error("Check-in verification failed. Please check the code or contact front desk.");
    },
  });

  // Filtered Hubs
  const filteredHubs = useMemo(() => {
    return hubs.filter((hub) => {
      if (selectedCity !== "all" && hub.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        hub.city.toLowerCase().includes(q) ||
        hub.district.toLowerCase().includes(q) ||
        hub.focusSpecialty.toLowerCase().includes(q) ||
        hub.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [hubs, selectedCity, searchQuery]);

  const totalWorkstations = useMemo(() => hubs.reduce((sum, h) => sum + h.workstations, 0), [hubs]);
  const totalOpenSeats = useMemo(() => hubs.reduce((sum, h) => sum + h.availableSeats, 0), [hubs]);

  const handleBookingSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bookingHub) return;

    const mentor = bookingHub.onDutyMentors.find((m) => m.id === selectedMentorId);

    bookMutation.mutate({
      hubId: bookingHub.id,
      city: bookingHub.city,
      visitorName: visitorName.trim(),
      visitorEmail: visitorEmail.trim(),
      visitorPhone: visitorPhone.trim() || undefined,
      visitDate: selectedDate,
      slot: selectedSlot,
      workstationType: selectedWorkstation,
      purpose: selectedPurpose,
      mentorId: mentor?.id,
      mentorName: mentor?.name,
      notes: specialNotes.trim() || undefined,
    });
  };

  const handleManualCheckIn = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!checkInCodeInput.trim()) return;
    checkInMutation.mutate({ passCode: checkInCodeInput.trim() });
    setCheckInCodeInput("");
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.info("Pass code copied to clipboard");
  };

  if (isLoading) {
    return <HubsSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <QueryError
          message={error instanceof Error ? error.message : "Unable to load hubs directory."}
          onRetry={() => {
            void refetchHubs();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 space-y-16 text-[var(--text-primary)]">
      {/* ─── Hero Section ─── */}
      <motion.section
        className="mx-auto max-w-4xl text-center space-y-5"
        variants={sectionVariants}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-medium text-indigo-400">
          <Globe size={13} className="text-indigo-400" />
          <span>Regional Physical Tech Infrastructure</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
          Physical Tech Hubs <span className="text-indigo-400">Across Ethiopia</span>
        </h1>

        <p className="mx-auto max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
          Book dedicated high-spec developer workstations, consult in-person with on-duty mentors, access local offline
          caching servers, and check in physically to earn XP across 6 national innovation corridors.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button
            size="md"
            className="font-medium"
            onClick={() => {
              setActiveTab("directory");
              const el = document.getElementById("hubs-explorer");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Explore 6 Regional Hubs
            <ArrowRight size={14} className="ml-1.5" />
          </Button>

          <Button variant="outline" size="md" onClick={() => setActiveTab("passes")}>
            <TicketIcon size={14} className="mr-1.5 text-indigo-400" />
            My Active Passes ({myBookings.length})
          </Button>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
          <Card className="border-[#27272A] bg-[#0E0E11] p-3 text-center">
            <p className="text-xl font-bold text-indigo-400">6</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Regional Hubs</p>
            <p className="mt-0.5 text-xs text-zinc-400">Active national nodes</p>
          </Card>

          <Card className="border-[#27272A] bg-[#0E0E11] p-3 text-center">
            <p className="text-xl font-bold text-white">{totalWorkstations}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Workstations</p>
            <p className="mt-0.5 text-xs text-zinc-400">Dual-screen & GPU rigs</p>
          </Card>

          <Card className="border-[#27272A] bg-[#0E0E11] p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{totalOpenSeats}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Available Today</p>
            <p className="mt-0.5 text-xs text-zinc-400">Instant reservation</p>
          </Card>

          <Card className="border-[#27272A] bg-[#0E0E11] p-3 text-center">
            <p className="text-xl font-bold text-white">100% Free</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Community Access</p>
            <p className="mt-0.5 text-xs text-zinc-400">+50 XP per check-in</p>
          </Card>
        </div>
      </motion.section>

      {/* ─── Navigation Switcher: Directory vs Passes ─── */}
      <div className="flex justify-center border-b border-[#27272A] pb-4">
        <div className="inline-flex rounded-lg border border-[#27272A] bg-[#0E0E11] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === "directory" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Building2 size={14} />
            <span>Regional Hubs Explorer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("passes")}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-semibold transition ${
              activeTab === "passes" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <TicketIcon size={14} />
            <span>Digital Passes & Fast Check-In ({myBookings.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "passes" ? (
        /* ─── DIGITAL PASSES & FAST ARRIVAL CHECK-IN VIEW ─── */
        <section className="space-y-8">
          <div className="mx-auto max-w-3xl text-center space-y-2">
            <Badge variant="purple">Arrival Verification</Badge>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Digital Hub Passes & Physical Check-In</h2>
            <p className="text-xs text-zinc-400">
              Present your digital pass QR code at the hub front reception, or enter your pass code to verify attendance
              and claim your +50 XP reward.
            </p>
          </div>

          {/* Quick Code Entry Check-In Card */}
          <Card className="mx-auto max-w-xl border-[#27272A] bg-[#0E0E11] p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <QrCodeIcon size={18} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Quick Arrival Check-In</h3>
                <p className="text-xs text-zinc-400">Have a reservation or drop-in pass? Verify your presence now.</p>
              </div>
            </div>

            <form onSubmit={handleManualCheckIn} className="flex gap-2">
              <Input
                value={checkInCodeInput}
                onChange={(e) => setCheckInCodeInput(e.target.value)}
                placeholder="e.g. ETH-ADD-8392"
                className="font-mono uppercase bg-[#141418] border-[#27272A] text-white placeholder:text-zinc-500"
              />
              <Button
                type="submit"
                disabled={!checkInCodeInput.trim() || checkInMutation.isPending}
                className="shrink-0 font-medium"
              >
                {checkInMutation.isPending ? "Verifying..." : "Check In (+50 XP)"}
              </Button>
            </form>
          </Card>

          {/* Passes List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">My Reserved Passes ({myBookings.length})</h3>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-zinc-300"
                onClick={() => {
                  setActiveTab("directory");
                  setBookingHub(CANONICAL_REGIONAL_HUBS[0]);
                }}
              >
                Book Another Workstation
              </Button>
            </div>

            {myBookings.length === 0 ? (
              <Card className="border-[#27272A] bg-[#0E0E11] p-10 text-center space-y-3">
                <TicketIcon size={36} className="mx-auto text-zinc-600" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-zinc-300">No Reserved Passes Yet</h4>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    You haven't reserved any workstation passes yet. Select a regional hub from the directory to book a
                    free seat.
                  </p>
                </div>
                <Button onClick={() => setActiveTab("directory")} size="sm" className="text-xs font-medium">
                  Browse Regional Hubs
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myBookings.map((booking) => {
                  const isCheckedIn = booking.status === "checked_in";

                  return (
                    <Card
                      key={booking.id}
                      className={`flex flex-col justify-between border p-5 transition shadow-sm ${
                        isCheckedIn
                          ? "border-emerald-500/30 bg-emerald-950/10"
                          : "border-[#27272A] bg-[#0E0E11] hover:border-zinc-700"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge variant={isCheckedIn ? "success" : "purple"} size="sm">
                              {isCheckedIn ? "Checked In" : "Confirmed Pass"}
                            </Badge>
                            <h4 className="text-base font-bold text-white mt-1">{booking.hubCity} Tech Hub</h4>
                            <p className="text-xs text-zinc-400">{booking.visitDate}</p>
                          </div>
                          <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2 text-indigo-400">
                            <TicketIcon size={16} />
                          </div>
                        </div>

                        <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3 font-mono text-xs space-y-1">
                          <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                            <span>PASS CODE</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(booking.passCode)}
                              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              {copiedCode ? <Check size={11} /> : <Copy size={11} />}
                              <span>{copiedCode ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                          <p className="text-base font-bold text-indigo-300 tracking-wider">{booking.passCode}</p>
                        </div>

                        <div className="space-y-1 text-xs text-zinc-300">
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-indigo-400 shrink-0" />
                            <span>{booking.slotTimeRange}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Monitor size={13} className="text-zinc-500 shrink-0" />
                            <span>{booking.workstationLabel}</span>
                          </div>
                          {booking.mentorName && (
                            <div className="flex items-center gap-2">
                              <UserCheck size={13} className="text-emerald-400 shrink-0" />
                              <span>Mentor: {booking.mentorName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#27272A] flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => setViewingPass(booking)}
                        >
                          <QrCodeIcon size={13} className="mr-1.5 text-indigo-400" />
                          View QR Pass
                        </Button>

                        {!isCheckedIn ? (
                          <Button
                            size="sm"
                            className="flex-1 text-xs font-medium"
                            disabled={checkInMutation.isPending}
                            onClick={() => checkInMutation.mutate({ bookingId: booking.id })}
                          >
                            <CheckCircle2 size={13} className="mr-1.5" />
                            Check In
                          </Button>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-400 px-3">
                            <Check size={14} /> Verified (+50 XP)
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : (
        /* ─── DIRECTORY & INTERACTIVE REGIONAL MAP ─── */
        <>
          {/* ─── Map & Live Hub Network ─── */}
          <section id="hubs-explorer" className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <Badge variant="purple">Regional Network</Badge>
                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl mt-1">Ethiopian Innovation Corridors</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Explore real-time workstation availability, offline caching nodes, and on-duty mentor schedules.
                </p>
              </div>

              {/* City Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCity("all")}
                  className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                    selectedCity === "all"
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  All Hubs (6)
                </button>
                {CANONICAL_REGIONAL_HUBS.map((hub) => (
                  <button
                    key={hub.city}
                    type="button"
                    onClick={() => setSelectedCity(hub.city)}
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                      selectedCity.toLowerCase() === hub.city.toLowerCase()
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                        : "border-[#27272A] bg-[#0E0E11] text-zinc-400 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    {hub.city}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Surface + Interactive Hub Details Grid */}
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Map Surface */}
              <Card className="relative min-h-[440px] overflow-hidden rounded-xl border-[#27272A] bg-[#050507] p-4 shadow-lg">
                <div className="relative h-[400px] w-full rounded-lg border border-[#27272A] bg-[#09090b] overflow-hidden">
                  <div className="absolute top-3 left-3 rounded-md border border-[#27272A] bg-[#0E0E11] px-2.5 py-1 text-[10px] font-mono text-zinc-400 backdrop-blur">
                    ETHIOPIA MESH CORRIDOR · 6 NODES ONLINE
                  </div>

                  {/* Geographical Hub Markers */}
                  {CANONICAL_REGIONAL_HUBS.map((hub) => {
                    const isSelected = selectedCity.toLowerCase() === hub.city.toLowerCase();

                    return (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => setSelectedCity(hub.city)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform hover:scale-105 z-10"
                        style={{ top: hub.coordinates.top, left: hub.coordinates.left }}
                        aria-label={`Select ${hub.city} Hub`}
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase transition shadow-sm ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-[#0E0E11] text-zinc-300 border border-[#27272A] group-hover:border-indigo-400"
                            }`}
                          >
                            {hub.city}
                          </span>
                          <div className="relative mt-1">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-400"
                                  : "bg-[#0E0E11] text-indigo-400 border-indigo-500/40 group-hover:bg-indigo-600 group-hover:text-white"
                              }`}
                            >
                              <MapPin size={10} />
                            </span>
                            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Side Node Details Panel */}
              <Card className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5 space-y-4 shadow-lg">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Corridor Nodes Overview</h3>
                    <Badge variant="success" size="sm">
                      100% Operational
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Select a node to inspect workstations, on-duty mentors, and make a reservation.
                  </p>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[290px] pr-1">
                  {filteredHubs.map((hub) => {
                    const isSelected = selectedCity.toLowerCase() === hub.city.toLowerCase();

                    return (
                      <div
                        key={hub.id}
                        onClick={() => setSelectedCity(hub.city)}
                        className={`cursor-pointer rounded-lg border p-3 transition ${
                          isSelected
                            ? "border-indigo-500/50 bg-indigo-500/10"
                            : "border-[#27272A] bg-[#141418] hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white text-xs">{hub.city}</p>
                              <Badge variant="default" size="sm">
                                {hub.region}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">{hub.address}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold text-emerald-400">{hub.availableSeats} Open</p>
                            <p className="text-[10px] text-zinc-500">{hub.workstations} Desks</p>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between pt-2 border-t border-[#27272A] text-[10px] text-zinc-400">
                          <span className="flex items-center gap-1.5 text-zinc-300">
                            <Users size={11} className="text-indigo-400" />
                            Lead: {hub.mentorLead}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Server size={10} /> Edge Cache Ready
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <Button
                    className="w-full text-xs font-medium"
                    onClick={() => {
                      const target = filteredHubs[0] || CANONICAL_REGIONAL_HUBS[0];
                      setBookingHub(target);
                    }}
                  >
                    Reserve Seat at {filteredHubs[0]?.city || "Hub"}
                  </Button>
                </div>
              </Card>
            </div>
          </section>

          {/* ─── Search & 6-Hub Cards Grid ─── */}
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">All 6 Regional Innovation Hubs</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Equipped with high-performance workstations, offline local servers, and scheduled mentor office hours.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, specialty, mentor..."
                  className="pl-8 text-xs bg-[#0E0E11] border-[#27272A] text-white placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredHubs.map((hub) => (
                <Card
                  key={hub.id}
                  className="flex flex-col justify-between border-[#27272A] bg-[#0E0E11] p-5 transition-all duration-150 hover:border-zinc-700 shadow-md"
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="purple" size="sm">
                          {hub.region}
                        </Badge>
                        <h4 className="text-xl font-bold text-white mt-1">{hub.city}</h4>
                        <p className="text-xs text-indigo-400 font-medium">{hub.district}</p>
                      </div>
                      <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2 text-indigo-400">
                        <Building2 size={18} />
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      <MapPin size={12} className="inline mr-1 text-zinc-500" />
                      {hub.address}
                    </p>

                    {/* Workstation & Capacity Counters */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Workstations</p>
                        <p className="text-base font-bold text-white mt-0.5">{hub.workstations}</p>
                      </div>
                      <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                          Open Seats Today
                        </p>
                        <p className="text-base font-bold text-emerald-400 mt-0.5">{hub.availableSeats}</p>
                      </div>
                    </div>

                    {/* Technical Specs */}
                    <div className="space-y-1 text-xs text-zinc-400 pt-2 border-t border-[#27272A]">
                      <div className="flex items-center gap-2">
                        <Wifi size={12} className="text-indigo-400 shrink-0" />
                        <span className="truncate">{hub.connectionType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap size={12} className="text-amber-400 shrink-0" />
                        <span className="truncate">{hub.powerBackup}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cpu size={12} className="text-sky-400 shrink-0" />
                        <span className="truncate">{hub.focusSpecialty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays size={12} className="text-emerald-400 shrink-0" />
                        <span className="font-medium text-zinc-300">{hub.meetupSchedule}</span>
                      </div>
                    </div>

                    {/* On-Duty Mentor Highlight */}
                    <div className="rounded-lg border border-[#27272A] bg-[#141418] p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Mentor Lead</p>
                        <Badge variant="default" size="sm">
                          {hub.onDutyMentors.length} On Duty
                        </Badge>
                      </div>
                      <p className="font-semibold text-white text-xs">{hub.mentorLead}</p>
                      <p className="text-[10px] text-indigo-400">{hub.mentorRole}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        const existing = myBookings.find((b) => b.hubId === hub.id);
                        if (existing) {
                          setViewingPass(existing);
                        } else {
                          checkInMutation.mutate({ hubId: hub.id });
                        }
                      }}
                    >
                      <QrCodeIcon size={12} className="mr-1 text-indigo-400" />
                      Check In (+50 XP)
                    </Button>

                    <Button size="sm" className="text-xs font-medium" onClick={() => setBookingHub(hub)}>
                      Book a Desk
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* ─── Offline Architecture Pillars ─── */}
          <section className="space-y-8">
            <div className="mx-auto max-w-3xl text-center space-y-2">
              <Badge variant="default">Resilient Offline Design</Badge>
              <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Engineered for High-Reliability Local Operations
              </h2>
              <p className="text-xs text-zinc-400">
                EthioTech hubs eliminate bandwidth barriers so learners can build and test software continuously.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {OFFLINE_SYNC_PILLARS.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <Card key={idx} className="border-[#27272A] bg-[#0E0E11] p-5 transition hover:border-zinc-700">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Icon size={18} />
                    </div>
                    <h4 className="mt-3 font-semibold text-white text-sm">{pillar.title}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{pillar.description}</p>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ─── MODAL: Book Physical Workstation / Mentor Session ─── */}
      {bookingHub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-2xl border-[#27272A] bg-[#0E0E11] p-6 md:p-8 space-y-5 shadow-2xl my-8 text-[var(--text-primary)]">
            <div className="flex items-start justify-between border-b border-[#27272A] pb-4">
              <div>
                <Badge variant="purple" size="sm">
                  Physical Seat & Mentor Booking
                </Badge>
                <h3 className="text-xl md:text-2xl font-bold text-white mt-1">Book at {bookingHub.city} Tech Hub</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{bookingHub.address}</p>
              </div>
              <button
                type="button"
                onClick={() => setBookingHub(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
                aria-label="Close booking modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-left">
              {/* Step 1: Date & Time Slot */}
              <div className="space-y-1.5">
                <Label required>1. Select Visit Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="bg-[#141418] border-[#27272A] text-white"
                />
              </div>

              {/* Slot Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label required>2. Select Session Slot</Label>
                  <span className="text-[11px] text-zinc-500">Hub Hours: {bookingHub.operatingHours}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(TIME_SLOT_CONFIG) as HubTimeSlot[]).map((slotKey) => {
                    const cfg = TIME_SLOT_CONFIG[slotKey];
                    const slotInfo = availability?.slots.find((s) => s.slot === slotKey);
                    const isSelected = selectedSlot === slotKey;

                    return (
                      <button
                        key={slotKey}
                        type="button"
                        onClick={() => setSelectedSlot(slotKey)}
                        className={`rounded-lg border p-3 text-left transition ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500/15 text-white"
                            : "border-[#27272A] bg-[#141418] text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">{cfg.label}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {slotInfo ? `${slotInfo.availableSeats} seats open` : "Available"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                          <Clock size={11} className="text-indigo-400" />
                          {cfg.timeRange}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workstation Type Selector */}
              <div className="space-y-1.5">
                <Label required>3. Workstation Hardware Type</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(WORKSTATION_CONFIG) as HubWorkstationType[]).map((wsKey) => {
                    const ws = WORKSTATION_CONFIG[wsKey];
                    const isSelected = selectedWorkstation === wsKey;

                    return (
                      <button
                        key={wsKey}
                        type="button"
                        onClick={() => setSelectedWorkstation(wsKey)}
                        className={`rounded-lg border p-3 text-left transition ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500/15 text-white"
                            : "border-[#27272A] bg-[#141418] text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <p className="font-semibold text-xs text-white">{ws.label}</p>
                        <p className="text-[10px] text-indigo-300 font-mono mt-0.5">{ws.spec}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* On-Duty Mentor Selection (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>4. In-Person Mentor Consultation (Optional)</Label>
                  <span className="text-[11px] text-zinc-500">Available at this hub</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMentorId("")}
                    className={`rounded-lg border p-2.5 text-left transition ${
                      selectedMentorId === ""
                        ? "border-indigo-500 bg-indigo-500/15 text-white"
                        : "border-[#27272A] bg-[#141418] text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <p className="font-medium text-xs text-zinc-200">Solo Deep Work</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">No mentor session needed</p>
                  </button>

                  {bookingHub.onDutyMentors.map((mentor) => {
                    const isSelected = selectedMentorId === mentor.id;
                    return (
                      <button
                        key={mentor.id}
                        type="button"
                        onClick={() => setSelectedMentorId(mentor.id)}
                        className={`rounded-lg border p-2.5 text-left transition ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500/15 text-white"
                            : "border-[#27272A] bg-[#141418] text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <p className="font-medium text-xs text-white">{mentor.name}</p>
                        <p className="text-[10px] text-indigo-300 line-clamp-1">{mentor.role}</p>
                        <p className="text-[9px] text-zinc-400 mt-1 line-clamp-1">{mentor.specialties.join(", ")}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visitor Details */}
              <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-[#27272A]">
                <div>
                  <Label required>Full Name</Label>
                  <Input
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    required
                    placeholder="e.g. Henok Tadesse"
                    className="bg-[#141418] border-[#27272A] text-white"
                  />
                </div>
                <div>
                  <Label required>Email Address</Label>
                  <Input
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    type="email"
                    required
                    placeholder="e.g. henok@example.com"
                    className="bg-[#141418] border-[#27272A] text-white"
                  />
                </div>
              </div>

              {/* Purpose & Notes */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Primary Purpose</Label>
                  <select
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value as HubPurpose)}
                    className="h-10 w-full rounded-md border border-[#27272A] bg-[#141418] px-3 text-xs text-zinc-200"
                  >
                    <option value="self_study">Individual Self-Study & Coding</option>
                    <option value="mentor_session">Mentor Code Review / Career Q&A</option>
                    <option value="pair_programming">Pair Programming / Team Project</option>
                    <option value="offline_assessment">Offline Proctored Assessment</option>
                    <option value="hackathon">Regional Weekend Hackathon</option>
                  </select>
                </div>
                <div>
                  <Label>Special Equipment / Notes (Optional)</Label>
                  <Input
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. need dual screens, GPU setup"
                    className="bg-[#141418] border-[#27272A] text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#27272A]">
                <div className="text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-200">Includes:</span> High-speed fiber, solar microgrid, LAN
                  cache & +50 XP upon check-in.
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setBookingHub(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={bookMutation.isPending} className="font-medium px-4">
                    {bookMutation.isPending ? "Issuing Pass..." : "Confirm Free Reservation"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── MODAL: Digital Hub Pass & Arrival Check-In View ─── */}
      {viewingPass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-md border-[#27272A] bg-[#0E0E11] p-6 md:p-8 space-y-5 shadow-2xl text-center relative text-[var(--text-primary)]">
            <button
              type="button"
              onClick={() => setViewingPass(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg"
              aria-label="Close pass modal"
            >
              <X size={18} />
            </button>

            {checkInCelebration ? (
              <div className="space-y-4 py-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mx-auto border border-emerald-500/30">
                  <Award size={28} />
                </div>
                <h3 className="text-xl font-bold text-white">Check-In Complete!</h3>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                  <Sparkles size={12} />
                  +50 XP Awarded to your profile
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  Welcome to <strong className="text-white">{viewingPass.hubCity} Tech Hub</strong>. Connect to the
                  local Wi-Fi network <code className="text-indigo-300 font-mono">EthioTech-Hub-LAN</code> for offline
                  cache acceleration.
                </p>
                <Button
                  onClick={() => {
                    setCheckInCelebration(false);
                    setViewingPass(null);
                  }}
                  size="sm"
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Badge variant={viewingPass.status === "checked_in" ? "success" : "purple"} size="sm">
                    {viewingPass.status === "checked_in" ? "Verified Arrival" : "Official Digital Hub Pass"}
                  </Badge>
                  <h3 className="text-xl font-bold text-white">{viewingPass.hubCity} Tech Hub</h3>
                  <p className="text-xs text-zinc-400">{viewingPass.hubAddress}</p>
                </div>

                {/* QR Code Presentation */}
                <div className="py-1 flex justify-center">
                  <DigitalPassQRCode passCode={viewingPass.passCode} size={160} />
                </div>

                {/* Pass Code Bar */}
                <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3 flex items-center justify-between font-mono">
                  <div className="text-left">
                    <p className="text-[10px] uppercase text-zinc-500 tracking-wider">Pass Code</p>
                    <p className="text-base font-bold text-indigo-300 tracking-wider">{viewingPass.passCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleCopyCode(viewingPass.passCode)}
                  >
                    {copiedCode ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                    {copiedCode ? "Copied" : "Copy"}
                  </Button>
                </div>

                {/* Pass Summary Details */}
                <div className="rounded-lg border border-[#27272A] bg-[#141418] p-3 text-xs text-left space-y-1.5 text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Pass Holder:</span>
                    <span className="font-semibold text-white">{viewingPass.visitorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Visit Date:</span>
                    <span className="font-semibold text-white">{viewingPass.visitDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Time Slot:</span>
                    <span className="text-indigo-300 font-medium">{viewingPass.slotTimeRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Workstation:</span>
                    <span className="text-white">{viewingPass.workstationLabel}</span>
                  </div>
                  {viewingPass.mentorName && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Mentor:</span>
                      <span className="text-emerald-400">{viewingPass.mentorName}</span>
                    </div>
                  )}
                </div>

                {/* Physical Check-In Button */}
                {viewingPass.status !== "checked_in" ? (
                  <Button
                    size="lg"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                    disabled={checkInMutation.isPending}
                    onClick={() => checkInMutation.mutate({ bookingId: viewingPass.id })}
                  >
                    <CheckCircle2 size={15} className="mr-2" />
                    {checkInMutation.isPending ? "Validating Arrival..." : "Confirm Arrival Check-In (+50 XP)"}
                  </Button>
                ) : (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-2">
                    <Check size={15} />
                    <span>Checked In · Physical Pass Verified</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── Bottom Host / Partner CTA ─── */}
      <Card className="border-[#27272A] bg-[#0E0E11] p-8 md:p-10 text-center space-y-5 shadow-lg">
        <div className="mx-auto max-w-2xl space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Want to Host a Community Hub in Your City?</h2>
          <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
            Universities, tech parks, and regional innovation hubs can partner with EthioTech to deploy a plug-and-play
            LAN caching server and join the national learning network.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/contact">
            <Button size="lg" className="font-medium">
              Partner as a Hub Host
            </Button>
          </Link>
          <Link to="/mentors">
            <Button variant="outline" size="lg">
              Meet Regional Mentors
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
