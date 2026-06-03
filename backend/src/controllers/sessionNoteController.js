import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import ApiError from "../utils/ApiError.js";
import * as noteService from "../services/sessionNoteService.js";
import SessionNote from "../models/SessionNote.js";

export const getOrCreateNotes = asyncHandler(async (req, res) => {
  const notes = await noteService.getOrCreateNotes({
    sessionId: req.params.sessionId,
    userId: req.user._id,
  });
  sendResponse(res, 200, "Session notes", { notes });
});

export const updateNotes = asyncHandler(async (req, res) => {
  const { content, title } = req.body;
  const notes = await noteService.updateNotes({
    sessionId: req.params.sessionId,
    userId: req.user._id,
    content,
    title,
  });
  sendResponse(res, 200, "Notes updated", { notes });
});

export const publishNotes = asyncHandler(async (req, res) => {
  const notes = await noteService.publishNotes({ sessionId: req.params.sessionId });
  sendResponse(res, 200, "Notes published", { notes });
});

export const unpublishNotes = asyncHandler(async (req, res) => {
  const notes = await noteService.unpublishNotes({ sessionId: req.params.sessionId });
  sendResponse(res, 200, "Notes unpublished", { notes });
});

export const getNotesVersion = asyncHandler(async (req, res) => {
  const version = parseInt(req.params.version, 10);
  const result = await noteService.getNotesVersion({ sessionId: req.params.sessionId, version });
  sendResponse(res, 200, "Notes version", result);
});

export const addResource = asyncHandler(async (req, res) => {
  const { title, url, type } = req.body;
  if (!title?.trim() || !url?.trim()) throw new ApiError(400, "Title and URL are required");
  const notes = await noteService.addResource({
    sessionId: req.params.sessionId,
    title,
    url,
    type: type || "link",
  });
  sendResponse(res, 200, "Resource added", { notes });
});

export const removeResource = asyncHandler(async (req, res) => {
  const notes = await noteService.removeResource({
    sessionId: req.params.sessionId,
    resourceIndex: parseInt(req.params.index, 10),
  });
  sendResponse(res, 200, "Resource removed", { notes });
});

export const getPublishedNotes = asyncHandler(async (req, res) => {
  const notes = await noteService.getSessionNotesForStudent(req.params.sessionId);
  sendResponse(res, 200, "Published notes", { notes });
});

export const getMyStudentNotes = asyncHandler(async (req, res) => {
  const notes = await SessionNote.findOne({
    session: req.params.sessionId,
    createdBy: req.user._id,
    isStudentNote: true,
  });
  sendResponse(res, 200, "Student notes", { notes: notes || { content: "" } });
});

export const updateMyStudentNotes = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const notes = await SessionNote.findOneAndUpdate(
    { session: req.params.sessionId, createdBy: req.user._id, isStudentNote: true },
    { content, isStudentNote: true, visibility: "private", createdBy: req.user._id },
    { upsert: true, new: true }
  );
  sendResponse(res, 200, "Student notes saved", { notes });
});
