/**
 * Request body schemas for PLANKA API operations.
 */
import { z } from "zod";
import {
  CardTypeSchema,
  LabelColorSchema,
  ListColorSchema,
  ListTypeSchema,
} from "./entities.js";

// Card requests
export const CreateCardSchema = z.object({
  listId: z.string(),
  name: z.string().min(1, "Card name required"),
  description: z.string().optional(),
  position: z.number().optional().default(65536),
  type: CardTypeSchema.optional().default("project"),
  dueDate: z.string().optional(),
});
export type CreateCardInput = z.input<typeof CreateCardSchema>;

export const UpdateCardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  isDueCompleted: z.boolean().nullable().optional(),
  isClosed: z.boolean().optional(),
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

export const UpdateAttachmentSchema = z.object({
  name: z.string().min(1),
});
export type UpdateAttachmentInput = z.input<typeof UpdateAttachmentSchema>;

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
});
export type SearchCardsInput = z.input<typeof SearchCardsSchema>;
