export interface LegacyInquiry {
  id: string;
  created_at: string;
  full_name: string;
  company_name: string;
  business_email: string;
  phone: string;
  country: string;
  product_interest: string;
  required_quantity: string;
  packaging_preference: string;
  destination: string;
  delivery_timeline: string;
  message: string;
  privacy_consent: boolean;
}

export function mapLegacyInquiry(row: Record<string, unknown>): LegacyInquiry;
export function parseLegacyCsv(csv: string): Record<string, string>[];
export function sameLegacyInquiry(
  existing: Record<string, unknown>,
  incoming: LegacyInquiry,
): boolean;
export function reconcileLegacyInquiries(
  rows: LegacyInquiry[],
  connection: {
    beginTransaction(): Promise<void>;
    execute(sql: string, values?: unknown[]): Promise<[unknown, unknown]>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
  },
  apply: boolean,
): Promise<{ sourceRows: number; uniqueRows: number; inserted: number; unchanged: number }>;
