/**
 * PLANKA MCP client configuration from environment variables.
 */
import { PlankaConfigError } from "../errors.js";

export type AuthMode = "apiKey" | "credentials";

export interface ClientConfig {
  baseUrl: string;
  termsLanguage: string;
  authMode: AuthMode;
  apiKey?: string;
  email?: string;
  password?: string;
}

function readEnv(env: NodeJS.ProcessEnv, name: string): string | undefined {
  const value = env[name]?.trim();
  return value || undefined;
}

/**
 * Load and validate client configuration.
 * Prefers PLANKA_API_KEY; falls back to email/password credentials.
 */
export function loadClientConfig(
  env: NodeJS.ProcessEnv = process.env
): ClientConfig {
  const baseUrl = readEnv(env, "PLANKA_BASE_URL");
  const apiKey = readEnv(env, "PLANKA_API_KEY");
  const email = readEnv(env, "PLANKA_AGENT_EMAIL");
  const password = readEnv(env, "PLANKA_AGENT_PASSWORD");

  if (!baseUrl) {
    throw new PlankaConfigError("Missing required environment variable: PLANKA_BASE_URL");
  }

  try {
    new URL(baseUrl);
  } catch {
    throw new PlankaConfigError(`Invalid PLANKA_BASE_URL: ${baseUrl}`);
  }

  const termsLanguage = readEnv(env, "PLANKA_TERMS_LANGUAGE") || "en-US";

  if (apiKey) {
    return {
      baseUrl: baseUrl.replace(/\/$/, ""),
      termsLanguage,
      authMode: "apiKey",
      apiKey,
    };
  }

  const missing: string[] = [];
  if (!email) missing.push("PLANKA_AGENT_EMAIL");
  if (!password) missing.push("PLANKA_AGENT_PASSWORD");

  if (missing.length > 0) {
    throw new PlankaConfigError(
      `Missing authentication configuration: set PLANKA_API_KEY, or provide ${missing.join(" and ")}`
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    termsLanguage,
    authMode: "credentials",
    email: email!,
    password: password!,
  };
}

export const CONFIG_HELP_TEXT = `Required:
- PLANKA_BASE_URL

Authentication (pick one):
- PLANKA_API_KEY (recommended)
- PLANKA_AGENT_EMAIL and PLANKA_AGENT_PASSWORD`;
