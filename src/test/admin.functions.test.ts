import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ execute: vi.fn(), query: vi.fn(), auth: vi.fn() }));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const metadata: {
      middleware: unknown[];
      validator?: (input: unknown) => unknown;
      handler?: (input: { data: unknown; context: unknown }) => unknown;
    } = { middleware: [] };
    const builder = {
      middleware: (items: unknown[]) => {
        metadata.middleware.push(...items);
        return builder;
      },
      validator: (validator: (input: unknown) => unknown) => {
        metadata.validator = validator;
        return builder;
      },
      handler: (fn: (input: { data: unknown; context: unknown }) => unknown) => {
        metadata.handler = fn;
        return Object.assign(
          async (input: { data?: unknown; context?: unknown } = {}) =>
            fn({
              data: metadata.validator ? metadata.validator(input.data) : input.data,
              context: input.context ?? {},
            }),
          { metadata },
        );
      },
    };
    return builder;
  },
}));
vi.mock("@/lib/admin-auth.functions", () => ({
  requireAdminAuth: state.auth,
}));
vi.mock("@/lib/mysql.server", () => ({
  getMysqlPool: () => ({ execute: state.execute, query: state.query }),
}));

import {
  getAdminConsole,
  listPublicProducts,
  saveAdminMedia,
  saveAdminProduct,
  updateInquiryStatus,
} from "@/lib/admin.functions";

type MockedFunction = {
  metadata: {
    middleware: unknown[];
    handler: (input: { data?: unknown; context?: unknown }) => Promise<unknown>;
  };
};
const handler = (fn: unknown) => (fn as MockedFunction).metadata.handler;
const product = {
  name: "Dehydrated onion flakes",
  slug: "dehydrated-onion-flakes",
  category: "dehydrated-onions",
  description: "Dehydrated ingredient inquiry.",
  image_url: "",
  image_alt: "Red onions",
  status: "published",
  featured: false,
  display_order: 1,
};

beforeEach(() => {
  state.execute.mockReset();
  state.query.mockReset();
  state.auth.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("admin data handlers (mocked MySQL)", () => {
  it("puts authentication middleware on every protected server operation", () => {
    for (const fn of [getAdminConsole, saveAdminProduct, saveAdminMedia, updateInquiryStatus]) {
      expect((fn as unknown as MockedFunction).metadata.middleware).toContain(state.auth);
    }
  });

  it("exposes only published dehydrated products in the public catalogue", async () => {
    state.query.mockResolvedValue([[], []]);
    await listPublicProducts();
    expect(state.query.mock.calls[0]?.[0]).toContain("status='published'");
    expect(state.query.mock.calls[0]?.[0]).toContain(
      "category IN ('dehydrated-onions','dehydrated-garlic')",
    );
  });

  it("creates, updates, publishes, drafts, and archives products without deleting records", async () => {
    state.execute.mockResolvedValue({ affectedRows: 1 });
    const context = { admin: { id: "admin-1", role: "editor" } };
    const created = await handler(saveAdminProduct)({ data: product, context });
    expect(created).toEqual({ id: expect.any(String) });
    expect(state.execute.mock.calls[0]?.[0]).toContain("INSERT INTO products");
    expect(state.execute.mock.calls[0]?.[1]).toContain("published");

    const id = "4d7b12d6-43ac-4db6-8ca3-30bfc3e13a71";
    await handler(saveAdminProduct)({ data: { ...product, id, status: "draft" }, context });
    expect(state.execute.mock.calls[2]?.[0]).toContain("UPDATE products");
    expect(state.execute.mock.calls[2]?.[1]).toContain("draft");
    await handler(saveAdminProduct)({ data: { ...product, id, status: "published" }, context });
    expect(state.execute.mock.calls[4]?.[1]).toContain("published");
    await handler(saveAdminProduct)({ data: { ...product, id, status: "archived" }, context });
    expect(state.execute.mock.calls[6]?.[0]).toContain("UPDATE products");
    expect(state.execute.mock.calls[6]?.[0]).not.toMatch(/DELETE|DROP|TRUNCATE/i);
    expect(state.execute.mock.calls[6]?.[1]).toContain("archived");
  });

  it("refuses to publish fresh produce", async () => {
    const context = { admin: { id: "admin-1", role: "editor" } };
    await expect(
      handler(saveAdminProduct)({
        data: {
          ...product,
          name: "Fresh red onions",
          slug: "fresh-red-onions",
          category: "fresh-onions",
        },
        context,
      }),
    ).rejects.toThrow("Only dehydrated products");
    expect(state.execute).not.toHaveBeenCalled();
  });

  it("enforces role permissions for product and enquiry operations", async () => {
    await expect(
      handler(saveAdminProduct)({ data: product, context: { admin: { id: "v", role: "viewer" } } }),
    ).rejects.toThrow("not authorized");
    await expect(
      handler(updateInquiryStatus)({
        data: { id: "4d7b12d6-43ac-4db6-8ca3-30bfc3e13a71", status: "closed" },
        context: { admin: { id: "e", role: "editor" } },
      }),
    ).rejects.toThrow("not authorized");

    state.execute.mockResolvedValue([{ affectedRows: 1 }]);
    await expect(
      handler(updateInquiryStatus)({
        data: { id: "4d7b12d6-43ac-4db6-8ca3-30bfc3e13a71", status: "closed" },
        context: { admin: { id: "s", role: "sales" } },
      }),
    ).resolves.toEqual({ updated: true });
  });

  it("validates image signatures and size before storing media", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
    state.execute.mockResolvedValue([{ affectedRows: 1 }]);
    const context = { admin: { id: "admin-1", role: "owner" } };
    await expect(
      handler(saveAdminMedia)({
        data: { mimeType: "image/png", contents: png.toString("base64") },
        context,
      }),
    ).resolves.toEqual({ url: expect.stringMatching(/^\/api\/media\//) });
    expect(state.execute).toHaveBeenCalledOnce();

    await expect(
      handler(saveAdminMedia)({
        data: { mimeType: "image/png", contents: Buffer.from("not an image").toString("base64") },
        context,
      }),
    ).rejects.toThrow("does not match its image type");
    await expect(
      handler(saveAdminMedia)({
        data: {
          mimeType: "image/png",
          contents: Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64"),
        },
        context,
      }),
    ).rejects.toThrow("smaller than 5 MB");
    await expect(
      handler(saveAdminMedia)({
        data: { mimeType: "image/png", contents: png.toString("base64") },
        context: { admin: { id: "v", role: "viewer" } },
      }),
    ).rejects.toThrow("not authorized");
    expect(state.execute).toHaveBeenCalledOnce();
  });
});
