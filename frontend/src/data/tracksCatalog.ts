export interface CapstoneProject {
  id: string;
  title: string;
  tagline: string;
  description: string;
  difficulty: "Intermediate" | "Advanced" | "Production-Grade";
  estimatedHours: number;
  techStack: string[];
  architectureHighlights: string[];
  deliverables: string[];
  previewSnippet: {
    language: string;
    filename: string;
    code: string;
  };
}

export interface CareerOutcome {
  role: string;
  type: "Primary Role" | "Alternative Track" | "Specialized Focus";
  description: string;
  averageSalary: string;
  skillsMatched: string[];
}

export interface SkillPrerequisite {
  skill: string;
  level: "Required" | "Recommended" | "Helpful";
  description: string;
}

export interface CompetencyGroup {
  category: string;
  skills: string[];
}

export interface ToolingItem {
  name: string;
  category: "Runtime" | "Framework" | "Database" | "Cloud & DevOps" | "Testing & Security" | "Design & Prototyping" | "AI & ML" | "Tooling";
  iconName?: string;
}

export interface CatalogLesson {
  _id: string;
  title: string;
  durationMinutes: number;
  xpReward: number;
  order: number;
  type: "concept" | "hands-on" | "code-lab" | "project-checkpoint";
  summary: string;
  content: string;
  prerequisites?: string[];
  starterCode?: string;
  challengeTask?: string;
}

export interface CatalogModule {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: CatalogLesson[];
}

export interface TrackCatalogItem {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  tagline: string;
  description: string;
  category: "Fullstack Web" | "Mobile Development" | "Cloud & DevOps" | "Data Science & AI" | "Cyber Security" | "UI/UX Engineering";
  categoryKey: "web" | "mobile" | "cloud" | "ai" | "cyber" | "design";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedWeeks: number;
  liveSessionsCount: number;
  mentorshipHours: number;
  totalProjectsCount: number;
  xpReward: number;
  featured: boolean;
  marketDemand: {
    rating: "Very High" | "High" | "Extremely High";
    growthMetric: string;
    salaryRange: string;
    summary: string;
    topHiringSectors: string[];
  };
  targetCareerRoles: CareerOutcome[];
  prerequisites: SkillPrerequisite[];
  competencyGroups: CompetencyGroup[];
  tooling: ToolingItem[];
  capstones: CapstoneProject[];
  modules: CatalogModule[];
  badgeColor: "cyan" | "purple" | "success" | "warning";
  unsplashId: string;
}

export const TRACKS_CATALOG: TrackCatalogItem[] = [
  {
    id: "fullstack-web",
    slug: "fullstack-web",
    title: "Fullstack Web Engineering",
    shortTitle: "Fullstack Web",
    tagline: "Build enterprise React frontends, scalable Node.js microservices, and distributed cloud backends with TypeScript.",
    description:
      "A complete professional pathway from core JavaScript and React fundamentals to production REST/GraphQL APIs, Prisma ORM, PostgreSQL transactions, and automated CI/CD deployments. Engineered to produce job-ready software developers for high-growth tech companies.",
    category: "Fullstack Web",
    categoryKey: "web",
    difficulty: "Intermediate",
    estimatedWeeks: 14,
    liveSessionsCount: 24,
    mentorshipHours: 36,
    totalProjectsCount: 5,
    xpReward: 3400,
    featured: true,
    badgeColor: "cyan",
    unsplashId: "photo-1555066931-4365d14bab8c",
    marketDemand: {
      rating: "Very High",
      growthMetric: "+44% YoY hiring growth in Africa & Global Remote",
      salaryRange: "$35,000 - $95,000 / yr",
      summary: "Fullstack TypeScript engineers remain the #1 most recruited software discipline across global distributed startups and African tech unicorns.",
      topHiringSectors: ["Fintech & Payments", "E-Commerce", "SaaS & Cloud Platforms", "HealthTech"],
    },
    targetCareerRoles: [
      {
        role: "Fullstack Software Engineer",
        type: "Primary Role",
        description: "Design end-to-end architectures, modern client UIs, and robust server APIs with full relational data persistence.",
        averageSalary: "$55,000 - $95,000",
        skillsMatched: ["React 19", "TypeScript", "Node.js", "PostgreSQL", "Prisma"],
      },
      {
        role: "Frontend Specialist (React / Next.js)",
        type: "Alternative Track",
        description: "Build high-performance web applications with state synchronization, accessibility, and fluid responsive design systems.",
        averageSalary: "$50,000 - $85,000",
        skillsMatched: ["React", "TypeScript", "Tailwind CSS", "Framer Motion", "TanStack Query"],
      },
      {
        role: "Backend & API Developer",
        type: "Specialized Focus",
        description: "Architect scalable microservices, JWT/OAuth authentication pipelines, caching layers, and database migration routines.",
        averageSalary: "$52,000 - $90,000",
        skillsMatched: ["Node.js", "Express", "REST", "PostgreSQL", "Redis", "Docker"],
      },
    ],
    prerequisites: [
      {
        skill: "Basic JavaScript & HTML/CSS",
        level: "Required",
        description: "Familiarity with DOM elements, variable assignments, loops, and basic functions.",
      },
      {
        skill: "Terminal & Git Basics",
        level: "Recommended",
        description: "Comfortable navigating command lines, creating repositories, and basic git branching.",
      },
      {
        skill: "Problem Solving & Logic",
        level: "Helpful",
        description: "Basic algorithmic thinking and structured troubleshooting approach.",
      },
    ],
    competencyGroups: [
      {
        category: "Frontend Engineering",
        skills: ["Component Architecture", "Hooks & State Machines", "TanStack Query", "Tailwind CSS", "Accessibility (a11y)"],
      },
      {
        category: "Backend & APIs",
        skills: ["Node.js & Express", "TypeScript Strict Typing", "REST & GraphQL", "JWT/OAuth2 Auth", "Error Handling Protocols"],
      },
      {
        category: "Databases & Data Layer",
        skills: ["PostgreSQL Schema Modeling", "Prisma ORM", "ACID Transactions", "Indexing & Optimization", "Redis Caching"],
      },
      {
        category: "DevOps & Quality",
        skills: ["Docker Containers", "Vitest & React Testing Library", "GitHub Actions CI/CD", "Vercel / Railway Deployment", "API Monitoring"],
      },
    ],
    tooling: [
      { name: "TypeScript 5.x", category: "Runtime" },
      { name: "React 19", category: "Framework" },
      { name: "Node.js 22", category: "Runtime" },
      { name: "PostgreSQL", category: "Database" },
      { name: "Prisma ORM", category: "Database" },
      { name: "Tailwind CSS", category: "Design & Prototyping" },
      { name: "TanStack Query", category: "Tooling" },
      { name: "Docker", category: "Cloud & DevOps" },
      { name: "Vitest", category: "Testing & Security" },
      { name: "Zod Schema Validation", category: "Tooling" },
    ],
    capstones: [
      {
        id: "ecommerce-gateway",
        title: "E-Commerce Gateway & Distributed Storefront",
        tagline: "Production multi-vendor store with real-time inventory, Chapa/Stripe payment webhooks, and admin dashboard.",
        description:
          "Architect an end-to-end commerce engine featuring optimistic cart mutation, order state machines, webhook idempotency, role-based vendor portals, and automatic invoice generation.",
        difficulty: "Production-Grade",
        estimatedHours: 45,
        techStack: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Prisma", "Chapa API", "Tailwind CSS"],
        architectureHighlights: [
          "Idempotent payment webhook processing ensuring zero double-charges",
          "Optimistic UI updates with TanStack Query mutation rollbacks",
          "Role-based access control (Buyer, Vendor, Super Admin) via signed JWT cookies",
          "PostgreSQL row-level locking for atomic inventory decrement during checkout",
        ],
        deliverables: [
          "Customer storefront with search, category filtering, and instant checkout",
          "Vendor management portal with sales telemetry and stock alerts",
          "Automated integration test suite with 85%+ code coverage",
          "Live deployed cloud instance with automated GitHub Actions pipeline",
        ],
        previewSnippet: {
          language: "typescript",
          filename: "services/checkoutService.ts",
          code: `import { prisma } from "../lib/prisma";
import { initiateChapaPayment } from "../integrations/chapa";
import { AppError } from "../utils/errors";

export async function processOrderCheckout(userId: string, cartItems: Array<{ productId: string; quantity: number }>) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify stock availability with lock
    let totalAmount = 0;
    for (const item of cartItems) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock < item.quantity) {
        throw new AppError(400, \`Insufficient stock for item: \${product?.name || item.productId}\`);
      }
      totalAmount += product.price * item.quantity;
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 2. Create pending order record
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        status: "PENDING_PAYMENT",
        items: { create: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })) },
      },
    });

    // 3. Initiate secured payment transaction
    const payment = await initiateChapaPayment({
      amount: totalAmount,
      txRef: \`order-\${order.id}\`,
      currency: "ETB",
    });

    return { orderId: order.id, checkoutUrl: payment.checkoutUrl };
  });
}`,
        },
      },
      {
        id: "collaborative-workspace",
        title: "Real-Time Collaborative Workspace",
        tagline: "Live multi-user documentation editor with WebSocket synchronization, active cursor indicators, and version snapshots.",
        description:
          "Engineer a real-time collaborative workspace utilizing WebSocket channels, operational transformation conflict resolution, user presence awareness, and markdown export.",
        difficulty: "Advanced",
        estimatedHours: 35,
        techStack: ["React", "TypeScript", "Node.js", "Socket.io", "Redis Pub/Sub", "PostgreSQL"],
        architectureHighlights: [
          "Distributed WebSocket broadcasting powered by Redis Pub/Sub backplane",
          "Presence heartbeats displaying active room collaborators with custom avatars",
          "Automated version diffing and snapshot rollback engine",
        ],
        deliverables: [
          "Real-time rich text / markdown editor with multi-cursor rendering",
          "Document permissions manager (Viewer, Editor, Owner)",
          "Export engine supporting Markdown, PDF, and HTML bundle downloads",
        ],
        previewSnippet: {
          language: "typescript",
          filename: "server/socketSync.ts",
          code: `import { Server, Socket } from "socket.io";
import { redisClient } from "./redis";

export function setupCollaborationRoom(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("join-document", async ({ docId, user }) => {
      socket.join(docId);
      await redisClient.hset(\`presence:\${docId}\`, socket.id, JSON.stringify(user));
      
      const activeUsers = await redisClient.hvals(\`presence:\${docId}\`);
      io.to(docId).emit("presence-update", activeUsers.map((u) => JSON.parse(u)));
    });

    socket.on("doc-change", ({ docId, delta, version }) => {
      socket.to(docId).emit("remote-change", { delta, version, sender: socket.id });
    });
  });
}`,
        },
      },
    ],
    modules: [
      {
        _id: "mod-web-1",
        title: "Modern TypeScript & Advanced JavaScript Architecture",
        description: "Master ESNext paradigms, strict type systems, async control flows, and modular design patterns.",
        order: 1,
        lessons: [
          {
            _id: "les-web-101",
            title: "TypeScript Deep Dive: Generics, Mapped Types & Strict Safety",
            durationMinutes: 50,
            xpReward: 60,
            order: 1,
            type: "concept",
            summary: "Understand deep TypeScript type inference, utility types, and generic constraints for robust enterprise libraries.",
            content: "TypeScript provides static type checking that prevents runtime errors before code is pushed to production. In this lesson, we break down generics, discriminated unions, and mapped types.",
            starterCode: "type Result<T> = { success: true; data: T } | { success: false; error: Error };",
            challengeTask: "Write a generic API response unwrapper function with comprehensive type guards.",
          },
          {
            _id: "les-web-102",
            title: "Asynchronous JavaScript & Event Loop Mastery",
            durationMinutes: 45,
            xpReward: 55,
            order: 2,
            type: "hands-on",
            summary: "Explore microtasks, macrotasks, Promise concurrency patterns (allSettled, race), and abort signals.",
            content: "Explore how JavaScript executes asynchronous operations via the call stack and microtask queue.",
          },
          {
            _id: "les-web-103",
            title: "Modular Code Organization & Functional Utility Libraries",
            durationMinutes: 40,
            xpReward: 50,
            order: 3,
            type: "code-lab",
            summary: "Implement composable utilities with immutable data patterns and pure transformations.",
            content: "Build a production-grade utility kit implementing debounce, throttle, deep-clone, and pipe functions.",
          },
        ],
      },
      {
        _id: "mod-web-2",
        title: "Production React 19, State Architecture & Performance",
        description: "Build reactive user interfaces, component design systems, and optimistic data fetching layers.",
        order: 2,
        lessons: [
          {
            _id: "les-web-201",
            title: "Component Composition Patterns & Compound Components",
            durationMinutes: 55,
            xpReward: 70,
            order: 1,
            type: "hands-on",
            summary: "Build flexible, accessible UI components using React Context and compound slot architecture.",
            content: "Learn how to build headless component primitives like Dropdowns, Accordions, and Modals with keyboard support.",
          },
          {
            _id: "les-web-202",
            title: "TanStack Query & Optimistic Cache Synchronization",
            durationMinutes: 60,
            xpReward: 80,
            order: 2,
            type: "code-lab",
            summary: "Implement robust server state caching, background revalidation, mutation rollbacks, and offline buffers.",
            content: "Eliminate useEffect data fetching anti-patterns with modern React Query hooks.",
          },
          {
            _id: "les-web-203",
            title: "React Performance Profiling & Memory Leak Mitigation",
            durationMinutes: 45,
            xpReward: 60,
            order: 3,
            type: "hands-on",
            summary: "Use React DevTools Profiler, useMemo, useCallback, and virtualization to render 10,000+ items at 60 FPS.",
            content: "Identify re-render bottlenecks and optimize render cycles across complex dashboard views.",
          },
        ],
      },
      {
        _id: "mod-web-3",
        title: "Scalable Node.js, Express & RESTful API Engineering",
        description: "Architect secure backend services, middleware pipelines, error standardizers, and authentication.",
        order: 3,
        lessons: [
          {
            _id: "les-web-301",
            title: "Express 5 Architecture: Layered Controller-Service-Repository Pattern",
            durationMinutes: 60,
            xpReward: 75,
            order: 1,
            type: "hands-on",
            summary: "Structure clean backend services separating routing, business logic, validation, and data storage.",
            content: "Build a production REST scaffolding with centralized error handling and request tracking.",
          },
          {
            _id: "les-web-302",
            title: "JWT Authentication, Refresh Token Rotation & CSRF Protection",
            durationMinutes: 65,
            xpReward: 85,
            order: 2,
            type: "code-lab",
            summary: "Implement security best practices with HttpOnly cookies, token rotation, and rate limiting.",
            content: "Construct a hardened auth system compliant with OWASP session management guidelines.",
          },
        ],
      },
      {
        _id: "mod-web-4",
        title: "Relational Databases, PostgreSQL & Prisma ORM",
        description: "Design relational data schemas, indexes, migrations, and transactional isolation layers.",
        order: 4,
        lessons: [
          {
            _id: "les-web-401",
            title: "Database Modeling, Normalization & High-Speed Indexing",
            durationMinutes: 55,
            xpReward: 70,
            order: 1,
            type: "concept",
            summary: "Master 3NF schema design, foreign key constraints, B-Tree and GIN indexes, and EXPLAIN ANALYZE queries.",
            content: "Learn how to optimize PostgreSQL queries from 2,000ms down to 12ms using targeted index structures.",
          },
          {
            _id: "les-web-402",
            title: "Prisma Migrations, Complex Joins & ACID Transactions",
            durationMinutes: 65,
            xpReward: 85,
            order: 2,
            type: "hands-on",
            summary: "Handle multi-table atomic updates and concurrency safety in production e-commerce operations.",
            content: "Safeguard against race conditions using interactive database transactions.",
          },
        ],
      },
    ],
  },
  {
    id: "mobile-development",
    slug: "mobile-development",
    title: "Mobile App Development",
    shortTitle: "Mobile Development",
    tagline: "Engineer high-performance cross-platform mobile apps for iOS and Android with React Native and Flutter.",
    description:
      "Master modern native mobile development from gesture navigation and offline-first database synchronization to biometric security, push notifications, and app store deployment. Tailored for African and international mobile-first ecosystems.",
    category: "Mobile Development",
    categoryKey: "mobile",
    difficulty: "Intermediate",
    estimatedWeeks: 12,
    liveSessionsCount: 20,
    mentorshipHours: 30,
    totalProjectsCount: 4,
    xpReward: 3000,
    featured: true,
    badgeColor: "purple",
    unsplashId: "photo-1526498460520-4c246339dccb",
    marketDemand: {
      rating: "Very High",
      growthMetric: "+52% surge in mobile software demand across East Africa",
      salaryRange: "$40,000 - $88,000 / yr",
      summary: "Mobile-first digital banking, courier dispatch, and telehealth make cross-platform mobile specialists indispensable across emerging markets.",
      topHiringSectors: ["Fintech & Mobile Money", "Logistics & Delivery", "Telemedicine", "EdTech"],
    },
    targetCareerRoles: [
      {
        role: "React Native Mobile Engineer",
        type: "Primary Role",
        description: "Ship native iOS and Android apps using React primitives, Reanimated gestures, and native module bridges.",
        averageSalary: "$50,000 - $90,000",
        skillsMatched: ["React Native", "Expo", "TypeScript", "Redux Toolkit", "WatermelonDB"],
      },
      {
        role: "Flutter / Dart Specialist",
        type: "Alternative Track",
        description: "Craft pixel-perfect 60 FPS mobile interfaces and state-driven reactive apps with Flutter engine and Bloc.",
        averageSalary: "$48,000 - $85,000",
        skillsMatched: ["Flutter", "Dart", "Bloc State Management", "Firebase", "SQLite"],
      },
      {
        role: "Mobile Solutions Architect",
        type: "Specialized Focus",
        description: "Design offline-first mobile sync protocols, encrypted on-device vaults, and push messaging infrastructure.",
        averageSalary: "$60,000 - $105,000",
        skillsMatched: ["Offline Sync", "Biometric Auth", "Detox Testing", "Fastlane CI", "App Store Connect"],
      },
    ],
    prerequisites: [
      {
        skill: "Basic JavaScript or Dart syntax",
        level: "Required",
        description: "Understanding of variables, async/await, and object-oriented or functional paradigms.",
      },
      {
        skill: "React or UI component basics",
        level: "Recommended",
        description: "Knowledge of component hierarchies, props, and UI state lifecycle.",
      },
      {
        skill: "Mobile Device Emulator / Device Setup",
        level: "Helpful",
        description: "Android Studio or Xcode emulator configured on your development machine.",
      },
    ],
    competencyGroups: [
      {
        category: "Mobile UI & Gestures",
        skills: ["React Native Paper / NativeWind", "React Navigation 6", "Reanimated 3 Animations", "Gesture Handler", "Safe Area Layouts"],
      },
      {
        category: "Native Device Features",
        skills: ["Camera & Image Picker", "Geolocation & Background GPS", "Biometrics (FaceID/Fingerprint)", "Push Notification Pipelines", "Sensors & Haptics"],
      },
      {
        category: "Offline Architecture & Storage",
        skills: ["WatermelonDB / SQLite", "AsyncStorage Encrypted Key-Value", "Network Connectivity Listeners", "Sync Conflict Resolution"],
      },
      {
        category: "Testing & Publishing",
        skills: ["Detox E2E Testing", "Fastlane Build Automation", "Google Play Console Publishing", "Apple TestFlight & App Store"],
      },
    ],
    tooling: [
      { name: "React Native", category: "Framework" },
      { name: "Flutter & Dart", category: "Framework" },
      { name: "Expo EAS", category: "Cloud & DevOps" },
      { name: "WatermelonDB", category: "Database" },
      { name: "Firebase Cloud Messaging", category: "Cloud & DevOps" },
      { name: "React Native Reanimated", category: "Design & Prototyping" },
      { name: "Fastlane", category: "Tooling" },
      { name: "Detox", category: "Testing & Security" },
    ],
    capstones: [
      {
        id: "telemedicine-mobile",
        title: "Telemedicine & Triage Health App",
        tagline: "Encrypted patient-doctor video consults, offline prescription cache, and automated appointment push alerts.",
        description:
          "Build a medical consultation app engineered for unstable network connections. Features LiveKit WebRTC video integration, biometric fingerprint login, encrypted offline medical history, and push appointment reminders.",
        difficulty: "Production-Grade",
        estimatedHours: 40,
        techStack: ["React Native", "Expo", "TypeScript", "LiveKit Mobile SDK", "WatermelonDB", "Node.js", "Firebase FCM"],
        architectureHighlights: [
          "Zero-knowledge encrypted local SQLite database for sensitive patient vitals",
          "Adaptive WebRTC video bitrate fallback for low-bandwidth 3G mobile environments",
          "Automated background sync engine reconciling consultation notes when connection returns",
        ],
        deliverables: [
          "Complete doctor and patient mobile app flows",
          "Live consultation room with audio/video and in-call prescription drafting",
          "Offline symptom checker and medication schedule notification triggers",
        ],
        previewSnippet: {
          language: "typescript",
          filename: "mobile/hooks/useOfflineSync.ts",
          code: `import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { database } from "../db";
import { syncRecordsWithCloud } from "../services/api";

export function useOfflineSyncEngine() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && state.isInternetReachable) {
        const pendingPrescriptions = await database
          .get("prescriptions")
          .query()
          .fetch();
        const uncommitted = pendingPrescriptions.filter((p) => p._raw._status === "created");
        if (uncommitted.length > 0) {
          await syncRecordsWithCloud(uncommitted);
        }
      }
    });
    return () => unsubscribe();
  }, []);
}`,
        },
      },
      {
        id: "hyperlocal-dispatcher",
        title: "Hyperlocal Delivery & Courier Dispatcher",
        tagline: "Real-time courier tracking on Mapbox, background location stream, and automated SMS pickup verifications.",
        description:
          "Engineer an on-demand logistics dispatch app with real-time vector map rendering, driver routing polylines, battery-efficient GPS streaming, and customer order handoff signatures.",
        difficulty: "Advanced",
        estimatedHours: 35,
        techStack: ["React Native", "Mapbox GL", "Expo Background Fetch", "Socket.io Client", "TypeScript"],
        architectureHighlights: [
          "Background geolocation service with Kalman filtering to eliminate GPS noise",
          "Live vector map marker interpolation delivering buttery-smooth 60 FPS car movement",
          "Proof-of-delivery signature pad with automatic canvas compression",
        ],
        deliverables: [
          "Courier driver live dashboard with turn-by-turn route previews",
          "Customer tracking screen with live ETA calculation",
          "Digital signature and camera photo proof-of-delivery capture",
        ],
        previewSnippet: {
          language: "typescript",
          filename: "mobile/screens/CourierLiveMap.tsx",
          code: `import React, { useEffect, useState } from "react";
import MapboxGL from "@rnmapbox/maps";
import { useDriverLocationStream } from "../hooks/useDriverLocation";

export function CourierLiveMap({ orderId }: { orderId: string }) {
  const { coords, bearing } = useDriverLocationStream(orderId);

  return (
    <MapboxGL.MapView style={{ flex: 1 }} styleURL={MapboxGL.StyleURL.Dark}>
      <MapboxGL.Camera zoomLevel={15} centerCoordinate={[coords.longitude, coords.latitude]} animationDuration={600} />
      <MapboxGL.PointAnnotation id="courier-vehicle" coordinate={[coords.longitude, coords.latitude]}>
        <VehicleMarkerIcon rotation={bearing} />
      </MapboxGL.PointAnnotation>
    </MapboxGL.MapView>
  );
}`,
        },
      },
    ],
    modules: [
      {
        _id: "mod-mob-1",
        title: "React Native & Expo Ecosystem Foundations",
        description: "Master React Native core components, flex layouts, and TypeScript mobile paradigms.",
        order: 1,
        lessons: [
          {
            _id: "les-mob-101",
            title: "React Native Architecture: Fabric, TurboModules & JSX Primitives",
            durationMinutes: 50,
            xpReward: 60,
            order: 1,
            type: "concept",
            summary: "Understand the React Native bridge vs the modern C++ JSI (JavaScript Interface) runtime architecture.",
            content: "Discover how React Native renders true native UIView and android.view components at 60 FPS.",
          },
          {
            _id: "les-mob-102",
            title: "Adaptive Responsive Layouts & Safe Area Dimensions",
            durationMinutes: 45,
            xpReward: 55,
            order: 2,
            type: "hands-on",
            summary: "Build dynamic layouts supporting foldables, notches, dynamic islands, and varying screen densities.",
            content: "Master Flexbox in mobile and integrate Tailwind / NativeWind for rapid UI styling.",
          },
        ],
      },
      {
        _id: "mod-mob-2",
        title: "Navigation, Fluid Gestures & Reanimated 3",
        description: "Implement native stack navigation, bottom tabs, shared element transitions, and gesture recognizers.",
        order: 2,
        lessons: [
          {
            _id: "les-mob-201",
            title: "React Navigation 6: Typed Stack, Tabs & Deep Linking",
            durationMinutes: 55,
            xpReward: 70,
            order: 1,
            type: "hands-on",
            summary: "Construct deep navigation hierarchies with universal web and mobile deep linking URL schemes.",
            content: "Set up typed route parameters and protect nested authentication flow states.",
          },
          {
            _id: "les-mob-202",
            title: "Interactive Gestures & 60 FPS Reanimated 3 Worklets",
            durationMinutes: 60,
            xpReward: 80,
            order: 2,
            type: "code-lab",
            summary: "Run smooth animations on the UI thread without crossing the JS bridge using Reanimated worklets.",
            content: "Build an interactive swipe-to-dismiss card deck and spring physics interactions.",
          },
        ],
      },
      {
        _id: "mod-mob-3",
        title: "Offline-First Data, SQLite & Native Hardware Integrations",
        description: "Integrate camera lenses, biometric auth, background geolocation, and offline relational storage.",
        order: 3,
        lessons: [
          {
            _id: "les-mob-301",
            title: "WatermelonDB & Offline Relational Data Syncing",
            durationMinutes: 60,
            xpReward: 80,
            order: 1,
            type: "hands-on",
            summary: "Build ultra-fast observable offline queries scaling to tens of thousands of records instantly.",
            content: "Learn how SQLite threading keeps mobile UI buttery smooth even during heavy queries.",
          },
          {
            _id: "les-mob-302",
            title: "Biometrics, Secure Store & Push Notification Triggers",
            durationMinutes: 55,
            xpReward: 70,
            order: 2,
            type: "code-lab",
            summary: "Secure on-device auth tokens using iOS Keychain and Android Keystore with FaceID fallback.",
            content: "Configure APNs and Firebase Cloud Messaging for instant mobile alert triggers.",
          },
        ],
      },
    ],
  },
  {
    id: "cloud-devops",
    slug: "cloud-devops",
    title: "Cloud Architecture & DevOps",
    shortTitle: "Cloud & DevOps",
    tagline: "Master Docker containerization, Kubernetes orchestration, AWS cloud infrastructure, and automated CI/CD pipelines.",
    description:
      "Transform into a cloud engineer capable of designing resilient distributed cloud environments. Learn Terraform Infrastructure as Code, zero-downtime canary deployments, Prometheus telemetry, and multi-region AWS architectures.",
    category: "Cloud & DevOps",
    categoryKey: "cloud",
    difficulty: "Advanced",
    estimatedWeeks: 12,
    liveSessionsCount: 22,
    mentorshipHours: 32,
    totalProjectsCount: 4,
    xpReward: 3200,
    featured: true,
    badgeColor: "success",
    unsplashId: "photo-1618401471353-b98aedd04e11",
    marketDemand: {
      rating: "Very High",
      growthMetric: "+65% enterprise demand for cloud automation & reliability",
      salaryRange: "$45,000 - $110,000 / yr",
      summary: "Every scalable software platform relies on cloud infrastructure engineers to automate deployments and guarantee 99.99% uptime.",
      topHiringSectors: ["Enterprise Banking", "Cloud Services", "Telecoms", "SaaS Infrastructure"],
    },
    targetCareerRoles: [
      {
        role: "DevOps / SRE Engineer",
        type: "Primary Role",
        description: "Maintain high-availability infrastructure, automate continuous delivery pipelines, and lead incident response.",
        averageSalary: "$60,000 - $110,000",
        skillsMatched: ["Docker", "Kubernetes", "AWS", "Terraform", "GitHub Actions"],
      },
      {
        role: "Cloud Infrastructure Architect",
        type: "Alternative Track",
        description: "Design fault-tolerant, multi-AZ cloud networks with secure VPCs, IAM policies, and cost-optimized compute.",
        averageSalary: "$65,000 - $120,000",
        skillsMatched: ["AWS ECS/EKS", "Terraform", "CloudFront", "RDS Aurora", "Security Hardening"],
      },
      {
        role: "Build & Release Automation Specialist",
        type: "Specialized Focus",
        description: "Construct zero-downtime blue/green deployment pipelines, container vulnerability scanners, and automated test runners.",
        averageSalary: "$55,000 - $95,000",
        skillsMatched: ["CI/CD Pipelines", "Helm Charts", "Prometheus & Grafana", "Linux CLI", "Nginx"],
      },
    ],
    prerequisites: [
      {
        skill: "Linux Command Line & Bash Basics",
        level: "Required",
        description: "Familiarity with file permissions, processes, environment variables, and SSH keys.",
      },
      {
        skill: "Basic Networking Concepts",
        level: "Recommended",
        description: "Understanding of IP addresses, ports, DNS resolution, HTTP status codes, and TLS certificates.",
      },
      {
        skill: "Git & Version Control",
        level: "Required",
        description: "Ability to manage branches, pull requests, and commit histories.",
      },
    ],
    competencyGroups: [
      {
        category: "Containers & Orchestration",
        skills: ["Docker Multi-Stage Builds", "Docker Compose", "Kubernetes Deployments & Services", "Ingress Controllers", "Helm Charts"],
      },
      {
        category: "Cloud Provider (AWS)",
        skills: ["VPC & Subnet Architecture", "EC2, ECS & Lambda", "S3 & CloudFront CDN", "RDS & DynamoDB", "IAM Least-Privilege Policies"],
      },
      {
        category: "Infrastructure as Code",
        skills: ["Terraform HCL Modules", "Remote State in S3/DynamoDB", "Resource Drift Detection", "Environment Parameterization"],
      },
      {
        category: "CI/CD & Observability",
        skills: ["GitHub Actions Workflows", "Trivy Container Scanning", "Prometheus Metrics & Grafana", "Structured Logging (ELK)", "Alertmanager"],
      },
    ],
    tooling: [
      { name: "Docker", category: "Cloud & DevOps" },
      { name: "Kubernetes (k8s)", category: "Cloud & DevOps" },
      { name: "AWS (S3, ECS, RDS, IAM)", category: "Cloud & DevOps" },
      { name: "Terraform", category: "Cloud & DevOps" },
      { name: "GitHub Actions", category: "Cloud & DevOps" },
      { name: "Nginx", category: "Tooling" },
      { name: "Prometheus", category: "Testing & Security" },
      { name: "Grafana", category: "Tooling" },
      { name: "Linux Bash", category: "Runtime" },
    ],
    capstones: [
      {
        id: "distributed-cloud-api",
        title: "Distributed Cloud API & Auto-Scaling Cluster",
        tagline: "Terraform-provisioned Kubernetes cluster on AWS with automated GitHub Actions CI/CD and Grafana dashboards.",
        description:
          "Design and deploy a production-grade containerized cluster on AWS. Includes multi-stage optimized Docker images, zero-downtime rolling updates, SSL termination via Let's Encrypt, auto-scaling worker nodes, and live observability metrics.",
        difficulty: "Production-Grade",
        estimatedHours: 42,
        techStack: ["Terraform", "AWS EKS", "Docker", "Kubernetes", "GitHub Actions", "Prometheus", "Grafana", "Nginx Ingress"],
        architectureHighlights: [
          "Terraform-managed multi-AZ VPC with public/private subnet topology and NAT gateways",
          "Horizontal Pod Autoscaling (HPA) responding dynamically to CPU and request traffic spikes",
          "Automated security scanning with Trivy blocking vulnerable container image pushes",
          "Prometheus alerting rules triggering Discord/Slack notifications on 5xx error spikes",
        ],
        deliverables: [
          "Modular Terraform codebase provisioning complete VPC, EKS, and RDS infrastructure",
          "Kubernetes manifests for deployments, ingress routing, configmaps, and secrets",
          "Full CI/CD pipeline building, testing, scanning, and deploying without downtime",
          "Grafana telemetry dashboard tracking p99 latency, memory utilization, and throughput",
        ],
        previewSnippet: {
          language: "hcl",
          filename: "infra/main.tf",
          code: `module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "ethiotech-production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["af-south-1a", "af-south-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  tags = {
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}`,
        },
      },
      {
        id: "serverless-transcoding",
        title: "Serverless Event-Driven Media Pipeline",
        tagline: "S3-triggered AWS Lambda microservices for video encoding, thumbnail generation, and metadata extraction.",
        description:
          "Build an event-driven serverless video processing pipeline that responds to cloud storage uploads, asynchronously splits video streams into adaptive HLS resolutions, and updates database records.",
        difficulty: "Advanced",
        estimatedHours: 32,
        techStack: ["AWS Lambda", "AWS S3", "FFmpeg", "Node.js", "DynamoDB", "AWS SQS", "Serverless Framework"],
        architectureHighlights: [
          "Asynchronous dead-letter queue handling for resilient job retries",
          "Custom Lambda container layers bundling compiled FFmpeg binaries",
          "Fan-out architecture generating multi-bitrate 1080p, 720p, and 480p streams simultaneously",
        ],
        deliverables: [
          "Serverless deployment configuration and IAM execution roles",
          "Lambda handler functions with error handling and DynamoDB status streaming",
          "HLS playlist verification test suite",
        ],
        previewSnippet: {
          language: "typescript",
          filename: "lambdas/transcodeVideo.ts",
          code: `import { S3Event } from "aws-lambda";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "child_process";

export async function handler(event: S3Event) {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, " "));
    console.log(\`[Transcoder] Processing uploaded video: \${key} from bucket: \${bucket}\`);
    // Run FFmpeg HLS segmentation asynchronously...
  }
  return { statusCode: 200, body: "Transcoding initiated" };
}`,
        },
      },
    ],
    modules: [
      {
        _id: "mod-cloud-1",
        title: "Docker Containerization & Multi-Stage Image Optimization",
        description: "Master container runtimes, non-root user permissions, and multi-stage build caching.",
        order: 1,
        lessons: [
          {
            _id: "les-cloud-101",
            title: "Docker Fundamentals: Namespaces, Cgroups & Layer Caching",
            durationMinutes: 45,
            xpReward: 55,
            order: 1,
            type: "concept",
            summary: "Understand how Linux isolation primitives form the basis of secure, fast container execution.",
            content: "Learn how the Docker daemon executes container processes and manages storage layers.",
          },
          {
            _id: "les-cloud-102",
            title: "Crafting Lean Production Dockerfiles (<50MB) with Alpine & Scratch",
            durationMinutes: 50,
            xpReward: 65,
            order: 2,
            type: "hands-on",
            summary: "Shrink bloated Node and Go images from 1.2GB down to 42MB using multi-stage builds and non-root users.",
            content: "Eliminate build dependencies from final runtime images for security and speed.",
          },
        ],
      },
      {
        _id: "mod-cloud-2",
        title: "Kubernetes Orchestration & Production Cluster Operations",
        description: "Deploy, scale, and manage containerized microservices across distributed nodes.",
        order: 2,
        lessons: [
          {
            _id: "les-cloud-201",
            title: "Pods, ReplicaSets, Deployments & Rolling Update Strategies",
            durationMinutes: 55,
            xpReward: 70,
            order: 1,
            type: "hands-on",
            summary: "Configure health checks (liveness/readiness probes) to ensure zero dropped connections during deploys.",
            content: "Write production Kubernetes YAML manifests with graceful shutdown hooks.",
          },
          {
            _id: "les-cloud-202",
            title: "Services, Nginx Ingress Controllers & Automated TLS with Cert-Manager",
            durationMinutes: 60,
            xpReward: 80,
            order: 2,
            type: "code-lab",
            summary: "Route internet traffic securely into your cluster with automatic Let's Encrypt SSL certificates.",
            content: "Configure ClusterIP, NodePort, and Ingress routing rules.",
          },
        ],
      },
      {
        _id: "mod-cloud-3",
        title: "Infrastructure as Code with Terraform & AWS Architecture",
        description: "Declare, version, and provision cloud resources reproducibly on AWS.",
        order: 3,
        lessons: [
          {
            _id: "les-cloud-301",
            title: "Terraform State Management, Locking & Modular Architecture",
            durationMinutes: 60,
            xpReward: 80,
            order: 1,
            type: "hands-on",
            summary: "Build reusable HCL infrastructure modules with remote state storage in encrypted AWS S3 buckets.",
            content: "Prevent state corruption using DynamoDB distributed state locking.",
          },
        ],
      },
    ],
  },
  {
    id: "data-science-ai",
    slug: "data-science-ai",
    title: "Data Science & Artificial Intelligence",
    shortTitle: "Data Science & AI",
    tagline: "Build machine learning models, neural networks, data pipelines, and production AI services with Python and PyTorch.",
    description:
      "A rigorous, hands-on path through exploratory data analysis, feature engineering, SQL analytics, classical machine learning algorithms, deep learning neural networks, and deploying models as scalable REST APIs.",
    category: "Data Science & AI",
    categoryKey: "ai",
    difficulty: "Advanced",
    estimatedWeeks: 14,
    liveSessionsCount: 24,
    mentorshipHours: 36,
    totalProjectsCount: 5,
    xpReward: 3500,
    featured: true,
    badgeColor: "warning",
    unsplashId: "photo-1555949963-aa79dcee981c",
    marketDemand: {
      rating: "Extremely High",
      growthMetric: "+68% global hiring surge for AI & Data specialists",
      salaryRange: "$45,000 - $115,000 / yr",
      summary: "AI automation and predictive intelligence have become the fastest-growing engineering focus in modern tech.",
      topHiringSectors: ["Fintech & Credit Scoring", "Healthcare AI", "Agricultural Tech", "Telecom Data Analytics"],
    },
    targetCareerRoles: [
      {
        role: "Machine Learning Engineer",
        type: "Primary Role",
        description: "Train, optimize, and serve machine learning and deep neural network models in production cloud APIs.",
        averageSalary: "$60,000 - $115,000",
        skillsMatched: ["Python", "PyTorch", "Scikit-Learn", "FastAPI", "MLflow", "Docker"],
      },
      {
        role: "Data Scientist & Analytics Lead",
        type: "Alternative Track",
        description: "Uncover predictive business insights, build statistical models, and design automated experimentation pipelines.",
        averageSalary: "$55,000 - $100,000",
        skillsMatched: ["Pandas", "NumPy", "Advanced SQL", "Tableau", "Hypothesis Testing"],
      },
      {
        role: "AI Application Specialist",
        type: "Specialized Focus",
        description: "Integrate LLMs, retrieval-augmented generation (RAG) vector stores, and custom fine-tuned multilingual NLP models.",
        averageSalary: "$62,000 - $118,000",
        skillsMatched: ["Hugging Face", "LangChain", "ChromaDB / Pinecone", "NLP", "FastAPI"],
      },
    ],
    prerequisites: [
      {
        skill: "Python Fundamentals",
        level: "Required",
        description: "Familiarity with data structures (lists, dicts), functions, and basic object-oriented concepts.",
      },
      {
        skill: "Basic High-School Mathematics & Statistics",
        level: "Recommended",
        description: "Basic probability, mean/variance, linear equations, and matrix multiplication concepts.",
      },
      {
        skill: "SQL Basics",
        level: "Helpful",
        description: "Basic SELECT, WHERE, and GROUP BY operations on tabular data.",
      },
    ],
    competencyGroups: [
      {
        category: "Data Wrangling & Analytics",
        skills: ["Pandas & NumPy", "Advanced SQL & Window Functions", "Exploratory Data Analysis (EDA)", "Feature Engineering & Imputation", "Data Visualization (Seaborn/Plotly)"],
      },
      {
        category: "Machine Learning Algorithms",
        skills: ["Linear & Logistic Regression", "Random Forests & XGBoost", "Clustering & PCA", "Cross-Validation & Hyperparameter Tuning", "ROC-AUC & Precision/Recall Metrics"],
      },
      {
        category: "Deep Learning & NLP",
        skills: ["PyTorch Tensors & Autograd", "Convolutional Neural Networks (CNNs)", "Transformers & Attention Mechanisms", "Hugging Face Models", "Tokenization & Embeddings"],
      },
      {
        category: "MLOps & Model Serving",
        skills: ["FastAPI Microservice Endpoints", "Model Serialization (ONNX/Joblib)", "MLflow Experiment Tracking", "Docker Containerization", "Data Drift Monitoring"],
      },
    ],
    tooling: [
      { name: "Python 3.12", category: "Runtime" },
      { name: "PyTorch", category: "AI & ML" },
      { name: "Scikit-Learn", category: "AI & ML" },
      { name: "Pandas & NumPy", category: "AI & ML" },
      { name: "FastAPI", category: "Framework" },
      { name: "PostgreSQL & DuckDB", category: "Database" },
      { name: "Hugging Face", category: "AI & ML" },
      { name: "MLflow", category: "Tooling" },
      { name: "JupyterLab", category: "Tooling" },
    ],
    capstones: [
      {
        id: "fintech-fraud-detector",
        title: "FinTech Fraud Detector & Real-Time Risk Engine",
        tagline: "Real-time transaction anomaly detector and credit risk scoring service powered by XGBoost and FastAPI.",
        description:
          "Train a high-precision gradient-boosted ensemble on millions of imbalanced financial transaction records. Deploy an ultra-low latency (<20ms) inference microservice with feature drift detection and automated risk alerts.",
        difficulty: "Production-Grade",
        estimatedHours: 40,
        techStack: ["Python", "XGBoost", "Scikit-Learn", "Pandas", "FastAPI", "Redis", "Docker"],
        architectureHighlights: [
          "SMOTE oversampling and cost-sensitive loss functions handling extreme 0.05% class imbalance",
          "Sub-15ms inference latency utilizing serialized ONNX runtime optimization",
          "Real-time rolling feature computation (hourly velocity, geo-distance anomaly) cached in Redis",
        ],
        deliverables: [
          "Jupyter EDA & model training notebook with full ROC-AUC evaluation curves",
          "Production FastAPI microservice container with OpenAPI swagger documentation",
          "Automated Locust load test validating 1,000+ requests per second",
        ],
        previewSnippet: {
          language: "python",
          filename: "inference/fraud_detector.py",
          code: `from fastapi import FastAPI, HTTPException
import joblib
import numpy as np
from pydantic import BaseModel

app = FastAPI(title="FinTech Fraud Detection Engine")
model = joblib.load("models/xgboost_fraud_v2.joblib")
scaler = joblib.load("models/feature_scaler.joblib")

class TransactionPayload(BaseModel):
    amount: float
    sender_age_days: int
    velocity_1hr: int
    is_foreign_ip: bool
    distance_from_home_km: float

@app.post("/api/v1/score-transaction")
def score_transaction(data: TransactionPayload):
    features = np.array([[
        data.amount,
        data.sender_age_days,
        data.velocity_1hr,
        1 if data.is_foreign_ip else 0,
        data.distance_from_home_km
    ]])
    scaled = scaler.transform(features)
    probability = float(model.predict_proba(scaled)[0][1])
    is_flagged = probability > 0.72
    return {"risk_score": round(probability * 100, 2), "flagged": is_flagged, "action": "BLOCK" if is_flagged else "APPROVE"}`,
        },
      },
      {
        id: "multilingual-nlp-assistant",
        title: "Amharic & Multilingual NLP Customer Assistant",
        tagline: "Fine-tuned transformer model for sentiment classification, semantic search, and customer intent categorization.",
        description:
          "Fine-tune a multilingual BERT transformer on local Ethiopian language customer transcripts. Implement a semantic retrieval engine with vector embeddings for instant automated customer inquiries.",
        difficulty: "Advanced",
        estimatedHours: 35,
        techStack: ["Python", "PyTorch", "Hugging Face Transformers", "ChromaDB", "FastAPI"],
        architectureHighlights: [
          "Custom byte-pair encoding tokenizer adaptations for Geez script orthography",
          "Vector similarity search indexing customer FAQs with cosine distance ranking",
          "Model quantization (INT8) reducing memory footprint by 65% on commodity servers",
        ],
        deliverables: [
          "Fine-tuned Hugging Face transformer checkpoint and evaluation metrics",
          "Vector-backed search API serving instant intent matches",
          "Interactive Streamlit demonstration interface",
        ],
        previewSnippet: {
          language: "python",
          filename: "nlp/sentiment_classifier.py",
          code: `from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

class MultilingualAssistant:
    def __init__(self, model_path="models/ethiotech-bert-base"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.model.eval()

    def predict_intent(self, text: str):
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
        with torch.no_grad():
            logits = self.model(**inputs).logits
            predicted_class = torch.argmax(logits, dim=1).item()
        return {"intent_id": predicted_class, "confidence": float(torch.softmax(logits, dim=1)[0][predicted_class])}`,
        },
      },
    ],
    modules: [
      {
        _id: "mod-ai-1",
        title: "Python for Data Science, Vectorized Math & Data Analytics",
        description: "Master Pandas, NumPy array operations, data cleaning, and statistical distributions.",
        order: 1,
        lessons: [
          {
            _id: "les-ai-101",
            title: "NumPy Vectorization & High-Performance Array Mathematics",
            durationMinutes: 50,
            xpReward: 60,
            order: 1,
            type: "hands-on",
            summary: "Eliminate Python for-loops using vectorized broadcasting and memory-efficient matrix operations.",
            content: "Learn how NumPy C-bindings accelerate data transformations by 100x.",
          },
          {
            _id: "les-ai-102",
            title: "Pandas Mastery: Aggregations, Missing Data & Time-Series Resampling",
            durationMinutes: 55,
            xpReward: 70,
            order: 2,
            type: "hands-on",
            summary: "Clean, filter, and restructure complex real-world datasets with multi-indexing and groupby operations.",
            content: "Transform messy real-world CSV and SQL dumps into clean analytical dataframes.",
          },
        ],
      },
      {
        _id: "mod-ai-2",
        title: "Supervised & Unsupervised Machine Learning Algorithms",
        description: "Train classification, regression, clustering, and ensemble models with Scikit-Learn.",
        order: 2,
        lessons: [
          {
            _id: "les-ai-201",
            title: "Classification Pipelines, Cross-Validation & Metric Evaluation",
            durationMinutes: 60,
            xpReward: 75,
            order: 1,
            type: "hands-on",
            summary: "Build Scikit-Learn Pipelines incorporating imputation, one-hot encoding, and feature scaling without data leakage.",
            content: "Analyze confusion matrices, Precision-Recall tradeoffs, and ROC curves.",
          },
          {
            _id: "les-ai-202",
            title: "Tree Ensembles: Gradient Boosting with XGBoost & LightGBM",
            durationMinutes: 65,
            xpReward: 85,
            order: 2,
            type: "code-lab",
            summary: "Tune hyperparameters using Bayesian optimization and interpret feature importance with SHAP values.",
            content: "Train industrial-grade decision tree ensembles on tabular data.",
          },
        ],
      },
      {
        _id: "mod-ai-3",
        title: "Deep Learning with PyTorch & Neural Network Foundations",
        description: "Build feedforward and convolutional neural networks from scratch using PyTorch tensors.",
        order: 3,
        lessons: [
          {
            _id: "les-ai-301",
            title: "PyTorch Autograd, Loss Functions & Backpropagation",
            durationMinutes: 60,
            xpReward: 80,
            order: 1,
            type: "code-lab",
            summary: "Understand computational graphs, gradient descent optimizers (AdamW), and learning rate schedulers.",
            content: "Write custom PyTorch training and validation loops with metric logging.",
          },
        ],
      },
    ],
  },
  {
    id: "cyber-security",
    slug: "cyber-security",
    title: "Cyber Security & Network Defense",
    shortTitle: "Cyber Security",
    tagline: "Learn ethical hacking, application security (AppSec), penetration testing, and enterprise defensive network hardening.",
    description:
      "A comprehensive security engineering track spanning network packet analysis, OWASP Top 10 web vulnerabilities, cryptography, threat hunting, secure coding practices, and incident response operations.",
    category: "Cyber Security",
    categoryKey: "cyber",
    difficulty: "Intermediate",
    estimatedWeeks: 12,
    liveSessionsCount: 20,
    mentorshipHours: 30,
    totalProjectsCount: 4,
    xpReward: 3100,
    featured: true,
    badgeColor: "purple",
    unsplashId: "photo-1550751827-4bd374c3f58b",
    marketDemand: {
      rating: "Extremely High",
      growthMetric: "+70% critical shortfall in certified security analysts",
      salaryRange: "$45,000 - $105,000 / yr",
      summary: "With financial institutions and government services moving online, application security and network defense professionals are fiercely recruited.",
      topHiringSectors: ["Commercial Banking", "Government & Defense", "Fintech Payment Gateways", "Enterprise IT"],
    },
    targetCareerRoles: [
      {
        role: "Application Security (AppSec) Engineer",
        type: "Primary Role",
        description: "Audit software codebases, conduct penetration testing, and build automated security guardrails into CI/CD.",
        averageSalary: "$58,000 - $105,000",
        skillsMatched: ["OWASP Top 10", "Burp Suite", "SAST/DAST", "JWT Security", "Secure Coding"],
      },
      {
        role: "SOC Analyst / Incident Responder",
        type: "Alternative Track",
        description: "Monitor SIEM telemetry, detect active network intrusions, analyze malicious payloads, and lead containment.",
        averageSalary: "$50,000 - $92,000",
        skillsMatched: ["Wireshark", "Suricata / Snort", "SIEM (Splunk/Elastic)", "Linux Forensics", "Threat Hunting"],
      },
      {
        role: "Penetration Tester / Ethical Hacker",
        type: "Specialized Focus",
        description: "Simulate real-world adversary tactics against infrastructure, identify zero-day exposures, and author remediation guides.",
        averageSalary: "$55,000 - $100,000",
        skillsMatched: ["Kali Linux", "Metasploit", "Nmap", "Privilege Escalation", "Python Exploit Dev"],
      },
    ],
    prerequisites: [
      {
        skill: "Networking Fundamentals (TCP/IP, DNS, HTTP)",
        level: "Required",
        description: "Solid grasp of how packets traverse networks, routing tables, and client-server handshakes.",
      },
      {
        skill: "Linux Shell & Scripting",
        level: "Required",
        description: "Comfortable managing permissions, processes, network sockets, and writing basic Bash/Python scripts.",
      },
      {
        skill: "Basic Web Development Concepts",
        level: "Helpful",
        description: "Understanding of cookies, sessions, HTTP headers, and database queries.",
      },
    ],
    competencyGroups: [
      {
        category: "Network Defense & Traffic",
        skills: ["Wireshark Packet Analysis", "Nmap Port Auditing", "Firewall Rules & iptables", "Intrusion Detection (Snort/Suricata)", "VPN & TLS Handshakes"],
      },
      {
        category: "Application Security (AppSec)",
        skills: ["OWASP Top 10 Mitigations", "SQL Injection & XSS Exploits", "CSRF & SSRF Protection", "Authentication Bypass Audits", "Burp Suite Interception"],
      },
      {
        category: "Cryptography & Auth",
        skills: ["Symmetric/Asymmetric Encryption (AES/RSA)", "Hashing & Salting (Argon2)", "PKI & Digital Signatures", "HMAC Verification"],
      },
      {
        category: "Incident Response & Forensics",
        skills: ["Log Aggregation & SIEM", "Memory Analysis (Volatility)", "Malware Sandboxing", "Root Cause Incident Reporting"],
      },
    ],
    tooling: [
      { name: "Wireshark", category: "Testing & Security" },
      { name: "Burp Suite Pro", category: "Testing & Security" },
      { name: "Kali Linux", category: "Runtime" },
      { name: "Nmap", category: "Testing & Security" },
      { name: "Metasploit", category: "Testing & Security" },
      { name: "OWASP ZAP", category: "Testing & Security" },
      { name: "OpenSSL", category: "Testing & Security" },
      { name: "Python Security Libs", category: "Runtime" },
    ],
    capstones: [
      {
        id: "incident-response-simulator",
        title: "Security Incident Response & Hardening Simulator",
        tagline: "Sandbox enterprise environment simulating multi-vector DDoS and credential-stuffing attacks with SIEM alert rules.",
        description:
          "Build and defend an isolated enterprise architecture. Configure Snort IDS alert rules, deploy automated IP blocking triggers against brute-force attempts, and generate comprehensive forensic audit reports.",
        difficulty: "Production-Grade",
        estimatedHours: 38,
        techStack: ["Linux", "Snort IDS", "Python", "Elasticsearch & Kibana", "iptables", "Docker"],
        architectureHighlights: [
          "Automated fail2ban and iptables rule dynamic generation upon detecting port scan thresholds",
          "Elastic SIEM log ingestion monitoring SSH, HTTP 401 spikes, and unauthorized sudo escalations",
          "Simulated adversary attack automation scripts validating defensive countermeasures",
        ],
        deliverables: [
          "Defensive hardening automation scripts",
          "Snort custom signature rule definitions",
          "Executive Incident Response & Forensic Timeline Report",
        ],
        previewSnippet: {
          language: "python",
          filename: "defense/honeypot_monitor.py",
          code: `import re
import subprocess
from collections import defaultdict

LOG_FILE = "/var/log/auth.log"
FAILED_THRESHOLD = 5
failed_attempts = defaultdict(int)

def block_ip(ip_address: str):
    print(f"[SECURITY ALERT] Blocking hostile IP: {ip_address}")
    subprocess.run(["iptables", "-A", "INPUT", "-s", ip_address, "-j", "DROP"], check=True)

def monitor_auth_stream():
    with open(LOG_FILE, "r") as f:
        for line in f:
            if "Failed password" in line:
                match = re.search(r"from (\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})", line)
                if match:
                    ip = match.group(1)
                    failed_attempts[ip] += 1
                    if failed_attempts[ip] >= FAILED_THRESHOLD:
                        block_ip(ip)`,
        },
      },
      {
        id: "enterprise-appsec-audit",
        title: "End-to-End Enterprise AppSec Penetration Audit",
        tagline: "Comprehensive penetration test and remediation PRs on a live banking prototype with full OWASP coverage.",
        description:
          "Perform a black-box and white-box penetration test against a mock banking portal. Exploit SQL injection, IDOR vulnerabilities, and broken access controls, authoring proof-of-concept exploits followed by hardened remediation patches.",
        difficulty: "Advanced",
        estimatedHours: 35,
        techStack: ["Burp Suite", "OWASP ZAP", "Python", "Node.js / Express", "PostgreSQL"],
        architectureHighlights: [
          "Parameterized query conversion eliminating SQL injection attack surfaces",
          "Cryptographic HMAC signing preventing URL tampering and IDOR access",
          "Strict Content Security Policy (CSP) headers stopping Cross-Site Scripting (XSS)",
        ],
        deliverables: [
          "Detailed Penetration Testing Report with CVSS risk scores",
          "Proof-of-concept exploit scripts",
          "Hardened git pull requests remediating every identified vulnerability",
        ],
        previewSnippet: {
          language: "typescript",
          filename: "security/hardenedAuthMiddleware.ts",
          code: `import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

export const apiSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'strict-dynamic'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  frameguard: { action: "deny" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many authentication attempts. Account locked for 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});`,
        },
      },
    ],
    modules: [
      {
        _id: "mod-cyb-1",
        title: "Network Security & Packet Traffic Inspection",
        description: "Master TCP/IP handshakes, Wireshark packet dissection, and port reconnaissance.",
        order: 1,
        lessons: [
          {
            _id: "les-cyb-101",
            title: "Wireshark Packet Analysis & Protocol Dissection",
            durationMinutes: 50,
            xpReward: 60,
            order: 1,
            type: "hands-on",
            summary: "Capture and analyze live network packets to identify plaintext credentials, DNS leaks, and suspicious ARP traffic.",
            content: "Learn how to use capture and display filters to isolate anomalous network streams.",
          },
          {
            _id: "les-cyb-102",
            title: "Network Reconnaissance with Nmap & Port Vulnerability Scanning",
            durationMinutes: 45,
            xpReward: 55,
            order: 2,
            type: "hands-on",
            summary: "Perform stealth SYN scans, service version detection, and OS fingerprinting safely.",
            content: "Understand the defensive perspective of closing exposed ports and configuring network firewalls.",
          },
        ],
      },
      {
        _id: "mod-cyb-2",
        title: "Web Application Security & OWASP Top 10 Defense",
        description: "Deep dive into SQLi, XSS, CSRF, SSRF, and broken access controls with hands-on lab exploits.",
        order: 2,
        lessons: [
          {
            _id: "les-cyb-201",
            title: "Intercepting & Modifying Traffic with Burp Suite",
            durationMinutes: 55,
            xpReward: 70,
            order: 1,
            type: "hands-on",
            summary: "Set up Burp proxy to intercept HTTP requests, manipulate parameters, and uncover hidden API routes.",
            content: "Master the Burp Repeater and Intruder modules for security auditing.",
          },
          {
            _id: "les-cyb-202",
            title: "Defeating Injection Attacks: SQLi, Command Injection & XSS",
            durationMinutes: 65,
            xpReward: 85,
            order: 2,
            type: "code-lab",
            summary: "Build exploit payloads in sandboxed environments and implement bulletproof defense with prepared statements and CSP.",
            content: "Analyze why sanitization alone fails and how structural separation prevents code execution.",
          },
        ],
      },
    ],
  },
  {
    id: "ui-ux-engineering",
    slug: "ui-ux-engineering",
    title: "UI/UX & Design Systems Engineering",
    shortTitle: "UI/UX Engineering",
    tagline: "Design world-class product interfaces in Figma and build scalable, token-driven accessible design systems in React.",
    description:
      "Bridge the gap between design and engineering. Master user research, wireframing, high-fidelity Figma components, design tokens, micro-interactions, WCAG 2.1 accessibility, and Storybook component documentation.",
    category: "UI/UX Engineering",
    categoryKey: "design",
    difficulty: "Beginner",
    estimatedWeeks: 10,
    liveSessionsCount: 18,
    mentorshipHours: 28,
    totalProjectsCount: 4,
    xpReward: 2800,
    featured: true,
    badgeColor: "cyan",
    unsplashId: "photo-1581291518857-4e27b48ff24e",
    marketDemand: {
      rating: "High",
      growthMetric: "+38% demand for hybrid Design Technologists",
      salaryRange: "$35,000 - $82,000 / yr",
      summary: "Modern software companies look for designers who write clean code and engineers who understand typography, color theory, and UX empathy.",
      topHiringSectors: ["Product Design Studios", "Fintech & Mobile Platforms", "SaaS Startups", "Consumer Tech"],
    },
    targetCareerRoles: [
      {
        role: "UI/UX Product Designer",
        type: "Primary Role",
        description: "Conduct user interviews, design user flows, and craft polished interactive mockups with auto-layout in Figma.",
        averageSalary: "$45,000 - $80,000",
        skillsMatched: ["Figma", "User Research", "Wireframing", "Prototyping", "Design Systems"],
      },
      {
        role: "Design Technologist / UI Engineer",
        type: "Alternative Track",
        description: "Implement design tokens, accessible React component libraries, Storybook documentation, and Framer Motion micro-interactions.",
        averageSalary: "$50,000 - $88,000",
        skillsMatched: ["React", "Storybook", "Tailwind CSS", "Design Tokens", "Radix UI", "WCAG 2.1"],
      },
      {
        role: "Accessibility & Frontend Consultant",
        type: "Specialized Focus",
        description: "Audit web applications for keyboard navigation, screen reader compliance, color contrast ratios, and internationalization.",
        averageSalary: "$48,000 - $84,000",
        skillsMatched: ["WCAG 2.1 AA/AAA", "Axe Core", "Semantic HTML", "ARIA Roles"],
      },
    ],
    prerequisites: [
      {
        skill: "Visual Empathy & Creativity",
        level: "Required",
        description: "Curiosity for user experience, clean visual layout, and intuitive interfaces.",
      },
      {
        skill: "Basic HTML & CSS",
        level: "Recommended",
        description: "Understanding of CSS box model, colors, fonts, and responsive display styles.",
      },
      {
        skill: "Figma Account",
        level: "Helpful",
        description: "Free Figma web/desktop account to participate in collaborative design sessions.",
      },
    ],
    competencyGroups: [
      {
        category: "Product & UX Research",
        skills: ["User Journey Mapping", "Information Architecture", "Usability Testing & Heuristics", "Wireframing & Low-Fi Prototyping"],
      },
      {
        category: "Figma & Visual Craft",
        skills: ["Auto-Layout 5.0", "Component Variants & Properties", "Design Variables & Token Modes", "Interactive Micro-Prototypes"],
      },
      {
        category: "Design Systems & Code",
        skills: ["Design Token Architecture (Style Dictionary)", "Headless UI Primitives (Radix)", "Tailwind Design System Tokens", "Storybook Component Specs"],
      },
      {
        category: "Motion & Accessibility",
        skills: ["Framer Motion Springs & Layout Animations", "WCAG 2.1 AA Compliance", "Keyboard Navigation Traps", "Screen Reader ARIA"],
      },
    ],
    tooling: [
      { name: "Figma", category: "Design & Prototyping" },
      { name: "FigJam", category: "Design & Prototyping" },
      { name: "Storybook", category: "Design & Prototyping" },
      { name: "Tailwind CSS", category: "Design & Prototyping" },
      { name: "Radix UI Primitives", category: "Framework" },
      { name: "Framer Motion", category: "Design & Prototyping" },
      { name: "Axe Core a11y", category: "Testing & Security" },
      { name: "Style Dictionary", category: "Tooling" },
    ],
    capstones: [
      {
        id: "scalable-design-system",
        title: "Scalable Enterprise Design System & Component Library",
        tagline: "Token-driven accessible React component library documented with Storybook, interactive variant states, and Figma token sync.",
        description:
          "Build a complete multi-brand design system from scratch. Defines semantic color tokens (light/dark/high-contrast), typographic hierarchies, button/input/modal variants, full keyboard navigation, and auto-generated Storybook docs.",
        difficulty: "Production-Grade",
        estimatedHours: 36,
        techStack: ["Figma", "React", "TypeScript", "Tailwind CSS", "Radix UI", "Storybook", "Framer Motion"],
        architectureHighlights: [
          "Design token architecture exported seamlessly from Figma variables into CSS custom properties",
          "100% WCAG 2.1 AA accessible with automated Axe-Core test runners on all Storybook stories",
          "Compound React components with full focus management and ARIA descriptions",
        ],
        deliverables: [
          "Complete Figma master component file with interactive prototyping states",
          "Published Storybook web documentation portal",
          "NPM-ready React component package with TypeScript declaration files",
        ],
        previewSnippet: {
          language: "typescript",
          filename: "components/Button.tsx",
          code: `import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(99,102,241,0.3)]",
        secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
        destructive: "bg-danger text-white hover:bg-danger/90",
        ghost: "hover:bg-white/5 text-[var(--text-secondary)] hover:text-white",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
});`,
        },
      },
      {
        id: "fintech-ux-case-study",
        title: "Pan-African Micro-Savings & Investment UX",
        tagline: "User research, wireframing, high-fidelity prototypes, and usability testing study for a multilingual financial app.",
        description:
          "Conduct user interviews, design user journey maps, wireframes, and interactive mobile prototypes for an accessible savings and micro-credit app tailored for Ethiopian and East African mobile money users.",
        difficulty: "Advanced",
        estimatedHours: 30,
        techStack: ["Figma", "FigJam", "Maze Usability Testing", "Framer Motion"],
        architectureHighlights: [
          "Bilingual Geez and English typography hierarchy with custom line-height balancing",
          "Frictionless 3-step KYC verification user flow minimizing onboarding drop-off",
          "Interactive Figma prototype with realistic keypad interactions and micro-animations",
        ],
        deliverables: [
          "Comprehensive UX Case Study deck including user personas and journey maps",
          "Complete high-fidelity Figma prototype link ready for user testing",
          "Usability test analysis report with actionable UX enhancements",
        ],
        previewSnippet: {
          language: "json",
          filename: "design-tokens/colors.json",
          code: `{
  "color": {
    "brand": {
      "primary": { "value": "#00D2FF", "type": "color" },
      "secondary": { "value": "#7B61FF", "type": "color" },
      "accent": { "value": "#00F5A0", "type": "color" }
    },
    "surface": {
      "base": { "value": "#050A14", "type": "color" },
      "card": { "value": "rgba(8, 14, 24, 0.95)", "type": "color" },
      "cardHover": { "value": "rgba(14, 24, 42, 0.95)", "type": "color" }
    }
  }
}`,
        },
      },
    ],
    modules: [
      {
        _id: "mod-ux-1",
        title: "UX Research, Information Architecture & Wireframing",
        description: "Learn user persona formulation, heuristic evaluations, and structural wireframe layout.",
        order: 1,
        lessons: [
          {
            _id: "les-ux-101",
            title: "User Research Methodologies & Persona Synthesis",
            durationMinutes: 45,
            xpReward: 55,
            order: 1,
            type: "concept",
            summary: "Conduct qualitative user interviews and synthesize insights into actionable empathy maps and jobs-to-be-done.",
            content: "Learn how to uncover core user frustrations and convert them into design opportunities.",
          },
          {
            _id: "les-ux-102",
            title: "Information Architecture, User Flows & Low-Fi Wireframing",
            durationMinutes: 50,
            xpReward: 65,
            order: 2,
            type: "hands-on",
            summary: "Map digital user journeys and sketch rapid low-fidelity layouts before touching high-fidelity tools.",
            content: "Master information hierarchy and mental model alignment.",
          },
        ],
      },
      {
        _id: "mod-ux-2",
        title: "Figma Mastery: Auto-Layout, Variables & Component Sets",
        description: "Master modern Figma tools to craft production-ready UI mockups and design token architectures.",
        order: 2,
        lessons: [
          {
            _id: "les-ux-201",
            title: "Figma Auto-Layout 5.0 & Responsive Component Constraints",
            durationMinutes: 55,
            xpReward: 70,
            order: 1,
            type: "hands-on",
            summary: "Build flexible components that respond perfectly across mobile, tablet, and desktop screen widths.",
            content: "Understand flex wrapping, absolute positioning, and min/max dimension constraints in Figma.",
          },
          {
            _id: "les-ux-202",
            title: "Figma Variables, Token Modes & Dark/Light Theme Switching",
            durationMinutes: 60,
            xpReward: 80,
            order: 2,
            type: "code-lab",
            summary: "Create semantic color and spacing variables to support instant theme switching across entire page designs.",
            content: "Connect design variables directly with developer CSS token definitions.",
          },
        ],
      },
    ],
  },
];

export function getCatalogTrackByIdOrSlug(idOrSlug: string): TrackCatalogItem | undefined {
  const normalized = idOrSlug.toLowerCase().trim();
  return TRACKS_CATALOG.find(
    (t) =>
      t.id.toLowerCase() === normalized ||
      t.slug.toLowerCase() === normalized ||
      t.categoryKey.toLowerCase() === normalized ||
      t.shortTitle.toLowerCase().includes(normalized) ||
      t.title.toLowerCase().includes(normalized)
  );
}

export function enrichTrackWithCatalog(backendTrack: { _id?: string; title?: string; category?: string; [key: string]: unknown }): TrackCatalogItem {
  const match =
    (backendTrack._id && getCatalogTrackByIdOrSlug(backendTrack._id)) ||
    (backendTrack.title && getCatalogTrackByIdOrSlug(backendTrack.title)) ||
    (backendTrack.category && getCatalogTrackByIdOrSlug(backendTrack.category)) ||
    TRACKS_CATALOG[0];

  return {
    ...match,
    id: backendTrack._id || match.id,
  };
}
