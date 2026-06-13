/**
 * Attachment operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import { Attachment } from "../schemas/entities.js";
import {
  CreateLinkAttachmentSchema,
  UpdateAttachmentSchema,
  CreateLinkAttachmentInput,
  UpdateAttachmentInput,
} from "../schemas/requests.js";
import { AttachmentResponse } from "../schemas/responses.js";

/**
 * Create a link attachment on a card.
 */
export async function createLinkAttachment(
  input: CreateLinkAttachmentInput
): Promise<Attachment> {
  const validated = CreateLinkAttachmentSchema.parse(input);

  const formData = new FormData();
  formData.append("type", "link");
  formData.append("name", validated.name);
  formData.append("url", validated.url);

  const response = await plankaClient.postForm<unknown>(
    `/api/cards/${validated.cardId}/attachments`,
    formData
  );

  const parsed = AttachmentResponse.parse(response);
  return parsed.item;
}

/**
 * Update an attachment's name.
 */
export async function updateAttachment(
  attachmentId: string,
  input: UpdateAttachmentInput
): Promise<Attachment> {
  const validated = UpdateAttachmentSchema.parse(input);

  const response = await plankaClient.patch<unknown>(
    `/api/attachments/${attachmentId}`,
    validated
  );

  const parsed = AttachmentResponse.parse(response);
  return parsed.item;
}

/**
 * Delete an attachment.
 */
export async function deleteAttachment(attachmentId: string): Promise<void> {
  await plankaClient.delete(`/api/attachments/${attachmentId}`);
}
