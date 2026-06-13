/**
 * HTTP client for PLANKA API with automatic authentication.
 */
import {
  PlankaAuthError,
  PlankaNetworkError,
  createPlankaError,
} from "./errors.js";
import { AuthResponse } from "./schemas/responses.js";
import {
  extractTermsAcceptancePayload,
  isTermsAcceptanceRequired,
} from "./lib/terms-auth.js";
import { ClientConfig, loadClientConfig } from "./config/client-config.js";

/**
 * PLANKA API client with API key or JWT authentication.
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
      this.config = loadClientConfig();
    }
    return this.config;
  }

  /** Request timeout in milliseconds */
  private static readonly REQUEST_TIMEOUT_MS = 30000;

  /**
   * Creates an AbortSignal with timeout.
   */
  private createTimeoutSignal(): AbortSignal {
    return AbortSignal.timeout(PlankaClient.REQUEST_TIMEOUT_MS);
  }

  /**
   * Headers for /api/* requests.
   */
  private async getApiAuthHeaders(): Promise<Record<string, string>> {
    const config = this.getConfig();

    if (config.authMode === "apiKey") {
      return { "X-Api-Key": config.apiKey! };
    }

    const token = await this.getToken();
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Headers for attachment download routes (/attachments/*).
   */
  private async getDownloadAuthHeaders(): Promise<Record<string, string>> {
    const config = this.getConfig();

    if (config.authMode === "apiKey") {
      return { "X-Api-Key": config.apiKey! };
    }

    const token = await this.getToken();
    return { Cookie: `accessToken=${token}` };
  }

  /**
   * Authenticates with email/password and retrieves a JWT token.
   * Automatically accepts terms when required (first login for new users).
   */
  private async authenticate(): Promise<string> {
    const config = this.getConfig();

    if (config.authMode !== "credentials") {
      throw new PlankaAuthError("Credential authentication is not configured");
    }

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

    const body = await this.safeParseJson(response);

    if (response.ok) {
      return this.storeTokenFromBody(body);
    }

    if (isTermsAcceptanceRequired(response.status, body)) {
      const termsPayload = extractTermsAcceptancePayload(body);
      if (termsPayload) {
        return this.acceptTermsAndAuthenticate(termsPayload.pendingToken);
      }
    }

    throw new PlankaAuthError(
      `Authentication failed: ${response.status} ${response.statusText}${
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        body.message
          ? ` — ${String((body as Record<string, unknown>).message)}`
          : ""
      }`
    );
  }

  private storeTokenFromBody(body: unknown): string {
    const parsed = AuthResponse.parse(body);
    this.tokenExpiresAt = Date.now() + 25 * 60 * 1000;
    this.token = parsed.item;
    return this.token;
  }

  /**
   * Complete login after terms acceptance is required.
   */
  private async acceptTermsAndAuthenticate(
    pendingToken: string
  ): Promise<string> {
    const config = this.getConfig();
    const termsUrl = `${config.baseUrl}/api/terms?language=${encodeURIComponent(config.termsLanguage)}`;

    let termsResponse: Response;
    try {
      termsResponse = await fetch(termsUrl, {
        signal: this.createTimeoutSignal(),
      });
    } catch (error) {
      throw new PlankaNetworkError(
        `Failed to fetch terms from PLANKA at ${config.baseUrl}`,
        error
      );
    }

    const termsBody = await this.safeParseJson(termsResponse);
    if (!termsResponse.ok) {
      throw new PlankaAuthError(
        `Failed to fetch terms for acceptance (${termsResponse.status})`
      );
    }

    const signature =
      typeof termsBody === "object" &&
      termsBody !== null &&
      "item" in termsBody &&
      typeof (termsBody as Record<string, unknown>).item === "object" &&
      (termsBody as Record<string, unknown>).item !== null &&
      "signature" in ((termsBody as Record<string, unknown>).item as object)
        ? String(
            (
              (termsBody as Record<string, unknown>).item as Record<
                string,
                unknown
              >
            ).signature
          )
        : undefined;

    if (!signature) {
      throw new PlankaAuthError("Terms response did not include a signature");
    }

    const acceptUrl = `${config.baseUrl}/api/access-tokens/accept-terms`;
    let acceptResponse: Response;
    try {
      acceptResponse = await fetch(acceptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pendingToken,
          signature,
          initialLanguage: config.termsLanguage,
        }),
        signal: this.createTimeoutSignal(),
      });
    } catch (error) {
      throw new PlankaNetworkError(
        `Failed to accept terms at ${config.baseUrl}`,
        error
      );
    }

    const acceptBody = await this.safeParseJson(acceptResponse);
    if (!acceptResponse.ok) {
      const message =
        typeof acceptBody === "object" &&
        acceptBody !== null &&
        "message" in acceptBody
          ? String((acceptBody as Record<string, unknown>).message)
          : acceptResponse.statusText;
      throw new PlankaAuthError(`Terms acceptance failed: ${message}`);
    }

    return this.storeTokenFromBody(acceptBody);
  }

  /**
   * Gets a valid JWT token for credential auth, refreshing if necessary.
   */
  private async getToken(): Promise<string> {
    if (this.getConfig().authMode === "apiKey") {
      throw new PlankaAuthError("JWT tokens are not used with API key auth");
    }

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

  private shouldRetryAuth(status: number, isRetry: boolean): boolean {
    return (
      status === 401 &&
      !isRetry &&
      this.getConfig().authMode === "credentials" &&
      Boolean(this.token)
    );
  }

  private invalidateToken(): void {
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Makes an authenticated request to the PLANKA API.
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    isRetry = false
  ): Promise<T> {
    const config = this.getConfig();
    const authHeaders = await this.getApiAuthHeaders();
    const url = `${config.baseUrl}${path}`;

    const headers: Record<string, string> = {
      ...authHeaders,
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

    if (response.status === 204) {
      return undefined as T;
    }

    const data = await this.safeParseJson(response);

    if (!response.ok) {
      if (this.shouldRetryAuth(response.status, isRetry)) {
        this.invalidateToken();
        return this.request(method, path, body, true);
      }
      throw createPlankaError(response.status, data, `${method} ${path}`);
    }

    return data as T;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    return this.requestForm<T>("POST", path, formData);
  }

  private async requestForm<T>(
    method: string,
    path: string,
    formData: FormData,
    isRetry = false
  ): Promise<T> {
    const config = this.getConfig();
    const authHeaders = await this.getApiAuthHeaders();
    const url = `${config.baseUrl}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: authHeaders,
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
      if (this.shouldRetryAuth(response.status, isRetry)) {
        this.invalidateToken();
        return this.requestForm(method, path, formData, true);
      }
      throw createPlankaError(response.status, data, `${method} ${path}`);
    }

    return data as T;
  }

  async delete(path: string): Promise<void> {
    return this.request<void>("DELETE", path);
  }

  /**
   * Download binary content from non-API routes (e.g. file attachments).
   */
  async getBinary(
    path: string,
    isRetry = false
  ): Promise<{ data: Buffer; contentType?: string }> {
    const config = this.getConfig();
    const authHeaders = await this.getDownloadAuthHeaders();
    const url = `${config.baseUrl}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: authHeaders,
        signal: this.createTimeoutSignal(),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new PlankaNetworkError(`Request timeout: GET ${path}`, error);
      }
      throw new PlankaNetworkError(`Network error: GET ${path}`, error);
    }

    if (!response.ok) {
      if (this.shouldRetryAuth(response.status, isRetry)) {
        this.invalidateToken();
        return this.getBinary(path, true);
      }

      const data = await this.safeParseJson(response);
      throw createPlankaError(response.status, data, `GET ${path}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? undefined;

    return {
      data: Buffer.from(arrayBuffer),
      contentType,
    };
  }
}

export const plankaClient = new PlankaClient();
