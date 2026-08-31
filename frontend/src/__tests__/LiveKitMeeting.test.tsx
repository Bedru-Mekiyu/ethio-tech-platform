import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LiveKitHeader } from "@/components/livekit/LiveKitHeader";
import { LiveKitToolbar } from "@/components/livekit/LiveKitToolbar";
import { LiveKitLobby } from "@/components/livekit/LiveKitLobby";
import { LiveKitParticipantsDrawer } from "@/components/livekit/LiveKitParticipantsDrawer";
import { LiveKitDeviceSettingsModal } from "@/components/livekit/LiveKitDeviceSettingsModal";

describe("LiveKit Classroom UI Suite", () => {
  describe("LiveKitHeader", () => {
    it("renders session title, mentor name, and participant count", () => {
      const onChangeLayout = vi.fn();
      render(
        <LiveKitHeader
          title="Fullstack React & Node Deep Dive"
          mentorName="Abebe Bikila"
          liveStartedAt="2026-06-06T12:00:00Z"
          participantCount={12}
          isRecording={true}
          layout="grid"
          onChangeLayout={onChangeLayout}
        />,
      );

      expect(screen.getByText("Fullstack React & Node Deep Dive")).toBeTruthy();
      expect(screen.getByText("Abebe Bikila")).toBeTruthy();
      expect(screen.getByText("12")).toBeTruthy();
      expect(screen.getByText("REC")).toBeTruthy();
      expect(screen.getByText("Live")).toBeTruthy();
    });

    it("triggers layout switch on button click", () => {
      const onChangeLayout = vi.fn();
      render(<LiveKitHeader title="Python Advanced Masterclass" layout="grid" onChangeLayout={onChangeLayout} />);

      const spotlightBtn = screen.getByTitle("Speaker / Spotlight View");
      fireEvent.click(spotlightBtn);
      expect(onChangeLayout).toHaveBeenCalledWith("speaker");
    });
  });

  describe("LiveKitToolbar", () => {
    it("renders AV controls and triggers callbacks", () => {
      const onToggleAudio = vi.fn();
      const onToggleVideo = vi.fn();
      const onToggleScreenShare = vi.fn();
      const onToggleHandRaise = vi.fn();
      const onTogglePanel = vi.fn();
      const onOpenSettings = vi.fn();
      const onLeave = vi.fn();
      const onEndMeeting = vi.fn();
      const onMuteAll = vi.fn();

      render(
        <LiveKitToolbar
          isAudioMuted={false}
          isVideoMuted={true}
          isScreenSharing={false}
          isHandRaised={false}
          onToggleAudio={onToggleAudio}
          onToggleVideo={onToggleVideo}
          onToggleScreenShare={onToggleScreenShare}
          onToggleHandRaise={onToggleHandRaise}
          activePanel="none"
          onTogglePanel={onTogglePanel}
          unreadChatCount={3}
          unreadQaCount={2}
          activePollCount={1}
          participantCount={8}
          onOpenSettings={onOpenSettings}
          onLeave={onLeave}
          onEndMeeting={onEndMeeting}
          onMuteAll={onMuteAll}
          isHost={true}
        />,
      );

      // Mic button
      const micBtn = screen.getByTitle("Mute Microphone");
      fireEvent.click(micBtn);
      expect(onToggleAudio).toHaveBeenCalled();

      // Camera button
      const camBtn = screen.getByTitle("Turn On Camera");
      fireEvent.click(camBtn);
      expect(onToggleVideo).toHaveBeenCalled();

      // Screen share button
      const screenBtn = screen.getByTitle("Share Your Screen");
      fireEvent.click(screenBtn);
      expect(onToggleScreenShare).toHaveBeenCalled();

      // Hand raise button
      const handBtn = screen.getByTitle("Raise Your Hand");
      fireEvent.click(handBtn);
      expect(onToggleHandRaise).toHaveBeenCalled();

      // Unread badges
      expect(screen.getByText("3")).toBeTruthy();
      expect(screen.getByText("2")).toBeTruthy();
      expect(screen.getByText("1")).toBeTruthy();
      expect(screen.getByText("8")).toBeTruthy();

      // Host controls
      const muteAllBtn = screen.getByTitle("Mute all participant microphones");
      fireEvent.click(muteAllBtn);
      expect(onMuteAll).toHaveBeenCalled();

      const endBtn = screen.getByTitle("End Session for Everyone");
      fireEvent.click(endBtn);
      expect(onEndMeeting).toHaveBeenCalled();
    });
  });

  describe("LiveKitLobby", () => {
    it("renders pre-join lobby and handles Join Classroom CTA", () => {
      const onJoin = vi.fn();
      render(<LiveKitLobby sessionTitle="Frontend System Design" mentorName="Kebede Michael" onJoin={onJoin} />);

      expect(screen.getByText("Frontend System Design")).toBeTruthy();
      expect(screen.getByText("Kebede Michael")).toBeTruthy();
      expect(screen.getByText("LiveKit Ultra-Low Latency")).toBeTruthy();

      const joinBtn = screen.getByText("Join Classroom Now");
      fireEvent.click(joinBtn);
      expect(onJoin).toHaveBeenCalledWith({
        initialAudio: true,
        initialVideo: true,
      });
    });
  });

  describe("LiveKitParticipantsDrawer", () => {
    it("renders participant list and search filter", () => {
      const onClose = vi.fn();
      const mockLocal = {
        sid: "p_local",
        identity: "u_local",
        name: "Dawit Local",
        isMicrophoneEnabled: true,
        isCameraEnabled: true,
        metadata: JSON.stringify({ role: "student" }),
      } as unknown as import("livekit-client").Participant;

      const mockRemote = {
        sid: "p_remote",
        identity: "u_remote",
        name: "Selam Mentor",
        isMicrophoneEnabled: false,
        isCameraEnabled: true,
        metadata: JSON.stringify({ role: "host", handRaised: true }),
      } as unknown as import("livekit-client").Participant;

      render(
        <LiveKitParticipantsDrawer
          isOpen={true}
          onClose={onClose}
          participants={[mockRemote]}
          localParticipant={mockLocal}
          isHost={true}
        />,
      );

      expect(screen.getByText("Participants")).toBeTruthy();
      expect(screen.getByText("Dawit Local")).toBeTruthy();
      expect(screen.getByText("Selam Mentor")).toBeTruthy();

      // Search filter
      const searchInput = screen.getByPlaceholderText("Search participants...");
      fireEvent.change(searchInput, { target: { value: "Selam" } });
      expect(screen.getByText("Selam Mentor")).toBeTruthy();
    });
  });

  describe("LiveKitDeviceSettingsModal", () => {
    it("renders device configuration modal", () => {
      const onClose = vi.fn();
      render(<LiveKitDeviceSettingsModal isOpen={true} onClose={onClose} />);

      expect(screen.getByText("Device & Audio Settings")).toBeTruthy();
      expect(screen.getByText("Microphone")).toBeTruthy();
      expect(screen.getByText("Camera")).toBeTruthy();
      expect(screen.getByText("Save Preferences")).toBeTruthy();

      fireEvent.click(screen.getByText("Cancel"));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
