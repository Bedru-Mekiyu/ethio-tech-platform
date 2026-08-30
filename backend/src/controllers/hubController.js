import crypto from "crypto";
import Hub from "../models/Hub.js";
import HubAttendance from "../models/HubAttendance.js";
import HubBooking from "../models/HubBooking.js";
import MentorAvailability from "../models/MentorAvailability.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/apiResponse.js";
import { grantXPWithOptions } from "../services/xpService.js";

export const createHub = asyncHandler(async (req, res) => {
  const hub = await Hub.create(req.body);
  sendResponse(res, 201, "Hub created", { hub });
});

export const getHubs = asyncHandler(async (req, res) => {
  const hubs = await Hub.find({ isActive: true }).populate("mentorInCharge", "fullName email avatar");
  sendResponse(res, 200, "Hubs fetched", { hubs });
});

export const updateHub = asyncHandler(async (req, res) => {
  const hub = await Hub.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!hub) throw new ApiError(404, "Hub not found");
  sendResponse(res, 200, "Hub updated", { hub });
});

export const markAttendance = asyncHandler(async (req, res) => {
  const { hubId, studentId, date } = req.body;
  if (!hubId || !studentId || !date) {
    throw new ApiError(400, "hubId, studentId and date are required");
  }

  const attendance = await HubAttendance.create({
    hub: hubId,
    student: studentId,
    date,
  });

  await grantXPWithOptions({
    userId: studentId,
    amount: attendance.xpAwarded,
    reason: "Physical hub attendance",
    sourceType: "hub",
    sourceId: attendance._id,
    enforceUniqueSource: true,
    allowExisting: true,
  });

  sendResponse(res, 201, "Attendance marked and XP awarded", { attendance });
});

export const getAttendance = asyncHandler(async (req, res) => {
  const { hubId, studentId } = req.query;
  const filter = {};
  if (hubId) filter.hub = hubId;
  if (studentId) filter.student = studentId;

  const attendance = await HubAttendance.find(filter)
    .sort({ date: -1 })
    .populate("hub", "city")
    .populate("student", "fullName");

  sendResponse(res, 200, "Attendance fetched", { attendance });
});

export const bookHub = asyncHandler(async (req, res) => {
  const hubId = req.body.hubId || req.body.hub;
  const { date, timeSlot = "morning", workstationNumber, purpose = "workstation" } = req.body;
  const studentId = req.user?._id || req.user?.id;

  if (!studentId) {
    throw new ApiError(401, "Unauthorized");
  }

  const hub = await Hub.findById(hubId);
  if (!hub || !hub.isActive) {
    throw new ApiError(404, "Hub not found or inactive");
  }

  const bookingDate = new Date(date);
  if (isNaN(bookingDate.getTime())) {
    throw new ApiError(400, "Invalid booking date");
  }

  const startOfDay = new Date(bookingDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(bookingDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const slotConflict =
    timeSlot === "fullday"
      ? { $in: ["morning", "afternoon", "fullday"] }
      : { $in: [timeSlot, "fullday"] };

  const existingStudentBooking = await HubBooking.findOne({
    student: studentId,
    date: { $gte: startOfDay, $lte: endOfDay },
    timeSlot: slotConflict,
    status: { $in: ["booked", "checked_in"] },
  });

  if (existingStudentBooking) {
    throw new ApiError(400, "You already have an active booking for this time slot");
  }

  const activeBookings = await HubBooking.find({
    hub: hub._id,
    date: { $gte: startOfDay, $lte: endOfDay },
    timeSlot: slotConflict,
    status: { $in: ["booked", "checked_in"] },
  });

  const hubCapacity = hub.capacity ?? hub.computersAvailable ?? 20;

  if (activeBookings.length >= hubCapacity) {
    throw new ApiError(400, "Hub capacity reached for the selected slot");
  }

  const bookedWorkstationNumbers = new Set(
    activeBookings.map((b) => b.workstationNumber).filter(Boolean)
  );

  let assignedWorkstation = workstationNumber ? Number(workstationNumber) : undefined;
  if (assignedWorkstation) {
    if (assignedWorkstation > hubCapacity || assignedWorkstation < 1) {
      throw new ApiError(400, `Workstation number must be between 1 and ${hubCapacity}`);
    }
    if (bookedWorkstationNumbers.has(assignedWorkstation)) {
      throw new ApiError(400, `Workstation ${assignedWorkstation} is already booked for this slot`);
    }
  } else {
    for (let i = 1; i <= hubCapacity; i++) {
      if (!bookedWorkstationNumbers.has(i)) {
        assignedWorkstation = i;
        break;
      }
    }
  }

  const passCode = crypto.randomBytes(3).toString("hex").toUpperCase();

  const booking = await HubBooking.create({
    student: studentId,
    hub: hub._id,
    date: startOfDay,
    timeSlot,
    workstationNumber: assignedWorkstation,
    purpose,
    status: "booked",
    passCode,
  });

  await booking.populate("hub", "city address capacity computersAvailable");

  sendResponse(res, 201, "Hub workstation booked successfully", { booking });
});

export const getMyBookings = asyncHandler(async (req, res) => {
  const studentId = req.user?._id || req.user?.id;
  if (!studentId) {
    throw new ApiError(401, "Unauthorized");
  }

  const filter = { student: studentId };
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    HubBooking.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("hub", "city address capacity computersAvailable mentorInCharge")
      .populate("student", "fullName email avatar"),
    HubBooking.countDocuments(filter),
  ]);

  sendResponse(res, 200, "Student bookings fetched successfully", {
    bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

export const checkInHub = asyncHandler(async (req, res) => {
  const { passCode, bookingId } = req.body;

  let booking = null;
  if (bookingId) {
    booking = await HubBooking.findById(bookingId).populate("hub", "city address");
  } else if (passCode) {
    booking = await HubBooking.findOne({
      passCode: passCode.trim().toUpperCase(),
    }).populate("hub", "city address");
  }

  if (!booking) {
    throw new ApiError(404, "Booking not found with provided passCode or bookingId");
  }

  if (booking.status === "cancelled") {
    throw new ApiError(400, "Cannot check in to a cancelled booking");
  }

  if (booking.status === "checked_in" || booking.status === "completed") {
    return sendResponse(res, 200, "Already checked in", {
      booking,
      xpAwarded: 0,
    });
  }

  booking.status = "checked_in";
  booking.checkInTime = new Date();
  await booking.save();

  // Automatically award +50 physical attendance XP via xpService
  let xpResult = null;
  try {
    xpResult = await grantXPWithOptions({
      userId: booking.student,
      amount: 50,
      reason: "Physical hub attendance check-in",
      sourceType: "hub",
      sourceId: booking._id,
      enforceUniqueSource: true,
      allowExisting: true,
    });
  } catch (_err) {
    // XP might have already been recorded
  }

  // Also maintain HubAttendance for historical consistency
  try {
    const hubRef = booking.hub?._id || booking.hub;
    await HubAttendance.findOneAndUpdate(
      { hub: hubRef, student: booking.student, date: booking.date },
      {
        hub: hubRef,
        student: booking.student,
        date: booking.date,
        xpAwarded: 50,
      },
      { upsert: true, new: true }
    );
  } catch (_err) {
    // Ignore duplicate key error on HubAttendance
  }

  sendResponse(res, 200, "Check-in successful and +50 XP awarded", {
    booking,
    xpAwarded: 50,
    xpResult,
  });
});

export const getHubAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hub = await Hub.findById(id).populate("mentorInCharge", "fullName email avatar mentorRating");
  if (!hub || !hub.isActive) {
    throw new ApiError(404, "Hub not found or inactive");
  }

  const queryDate = req.query.date ? new Date(req.query.date) : new Date();
  if (isNaN(queryDate.getTime())) {
    throw new ApiError(400, "Invalid date parameter");
  }

  const startOfDay = new Date(queryDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(queryDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const activeBookings = await HubBooking.find({
    hub: hub._id,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["booked", "checked_in"] },
  }).populate("student", "fullName");

  const morningBookings = activeBookings.filter(
    (b) => b.timeSlot === "morning" || b.timeSlot === "fullday"
  );
  const afternoonBookings = activeBookings.filter(
    (b) => b.timeSlot === "afternoon" || b.timeSlot === "fullday"
  );

  const capacity = hub.capacity ?? hub.computersAvailable ?? 20;
  const computersAvailable = hub.computersAvailable ?? capacity;

  const morningBookedSeats = morningBookings.length;
  const afternoonBookedSeats = afternoonBookings.length;
  const fulldayBookedSeats = Math.max(morningBookedSeats, afternoonBookedSeats);

  const morningAvailable = Math.max(0, capacity - morningBookedSeats);
  const afternoonAvailable = Math.max(0, capacity - afternoonBookedSeats);
  const fulldayAvailable = Math.max(0, capacity - fulldayBookedSeats);

  // Find on-duty mentors
  const dayOfWeek = queryDate.getUTCDay();
  const availableMentorAvailabilities = await MentorAvailability.find({
    dayOfWeek,
    isActive: true,
  }).populate("mentor", "fullName email avatar mentorRating expertise currentCompany");

  const onDutyMentors = [];
  const seenMentorIds = new Set();

  if (hub.mentorInCharge) {
    seenMentorIds.add(hub.mentorInCharge._id.toString());
    onDutyMentors.push({
      mentor: hub.mentorInCharge,
      role: "mentor_in_charge",
    });
  }

  for (const ma of availableMentorAvailabilities) {
    if (ma.mentor && !seenMentorIds.has(ma.mentor._id.toString())) {
      seenMentorIds.add(ma.mentor._id.toString());
      onDutyMentors.push({
        mentor: ma.mentor,
        role: "on_duty_mentor",
        startMinutes: ma.startMinutes,
        endMinutes: ma.endMinutes,
        timezone: ma.timezone,
      });
    }
  }

  sendResponse(res, 200, "Hub availability fetched", {
    hub: {
      _id: hub._id,
      city: hub.city,
      address: hub.address,
      capacity,
      computersAvailable,
      mentorInCharge: hub.mentorInCharge,
    },
    date: startOfDay,
    totalCapacity: capacity,
    computersAvailable,
    slots: {
      morning: {
        booked: morningBookedSeats,
        available: morningAvailable,
        workstationsBooked: morningBookings.map((b) => b.workstationNumber).filter(Boolean),
      },
      afternoon: {
        booked: afternoonBookedSeats,
        available: afternoonAvailable,
        workstationsBooked: afternoonBookings.map((b) => b.workstationNumber).filter(Boolean),
      },
      fullday: {
        booked: fulldayBookedSeats,
        available: fulldayAvailable,
      },
    },
    onDutyMentors,
  });
});
