export interface InquiryThread {
  id: string;
  buyer_id: string;
  builder_id: string;
  land_listing_id: string | null;
  listing_address: string | null;
  listing_suburb: string | null;
  counterpart_name: string;
  counterpart_role: "buyer" | "builder";
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  status: string;
  initiated_by: string;
}

export interface InquiryMessage {
  id: string;
  inquiry_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
  is_mine: boolean;
}

const EMAIL_RE =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|[A-Z0-9._%+-]+\s*(?:@|at)\s*[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE =
  /(?:\+?61[\s.-]?|0)(?:\d[\s().-]?){8,12}\d|\b\d{4}[\s.-]?\d{3}[\s.-]?\d{3}\b/g;

export function containsContactInfo(text: string): boolean {
  EMAIL_RE.lastIndex = 0;
  PHONE_RE.lastIndex = 0;
  return EMAIL_RE.test(text) || PHONE_RE.test(text);
}

export function contactInfoError(): string {
  return "Please keep phone numbers and email addresses out of messages. Velu protects your contact details until you choose to share them off-platform.";
}

export function publicCounterpartName(
  fullName: string,
  companyName: string | null | undefined,
  role: "buyer" | "builder"
): string {
  if (role === "builder" && companyName?.trim()) {
    return companyName.trim();
  }
  return fullName.trim().split(/\s+/)[0] || "User";
}

export const MESSAGING_DISCLAIMER =
  "Messages stay on Velu — phone numbers and emails are hidden until you connect off-platform.";
