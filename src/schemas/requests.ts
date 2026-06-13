/**
 * Request body schemas for PLANKA API operations.
 */
import { z } from "zod";
import {
  CardTypeSchema,
  LabelColorSchema,
  ListColorSchema,
  ListTypeSchema,
  StopwatchSchema,
  BoardRoleSchema,
} from "./entities.js";

// Card requests
export const CreateCardSchema = z.object({
  listId: z.string(),
  name: z.string().min(1, "Card name required"),
  description: z.string().optional(),
  position: z.number().optional().default(65536),
  type: CardTypeSchema.optional().default("project"),
  dueDate: z.string().optional(),
  stopwatch: StopwatchSchema.optional(),
});
export type CreateCardInput = z.input<typeof CreateCardSchema>;

export const UpdateCardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  isDueCompleted: z.boolean().nullable().optional(),
  isClosed: z.boolean().optional(),
  isSubscribed: z.boolean().optional(),
  stopwatch: StopwatchSchema.nullable().optional(),
  type: CardTypeSchema.optional(),
  coverAttachmentId: z.string().nullable().optional(),
  listId: z.string().optional(),
  boardId: z.string().optional(),
  position: z.number().optional(),
});
export type UpdateCardInput = z.input<typeof UpdateCardSchema>;

export const MoveCardSchema = z.object({
  cardId: z.string(),
  listId: z.string(),
  position: z.number().optional().default(65536),
  boardId: z.string().optional(),
});
export type MoveCardInput = z.input<typeof MoveCardSchema>;

// Task requests
export const CreateTaskSchema = z.object({
  cardId: z.string(),
  name: z.string().min(1, "Task name required"),
  position: z.number().optional().default(65536),
});
export type CreateTaskInput = z.input<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  isCompleted: z.boolean().optional(),
  position: z.number().optional(),
  assigneeUserId: z.string().nullable().optional(),
  linkedCardId: z.string().nullable().optional(),
});
export type UpdateTaskInput = z.input<typeof UpdateTaskSchema>;

export const BatchCreateTasksSchema = z.object({
  cardId: z.string(),
  tasks: z.array(
    z.object({
      name: z.string().min(1),
      position: z.number().optional(),
    })
  ),
});
export type BatchCreateTasksInput = z.input<typeof BatchCreateTasksSchema>;

export const CreateTaskListSchema = z.object({
  cardId: z.string(),
  name: z.string().min(1, "Task list name required"),
  position: z.number().optional().default(65536),
});
export type CreateTaskListInput = z.input<typeof CreateTaskListSchema>;

export const UpdateTaskListSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.number().optional(),
  showOnFrontOfCard: z.boolean().optional(),
  hideCompletedTasks: z.boolean().optional(),
});
export type UpdateTaskListInput = z.input<typeof UpdateTaskListSchema>;

// Label requests
export const CreateLabelSchema = z.object({
  boardId: z.string(),
  name: z.string().min(1, "Label name required"),
  color: LabelColorSchema,
  position: z.number().optional().default(65536),
});
export type CreateLabelInput = z.input<typeof CreateLabelSchema>;

export const UpdateLabelSchema = z.object({
  name: z.string().min(1).optional(),
  color: LabelColorSchema.optional(),
  position: z.number().optional(),
});
export type UpdateLabelInput = z.input<typeof UpdateLabelSchema>;

export const AddLabelToCardSchema = z.object({
  cardId: z.string(),
  labelId: z.string(),
});
export type AddLabelToCardInput = z.input<typeof AddLabelToCardSchema>;

export const RemoveLabelFromCardSchema = z.object({
  cardId: z.string(),
  labelId: z.string(),
});
export type RemoveLabelFromCardInput = z.input<typeof RemoveLabelFromCardSchema>;

// Comment requests
export const CreateCommentSchema = z.object({
  cardId: z.string(),
  text: z.string().min(1, "Comment text required"),
});
export type CreateCommentInput = z.input<typeof CreateCommentSchema>;

export const UpdateCommentSchema = z.object({
  text: z.string().min(1),
});
export type UpdateCommentInput = z.input<typeof UpdateCommentSchema>;

// List requests
export const CreateListSchema = z.object({
  boardId: z.string(),
  name: z.string().min(1, "List name required"),
  type: ListTypeSchema.optional().default("active"),
  position: z.number().optional().default(65536),
});
export type CreateListInput = z.input<typeof CreateListSchema>;

export const UpdateListSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.number().optional(),
  type: ListTypeSchema.optional(),
  color: ListColorSchema.nullable().optional(),
});
export type UpdateListInput = z.input<typeof UpdateListSchema>;

// Attachment requests
export const CreateLinkAttachmentSchema = z.object({
  cardId: z.string(),
  name: z.string().min(1, "Attachment name required"),
  url: z.string().url("Valid URL required"),
});
export type CreateLinkAttachmentInput = z.input<typeof CreateLinkAttachmentSchema>;

import { getMaxAttachmentBytes, getMaxAttachmentMb } from "../config/attachment-config.js";

export const CreateFileAttachmentSchema = z.object({
  cardId: z.string(),
  name: z.string().min(1, "Attachment name required"),
  fileBase64: z
    .string()
    .min(1, "fileBase64 required")
    .superRefine((value, ctx) => {
      let byteLength: number;
      try {
        byteLength = Buffer.from(value, "base64").length;
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid base64 file content",
        });
        return;
      }

      const maxBytes = getMaxAttachmentBytes();
      if (byteLength > maxBytes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `File exceeds ${getMaxAttachmentMb()} MB limit`,
        });
      }
    }),
  mimeType: z.string().optional(),
});
export type CreateFileAttachmentInput = z.input<typeof CreateFileAttachmentSchema>;

export const UpdateAttachmentSchema = z
  .object({
    name: z.string().min(1).optional(),
    url: z.string().url("Valid URL required").optional(),
  })
  .refine((value) => value.name !== undefined || value.url !== undefined, {
    message: "At least one of name or url is required",
  });
export type UpdateAttachmentInput = z.input<typeof UpdateAttachmentSchema>;

export const DownloadAttachmentSchema = z.object({
  cardId: z.string(),
  attachmentId: z.string(),
  includeContent: z.boolean().optional(),
});
export type DownloadAttachmentInput = z.input<typeof DownloadAttachmentSchema>;

// Custom field value requests
export const SetCustomFieldValueSchema = z.object({
  cardId: z.string(),
  fieldName: z.string().min(1),
  content: z.string(),
});
export type SetCustomFieldValueInput = z.input<typeof SetCustomFieldValueSchema>;

export const ClearCustomFieldValueSchema = z.object({
  cardId: z.string(),
  fieldName: z.string().min(1),
});
export type ClearCustomFieldValueInput = z.input<typeof ClearCustomFieldValueSchema>;

// Card membership requests
export const AddCardMemberSchema = z.object({
  cardId: z.string(),
  userId: z.string(),
});
export type AddCardMemberInput = z.input<typeof AddCardMemberSchema>;

// Search requests
export const SearchCardsSchema = z.object({
  listId: z.string(),
  search: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  beforeListChangedAt: z.string().optional(),
  beforeId: z.string().optional(),
});
export type SearchCardsInput = z.input<typeof SearchCardsSchema>;

// Board membership requests
export const CreateBoardMembershipSchema = z.object({
  boardId: z.string(),
  userId: z.string(),
  role: BoardRoleSchema,
  canComment: z.boolean().optional(),
});
export type CreateBoardMembershipInput = z.input<typeof CreateBoardMembershipSchema>;

export const UpdateBoardMembershipSchema = z.object({
  role: BoardRoleSchema.optional(),
  canComment: z.boolean().optional(),
});
export type UpdateBoardMembershipInput = z.input<typeof UpdateBoardMembershipSchema>;

// Project requests
export const ProjectTypeSchema = z.enum(["private", "shared"]);

export const CreateProjectSchema = z.object({
  type: ProjectTypeSchema,
  name: z.string().min(1).max(128),
  description: z.string().max(1024).nullable().optional(),
});
export type CreateProjectInput = z.input<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(1024).nullable().optional(),
  isHidden: z.boolean().optional(),
});
export type UpdateProjectInput = z.input<typeof UpdateProjectSchema>;

// Board mutation requests
export const BoardViewSchema = z.enum(["kanban", "grid", "list"]);

export const CreateBoardSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(128),
  position: z.number().min(0).optional().default(65536),
});
export type CreateBoardInput = z.input<typeof CreateBoardSchema>;

export const UpdateBoardSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  position: z.number().min(0).optional(),
  defaultView: BoardViewSchema.optional(),
  defaultCardType: CardTypeSchema.optional(),
  limitCardTypesToDefaultOne: z.boolean().optional(),
  alwaysDisplayCardCreator: z.boolean().optional(),
  expandTaskListsByDefault: z.boolean().optional(),
  isSubscribed: z.boolean().optional(),
});
export type UpdateBoardInput = z.input<typeof UpdateBoardSchema>;
