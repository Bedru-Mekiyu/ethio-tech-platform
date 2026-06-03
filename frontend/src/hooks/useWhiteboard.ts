import { useState, useCallback, useEffect, useRef } from "react";

export interface WhiteboardOp {
  opId: string;
  type: "pen" | "eraser" | "rect" | "circle" | "text" | "line" | "fill" | "clear";
  points?: Array<{ x: number; y: number }>;
  color?: string;
  width?: number;
  text?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  userId: string;
}

interface UseWhiteboardOptions {
  sessionId: string;
  socket: {
    emit: (event: string, payload: unknown) => void;
    on: (event: string, handler: (payload: unknown) => void) => () => void;
  };
}

export const useWhiteboard = ({ sessionId, socket }: UseWhiteboardOptions) => {
  const [ops, setOps] = useState<WhiteboardOp[]>([]);
  const [tool, setTool] = useState<WhiteboardOp["type"]>("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [connected, setConnected] = useState(false);
  const roomId = `session-${sessionId}`;
  const opIdCounter = useRef(0);

  const generateOpId = useCallback(() => {
    opIdCounter.current += 1;
    return `${Date.now()}-${opIdCounter.current}`;
  }, []);

  useEffect(() => {
    const handleDraw = (payload: unknown) => {
      const op = payload as WhiteboardOp;
      setOps(prev => [...prev, op]);
    };

    const handleClear = () => {
      setOps([]);
    };

    const handleUndo = (payload: unknown) => {
      const { opId } = payload as { opId: string };
      setOps(prev => prev.filter(op => op.opId !== opId));
    };

    const handleHistory = (payload: unknown) => {
      const { ops: historyOps } = payload as { ops: WhiteboardOp[] };
      setOps(historyOps || []);
      setConnected(true);
    };

    const unsubDraw = socket.on("whiteboard:draw", handleDraw);
    const unsubClear = socket.on("whiteboard:clear", handleClear);
    const unsubUndo = socket.on("whiteboard:undo", handleUndo);
    const unsubHistory = socket.on("whiteboard:history", handleHistory);

    return () => {
      unsubDraw();
      unsubClear();
      unsubUndo();
      unsubHistory();
    };
  }, [socket]);

  const draw = useCallback((op: Omit<WhiteboardOp, "opId" | "userId">) => {
    const fullOp: WhiteboardOp = {
      ...op,
      opId: generateOpId(),
      userId: "local",
    };
    setOps(prev => [...prev, fullOp]);
    socket.emit("whiteboard:draw", { ...fullOp, roomId });
  }, [socket, roomId, generateOpId]);

  const clear = useCallback(() => {
    setOps([]);
    socket.emit("whiteboard:clear", { roomId });
  }, [socket, roomId]);

  const undo = useCallback(() => {
    setOps(prev => {
      const lastOp = [...prev].reverse().find(o => o.userId === "local");
      if (!lastOp) return prev;
      socket.emit("whiteboard:undo", { roomId, opId: lastOp.opId });
      return prev.filter(o => o.opId !== lastOp.opId);
    });
  }, [socket, roomId]);

  return {
    ops,
    tool,
    setTool,
    color,
    setColor,
    lineWidth,
    setLineWidth,
    isDrawing,
    setIsDrawing,
    draw,
    clear,
    undo,
    connected,
    roomId,
  };
};
