import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import validateRequest from "../middlewares/validateRequest.js";
import { dmRateLimit } from "../services/rateLimitService.js";
import { z } from "zod";
import {
  listConversations,
  createConversation,
  getConversationMessages,
  sendConversationMessage,
  markConversationRead,
} from "../controllers/dmController.js";

const router = Router();

router.use(dmRateLimit);

const createConversationSchema = z
  .object({
    participantId: z.string().optional(),
    participantIds: z.array(z.string()).optional(),
    name: z.string().optional(),
  })
  .refine((data) => data.participantId || data.participantIds?.length, {
    message: "participantId or participantIds required",
  });

const sendMessageSchema = z
  .object({
    text: z.string().min(1).max(2000).optional(),
    replyTo: z.string().optional(),
    attachments: z
      .array(
        z.object({
          url: z.string(),
          type: z.string(),
          name: z.string(),
          size: z.number().optional(),
        }),
      )
      .optional(),
  })
  .refine((data) => data.text || data.attachments?.length, {
    message: "Message text or attachments required",
  });

router.get("/conversations", protect, listConversations);
router.post("/conversations", protect, validateRequest({ body: createConversationSchema }), createConversation);
router.get("/:conversationId/messages", protect, getConversationMessages);
router.post(
  "/:conversationId/messages",
  protect,
  validateRequest({ body: sendMessageSchema }),
  sendConversationMessage,
);
router.post("/:conversationId/read", protect, markConversationRead);

export default router;
