# EthioTech Copy Deck (Master Text In Reading Order)

This copy deck records all final, approved user-facing text across every page and component on the EthioTech platform. All text follows the constraints:
- Hero headline: 4–9 words
- Subheadline: max 20 words
- Section heading: 2–6 words
- Card title: 2–5 words
- Card description: max 15 words
- Button label: 1–3 words, starts with a verb, no punctuation
- Error/empty state: max 12 words, action-oriented

---

## 1. Landing Page (`HomePage.tsx`)

### Hero Section
- **Badge**: `Engineering Education for Ethiopia`
- **Headline**: `Code Production Software with Senior Diaspora Mentors`
- **Subheadline**: `Structured learning tracks, live code reviews from diaspora engineers, and solar-powered hubs across six Ethiopian cities.`
- **Primary CTA**: `Start Free`
- **Secondary CTA**: `View Tracks`
- **Trust Point 1**: `Tuition-Free Access`
- **Trust Point 2**: `Low-Bandwidth Classrooms`
- **Trust Point 3**: `Verified GitHub Portfolios`

### Impact Metrics Bar
- **Metric 1**: `12,500+` · `Active Learners` · `Secondary to University`
- **Metric 2**: `45,000+` · `Mentorship Hours` · `Live Pair Sessions`
- **Metric 3**: `6 Hubs` · `Regional Tech Hubs` · `Six Physical Centers`
- **Metric 4**: `94.2%` · `Capstone Approval` · `Audited Code Reviews`
- **Architecture Highlights**: `Core Learning Stack`: `WebRTC Classrooms`, `In-Browser Workspace`, `Peer Squads`, `Audited Certificates`, `Regional Hubs`

### Platform Features Showcase
- **Badge**: `Platform Features`
- **Headline**: `Everything Needed to Ship Production Code`
- **Subheadline**: `Built for Ethiopian engineers: live diaspora classrooms, in-browser Linux workspaces, peer squads, and employer-verified certificates.`
- **Showcase Tabs**:
  1. `Live Classroom`: "Sub-150ms Low-Bandwidth WebRTC for Reliable Live Learning"
  2. `In-Browser Workspace`: "Zero-Setup Linux Development Environment in Your Browser"
  3. `Peer Squads`: "Four-Person Agile Squads with Weekly Code Reviews"
  4. `Certificates`: "Verifiable Credentials Linked Directly to Audited Code"
- **Showcase Primary CTA**: `Start Learning`
- **Showcase Secondary CTA**: `View Workflow`

### Structured Tracks
- **Badge**: `Structured Tracks`
- **Headline**: `Curriculums Built for Production Engineering`
- **Subheadline**: `Step-by-step pathways taking learners from foundational coding to shipping production systems.`
- **Filter Tabs**: `All Tracks`, `Fullstack Web`, `Mobile Apps`, `Cloud & DevOps`, `Data & AI`, `Cyber Security`
- **Card CTA**: `Enroll`
- **Section CTA**: `View Tracks`

### Diaspora Mentors Spotlight
- **Badge**: `Diaspora Mentors`
- **Headline**: `Learn Directly From Diaspora Engineers`
- **Subheadline**: `Direct access to Ethiopian staff engineers, architects, and technical founders from Silicon Valley, Europe, and leading local enterprises.`
- **Primary CTA**: `View Mentors`
- **Secondary CTA**: `Apply to Mentor`

### Regional Tech Hubs
- **Badge**: `Regional Tech Hubs`
- **Headline**: `Six Regional Hubs Powering Nationwide Access`
- **Subheadline**: `Physical learning centers in six Ethiopian cities with high-speed internet, power backup, Linux workstations, and on-site community leads.`
- **Hub Card**: `Regional Hackathons & Sprints`
- **Hub Card Description**: `Weekly in-person sprint demos, hackathons, coding competitions, and mentor office hours across all six national hubs.`
- **Section CTA**: `View Hubs`

### Ecosystem Partners
- **Label**: `Ecosystem Partners`

### Bottom Banner CTA
- **Badge**: `Applications Open`
- **Headline**: `Build Ethiopia's Next Engineering Generation`
- **Subheadline**: `Join 12,500+ developers mastering real-world software engineering with live senior mentorship, cloud sandboxes, and direct hiring pathways.`
- **Primary CTA**: `Start Free`
- **Secondary CTA**: `Apply to Mentor`

## 2. Navigation, Brand & Footer

### Navigation Bar (`Navbar.tsx`)
- **Nav Links**: `Tracks`, `How It Works`, `Mentors`, `Hubs`, `About`
- **Logged Out Actions**: `Sign in`, `Start Free`
- **Logged In Actions**: `Dashboard` (desktop) / `Open Dashboard` (mobile)

### Brand Logo (`Logo.tsx`)
- **Wordmark**: `EthioTech`
- **Subtitle Fallback**: `East Africa` (removed framework mention `PISTELS`)

### Footer (`Footer.tsx`)
- **Brand Subtitle**: `East Africa`
- **Mission / Description**: `Tuition-free software engineering education for Ethiopia: live diaspora mentorship, in-browser Linux environments, peer squads, and regional tech hubs.`
- **Platform Column**: `Tracks`, `How It Works`, `Mentors`, `Tech Hubs`, `Leaderboard`, `Apply to Mentor`
- **Ecosystem Column**: `Partners`, `Giving`, `FAQ`, `Contact`
- **Company Column**: `About`, `Privacy`, `Terms`
- **Status Indicator**: `All Systems Operational`
- **Copyright**: `© 2026 EthioTech Platform`
- **Tagline**: `Engineered for Ethiopian developers`

---

## 3. Public Marketing & Informational Pages

### Curriculum Catalog (`TracksPage.tsx`)
- **Headline**: `Master Production Software Engineering`
- **Subheadline**: `Structured tracks designed by senior engineers. Build real-world systems, pass code reviews, and earn verifiable credentials.`
- **Filter Tabs**: `All Tracks`, `Fullstack Web`, `Mobile Apps`, `Cloud & DevOps`, `Data & AI`, `Cyber Security`
- **Track Card Actions**: `View Track`, `Enroll Now`
- **Empty State**: `No tracks found` · `Adjust your search filter to view other tracks.`
- **Bottom Banner**: `Start Your Engineering Pathway` · `Enroll Free`

### Track Detail Page (`MarketingTrackDetailPage.tsx`)
- **Back Navigation**: `All Tracks`
- **Sidebar Action**: `Enroll Now`
- **Bottom CTA**: `Ready to Start Building?` · `Enroll Now`

### How It Works (`HowItWorksPage.tsx`)
- **Headline**: `From First Commit to Production Engineering`
- **Subheadline**: `From baseline calibration to diaspora pairing, sandbox development, squad code defense, and verified career placement.`
- **Primary CTA**: `Start Free`
- **Secondary CTA**: `Explore Stages`
- **Student Persona**: `Enroll Free`
- **Mentor Persona**: `Guide Emerging Engineers` · `Become a Mentor`
- **Closing CTAs**: `Enroll Now`, `View Leaderboard`, `Become a Mentor`

### Mentor Network & Directory (`MentorsPage.tsx`)
- **Headline**: `Learn Directly From Working Engineers`
- **Subheadline**: `Over 250 Ethiopian tech leads and senior engineers at top global and African tech firms conduct weekly live reviews.`
- **CTAs**: `Apply to Mentor`, `Browse Directory`
- **Empty State**: `No mentors registered yet` · `Check back soon as our mentor network expands.`
- **Bottom CTA**: `Are You a Senior Engineer?` · `Apply to Mentor`, `View Workflow`

### Mentor Recruitment (`MentorRecruitmentPage.tsx`)
- **Headline**: `Guide Ethiopia's Emerging Software Architects`
- **Subheadline**: `Join senior engineers and architects guiding ambitious Ethiopian developers through structured code reviews, system design, and career placement.`
- **Hero CTAs**: `Apply to Mentor`, `View Onboarding`
- **Form Submit**: `Submit Application`
- **Bottom CTA**: `Apply to Mentor`

### Regional Tech Hubs (`HubsPage.tsx`)
- **Headline**: `Physical Tech Hubs Powering Nationwide Access`
- **Subheadline**: `Reserve developer workstations, consult on-duty mentors, access offline LAN caches, and earn XP across six national innovation corridors.`
- **Hero CTAs**: `Explore Hubs`, `View Passes (0)`
- **Check-in Action**: `Check In`
- **Bottom CTA**: `Partner With Us`

### About Us (`AboutPage.tsx`)
- **Headline**: `Engineering Education Built for Ethiopian Developers`
- **Subheadline**: `Tuition-free learning combining diaspora mentorship, in-browser Linux environments, peer code reviews, and physical regional hubs across Ethiopia.`
- **Hero CTAs**: `Start Free`, `View Architecture`
- **Core Pillars**: `Engineering Mission`, `Long-Term Vision`
- **Closing CTAs**: `Enroll Free`, `View Workflow`

### Leaderboard (`LeaderboardPage.tsx`)
- **Headline**: `National Engineering Contributor Index`
- **Subheadline**: `Real-time engineering rankings based on validated code commits, capstone reviews, and peer mentorship across all active tracks.`
- **Empty State**: `No learners ranked yet` · `Enroll Free`
- **Pagination Action**: `Load More`

### Institutional Partners (`PartnersPage.tsx`)
- **Headline**: `Building Ethiopia's Digital Economy Through Strategic Alliances`
- **Subheadline**: `We partner with tech employers, universities, and public institutions to train production software engineers across Ethiopia.`
- **Form Submit**: `Submit Inquiry`
- **Bottom CTA**: `View Workflow`

### Sponsorship & Giving (`DonationPage.tsx`)
- **Headline**: `Fund Ethiopian Developers Through Sovereign Education`
- **Subheadline**: `Directly fund student scholarships, regional solar hubs, and hardware distribution across Ethiopia with transparent milestone verification.`
- **CTAs**: `Sponsor Student`, `View Frameworks`

### Help & Inquiries (`InfoPages.tsx`)
- **FAQ Primary CTA**: `Enroll Free`
- **Contact Submit**: `Send Message`

---

## 4. Student App Experience

### Student Dashboard (`StudentDashboardPage.tsx`)
- **Greeting**: `Hello, {firstName}`
- **Subtitle**: `Pick up where you left off and complete your daily coding milestone.`
- **Projects Card**: `Assigned Projects & Portfolios` · `View All`
- **Hub Actions**: `Check In`, `Switch Workstation`
- **Reward Action**: `Claim Reward`
- **Squad Actions**: `Open Squad`, `Join Squad`

### Progress & Portfolio (`ProgressPage.tsx`)
- **Standings Link**: `View Standings`
- **Track Link**: `Open Track`
- **Certificate Action**: `Download PDF`
- **Empty States**:
  - `No certificates issued yet` · `Complete all curriculum modules and capstone projects in an enrolled track to earn verified credentials.` (Action: `Explore Tracks`)
  - `No submitted projects yet` · `Your submitted project code and mentor evaluations will appear here once reviewed.` (Action: `View Tasks`)

### Notifications (`NotificationsPage.tsx`)
- **Header Actions**: `Mark All Read`
- **Item Actions**: `Open Item`, `Mark Read`
- **Empty States**:
  - `All caught up` · `Session updates, mentor feedback, and badge alerts will appear here.` (Action: `Open Dashboard`)
  - `No unread updates` · `You have caught up with all live notifications.`
  - `No past notifications` · `Read items will appear here for archival reference.`

### Certificates (`CertificatesPage.tsx`)
- **Download Action**: `Download Certificate`
- **Empty State**: `No certificates yet` · `Finish a learning track and earn mentor verification to unlock certificates.` (Action: `View Tracks`)

### Assigned Projects (`AssignedProjectsPage.tsx`)
- **Actions**: `View Submission`, `Read Feedback`, `Submit Work`, `Open Track`
- **Empty State**: `No projects yet` · `Enroll in a learning track to see your projects and assignments here.` (Action: `Browse Tracks`)

### Project Submission (`ProjectSubmitPage.tsx`)
- **Submit Action**: `Submit Project`
- **Checklist Title**: `Submission Checklist`
- **Empty State**: `No assigned projects yet` · `Enroll in a track to unlock project assignments and mentor reviews.` (Action: `Browse Tracks`)

### Session Feedback (`SessionFeedbackPage.tsx`)
- **Confirmation Title**: `Feedback Received`
- **Actions**: `View Sessions`, `Open Dashboard`, `All Sessions`, `Submit Feedback`

### Squad Hub & Rooms (`SquadsListPage.tsx`, `SquadPage.tsx`)
- **List Actions**: `Open Squad`
- **Room Actions**: `View Squads`, `View All`, `Open Projects`, `Browse Tracks`
- **Empty States**:
  - `No squads yet` · `Enroll in a track to join a squad and collaborate with peers.` (Action: `Browse Tracks`)
  - `Squad not found` · `Choose a squad from your collaboration list.` (Action: `View Squads`)
  - `No upcoming sessions` · `Sessions will appear here once scheduled.`

### Session History & Classroom (`SessionHistoryPage.tsx`)
- **Actions**: `Leave Feedback`, `Join Waitlist`, `Enter Room`
- **Empty States**:
  - `No sessions yet` · `Live sessions will appear here once your mentor schedules them.`
  - `No recordings yet` · `Recordings will appear here once your mentor publishes them.`

### Learning Tracks & Lessons (`TracksPage.tsx`, `TrackDetailPage.tsx`, `LessonPage.tsx`)
- **Track Card**: `Start Track`, `Resume Track`, `Review Track`
- **Track Detail**: `All Tracks`, `Resume Track`, `Open Lab`
- **Lesson Actions**: `Consult Mentor`, `Mark Complete`, `Next Lesson`, `View Track`

### User Profile & Settings (`ProfilePage.tsx`, `SettingsPage.tsx`)
- **Profile Navigation**: `View Track`, `Browse Tracks`, `View All`, `Edit Settings`, `Open Dashboard`, `View Certificates`, `Manage Settings`
- **Settings Actions**: `Sign Out`, `Clear Image`, `Reset Avatar`, `Save Profile`, `Update Password`

---

## 5. Mentor & Admin Consoles

### Mentor Dashboard (`MentorDashboardPage.tsx`)
- **Action Buttons**: `Open Control Center`, `Schedule Session`, `Review Queue`
- **Queue Action**: `View All`
- **Sessions Queue**: `Open Workspace`

### Admin Management Console (`AdminPage.tsx`)
- **Action Buttons**: `Sync Data`, `View Operations`, `Review Applications`, `Manage Users`

---

## 6. Authentication, Error & Recovery States

### Authentication (`LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `ActivateAccountPage.tsx`)
- **Sign In CTA**: `Sign In`
- **Register CTA**: `Create Account`
- **Mentor Recruitment Link**: `Apply as Mentor`
- **Forgot Password CTA**: `Send Reset Link`
- **Reset Password CTAs**: `Request Reset Link`, `Save New Password`
- **Activate Account CTA**: `Activate Account`

### 404 Error Recovery (`NotFoundPage.tsx`)
- **Title**: `404 Error` · `Page Not Found`
- **Description**: `The page you requested does not exist or has moved.`
- **Action Buttons**: `Go Back`, `Go Home`
- **Navigation Shortcuts**: Role-tailored direct links (`Dashboard`, `Tracks`, `Sessions`, `Projects`, `Messages`)
