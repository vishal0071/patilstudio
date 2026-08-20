'use client';

import { useEffect, useState } from 'react';
import { BUDGET_BANDS, EVENT_TYPES, SERVICE_OPTIONS } from '@/lib/content';
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
  type FieldErrors,
  validateInquiry,
} from '@/lib/validation';
import { ArrowRightIcon, WhatsAppIcon } from '@/components/ui/icons';

type State = { kind: 'idle' | 'sending' | 'sent' } | { kind: 'error'; message: string };

/**
 * Narrow on purpose. Handing this component the whole `Settings` object would
 * serialise all ~100 keys into the RSC payload on every page load; it needs four
 * strings and two prebuilt WhatsApp links, so that is what it takes.
 */
export type EnquiryFormCopy = {
  submitLabel: string;
  successTitle: string;
  successBody: string;
  whatsappUrl: string;
  whatsappAfterSubmitUrl: string;
};

/**
 * The enquiry form — the page's actual conversion point.
 *
 * Field design follows one rule: never make a visitor stop and think. The date is a
 * real date input but not required, because plenty of couples enquire before fixing
 * one; the budget is a band, not a number; "number of events" is free text, because
 * the honest answer is often "haldi, wedding and reception, maybe a sangeet".
 *
 * Success does not end the conversation — it offers WhatsApp, which is how most of
 * these enquiries actually continue.
 */
export function EnquiryForm({ copy }: { copy: EnquiryFormCopy }) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [preselectedPackage, setPreselectedPackage] = useState<string | null>(null);
  /**
   * Per-field messages, from the same validator the route handler uses.
   *
   * `touched` is what keeps this from being hostile: a field is only marked wrong after
   * the visitor has left it, or after they have tried to submit. Validating on the first
   * keystroke tells someone their email is invalid while they are still typing the local
   * part, which reads as the form arguing with them.
   */
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Read `?package=signature` from the URL after mount rather than with
   * `useSearchParams`: that hook opts the whole page out of static rendering, and
   * this is a nicety on a marketing page, not something worth a dynamic render for.
   */
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('package');
    if (!value) return;
    setPreselectedPackage(value);

    /**
     * Bring the form into view ourselves.
     *
     * The package buttons link to `/?package=signature#contact`. That changes the query,
     * so it is a navigation to a different URL rather than an in-page jump — Next scrolls
     * to the top, and by the time it looks for `#contact` this dynamically-rendered
     * section has not streamed in yet, so the hash resolves to nothing. The result was a
     * button that visibly did nothing.
     *
     * Doing it here works because this effect cannot run before the section it lives in
     * exists. `requestAnimationFrame` waits for the paint that follows, so the scroll
     * measures a settled layout.
     */
    const frame = requestAnimationFrame(() => {
      document.getElementById('contact')?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  /** Re-checks one field, but only reports it once that field has been left. */
  function revalidate(form: HTMLFormElement, markTouched?: string) {
    const data = new FormData(form);
    const { errors: next } = validateInquiry({
      name: data.get('name'),
      phone: data.get('phone'),
      email: data.get('email'),
      message: data.get('message'),
    });
    setErrors(next);
    if (markTouched) setTouched((prev) => ({ ...prev, [markTouched]: true }));
    return next;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    // Check here, with the server's own rules, before spending a round trip on something
    // the server is certain to refuse. Focus the first offending field so the visitor is
    // not left scanning the form for what it objects to.
    const found = validateInquiry({
      name: form.get('name'),
      phone: form.get('phone'),
      email: form.get('email'),
      message: form.get('message'),
    }).errors;
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setTouched({ name: true, phone: true, email: true, message: true });
      setState({ kind: 'idle' });
      const first = Object.keys(found)[0];
      (formElement.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }

    setErrors({});
    setState({ kind: 'sending' });
    const payload = {
      ...Object.fromEntries(form),
      // Multi-value checkboxes: FormData.entries() keeps only the last one.
      services: form.getAll('services').map(String),
      source: preselectedPackage
        ? `website · ${preselectedPackage} package`
        : `website · ${window.location.pathname}`,
    };

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string; errors?: FieldErrors };
      if (!response.ok) {
        // The server disagreed after all — surface it against the fields, not just as a
        // banner, so it reads the same as client-side validation.
        if (body.errors && Object.keys(body.errors).length > 0) {
          setErrors(body.errors);
          setTouched({ name: true, phone: true, email: true, message: true });
          setState({ kind: 'idle' });
          const first = Object.keys(body.errors)[0];
          (formElement.elements.namedItem(first) as HTMLElement | null)?.focus();
          return;
        }
        setState({ kind: 'error', message: body.error ?? 'Something went wrong.' });
        return;
      }
      setState({ kind: 'sent' });
    } catch {
      setState({
        kind: 'error',
        message: 'Could not reach the server. Please try again, or message us on WhatsApp.',
      });
    }
  }

  /** A field shows its message only once it has been left, or a submit was attempted. */
  const showError = (field: keyof FieldErrors) => Boolean(touched[field] && errors[field]);

  const fieldProps = (field: keyof FieldErrors) => ({
    error: showError(field) ? errors[field] : undefined,
    onBlur: (event: React.FocusEvent<HTMLInputElement>) =>
      revalidate(event.currentTarget.form as HTMLFormElement, field),
    /**
     * Re-checks while typing, but ONLY for a field already showing a message.
     *
     * Validating every field on every keystroke tells someone their email is wrong while
     * they are still typing the local part. But leaving a message up after it has been
     * corrected is worse: the visitor has fixed it, the form still says it is broken, and
     * they have no way to know it will now be accepted. So the rule is asymmetric —
     * complain on leaving, forgive on typing.
     */
    onInput: showError(field)
      ? (event: React.FormEvent<HTMLInputElement>) =>
          revalidate(event.currentTarget.form as HTMLFormElement)
      : undefined,
  });

  if (state.kind === 'sent') {
    return (
      <div className="animate-fade-up border border-gold/30 p-8 sm:p-10">
        <p className="eyebrow text-gold">Enquiry received</p>
        <h3 className="display-2 mt-4 text-ivory">{copy.successTitle}</h3>
        <p className="lede mt-4 max-w-[48ch] text-ivory/65">{copy.successBody}</p>
        <a
          href={copy.whatsappAfterSubmitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-gold mt-8"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Continue on WhatsApp
        </a>
      </div>
    );
  }

  return (
    /* `noValidate`: the browser's own bubbles would now duplicate — and sometimes
       contradict — the inline messages, and they cannot be styled to match the page. The
       constraint attributes stay on each input so assistive technology still announces
       them. */
    <form onSubmit={onSubmit} noValidate className="grid gap-7">
      {/* Honeypot — a person never fills a hidden field; most bots fill everything. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {preselectedPackage && (
        <p className="border border-gold/30 px-4 py-3 text-[0.6875rem] tracking-[0.12em] text-gold/85 uppercase">
          Enquiring about: {preselectedPackage}
        </p>
      )}
      <input type="hidden" name="package" value={preselectedPackage ?? ''} />

      <div className="grid gap-7 sm:grid-cols-2">
        <Field name="name" label="Full name" required autoComplete="name" {...fieldProps('name')} />
        <Field
          name="phone"
          label="Phone number"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+91 98765 43210"
          pattern={PHONE_PATTERN}
          {...fieldProps('phone')}
        />
      </div>

      <Field
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        pattern={EMAIL_PATTERN}
        {...fieldProps('email')}
      />

      <div className="grid gap-7 sm:grid-cols-2">
        <Select name="eventType" label="Event type" options={EVENT_TYPES} />
        <Field name="eventDate" label="Event date" type="date" />
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field
          name="eventLocation"
          label="Event location"
          placeholder="Venue or city"
          autoComplete="address-level2"
        />
        <Field name="eventCount" label="Number of events" placeholder="e.g. Haldi, wedding, reception" />
      </div>

      <Select name="budget" label="Approximate budget" options={BUDGET_BANDS} />

      <fieldset>
        <legend className="field-label">Services required</legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {SERVICE_OPTIONS.map((service) => (
            <label
              key={service}
              className="group cursor-pointer border border-ivory/20 px-3.5 py-2.5 text-[0.75rem] text-ivory/70 transition-colors has-checked:border-gold has-checked:bg-gold/12 has-checked:text-gold-soft hover:border-ivory/45"
            >
              <input type="checkbox" name="services" value={service} className="sr-only" />
              {service}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="field-label">
          Message
          {showError('message') && (
            <span className="ml-2 normal-case text-red-300">{errors.message}</span>
          )}
        </span>
        <textarea
          name="message"
          rows={4}
          required
          aria-invalid={showError('message') || undefined}
          aria-describedby={showError('message') ? 'err-message' : undefined}
          onBlur={(event) => revalidate(event.currentTarget.form as HTMLFormElement, 'message')}
          onInput={
            showError('message')
              ? (event) => revalidate(event.currentTarget.form as HTMLFormElement)
              : undefined
          }
          placeholder="Tell us about your celebration — what you're planning and what matters most to you."
          className={`field resize-y ${showError('message') ? 'field-invalid' : ''}`}
        />
        {showError('message') && (
          <span id="err-message" className="sr-only">
            {errors.message}
          </span>
        )}
      </label>

      {state.kind === 'error' && (
        <p role="alert" className="border border-red-400/40 px-4 py-3 text-sm text-red-300">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button type="submit" disabled={state.kind === 'sending'} className="btn btn-gold">
          {state.kind === 'sending' ? 'Sending…' : copy.submitLabel}
          {state.kind !== 'sending' && <ArrowRightIcon className="h-3.5 w-3.5" />}
        </button>
        <a
          href={copy.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[0.65rem] tracking-[0.18em] text-ivory/55 uppercase transition-colors hover:text-ivory"
        >
          <WhatsAppIcon className="h-4 w-4" />
          Or message us on WhatsApp
        </a>
      </div>

      <p className="text-[0.6875rem] leading-relaxed text-ivory/35">
        Your details are used only to answer this enquiry. We do not share them.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required = false,
  placeholder,
  autoComplete,
  pattern,
  error,
  onBlur,
  onInput,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  pattern?: string;
  /** Already gated on "touched" by the caller; present means show it. */
  error?: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onInput?: (event: React.FormEvent<HTMLInputElement>) => void;
}) {
  const errorId = `err-${name}`;
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {!required && <span className="ml-1.5 normal-case opacity-60">(optional)</span>}
        {/* The message sits in the label rather than below the input: the fields are
            bottom-ruled with tight vertical rhythm, and appending a line under one would
            shove the next field down as you tab through the form. */}
        {error && <span className="ml-2 normal-case text-red-300">{error}</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        pattern={pattern}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onBlur={onBlur}
        onInput={onInput}
        className={`field ${error ? 'field-invalid' : ''}`}
      />
      {error && (
        <span id={errorId} className="sr-only">
          {error}
        </span>
      )}
    </label>
  );
}

function Select({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        <span className="ml-1.5 normal-case opacity-60">(optional)</span>
      </span>
      <select name={name} defaultValue="" className="field">
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
