import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Settings, Sparkles, User as UserIcon, Shield, Radio } from "lucide-react";
import { LiveKitDeviceSettingsModal } from "./LiveKitDeviceSettingsModal";

interface LiveKitLobbyProps {
  sessionTitle: string;
  mentorName?: string;
  onJoin: (options: { initialAudio: boolean; initialVideo: boolean }) => void;
  isJoining?: boolean;
}

export function LiveKitLobby({ sessionTitle, mentorName, onJoin, isJoining = false }: LiveKitLobbyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsModalRef = useRef<import("./LiveKitDeviceSettingsModal").DeviceSettingsModalRef>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Initialize media devices preview
  useEffect(() => {
    let localStream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animId: number;

    const startPreview = async () => {
      try {
        setPermissionError(null);
        if (typeof navigator === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
          return;
        }
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(localStream);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }

        // Setup audio level analyzer
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          const source = audioCtx.createMediaStreamSource(localStream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((acc, val) => acc + val, 0);
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animId = requestAnimationFrame(checkVolume);
          };
          checkVolume();
        }
      } catch (err) {
        console.warn("Could not access camera/mic for lobby preview:", err);
        setPermissionError("Camera or microphone permission is required for interactive participation.");
      }
    };

    void startPreview();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (audioCtx) void audioCtx.close();
    };
  }, []);

  const handleToggleAudio = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = !audioEnabled;
      });
    }
    setAudioEnabled((prev) => !prev);
  };

  const handleToggleVideo = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = !videoEnabled;
      });
    }
    setVideoEnabled((prev) => !prev);
  };

  const handleJoin = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    onJoin({
      initialAudio: audioEnabled,
      initialVideo: videoEnabled,
    });
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0B0F19] p-4 md:p-8 select-none">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-zinc-900/60 p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Camera Preview */}
          <div className="md:col-span-7 flex flex-col items-center">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-inner flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  videoEnabled && !permissionError ? "opacity-100 visible" : "opacity-0 invisible"
                }`}
              />

              {/* Avatar placeholder when camera is off */}
              {(!videoEnabled || permissionError) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 text-white border border-white/10 shadow-2xl">
                    <UserIcon className="h-12 w-12" />
                  </div>
                  <p className="mt-4 text-xs font-medium text-zinc-400">Camera is turned off</p>
                </div>
              )}

              {/* In-Preview Floating AV Toggles */}
              <div className="absolute bottom-4 flex items-center gap-3 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    audioEnabled ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-rose-600 text-white"
                  }`}
                  title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    videoEnabled ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-rose-600 text-white"
                  }`}
                  title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                >
                  {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(true);
                    void settingsModalRef.current?.loadDevices();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                  title="Device Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              {/* Mic volume meter overlay */}
              {audioEnabled && !permissionError && (
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-md px-3 py-1 border border-white/5">
                  <Mic className="h-3.5 w-3.5 text-white" />
                  <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-white transition-all duration-75" style={{ width: `${audioLevel}%` }} />
                  </div>
                </div>
              )}
            </div>

            {permissionError && <p className="mt-3 text-xs text-amber-400/90 text-center">{permissionError}</p>}
          </div>

          {/* Right Column: Session Info & CTA */}
          <div className="md:col-span-5 flex flex-col justify-center space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white mb-3">
                <Radio className="h-3.5 w-3.5 text-white" />
                <span>Ready to Join</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{sessionTitle}</h2>
              {mentorName && (
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                  <Shield className="h-3.5 w-3.5 text-zinc-400" />
                  <span>
                    Hosted by <strong className="text-zinc-200">{mentorName}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/5 bg-zinc-950/60 p-4 space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Microphone</span>
                <span className={audioEnabled ? "text-white font-medium" : "text-rose-400 font-medium"}>
                  {audioEnabled ? "On" : "Muted"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Camera</span>
                <span className={videoEnabled ? "text-white font-medium" : "text-zinc-400 font-medium"}>
                  {videoEnabled ? "On" : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Media Server</span>
                <span className="text-zinc-300 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> LiveKit Ultra-Low Latency
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isJoining}
              onClick={handleJoin}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b91c1c] px-6 py-3.5 text-sm font-semibold text-white shadow-xl hover:bg-[#991b1b] transition-all disabled:opacity-50"
            >
              {isJoining ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Connecting to Live Session...</span>
                </>
              ) : (
                <>
                  <span>Join Classroom Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <LiveKitDeviceSettingsModal
        ref={settingsModalRef}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
