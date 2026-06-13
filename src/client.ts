/**
 * HTTP client for PLANKA API with automatic authentication.
 */
import {
  PlankaAuthError,
  PlankaConfigError,
  PlankaNetworkError,
  createPlankaError,
} from "./errors.js";
import { AuthResponse } from "./schemas/responses.js";

interface ClientConfig {
  baseUrl: string;
  email: string;
  password: string;
}

/**
 * Validates and returns the configuration from environment variables.
 */
function getConfig(): ClientConfig {
  const baseUrl = process.env.PLANKA_BASE_URL;
  const email = process.env.PLANKA_AGENT_EMAIL;
  const password = process.env.PLANKA_AGENT_PASSWORD;

  const missing: string[] = [];
  if (!baseUrl) missing.push("PLANKA_BASE_URL");
  if (!email) missing.push("PLANKA_AGENT_EMAIL");
  if (!password) missing.push("PLANKA_AGENT_PASSWORD");

  if (missing.length > 0) {
    throw new PlankaConfigError(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // Validate URL format
  try {
    new URL(baseUrl!);
  } catch {
    throw new PlankaConfigError(`Invalid PLANKA_BASE_URL: ${baseUrl}`);
  }

  // TypeScript narrowing: after the check above, these are guaranteed to be defined
  return {
    baseUrl: baseUrl!.replace(/\/$/, ""), // Remove trailing slash
    email: email!,
    password: password!,
  };
}

/**
 * PLANKA API client with automatic JWT token management.
 */
class PlankaClient {
  private config: ClientConfig | null = null;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Gets or initializes the configuration.
   */
  private getConfig(): ClientConfig {
    if (!this.config) {
      this.config = getConfig();
    }
    return this.config;
  }

  /** Request timeout in milliseconds */
  private static readonly REQUEST_TIMEOUT_MS = 30000;

  /**
   * Creates an AbortSignal with timeout.
   * Uses AbortSignal.timeout() which automatically cleans up when the request completes.
   */
  private createTimeoutSignal(): AbortSignal {
    return AbortSignal.timeout(PlankaClient.REQUEST_TIMEOUT_MS);
  }

  /**
   * Authenticates and retrieves a new JWT token.
   */
  private async authenticate(): Promise<string> {
    const config = this.getConfig();
    const url = `${config.baseUrl}/api/access-tokens`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrUsername: config.email,
          password: config.password,
        }),
        signal: this.createTimeoutSignal(),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new PlankaNetworkError(
          `Request timeout connecting to PLANKA at ${config.baseUrl}`,
          error
        );
      }
      throw new PlankaNetworkError(
        `Failed to connect to PLANKA at ${config.baseUrl}`,
        error
      );
    }

    if (!response.ok) {
      const body = await this.safeParseJson(response);
      throw new PlankaAuthError(
        `Authentication failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const parsed = AuthResponse.parse(data);

    // PLANKA tokens are valid for 30 minutes by default.
    // We refresh after 25 minutes to avoid edge cases.
    // If PLANKA's token lifetime changes, adjust this value.
    this.tokenExpiresAt = Date.now() + 25 * 60 * 1000;
    this.token = parsed.item;

    return this.token;
  }

  /**
   * Gets a valid token, refreshing if necessary.
   */
  private async getToken(): Promise<string> {
    if (!this.token || Date.now() >= this.tokenExpiresAt) {
      return this.authenticate();
    }
    return this.token;
  }

  /**
   * Safely parses JSON from a response, returning null on failure.
   */
  private async safeParseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Makes an authenticated request to the PLANKA API.
   * @param isRetry - Internal flag to prevent infinite retry loops on 401
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    isRetry = false
  ): Promise<T> {
    const config = this.getConfig();
    const token = await this.getToken();
    const url = `${config.baseUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: this.createTimeoutSignal(),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new PlankaNetworkError(`Request timeout: ${method} ${path}`, error);
      }
      throw new PlankaNetworkError(`Network error: ${method} ${path}`, error);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await this.safeParseJson(response);

    if (!response.ok) {
      // If token expired and this is not already a retry, get fresh token and retry once
      if (response.status === 401 && this.token && !isRetry) {
        this.token = null;
        this.tokenExpiresAt = 0;
        return this.request(method, path, body, true);
      }
      throw createPlankaError(response.status, data, `${method} ${path}`);
    }

    return data as T;
  }

  /**
   * GET request.
   */
  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  /**
   * POST request.
   */
  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  /**
   * PATCH request.
   */
  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  /**
   * POST request with multipart form data (no Content-Type header — fetch sets boundary).
   */
  async postForm<T>(path: string, formData: FormData): Promise<T> {
    return this.requestForm<T>("POST", path, formData);
  }

  /**
   * Makes an authenticated multipart request.
   */
  private async requestForm<T>(
    method: string,
    path: string,
    formData: FormData,
    isRetry = false
  ): Promise<T> {
    const config = this.getConfig();
    const token = await this.getToken();
    const url = `${config.baseUrl}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: this.createTimeoutSignal(),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new PlankaNetworkError(`Request timeout: ${method} ${path}`, error);
      }
      throw new PlankaNetworkError(`Network error: ${method} ${path}`, error);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = await this.safeParseJson(response);

    if (!response.ok) {
      if (response.status === 401 && this.token && !isRetry) {
        this.token = null;
        this.tokenExpiresAt = 0;
        return this.requestForm(method, path, formData, true);
      }
      throw createPlankaError(response.status, data, `${method} ${path}`);
    }

    return data as T;
  }

  /**
   * DELETE request.
   */
  async delete(path: string): Promise<void> {
    return this.request<void>("DELETE", path);
  }
}

// Singleton client instance
export const plankaClient = new PlankaClient();
