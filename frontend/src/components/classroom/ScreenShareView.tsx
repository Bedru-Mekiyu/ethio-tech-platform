import type { ILocalVideoTrack } from "agora-rtc-sdk-ng";
import { VideoTile } from "./VideoTile";

interface ScreenShareViewProps {
  screenTrack: ILocalVideoTrack;
  presenterName?: string;
}

export function ScreenShareView({ screenTrack, presenterName = "Presenter" }: ScreenShareViewProps) {
  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-900">
      <VideoTile
        localVideoTrack={screenTrack}
        label={`${presenterName}'s Screen`}
        isLocal={true}
        size="spotlight"
      />
      <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
        <span className="text-white text-xs font-medium flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Screen Share
        </span>
      </div>
    </div>
  );
}
