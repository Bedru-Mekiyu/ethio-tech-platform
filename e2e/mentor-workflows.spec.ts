import { test, expect } from "@playwright/test";

const mockMentorDashboard = {
  success: true,
  data: {
    mentor: {
      _id: "mentor-qa-1",
      fullName: "Dr. Selamawit Tekle",
      mentorScore: 98,
      totalSessions: 42,
    },
    upcomingSessions: [
      {
        _id: "demo-session-123",
        title: "Distributed Microservices Architecture",
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
    ],
    mySessions: [],
    contributionMetrics: { quality: 98 },
  },
};

const mockControlData = {
  success: true,
  data: {
    overview: {
      liveParticipants: 18,
      waitingParticipants: 2,
      sessionDuration: 45,
      attendancePercent: 92,
      engagementScore: 88,
      questionsWaiting: 3,
      raisedHands: 1,
      activePolls: 1,
      chatActivity: 25,
    },
    participants: [
      {
        id: "p-1",
        userId: "u-1",
        name: "Abebe Kebede",
        role: "student",
        status: "active",
        attendanceDuration: 40,
        joinedAt: new Date().toISOString(),
        verifiedAttendance: true,
      },
    ],
    waitingQueue: [
      {
        id: "wq-1",
        userId: "u-2",
        name: "Tigist Alemu",
        joinedAt: new Date().toISOString(),
      },
    ],
    raisedHands: [
      {
        userId: "u-1",
        name: "Abebe Kebede",
        queuePosition: 1,
        raisedAt: new Date().toISOString(),
      },
    ],
    questions: [
      {
        id: "q-1",
        userId: "u-1",
        studentName: "Abebe Kebede",
        text: "How do we handle idempotency in message queues?",
        status: "open",
        isPinned: false,
        upvoteCount: 5,
        createdAt: new Date().toISOString(),
      },
    ],
    polls: [
      {
        id: "poll-1",
        question: "Which database would you choose for high-write throughput?",
        type: "single",
        status: "active",
        options: [
          { index: 0, text: "PostgreSQL", voteCount: 8, percentage: 53 },
          { index: 1, text: "Cassandra", voteCount: 7, percentage: 47 },
        ],
        totalVotes: 15,
        createdAt: new Date().toISOString(),
      },
    ],
    engagementScores: [],
  },
};

test.describe("Mentor Workflows", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API routes
    await page.route("**/api/v1/dashboard/mentor", async (route) => {
      await route.fulfill({ json: mockMentorDashboard });
    });
    await page.route("**/api/v1/mentor/sessions/*/control-center", async (route) => {
      await route.fulfill({ json: mockControlData });
    });
    await page.route("**/api/v1/sessions/*", async (route) => {
      if (route.request().url().includes("/notes")) {
        await route.fulfill({
          json: {
            success: true,
            data: {
              notes: {
                content: "Lecture notes for distributed systems",
                currentVersion: 1,
                isPublished: false,
              },
            },
          },
        });
      } else {
        await route.fulfill({
          json: {
            success: true,
            data: {
              session: {
                _id: "demo-session-123",
                title: "Distributed Microservices Architecture",
                scheduledAt: new Date(Date.now() + 86400000).toISOString(),
                status: "active",
                durationMinutes: 60,
                maxParticipants: 50,
                mentor: {
                  _id: "mentor-qa-1",
                  fullName: "Dr. Selamawit Tekle",
                },
              },
            },
          },
        });
      }
    });
    await page.route("**/api/v1/sessions", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            sessions: [
              {
                _id: "demo-session-123",
                title: "Distributed Microservices Architecture",
                scheduledAt: new Date(Date.now() + 86400000).toISOString(),
                status: "active",
                durationMinutes: 60,
                maxParticipants: 50,
              },
            ],
          },
        },
      });
    });
    await page.route("**/api/v1/meetings/**", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            sessionId: "demo-session-123",
            status: "in-progress",
            hostJoined: true,
            presenceCount: 18,
            joinable: true,
            startsInMs: null,
            endsAt: null,
            meetings: [],
            meeting: {
              id: "demo-session-123",
              sessionId: "demo-session-123",
              title: "Distributed Microservices Architecture",
              status: "in-progress",
              hostJoined: true,
              presenceCount: 18,
              joinable: true,
              isHost: true,
              isAdmin: false,
              isParticipant: true,
            },
          },
        },
      });
    });
    await page.route("**/api/v1/submissions/queue", async (route) => {
      await route.fulfill({ json: { success: true, data: [] } });
    });

    await page.addInitScript(() => {
      localStorage.setItem(
        "ethiotech-auth",
        JSON.stringify({
          state: {
            user: {
              id: "mentor-qa-1",
              fullName: "Dr. Selamawit Tekle",
              email: "mentor@ethiotech.com",
              role: "mentor",
              mentorStatus: "approved",
              onboardingCompleted: true,
              isVerified: true,
            },
            accessToken: "mock-mentor-token",
            hydrated: true,
          },
          version: 0,
        }),
      );
    });
    await page.goto("/mentor");
  });

  test("Mentor dashboard loads with correct metrics", async ({ page }) => {
    await expect(page.locator("text=Mentor Command Center")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Mentor Rating")).toBeVisible();
    await expect(page.locator("text=98/100")).toBeVisible();
  });

  test("Mentor can navigate to sessions page", async ({ page }) => {
    await page.click('a[href="/mentor/sessions"]');
    await expect(page).toHaveURL(/\/mentor\/sessions/);
  });

  test("Mentor can navigate to control center for live session", async ({ page }) => {
    await page.goto("/mentor/control-center/demo-session-123");
    await expect(page.locator("text=Mentor OS Control Center")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Waiting Room").first()).toBeVisible();
  });

  test("Mentor can view Polls tab in Control Center", async ({ page }) => {
    await page.goto("/mentor/control-center/demo-session-123");
    await page.click('button[role="tab"]:has-text("Polls")');
    await expect(page.locator("text=Which database would you choose")).toBeVisible();
  });

  test("Mentor can view Q&A tab in Control Center", async ({ page }) => {
    await page.goto("/mentor/control-center/demo-session-123");
    await page.click('button[role="tab"]:has-text("Q&A")');
    await expect(page.locator("text=How do we handle idempotency")).toBeVisible();
  });

  test("Mentor can view Participants tab in Control Center", async ({ page }) => {
    await page.goto("/mentor/control-center/demo-session-123");
    await page.click('button[role="tab"]:has-text("Participants")');
    await expect(page.locator("text=Abebe Kebede").first()).toBeVisible();
  });

  test("Mentor can view Class Notes tab in Control Center", async ({ page }) => {
    await page.goto("/mentor/control-center/demo-session-123");
    await page.click('button[role="tab"]:has-text("Class Notes")');
    await expect(page.locator("text=Interactive Session Notes")).toBeVisible();
  });

  test("Mentor can view Engagement tab in Control Center", async ({ page }) => {
    await page.goto("/mentor/control-center/demo-session-123");
    await page.click('button[role="tab"]:has-text("Engagement")');
    await expect(page.locator("text=Live Engagement Leaderboard")).toBeVisible();
  });
});
