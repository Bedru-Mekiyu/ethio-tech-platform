import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import * as handRaiseService from "../services/handRaiseService.js";

export const raiseHand = asyncHandler(async (req, res) => {
  const result = await handRaiseService.raiseHand({
    sessionId: req.params.sessionId,
    userId: req.user._id,
  });
  sendResponse(res, 200, "Hand raised", { handRaise: result });
});

export const lowerHand = asyncHandler(async (req, res) => {
  const result = await handRaiseService.lowerHand({
    sessionId: req.params.sessionId,
    userId: req.user._id,
  });
  sendResponse(res, 200, "Hand lowered", { handRaise: result });
});

export const callOnStudent = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const result = await handRaiseService.callOnStudent({
    sessionId: req.params.sessionId,
    userId,
  });
  sendResponse(res, 200, "Student called on", { handRaise: result });
});

export const markAnswered = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const result = await handRaiseService.markAnswered({
    sessionId: req.params.sessionId,
    userId,
  });
  sendResponse(res, 200, "Marked answered", { handRaise: result });
});

export const getRaisedHands = asyncHandler(async (req, res) => {
  const queue = await handRaiseService.getRaisedHandsQueue(req.params.sessionId);
  const count = await handRaiseService.getHandRaiseCount(req.params.sessionId);
  sendResponse(res, 200, "Raised hands queue", { queue, count });
});

export const clearAllHands = asyncHandler(async (req, res) => {
  await handRaiseService.clearAllHands(req.params.sessionId);
  sendResponse(res, 200, "All hands cleared");
});
