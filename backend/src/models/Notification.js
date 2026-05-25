import mongoose from "mongoose";

const { Schema, model } = mongoose;

const notificationSchema = new Schema({
	recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
	type: {
		type: String,
		enum: ["system", "mentor", "project", "session", "badge", "xp"],
		required: true,
	},
	message: { type: String, required: true, trim: true },
	link: { type: String, trim: true },
	isRead: { type: Boolean, default: false },
	createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL: 90 days

export default model("Notification", notificationSchema);
