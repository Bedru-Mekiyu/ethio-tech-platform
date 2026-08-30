# System Architecture & Subsystems Deep Dive

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ETHIOTECH PLATFORM TOPOLOGY                        │
└─────────────────────────────────────────────────────────────────────────────┘

    [React 19 + TypeScript Client] ──HTTPS REST──▶ [API Gateway & Ingress (Express 4)]
                 │                                        │
                 ├──WSS WebRTC──▶ [LiveKit SFU Server]    ├──▶ [Application Services]
                 │                                        │         │
                 └──WSS Socket──▶ [Socket.IO Cluster] ────┘         ├──▶ [MongoDB Atlas]
                                                                    ├──▶ [Redis Adapter]
                                                                    └──▶ [Cloudinary Media]
```

---

## 1. WebRTC Live Classroom Architecture (LiveKit SFU)

EthioTech utilizes **LiveKit WebRTC SFU (Selective Forwarding Unit)** to deliver low-bandwidth, low-latency live interactive classrooms across Ethiopia.

### Video / Audio Lifecycle
1. **Token Generation**: When an authorized participant joins a session, the backend (`backend/src/services/livekitService.js`) issues a cryptographically signed LiveKit Access Token with specific `VideoGrants`:
   - `roomJoin: true`
   - `canPublish: isHost || isMentor`
   - `canSubscribe: true`
   - `canPublishData: true`
2. **Adaptive Bitrate Streaming (Simulcast & SVC)**: LiveKit dynamically adapts resolution and framerate based on the student's network throughput (vital for 3G/4G connections outside major urban centers).
3. **Session Heartbeat & Presence**: Real-time participant state and duration are tracked via `SessionParticipant.js` for automatic attendance XP calculations.

---

## 2. Real-Time WebSockets & Collaboration Bus

Real-time events outside WebRTC media are handled by **Socket.IO 4.8** with a distributed Redis pub/sub adapter:

| Event Channel | Description | Payload Schema |
|---|---|---|
| `whiteboard:stroke` | Serialized Konva canvas vector actions | `{ sessionId, tool, points, color, strokeWidth }` |
| `classroom:hand_raise` | Student hand-raise queue addition | `{ sessionId, studentId, studentName, timestamp }` |
| `classroom:poll_vote` | Live multiple-choice poll voting | `{ pollId, optionIndex, studentId }` |
| `classroom:qa_upvote` | Upvoting student technical questions | `{ questionId, upvotesCount }` |
| `moderation:action` | Mute, kick, or lock room commands | `{ action: 'mute_all' | 'kick', targetUserId }` |

---

## 3. Database Architecture (52 Models)

The MongoDB data model is partitioned into distinct operational domains:

- **Identity & Profiles**: `User`, `Invitation`, `UserStreak`, `WaitlistEntry`, `NotificationPreference`, `Certificate`
- **Curriculum & Tracks**: `Track`, `Module`, `Lesson`, `LessonProgress`, `StudentProgress`, `Project`, `Submission`
- **Classrooms & Video**: `Session`, `SessionParticipant`, `SessionQuestion`, `SessionPoll`, `SessionNote`, `SessionResource`, `SessionRecording`, `SessionFeedback`, `SessionAuditLog`, `HandRaise`, `EngagementScore`, `WhiteboardSnapshot`, `BreakoutRoom`, `BreakoutAssignment`
- **Physical Regional Hubs**: `Hub`, `HubBooking`, `HubAttendance`
- **Gamification**: `Badge`, `LevelConfig`, `DailyChallenge`, `DailyChallengeCompletion`, `XPLog`, `PeerGroup`, `CalendarEvent`
- **Auditing & Operations**: `AuditLog`, `AdminActivityLog`, `ModerationLog`, `AnalyticsEvent`, `Notification`, `ReminderJob`, `Resource`
