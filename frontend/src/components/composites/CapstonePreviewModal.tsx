import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Code2, Layers, CheckCircle2, Clock, ArrowRight, Copy, Check, Cpu } from "lucide-react";
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
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label={project.title}
        >
          {/* Header banner */}
          <div className="relative border-b border-zinc-200 bg-zinc-50 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {trackTitle && <Badge variant="default">{trackTitle}</Badge>}
                  <Badge variant={project.difficulty === "Production-Grade" ? "outline" : "default"}>
                    {project.difficulty}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                    <Clock size={13} className="text-zinc-700" />~{project.estimatedHours} build hours
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">{project.title}</h2>
                <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-600">{project.tagline}</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition shadow-2xs"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation tabs */}
            <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-200/80 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("architecture")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "architecture"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Layers size={14} />
                Architecture & Scope
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "code"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Code2 size={14} />
                Code Architecture Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("deliverables")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  activeTab === "deliverables"
                    ? "bg-zinc-900 text-white shadow-xs"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <CheckCircle2 size={14} />
                Deliverables & Verification
              </button>
            </div>
          </div>

          {/* Modal body */}
          <div className="max-h-[62vh] overflow-y-auto p-6 sm:p-8 space-y-6 bg-white">
            {activeTab === "architecture" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-900">
                    Project Blueprint & Real-World Context
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{project.description}</p>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                    <Cpu size={16} className="text-zinc-900" />
                    Engineering Architecture Highlights
                  </h4>
                  <ul className="mt-3 space-y-2.5">
                    {project.architectureHighlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-600 leading-relaxed">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                    <Layers size={14} />
                    Production Tech Stack
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-900"
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
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-400 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-zinc-500 inline-block" />
                    <span className="ml-2 font-mono text-xs text-zinc-600">{project.previewSnippet.filename}</span>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyCode}
                    className="h-8 gap-1.5 text-xs text-zinc-600 hover:text-zinc-900"
                  >
                    {copied ? <Check size={14} className="text-zinc-900" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy snippet"}
                  </Button>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 font-mono text-xs text-zinc-200">
                  <pre className="overflow-x-auto leading-relaxed">
                    <code>{project.previewSnippet.code}</code>
                  </pre>
                </div>
              </div>
            )}

            {activeTab === "deliverables" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-900">
                    Required Milestone Deliverables
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    All capstone submissions undergo peer review and senior mentor code evaluation.
                  </p>
                </div>

                <div className="grid gap-3">
                  {project.deliverables.map((item, idx) => (
                    <Card key={idx} className="flex items-start gap-3 border-zinc-200 bg-zinc-50 p-4 shadow-2xs">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200 flex-shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{item}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
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
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-6 py-4 sm:px-8">
            <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto text-zinc-700">
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
                    <Button className="w-full sm:w-auto">Submit Milestone</Button>
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
                    <Button className="w-full sm:w-auto font-medium">
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
