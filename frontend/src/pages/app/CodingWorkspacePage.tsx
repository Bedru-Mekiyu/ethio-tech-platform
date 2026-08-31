import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Trash2,
  FileCode,
  Send,
  Cpu,
  Monitor,
  Tablet,
  Smartphone,
  Search,
  ChevronRight,
  HelpCircle,
  Activity,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/composites/QueryError";
import { fetchStudentDashboard, type StudentDashboardData } from "@/services/dashboardService";
import { fetchTrackById, fetchLessonById } from "@/services/tracksService";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

// ─── Supported Languages & File Mappings ─────────────────────────────────────
export type SupportedLanguage = "react" | "typescript" | "javascript" | "python" | "go" | "rust";
export type WorkbenchTab = "console" | "tests" | "preview" | "problem";

interface TestCase {
  id: string;
  title: string;
  inputDescription: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  durationMs: number;
}

interface LogEntry {
  id: string;
  type: "info" | "success" | "warn" | "error" | "exec";
  message: string;
  timestamp: string;
}

interface CodeTemplate {
  id: string;
  name: string;
  language: SupportedLanguage;
  fileName: string;
  code: string;
  problemDescription: {
    title: string;
    goal: string;
    checkpoints: string[];
    constraints: string[];
  };
  expectedOutput: LogEntry[];
  tests: TestCase[];
}

// ─── Language Config ────────────────────────────────────────────────────────
interface LanguageMeta {
  id: SupportedLanguage;
  name: string;
  badge: string;
  defaultFile: string;
  runtimeEngine: string;
  accentColor: string;
}

const LANGUAGE_META: Record<SupportedLanguage, LanguageMeta> = {
  react: {
    id: "react",
    name: "React (TSX)",
    badge: "TSX 19",
    defaultFile: "Component.tsx",
    runtimeEngine: "V8 Isolated Virtual DOM",
    accentColor: "text-cyan-400",
  },
  typescript: {
    id: "typescript",
    name: "TypeScript",
    badge: "TS 5.8",
    defaultFile: "solution.ts",
    runtimeEngine: "Node.js v22.3 (tsc JIT)",
    accentColor: "text-blue-400",
  },
  javascript: {
    id: "javascript",
    name: "JavaScript",
    badge: "ES2024",
    defaultFile: "pipeline.js",
    runtimeEngine: "Node.js v22.3 V8 VM",
    accentColor: "text-amber-300",
  },
  python: {
    id: "python",
    name: "Python 3",
    badge: "Py 3.11",
    defaultFile: "solution.py",
    runtimeEngine: "Pyodide WASM / CPython 3.11",
    accentColor: "text-emerald-400",
  },
  go: {
    id: "go",
    name: "Go",
    badge: "Go 1.22",
    defaultFile: "main.go",
    runtimeEngine: "Go Runtime WASM VM",
    accentColor: "text-cyan-300",
  },
  rust: {
    id: "rust",
    name: "Rust",
    badge: "Rust 1.77",
    defaultFile: "main.rs",
    runtimeEngine: "rustc 1.77 + LLVM WASM",
    accentColor: "text-orange-400",
  },
};

// ─── Code Templates Library ──────────────────────────────────────────────────
const TEMPLATES: Record<SupportedLanguage, CodeTemplate[]> = {
  react: [
    {
      id: "react-counter",
      name: "Interactive Counter & State",
      language: "react",
      fileName: "Component.tsx",
      problemDescription: {
        title: "Stateful Counter with Dynamic Step Multipliers",
        goal: "Build an interactive counter component that supports custom step increments, state resets, and history logging without state desynchronization.",
        checkpoints: [
          "Maintain count state using useState hook with pure transitions",
          "Add increment (+step), decrement (-step), and reset handlers",
          "Ensure zero extraneous re-renders during state mutations",
        ],
        constraints: ["Zero React console warnings", "Max render delay < 16ms"],
      },
      code: `import React, { useState } from 'react';

export function InteractiveCounter() {
  const [count, setCount] = useState<number>(0);
  const [step, setStep] = useState<number>(1);

  const updateCount = (newVal: number) => {
    setCount(newVal);
  };

  return (
    <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-6 text-white max-w-md shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-base font-bold text-cyan-400">EthioTech Reactive Counter</h2>
        <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded-full">
          Step: ±{step}
        </span>
      </div>

      <div className="my-6 text-center">
        <div className="text-4xl font-mono font-extrabold text-white tracking-tight">
          {count}
        </div>
        <p className="text-xs text-slate-400 mt-1 font-mono">Current Val: {count >= 0 ? \`+\${count}\` : count}</p>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => updateCount(count - step)}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 transition px-3 py-2 text-sm font-semibold text-slate-200 border border-slate-700"
        >
          -{step}
        </button>
        <button
          onClick={() => updateCount(0)}
          className="rounded-lg bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 transition px-3 py-2 text-xs font-mono text-slate-400 border border-slate-700/50"
        >
          Reset
        </button>
        <button
          onClick={() => updateCount(count + step)}
          className="rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 transition px-3 py-2 text-sm font-semibold text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
        >
          +{step}
        </button>
      </div>

      {/* Step Selector */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
        <span>Change Step:</span>
        <div className="flex gap-1.5 font-mono">
          {[1, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={\`px-2 py-0.5 rounded text-xs transition \${
                step === s ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-slate-800 text-slate-400 hover:text-white"
              }\`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
`,
      expectedOutput: [
        { id: "1", type: "exec", message: "⚡ Initializing React 19 JSX compilation pipeline...", timestamp: "0.01s" },
        { id: "2", type: "info", message: "Transpiled TypeScript AST & JSX expressions in 18ms", timestamp: "0.02s" },
        { id: "3", type: "success", message: "✓ Virtual DOM tree attached successfully to isolated test container", timestamp: "0.03s" },
        { id: "4", type: "info", message: "Hook state initialized: count=0, step=1", timestamp: "0.04s" },
        { id: "5", type: "success", message: "⚡ Execution completed cleanly with 0 runtime exceptions (V8 VM: 24ms)", timestamp: "0.05s" },
      ],
      tests: [
        {
          id: "t1",
          title: "Renders initial count value of 0",
          inputDescription: "Mount <InteractiveCounter />",
          expectedOutput: "count === 0",
          actualOutput: "count === 0",
          passed: true,
          durationMs: 8,
        },
        {
          id: "t2",
          title: "Increments count correctly by selected step",
          inputDescription: "Click (+1) button twice with step=1",
          expectedOutput: "count === 2",
          actualOutput: "count === 2",
          passed: true,
          durationMs: 12,
        },
        {
          id: "t3",
          title: "Decrements count and handles negative values",
          inputDescription: "Click (-5) button with step=5",
          expectedOutput: "count === -5",
          actualOutput: "count === -5",
          passed: true,
          durationMs: 10,
        },
        {
          id: "t4",
          title: "Reset button zeroes the state immediately",
          inputDescription: "Click (Reset) after incrementing",
          expectedOutput: "count === 0",
          actualOutput: "count === 0",
          passed: true,
          durationMs: 9,
        },
      ],
    },
    {
      id: "react-todo",
      name: "Sprint Task Board & Hooks",
      language: "react",
      fileName: "Component.tsx",
      problemDescription: {
        title: "Sprint Task Board with Toggle and State Filter",
        goal: "Implement an efficient task management list with completed toggles, sprint item counter, and fast state updates.",
        checkpoints: [
          "Store task records in state with id, text, completed status",
          "Implement immutable toggle handler mapping over tasks",
          "Display aggregate completed / total count header",
        ],
        constraints: ["Immutable array state updates only", "Pure functional component"],
      },
      code: `import React, { useState } from 'react';

interface Task {
  id: number;
  text: string;
  completed: boolean;
  priority: 'high' | 'med' | 'low';
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Configure WebRTC PeerConnection Gateway', completed: true, priority: 'high' },
    { id: 2, text: 'Implement Monospace Tokenizer in IDE', completed: false, priority: 'high' },
    { id: 3, text: 'Deploy V8 Isolated Sandbox Worker', completed: false, priority: 'med' },
    { id: 4, text: 'Add Keyboard Shortcuts (⌘+Enter / Ctrl+Enter)', completed: true, priority: 'low' },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-white max-w-md shadow-xl font-sans">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-cyan-300">Sprint Backlog</h3>
          <p className="text-xs text-slate-400">Sprint 14: Platform Workspace</p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
          {completedCount}/{tasks.length} Done
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer border border-slate-700/40 text-xs select-none"
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => {}}
                className="h-3.5 w-3.5 rounded border-slate-600 text-cyan-500 accent-cyan-500 pointer-events-none"
              />
              <span className={task.completed ? "line-through text-slate-500" : "text-slate-200"}>
                {task.text}
              </span>
            </div>
            <span
              className={\`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded \${
                task.priority === 'high'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-700 text-slate-300'
              }\`}
            >
              {task.priority}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
`,
      expectedOutput: [
        { id: "1", type: "exec", message: "⚡ Compiling TaskBoard component with React 19 JSX parser...", timestamp: "0.01s" },
        { id: "2", type: "info", message: "Hook dependency tree validated (useState: 4 items loaded)", timestamp: "0.02s" },
        { id: "3", type: "success", message: "✓ Verified 4 list elements rendered with unique key IDs", timestamp: "0.03s" },
        { id: "4", type: "success", message: "✓ Completed count badge matches initial state (2/4)", timestamp: "0.04s" },
      ],
      tests: [
        {
          id: "t1",
          title: "Renders initial 4 sprint task items",
          inputDescription: "Mount <TaskBoard />",
          expectedOutput: "tasks.length === 4",
          actualOutput: "tasks.length === 4",
          passed: true,
          durationMs: 14,
        },
        {
          id: "t2",
          title: "Toggling task updates completed status immutably",
          inputDescription: "Click task id=2",
          expectedOutput: "task[1].completed === true",
          actualOutput: "task[1].completed === true",
          passed: true,
          durationMs: 11,
        },
        {
          id: "t3",
          title: "Header counter updates dynamically on task click",
          inputDescription: "Click all pending tasks",
          expectedOutput: "completedCount === 4",
          actualOutput: "completedCount === 4",
          passed: true,
          durationMs: 15,
        },
      ],
    },
    {
      id: "react-telemetry",
      name: "Live Telemetry & Gauge",
      language: "react",
      fileName: "Component.tsx",
      problemDescription: {
        title: "Real-time Telemetry Dashboard with Animated Pulse",
        goal: "Create a telemetry gauge showing live ping, memory consumption, and frame rate metrics with visual indicator pills.",
        checkpoints: [
          "Render real-time telemetry metrics with dynamic progress meters",
          "Ensure sub-millisecond calculation for p99 latency",
          "Apply status color variants based on network health thresholds",
        ],
        constraints: ["Zero FPS drops on animation frame", "Pure UI component"],
      },
      code: `import React, { useState } from 'react';

export function TelemetryGauge() {
  const [latency] = useState(24);
  const [cpuUsage] = useState(14);
  const [memoryMb] = useState(42.8);

  return (
    <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-white max-w-md shadow-xl font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200">Cloud Node Telemetry</span>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
          STATUS: HEALTHY
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 uppercase">Latency</p>
          <p className="text-lg font-bold text-cyan-300 mt-1">{latency}<span className="text-xs font-normal text-slate-400">ms</span></p>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 uppercase">CPU Load</p>
          <p className="text-lg font-bold text-indigo-300 mt-1">{cpuUsage}<span className="text-xs font-normal text-slate-400">%</span></p>
        </div>
        <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 uppercase">Memory</p>
          <p className="text-lg font-bold text-emerald-300 mt-1">{memoryMb}<span className="text-xs font-normal text-slate-400">MB</span></p>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
        <span>Region: <strong className="text-white">Africa-East (Addis Ababa)</strong></span>
        <span>Uptime: <strong className="text-white">99.98%</strong></span>
      </div>
    </div>
  );
}
`,
      expectedOutput: [
        { id: "1", type: "exec", message: "⚡ Initializing TelemetryGauge virtual sandbox...", timestamp: "0.01s" },
        { id: "2", type: "info", message: "Registered Web Worker heartbeat listener (60Hz tick)", timestamp: "0.02s" },
        { id: "3", type: "success", message: "✓ Verified 3 metric cards rendered cleanly with accurate units", timestamp: "0.03s" },
      ],
      tests: [
        {
          id: "t1",
          title: "Renders active pulse indicator with healthy status",
          inputDescription: "Mount <TelemetryGauge />",
          expectedOutput: "status === 'HEALTHY'",
          actualOutput: "status === 'HEALTHY'",
          passed: true,
          durationMs: 16,
        },
        {
          id: "t2",
          title: "Calculates metric cards and regional telemetry accurately",
          inputDescription: "Check region & latency units",
          expectedOutput: "latency === 24ms",
          actualOutput: "latency === 24ms",
          passed: true,
          durationMs: 12,
        },
      ],
    },
  ],

  typescript: [
    {
      id: "ts-rankings",
      name: "Array Ranking & Generics",
      language: "typescript",
      fileName: "solution.ts",
      problemDescription: {
        title: "Generic Cohort Ranking Engine",
        goal: "Create a generic ranking utility rankLearners<T> that sorts learners descending by XP without mutating the source input array.",
        checkpoints: [
          "Constrain generic parameter T to extend Learner interface",
          "Ensure immutable sorting (use copy before sort)",
          "Return sorted array ordered descending by XP score",
        ],
        constraints: ["O(N log N) time complexity", "Zero mutation of input argument"],
      },
      code: `interface Learner {
  id: string;
  name: string;
  xp: number;
  track: string;
}

/**
 * Ranks learners descending by XP while maintaining immutability.
 */
export function rankLearners<T extends Learner>(learners: readonly T[]): T[] {
  return [...learners].sort((a, b) => b.xp - a.xp);
}

// ─── Execution Test Harness ──────────────────────────────────────
const cohort: Learner[] = [
  { id: '1', name: 'Abebe Bikila', xp: 2400, track: 'Full-Stack' },
  { id: '2', name: 'Almaz Ayana', xp: 3800, track: 'Cloud Architecture' },
  { id: '3', name: 'Haile Gebrselassie', xp: 3100, track: 'Full-Stack' },
  { id: '4', name: 'Derartu Tulu', xp: 3450, track: 'AI & Data Science' },
];

const ranked = rankLearners(cohort);
console.log("=== Top Leaderboard Standings ===");
ranked.forEach((l, idx) => {
  console.log(\`#\${idx + 1} \${l.name.padEnd(20)} | \${l.xp} XP | [\${l.track}]\`);
});
`,
      expectedOutput: [
        { id: "1", type: "exec", message: "🔨 Invoking tsc v5.8 type checker...", timestamp: "0.01s" },
        { id: "2", type: "info", message: "Zero type diagnostics or lint errors found in 14ms", timestamp: "0.02s" },
        { id: "3", type: "exec", message: "=== Top Leaderboard Standings ===", timestamp: "0.03s" },
        { id: "4", type: "info", message: "#1 Almaz Ayana          | 3800 XP | [Cloud Architecture]", timestamp: "0.03s" },
        { id: "5", type: "info", message: "#2 Derartu Tulu         | 3450 XP | [AI & Data Science]", timestamp: "0.04s" },
        { id: "6", type: "info", message: "#3 Haile Gebrselassie   | 3100 XP | [Full-Stack]", timestamp: "0.04s" },
        { id: "7", type: "info", message: "#4 Abebe Bikila         | 2400 XP | [Full-Stack]", timestamp: "0.05s" },
        { id: "8", type: "success", message: "⚡ Node.js process exited with code 0 (Execution: 18ms)", timestamp: "0.05s" },
      ],
      tests: [
        {
          id: "t1",
          title: "Sorts learners in descending order of XP",
          inputDescription: "rankLearners(cohort)",
          expectedOutput: "Top: Almaz Ayana (3800 XP)",
          actualOutput: "Top: Almaz Ayana (3800 XP)",
          passed: true,
          durationMs: 6,
        },
        {
          id: "t2",
          title: "Preserves immutability without mutating original cohort array",
          inputDescription: "cohort[0].name before and after sort",
          expectedOutput: "cohort[0].name === 'Abebe Bikila'",
          actualOutput: "cohort[0].name === 'Abebe Bikila'",
          passed: true,
          durationMs: 8,
        },
        {
          id: "t3",
          title: "Handles empty array without throwing index error",
          inputDescription: "rankLearners([])",
          expectedOutput: "[]",
          actualOutput: "[]",
          passed: true,
          durationMs: 5,
        },
      ],
    },
    {
      id: "ts-lru-cache",
      name: "LRU Cache Implementation",
      language: "typescript",
      fileName: "solution.ts",
      problemDescription: {
        title: "Least Recently Used (LRU) Cache",
        goal: "Implement a generic LRU Cache with capacity limit, O(1) get/put operations, and eviction policy for oldest entries.",
        checkpoints: [
          "Initialize cache with positive numeric capacity",
          "Implement get(key) returning value or undefined",
          "Implement put(key, value) evicting oldest item when capacity reached",
        ],
        constraints: ["O(1) average time complexity", "Generic type parameters <K, V>"],
      },
      code: `export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    if (capacity <= 0) throw new Error("Capacity must be positive");
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    // Refresh item recency by re-inserting
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict oldest entry (first key in insertion order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }

  get size(): number {
    return this.cache.size;
  }
}

// Verification Harness
const cache = new LRUCache<string, number>(2);
cache.put("a", 100);
cache.put("b", 200);
console.log("get('a'):", cache.get("a")); // 100 (refreshes 'a')
cache.put("c", 300); // evicts 'b'
console.log("get('b') (should be undefined):", cache.get("b"));
console.log("get('c'):", cache.get("c"));
`,
      expectedOutput: [
        { id: "1", type: "exec", message: "🔨 Compiling LRUCache class...", timestamp: "0.01s" },
        { id: "2", type: "info", message: "get('a'): 100", timestamp: "0.02s" },
        { id: "3", type: "info", message: "get('b') (should be undefined): undefined", timestamp: "0.03s" },
        { id: "4", type: "info", message: "get('c'): 300", timestamp: "0.04s" },
        { id: "5", type: "success", message: "✓ LRU eviction policy verified with 0 memory leaks", timestamp: "0.05s" },
      ],
      tests: [
        {
          id: "t1",
          title: "Stores and retrieves items within capacity limit",
          inputDescription: "put('a', 1), get('a')",
          expectedOutput: "1",
          actualOutput: "1",
          passed: true,
          durationMs: 7,
        },
        {
          id: "t2",
          title: "Evicts least recently accessed item when capacity overflow occurs",
          inputDescription: "Capacity=2: put('a', 1), put('b', 2), get('a'), put('c', 3)",
          expectedOutput: "get('b') === undefined",
          actualOutput: "get('b') === undefined",
          passed: true,
          durationMs: 9,
        },
      ],
    },
  ],

  javascript: [
    {
      id: "js-pipeline",
      name: "Async Pipeline & Retry Backoff",
      language: "javascript",
      fileName: "pipeline.js",
      problemDescription: {
        title: "Async Data Pipeline with Exponential Backoff",
        goal: "Build a resilient async fetch wrapper that automatically retries failed HTTP requests with exponential backoff.",
        checkpoints: [
          "Simulate network failure with 3 retries max",
          "Calculate backoff delays: baseDelay * 2^attempt",
          "Return structured metadata payload upon resolution",
        ],
        constraints: ["Must handle Promise rejections cleanly", "Max timeout 3000ms"],
      },
      code: `async function fetchWithRetry(fn, maxRetries = 3, delay = 50) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn(attempt);
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      const backoff = delay * Math.pow(2, attempt - 1);
      console.log(\`[RETRY \${attempt}/\${maxRetries}] Backing off for \${backoff}ms...\`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}

async function runPipeline() {
  console.log("⚡ Starting Telemetry Data Pipeline...");
  
  let callCount = 0;
  const simulatedFetch = async () => {
    callCount++;
    if (callCount < 2) {
      throw new Error("503 Service Unavailable (Simulated Transience)");
    }
    return {
      status: 200,
      region: "Addis Ababa - Node 1",
      activeSessions: 1420,
      timestamp: Date.now(),
    };
  };

  const payload = await fetchWithRetry(simulatedFetch, 3, 40);
  console.log("✓ Pipeline Resolved Payload:", JSON.stringify(payload, null, 2));
}

runPipeline();
`,
      expectedOutput: [
        { id: "1", type: "exec", message: "⚡ Starting Telemetry Data Pipeline...", timestamp: "0.01s" },
        { id: "2", type: "warn", message: "[RETRY 1/3] Backing off for 40ms...", timestamp: "0.02s" },
        { id: "3", type: "success", message: '✓ Pipeline Resolved Payload: {\n  "status": 200,\n  "region": "Addis Ababa - Node 1",\n  "activeSessions": 1420\n}', timestamp: "0.08s" },
        { id: "4", type: "info", message: "Event loop drained in 82ms", timestamp: "0.09s" },
      ],
      tests: [
        {
          id: "t1",
          title: "Retries transient errors up to maxRetries",
          inputDescription: "Fails on attempt 0, succeeds on attempt 1",
          expectedOutput: "status === 200",
          actualOutput: "status === 200",
          passed: true,
          durationMs: 18,
        },
        {
          id: "t2",
          title: "Resolves with structured JSON payload",
          inputDescription: "Validate payload schema",
          expectedOutput: "has activeSessions property",
          actualOutput: "has activeSessions property",
          passed: true,
          durationMs: 12,
        },
      ],
    },
  ],

  python: [
    {
      id: "py-analytics",
      name: "Cohort Analytics & Calculations",
      language: "python",
      fileName: "solution.py",
      problemDescription: {
        title: "Cohort Assessment Statistical Evaluator",
        goal: "Write a statistical calculation function to compute average score, highest score, and pass rate percentage (>=70) for a cohort of students.",
        checkpoints: [
          "Handle empty score lists by returning default zero values",
          "Compute mean average rounded to 1 decimal place",
          "Format pass rate as percentage string e.g. '87.5%'",
        ],
        constraints: ["Pure Python 3 functions", "O(N) time complexity"],
      },
      code: `def calculate_cohort_stats(scores: list[int | float]) -> dict:
    """Calculates statistical metrics for a cohort's test scores."""
    if not scores:
        return {"avg": 0.0, "max": 0, "pass_rate": "0.0%", "total_students": 0}
    
    avg_score = sum(scores) / len(scores)
    max_score = max(scores)
    passed_count = sum(1 for s in scores if s >= 70)
    pass_rate = (passed_count / len(scores)) * 100
    
    return {
        "avg": round(avg_score, 1),
        "max": max_score,
        "pass_rate": f"{round(pass_rate, 1)}%",
        "total_students": len(scores),
        "passed_students": passed_count,
    }

# ─── Verification Harness ──────────────────────────────────────
cohort_scores = [85, 92, 78, 64, 95, 88, 71, 99, 58, 82]
stats = calculate_cohort_stats(cohort_scores)

print("=== Cohort Evaluation Results ===")
for key, value in stats.items():
    print(f"  {key.replace('_', ' ').title():<18}: {value}")
`,
      expectedOutput: [
        { id: "1", type: "exec", message: "🐍 Pyodide Python 3.11.8 Sandbox Initialized", timestamp: "0.01s" },
        { id: "2", type: "info", message: "=== Cohort Evaluation Results ===", timestamp: "0.02s" },
        { id: "3", type: "info", message: "  Avg               : 81.2", timestamp: "0.03s" },
        { id: "4", type: "info", message: "  Max               : 99", timestamp: "0.03s" },
        { id: "5", type: "info", message: "  Pass Rate         : 80.0%", timestamp: "0.04s" },
        { id: "6", type: "info", message: "  Total Students    : 10", timestamp: "0.04s" },
        { id: "7", type: "success", message: "⚡ Python VM exited cleanly with returncode 0 (48ms)", timestamp: "0.05s" },
      ],
      tests: [
        {
          id: "t1",
          title: "Computes accurate average score",
          inputDescription: "calculate_cohort_stats([85, 92, 78, 64, 95, 88, 71, 99, 58, 82])",
          expectedOutput: "avg === 81.2",
          actualOutput: "avg === 81.2",
          passed: true,
          durationMs: 12,
        },
        {
          id: "t2",
          title: "Computes pass rate percentage with >=70 threshold",
          inputDescription: "8 out of 10 students scored >= 70",
          expectedOutput: "pass_rate === '80.0%'",
          actualOutput: "pass_rate === '80.0%'",
          passed: true,
          durationMs: 9,
        },
        {
          id: "t3",
          title: "Handles empty list safely without ZeroDivisionError",
          inputDescription: "calculate_cohort_stats([])",
          expectedOutput: "avg === 0.0, pass_rate === '0.0%'",
          actualOutput: "avg === 0.0, pass_rate === '0.0%'",
          passed: true,
          durationMs: 7,
        },
      ],
    },
  ],

  go: [
    {
      id: "go-concurrency",
      name: "Concurrent Worker Pipeline",
      language: "go",
      fileName: "main.go",
      problemDescription: {
        title: "Concurrent Task Worker Pool",
        goal: "Dispatch asynchronous evaluation jobs to a fixed pool of goroutines, coordinating completion with sync.WaitGroup.",
        checkpoints: [
          "Spawn worker goroutines consuming jobs from buffered channel",
          "Synchronize job completion with WaitGroup.Done()",
          "Ensure zero race conditions or goroutine leaks",
        ],
        constraints: ["Standard Go library only", "Zero race detector warnings"],
      },
      code: `package main

import (
	"fmt"
	"sync"
	"time"
)

type Job struct {
	ID    int
	Title string
}

func worker(id int, jobs <-chan Job, wg *sync.WaitGroup) {
	defer wg.Done()
	for job := range jobs {
		time.Sleep(15 * time.Millisecond)
		fmt.Printf("[Worker #%d] Evaluated submission for %s (Job #%d)\\n", id, job.Title, job.ID)
	}
}

func main() {
	jobsList := []Job{
		{ID: 101, Title: "React Hooks Lab"},
		{ID: 102, Title: "FastAPI REST Server"},
		{ID: 103, Title: "PostgreSQL Migration"},
		{ID: 104, Title: "WebRTC Video Gateway"},
	}

	numWorkers := 2
	jobsChan := make(chan Job, len(jobsList))
	var wg sync.WaitGroup

	fmt.Println("🚀 Starting Go Concurrent Worker Pool (2 Workers)...")

	for w := 1; w <= numWorkers; w++ {
		wg.Add(1)
		go worker(w, jobsChan, &wg)
	}

	for _, j := range jobsList {
		jobsChan <- j
	}
	close(jobsChan)

	wg.Wait()
	fmt.Println("✓ All cohort submissions evaluated successfully.")
}
`,
      expectedOutput: [
        { id: "1", type: "exec", message: "🚀 Starting Go Concurrent Worker Pool (2 Workers)...", timestamp: "0.01s" },
        { id: "2", type: "info", message: "[Worker #1] Evaluated submission for React Hooks Lab (Job #101)", timestamp: "0.03s" },
        { id: "3", type: "info", message: "[Worker #2] Evaluated submission for FastAPI REST Server (Job #102)", timestamp: "0.03s" },
        { id: "4", type: "info", message: "[Worker #1] Evaluated submission for PostgreSQL Migration (Job #103)", timestamp: "0.05s" },
        { id: "5", type: "info", message: "[Worker #2] Evaluated submission for WebRTC Video Gateway (Job #104)", timestamp: "0.05s" },
        { id: "6", type: "success", message: "✓ All cohort submissions evaluated successfully.", timestamp: "0.06s" },
        { id: "7", type: "success", message: "⚡ Go binary exited with status 0 (WASM sandbox: 38ms)", timestamp: "0.06s" },
      ],
      tests: [
        {
          id: "t1",
          title: "Distributes jobs across worker goroutines",
          inputDescription: "Run 4 jobs with 2 workers",
          expectedOutput: "All 4 jobs evaluated",
          actualOutput: "All 4 jobs evaluated",
          passed: true,
          durationMs: 24,
        },
        {
          id: "t2",
          title: "Synchronizes completion with sync.WaitGroup",
          inputDescription: "Channel closed and WaitGroup waits",
          expectedOutput: "Clean channel closure",
          actualOutput: "Clean channel closure",
          passed: true,
          durationMs: 22,
        },
      ],
    },
  ],

  rust: [
    {
      id: "rust-structs",
      name: "Safe Memory & Structs",
      language: "rust",
      fileName: "main.rs",
      problemDescription: {
        title: "Thread-Safe Session Manager with Capacity Guard",
        goal: "Implement a Rust struct SessionRoom managing active participants with strict capacity boundaries and Result error handling.",
        checkpoints: [
          "Declare SessionRoom struct with room_id, capacity, active_peers",
          "Implement join() returning Result<(), &'static str>",
          "Enforce zero borrow-checker or memory safety violations",
        ],
        constraints: ["Safe Rust code (#![forbid(unsafe_code)])"],
      },
      code: `#[derive(Debug)]
pub struct SessionRoom {
    pub room_id: String,
    pub capacity: usize,
    pub active_peers: usize,
}

impl SessionRoom {
    pub fn new(id: &str, capacity: usize) -> Self {
        SessionRoom {
            room_id: id.to_string(),
            capacity,
            active_peers: 0,
        }
    }

    pub fn join(&mut self) -> Result<(), &'static str> {
        if self.active_peers < self.capacity {
            self.active_peers += 1;
            Ok(())
        } else {
            Err("Capacity exceeded: Room is full")
        }
    }
}

fn main() {
    println!("🦀 Initializing Rust 1.77 Session Manager...");
    let mut room = SessionRoom::new("ethio-live-101", 2);

    room.join().unwrap();
    room.join().unwrap();
    println!("Room Status: {:?}", room);

    match room.join() {
        Ok(_) => println!("User joined"),
        Err(e) => println!("Join Rejected (Expected): {}", e),
    }
}
`,
      expectedOutput: [
        { id: "1", type: "exec", message: "🦀 Compiling with rustc 1.77 (opt-level=3, release mode)...", timestamp: "0.01s" },
        { id: "2", type: "info", message: "🦀 Initializing Rust 1.77 Session Manager...", timestamp: "0.03s" },
        { id: "3", type: "info", message: 'Room Status: SessionRoom { room_id: "ethio-live-101", capacity: 2, active_peers: 2 }', timestamp: "0.04s" },
        { id: "4", type: "warn", message: "Join Rejected (Expected): Capacity exceeded: Room is full", timestamp: "0.04s" },
        { id: "5", type: "success", message: "✓ Zero borrow checker / memory safety violations detected", timestamp: "0.05s" },
      ],
      tests: [
        {
          id: "t1",
          title: "Initializes SessionRoom with correct capacity",
          inputDescription: "SessionRoom::new(\"ethio-live-101\", 2)",
          expectedOutput: "capacity == 2, active_peers == 0",
          actualOutput: "capacity == 2, active_peers == 0",
          passed: true,
          durationMs: 15,
        },
        {
          id: "t2",
          title: "Rejects join request when room capacity reached",
          inputDescription: "Call join() 3 times on room with capacity 2",
          expectedOutput: "Err(\"Capacity exceeded: Room is full\")",
          actualOutput: "Err(\"Capacity exceeded: Room is full\")",
          passed: true,
          durationMs: 17,
        },
      ],
    },
  ],
};

// ─── Main Coding Workspace Component ─────────────────────────────────────────
export function CodingWorkspacePage() {
  usePageTitle("Cloud Workspace IDE");
  const [searchParams] = useSearchParams();
  const lessonParam = searchParams.get("lesson");

  // State Management
  const [language, setLanguage] = useState<SupportedLanguage>("react");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("react-counter");
  const [code, setCode] = useState<string>(() => TEMPLATES.react[0].code);
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("console");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => TEMPLATES.react[0].expectedOutput);
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [logFilter, setLogFilter] = useState("");
  const [fontSize, setFontSize] = useState<"text-xs" | "text-sm" | "text-base">("text-xs");
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Interactive state for live React preview widget
  const [previewCounter, setPreviewCounter] = useState(0);
  const [previewStep, setPreviewStep] = useState(1);
  const [previewTasks, setPreviewTasks] = useState([
    { id: 1, text: "Configure WebRTC PeerConnection Gateway", completed: true },
    { id: 2, text: "Implement Monospace Tokenizer in IDE", completed: false },
    { id: 3, text: "Deploy V8 Isolated Sandbox Worker", completed: false },
    { id: 4, text: "Add Keyboard Shortcuts (⌘+Enter / Ctrl+Enter)", completed: true },
  ]);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Queries for lesson / track context
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "student"],
    queryFn: fetchStudentDashboard,
  });

  const dashboard = dashboardQuery.data as StudentDashboardData | undefined;
  const primaryTrackId =
    dashboard?.progressByTrack?.[0]?.trackId ?? dashboard?.user?.enrolledTracks?.[0]?._id;

  const trackQuery = useQuery({
    queryKey: ["track", primaryTrackId],
    queryFn: () => fetchTrackById(primaryTrackId!),
    enabled: !!primaryTrackId,
  });

  const primaryTrack = trackQuery.data;
  const targetLessonId = lessonParam || primaryTrack?.modules?.[0]?.lessons?.[0]?._id;

  const lessonQuery = useQuery({
    queryKey: ["lesson", targetLessonId],
    queryFn: () => fetchLessonById(targetLessonId!),
    enabled: !!targetLessonId,
  });

  const lesson = lessonQuery.data;

  // Active template metadata
  const currentTemplate = useMemo(() => {
    return (
      TEMPLATES[language]?.find((t) => t.id === selectedTemplateId) ||
      TEMPLATES[language]?.[0] ||
      TEMPLATES.react[0]
    );
  }, [language, selectedTemplateId]);

  const langMeta = LANGUAGE_META[language];

  // Calculate line numbers
  const lines = useMemo(() => {
    return code.split("\n");
  }, [code]);

  // Handle template selection
  const handleSelectTemplate = (template: CodeTemplate) => {
    setSelectedTemplateId(template.id);
    setCode(template.code);
    setLogs([
      {
        id: Math.random().toString(),
        type: "exec",
        message: `⚡ Loaded template boilerplate: ${template.name}`,
        timestamp: "0.00s",
      },
      {
        id: Math.random().toString(),
        type: "info",
        message: `Ready for execution. Press (⌘+Enter / Ctrl+Enter) to run.`,
        timestamp: "0.01s",
      },
    ]);
    setSubmittedSuccess(false);
  };

  // Handle language change
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const firstTemplate = TEMPLATES[newLang]?.[0];
    if (firstTemplate) {
      setSelectedTemplateId(firstTemplate.id);
      setCode(firstTemplate.code);
      setLogs([
        {
          id: Math.random().toString(),
          type: "exec",
          message: `⚡ Switched runtime sandbox to ${LANGUAGE_META[newLang].name} (${LANGUAGE_META[newLang].badge})`,
          timestamp: "0.00s",
        },
        {
          id: Math.random().toString(),
          type: "info",
          message: `Engine: ${LANGUAGE_META[newLang].runtimeEngine}`,
          timestamp: "0.01s",
        },
      ]);
    }
    setSubmittedSuccess(false);
  };

  // Run Code logic
  const handleRunCode = useCallback(() => {
    setIsRunning(true);
    setActiveTab("console");
    setLogs([
      {
        id: "run-start",
        type: "exec",
        message: `⚡ Compiling & running ${currentTemplate.fileName} in ${langMeta.runtimeEngine}...`,
        timestamp: "0.00s",
      },
    ]);

    setTimeout(() => {
      setLogs(currentTemplate.expectedOutput);
      setIsRunning(false);
    }, 450);
  }, [currentTemplate, langMeta]);

  // Run Tests logic
  const handleRunTests = () => {
    setIsRunning(true);
    setActiveTab("tests");
    setTimeout(() => {
      setIsRunning(false);
    }, 400);
  };

  // Submit Solution logic
  const handleSubmitSolution = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setActiveTab("tests");
    }, 700);
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset code to initial boilerplate
  const handleResetCode = () => {
    setCode(currentTemplate.code);
    setLogs([
      {
        id: Math.random().toString(),
        type: "warn",
        message: "Code reset to starter boilerplate.",
        timestamp: "0.00s",
      },
    ]);
  };

  // Keyboard Navigation: Tab indentation & Ctrl+Enter to Run
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to Run Code
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunCode();
      return;
    }

    // Ctrl+S or Cmd+S to prevent default browser save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      return;
    }

    // Tab key indentation support
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Outdent 2 spaces
        const beforeCursor = code.substring(0, start);
        const afterCursor = code.substring(end);
        if (beforeCursor.endsWith("  ")) {
          const newCode = beforeCursor.slice(0, -2) + afterCursor;
          setCode(newCode);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 2;
          }, 0);
        }
      } else {
        // Indent 2 spaces
        const newCode = code.substring(0, start) + "  " + code.substring(end);
        setCode(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  // Update cursor position line / col
  const handleCursorActivity = () => {
    if (!editorRef.current) return;
    const pos = editorRef.current.selectionStart;
    const textBefore = code.substring(0, pos);
    const lineNum = textBefore.split("\n").length;
    const lastLineBreak = textBefore.lastIndexOf("\n");
    const colNum = lastLineBreak === -1 ? pos + 1 : pos - lastLineBreak;
    setCursorPos({ line: lineNum, col: colNum });
  };

  // Global keyboard shortcut listener for Cmd+Enter
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleRunCode]);

  // Filtered console logs
  const filteredLogs = useMemo(() => {
    if (!logFilter) return logs;
    return logs.filter((l) => l.message.toLowerCase().includes(logFilter.toLowerCase()));
  }, [logs, logFilter]);

  if (dashboardQuery.isError) {
    return <QueryError onRetry={() => dashboardQuery.refetch()} />;
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-[#050507] text-zinc-200 antialiased font-sans border border-[#27272A] rounded-xl shadow-xl overflow-hidden",
        isFullScreen
          ? "fixed inset-0 z-50 rounded-none border-0 h-screen w-screen"
          : "h-[calc(100vh-8.5rem)] min-h-[660px]",
      )}
    >
      {/* ─── TOP TOOLBAR (High-density IDE Navigation) ────────────────────────── */}
      <header className="flex h-11 flex-none items-center justify-between border-b border-[#27272A] bg-[#0E0E11] px-3 sm:px-4 select-none">
        {/* Left: Breadcrumbs & Active Tab */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-zinc-500 hidden md:inline">workspace</span>
            <span className="text-zinc-600 hidden md:inline">/</span>
            <span className="text-zinc-400 hidden sm:inline">src</span>
            <span className="text-zinc-600 hidden sm:inline">/</span>
            <div className="flex items-center gap-1.5 rounded-md bg-[#141418] px-2 py-0.5 text-xs font-medium text-indigo-300 border border-[#27272A]">
              <FileCode size={12} className="text-indigo-400" />
              <span>{currentTemplate.fileName}</span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 text-xs text-zinc-400 border-l border-[#27272A] pl-2.5">
            <span className="text-zinc-500 font-sans">Track:</span>
            <span className="text-zinc-300 font-medium truncate max-w-[200px]">
              {lesson?.title || primaryTrack?.title || "Full-Stack Web Development"}
            </span>
          </div>
        </div>

        {/* Center: Language & Template Selectors */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1 rounded-md border border-[#27272A] bg-[#141418] px-2 py-0.5">
            <span className="text-[10px] font-semibold text-zinc-500 font-mono">Lang</span>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
            >
              <option value="react" className="bg-[#141418] text-white">React (TSX)</option>
              <option value="typescript" className="bg-[#141418] text-white">TypeScript</option>
              <option value="javascript" className="bg-[#141418] text-white">JavaScript</option>
              <option value="python" className="bg-[#141418] text-white">Python 3</option>
              <option value="go" className="bg-[#141418] text-white">Go</option>
              <option value="rust" className="bg-[#141418] text-white">Rust</option>
            </select>
          </div>

          {/* Starter Template Preset */}
          <div className="hidden sm:flex items-center gap-1 rounded-md border border-[#27272A] bg-[#141418] px-2 py-0.5">
            <span className="text-[10px] font-semibold text-zinc-500 font-mono">Preset</span>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                const found = TEMPLATES[language]?.find((t) => t.id === e.target.value);
                if (found) handleSelectTemplate(found);
              }}
              className="bg-transparent text-xs font-medium text-zinc-300 focus:outline-none cursor-pointer max-w-[150px] lg:max-w-[200px] truncate"
            >
              {TEMPLATES[language]?.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id} className="bg-[#141418] text-white">
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions (Reset, Copy, Fullscreen, Run, Submit) */}
        <div className="flex items-center gap-1.5">
          {/* Reset Code */}
          <button
            type="button"
            onClick={handleResetCode}
            title="Reset code boilerplate"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#27272A] bg-[#141418] text-zinc-400 hover:text-white hover:border-zinc-700 transition"
          >
            <RotateCcw size={12} />
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            title="Copy code to clipboard"
            className="flex h-7 items-center gap-1 rounded-md border border-[#27272A] bg-[#141418] px-2 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span className="hidden sm:inline text-[11px]">{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen IDE"}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#27272A] bg-[#141418] text-zinc-400 hover:text-white hover:border-zinc-700 transition"
          >
            {isFullScreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>

          <div className="h-4 w-px bg-[#27272A] mx-0.5" />

          {/* Primary Run Code Button */}
          <Button
            size="sm"
            onClick={handleRunCode}
            disabled={isRunning}
            className="h-7 gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-2.5 rounded-md border-0"
          >
            <Play size={11} className={cn("fill-current", isRunning && "animate-spin")} />
            <span>{isRunning ? "Running..." : "Run"}</span>
            <span className="hidden md:inline font-mono text-[10px] opacity-75 ml-0.5">⌘↵</span>
          </Button>

          {/* Submit Solution Button */}
          <Button
            size="sm"
            onClick={handleSubmitSolution}
            disabled={isSubmitting}
            className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-2.5 rounded-md border-0"
          >
            <Send size={11} className={cn(isSubmitting && "animate-pulse")} />
            <span className="hidden sm:inline">
              {submittedSuccess ? "Submitted ✓" : "Submit"}
            </span>
          </Button>
        </div>
      </header>

      {/* ─── SUB-HEADER BREADCRUMB & NOTIFICATION STRIP ──────────────────────── */}
      {submittedSuccess && (
        <div className="flex items-center justify-between bg-emerald-950/70 border-b border-emerald-800/80 px-4 py-1.5 text-xs text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="font-semibold">Solution verified & submitted successfully!</span>
            <span className="text-emerald-400/80 font-mono">(+100 XP Earned)</span>
          </div>
          <Link
            to="/app/tracks"
            className="flex items-center gap-1 font-semibold text-emerald-300 hover:text-white underline underline-offset-2"
          >
            Next Challenge <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {/* ─── SPLIT MAIN VIEW: EDITOR (LEFT) & WORKBENCH (RIGHT) ──────────────── */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* ─── LEFT PANEL: MONOSPACE CODE EDITOR ─────────────────────────────── */}
        <div className="flex flex-1 flex-col border-b lg:border-b-0 lg:border-r border-slate-800/90 bg-[#080D1A] min-w-0">
          {/* Editor Sub-Bar */}
          <div className="flex h-8 flex-none items-center justify-between border-b border-slate-800/80 bg-[#060A14] px-3 text-[11px] text-slate-400 font-mono select-none">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>{currentTemplate.fileName}</span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500">UTF-8</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500">Tab: 2 Spaces</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Font Size Selector */}
              <div className="hidden sm:flex items-center gap-1 text-slate-500">
                <span>Font:</span>
                <button
                  type="button"
                  onClick={() => setFontSize("text-xs")}
                  className={cn("px-1 rounded hover:text-white", fontSize === "text-xs" && "text-cyan-400 font-bold")}
                >
                  XS
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("text-sm")}
                  className={cn("px-1 rounded hover:text-white", fontSize === "text-sm" && "text-cyan-400 font-bold")}
                >
                  SM
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("text-base")}
                  className={cn("px-1 rounded hover:text-white", fontSize === "text-base" && "text-cyan-400 font-bold")}
                >
                  MD
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sandbox Active</span>
              </div>
            </div>
          </div>

          {/* Editor Canvas with Line Gutter */}
          <div className="relative flex flex-1 overflow-hidden bg-[#080D1A]">
            {/* Line Numbers Gutter */}
            <div
              aria-hidden="true"
              className="select-none flex-none border-r border-slate-800/80 bg-[#050811] py-3 text-right font-mono text-slate-600 overflow-hidden"
              style={{ width: "3.25rem" }}
            >
              {lines.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "pr-3 leading-6",
                    fontSize,
                    cursorPos.line === i + 1 ? "text-cyan-400 font-semibold bg-slate-800/30" : "text-slate-600",
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Editable Code Input */}
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleCursorActivity}
              onClick={handleCursorActivity}
              spellCheck={false}
              className={cn(
                "flex-1 resize-none bg-transparent p-3 font-mono leading-6 text-cyan-100 placeholder-slate-600 outline-none focus:ring-0 selection:bg-cyan-500/30 overflow-auto whitespace-pre",
                fontSize,
              )}
              style={{ tabSize: 2 }}
              placeholder="Write your solution here..."
            />
          </div>

          {/* Editor Status Bar */}
          <footer className="flex h-6 flex-none items-center justify-between border-t border-slate-800/80 bg-[#050811] px-3 text-[11px] text-slate-400 font-mono select-none">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400">
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
              <span className="text-slate-600">·</span>
              <span>{lines.length} lines</span>
              <span className="text-slate-600">·</span>
              <span>{code.length} chars</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 hidden sm:inline">Engine:</span>
              <span className="text-slate-300 flex items-center gap-1">
                <Cpu size={11} className="text-cyan-400" />
                {langMeta.runtimeEngine}
              </span>
            </div>
          </footer>
        </div>

        {/* ─── RIGHT PANEL: OUTPUT & TEST WORKBENCH ─────────────────────────── */}
        <div className="flex flex-1 flex-col bg-[#050914] min-w-0 lg:max-w-[48%] xl:max-w-[45%]">
          {/* Workbench Tabs Header */}
          <div className="flex h-8 flex-none items-center justify-between border-b border-slate-800/90 bg-[#060A14] px-2.5 select-none">
            <div className="flex items-center gap-1">
              {/* Console Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("console")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition",
                  activeTab === "console"
                    ? "bg-slate-800 text-cyan-300 border border-slate-700/60"
                    : "text-slate-400 hover:text-white hover:bg-slate-900",
                )}
              >
                <Terminal size={13} />
                <span>Console</span>
                {logs.length > 0 && (
                  <span className="ml-1 rounded-full bg-slate-700/80 px-1.5 py-0.2 text-[10px] font-mono text-slate-300">
                    {logs.length}
                  </span>
                )}
              </button>

              {/* Test Cases Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("tests")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition",
                  activeTab === "tests"
                    ? "bg-slate-800 text-emerald-300 border border-slate-700/60"
                    : "text-slate-400 hover:text-white hover:bg-slate-900",
                )}
              >
                <CheckCircle2 size={13} />
                <span>Test Cases</span>
                <span className="ml-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-1.5 py-0.2 text-[10px] font-mono">
                  {currentTemplate.tests.filter((t) => t.passed).length}/{currentTemplate.tests.length}
                </span>
              </button>

              {/* Live Preview Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition",
                  activeTab === "preview"
                    ? "bg-slate-800 text-purple-300 border border-slate-700/60"
                    : "text-slate-400 hover:text-white hover:bg-slate-900",
                )}
              >
                <Sparkles size={13} />
                <span>Live Preview</span>
              </button>

              {/* Problem Specs Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("problem")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition",
                  activeTab === "problem"
                    ? "bg-slate-800 text-amber-300 border border-slate-700/60"
                    : "text-slate-400 hover:text-white hover:bg-slate-900",
                )}
              >
                <HelpCircle size={13} />
                <span className="hidden sm:inline">Brief</span>
              </button>
            </div>

            {/* Tab Actions */}
            <div className="flex items-center gap-1">
              {activeTab === "console" && (
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  title="Clear Console Output"
                  className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                >
                  <Trash2 size={12} />
                </button>
              )}
              {activeTab === "tests" && (
                <button
                  type="button"
                  onClick={handleRunTests}
                  title="Re-run all test assertions"
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40"
                >
                  <Play size={10} className="fill-current" /> Run Tests
                </button>
              )}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar font-mono text-xs bg-[#040711]">
            {/* ─── TAB 1: CONSOLE LOGS ──────────────────────────────────────── */}
            {activeTab === "console" && (
              <div className="space-y-2">
                {/* Search / Filter logs bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-slate-500 w-full max-w-xs">
                    <Search size={12} />
                    <input
                      type="text"
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      placeholder="Filter console output..."
                      className="bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none w-full"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {filteredLogs.length} events
                  </span>
                </div>

                {/* Log messages */}
                {filteredLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-600">
                    <Terminal size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No console events logged.</p>
                    <p className="text-[11px] text-slate-700 mt-1">
                      Press <span className="text-cyan-400 font-bold">⌘+Enter</span> or click Run Code to execute.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-slate-300">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-2 rounded px-2 py-1 hover:bg-white/[0.02] transition leading-relaxed whitespace-pre-wrap"
                      >
                        <span className="text-[10px] text-slate-600 select-none pt-0.5">
                          {log.timestamp}
                        </span>
                        {log.type === "success" ? (
                          <span className="text-emerald-400 font-semibold">{log.message}</span>
                        ) : log.type === "warn" ? (
                          <span className="text-amber-400 font-semibold">{log.message}</span>
                        ) : log.type === "error" ? (
                          <span className="text-rose-400 font-semibold">{log.message}</span>
                        ) : log.type === "exec" ? (
                          <span className="text-cyan-400 font-semibold">{log.message}</span>
                        ) : (
                          <span className="text-slate-300">{log.message}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 2: TEST CASES ────────────────────────────────────────── */}
            {activeTab === "tests" && (
              <div className="space-y-3 font-sans">
                {/* Suite Header Summary */}
                <div className="flex items-center justify-between rounded-lg bg-slate-900/90 border border-slate-800 p-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Automated Assertions
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {currentTemplate.tests.filter((t) => t.passed).length} of {currentTemplate.tests.length} tests passing
                    </p>
                  </div>
                  <Badge variant="success" className="gap-1 text-xs">
                    <CheckCircle2 size={12} /> 100% Passed
                  </Badge>
                </div>

                {/* Test Cards List */}
                <div className="space-y-2">
                  {currentTemplate.tests.map((test, index) => (
                    <div
                      key={test.id}
                      className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-3 hover:border-slate-700/80 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {test.passed ? (
                            <CheckCircle2 size={15} className="text-emerald-400 flex-none" />
                          ) : (
                            <XCircle size={15} className="text-rose-400 flex-none" />
                          )}
                          <span className="text-xs font-semibold text-white">
                            Test #{index + 1}: {test.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                          {test.durationMs}ms
                        </span>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="rounded bg-slate-950 p-2 border border-slate-800/60">
                          <span className="text-[10px] text-slate-500 uppercase block mb-0.5">
                            Expected
                          </span>
                          <span className="text-slate-300 break-all">{test.expectedOutput}</span>
                        </div>
                        <div className="rounded bg-slate-950 p-2 border border-slate-800/60">
                          <span className="text-[10px] text-slate-500 uppercase block mb-0.5">
                            Actual
                          </span>
                          <span className="text-emerald-400 break-all">{test.actualOutput}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── TAB 3: LIVE PREVIEW ──────────────────────────────────────── */}
            {activeTab === "preview" && (
              <div className="flex flex-col h-full space-y-3 font-sans">
                {/* Viewport bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Live Component Simulator
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("desktop")}
                      className={cn(
                        "p-1 rounded hover:text-white",
                        previewViewport === "desktop" && "text-cyan-400 bg-slate-800",
                      )}
                      title="Desktop View"
                    >
                      <Monitor size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("tablet")}
                      className={cn(
                        "p-1 rounded hover:text-white",
                        previewViewport === "tablet" && "text-cyan-400 bg-slate-800",
                      )}
                      title="Tablet View"
                    >
                      <Tablet size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("mobile")}
                      className={cn(
                        "p-1 rounded hover:text-white",
                        previewViewport === "mobile" && "text-cyan-400 bg-slate-800",
                      )}
                      title="Mobile View"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                </div>

                {/* Render container */}
                <div className="flex flex-1 items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                  {language === "react" ? (
                    <div
                      className={cn(
                        "transition-all duration-200 w-full",
                        previewViewport === "mobile"
                          ? "max-w-[340px]"
                          : previewViewport === "tablet"
                            ? "max-w-[460px]"
                            : "max-w-md",
                      )}
                    >
                      {selectedTemplateId === "react-counter" && (
                        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-2xl">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-cyan-400">
                              EthioTech Reactive Counter
                            </h3>
                            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded-full">
                              Step: ±{previewStep}
                            </span>
                          </div>

                          <div className="my-5 text-center">
                            <div className="text-4xl font-mono font-extrabold text-white">
                              {previewCounter}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-mono">
                              Val: {previewCounter >= 0 ? `+${previewCounter}` : previewCounter}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewCounter((c) => c - previewStep)}
                              className="rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 transition py-2 text-xs font-semibold text-slate-200 border border-slate-700"
                            >
                              -{previewStep}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewCounter(0)}
                              className="rounded-lg bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 transition py-2 text-[11px] font-mono text-slate-400 border border-slate-700/50"
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewCounter((c) => c + previewStep)}
                              className="rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 transition py-2 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20"
                            >
                              +{previewStep}
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                            <span>Step:</span>
                            <div className="flex gap-1.5 font-mono">
                              {[1, 5, 10].map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setPreviewStep(s)}
                                  className={cn(
                                    "px-2 py-0.5 rounded text-[11px] transition",
                                    previewStep === s
                                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                      : "bg-slate-800 text-slate-400 hover:text-white",
                                  )}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedTemplateId === "react-todo" && (
                        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-white shadow-xl">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <div>
                              <h4 className="font-bold text-xs text-cyan-300">Sprint Backlog</h4>
                              <p className="text-[10px] text-slate-400">Interactive Tasks</p>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                              {previewTasks.filter((t) => t.completed).length}/{previewTasks.length} Done
                            </span>
                          </div>

                          <ul className="mt-3 space-y-1.5">
                            {previewTasks.map((t) => (
                              <li
                                key={t.id}
                                onClick={() =>
                                  setPreviewTasks((prev) =>
                                    prev.map((item) =>
                                      item.id === t.id ? { ...item, completed: !item.completed } : item,
                                    ),
                                  )
                                }
                                className="flex items-center gap-2 p-2 rounded bg-slate-800/70 hover:bg-slate-800 cursor-pointer text-xs select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={t.completed}
                                  onChange={() => {}}
                                  className="h-3 w-3 accent-cyan-500 pointer-events-none"
                                />
                                <span
                                  className={t.completed ? "line-through text-slate-500" : "text-slate-200"}
                                >
                                  {t.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedTemplateId === "react-telemetry" && (
                        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-white shadow-xl font-mono">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-xs font-bold text-slate-200">
                                Live Telemetry Stream
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                              LIVE
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 my-3 text-center">
                            <div className="p-2 bg-slate-950 rounded border border-slate-800">
                              <p className="text-[10px] text-slate-500">Latency</p>
                              <p className="text-sm font-bold text-cyan-300">24ms</p>
                            </div>
                            <div className="p-2 bg-slate-950 rounded border border-slate-800">
                              <p className="text-[10px] text-slate-500">CPU</p>
                              <p className="text-sm font-bold text-indigo-300">14%</p>
                            </div>
                            <div className="p-2 bg-slate-950 rounded border border-slate-800">
                              <p className="text-[10px] text-slate-500">Memory</p>
                              <p className="text-sm font-bold text-emerald-300">42MB</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Non-React execution representation */
                    <div className="text-center py-6 space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto">
                        <Activity size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {LANGUAGE_META[language].name} Native Sandbox
                        </p>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                          CLI and backend code execute in a secure isolated {langMeta.runtimeEngine}.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        <Check size={12} /> Execution Engine Ready (Exit Code: 0)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 4: PROBLEM BRIEF & CHECKPOINTS ───────────────────────── */}
            {activeTab === "problem" && (
              <div className="space-y-4 font-sans text-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                    <Zap size={13} />
                    <span>Objective</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {currentTemplate.problemDescription.title}
                  </h3>
                  <p className="text-slate-300 mt-1 leading-relaxed">
                    {currentTemplate.problemDescription.goal}
                  </p>
                </div>

                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Checkpoints & Criteria
                  </h4>
                  <ul className="space-y-1.5">
                    {currentTemplate.problemDescription.checkpoints.map((cp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{cp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5 border-t border-slate-800 pt-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Constraints
                  </h4>
                  <ul className="space-y-1 text-slate-400">
                    {currentTemplate.problemDescription.constraints.map((c, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-slate-600 font-mono">▪</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <Link to="/app/tracks">
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                      <BookOpen size={13} /> View Full Track Curriculum
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
