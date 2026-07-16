import { getEnv } from "../config/env.js";
import { isEmailConfigured, sendMentorApprovedEmail, sendMentorCredentialsEmail } from "./emailService.js";
import { setActivationToken, markCredentialsDelivered, CREDENTIALS_DELIVERY } from "./mentorProvisioningService.js";
import { notifyMentorApproved, notifyAccountCreated, notifyCredentialsSent } from "./notificationService.js";

export const buildActivationUrl = (token) => {
  const base = getEnv().appUrl.replace(/\/$/, "");
  return `${base}/auth/activate?token=${token}`;
};

export const buildLoginUrl = () => {
  const base = getEnv().appUrl.replace(/\/$/, "");
  return `${base}/login`;
};

export const deliverCredentials = async ({ user, application, _actorId, tempPassword }) => {
  const activationToken = await setActivationToken(user);
  const activationUrl = buildActivationUrl(activationToken);
  const loginUrl = buildLoginUrl();

  let deliveryMethod = CREDENTIALS_DELIVERY.ACTIVATION_LINK;
  let emailResult = { sent: false };

  if (isEmailConfigured()) {
    emailResult = await sendMentorApprovedEmail({
      to: user.email,
      fullName: user.fullName,
      loginUrl,
      activationUrl,
    });
    if (emailResult.sent) {
      deliveryMethod = CREDENTIALS_DELIVERY.EMAIL;
    }
  }

  await notifyMentorApproved({ userId: user._id, link: `/auth/activate?token=${activationToken}` });
  await notifyAccountCreated({ userId: user._id, link: activationUrl });
  await notifyCredentialsSent({ userId: user._id, link: activationUrl });

  if (application) {
    await markCredentialsDelivered(application, deliveryMethod);
  }

  const response = {
    deliveryMethod,
    emailSent: emailResult.sent,
    activationUrl: getEnv().nodeEnv !== "production" ? activationUrl : undefined,
  };

  if (getEnv().nodeEnv !== "production" && tempPassword) {
    response.devTempPassword = tempPassword;
  }

  return response;
};

export const resendCredentials = async ({ user, application, _actorId }) => {
  const activationToken = await setActivationToken(user);
  const activationUrl = buildActivationUrl(activationToken);
  const loginUrl = buildLoginUrl();

  let deliveryMethod = CREDENTIALS_DELIVERY.ACTIVATION_LINK;
  let emailResult = { sent: false };

  if (isEmailConfigured()) {
    emailResult = await sendMentorCredentialsEmail({
      to: user.email,
      fullName: user.fullName,
      loginUrl,
      activationUrl,
    });
    if (emailResult.sent) {
      deliveryMethod = CREDENTIALS_DELIVERY.EMAIL;
    }
  }

  user.mustChangePassword = true;
  user.credentialsExpiresAt = new Date(Date.now() + (getEnv().credentialsExpiryHours || 24) * 60 * 60 * 1000);
  await user.save();

  await notifyCredentialsSent({ userId: user._id, link: activationUrl });

  if (application) {
    await markCredentialsDelivered(application, deliveryMethod);
  }

  return {
    deliveryMethod,
    emailSent: emailResult.sent,
    activationUrl: getEnv().nodeEnv !== "production" ? activationUrl : undefined,
  };
};
