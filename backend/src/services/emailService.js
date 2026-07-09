import { getEnv } from "../config/env.js";

let transporter = null;

const isEmailConfigured = () => {
  const env = getEnv();
  return Boolean(env.smtpHost && env.smtpFrom);
};

const getTransporter = async () => {
  if (!isEmailConfigured()) return null;
  if (transporter) return transporter;

  const nodemailer = await import("nodemailer");
  const env = getEnv();
  transporter = nodemailer.default.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
  });
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!isEmailConfigured()) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  try {
    const transport = await getTransporter();
    const env = getEnv();
    await transport.sendMail({
      from: env.smtpFrom,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ""),
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error.message };
  }
};

export const sendMentorApprovedEmail = async ({ to, fullName, loginUrl, activationUrl }) => {
  const subject = "Mentor Application Approved";
  const html = `
    <h2>Welcome, ${fullName}!</h2>
    <p>Your mentor application has been approved. Your mentor account is ready.</p>
    <p><strong>Email:</strong> ${to}</p>
    <p><a href="${activationUrl}">Activate your account and set your password</a></p>
    <p>Or sign in at: <a href="${loginUrl}">${loginUrl}</a></p>
    <p>This activation link expires in 24 hours.</p>
  `;
  return sendEmail({ to, subject, html });
};

export const sendMentorCredentialsEmail = async ({ to, fullName, loginUrl }) => {
  const subject = "Your Mentor Account Is Ready";
  const html = `
    <h2>Hello, ${fullName}!</h2>
    <p>Your mentor account credentials have been regenerated.</p>
    <p>Please use the activation link sent separately or sign in at: <a href="${loginUrl}">${loginUrl}</a></p>
  `;
  return sendEmail({ to, subject, html });
};

export const sendMentorApplicationReceivedEmail = async ({ to, fullName }) => {
  const subject = "Mentor Application Received";
  const html = `
    <h2>Thank you, ${fullName}!</h2>
    <p>We have received your mentor application and our team will review it shortly.</p>
  `;
  return sendEmail({ to, subject, html });
};

export const sendMentorRejectedEmail = async ({ to, fullName, reason }) => {
  const subject = "Mentor Application Update";
  const html = `
    <h2>Hello, ${fullName}</h2>
    <p>Thank you for your interest in mentoring. After review, we are unable to approve your application at this time.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
  `;
  return sendEmail({ to, subject, html });
};

export const sendMentorChangesRequestedEmail = async ({ to, fullName, notes }) => {
  const subject = "Mentor Application — Changes Requested";
  const html = `
    <h2>Hello, ${fullName}</h2>
    <p>Our team has reviewed your mentor application and requested some changes before we can proceed.</p>
    <p><strong>Notes:</strong> ${notes}</p>
    <p>Please resubmit your application with the requested updates.</p>
  `;
  return sendEmail({ to, subject, html });
};

export const sendAccountSuspendedEmail = async ({ to, fullName, reason }) => {
  const subject = "Account Suspended";
  const html = `
    <h2>Hello, ${fullName}</h2>
    <p>Your mentor account has been suspended.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    <p>If you believe this was in error, please contact support.</p>
  `;
  return sendEmail({ to, subject, html });
};

export const sendPasswordResetByAdminEmail = async ({ to, fullName, loginUrl }) => {
  const subject = "Password Reset — Mentor Account";
  const html = `
    <h2>Hello, ${fullName}</h2>
    <p>An administrator has reset your password. You will need to set a new password on your next login.</p>
    <p><a href="${loginUrl}">Sign in to your account</a></p>
    <p>If you did not request this, please contact support immediately.</p>
  `;
  return sendEmail({ to, subject, html });
};

export {
  isEmailConfigured,
  sendAccountSuspendedEmail,
  sendPasswordResetByAdminEmail,
};
