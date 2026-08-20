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
 * Digits, and the punctuation people actually type: + ( ) - . and spaces.
 *
 * **Ten digits minimum.** The floor was 8, reasoning about short landline formats, and
 * that accepted `777003914` — nine digits, which is a mistyped Indian mobile. Every
 * dialable Indian number is at least ten digits (a 10-digit mobile or landline, 11 with
 * the STD trunk `0`, 12 with the `91` country code), so a shorter one is a typo and the
 * studio would be calling a dead number. 15 is the E.164 ceiling, which keeps
 * international enquiries working.
 *
 * A number below ten digits is rejected even if it is a valid local number somewhere,
 * because without a country code nobody in Pune can dial it.
 */
export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

/**
 * Character check and length check are deliberately separate.
 *
 * One combined `{10,24}` pattern did both, and so misreported the interesting case: a
 * nine-digit number is pure digits, but failed the character regex on length and was
 * told "digits, spaces, + and ( ) - only" — advice that describes exactly what the
 * visitor already typed. Splitting them means "too short" can say "too short".
 */
const PHONE_ALLOWED_RE = /^[+()0-9.\- ]+$/;

/** Hint for the `pattern` attribute; the real check is `checkPhone`. */
export const PHONE_PATTERN = '[+()0-9.\\- ]{10,24}';

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

/** Why a phone number was refused, so the form can say something useful. */
export type PhoneVerdict = 'ok' | 'chars' | 'short' | 'long' | 'repeated';

export function checkPhone(value: string): PhoneVerdict {
  if (!PHONE_ALLOWED_RE.test(value)) return 'chars';
  const digits = value.replace(/\D/g, '');
  if (digits.length < PHONE_MIN_DIGITS) return 'short';
  if (digits.length > PHONE_MAX_DIGITS) return 'long';
  // 0000000000 and 7777777777 are what people type to get past a required field. They
  // are never real, and an enquiry the studio cannot answer is worse than no enquiry.
  if (/^(\d)\1+$/.test(digits)) return 'repeated';
  return 'ok';
}

export function isPhone(value: string): boolean {
  return checkPhone(value) === 'ok';
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

  if (values.phone.length === 0) {
    errors.phone = 'Please add a phone number so we can reply.';
  } else {
    // Distinct messages: "that looks wrong" leaves someone re-reading their own number
    // with no idea what to change.
    const verdict = checkPhone(values.phone);
    if (verdict === 'short') {
      errors.phone = 'That looks short — please give all 10 digits, or add your country code.';
    } else if (verdict === 'long') {
      errors.phone = 'That has too many digits to be a phone number.';
    } else if (verdict === 'repeated') {
      errors.phone = 'Please give a number we can actually reach you on.';
    } else if (verdict === 'chars') {
      errors.phone = 'Digits, spaces, + and ( ) - only, please.';
    }
  }

  if (values.email.length === 0) errors.email = 'Please add an email address.';
  else if (!isEmail(values.email)) errors.email = 'That email address looks incomplete.';

  if (values.message.length === 0) errors.message = 'Tell us a little about your celebration.';
  else if (values.message.length < 10) errors.message = 'A sentence or two would help us reply properly.';

  return { values, errors };
}
