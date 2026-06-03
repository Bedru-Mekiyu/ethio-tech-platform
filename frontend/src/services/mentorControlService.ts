import { api } from "./api";
import type { Socket } from "socket.io-client";

export interface MentorControlData {
  overview: {
    liveParticipants: number;
    waitingParticipants: number;
    sessionDuration: number;
    attendancePercent: number;
    engagementScore: number;
    questionsWaiting: number;
    raisedHands: number;
    activePolls: number;
    chatActivity: number;
  };
  participants: Array<{
    id: string;
    userId: string;
    name: string;
    avatar?: string;
    role: string;
    status: string;
    attendanceDuration: number;
    joinedAt: string;
    verifiedAttendance: boolean;
  }>;
  waitingQueue: Array<{
    id: string;
    userId: string;
    name: string;
    avatar?: string;
    joinedAt: string;
  }>;
  raisedHands: Array<{
    userId: string;
    name: string;
    queuePosition: number;
    raisedAt: string;
  }>;
  questions: Array<{
    id: string;
    userId: string;
    studentName: string;
    text: string;
    status: string;
    isPinned: boolean;
    upvoteCount: number;
    reply?: { text: string; repliedBy: string; repliedAt: string };
    createdAt: string;
  }>;
  polls: Array<{
    id: string;
    question: string;
    type: string;
    status: string;
    options: Array<{ index: number; text: string; voteCount: number; percentage: number }>;
    totalVotes: number;
    createdAt: string;
  }>;
  engagementScores: Array<{
    student: { _id: string; fullName: string; avatar?: string };
    score: number;
    questionsAsked: number;
    pollParticipations: number;
    chatMessages: number;
    attendanceMs: number;
  }>;
}

export const fetchMentorControlCenter = async (sessionId: string): Promise<MentorControlData> => {
  const { data } = await api.get(`/mentor/sessions/${sessionId}/control-center`);
  return data.data;
};

export const fetchMentorAnalytics = async () => {
  const { data } = await api.get("/mentor/analytics");
  return data.data.analytics;
};

export const fetchSessionAnalytics = async (sessionId: string) => {
  const { data } = await api.get(`/mentor/sessions/${sessionId}/analytics`);
  return data.data;
};

export const createPoll = async (sessionId: string, pollData: { question: string; type: string; options?: string[] }) => {
  const { data } = await api.post(`/sessions/${sessionId}/polls`, pollData);
  return data.data.poll;
};

export const closePoll = async (sessionId: string, pollId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/polls/${pollId}/close`);
  return data.data.poll;
};

export const reopenPoll = async (sessionId: string, pollId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/polls/${pollId}/reopen`);
  return data.data.poll;
};

export const publishPollResults = async (sessionId: string, pollId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/polls/${pollId}/publish`);
  return data.data.poll;
};

export const answerQuestion = async (sessionId: string, questionId: string, text: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/questions/${questionId}/answer`, { text });
  return data.data.question;
};

export const pinQuestion = async (sessionId: string, questionId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/questions/${questionId}/pin`);
  return data.data.question;
};

export const archiveQuestion = async (sessionId: string, questionId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/questions/${questionId}/archive`);
  return data.data.question;
};

export const setQuestionStatus = async (sessionId: string, questionId: string, status: string) => {
  const { data } = await api.patch(`/sessions/${sessionId}/questions/${questionId}/status`, { status });
  return data.data.question;
};

export const admitUser = async (sessionId: string, userId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/admit`, { userId });
  return data.data;
};

export const denyUser = async (sessionId: string, userId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/deny`, { userId });
  return data.data;
};

export const removeParticipant = async (sessionId: string, userId: string, reason?: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/moderation/remove`, { userId, reason });
  return data.data;
};

export const muteParticipant = async (sessionId: string, userId: string, durationMinutes?: number) => {
  const { data } = await api.post(`/sessions/${sessionId}/moderation/mute`, { userId, durationMinutes });
  return data.data;
};

export const unmuteParticipant = async (sessionId: string, userId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/moderation/unmute`, { userId });
  return data.data;
};

export const timeoutParticipant = async (sessionId: string, userId: string, durationMinutes?: number) => {
  const { data } = await api.post(`/sessions/${sessionId}/moderation/timeout`, { userId, durationMinutes });
  return data.data;
};

export const setParticipantRole = async (sessionId: string, userId: string, role: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/participants/role`, { userId, role });
  return data.data;
};

export const submitStudentFeedback = async (sessionId: string, feedback: {
  studentId: string;
  participationScore: number;
  communicationScore: number;
  professionalismScore: number;
  comment?: string;
}) => {
  const { data } = await api.post(`/sessions/${sessionId}/student-feedback`, feedback);
  return data.data.feedback;
};

export const callOnStudent = async (sessionId: string, userId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/hands/call-on`, { userId });
  return data.data;
};

export const markHandAnswered = async (sessionId: string, userId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/hands/mark-answered`, { userId });
  return data.data;
};

export const clearAllRaisedHands = async (sessionId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/hands/clear-all`);
  return data.data;
};

export const createResource = async (sessionId: string, resource: {
  title: string;
  description?: string;
  url?: string;
  type: string;
}) => {
  const { data } = await api.post(`/sessions/${sessionId}/resources`, resource);
  return data.data.resource;
};

export const uploadSessionRecording = async (sessionId: string, recording: {
  title: string;
  description?: string;
  url: string;
  durationMinutes?: number;
}) => {
  const { data } = await api.post(`/sessions/${sessionId}/recordings`, recording);
  return data.data.recording;
};

export const publishRecording = async (sessionId: string, recordingId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/recordings/${recordingId}/publish`);
  return data.data.recording;
};

export const getSessionNotes = async (sessionId: string) => {
  const { data } = await api.get(`/sessions/${sessionId}/notes`);
  return data.data.notes;
};

export const updateSessionNotes = async (sessionId: string, content: string) => {
  const { data } = await api.put(`/sessions/${sessionId}/notes`, { content });
  return data.data.notes;
};

export const publishSessionNotes = async (sessionId: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/notes/publish`);
  return data.data.notes;
};

export const deleteMessage = async (sessionId: string, messageId: string, reason?: string) => {
  const { data } = await api.delete(`/sessions/${sessionId}/messages/${messageId}`, { data: { reason } });
  return data.data;
};

export const reportAbuse = async (sessionId: string, reportedUserId: string, messageId?: string, reason?: string) => {
  const { data } = await api.post(`/sessions/${sessionId}/moderation/report`, { reportedUserId, messageId, reason });
  return data.data;
};

export const getResources = async (sessionId: string) => {
  const { data } = await api.get(`/sessions/${sessionId}/resources`);
  return data.data.resources;
};

export const getRecordings = async (sessionId: string) => {
  const { data } = await api.get(`/sessions/${sessionId}/recordings`);
  return data.data.recordings;
};

export const getStudentProfile = async (studentId: string) => {
  const { data } = await api.get(`/mentor/students/${studentId}`);
  return data.data.student;
};

export const getModerationLogs = async (sessionId: string) => {
  const { data } = await api.get(`/sessions/${sessionId}/moderation/logs`);
  return data.data.logs;
};
