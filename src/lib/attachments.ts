/**
 * Helpers for attachment entities.
 */
import { Attachment } from "../schemas/entities.js";

export function getAttachmentUrl(attachment: Attachment): string | undefined {
  const url = attachment.data.url;
  return typeof url === "string" ? url : undefined;
}

export function getAttachmentFilename(attachment: Attachment): string | undefined {
  if (attachment.type !== "file") {
    return undefined;
  }

  const filename = attachment.data.filename;
  if (typeof filename === "string" && filename.length > 0) {
    return filename;
  }

  const url = getAttachmentUrl(attachment);
  if (!url) {
    return undefined;
  }

  const match = url.match(/\/download\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function buildAttachmentDownloadPath(attachment: Attachment): string | undefined {
  const filename = getAttachmentFilename(attachment);
  if (!filename) {
    return undefined;
  }

  const segments = filename.split("/").map((segment) => encodeURIComponent(segment));
  return `/attachments/${attachment.id}/download/${segments.join("/")}`;
}
