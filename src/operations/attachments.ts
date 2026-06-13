/**
 * Attachment operations for PLANKA API.
 */
import { plankaClient } from "../client.js";
import { Attachment } from "../schemas/entities.js";
import {
  CreateLinkAttachmentSchema,
  CreateFileAttachmentSchema,
  UpdateAttachmentSchema,
  DownloadAttachmentSchema,
  CreateLinkAttachmentInput,
  CreateFileAttachmentInput,
  UpdateAttachmentInput,
  DownloadAttachmentInput,
} from "../schemas/requests.js";
import { AttachmentResponse } from "../schemas/responses.js";
import {
  buildAttachmentDownloadPath,
  getAttachmentFilename,
  getAttachmentUrl,
} from "../lib/attachments.js";
import { PlankaNotFoundError, PlankaValidationError } from "../errors.js";
import { getCard } from "./cards.js";

const MAX_FILE_ATTACHMENT_BYTES = 5 * 1024 * 1024;

/**
 * Decode base64 string to a Blob for multipart upload.
 */
export function decodeBase64ToBlob(base64: string, mimeType?: string): Blob {
  const buffer = Buffer.from(base64, "base64");
  return new Blob([buffer], { type: mimeType || "application/octet-stream" });
}

async function getAttachmentFromCard(
  cardId: string,
  attachmentId: string
): Promise<Attachment> {
  const card = await getCard(cardId);
  const attachment = card.attachments.find((item) => item.id === attachmentId);

  if (!attachment) {
    throw new PlankaNotFoundError("Attachment", attachmentId);
  }

  return attachment;
}

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
 * Create a file attachment on a card from base64-encoded content.
 */
export async function createFileAttachment(
  input: CreateFileAttachmentInput
): Promise<Attachment> {
  const validated = CreateFileAttachmentSchema.parse(input);

  const formData = new FormData();
  formData.append("type", "file");
  formData.append("name", validated.name);
  const blob = decodeBase64ToBlob(validated.fileBase64, validated.mimeType);
  formData.append("file", blob, validated.name);

  const response = await plankaClient.postForm<unknown>(
    `/api/cards/${validated.cardId}/attachments`,
    formData
  );

  const parsed = AttachmentResponse.parse(response);
  return parsed.item;
}

/**
 * Replace a link attachment when its URL changes.
 * Planka does not support PATCH for link URLs, so this deletes and recreates.
 */
async function replaceLinkAttachment(
  attachment: Attachment,
  updates: { name?: string; url: string }
): Promise<Attachment> {
  const name = updates.name ?? attachment.name;

  await deleteAttachment(attachment.id);

  return createLinkAttachment({
    cardId: attachment.cardId,
    name,
    url: updates.url,
  });
}

/**
 * Update an attachment's name and/or link URL.
 */
export async function updateAttachment(
  attachmentId: string,
  input: UpdateAttachmentInput,
  context?: { cardId?: string }
): Promise<Attachment> {
  const validated = UpdateAttachmentSchema.parse(input);

  if (validated.url !== undefined) {
    if (!context?.cardId) {
      throw new PlankaValidationError(
        "cardId is required when updating attachment URLs"
      );
    }

    const attachment = await getAttachmentFromCard(context.cardId, attachmentId);

    if (attachment.type !== "link") {
      throw new PlankaValidationError(
        "URL can only be updated on link attachments"
      );
    }

    return replaceLinkAttachment(attachment, {
      name: validated.name,
      url: validated.url,
    });
  }

  const response = await plankaClient.patch<unknown>(
    `/api/attachments/${attachmentId}`,
    { name: validated.name }
  );

  const parsed = AttachmentResponse.parse(response);
  return parsed.item;
}

export interface DownloadAttachmentResult {
  id: string;
  name: string;
  type: Attachment["type"];
  url?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  fileBase64?: string;
}

/**
 * Get attachment metadata and optionally download file content.
 */
export async function downloadAttachment(
  input: DownloadAttachmentInput
): Promise<DownloadAttachmentResult> {
  const validated = DownloadAttachmentSchema.parse(input);
  const attachment = await getAttachmentFromCard(
    validated.cardId,
    validated.attachmentId
  );

  const url = getAttachmentUrl(attachment);
  const baseResult: DownloadAttachmentResult = {
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    url,
  };

  if (attachment.type === "link") {
    return baseResult;
  }

  const filename = getAttachmentFilename(attachment);
  baseResult.filename = filename;

  if (!validated.includeContent) {
    return baseResult;
  }

  const downloadPath = buildAttachmentDownloadPath(attachment);
  if (!downloadPath) {
    throw new PlankaValidationError(
      "Could not determine download path for attachment"
    );
  }

  const { data, contentType } = await plankaClient.getBinary(downloadPath);

  if (data.length > MAX_FILE_ATTACHMENT_BYTES) {
    throw new PlankaValidationError(
      `Attachment exceeds ${MAX_FILE_ATTACHMENT_BYTES / (1024 * 1024)} MB download limit`
    );
  }

  const mimeType =
    contentType?.split(";")[0]?.trim() ||
    (typeof attachment.data.mimeType === "string"
      ? attachment.data.mimeType
      : undefined);

  return {
    ...baseResult,
    mimeType,
    size: data.length,
    fileBase64: data.toString("base64"),
  };
}

/**
 * Delete an attachment.
 */
export async function deleteAttachment(attachmentId: string): Promise<void> {
  await plankaClient.delete(`/api/attachments/${attachmentId}`);
}
