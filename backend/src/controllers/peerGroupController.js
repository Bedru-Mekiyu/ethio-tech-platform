import PeerGroup from "../models/PeerGroup.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";

export const createPeerGroup = asyncHandler(async (req, res) => {
  const group = await PeerGroup.create({
    ...req.body,
    leader: req.user._id,
    members: [req.user._id],
  });
  sendResponse(res, 201, "Peer group created", { group });
});

export const getPeerGroupById = asyncHandler(async (req, res) => {
  const group = await PeerGroup.findById(req.params.id)
    .populate("leader", "fullName")
    .populate("members", "fullName role")
    .populate("track", "title");
  if (!group) throw new ApiError(404, "Peer group not found");
  sendResponse(res, 200, "Peer group fetched", { group });
});

export const getPeerGroups = asyncHandler(async (req, res) => {
  const filter = req.query.track ? { track: req.query.track } : {};
  if (req.query.mine === "true") {
    filter.$or = [{ members: req.user._id }, { leader: req.user._id }];
  }
  const groups = await PeerGroup.find(filter)
    .populate("leader", "fullName")
    .populate("members", "fullName role")
    .populate("track", "title");

  sendResponse(res, 200, "Peer groups fetched", { groups });
});

export const joinPeerGroup = asyncHandler(async (req, res) => {
  const group = await PeerGroup.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { members: req.user._id } },
    { new: true }
  ).populate("members", "fullName");

  if (!group) throw new ApiError(404, "Peer group not found");
  sendResponse(res, 200, "Joined peer group", { group });
});

export const leavePeerGroup = asyncHandler(async (req, res) => {
  const group = await PeerGroup.findByIdAndUpdate(
    req.params.id,
    { $pull: { members: req.user._id } },
    { new: true }
  ).populate("members", "fullName");

  if (!group) throw new ApiError(404, "Peer group not found");
  sendResponse(res, 200, "Left peer group", { group });
});

export const promoteLeader = asyncHandler(async (req, res) => {
  const { newLeaderId } = req.body;
  const group = await PeerGroup.findById(req.params.id);
  if (!group) throw new ApiError(404, "Peer group not found");

  if (String(group.leader) !== String(req.user._id) && req.user.role !== "admin") {
    throw new ApiError(403, "Only current leader/admin can promote");
  }

  if (!group.members.map(String).includes(String(newLeaderId))) {
    throw new ApiError(400, "New leader must be a group member");
  }

  group.leader = newLeaderId;
  await group.save();

  sendResponse(res, 200, "Leader updated", { group });
});
