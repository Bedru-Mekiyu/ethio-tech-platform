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
    <Card className="border-zinc-200/80 bg-white p-4 flex flex-col h-full shadow-sm rounded-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
            Active Classroom
            <Badge variant="outline" className="h-5 px-1.5">
              {participants.length} online
            </Badge>
          </h3>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-[11px] gap-1 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            onClick={handleMuteAll}
          >
            <VolumeX size={12} /> Mute All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-[11px] gap-1 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            onClick={handleUnmuteAll}
          >
            <Volume2 size={12} /> Unmute All
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search participants..."
            className="h-8 pl-8 text-xs bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none focus:border-zinc-900"
        >
          <option value="all">All Roles</option>
          <option value="host">Host</option>
          <option value="cohost">Co-Host</option>
          <option value="moderator">Moderator</option>
          <option value="participant">Participant</option>
          <option value="observer">Observer</option>
        </select>
      </div>

      {filteredParticipants.length === 0 ? (
        <div className="h-40 flex items-center justify-center text-center">
          <p className="text-xs text-zinc-400">No matching participants</p>
        </div>
      ) : (
        <div className="flex-1 space-y-2 max-h-[500px] overflow-y-auto mcc-scrollbar pr-1">
          {filteredParticipants.map((p) => {
            const isHost = p.role === "host";
            const isCohost = p.role === "cohost";
            const canManage = !isHost && !isCohost;

            return (
              <div
                key={p.id}
                className="rounded-xl border border-zinc-200/80 bg-white p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-zinc-300 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar name={p.name} src={p.avatar} size="sm" className="h-9 w-9 rounded-lg" />
                    {/* Live Status indicator */}
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 block h-3 w-3 rounded-full border-2 border-white",
                        p.role === "host" ? "bg-zinc-900" : "bg-zinc-600",
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate flex items-center gap-1.5">
                      {p.name}
                      {isHost && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 scale-90">
                          Host
                        </Badge>
                      )}
                      {isCohost && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 scale-90">
                          Co-Host
                        </Badge>
                      )}
                    </p>
                    <p className="text-[9px] text-zinc-500 mt-0.5">
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
                        className="h-8 w-8 p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        onClick={() => onAction("mute", p.userId)}
                        title="Mute student"
                      >
                        <MicOff size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
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
                      className="h-8 w-8 p-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                    >
                      <MoreHorizontal size={14} />
                    </Button>

                    {menuOpenId === p.id && (
                      <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl">
                        {!isHost && (
                          <>
                            {p.role !== "cohost" ? (
                              <button
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50"
                                onClick={() => {
                                  onAction("promote", p.userId);
                                  setMenuOpenId(null);
                                }}
                              >
                                <Shield size={13} className="text-zinc-700" /> Promote to Co-Host
                              </button>
                            ) : (
                              <button
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50"
                                onClick={() => {
                                  onAction("demote", p.userId);
                                  setMenuOpenId(null);
                                }}
                              >
                                <ShieldAlert size={13} className="text-amber-600" /> Demote to Participant
                              </button>
                            )}
                            <button
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50"
                              onClick={() => {
                                onAction("timeout", p.userId);
                                setMenuOpenId(null);
                              }}
                            >
                              <VolumeX size={13} /> Timeout (5m)
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50"
                              onClick={() => {
                                setFeedbackUser({ userId: p.userId, name: p.name });
                                setMenuOpenId(null);
                              }}
                            >
                              <MessageSquare size={13} className="text-[#b91c1c]" /> Submit Feedback
                            </button>
                            <div className="my-1 border-t border-zinc-100" />
                            <button
                              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                              onClick={() => triggerConfirm("remove", p.userId, p.name)}
                            >
                              <UserX size={13} /> Remove User
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
            ? `Are you sure you want to ${confirmAction.action} ${confirmAction.userName}? They will be disconnected from the live session.`
            : ""
        }
        variant="danger"
        onCancel={() => setConfirmAction(null)}
        onConfirm={executeConfirm}
      />
      {/* Feedback Dialog */}
      <dialog
        ref={feedbackDialogRef}
        className="fixed inset-0 z-[9998] m-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-900/40"
        onCancel={(e) => {
          e.preventDefault();
          setFeedbackUser(null);
        }}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Submit Session Feedback</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Rate <strong>{feedbackUser?.name}</strong>'s engagement, communication, and professionalism during this
            session.
          </p>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Participation
                </label>
                <select
                  value={participationScore}
                  onChange={(e) => setParticipationScore(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Communication
                </label>
                <select
                  value={communicationScore}
                  onChange={(e) => setCommunicationScore(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Professionalism
                </label>
                <select
                  value={professionalismScore}
                  onChange={(e) => setProfessionalismScore(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-zinc-900"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add session comments or specific recommendations..."
                className="w-full min-h-20 rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-zinc-200 hover:bg-zinc-50 text-zinc-700"
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
