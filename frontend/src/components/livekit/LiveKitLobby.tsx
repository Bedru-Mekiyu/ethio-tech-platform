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
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900/60 p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Camera Preview */}
          <div className="md:col-span-7 flex flex-col items-center">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-inner flex items-center justify-center">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-violet-600/20 text-violet-400 border border-violet-500/30 shadow-2xl">
                    <UserIcon className="h-12 w-12" />
                  </div>
                  <p className="mt-4 text-xs font-medium text-slate-400">Camera is turned off</p>
                </div>
              )}

              {/* In-Preview Floating AV Toggles */}
              <div className="absolute bottom-4 flex items-center gap-3 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    audioEnabled ? "bg-slate-800 text-emerald-400 hover:bg-slate-700" : "bg-rose-500 text-white"
                  }`}
                  title={audioEnabled ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    videoEnabled ? "bg-slate-800 text-sky-400 hover:bg-slate-700" : "bg-rose-500 text-white"
                  }`}
                  title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
                >
                  {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                  title="Device Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              {/* Mic volume meter overlay */}
              {audioEnabled && !permissionError && (
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-md px-3 py-1 border border-white/5">
                  <Mic className="h-3.5 w-3.5 text-emerald-400" />
                  <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {permissionError && (
              <p className="mt-3 text-xs text-amber-400/90 text-center">{permissionError}</p>
            )}
          </div>

          {/* Right Column: Session Info & CTA */}
          <div className="md:col-span-5 flex flex-col justify-center space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400 mb-3">
                <Radio className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                <span>Ready to Join</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                {sessionTitle}
              </h2>
              {mentorName && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <Shield className="h-3.5 w-3.5 text-violet-400" />
                  <span>Hosted by <strong className="text-slate-200">{mentorName}</strong></span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Microphone</span>
                <span className={audioEnabled ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>
                  {audioEnabled ? "On" : "Muted"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Camera</span>
                <span className={videoEnabled ? "text-sky-400 font-medium" : "text-slate-400 font-medium"}>
                  {videoEnabled ? "On" : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Media Server</span>
                <span className="text-violet-400 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> LiveKit Ultra-Low Latency
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isJoining}
              onClick={handleJoin}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 hover:from-violet-500 hover:to-violet-500 transition-all disabled:opacity-50"
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
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
