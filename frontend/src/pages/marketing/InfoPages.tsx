import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Section = {
  title: string;
  body: string;
  bullets?: string[];
};

type PageProps = {
  title: string;
  intro: string;
  sections: Section[];
  primary?: { to: string; label: string };
  secondary?: { to: string; label: string };
};

function InfoPage({ title, intro, sections, primary, secondary }: PageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-4 text-[var(--text-secondary)]">{intro}</p>
        {(primary || secondary) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {primary && (
              <Link to={primary.to}>
                <Button>{primary.label}</Button>
              </Link>
            )}
            {secondary && (
              <Link to={secondary.to}>
                <Button variant="outline">{secondary.label}</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title} className="h-full">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">{section.body}</p>
            {section.bullets && (
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export function FaqPage() {
  return (
    <InfoPage
      title="Answers for learners, mentors, and partners"
      intro="Everything people usually ask before joining EthioTech: how onboarding works, what support looks like, and how the virtual classroom stays safe."
      primary={{ to: "/register", label: "Join the platform" }}
      secondary={{ to: "/contact", label: "Contact support" }}
      sections={[
        {
          title: "Who can join?",
          body: "Students, mentors, parents, and school partners can all join with role-specific access.",
        },
        {
          title: "How does learning work?",
          body: "Learners move through tracks, sessions, and projects while earning XP and badges.",
        },
        {
          title: "How are live sessions handled?",
          body: "Mentors create sessions, students join with protected access, and the classroom syncs over Socket.IO.",
        },
        {
          title: "Is mobile supported?",
          body: "Yes. The UI is designed to stay usable on phones, tablets, and low-bandwidth connections.",
        },
        {
          title: "Can mentors recruit students?",
          body: "Mentors can run sessions and guide cohorts; the platform is built for mentorship-led progression.",
        },
        {
          title: "How do we stay safe?",
          body: "Protected routes, role checks, rate limiting, and audit-friendly APIs help keep access controlled.",
        },
      ]}
    />
  );
}

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { submitContact } = await import("@/services/contactService");
      await submitContact({ name, email, message });
      setSent(true);
    } catch {
      setError("Could not send message. Try again or email support@ethiotech.org.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
      <h1 className="text-3xl font-bold">Talk to the EthioTech team</h1>
      <p className="mt-4 text-[var(--text-secondary)]">
        Learner support, mentor onboarding, partnerships, and school coordination.
      </p>
      {sent ? (
        <Card className="mt-8 p-6">
          <p className="font-medium text-success">Message received. We will respond soon.</p>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm">
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Message
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit">Send message</Button>
        </form>
      )}
    </div>
  );
}

export function CommunityPage() {
  return (
    <InfoPage
      title="Learn together"
      intro="Peer squads, mentor rooms, and shared projects keep learners moving while making the platform feel alive."
      primary={{ to: "/register", label: "Join a cohort" }}
      sections={[
        {
          title: "Peer squads",
          body: "Small groups support daily accountability, coding practice, and project delivery.",
        },
        { title: "Mentor rooms", body: "Mentors can host live sessions, office hours, and review checkpoints." },
        { title: "Collaborative missions", body: "Challenge-based activities encourage teamwork and shared XP gains." },
        {
          title: "Community safety",
          body: "Moderation and reporting flows are expected for every public discussion space.",
        },
      ]}
    />
  );
}

export function ResourcesPage() {
  return (
    <InfoPage
      title="Reusable learning material for every stage"
      intro="Keep students moving with guides, lesson summaries, exercises, and practical project references."
      primary={{ to: "/how-it-works", label: "See the learning flow" }}
      sections={[
        {
          title: "Beginner guides",
          body: "Simple onboarding docs help new learners understand the platform and their next step.",
        },
        {
          title: "Curriculum notes",
          body: "Structured resources keep lessons, modules, and project milestones aligned.",
        },
        {
          title: "Practice kits",
          body: "Sample exercises and project starters reduce friction for hands-on learning.",
        },
        { title: "Mentor playbooks", body: "Mentors need repeatable session formats and feedback templates." },
      ]}
    />
  );
}

export function SupportPage() {
  return (
    <InfoPage
      title="Help fund, equip, and scale the learning network"
      intro="Support can mean donations, devices, school partnerships, volunteer mentoring, or sponsoring a learner."
      primary={{ to: "/contact", label: "Partner with us" }}
      sections={[
        { title: "Donate", body: "Fund scholarships, classroom access, and platform expansion." },
        {
          title: "Sponsor a school",
          body: "Help a partner school launch a hub with the right equipment and mentoring.",
        },
        { title: "Volunteer", body: "Mentors and engineers can contribute sessions, code reviews, and coaching." },
        { title: "Equip learners", body: "Devices, connectivity, and shared lab resources remove access barriers." },
      ]}
    />
  );
}

export function MentorRecruitmentPage() {
  return (
    <InfoPage
      title="Recruit mentors who can actually move learners forward"
      intro="The platform is designed to help mentors run sessions, review submissions, and guide real progression."
      primary={{ to: "/mentor-recruitment", label: "Apply as a mentor" }}
      secondary={{ to: "/community", label: "See the community" }}
      sections={[
        { title: "What mentors do", body: "Mentors host live sessions, review projects, and give targeted feedback." },
        {
          title: "Why they stay",
          body: "Clear dashboards, visible impact, and learner outcomes make the role rewarding.",
        },
        {
          title: "What to look for",
          body: "Strong communication, practical engineering experience, and a willingness to coach.",
        },
        {
          title: "Onboarding",
          body: "Mentor access should include scheduling, live classroom access, and performance analytics.",
        },
      ]}
    />
  );
}

export function SuccessStoriesPage() {
  return (
    <InfoPage
      title="Student progress and outcomes"
      intro="Real stories from students and mentors using the platform to build skills and ship projects."
      primary={{ to: "/leaderboard", label: "View the leaderboard" }}
      sections={[
        {
          title: "Learning progression",
          body: "Students move from first lesson to completed projects with mentor guidance at each step.",
        },
        {
          title: "Mentor impact",
          body: "Mentors see how their sessions and feedback affect student outcomes over time.",
        },
        {
          title: "Peer collaboration",
          body: "Squads and cohorts help students stay accountable and learn from each other.",
        },
      ]}
    />
  );
}

export function EventsPage() {
  return (
    <InfoPage
      title="Live events and activities"
      intro="Workshops, demo days, mentor clinics, and seasonal challenges give learners a reason to return."
      primary={{ to: "/register", label: "Join an event stream" }}
      sections={[
        { title: "Weekly workshops", body: "Short, focused sessions help students keep moving every week." },
        { title: "Demo days", body: "Projects should be shown publicly so learners can celebrate progress." },
        { title: "Mentor clinics", body: "Office hours make it easier to unblock students before they stall." },
        { title: "Seasonal challenges", body: "Time-boxed events create urgency and retention loops." },
      ]}
    />
  );
}

export function PrivacyPage() {
  return (
    <InfoPage
      title="How learner data is handled"
      intro="Protecting student and mentor data is part of the platform promise, not an afterthought."
      sections={[
        { title: "Access control", body: "Role-based permissions limit what each user can see and edit." },
        { title: "Session security", body: "Live classroom access should be short-lived and validated server-side." },
        { title: "Data minimization", body: "Only collect the profile data needed for learning and support." },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <InfoPage
      title="Platform usage expectations"
      intro="Clear expectations help protect learners, mentors, and partner schools."
      sections={[
        { title: "Respectful conduct", body: "Users should keep classrooms and community spaces safe and productive." },
        { title: "Academic integrity", body: "Projects and submissions must reflect the learner's own work." },
        { title: "Service availability", body: "Realtime features depend on connectivity and backend health." },
      ]}
    />
  );
}
