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
    <div className="mx-auto max-w-7xl px-4 py-12 lg:py-14 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">{title}</h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600">{intro}</p>
        {(primary || secondary) && (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {primary && (
              <Link to={primary.to}>
                <Button size="sm">{primary.label}</Button>
              </Link>
            )}
            {secondary && (
              <Link to={secondary.to}>
                <Button variant="outline" size="sm">
                  {secondary.label}
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.title} className="h-full border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">{section.title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">{section.body}</p>
            {section.bullets && (
              <ul className="mt-3 space-y-1.5 text-xs text-zinc-600">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-800 shrink-0" />
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
    <div className="mx-auto max-w-3xl px-4 py-12 lg:py-14 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Talk to the EthioTech team</h1>
      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-600">
        Learner support, mentor onboarding, partnerships, and school coordination.
      </p>
      {sent ? (
        <Card className="mt-8 border-zinc-200 bg-white p-6 shadow-sm">
          <p className="font-semibold text-zinc-900">Message received. We will respond soon.</p>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-zinc-700">
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-sm"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-sm"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Message
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-sm"
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit">Send message</Button>
        </form>
      )}
    </div>
  );
}

export function PrivacyPage() {
  return (
    <InfoPage
      title="Platform Privacy & Data Governance"
      intro="EthioTech is committed to transparent data management. We protect student project artifacts, mentor communications, and platform credentials."
      sections={[
        {
          title: "Account & Profile Information",
          body: "We collect only the minimum account information necessary for track progression, attendance verification, and mentorship coordination.",
          bullets: [
            "Encrypted password hashes and secure JWT sessions",
            "Role-based access controls for student, mentor, and parent data",
            "Zero monetization or sale of student data to third parties",
          ],
        },
        {
          title: "Session & Communication Privacy",
          body: "Interactive classroom feeds, peer squad chats, and 1-on-1 code reviews are protected by authenticated access tokens.",
          bullets: [
            "Short-lived WebRTC media tokens for LiveKit classrooms",
            "Scoped direct messaging channels between enrolled peers and assigned mentors",
            "Automated audit logging for administrative actions",
          ],
        },
        {
          title: "Student Project Artifacts",
          body: "Code submissions, capstone repositories, and verified achievements belong to the learner. Public portfolios are published only with learner consent.",
          bullets: [
            "Cryptographically verifiable credentials",
            "Optional public showcase links for verified employers",
            "Full data export capability upon account request",
          ],
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <InfoPage
      title="Platform Terms of Service"
      intro="Our terms ensure a safe, collaborative, and academically rigorous environment for Ethiopian students, diaspora mentors, and partner institutions."
      sections={[
        {
          title: "Academic Integrity & Code Originality",
          body: "EthioTech emphasizes genuine proof-of-work. All submitted project code must represent the learner's own understanding and contribution.",
          bullets: [
            "Open source libraries and templates must be properly attributed",
            "Automated test suites and mentor code reviews evaluate authentic comprehension",
            "Plagiarized capstones forfeit graduation credentials",
          ],
        },
        {
          title: "Code of Conduct in Classrooms & Squads",
          body: "Classrooms, squad channels, and review queues must remain respectful, inclusive, and focused on technical excellence.",
          bullets: [
            "Constructive and professional peer code review standards",
            "Zero tolerance for harassment, discrimination, or abusive behavior",
            "Immediate suspension for unauthorized sharing of classroom access",
          ],
        },
        {
          title: "Service Reliability & Offline Synchronization",
          body: "While we design for bandwidth-adaptive and offline-first usage, cloud features depend on network infrastructure and external service availability.",
          bullets: [
            "Local lab caching nodes support offline study during connectivity drops",
            "Recorded sessions remain available asynchronously in the student portal",
            "Platform maintenance notices are posted in advance via platform alerts",
          ],
        },
      ]}
    />
  );
}
