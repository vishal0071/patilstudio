/**
 * Enquiry validation, shared by the browser and the route handler.
 *
 * One module deliberately used by both. The form previously relied on HTML attributes
 * while the server applied its own rules, and the two disagreed in three ways that all
 * looked like broken validation to the visitor:
 *
 *   - `someone@localhost` satisfies `type="email"`, so the browser let it through and the
 *     server rejected it a round trip later.
 *   - A name of three spaces satisfies `required`, and the server then answered with the
 *     generic "Name, email and a message are required" — confusing, because the visitor
 *     did type something.
 *   - `type="tel"` validates nothing, so "not a phone at all" was accepted and stored,
 *     even though the studio replies by phone and WhatsApp.
 *
 * Sharing the rules means the browser can refuse exactly what the server would refuse,
 * inline and instantly, and the server stays the authority — it is still the only thing
 * standing between a scripted POST and the database.
 */

export type InquiryFields = {
  name: string;
  phone: string;
  email: string;
  message: string;
};

export type FieldErrors = Partial<Record<keyof InquiryFields, string>>;

/** Trim, collapse runs of whitespace, and cap. Used before every check. */
export function normalise(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Deliberately permissive: it requires an `@` and a dotted domain and nothing more.
 * Rejecting an odd-but-valid address loses a booking, which is a far worse outcome than
 * accepting a typo the studio can simply reply to.
 */
export const EMAIL_PATTERN = '[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}';
const EMAIL_RE = new RegExp(`^${EMAIL_PATTERN}$`);

/**
 * Digits, and the punctuation people actually type: + ( ) - . and spaces. Between 8 and
 * 15 digits — 15 is the E.164 maximum, and 8 admits Indian landlines with an STD code
 * as well as the 10-digit mobiles most enquiries will use.
 */
export const PHONE_PATTERN = '[+()0-9.\\- ]{8,24}';
const PHONE_ALLOWED_RE = new RegExp(`^${PHONE_PATTERN}$`);

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

export function isPhone(value: string): boolean {
  if (!PHONE_ALLOWED_RE.test(value)) return false;
  const digits = value.replace(/\D/g, '').length;
  return digits >= 8 && digits <= 15;
}

/**
 * The single source of truth for whether an enquiry is acceptable.
 *
 * Returns per-field messages rather than one sentence, so the form can put each message
 * against the field that caused it instead of making the visitor hunt for it.
 */
export function validateInquiry(input: Partial<Record<keyof InquiryFields, unknown>>): {
  values: InquiryFields;
  errors: FieldErrors;
} {
  const values: InquiryFields = {
    name: normalise(input.name, 120),
    phone: normalise(input.phone, 40),
    email: normalise(input.email, 200),
    // Not whitespace-collapsed: paragraph breaks in someone's message are theirs to keep.
    message: typeof input.message === 'string' ? input.message.trim().slice(0, 4000) : '',
  };

  const errors: FieldErrors = {};

  if (values.name.length === 0) errors.name = 'Please tell us your name.';
  else if (values.name.length < 2) errors.name = 'That looks too short to be a name.';

  if (values.phone.length === 0) errors.phone = 'Please add a phone number so we can reply.';
  else if (!isPhone(values.phone)) errors.phone = 'That does not look like a phone number.';

  if (values.email.length === 0) errors.email = 'Please add an email address.';
  else if (!isEmail(values.email)) errors.email = 'That email address looks incomplete.';

  if (values.message.length === 0) errors.message = 'Tell us a little about your celebration.';
  else if (values.message.length < 10) errors.message = 'A sentence or two would help us reply properly.';

  return { values, errors };
}
