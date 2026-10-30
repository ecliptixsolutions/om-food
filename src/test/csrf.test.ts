import { describe, expect, it } from "vitest";
import { isCsrfRequestAllowed } from "@tanstack/react-start";

describe("TanStack Start CSRF validation for state-changing requests", () => {
  const validationOptions = {};
  const requestContext = (headers: Headers) =>
    ({
      request: new Request("https://omfood.example/_serverFn/submit", {
        method: "POST",
        headers,
      }),
      pathname: "/_serverFn/submit",
      context: undefined,
      next: async () => new Response(null, { status: 200 }),
      handlerType: "serverFn" as const,
    }) as unknown as Parameters<typeof isCsrfRequestAllowed>[1];

  it("rejects a cross-origin POST and permits a same-origin POST", async () => {
    await expect(
      isCsrfRequestAllowed(
        validationOptions,
        requestContext(new Headers({ origin: "https://attacker.example" })),
      ),
    ).resolves.toBe(false);
    await expect(
      isCsrfRequestAllowed(
        validationOptions,
        requestContext(new Headers({ origin: "https://omfood.example" })),
      ),
    ).resolves.toBe(true);
  });

  it("rejects state-changing requests with no origin, fetch-site, or referer proof", async () => {
    await expect(
      isCsrfRequestAllowed(validationOptions, requestContext(new Headers())),
    ).resolves.toBe(false);
  });
});
