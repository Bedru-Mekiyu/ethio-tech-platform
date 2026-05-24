import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getMarketingHomeData } from "../services/marketingService.js";

export const getMarketingHome = asyncHandler(async (_req, res) => {
  const data = await getMarketingHomeData();
  sendResponse(res, 200, "Marketing home data fetched", data);
});
