import ApiError from "../utils/ApiError.js";

const formatIssues = (issues) =>
  issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

const validateRequest = ({ body, params, query } = {}) => (req, res, next) => {
  if (body) {
    const parsed = body.safeParse(req.body);
    if (!parsed.success) {
      return next(new ApiError(400, "Validation failed", formatIssues(parsed.error.issues)));
    }
    req.body = parsed.data;
  }

  if (params) {
    const parsed = params.safeParse(req.params);
    if (!parsed.success) {
      return next(new ApiError(400, "Validation failed", formatIssues(parsed.error.issues)));
    }
    req.params = parsed.data;
  }

  if (query) {
    const parsed = query.safeParse(req.query);
    if (!parsed.success) {
      return next(new ApiError(400, "Validation failed", formatIssues(parsed.error.issues)));
    }
    req.query = parsed.data;
  }

  return next();
};

export default validateRequest;
