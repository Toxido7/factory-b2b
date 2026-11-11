import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, refreshSession, setAccessToken, setOnSessionExpired } from "./client.js";

function unauthorized(config) {
  const error = new Error("Unauthorized");
  error.config = config;
  error.response = { status: 401 };
  return Promise.reject(error);
}

afterEach(() => {
  setAccessToken(null);
  setOnSessionExpired(null);
  vi.restoreAllMocks();
});

describe("api authentication refresh", () => {
  it("refreshes once and retries both parallel requests", async () => {
    const calls = [];
    api.defaults.adapter = async (config) => {
      calls.push({
        retried: Boolean(config._retried),
        authorization: config.headers.Authorization,
      });
      if (!config._retried) return unauthorized(config);
      return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
    };
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { user: { id: "1" }, accessToken: "new-token" } },
    });

    const results = await Promise.all([api.get("/one"), api.get("/two")]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(2);
    expect(calls.filter((config) => config.retried)).toHaveLength(2);
    expect(calls.filter((config) => config.retried).every(
      (config) => config.authorization === "Bearer new-token",
    )).toBe(true);
  });

  it("rejects requests and notifies when refresh fails", async () => {
    const expired = vi.fn();
    setOnSessionExpired(expired);
    api.defaults.adapter = (config) => unauthorized(config);
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh failed"));

    const results = await Promise.allSettled([api.get("/one"), api.get("/two")]);

    expect(results.every((result) => result.status === "rejected")).toBe(true);
    expect(expired).toHaveBeenCalledTimes(2);
  });

  it("does not retry the refresh endpoint through the interceptor", async () => {
    const adapter = vi.fn((config) => unauthorized(config));
    api.defaults.adapter = adapter;

    await expect(api.post("/auth/refresh")).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(adapter).toHaveBeenCalledTimes(1);
  });

  it("shares a direct refresh call and stores its token", async () => {
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({
      data: { data: { user: { id: "1" }, accessToken: "token" } },
    });

    const [first, second] = await Promise.all([refreshSession(), refreshSession()]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ id: "1" });
    expect(second).toEqual({ id: "1" });
  });
});
