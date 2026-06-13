import { describe, expect, it } from "vitest";
import { loadClientConfig } from "../src/config/client-config.js";
import { PlankaConfigError } from "../src/errors.js";

describe("loadClientConfig", () => {
  it("prefers API key auth when PLANKA_API_KEY is set", () => {
    const config = loadClientConfig({
      PLANKA_BASE_URL: "https://planka.example.com/",
      PLANKA_API_KEY: "test-api-key",
      PLANKA_AGENT_EMAIL: "agent@example.com",
      PLANKA_AGENT_PASSWORD: "secret",
    });

    expect(config.authMode).toBe("apiKey");
    expect(config.apiKey).toBe("test-api-key");
    expect(config.baseUrl).toBe("https://planka.example.com");
    expect(config.email).toBeUndefined();
  });

  it("falls back to credentials when no API key is set", () => {
    const config = loadClientConfig({
      PLANKA_BASE_URL: "https://planka.example.com",
      PLANKA_AGENT_EMAIL: "agent@example.com",
      PLANKA_AGENT_PASSWORD: "secret",
    });

    expect(config.authMode).toBe("credentials");
    expect(config.email).toBe("agent@example.com");
    expect(config.password).toBe("secret");
  });

  it("requires base URL", () => {
    expect(() =>
      loadClientConfig({
        PLANKA_API_KEY: "test-api-key",
      })
    ).toThrow(PlankaConfigError);
  });

  it("requires credentials when API key is missing", () => {
    expect(() =>
      loadClientConfig({
        PLANKA_BASE_URL: "https://planka.example.com",
      })
    ).toThrow(/PLANKA_API_KEY|PLANKA_AGENT_EMAIL/);
  });
});
