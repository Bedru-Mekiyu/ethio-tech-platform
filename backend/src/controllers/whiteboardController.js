import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getLatestSnapshot } from "../services/whiteboardService.js";

export const getWhiteboard = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const roomId = `session-${sessionId}`;
  const snapshot = await getLatestSnapshot(roomId);

  sendResponse(res, 200, "Whiteboard snapshot", {
    snapshot: snapshot?.snapshot || [],
    revision: snapshot?.revision || 0,
  });
});
