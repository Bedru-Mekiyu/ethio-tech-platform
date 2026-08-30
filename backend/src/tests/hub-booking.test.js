import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import HubBooking from "../models/HubBooking.js";
import Hub from "../models/Hub.js";
import HubAttendance from "../models/HubAttendance.js";
import MentorAvailability from "../models/MentorAvailability.js";
import { hubSchemas } from "../validators/schemas.js";
import {
  bookHub,
  checkInHub,
  getMyBookings,
  getHubAvailability,
} from "../controllers/hubController.js";
import * as xpService from "../services/xpService.js";

// Mock xpService
vi.mock("../services/xpService.js", () => ({
  grantXPWithOptions: vi.fn().mockResolvedValue({
    user: { _id: "student-1", xp: 50 },
    log: { _id: "log-1", amount: 50 },
  }),
}));

describe("HubBooking Model Schema", () => {
  it("has all required fields in schema", () => {
    const paths = HubBooking.schema.paths;
    expect(paths.student).toBeDefined();
    expect(paths.hub).toBeDefined();
    expect(paths.date).toBeDefined();
    expect(paths.timeSlot).toBeDefined();
    expect(paths.workstationNumber).toBeDefined();
    expect(paths.purpose).toBeDefined();
    expect(paths.status).toBeDefined();
    expect(paths.checkInTime).toBeDefined();
    expect(paths.passCode).toBeDefined();
  });

  it("timeSlot enum contains morning, afternoon, fullday", () => {
    const timeSlotEnum = HubBooking.schema.paths.timeSlot.enumValues;
    expect(timeSlotEnum).toEqual(["morning", "afternoon", "fullday"]);
  });

  it("status enum contains booked, checked_in, completed, cancelled", () => {
    const statusEnum = HubBooking.schema.paths.status.enumValues;
    expect(statusEnum).toEqual(["booked", "checked_in", "completed", "cancelled"]);
  });

  it("sets default status to 'booked' and default purpose to 'workstation'", () => {
    expect(HubBooking.schema.paths.status.defaultValue).toBe("booked");
    expect(HubBooking.schema.paths.purpose.defaultValue).toBe("workstation");
  });

  it("auto-generates passCode on validate when not provided", () => {
    const dummyId = new mongoose.Types.ObjectId();
    const booking = new HubBooking({
      student: dummyId,
      hub: dummyId,
      date: new Date("2026-09-01"),
      timeSlot: "morning",
    });

    booking.validateSync();
    expect(booking.passCode).toBeDefined();
    expect(typeof booking.passCode).toBe("string");
    expect(booking.passCode.length).toBeGreaterThanOrEqual(4);
  });
});

describe("Hub Booking Validation Schemas", () => {
  const validObjectId = new mongoose.Types.ObjectId().toString();

  it("validates valid booking payload", () => {
    const payload = {
      hubId: validObjectId,
      date: "2026-09-01T08:00:00Z",
      timeSlot: "morning",
      workstationNumber: 5,
      purpose: "Workstation for backend project",
    };
    const parsed = hubSchemas.book.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("accepts hub field instead of hubId", () => {
    const payload = {
      hub: validObjectId,
      date: "2026-09-01",
      timeSlot: "fullday",
    };
    const parsed = hubSchemas.book.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("rejects booking payload missing both hubId and hub", () => {
    const payload = {
      date: "2026-09-01",
      timeSlot: "morning",
    };
    const parsed = hubSchemas.book.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("rejects booking payload with invalid timeSlot", () => {
    const payload = {
      hubId: validObjectId,
      date: "2026-09-01",
      timeSlot: "evening",
    };
    const parsed = hubSchemas.book.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("rejects booking payload with invalid date", () => {
    const payload = {
      hubId: validObjectId,
      date: "not-a-date",
      timeSlot: "morning",
    };
    const parsed = hubSchemas.book.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("validates checkin with passCode", () => {
    const parsed = hubSchemas.checkin.safeParse({ passCode: "A1B2C3" });
    expect(parsed.success).toBe(true);
  });

  it("validates checkin with bookingId", () => {
    const parsed = hubSchemas.checkin.safeParse({ bookingId: validObjectId });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty checkin payload", () => {
    const parsed = hubSchemas.checkin.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("validates availabilityQuery schema", () => {
    expect(hubSchemas.availabilityQuery.safeParse({}).success).toBe(true);
    expect(hubSchemas.availabilityQuery.safeParse({ date: "2026-09-01" }).success).toBe(true);
    expect(hubSchemas.availabilityQuery.safeParse({ date: "invalid-date" }).success).toBe(false);
  });
});

describe("Hub Controller - Booking, Check-in & Availability", () => {
  const studentId = new mongoose.Types.ObjectId().toString();
  const hubId = new mongoose.Types.ObjectId().toString();
  const mentorId = new mongoose.Types.ObjectId().toString();

  let mockHub;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHub = {
      _id: hubId,
      city: "Addis Ababa",
      address: "Bole Medhanialem",
      capacity: 10,
      computersAvailable: 8,
      mentorInCharge: {
        _id: mentorId,
        fullName: "Abebe Bikila",
        email: "abebe@example.com",
      },
      isActive: true,
    };
    vi.spyOn(HubAttendance, "findOneAndUpdate").mockResolvedValue({});
    vi.spyOn(MentorAvailability, "find").mockReturnValue({
      populate: vi.fn().mockResolvedValue([]),
    });
  });

  const buildReqRes = (options = {}) => {
    const req = {
      user: { _id: studentId, id: studentId, role: "student" },
      body: {},
      params: {},
      query: {},
      ...options,
    };
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    };
    return { req, res };
  };

  describe("POST /api/v1/hubs/book (bookHub)", () => {
    it("successfully creates a booking with auto-assigned workstation", async () => {
      vi.spyOn(Hub, "findById").mockResolvedValue(mockHub);
      vi.spyOn(HubBooking, "findOne").mockResolvedValue(null);
      vi.spyOn(HubBooking, "find").mockResolvedValue([]);
      vi.spyOn(HubBooking, "create").mockImplementation(async (payload) => ({
        ...payload,
        _id: new mongoose.Types.ObjectId().toString(),
        populate: vi.fn().mockResolvedValue(true),
      }));

      const { req, res } = buildReqRes({
        body: {
          hubId,
          date: "2026-09-01",
          timeSlot: "morning",
          purpose: "workstation",
        },
      });

      await bookHub(req, res, vi.fn());

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.workstationNumber).toBe(1);
      expect(res.body.data.booking.passCode).toBeDefined();
      expect(res.body.data.booking.status).toBe("booked");
    });

    it("throws 404 if hub is not found or inactive", async () => {
      vi.spyOn(Hub, "findById").mockResolvedValue(null);

      const { req, res } = buildReqRes({
        body: { hubId, date: "2026-09-01", timeSlot: "morning" },
      });
      const next = vi.fn();

      await bookHub(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it("throws 400 if student already has an active booking for that slot", async () => {
      vi.spyOn(Hub, "findById").mockResolvedValue(mockHub);
      vi.spyOn(HubBooking, "findOne").mockResolvedValue({
        _id: "existing-booking-1",
        student: studentId,
        timeSlot: "morning",
      });

      const { req, res } = buildReqRes({
        body: { hubId, date: "2026-09-01", timeSlot: "morning" },
      });
      const next = vi.fn();

      await bookHub(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "You already have an active booking for this time slot",
        })
      );
    });

    it("throws 400 if hub capacity is full for the selected slot", async () => {
      vi.spyOn(Hub, "findById").mockResolvedValue(mockHub);
      vi.spyOn(HubBooking, "findOne").mockResolvedValue(null);
      vi.spyOn(HubBooking, "find").mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({ workstationNumber: i + 1 }))
      );

      const { req, res } = buildReqRes({
        body: { hubId, date: "2026-09-01", timeSlot: "morning" },
      });
      const next = vi.fn();

      await bookHub(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Hub capacity reached for the selected slot",
        })
      );
    });

    it("throws 400 if requested workstation is already booked", async () => {
      vi.spyOn(Hub, "findById").mockResolvedValue(mockHub);
      vi.spyOn(HubBooking, "findOne").mockResolvedValue(null);
      vi.spyOn(HubBooking, "find").mockResolvedValue([{ workstationNumber: 3 }]);

      const { req, res } = buildReqRes({
        body: { hubId, date: "2026-09-01", timeSlot: "morning", workstationNumber: 3 },
      });
      const next = vi.fn();

      await bookHub(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Workstation 3 is already booked for this slot",
        })
      );
    });
  });

  describe("GET /api/v1/hubs/bookings/me (getMyBookings)", () => {
    it("returns student's bookings with pagination", async () => {
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) =>
          resolve([
            { _id: "b1", student: studentId, timeSlot: "morning", status: "booked" },
            { _id: "b2", student: studentId, timeSlot: "afternoon", status: "completed" },
          ])
        ),
      };
      vi.spyOn(HubBooking, "find").mockReturnValue(mockQuery);
      vi.spyOn(HubBooking, "countDocuments").mockResolvedValue(2);

      const { req, res } = buildReqRes({
        query: { page: "1", limit: "10" },
      });

      await getMyBookings(req, res, vi.fn());

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);
    });
  });

  describe("POST /api/v1/hubs/checkin (checkInHub)", () => {
    it("checks in using passCode and awards +50 physical attendance XP via xpService", async () => {
      const bookingDoc = {
        _id: "booking-123",
        student: studentId,
        hub: hubId,
        date: new Date("2026-09-01"),
        status: "booked",
        passCode: "PASS12",
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(HubBooking, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(bookingDoc),
      });

      const { req, res } = buildReqRes({
        body: { passCode: "PASS12" },
      });

      await checkInHub(req, res, vi.fn());

      expect(bookingDoc.status).toBe("checked_in");
      expect(bookingDoc.checkInTime).toBeDefined();
      expect(bookingDoc.save).toHaveBeenCalled();
      expect(xpService.grantXPWithOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: studentId,
          amount: 50,
          sourceType: "hub",
          sourceId: "booking-123",
        })
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.data.xpAwarded).toBe(50);
    });

    it("checks in using bookingId", async () => {
      const bookingDoc = {
        _id: "booking-456",
        student: studentId,
        hub: hubId,
        date: new Date("2026-09-01"),
        status: "booked",
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(HubBooking, "findById").mockReturnValue({
        populate: vi.fn().mockResolvedValue(bookingDoc),
      });

      const { req, res } = buildReqRes({
        body: { bookingId: "booking-456" },
      });

      await checkInHub(req, res, vi.fn());

      expect(bookingDoc.status).toBe("checked_in");
      expect(res.statusCode).toBe(200);
      expect(res.body.data.xpAwarded).toBe(50);
    });

    it("throws 404 if booking is not found", async () => {
      vi.spyOn(HubBooking, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      const { req, res } = buildReqRes({
        body: { passCode: "NONEXISTENT" },
      });
      const next = vi.fn();

      await checkInHub(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it("throws 400 if booking is cancelled", async () => {
      const bookingDoc = {
        _id: "booking-789",
        status: "cancelled",
        populate: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(HubBooking, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(bookingDoc),
      });

      const { req, res } = buildReqRes({
        body: { passCode: "CANCELLED1" },
      });
      const next = vi.fn();

      await checkInHub(req, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Cannot check in to a cancelled booking",
        })
      );
    });

    it("handles already checked in idempotently without awarding extra XP", async () => {
      const bookingDoc = {
        _id: "booking-999",
        student: studentId,
        status: "checked_in",
        checkInTime: new Date(),
        populate: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(HubBooking, "findOne").mockReturnValue({
        populate: vi.fn().mockResolvedValue(bookingDoc),
      });

      const { req, res } = buildReqRes({
        body: { passCode: "ALREADYIN" },
      });

      await checkInHub(req, res, vi.fn());

      expect(res.statusCode).toBe(200);
      expect(res.body.data.xpAwarded).toBe(0);
      expect(xpService.grantXPWithOptions).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/hubs/:id/availability (getHubAvailability)", () => {
    it("returns available seats and on-duty mentors for given date", async () => {
      vi.spyOn(Hub, "findById").mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockHub),
      });

      vi.spyOn(HubBooking, "find").mockReturnValue({
        populate: vi.fn().mockResolvedValue([
          { timeSlot: "morning", workstationNumber: 1 },
          { timeSlot: "fullday", workstationNumber: 2 },
        ]),
      });

      const { req, res } = buildReqRes({
        params: { id: hubId },
        query: { date: "2026-09-01" },
      });

      await getHubAvailability(req, res, vi.fn());

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalCapacity).toBe(10);
      expect(res.body.data.slots.morning.booked).toBe(2);
      expect(res.body.data.slots.morning.available).toBe(8);
      expect(res.body.data.slots.afternoon.booked).toBe(1);
      expect(res.body.data.slots.afternoon.available).toBe(9);
      expect(res.body.data.onDutyMentors).toHaveLength(1);
      expect(res.body.data.onDutyMentors[0].mentor.fullName).toBe("Abebe Bikila");
    });
  });
});
