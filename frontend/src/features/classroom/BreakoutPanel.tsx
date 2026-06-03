import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBreakoutRooms, type BreakoutRoom } from "@/hooks/useBreakoutRooms";

interface BreakoutPanelProps {
  sessionId: string;
  isHost: boolean;
  socket: {
    emit: (event: string, payload: unknown) => void;
    on: (event: string, handler: (payload: unknown) => void) => () => void;
  };
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const BreakoutCard: React.FC<{
  breakout: BreakoutRoom;
  isHost: boolean;
  onJoin: (id: string) => void;
  onClose: (id: string) => void;
  onStartTimer: (id: string) => void;
}> = ({ breakout, isHost, onJoin, onClose, onStartTimer }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!breakout.timerEndsAt) return null;
    const diff = Math.max(0, Math.floor((new Date(breakout.timerEndsAt).getTime() - Date.now()) / 1000));
    return diff > 0 ? diff : 0;
  });

  React.useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <Card className="mb-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{breakout.name}</span>
          <span className="text-muted-foreground text-xs">
            {breakout.participantCount}/{breakout.maxParticipants}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>Status: {breakout.status}</span>
          {timeLeft !== null && timeLeft > 0 && (
            <span className="font-mono text-primary">{formatTime(timeLeft)}</span>
          )}
        </div>
        <div className="flex gap-1">
          {breakout.status !== "closed" && (
            <Button size="sm" variant="outline" onClick={() => onJoin(breakout._id)}>
              Join
            </Button>
          )}
          {isHost && breakout.status === "created" && (
            <Button size="sm" variant="outline" onClick={() => onStartTimer(breakout._id)}>
              Start
            </Button>
          )}
          {isHost && (
            <Button size="sm" variant="danger" onClick={() => onClose(breakout._id)}>
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const BreakoutPanel: React.FC<BreakoutPanelProps> = ({
  sessionId,
  isHost,
}) => {
  const {
    breakouts,
    loading,
    createBreakout,
    closeBreakout,
    closeAllBreakouts,
    startTimer,
  } = useBreakoutRooms({ sessionId, socket: {} as any });

  const [newName, setNewName] = useState("");
  const [maxP, setMaxP] = useState(10);
  const [timer, setTimer] = useState(300);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createBreakout(newName.trim(), maxP, timer);
    setNewName("");
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="font-semibold text-sm">Breakout Rooms</h3>
      {isHost && (
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Room name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Max"
              value={maxP}
              onChange={(e) => setMaxP(Number(e.target.value))}
              className="h-8 text-sm w-20"
              min={2}
            />
            <Input
              type="number"
              placeholder="Timer (s)"
              value={timer}
              onChange={(e) => setTimer(Number(e.target.value))}
              className="h-8 text-sm w-24"
              min={30}
            />
          </div>
          <div className="flex gap-1">
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
              Create
            </Button>
            {breakouts.length > 0 && (
              <Button size="sm" variant="danger" onClick={closeAllBreakouts}>
                Close All
              </Button>
            )}
          </div>
        </div>
      )}
      {loading ? (
        <div className="text-xs text-muted-foreground">Loading...</div>
      ) : (
        <div className="flex flex-col gap-1">
          {breakouts.length === 0 && (
            <div className="text-xs text-muted-foreground">No breakout rooms</div>
          )}
          {breakouts.map((b) => (
            <BreakoutCard
              key={b._id}
              breakout={b}
              isHost={isHost}
              onJoin={(id) => window.open(`/classroom/${sessionId}/breakout/${id}`, "_blank")}
              onClose={closeBreakout}
              onStartTimer={startTimer}
            />
          ))}
        </div>
      )}
    </div>
  );
};
