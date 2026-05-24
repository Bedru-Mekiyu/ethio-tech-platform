import AuditLog from "../models/AuditLog.js";

export const auditAction = (action, resource) => async (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 400 || !req.user) return;
    AuditLog.create({
      actor: req.user._id,
      action,
      resource,
      resourceId: req.params?.id,
      metadata: { method: req.method, path: req.originalUrl },
      ip: req.ip,
    }).catch(() => {});
  });
  next();
};
