import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import {
  getMarketingAboutData,
  getMarketingHomeData,
  getMarketingHubsData,
  getMarketingMentorsData,
} from "../services/marketingService.js";

export const getMarketingHome = asyncHandler(async (_req, res) => {
  const data = await getMarketingHomeData();
  sendResponse(res, 200, "Marketing home data fetched", data);
});

export const getMarketingAbout = asyncHandler(async (_req, res) => {
  const data = await getMarketingAboutData();
  sendResponse(res, 200, "Marketing about data fetched", data);
});

export const getMarketingMentors = asyncHandler(async (_req, res) => {
  const data = await getMarketingMentorsData();
  sendResponse(res, 200, "Marketing mentors data fetched", data);
});

export const getMarketingHubs = asyncHandler(async (_req, res) => {
  const data = await getMarketingHubsData();
  sendResponse(res, 200, "Marketing hubs data fetched", data);
});
