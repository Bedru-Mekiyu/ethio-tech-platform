import { VideoTile } from "./VideoTile";
import type { AgoraUser } from "@/hooks/useAgoraRoom";
import type { ICameraVideoTrack, ILocalVideoTrack } from "agora-rtc-sdk-ng";
import { cn } from "@/lib/utils";

interface VideoGridProps {
  localVideoTrack: ICameraVideoTrack | null;
  remoteUsers: AgoraUser[];
  screenTrack: ILocalVideoTrack | null;
  localUserId?: string;
  className?: string;
}

function getGridLayout(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-3";
  if (count <= 9) return "grid-cols-3";
  return "grid-cols-4";
}

export function VideoGrid({
  localVideoTrack,
  remoteUsers,
  screenTrack,
  localUserId,
  className,
}: VideoGridProps) {
  const totalCount = 1 + remoteUsers.length;

  if (screenTrack) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-900">
          <VideoTile
            localVideoTrack={screenTrack}
            label="Screen Share"
            isLocal={true}
            size="spotlight"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <VideoTile
            localVideoTrack={localVideoTrack}
            label="You"
            isLocal={true}
            size="compact"
          />
          {remoteUsers.map((user) => (
            <VideoTile
              key={String(user.uid)}
              user={user}
              size="compact"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-2 auto-rows-fr",
        getGridLayout(totalCount),
        className
      )}
    >
      <VideoTile
        localVideoTrack={localVideoTrack}
        label="You"
        isLocal={true}
        size="full"
      />
      {remoteUsers.map((user) => (
        <VideoTile
          key={String(user.uid)}
          user={user}
          size="full"
        />
      ))}
    </div>
  );
}
