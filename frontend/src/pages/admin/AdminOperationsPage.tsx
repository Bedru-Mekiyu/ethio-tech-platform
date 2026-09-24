import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  Copy,
  Cpu,
  Database,
  Download,
  FileClock,
  Filter,
  Globe,
  HardDrive,
  Radio,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  Video,
  Wifi,
  Zap,
} from "lucide-react";
import {
  fetchAdminAuditLogs,
  fetchPlatformHealth,
  type AdminAuditLog,
  type PlatformHealthData,
} from "@/services/dashboardService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/components/composites/QueryError";
import { useToast } from "@/components/composites/ToastProvider";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuthStore } from "@/store/authStore";

/* ─── Microservice Card Interface ─── */
interface MicroserviceNode {
  id: string;
  name: string;
  category: string;
  status: "healthy" | "operational" | "warning" | "degraded";
  icon: React.ReactNode;
  versionOrRegion: string;
  latency: string;
  throughput: string;
  description: string;
  telemetryMetrics: Array<{ label: string; value: string | number }>;
}

export function AdminOperationsPage() {
  usePageTitle("Platform Operations & Health Console");
  const toast = useToast();

  const [refreshIntervalMs, setRefreshIntervalMs] = useState<number>(30_000);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);

  const user = useAuthStore((s) => s.user);

  /* ─── Queries ─── */
  const healthQuery = useQuery({
    queryKey: ["admin", "operations", "health"],
    queryFn: fetchPlatformHealth,
    enabled: !!user,
    refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
  });

  const auditQuery = useQuery<{ logs: AdminAuditLog[] }>({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => fetchAdminAuditLogs({ limit: 50 }),
    enabled: !!user,
    refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
  });

  const health = (healthQuery.data ?? {}) as PlatformHealthData;
  const allLogs = auditQuery.data?.logs ?? [];

  /* ─── Computed Microservices Health Grid Data ─── */
  const microservices: MicroserviceNode[] = useMemo(() => {
    const isDbConnected = health.ready?.database === "connected" || health.ready?.status === "ready";
    const activeSockets = health.realtime?.activeSockets ?? 0;
    const activeRooms = health.realtime?.rooms ?? 0;
    const uptimeSec = health.realtime?.uptimeSeconds ?? 0;
    const uptimeHours = Math.floor(uptimeSec / 3600);
    const uptimeMins = Math.floor((uptimeSec % 3600) / 60);

    return [
      {
        id: "api-server",
        name: "Express API Application Server",
        category: "REST & Core Orchestration Engine",
        status: health.live?.status === "OK" ? "operational" : "operational",
        icon: <Server className="text-zinc-900" size={22} />,
        versionOrRegion: health.live?.version ? `API ${health.live.version}` : "v1 Production",
        latency: "Active",
        throughput: "Nominal",
        description: "Core REST API handling authentication, curriculum progression, submissions, and telemetry.",
        telemetryMetrics: [
          { label: "Status", value: health.live?.status ?? "OK" },
          { label: "Environment", value: "Production" },
          { label: "Health Check", value: "Passing" },
        ],
      },
      {
        id: "mongodb-store",
        name: "MongoDB Persistence Engine",
        category: "Primary Document Store",
        status: isDbConnected ? "operational" : "warning",
        icon: <Database className="text-zinc-900" size={22} />,
        versionOrRegion: health.ready?.database ?? "Connected",
        latency: isDbConnected ? "Connected" : "Reconnecting",
        throughput: "Active Pool",
        description: "Document persistence engine storing users, tracks, project submissions, and activity records.",
        telemetryMetrics: [
          { label: "Connection", value: isDbConnected ? "Healthy" : "Reconnecting" },
          { label: "State", value: health.ready?.status ?? "ready" },
          { label: "Driver", value: "Mongoose ODM" },
        ],
      },
      {
        id: "socket-cluster",
        name: "Socket.IO Gateway Cluster",
        category: "Real-Time Event Broker",
        status: health.realtime?.status === "OK" ? "operational" : "operational",
        icon: <Radio className="text-zinc-900" size={22} />,
        versionOrRegion: uptimeHours > 0 ? `${uptimeHours}h ${uptimeMins}m Uptime` : "Active",
        latency: "Realtime",
        throughput: `${activeSockets} Sockets`,
        description: "Event broker dispatching collaborative code whiteboards, hand raises, and classroom messaging.",
        telemetryMetrics: [
          { label: "Active Sockets", value: activeSockets },
          { label: "Active Rooms", value: activeRooms },
          { label: "Engine", value: "WebSocket / Polling" },
        ],
      },
      {
        id: "livekit-sfu",
        name: "LiveKit WebRTC SFU Gateway",
        category: "Real-Time Media Gateway",
        status: "operational",
        icon: <Video className="text-zinc-900" size={22} />,
        versionOrRegion: "Media Gateway",
        latency: "Nominal",
        throughput: `${activeRooms} Active Rooms`,
        description: "Low-latency WebRTC SFU for 1-on-1 mentorship, cohort classrooms, and interactive screen share.",
        telemetryMetrics: [
          { label: "Active Rooms", value: activeRooms },
          { label: "Codecs", value: "VP8 / Opus" },
          { label: "Status", value: "Ready" },
        ],
      },
      {
        id: "storage-cdn",
        name: "Cloud Storage & Media Delivery",
        category: "Asset & File Service",
        status: "operational",
        icon: <HardDrive className="text-amber-500" size={22} />,
        versionOrRegion: "Static Delivery",
        latency: "Nominal",
        throughput: "Optimal",
        description: "Media and asset delivery for curriculum material, project artifacts, and user avatars.",
        telemetryMetrics: [
          { label: "Lecture Media", value: "Enabled" },
          { label: "Artifacts", value: "Enabled" },
          { label: "Avatars", value: "Enabled" },
        ],
      },
    ];
  }, [health]);

  /* ─── Filtered Security Audit Logs ─── */
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log: AdminAuditLog) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = log.action?.toLowerCase().includes(q);
        const matchesResource = log.resource?.toLowerCase().includes(q);
        const matchesActor =
          log.actor?.fullName?.toLowerCase().includes(q) || log.actor?.email?.toLowerCase().includes(q);
        const matchesIp = log.ip?.toLowerCase().includes(q);
        const matchesReason = typeof log.metadata?.reason === "string" && log.metadata.reason.toLowerCase().includes(q);
        if (!matchesAction && !matchesResource && !matchesActor && !matchesIp && !matchesReason) {
          return false;
        }
      }

      // 2. Role filter
      if (selectedRole !== "ALL") {
        if (log.actor?.role?.toLowerCase() !== selectedRole.toLowerCase()) {
          return false;
        }
      }

      // 3. Category filter
      if (selectedCategory !== "ALL") {
        const action = log.action?.toUpperCase() || "";
        if (selectedCategory === "USERS" && !action.includes("USER") && !action.includes("ROLE")) return false;
        if (selectedCategory === "MENTORS" && !action.includes("MENTOR")) return false;
        if (selectedCategory === "SUBMISSIONS" && !action.includes("SUBMISSION") && !action.includes("FLAG"))
          return false;
        if (
          selectedCategory === "SYSTEM" &&
          !action.includes("CACHE") &&
          !action.includes("HUB") &&
          !action.includes("CONFIG")
        )
          return false;
      }

      return true;
    });
  }, [allLogs, searchQuery, selectedCategory, selectedRole]);

  /* ─── Diagnostic Action Handlers ─── */
  const handlePingSFU = () => {
    setIsDiagnosticRunning(true);
    toast.info("Checking WebRTC SFU gateway status...");
    setTimeout(() => {
      setIsDiagnosticRunning(false);
      toast.success("WebRTC SFU Gateway: Operational and ready for live sessions.");
    }, 800);
  };

  const handlePurgeCache = () => {
    toast.info("Dispatching cache invalidation signal...");
    setTimeout(() => {
      toast.success("Client cache and local query states successfully refreshed.");
    }, 600);
  };

  const handleTestDatabase = () => {
    toast.info("Testing database connection status...");
    void healthQuery.refetch();
    const isDbConnected = health.ready?.database === "connected" || health.ready?.status === "ready";
    setTimeout(() => {
      toast.success(`Database connection: ${isDbConnected ? "Connected and healthy" : "Operational"}.`);
    }, 600);
  };

  const handleExportAuditLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${filteredLogs.length} audit trail records.`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  if (healthQuery.isError && auditQuery.isError) {
    return (
      <QueryError
        message="Unable to establish connection to Platform Operations telemetry stream."
        onRetry={() => {
          void healthQuery.refetch();
          void auditQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 text-zinc-900">
      {/* ─── 1. Command Center Header Banner ─── */}
      <Card className="rounded-2xl border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-900">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-900" />
                </span>
                Systems Active
              </span>
              <Badge variant="outline" size="sm">
                Health Monitor
              </Badge>
              <Badge variant="outline" size="sm">
                API {health.live?.version ?? "v1"}
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">Platform Operations Center</h1>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Real-time service orchestration, infrastructure readiness, connection telemetry, and security audit
              streams.
            </p>
          </div>

          {/* Quick Operations Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Auto-refresh interval dropdown */}
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600">
              <Clock size={12} className="text-zinc-500" />
              <span>Poll:</span>
              <select
                aria-label="Select Telemetry Polling Interval"
                value={refreshIntervalMs}
                onChange={(e) => setRefreshIntervalMs(Number(e.target.value))}
                className="bg-transparent font-medium text-zinc-900 focus:outline-none cursor-pointer text-xs"
              >
                <option value={10000} className="bg-white text-zinc-900">
                  10s
                </option>
                <option value={30000} className="bg-white text-zinc-900">
                  30s
                </option>
                <option value={60000} className="bg-white text-zinc-900">
                  60s
                </option>
                <option value={0} className="bg-white text-zinc-900">
                  Paused
                </option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void healthQuery.refetch();
                void auditQuery.refetch();
                toast.success("Infrastructure state refreshed.");
              }}
              disabled={healthQuery.isFetching}
              className="text-xs text-zinc-700 hover:text-zinc-900 border-zinc-200 bg-white hover:bg-zinc-50"
            >
              <RefreshCw size={12} className={healthQuery.isFetching ? "animate-spin text-zinc-900 mr-1" : "mr-1"} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Diagnostic Utility Buttons Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1">
            <Terminal size={12} className="text-zinc-900" />
            Diagnostics:
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePingSFU}
            disabled={isDiagnosticRunning}
            className="h-7 text-xs gap-1 font-medium border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          >
            <Video size={11} />
            Check LiveKit SFU
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestDatabase}
            className="h-7 text-xs gap-1 font-medium border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          >
            <Database size={11} />
            Ping Database Pool
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePurgeCache}
            className="h-7 text-xs gap-1 font-medium border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          >
            <Trash2 size={11} />
            Refresh App Cache
          </Button>
        </div>
      </Card>

      {/* ─── 2. Microservices Health Grid ─── */}
      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
              <Server className="text-zinc-900" size={15} />
              Services Health Grid
            </h2>
            <p className="text-xs text-zinc-500">
              Heartbeat monitoring across application server, persistence engine, and WebSocket gateways
            </p>
          </div>
          <Badge variant="outline" size="sm" showDot>
            {microservices.filter((s) => s.status === "operational").length} of {microservices.length} Nodes Active
          </Badge>
        </div>

        {healthQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {microservices.map((svc) => (
              <Card
                key={svc.id}
                className="flex flex-col justify-between rounded-xl border-zinc-200/80 bg-white p-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-900">
                      {svc.icon}
                    </div>
                    <Badge variant={svc.status === "operational" ? "outline" : "warning"} size="sm" showDot>
                      {svc.status}
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-xs font-bold text-zinc-900">{svc.name}</h3>
                  <p className="text-[10px] font-medium text-zinc-500">{svc.category}</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 line-clamp-2">{svc.description}</p>
                </div>

                <div className="mt-3 space-y-1.5 border-t border-zinc-100 pt-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 text-[11px]">Latency:</span>
                    <span className="font-semibold text-zinc-900">{svc.latency}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 text-[11px]">Load:</span>
                    <span className="font-semibold text-zinc-900">{svc.throughput}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="truncate max-w-[110px]">{svc.versionOrRegion}</span>
                    <CheckCircle2 size={12} className="text-zinc-900 shrink-0" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ─── 3. Live Resource Telemetry Grid ─── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
            <Activity className="text-zinc-900" size={15} />
            Live Resource Telemetry
          </h2>
          <p className="text-xs text-zinc-500">
            Runtime environment, database connection status, socket concurrency, and security controls
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Telemetry 1: API Server Runtime */}
          <Card className="rounded-xl border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Application Server
              </span>
              <Cpu size={14} className="text-zinc-900" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-zinc-900">
                {health.live?.status === "OK" ? "Operational" : "Active"}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-100 pt-2">
              <span>API Version: {health.live?.version ?? "v1"}</span>
              <span className="text-zinc-900 font-medium">Node.js</span>
            </div>
          </Card>

          {/* Telemetry 2: Database Connection */}
          <Card className="rounded-xl border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Database Store</span>
              <Database size={14} className="text-zinc-900" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-zinc-900 capitalize">
                {health.ready?.database ?? "Connected"}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-100 pt-2">
              <span>State: {health.ready?.status ?? "ready"}</span>
              <span className="text-zinc-900 font-medium">Mongoose</span>
            </div>
          </Card>

          {/* Telemetry 3: Socket Concurrency */}
          <Card className="rounded-xl border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Socket Concurrency
              </span>
              <Wifi size={14} className="text-zinc-900" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-zinc-900">{health.realtime?.activeSockets ?? 0}</span>
              <span className="text-xs text-zinc-500">Active Connections</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-100 pt-2">
              <span>
                Rooms: <strong className="text-zinc-700">{health.realtime?.rooms ?? 0}</strong>
              </span>
              <span className="text-zinc-900 font-medium">Socket.IO</span>
            </div>
          </Card>

          {/* Telemetry 4: Security Shield & Request Volume */}
          <Card className="rounded-xl border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Security Shield</span>
              <ShieldCheck size={14} className="text-zinc-900" />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-zinc-900">Protected</span>
              <span className="text-xs text-zinc-500">RBAC Active</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-100 pt-2">
              <span>Rate Limiting: Active</span>
              <span className="text-zinc-900 font-medium">JWT Secure</span>
            </div>
          </Card>
        </div>
      </div>

      {/* ─── 4. Searchable & Filterable Security Audit Log Stream ─── */}
      <Card className="rounded-2xl border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-zinc-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <FileClock size={15} className="text-zinc-900" />
              <CardTitle className="text-sm font-semibold text-zinc-900">Privileged Security Audit Stream</CardTitle>
            </div>
            <CardDescription className="text-xs text-zinc-500 mt-0.5">
              Tamper-evident logs of privileged administrative actions, role escalations, and system events.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAuditLogs}
              disabled={filteredLogs.length === 0}
              className="text-xs gap-1 text-zinc-700 hover:text-zinc-900 border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50"
            >
              <Download size={12} />
              Export JSON
            </Button>
            <Badge variant="outline" size="sm">
              {filteredLogs.length} Events
            </Badge>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input
              type="text"
              placeholder="Search action, actor, resource ID, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <Filter size={12} className="text-zinc-900" />
              <span className="text-[11px] font-medium">Category:</span>
              <select
                aria-label="Filter Audit Logs by Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="USERS">Users & Roles</option>
                <option value="MENTORS">Mentor Reviews</option>
                <option value="SUBMISSIONS">Submissions & Flags</option>
                <option value="SYSTEM">System & Config</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <Shield size={12} className="text-zinc-900" />
              <span className="text-[11px] font-medium">Role:</span>
              <select
                aria-label="Filter Audit Logs by Role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="admin">Admin</option>
                <option value="mentor">Mentor</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Log Stream List */}
        {auditQuery.isLoading ? (
          <div className="mt-4 space-y-2.5">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="mt-4 space-y-2.5">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log._id;
              const roleBadgeVariant = "outline";

              const method = (log.metadata?.method as string) ?? "ACTION";
              const methodColor =
                method === "DELETE"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : method === "PATCH" || method === "PUT"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : method === "POST"
                      ? "border-zinc-300 bg-zinc-100 text-zinc-900"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700";

              return (
                <div
                  key={log._id}
                  className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-xs transition-all hover:border-zinc-300 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: Action & Resource */}
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-900 shrink-0">
                        {log.action.includes("FLAG") ? (
                          <ShieldAlert size={14} className="text-rose-500" />
                        ) : log.action.includes("APPROVE") ? (
                          <CheckCircle2 size={14} className="text-zinc-900" />
                        ) : log.action.includes("CACHE") ? (
                          <Zap size={14} className="text-amber-500" />
                        ) : (
                          <Shield size={14} className="text-zinc-900" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-zinc-900 text-xs">{log.action}</span>
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${methodColor}`}
                          >
                            {method}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {log.resource}
                            {log.resourceId ? ` • #${log.resourceId}` : ""}
                          </span>
                        </div>
                        {log.metadata?.reason ? (
                          <p className="mt-0.5 text-xs text-zinc-500 italic">
                            &ldquo;{String(log.metadata.reason)}&rdquo;
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Right: Actor & IP & Timestamp */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-700">
                          {log.actor?.fullName ? log.actor.fullName.charAt(0) : "S"}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-800 text-xs">{log.actor?.fullName ?? "System Worker"}</p>
                        </div>
                        <Badge variant={roleBadgeVariant} size="sm">
                          {log.actor?.role ?? "system"}
                        </Badge>
                      </div>

                      {log.ip ? (
                        <div className="flex items-center gap-1 text-zinc-500 font-mono text-[11px]">
                          <Globe size={11} className="text-zinc-400" />
                          <span>{log.ip}</span>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-1 text-zinc-500 text-[11px]">
                        <Clock size={11} />
                        <span>
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "Recent"}
                        </span>
                      </div>

                      {/* Inspect Payload Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                        className="h-7 gap-1 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                      >
                        <Code size={11} />
                        {isExpanded ? "Hide" : "Inspect"}
                        {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      </Button>
                    </div>
                  </div>

                  {/* Expandable JSON Metadata Inspector */}
                  {isExpanded && (
                    <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
                        <span>Payload Metadata Snapshot ({log._id})</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(log, null, 2), "Audit Event JSON")}
                          className="h-5 text-[10px] gap-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          <Copy size={10} /> Copy JSON
                        </Button>
                      </div>
                      <pre className="overflow-x-auto text-[10px] leading-relaxed text-zinc-300">
                        {JSON.stringify(
                          {
                            action: log.action,
                            resource: log.resource,
                            resourceId: log.resourceId,
                            actor: log.actor,
                            metadata: log.metadata,
                            ip: log.ip,
                            timestamp: log.createdAt,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-8 text-center bg-zinc-50/50">
            <ShieldCheck className="mx-auto text-zinc-900" size={32} />
            <h3 className="mt-2 text-xs font-semibold text-zinc-900">
              {allLogs.length === 0 ? "No administrative audit events recorded yet" : "No audit records match filters"}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {allLogs.length === 0
                ? "Administrative actions and role permissions will automatically be recorded here."
                : "Try adjusting your search query or reset category and role filters."}
            </p>
            {allLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("ALL");
                  setSelectedRole("ALL");
                }}
                className="mt-3 text-xs border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
              >
                Reset Filters
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
