import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import {
  getMarketingAboutData,
  getMarketingHomeData,
  getMarketingHubsData,
  getMarketingMentorsData,
} from "../services/marketingService.js";

// ─── In-Memory TTL Cache (5 minutes) ─────────────────────────────────────────
// Marketing stats change infrequently. Caching eliminates 4 DB queries per page load
// after the first request. Cache is process-local and self-heals on server restart.
const _cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  _cache.set(key, { data, ts: Date.now() });
}

export const getMarketingHome = asyncHandler(async (_req, res) => {
  const cached = getCached("marketing:home");
  if (cached) return sendResponse(res, 200, "Marketing home data fetched", cached);
  const data = await getMarketingHomeData();
  setCached("marketing:home", data);
  sendResponse(res, 200, "Marketing home data fetched", data);
});

export const getMarketingAbout = asyncHandler(async (_req, res) => {
  const cached = getCached("marketing:about");
  if (cached) return sendResponse(res, 200, "Marketing about data fetched", cached);
  const data = await getMarketingAboutData();
  setCached("marketing:about", data);
  sendResponse(res, 200, "Marketing about data fetched", data);
});

export const getMarketingMentors = asyncHandler(async (_req, res) => {
  const cached = getCached("marketing:mentors");
  if (cached) return sendResponse(res, 200, "Marketing mentors data fetched", cached);
  const data = await getMarketingMentorsData();
  setCached("marketing:mentors", data);
  sendResponse(res, 200, "Marketing mentors data fetched", data);
});

export const getMarketingHubs = asyncHandler(async (_req, res) => {
  const cached = getCached("marketing:hubs");
  if (cached) return sendResponse(res, 200, "Marketing hubs data fetched", cached);
  const data = await getMarketingHubsData();
  setCached("marketing:hubs", data);
  sendResponse(res, 200, "Marketing hubs data fetched", data);
});
