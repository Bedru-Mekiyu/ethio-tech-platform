import Project from "../models/Project.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getPagination } from "../utils/pagination.js";

export const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create(req.body);
  sendResponse(res, 201, "Project created", { project });
});

export const getProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { track, difficulty, search } = req.query;

  const filter = {};
  if (track) filter.track = track;
  if (difficulty) filter.difficulty = difficulty;
  if (search) filter.title = { $regex: search, $options: "i" };

  const [items, total] = await Promise.all([
    Project.find(filter).populate("track", "title").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Projects fetched", {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate("track", "title");
  if (!project) throw new ApiError(404, "Project not found");
  sendResponse(res, 200, "Project fetched", { project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!project) throw new ApiError(404, "Project not found");
  sendResponse(res, 200, "Project updated", { project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw new ApiError(404, "Project not found");
  sendResponse(res, 200, "Project deleted");
});
