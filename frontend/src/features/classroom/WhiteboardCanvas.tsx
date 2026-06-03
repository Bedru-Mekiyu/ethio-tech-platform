import React, { useRef, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWhiteboard, type WhiteboardOp } from "@/hooks/useWhiteboard";

interface WhiteboardCanvasProps {
  sessionId: string;
  socket: {
    emit: (event: string, payload: unknown) => void;
    on: (event: string, handler: (payload: unknown) => void) => () => void;
  };
}

const COLORS = ["#000000", "#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6"];
const TOOLS: Array<{ icon: string; type: WhiteboardOp["type"] }> = [
  { icon: "Pen", type: "pen" },
  { icon: "Line", type: "line" },
  { icon: "Rect", type: "rect" },
  { icon: "Circle", type: "circle" },
  { icon: "Text", type: "text" },
  { icon: "Eraser", type: "eraser" },
];

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ sessionId, socket }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    ops,
    tool,
    setTool,
    color,
    setColor,
    lineWidth,
    setLineWidth,
    draw,
    clear,
    undo,
  } = useWhiteboard({ sessionId, socket });

  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number }>>([]);

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e);
      if (tool === "text") {
        const text = prompt("Enter text:");
        if (text) {
          draw({ type: "text", text, x: pos.x, y: pos.y, color, width: lineWidth, points: [] });
        }
        return;
      }
      setStartPoint(pos);
      setCurrentPoints([pos]);
    },
    [tool, color, lineWidth, getCanvasPos, draw]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!startPoint && tool !== "pen" && tool !== "eraser" && tool !== "line") return;
      const pos = getCanvasPos(e);
      setCurrentPoints(prev => [...prev, pos]);
    },
    [startPoint, tool, getCanvasPos]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e);

      if (tool === "pen" || tool === "eraser") {
        draw({
          type: tool,
          points: currentPoints.length > 0 ? currentPoints : [pos],
          color: tool === "eraser" ? "#FFFFFF" : color,
          width: tool === "eraser" ? lineWidth * 3 : lineWidth,
        });
      } else if (startPoint) {
        draw({
          type: tool,
          points: [startPoint, pos],
          color,
          width: lineWidth,
          x: Math.min(startPoint.x, pos.x),
          y: Math.min(startPoint.y, pos.y),
          w: Math.abs(pos.x - startPoint.x),
          h: Math.abs(pos.y - startPoint.y),
        });
      }

      setStartPoint(null);
      setCurrentPoints([]);
    },
    [tool, color, lineWidth, startPoint, currentPoints, draw, getCanvasPos]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const op of ops) {
      ctx.strokeStyle = op.color || "#000000";
      ctx.lineWidth = op.width || 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (op.type) {
        case "pen":
          if (op.points && op.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(op.points[0].x, op.points[0].y);
            for (let i = 1; i < op.points.length; i++) {
              ctx.lineTo(op.points[i].x, op.points[i].y);
            }
            ctx.stroke();
          }
          break;
        case "eraser":
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = op.width || 10;
          if (op.points && op.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(op.points[0].x, op.points[0].y);
            for (let i = 1; i < op.points.length; i++) {
              ctx.lineTo(op.points[i].x, op.points[i].y);
            }
            ctx.stroke();
          }
          break;
        case "line":
          if (op.points && op.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(op.points[0].x, op.points[0].y);
            ctx.lineTo(op.points[1].x, op.points[1].y);
            ctx.stroke();
          }
          break;
        case "rect":
          if (op.x !== undefined && op.y !== undefined && op.w !== undefined && op.h !== undefined) {
            ctx.strokeRect(op.x, op.y, op.w, op.h);
          }
          break;
        case "circle":
          if (op.x !== undefined && op.y !== undefined && op.w !== undefined && op.h !== undefined) {
            ctx.beginPath();
            ctx.ellipse(
              op.x + op.w / 2,
              op.y + op.h / 2,
              Math.abs(op.w / 2),
              Math.abs(op.h / 2),
              0,
              0,
              Math.PI * 2
            );
            ctx.stroke();
          }
          break;
        case "text":
          if (op.text && op.x !== undefined && op.y !== undefined) {
            ctx.fillStyle = op.color || "#000000";
            ctx.font = `${(op.width || 2) * 6}px sans-serif`;
            ctx.fillText(op.text, op.x, op.y);
          }
          break;
        case "fill":
          if (op.points && op.points.length > 0) {
            ctx.fillStyle = op.color || "#000000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          break;
      }
    }
  }, [ops]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {TOOLS.map((t) => (
          <Button
            key={t.type}
            variant={tool === t.type ? "default" : "outline"}
            size="sm"
            onClick={() => setTool(t.type)}
            aria-label={`Select ${t.icon} tool`}
          >
            {t.icon}
          </Button>
        ))}
        <div className="w-px h-6 bg-border" />
        {COLORS.map((c) => (
          <button
            key={c}
            className="w-6 h-6 rounded-full border-2"
            style={{
              backgroundColor: c,
              borderColor: color === c ? "#3B82F6" : "transparent",
            }}
            onClick={() => setColor(c)}
            aria-label={`Select color ${c}`}
          />
        ))}
        <div className="w-px h-6 bg-border" />
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="w-20"
          aria-label="Line width"
        />
        <div className="w-px h-6 bg-border" />
        <Button variant="outline" size="sm" onClick={undo} aria-label="Undo">
          Undo
        </Button>
        <Button variant="destructive" size="sm" onClick={clear} aria-label="Clear board">
          Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="border rounded cursor-crosshair w-full max-w-full"
        style={{ touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};
