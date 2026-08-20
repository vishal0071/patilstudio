'use client';

import { useEffect, useState } from 'react';
import { BUDGET_BANDS, EVENT_TYPES, SERVICE_OPTIONS } from '@/lib/content';
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
   * Read `?package=signature` from the URL after mount rather than with
   * `useSearchParams`: that hook opts the whole page out of static rendering, and
   * this is a nicety on a marketing page, not something worth a dynamic render for.
   */
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('package');
    if (value) setPreselectedPackage(value);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ kind: 'sending' });

    const form = new FormData(event.currentTarget);
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
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
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
    <form onSubmit={onSubmit} className="grid gap-7" noValidate={false}>
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
        <Field name="name" label="Full name" required autoComplete="name" />
        <Field
          name="phone"
          label="Phone number"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+91"
        />
      </div>

      <Field name="email" label="Email" type="email" required autoComplete="email" />

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
        <span className="field-label">Message</span>
        <textarea
          name="message"
          rows={4}
          required
          placeholder="Tell us about your celebration — what you're planning and what matters most to you."
          className="field resize-y"
        />
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
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {!required && <span className="ml-1.5 normal-case opacity-60">(optional)</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="field"
      />
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
