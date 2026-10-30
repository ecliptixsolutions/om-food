import { beforeEach, describe, expect, it, vi } from "vitest";

const execute = vi.hoisted(() => vi.fn());
vi.mock("@/lib/mysql.server", () => ({ getMysqlPool: () => ({ execute }) }));

import { Route } from "@/routes/api.media.$id";

const get = (Route.options.server as unknown as { handlers: { GET: (input: unknown) => unknown } })
  .handlers.GET as (input: { params: { id: string } }) => Promise<Response>;
const mediaId = "4d7b12d6-43ac-4db6-8ca3-30bfc3e13a71";

describe("public media route (mocked MySQL)", () => {
  beforeEach(() => execute.mockReset());

  it("returns media only when a published product references its URL", async () => {
    execute.mockResolvedValueOnce([
      [{ mime_type: "image/png", contents: Buffer.from("published image") }],
    ]);
    const response = await get({ params: { id: mediaId } });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(execute.mock.calls[0]?.[0]).toContain("p.status='published'");
    expect(execute.mock.calls[0]?.[0]).toContain("p.image_url=CONCAT('/api/media/',m.id)");
  });

  it("hides media not referenced by any published product (private, draft, or archived)", async () => {
    execute.mockResolvedValueOnce([[]]);
    const response = await get({ params: { id: mediaId } });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not found");
  });

  it("does not query MySQL for malformed media IDs", async () => {
    const response = await get({ params: { id: "not-an-id" } });
    expect(response.status).toBe(404);
    expect(execute).not.toHaveBeenCalled();
  });
});
