/**
 * Helpers for attachment entities.
 */
import { Attachment } from "../schemas/entities.js";

export function getAttachmentUrl(attachment: Attachment): string | undefined {
  if (attachment.type === "link") {
    const url = attachment.data.url;
    return typeof url === "string" ? url : undefined;
  }
  return undefined;
}
