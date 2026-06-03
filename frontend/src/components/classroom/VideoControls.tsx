import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Hand, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHand: () => void;
  onLeave: () => void;
  className?: string;
}

export function VideoControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isHandRaised,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHand,
  onLeave,
  className,
}: VideoControlsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 p-3 bg-gray-900/90 backdrop-blur-sm rounded-2xl",
        className
      )}
      role="toolbar"
      aria-label="Video controls"
    >
      <Button
        variant={isAudioEnabled ? "default" : "destructive"}
        size="icon"
        className="h-11 w-11 rounded-full"
        onClick={onToggleAudio}
        aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
      >
        {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </Button>

      <Button
        variant={isVideoEnabled ? "default" : "destructive"}
        size="icon"
        className="h-11 w-11 rounded-full"
        onClick={onToggleVideo}
        aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </Button>

      <Button
        variant={isScreenSharing ? "default" : "outline"}
        size="icon"
        className={cn(
          "h-11 w-11 rounded-full",
          isScreenSharing && "bg-green-600 hover:bg-green-700"
        )}
        onClick={onToggleScreenShare}
        aria-label={isScreenSharing ? "Stop screen sharing" : "Start screen sharing"}
      >
        {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
      </Button>

      <Button
        variant={isHandRaised ? "default" : "outline"}
        size="icon"
        className={cn(
          "h-11 w-11 rounded-full",
          isHandRaised && "bg-yellow-500 hover:bg-yellow-600"
        )}
        onClick={onToggleHand}
        aria-label={isHandRaised ? "Lower hand" : "Raise hand"}
      >
        <Hand className={cn("h-5 w-5", isHandRaised && "text-white")} />
      </Button>

      <div className="w-px h-8 bg-gray-600 mx-1" />

      <Button
        variant="destructive"
        size="icon"
        className="h-11 w-11 rounded-full bg-red-600 hover:bg-red-700"
        onClick={onLeave}
        aria-label="Leave room"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
