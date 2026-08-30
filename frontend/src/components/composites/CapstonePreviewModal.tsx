import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Code2,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CapstoneProject } from "@/data/tracksCatalog";

interface CapstonePreviewModalProps {
  project: CapstoneProject | null;
  trackTitle?: string;
  trackId?: string;
  isOpen: boolean;
  onClose: () => void;
  isAppView?: boolean;
}

export function CapstonePreviewModal({
  project,
  trackTitle,
  trackId,
  isOpen,
  onClose,
  isAppView = false,
}: CapstonePreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"architecture" | "code" | "deliverables">("architecture");

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!project || !isOpen) return null;

  const handleCopyCode = async () => {
    if (!project.previewSnippet?.code) return;
    try {
      await navigator.clipboard.writeText(project.previewSnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[28px] border border-primary/30 bg-[rgba(8,14,26,0.98)] shadow-2xl backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          aria-label={project.title}
        >
          {/* Header banner */}
          <div className="relative border-b border-[var(--border)] bg-[#0F172A] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {trackTitle && <Badge variant="default">{trackTitle}</Badge>}
                  <Badge variant={project.difficulty === "Production-Grade" ? "success" : "purple"}>
                    {project.difficulty}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Clock size={13} className="text-primary" />
                    ~{project.estimatedHours} build hours
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">{project.title}</h2>
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  {project.tagline}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-[var(--text-muted)] hover:bg-white/10 hover:text-white transition"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation tabs */}
            <div className="mt-6 flex flex-wrap gap-2 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("architecture")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "architecture"
                    ? "bg-primary text-black shadow-md shadow-primary/20"
                    : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white"
                }`}
              >
                <Layers size={14} />
                Architecture & Scope
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "code"
                    ? "bg-primary text-black shadow-md shadow-primary/20"
                    : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white"
                }`}
              >
                <Code2 size={14} />
                Code Architecture Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("deliverables")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "deliverables"
                    ? "bg-primary text-black shadow-md shadow-primary/20"
                    : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white"
                }`}
              >
                <CheckCircle2 size={14} />
                Deliverables & Verification
              </button>
            </div>
          </div>

          {/* Modal body */}
          <div className="max-h-[62vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            {activeTab === "architecture" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                    Project Blueprint & Real-World Context
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {project.description}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-5">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Cpu size={16} className="text-primary" />
                    Engineering Architecture Highlights
                  </h4>
                  <ul className="mt-3 space-y-2.5">
                    {project.architectureHighlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                    <Layers size={14} />
                    Production Tech Stack
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "code" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-danger/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-warning/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-success/80 inline-block" />
                    <span className="ml-2 font-mono text-xs text-[var(--text-muted)]">
                      {project.previewSnippet.filename}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyCode}
                    className="h-8 gap-1.5 text-xs text-[var(--text-secondary)] hover:text-white"
                  >
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy snippet"}
                  </Button>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#030712] p-4 sm:p-5 font-mono text-xs text-slate-200">
                  <pre className="overflow-x-auto leading-relaxed">
                    <code>{project.previewSnippet.code}</code>
                  </pre>
                </div>
              </div>
            )}

            {activeTab === "deliverables" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                    Required Milestone Deliverables
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    All capstone submissions undergo peer review and senior mentor code evaluation.
                  </p>
                </div>

                <div className="grid gap-3">
                  {project.deliverables.map((item, idx) => (
                    <Card
                      key={idx}
                      className="flex items-start gap-3 border-[var(--border)] bg-white/5 p-4"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-success/15 text-success flex-shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item}</p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          Verified against automated test suite & mentor rubric.
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--border)] bg-[rgba(5,10,20,0.9)] px-6 py-4 sm:px-8">
            <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
              Close Preview
            </Button>

            <div className="flex flex-wrap gap-3">
              {isAppView ? (
                <>
                  <Link to="/app/workspace" onClick={onClose}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Open Coding Workspace
                    </Button>
                  </Link>
                  <Link to="/app/projects/submit" onClick={onClose}>
                    <Button className="w-full sm:w-auto">
                      <Sparkles size={15} className="mr-1" />
                      Submit Milestone
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {trackId && (
                    <Link to={`/tracks#${trackId}`} onClick={onClose}>
                      <Button variant="outline" className="w-full sm:w-auto">
                        Explore Full Curriculum
                      </Button>
                    </Link>
                  )}
                  <Link to="/register" onClick={onClose}>
                    <Button className="w-full sm:w-auto">
                      Enroll to Build This Project
                      <ArrowRight size={15} className="ml-1" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
