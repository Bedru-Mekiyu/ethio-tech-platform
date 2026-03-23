import Resource from "../models/Resource.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";

export const createResource = asyncHandler(async (req, res) => {
  const resource = await Resource.create({ ...req.body, uploadedBy: req.user._id });
  sendResponse(res, 201, "Resource created", { resource });
});

export const getResources = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.tag) filter.tags = req.query.tag;
  if (req.query.minLevelRequired) filter.minLevelRequired = { $lte: Number(req.query.minLevelRequired) };

  const resources = await Resource.find(filter).sort({ createdAt: -1 }).populate("uploadedBy", "fullName role");

  sendResponse(res, 200, "Resources fetched", { resources });
});

export const getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id).populate("uploadedBy", "fullName role");
  if (!resource) throw new ApiError(404, "Resource not found");

  if (resource.minLevelRequired && req.user.level < resource.minLevelRequired) {
    throw new ApiError(403, "Your level is too low for this resource");
  }

  sendResponse(res, 200, "Resource fetched", { resource });
});

export const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new ApiError(404, "Resource not found");

  if (String(resource.uploadedBy) !== String(req.user._id) && req.user.role !== "admin") {
    throw new ApiError(403, "Only owner/admin can update this resource");
  }

  Object.assign(resource, req.body);
  await resource.save();

  sendResponse(res, 200, "Resource updated", { resource });
});

export const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) throw new ApiError(404, "Resource not found");

  if (String(resource.uploadedBy) !== String(req.user._id) && req.user.role !== "admin") {
    throw new ApiError(403, "Only owner/admin can delete this resource");
  }

  await resource.deleteOne();
  sendResponse(res, 200, "Resource deleted");
});
