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

export default model("Notification", notificationSchema);
