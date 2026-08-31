import { useState, useEffect } from "react";
import { Room } from "livekit-client";
import { Mic, Video, Volume2, X, Check, RefreshCw } from "lucide-react";

interface LiveKitDeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: Room | null;
}

export function LiveKitDeviceSettingsModal({ isOpen, onClose, room }: LiveKitDeviceSettingsModalProps) {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);

  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");

  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadDevices = async () => {
    try {
      setLoading(true);
      if (typeof navigator === "undefined" || !navigator?.mediaDevices?.enumerateDevices) {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const aIn = devices.filter((d) => d.kind === "audioinput");
      const vIn = devices.filter((d) => d.kind === "videoinput");
      const aOut = devices.filter((d) => d.kind === "audiooutput");

      setAudioInputs(aIn);
      setVideoInputs(vIn);
      setAudioOutputs(aOut);

      if (room) {
        const currentCam = room.getActiveDevice("videoinput");
        const currentMic = room.getActiveDevice("audioinput");
        const currentSpeaker = room.getActiveDevice("audiooutput");

        if (currentCam) setSelectedVideoInput(currentCam);
        else if (vIn.length > 0) setSelectedVideoInput(vIn[0].deviceId);

        if (currentMic) setSelectedAudioInput(currentMic);
        else if (aIn.length > 0) setSelectedAudioInput(aIn[0].deviceId);

        if (currentSpeaker) setSelectedAudioOutput(currentSpeaker);
        else if (aOut.length > 0) setSelectedAudioOutput(aOut[0].deviceId);
      } else {
        if (vIn.length > 0 && !selectedVideoInput) setSelectedVideoInput(vIn[0].deviceId);
        if (aIn.length > 0 && !selectedAudioInput) setSelectedAudioInput(aIn[0].deviceId);
        if (aOut.length > 0 && !selectedAudioOutput) setSelectedAudioOutput(aOut[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadDevices();
    } else {
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
        setPreviewStream(null);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedAudioInput) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let stream: MediaStream | null = null;
    let animationId: number;

    const startAudioMeter = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedAudioInput } },
        });

        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((acc, val) => acc + val, 0);
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationId = requestAnimationFrame(checkLevel);
        };
        checkLevel();
      } catch (err) {
        console.warn("Audio meter error:", err);
      }
    };

    void startAudioMeter();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioContext) void audioContext.close();
    };
  }, [isOpen, selectedAudioInput]);

  const handleApply = async () => {
    if (room) {
      try {
        if (selectedVideoInput) await room.switchActiveDevice("videoinput", selectedVideoInput);
        if (selectedAudioInput) await room.switchActiveDevice("audioinput", selectedAudioInput);
        if (selectedAudioOutput) await room.switchActiveDevice("audiooutput", selectedAudioOutput);
      } catch (err) {
        console.error("Failed to switch devices in room:", err);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/20 p-2 text-violet-400">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Device & Audio Settings</h2>
              <p className="text-xs text-slate-400">Configure your camera, microphone, and output devices</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Microphone */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-emerald-400" /> Microphone
              </span>
              <button
                type="button"
                onClick={loadDevices}
                className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </label>
            <select
              value={selectedAudioInput}
              onChange={(e) => setSelectedAudioInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {audioInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone (${d.deviceId.slice(0, 5)})`}
                </option>
              ))}
              {audioInputs.length === 0 && <option value="">No microphone found</option>}
            </select>
            {/* Audio level meter */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] uppercase font-semibold text-slate-500">Input Level</span>
              <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 w-7 text-right">{audioLevel}%</span>
            </div>
          </div>

          {/* Camera */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Video className="h-4 w-4 text-sky-400" /> Camera
            </label>
            <select
              value={selectedVideoInput}
              onChange={(e) => setSelectedVideoInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {videoInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera (${d.deviceId.slice(0, 5)})`}
                </option>
              ))}
              {videoInputs.length === 0 && <option value="">No camera found</option>}
            </select>
          </div>

          {/* Speaker / Audio Output */}
          {audioOutputs.length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Volume2 className="h-4 w-4 text-purple-400" /> Speaker / Output
              </label>
              <select
                value={selectedAudioOutput}
                onChange={(e) => setSelectedAudioOutput(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {audioOutputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Speaker (${d.deviceId.slice(0, 5)})`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 transition-colors"
          >
            <Check className="h-4 w-4" /> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
