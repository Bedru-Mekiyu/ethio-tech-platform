import { useState } from "react";
import type { FormEvent } from "react";
import { Award, Plus, Trash2, Github, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { CapstoneProjectItem } from "./types";

interface CapstoneProjectEditorProps {
  trackId: string;
  trackTitle: string;
  projects: CapstoneProjectItem[];
  onSaveProject: (project: Partial<CapstoneProjectItem>) => void;
  onDeleteProject: (projectId: string) => void;
  isSaving: boolean;
}

export function CapstoneProjectEditor({
  trackId,
  trackTitle,
  projects,
  onSaveProject,
  onDeleteProject,
  isSaving,
}: CapstoneProjectEditorProps) {
  const [editingProject, setEditingProject] = useState<Partial<CapstoneProjectItem> | null>(null);
  const [newRequirement, setNewRequirement] = useState("");

  const startNewProject = () => {
    setEditingProject({
      track: trackId,
      title: "",
      description: "",
      difficulty: "medium",
      xpReward: 500,
      githubTemplate: "https://github.com/ethio-tech-templates/capstone-starter",
      requirements: [
        "Implement production-ready CRUD architecture",
        "Add unit and integration tests with >80% coverage",
        "Deploy to cloud infrastructure with automated CI/CD",
      ],
    });
  };

  const addRequirement = () => {
    if (!newRequirement.trim() || !editingProject) return;
    const reqs = editingProject.requirements || [];
    setEditingProject({
      ...editingProject,
      requirements: [...reqs, newRequirement.trim()],
    });
    setNewRequirement("");
  };

  const removeRequirement = (index: number) => {
    if (!editingProject) return;
    const reqs = (editingProject.requirements || []).filter((_, i) => i !== index);
    setEditingProject({ ...editingProject, requirements: reqs });
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.title?.trim()) return;
    onSaveProject({
      ...editingProject,
      track: trackId,
    });
    setEditingProject(null);
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Award size={20} className="text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Track Capstone Projects</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Capstone projects serve as the final portfolio pieces students build to graduate from &quot;{trackTitle}
            &quot;.
          </p>
        </div>

        {!editingProject && (
          <Button size="sm" onClick={startNewProject} className="gap-1.5 h-8">
            <Plus size={14} /> Add Capstone Project
          </Button>
        )}
      </div>

      {/* Editing Form */}
      {editingProject && (
        <form onSubmit={handleSave} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              {editingProject._id ? "Edit Capstone Project" : "New Capstone Project"}
            </span>
            <button
              type="button"
              onClick={() => setEditingProject(null)}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="capstone-title" className="block text-xs font-semibold text-slate-800">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <Input
                id="capstone-title"
                value={editingProject.title || ""}
                onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                placeholder="e.g. Enterprise Fintech Microservices Platform"
                className="border-slate-200 bg-white text-slate-900"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="capstone-desc" className="block text-xs font-semibold text-slate-800">
                Specification & Architecture Description
              </label>
              <Textarea
                id="capstone-desc"
                value={editingProject.description || ""}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                placeholder="Describe project requirements, tech stack constraints, and expected outcomes..."
                rows={3}
                className="border-slate-200 bg-white text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="capstone-difficulty" className="block text-xs font-semibold text-slate-800">
                Difficulty Level
              </label>
              <select
                id="capstone-difficulty"
                value={editingProject.difficulty || "medium"}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    difficulty: e.target.value as CapstoneProjectItem["difficulty"],
                  })
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-zinc-900 cursor-pointer"
              >
                <option value="easy">Beginner / Easy</option>
                <option value="medium">Intermediate / Medium</option>
                <option value="hard">Advanced / Hard</option>
                <option value="Production-Grade">Production-Grade</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="capstone-xp" className="block text-xs font-semibold text-slate-800">
                XP Reward
              </label>
              <Input
                id="capstone-xp"
                type="number"
                min={0}
                value={editingProject.xpReward ?? 500}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    xpReward: Number(e.target.value),
                  })
                }
                className="border-slate-200 bg-white text-slate-900"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="capstone-repo" className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Github size={13} className="text-slate-700" />
                GitHub Starter Template Repository URL
              </label>
              <Input
                id="capstone-repo"
                value={editingProject.githubTemplate || ""}
                onChange={(e) => setEditingProject({ ...editingProject, githubTemplate: e.target.value })}
                placeholder="https://github.com/..."
                className="border-slate-200 bg-white text-slate-900"
              />
            </div>

            {/* Requirements builder */}
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-800">
                Graduation Deliverables & Requirements
              </label>
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="e.g. Implement Role-Based Access Control (RBAC)"
                  className="text-xs border-slate-200 bg-white text-slate-900"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRequirement();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addRequirement} className="shrink-0 h-10">
                  Add
                </Button>
              </div>

              <div className="space-y-1.5 pt-1">
                {(editingProject.requirements || []).map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-1.5 text-xs border border-slate-200 shadow-2xs"
                  >
                    <span className="flex items-center gap-2 text-slate-800">
                      <CheckCircle2 size={13} className="text-zinc-900 shrink-0" />
                      {req}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRequirement(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingProject(null)}
              disabled={isSaving}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={isSaving}>
              Save Capstone Project
            </Button>
          </div>
        </form>
      )}

      {/* Projects List */}
      {!editingProject && (
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 bg-slate-50/50">
              No capstone project linked to this track. Click &quot;Add Capstone Project&quot; to configure graduation
              criteria.
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj._id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-xs shadow-2xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{proj.title}</h4>
                    {proj.difficulty && (
                      <Badge variant="outline" size="sm">
                        {proj.difficulty}
                      </Badge>
                    )}
                    {proj.xpReward && (
                      <Badge variant="warning" size="sm">
                        +{proj.xpReward} XP
                      </Badge>
                    )}
                  </div>
                  {proj.description && <p className="text-xs text-slate-500 line-clamp-2">{proj.description}</p>}
                  {proj.githubTemplate && (
                    <a
                      href={proj.githubTemplate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#b91c1c] hover:underline pt-1"
                    >
                      <Github size={11} /> Starter Repository <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProject(proj)}
                    className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteProject(proj._id)}
                    className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
