/**
 * Enquiry notification.
 *
 * Sends over Resend's HTTP API with `fetch` rather than through an SMTP library. That
 * keeps the dependency list at zero for this feature — nodemailer plus its transitive
 * tree is a lot of surface area for one transactional email — and an HTTPS POST is
 * something the container can already do.
 *
 * Unconfigured is a supported state, not a failure: the enquiry is already durably in
 * Postgres before this is called, so a missing API key logs a structured line and the
 * studio reads the enquiry in the admin panel. Losing the email is an inconvenience;
 * failing the visitor's submission because the email provider is down would lose the
 * booking.
 */

export type InquiryNotification = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  eventCount: string | null;
  budget: string | null;
  services: string[];
  message: string;
  source: string | null;
};

export async function notifyNewInquiry(inquiry: InquiryNotification): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFY_TO;
  const from = process.env.INQUIRY_NOTIFY_FROM;

  if (!apiKey || !to || !from) {
    // Deliberately one line and greppable — this is how the studio finds an enquiry
    // in the logs before email is wired up.
    console.info(
      `[inquiries] new enquiry ${inquiry.id} from ${inquiry.name} <${inquiry.email}> ` +
        `(${inquiry.phone ?? 'no phone'}) — email notification not configured`,
    );
    return;
  }

  const rows: [string, string][] = [
    ['Name', inquiry.name],
    ['Phone', inquiry.phone ?? '—'],
    ['Email', inquiry.email],
    ['Event type', inquiry.eventType ?? '—'],
    ['Event date', inquiry.eventDate ?? '—'],
    ['Location', inquiry.eventLocation ?? '—'],
    ['Number of events', inquiry.eventCount ?? '—'],
    ['Budget', inquiry.budget ?? '—'],
    ['Services', inquiry.services.length ? inquiry.services.join(', ') : '—'],
    ['Source', inquiry.source ?? '—'],
  ];

  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;color:#17171b;line-height:1.6">
      <h2 style="font-weight:500;margin:0 0 4px">New enquiry</h2>
      <p style="margin:0 0 20px;color:#8d867c;font-size:13px">Ganesh Patil Photography</p>
      <table style="border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            ([label, value]) =>
              `<tr><td style="padding:6px 18px 6px 0;color:#8d867c;vertical-align:top">${escapeHtml(label)}</td>` +
              `<td style="padding:6px 0">${escapeHtml(value)}</td></tr>`,
          )
          .join('')}
      </table>
      <p style="margin:22px 0 6px;color:#8d867c;font-size:13px">Message</p>
      <p style="margin:0;white-space:pre-wrap;font-size:14px">${escapeHtml(inquiry.message)}</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: to.split(',').map((address) => address.trim()),
        // The visitor's address, so hitting Reply in the studio's inbox reaches them.
        reply_to: inquiry.email,
        subject: `New enquiry — ${inquiry.name}${inquiry.eventType ? ` · ${inquiry.eventType}` : ''}`,
        html,
      }),
      // A slow provider must not hold the visitor's request open.
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error(
        `[inquiries] notification for ${inquiry.id} rejected by provider: ${response.status} ${await response.text()}`,
      );
    }
  } catch (error) {
    console.error(`[inquiries] notification for ${inquiry.id} failed to send`, error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
