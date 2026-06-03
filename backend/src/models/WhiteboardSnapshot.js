import mongoose from "mongoose";

const { Schema, model } = mongoose;

const whiteboardOpSchema = new Schema({
  opId: { type: String, required: true },
  type: { type: String, enum: ["pen", "eraser", "rect", "circle", "text", "line", "fill"], required: true },
  points: [{ x: Number, y: Number }],
  color: { type: String, default: "#000000" },
  width: { type: Number, default: 2 },
  text: { type: String },
  x: Number,
  y: Number,
  w: Number,
  h: Number,
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { _id: false });

const whiteboardSnapshotSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true },
  roomId: { type: String, required: true },
  snapshot: [whiteboardOpSchema],
  revision: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  boardWidth: { type: Number, default: 1200 },
  boardHeight: { type: Number, default: 800 },
}, { timestamps: true });

whiteboardSnapshotSchema.index({ sessionId: 1, revision: -1 });
whiteboardSnapshotSchema.index({ roomId: 1 });

export default model("WhiteboardSnapshot", whiteboardSnapshotSchema);
