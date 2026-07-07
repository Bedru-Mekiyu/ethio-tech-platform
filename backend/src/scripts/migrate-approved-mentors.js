import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import MentorApplication from "../models/MentorApplication.js";
import User from "../models/User.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import {
  APPLICATION_STATUS,
  MENTOR_STATUS,
  MENTOR_ACCOUNT_STATUS,
  ROLES,
} from "../config/permissions.js";
import { provisionOnApproval } from "../services/mentorProvisioningService.js";
import { deliverCredentials } from "../services/credentialDeliveryService.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");

async function migrateApprovedMentors() {
  await connectDB();

  const applications = await MentorApplication.find({ status: APPLICATION_STATUS.APPROVED });
  const report = [];

  for (const application of applications) {
    const email = application.email.toLowerCase();
    let user = application.userId
      ? await User.findById(application.userId)
      : await User.findOne({ email });

    let action = "skipped";

    if (!user) {
      action = dryRun ? "would_provision" : "provisioned";
      if (!dryRun) {
        const provisioning = await provisionOnApproval({
          application,
          actorId: application.reviewedBy,
        });
        user = provisioning.user;
        await deliverCredentials({
          user,
          application,
          actorId: application.reviewedBy,
          tempPassword: provisioning.tempPassword,
        });
        await AdminActivityLog.create({
          actor: application.reviewedBy,
          action: "mentor_application.provisioned",
          resource: "mentor_application",
          resourceId: application._id,
          targetUser: user._id,
          metadata: { migration: true, accountCreated: true },
        });
      }
    } else if (user.role !== ROLES.MENTOR) {
      action = dryRun ? "would_upgrade_role" : "upgraded_role";
      if (!dryRun) {
        user.role = ROLES.MENTOR;
        user.mentorStatus = MENTOR_STATUS.APPROVED;
        user.isVerified = true;
        user.mentorAccountStatus = user.lastLoginAt
          ? MENTOR_ACCOUNT_STATUS.ACTIVE
          : MENTOR_ACCOUNT_STATUS.INVITED;
        user.linkedApplicationId = application._id;
        application.userId = user._id;
        await user.save();
        await application.save();
        await AdminActivityLog.create({
          actor: application.reviewedBy,
          action: "mentor_application.provisioned",
          resource: "mentor_application",
          resourceId: application._id,
          targetUser: user._id,
          metadata: { migration: true, roleUpgraded: true },
        });
      }
    } else {
      action = "already_mentor";
      if (!dryRun) {
        user.mentorAccountStatus = user.mentorAccountStatus || MENTOR_ACCOUNT_STATUS.ACTIVE;
        application.userId = user._id;
        await user.save();
        await application.save();
      }
    }

    report.push({
      email,
      applicationId: String(application._id),
      action,
      userId: user ? String(user._id) : null,
    });
  }

  const csv = [
    "email,applicationId,action,userId",
    ...report.map((row) =>
      [row.email, row.applicationId, row.action, row.userId ?? ""].join(",")
    ),
  ].join("\n");

  const outPath = path.join(__dirname, "migrate-approved-mentors-report.csv");
  fs.writeFileSync(outPath, csv);

  console.log(`Processed ${report.length} approved applications (${dryRun ? "dry run" : "live"}).`);
  console.log(`Report written to ${outPath}`);

  await mongoose.disconnect();
}

migrateApprovedMentors().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
