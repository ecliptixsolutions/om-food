import { describe, expect, it, vi } from "vitest";
import {
  mapLegacyInquiry,
  parseLegacyCsv,
  reconcileLegacyInquiries,
  sameLegacyInquiry,
} from "../../scripts/import-legacy-inquiries.mjs";

const sourceRow = {
  id: "4d7b12d6-43ac-4db6-8ca3-30bfc3e13a71",
  created_at: "2025-04-03T12:30:00.123456+05:30",
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

describe("legacy quote inquiry mapping", () => {
  it("parses quoted CSV commas, escaped quotes, line breaks, and consent values", () => {
    const headers = Object.keys(sourceRow);
    const values = headers.map((header) => String(sourceRow[header as keyof typeof sourceRow]));
    values[headers.indexOf("full_name")] = 'Asha, "Patel"';
    values[headers.indexOf("message")] = "First line\nsecond line";
    const csvValue = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = parseLegacyCsv(`${headers.join(",")}\r\n${values.map(csvValue).join(",")}\r\n`);
    const mapped = mapLegacyInquiry(rows[0]!);
    expect(mapped.full_name).toBe('Asha, "Patel"');
    expect(mapped.message).toBe("First line\nsecond line");
    expect(mapped.privacy_consent).toBe(true);
  });

  it("preserves source IDs, timestamps, inquiry fields, and consent", () => {
    const mapped = mapLegacyInquiry(sourceRow);
    expect(mapped.id).toBe(sourceRow.id);
    expect(mapped.created_at).toBe("2025-04-03 07:00:00.123456");
    expect(mapped.full_name).toBe(sourceRow.full_name);
    expect(mapped.privacy_consent).toBe(true);
  });

  it("rejects invalid IDs, invalid consent values, and values too large for the target schema", () => {
    expect(() => mapLegacyInquiry({ ...sourceRow, id: "bad" })).toThrow("invalid identifier");
    expect(() => mapLegacyInquiry({ ...sourceRow, privacy_consent: "yes" })).toThrow(
      "consent value",
    );
    expect(() => mapLegacyInquiry({ ...sourceRow, message: "x".repeat(3001) })).toThrow("message");
  });

  it("rejects empty exports and impossible calendar dates", () => {
    expect(() => parseLegacyCsv("\uFEFF\r\n")).toThrow("empty");
    expect(() => mapLegacyInquiry({ ...sourceRow, created_at: "2025-02-30T12:00:00Z" })).toThrow(
      "invalid timestamp",
    );
    expect(() => mapLegacyInquiry({ ...sourceRow, created_at: "2025-01-01T25:00:00Z" })).toThrow(
      "invalid timestamp",
    );
  });

  it("rejects duplicate IDs with conflicting source records before touching the target", async () => {
    const row = mapLegacyInquiry(sourceRow);
    const connection = {
      beginTransaction: vi.fn(),
      execute: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
    };
    await expect(
      reconcileLegacyInquiries(
        [row, { ...row, message: "different source record" }],
        connection,
        true,
      ),
    ).rejects.toThrow("conflicting duplicate identifiers");
    expect(connection.beginTransaction).not.toHaveBeenCalled();
    expect(connection.execute).not.toHaveBeenCalled();
  });

  it("recognizes identical existing rows and surfaces conflicts instead of overwriting", () => {
    const mapped = mapLegacyInquiry(sourceRow);
    const existing = { ...mapped, created_at: "2025-04-03 07:00:00.123456", privacy_consent: 1 };
    expect(sameLegacyInquiry(existing, mapped)).toBe(true);
    expect(sameLegacyInquiry({ ...existing, message: "newer local edit" }, mapped)).toBe(false);
  });

  it("can safely resume an import and never overwrites a conflicting target record", async () => {
    const mapped = mapLegacyInquiry(sourceRow);
    const target = new Map<string, Record<string, unknown>>();
    const execute = vi.fn(
      async (sql: string, values: unknown[] = []): Promise<[unknown, unknown]> => {
        if (sql.startsWith("SELECT")) return [[target.get(String(values[0]))].filter(Boolean), []];
        const existing = Object.fromEntries(
          Object.keys(mapped).map((key, index) => [key, values[index]]),
        );
        target.set(String(existing["id"]), existing);
        return [{ affectedRows: 1 }, []];
      },
    );
    const connection = {
      beginTransaction: vi.fn().mockResolvedValue(undefined),
      execute,
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
    };

    await expect(reconcileLegacyInquiries([mapped], connection, true)).resolves.toMatchObject({
      inserted: 1,
      unchanged: 0,
    });
    await expect(reconcileLegacyInquiries([mapped], connection, true)).resolves.toMatchObject({
      inserted: 0,
      unchanged: 1,
    });
    expect(execute.mock.calls.filter(([sql]) => sql.startsWith("INSERT"))).toHaveLength(1);
    expect(connection.commit).toHaveBeenCalledTimes(2);

    target.set(mapped.id, { ...mapped, message: "newer target value" });
    await expect(reconcileLegacyInquiries([mapped], connection, true)).rejects.toThrow(
      "conflicting inquiry identifier",
    );
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(execute.mock.calls.filter(([sql]) => sql.startsWith("INSERT"))).toHaveLength(1);
  });

  it("keeps dry runs read-only and rolls back a partially failed import", async () => {
    const mapped = mapLegacyInquiry(sourceRow);
    const execute = vi
      .fn()
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([[], []])
      .mockRejectedValueOnce(new Error("insert failed"));
    const connection = {
      beginTransaction: vi.fn().mockResolvedValue(undefined),
      execute,
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockResolvedValue(undefined),
    };
    await expect(reconcileLegacyInquiries([mapped], connection, false)).resolves.toMatchObject({
      inserted: 1,
    });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
    expect(execute).toHaveBeenCalledOnce();

    await expect(reconcileLegacyInquiries([mapped], connection, true)).rejects.toThrow(
      "insert failed",
    );
    expect(connection.rollback).toHaveBeenCalledOnce();
    expect(connection.commit).not.toHaveBeenCalled();
  });
});
