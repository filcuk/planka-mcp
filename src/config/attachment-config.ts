/**
 * Attachment size limits for file upload and download operations.
 */
import { PlankaConfigError } from "../errors.js";

export const DEFAULT_MAX_ATTACHMENT_MB = 15;

function readEnv(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = env[name]?.trim();
  return value || undefined;
}

/**
 * Maximum attachment size in megabytes.
 * Set PLANKA_MAX_ATTACHMENT_MB to override (default: 15).
 */
export function getMaxAttachmentMb(
  env: NodeJS.ProcessEnv = process.env
): number {
  const raw = readEnv(env, "PLANKA_MAX_ATTACHMENT_MB");
  if (!raw) {
    return DEFAULT_MAX_ATTACHMENT_MB;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new PlankaConfigError(
      `Invalid PLANKA_MAX_ATTACHMENT_MB: ${raw}. Must be a positive integer.`
    );
  }

  return parsed;
}

export function getMaxAttachmentBytes(
  env: NodeJS.ProcessEnv = process.env
): number {
  return getMaxAttachmentMb(env) * 1024 * 1024;
}
