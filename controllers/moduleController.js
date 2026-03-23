import Module from "../models/Module.js";
import Track from "../models/Track.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";

export const createModule = asyncHandler(async (req, res) => {
  const track = await Track.findById(req.body.track);
  if (!track) throw new ApiError(404, "Track not found");

  const moduleDoc = await Module.create(req.body);
  await Track.findByIdAndUpdate(moduleDoc.track, { $addToSet: { modules: moduleDoc._id } });
  sendResponse(res, 201, "Module created", { module: moduleDoc });
});

export const getModules = asyncHandler(async (req, res) => {
  const filter = req.query.track ? { track: req.query.track } : {};
  const modules = await Module.find(filter).populate("lessons", "title order").sort({ order: 1, createdAt: 1 });
  sendResponse(res, 200, "Modules fetched", { modules });
});

export const getModuleById = asyncHandler(async (req, res) => {
  const moduleDoc = await Module.findById(req.params.id).populate("lessons");
  if (!moduleDoc) throw new ApiError(404, "Module not found");
  sendResponse(res, 200, "Module fetched", { module: moduleDoc });
});

export const updateModule = asyncHandler(async (req, res) => {
  const existingModule = await Module.findById(req.params.id);
  if (!existingModule) throw new ApiError(404, "Module not found");

  if (req.body.track) {
    const targetTrack = await Track.findById(req.body.track);
    if (!targetTrack) throw new ApiError(404, "Track not found");
  }

  const moduleDoc = await Module.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (req.body.track && String(existingModule.track) !== String(moduleDoc.track)) {
    await Promise.all([
      Track.findByIdAndUpdate(existingModule.track, { $pull: { modules: moduleDoc._id } }),
      Track.findByIdAndUpdate(moduleDoc.track, { $addToSet: { modules: moduleDoc._id } }),
    ]);
  }

  sendResponse(res, 200, "Module updated", { module: moduleDoc });
});

export const deleteModule = asyncHandler(async (req, res) => {
  const moduleDoc = await Module.findByIdAndDelete(req.params.id);
  if (!moduleDoc) throw new ApiError(404, "Module not found");
  await Track.findByIdAndUpdate(moduleDoc.track, { $pull: { modules: moduleDoc._id } });
  sendResponse(res, 200, "Module deleted");
});
