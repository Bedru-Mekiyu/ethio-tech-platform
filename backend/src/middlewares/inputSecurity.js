import ApiError from "../utils/ApiError.js";

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);

const scanForUnsafeKeys = (value, path = []) => {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const unsafe = scanForUnsafeKeys(value[index], [...path, String(index)]);
      if (unsafe) return unsafe;
    }
    return null;
  }

  if (!isPlainObject(value)) return null;

  for (const [key, nested] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      return [...path, key].join(".");
    }

    const unsafe = scanForUnsafeKeys(nested, [...path, key]);
    if (unsafe) return unsafe;
  }

  return null;
};

export const rejectMongoOperators = (req, _res, next) => {
  const unsafePath =
    scanForUnsafeKeys(req.body, ["body"]) ||
    scanForUnsafeKeys(req.query, ["query"]) ||
    scanForUnsafeKeys(req.params, ["params"]);

  if (unsafePath) {
    return next(new ApiError(400, "Unsafe request key rejected", { path: unsafePath }));
  }

  return next();
};
