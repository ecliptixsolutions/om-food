import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  ip: "203.0.113.7",
  execute: vi.fn(),
  beginTransaction: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  release: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validator: ((data: unknown) => unknown) | undefined;
    const builder = {
      validator: (fn: (data: unknown) => unknown) => {
        validator = fn;
        return builder;
      },
      handler: (fn: (input: { data: unknown }) => unknown) =>
        Object.assign(
          async (input: { data: unknown }) =>
            fn({ data: validator ? validator(input.data) : input.data }),
          { run: fn, validate: validator },
        ),
    };
    return builder;
  },
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeader: (name: string) => (name === "cf-connecting-ip" ? state.ip : undefined),
}));
vi.mock("@/lib/mysql.server", () => ({
  getMysqlPool: () => ({
    getConnection: async () => ({
      beginTransaction: state.beginTransaction,
      execute: state.execute,
      commit: state.commit,
      rollback: state.rollback,
      release: state.release,
    }),
  }),
}));

import { submitQuoteInquiry } from "@/lib/quote-inquiries.functions";

const inquiry = {
  full_name: "Asha Patel",
  company_name: "Asha Foods",
  business_email: "asha@example.com",
  phone: "+91 81407 12205",
  country: "India",
  product_interest: "Fresh onions",
  required_quantity: "250 kg",
  packaging_preference: "Export cartons",
  destination: "Mumbai",
  delivery_timeline: "Next month",
  message: "Please share current availability.",
  privacy_consent: true,
};

beforeEach(() => {
  state.execute.mockReset();
  state.beginTransaction.mockReset().mockResolvedValue(undefined);
  state.commit.mockReset().mockResolvedValue(undefined);
  state.rollback.mockReset().mockResolvedValue(undefined);
  state.release.mockReset();
});

describe("quote persistence handler (mocked MySQL)", () => {
  it("stores validated inquiry data and commits the rate limit in the same transaction", async () => {
    state.execute
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([[{ allowed: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await expect(submitQuoteInquiry({ data: inquiry })).resolves.toEqual({ accepted: true });
    expect(state.beginTransaction).toHaveBeenCalledOnce();
    expect(state.execute.mock.calls[0]?.[1]).toEqual([
      createHash("sha256").update(state.ip).digest("hex"),
    ]);
    expect(state.execute.mock.calls[3]?.[0]).toContain("INSERT INTO quote_inquiries");
    expect(state.execute.mock.calls[3]?.[1]).toContain("Asha Patel");
    expect(state.execute.mock.calls[3]?.[1]).toContain("asha@example.com");
    expect(state.commit).toHaveBeenCalledOnce();
    expect(state.rollback).not.toHaveBeenCalled();
    expect(state.release).toHaveBeenCalledOnce();
  });

  it("rejects invalid input before opening a database connection", async () => {
    await expect(
      submitQuoteInquiry({ data: { ...inquiry, business_email: "invalid" } }),
    ).rejects.toThrow();
    expect(state.beginTransaction).not.toHaveBeenCalled();
  });

  it("rolls back and releases the connection when rate limited", async () => {
    state.execute
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([[{ allowed: 0 }]]);
    await expect(submitQuoteInquiry({ data: inquiry })).rejects.toThrow("Please wait a minute");
    expect(state.commit).not.toHaveBeenCalled();
    expect(state.rollback).toHaveBeenCalledOnce();
    expect(state.release).toHaveBeenCalledOnce();
  });

  it("rolls back and releases the connection after a persistence failure", async () => {
    state.execute
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([[{ allowed: 1 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockRejectedValueOnce(new Error("database unavailable"));
    await expect(submitQuoteInquiry({ data: inquiry })).rejects.toThrow("database unavailable");
    expect(state.rollback).toHaveBeenCalledOnce();
    expect(state.release).toHaveBeenCalledOnce();
  });
});
