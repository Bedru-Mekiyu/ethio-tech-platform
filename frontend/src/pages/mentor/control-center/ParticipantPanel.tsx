import { useState, useMemo, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/composites/ConfirmDialog";
import {
  Search,
  Mic,
  MicOff,
  Shield,
  ShieldAlert,
  UserX,
  Ban,
  VolumeX,
  Volume2,
  MoreHorizontal,
  MessageSquare,
} from "lucide-react";
import { type MentorControlData, submitStudentFeedback } from "@/services/mentorControlService";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/composites/ToastProvider";

interface ParticipantPanelProps {
  participants: MentorControlData["participants"];
  sessionId: string;
  onAction: (action: string, userId: string) => void;
}

export default function ParticipantPanel({ participants, sessionId, onAction }: ParticipantPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Destructive action state
  const [confirmAction, setConfirmAction] = useState<{ action: string; userId: string; userName: string } | null>(null);

  // Feedback action state
  const [feedbackUser, setFeedbackUser] = useState<{ userId: string; name: string } | null>(null);
  const [participationScore, setParticipationScore] = useState<number>(5);
  const [communicationScore, setCommunicationScore] = useState<number>(5);
  const [professionalismScore, setProfessionalismScore] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const feedbackDialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  useEffect(() => {
    const dialog = feedbackDialogRef.current;
    if (!dialog) return;
    if (feedbackUser && !dialog.open) {
      dialog.showModal();
    } else if (!feedbackUser && dialog.open) {
      dialog.close();
    }
  }, [feedbackUser]);

  const handleFeedbackSubmit = async () => {
    if (!feedbackUser || !sessionId) return;
    setIsSubmittingFeedback(true);
    try {
      await submitStudentFeedback(sessionId, {
        studentId: feedbackUser.userId,
        participationScore,
        communicationScore,
        professionalismScore,
        comment,
      });
      setFeedbackUser(null);
      setComment("");
      setParticipationScore(5);
      setCommunicationScore(5);
      setProfessionalismScore(5);
    } catch (err) {
      console.error("Failed to submit feedback", err);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || p.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [participants, searchTerm, roleFilter]);

  const handleMuteAll = () => {
    participants.forEach((p) => {
      if (p.role !== "host" && p.role !== "cohost") {
        onAction("mute", p.userId);
      }
    });
  };

  const handleUnmuteAll = () => {
    participants.forEach((p) => {
      if (p.role !== "host" && p.role !== "cohost") {
        onAction("unmute", p.userId);
      }
    });
  };

  const triggerConfirm = (action: string, userId: string, userName: string) => {
    setConfirmAction({ action, userId, userName });
    setMenuOpenId(null);
  };

  const executeConfirm = () => {
    if (confirmAction) {
      onAction(confirmAction.action, confirmAction.userId);
      setConfirmAction(null);
    }
  };

  return (
    <Card className="mcc-card border-white/5 bg-[var(--bg-card)]/50 p-4 flex flex-col h-full animate-slide-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            Active Classroom
            <Badge variant="purple" className="h-5 px-1.5">
              {participants.length} online
            </Badge>
          </h3>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-[11px] gap-1 border-white/10 hover:bg-white/5"
            onClick={handleMuteAll}
          >
            <VolumeX size={12} /> Mute All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-[11px] gap-1 border-white/10 hover:bg-white/5"
            onClick={handleUnmuteAll}
          >
            <Volume2 size={12} /> Unmute All
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder="Search participants..."
            className="h-8 pl-8 text-xs bg-white/5 border-white/5 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-8 rounded-lg border border-white/5 bg-white/5 px-2 text-xs text-white outline-none focus:border-primary/50"
        >
          <option value="all" className="bg-[#0B0F19]">
            All Roles
          </option>
          <option value="host" className="bg-[#0B0F19]">
            Host
          </option>
          <option value="cohost" className="bg-[#0B0F19]">
            Co-Host
          </option>
          <option value="moderator" className="bg-[#0B0F19]">
            Moderator
          </option>
          <option value="participant" className="bg-[#0B0F19]">
            Participant
          </option>
          <option value="observer" className="bg-[#0B0F19]">
            Observer
          </option>
        </select>
      </div>

      {filteredParticipants.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-xs text-[var(--text-muted)]">No participants match search criteria</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 max-h-[500px] overflow-y-auto mcc-scrollbar pr-1">
          {filteredParticipants.map((p) => {
            // Check status dot color
            const isHost = p.role === "host";
            const isCohost = p.role === "cohost";
            const canManage = !isHost && !isCohost;

            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.01] p-3 hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar name={p.name} src={p.avatar} size="sm" className="h-9 w-9 rounded-lg" />
                    {/* Live Status indicator */}
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 block h-3 w-3 rounded-full border-2 border-[#0B0F19]",
                        p.role === "host" ? "bg-success" : "bg-primary",
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                      {p.name}
                      {isHost && (
                        <Badge variant="success" className="text-[9px] px-1 py-0 scale-90">
                          Host
                        </Badge>
                      )}
                      {isCohost && (
                        <Badge variant="purple" className="text-[9px] px-1 py-0 scale-90">
                          Co-Host
                        </Badge>
                      )}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                      Online: {Math.floor(p.attendanceDuration / 60)}m · {p.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {canManage && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                        onClick={() => onAction("mute", p.userId)}
                        title="Mute student"
                      >
                        <MicOff size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                        onClick={() => onAction("unmute", p.userId)}
                        title="Unmute student"
                      >
                        <Mic size={14} />
                      </Button>
                    </>
                  )}

                  <div className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                      onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                    >
                      <MoreHorizontal size={14} />
                    </Button>

                    {menuOpenId === p.id && (
                      <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-white/10 bg-[#0B0F19]/95 backdrop-blur-md py-1.5 shadow-xl">
                        {!isHost && (
                          <>
                            {p.role !== "cohost" ? (
                              <button
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-white hover:bg-white/5"
                                onClick={() => {
                                  onAction("promote", p.userId);
                                  setMenuOpenId(null);
                                }}
                              >
                                <Shield size={13} className="text-purple-400" /> Promote to Co-Host
                              </button>
                            ) : (
                              <button
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-white hover:bg-white/5"
                                onClick={() => {
                                  onAction("demote", p.userId);
                                  setMenuOpenId(null);
                                }}
                              >
                                <ShieldAlert size={13} className="text-warning" /> Demote to Participant
                              </button>
                            )}
                            <button
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-white hover:bg-white/5"
                              onClick={() => {
                                onAction("timeout", p.userId);
                                setMenuOpenId(null);
                              }}
                            >
                              <VolumeX size={13} /> Timeout (5m)
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-white hover:bg-white/5"
                              onClick={() => {
                                setFeedbackUser({ userId: p.userId, name: p.name });
                                setMenuOpenId(null);
                              }}
                            >
                              <MessageSquare size={13} className="text-primary" /> Submit Feedback
                            </button>
                            <div className="my-1 border-t border-white/5" />
                            <button
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-danger hover:bg-danger/10"
                              onClick={() => triggerConfirm("remove", p.userId, p.name)}
                            >
                              <UserX size={13} /> Remove User
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-danger hover:bg-danger/10"
                              onClick={() => triggerConfirm("block", p.userId, p.name)}
                            >
                              <Ban size={13} /> Block User
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Destructive Actions */}
      <ConfirmDialog
        open={!!confirmAction}
        title={
          confirmAction?.action
            ? `${confirmAction.action.charAt(0).toUpperCase()}${confirmAction.action.slice(1)} Participant`
            : ""
        }
        description={
          confirmAction
            ? `Are you sure you want to ${confirmAction.action} ${confirmAction.userName}?${confirmAction.action === "block" ? " They will be banned from this classroom and unable to rejoin." : " They will be disconnected from the live session."}`
            : ""
        }
        variant="danger"
        onCancel={() => setConfirmAction(null)}
        onConfirm={executeConfirm}
      />
      {/* Feedback Dialog */}
      <dialog
        ref={feedbackDialogRef}
        className="fixed inset-0 z-[9998] m-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F19] p-0 text-white shadow-xl backdrop:bg-black/60"
        onCancel={(e) => {
          e.preventDefault();
          setFeedbackUser(null);
        }}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white">Submit Session Feedback</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Rate <strong>{feedbackUser?.name}</strong>'s engagement, communication, and professionalism during this
            session.
          </p>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Participation</label>
                <select
                  value={participationScore}
                  onChange={(e) => setParticipationScore(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none focus:border-primary/50"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n} className="bg-[#0B0F19]">
                      {n} / 5
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Communication</label>
                <select
                  value={communicationScore}
                  onChange={(e) => setCommunicationScore(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none focus:border-primary/50"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n} className="bg-[#0B0F19]">
                      {n} / 5
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Professionalism</label>
                <select
                  value={professionalismScore}
                  onChange={(e) => setProfessionalismScore(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none focus:border-primary/50"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n} className="bg-[#0B0F19]">
                      {n} / 5
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add session comments or specific recommendations..."
                className="w-full min-h-20 rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-white outline-none focus:border-primary/50 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-white"
              onClick={() => setFeedbackUser(null)}
              disabled={isSubmittingFeedback}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFeedbackSubmit} disabled={isSubmittingFeedback}>
              {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </div>
      </dialog>
    </Card>
  );
}
