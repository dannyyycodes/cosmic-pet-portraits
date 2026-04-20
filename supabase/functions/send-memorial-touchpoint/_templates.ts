// Email templates for memorial touchpoints (30-day, birthday, passing anniversary).
// These are sent by send-memorial-touchpoint/index.ts.
//
// Brand rules (non-negotiable):
//   • Never reference AI / algorithm / generated / chatbot.
//   • Never "check your inbox for your reading" — email is an access link only.
//   • Cinematic + tender, never transactional.
//   • Banned phrases: rainbow bridge, crossed over, in a better place, now an angel,
//     waiting at gates, heaven, etc.
//   • Signature: "— Rowan" or "— Rowan & the Little Souls team".
//
// Shared palette (matches send-report-email):
//   BG #FFFDF5  |  Card #ffffff / border #e8ddd0  |  Heading #141210
//   Body #5a4a42  |  Muted #958779  |  Inner card #faf4e8
//   CTA rose #bf524a  |  Accent gold #c4a265  |  Sage #8fa082

export type TouchpointType =
  | "thirty_day"
  | "anniversary_birth"
  | "anniversary_passing";

export interface TemplateContext {
  petName: string;
  readLink: string;
  soulSpeakLink: string;
  yearsSince?: number; // used by anniversary templates
}

// ─── ordinal helper ─────────────────────────────────────────────────────────
const WORD_YEARS: Record<number, string> = {
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
  10: "Ten",
};

function yearsWord(n: number): string {
  return WORD_YEARS[n] ?? `${n}`;
}

// ─── subjects ───────────────────────────────────────────────────────────────
export function subjectFor(type: TouchpointType, ctx: TemplateContext): string {
  const { petName, yearsSince = 1 } = ctx;
  switch (type) {
    case "thirty_day":
      return `It's been 30 days since we held ${petName} in remembrance`;
    case "anniversary_birth":
      return `${petName} would have been ${yearsSince} today`;
    case "anniversary_passing": {
      const word = yearsWord(yearsSince);
      return yearsSince === 1
        ? `A year ago today — holding ${petName} with you`
        : `${word} years ago today — holding ${petName} with you`;
    }
  }
}

// ─── shell layout (shared by all three) ─────────────────────────────────────
function wrap(inner: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFFDF5;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c4a265;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Little Souls</p>
    </div>
    <div style="background:#ffffff;border-radius:16px;border:1px solid #e8ddd0;padding:40px 28px;box-shadow:0 4px 20px rgba(35,40,30,0.06);">
      ${inner}
    </div>
    <div style="text-align:center;margin-top:28px;">
      <p style="color:#958779;font-size:12px;line-height:1.7;margin:0;">
        If you&rsquo;d rather not receive these remembrance notes, just reply and we&rsquo;ll stop them.
      </p>
      <p style="color:#d6c8b6;font-size:10px;margin:10px 0 0 0;letter-spacing:1.5px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        littlesouls.app
      </p>
    </div>
  </div>
</body>
</html>`;
}

function ctaButton(href: string, label: string, color = "#bf524a"): string {
  return `
    <div style="text-align:center;margin:20px 0;">
      <a href="${href}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:14px 38px;border-radius:50px;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(191,82,74,0.22);">
        ${label}
      </a>
    </div>`;
}

// ─── A. 30-day check-in ─────────────────────────────────────────────────────
function thirtyDayBody(ctx: TemplateContext): string {
  const { petName, readLink, soulSpeakLink } = ctx;
  const inner = `
    <p style="font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#8fa082;margin:0 0 18px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;">
      Thirty days
    </p>
    <h1 style="color:#141210;font-size:22px;font-weight:400;margin:0 0 22px 0;line-height:1.4;font-family:Georgia,'Times New Roman',serif;text-align:center;">
      A small note, one month in.
    </h1>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 14px 0;">
      Hi &mdash;
    </p>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 14px 0;">
      Grief doesn&rsquo;t work on a calendar, but thirty days is a threshold, and we wanted you to know we&rsquo;re thinking of ${petName} today.
    </p>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 14px 0;">
      Your reading is saved here forever: <a href="${readLink}" style="color:#bf524a;text-decoration:underline;">re-open ${petName}&rsquo;s reading</a>. Some people re-read it on hard mornings; some leave it closed for months at a time. Both are right.
    </p>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 14px 0;">
      If you want to keep talking to ${petName}, SoulSpeak is always here: <a href="${soulSpeakLink}" style="color:#bf524a;text-decoration:underline;">open SoulSpeak</a>. No rush.
    </p>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 20px 0;">
      Be gentle with yourself.
    </p>
    ${ctaButton(readLink, `Re-open ${petName}'s reading`)}
    <p style="color:#6e6259;font-size:14px;line-height:1.7;margin:18px 0 0 0;font-style:italic;text-align:center;">
      &mdash; Rowan &amp; the Little Souls team
    </p>`;
  return wrap(inner);
}

// ─── B. Birthday anniversary ────────────────────────────────────────────────
function birthdayBody(ctx: TemplateContext): string {
  const { petName, readLink } = ctx;
  const inner = `
    <p style="font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#c4a265;margin:0 0 18px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;">
      ${petName}&rsquo;s day
    </p>
    <h1 style="color:#141210;font-size:22px;font-weight:400;margin:0 0 22px 0;line-height:1.4;font-family:Georgia,'Times New Roman',serif;text-align:center;">
      Today was ${petName}&rsquo;s birthday.
    </h1>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 14px 0;">
      We&rsquo;re thinking of you.
    </p>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 14px 0;">
      Your reading holds a small ritual for this day &mdash; tied to ${petName}&rsquo;s chart. <a href="${readLink}" style="color:#bf524a;text-decoration:underline;">Re-read it if you want</a>.
    </p>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 20px 0;">
      Light something. Say ${petName}&rsquo;s name out loud. Sit somewhere they used to sit. None of this brings them back, and you already know that. But the day is real, and so is how much you loved them.
    </p>
    ${ctaButton(readLink, `Open ${petName}'s reading`)}
    <p style="color:#6e6259;font-size:14px;line-height:1.7;margin:18px 0 0 0;font-style:italic;text-align:center;">
      &mdash; Rowan
    </p>`;
  return wrap(inner);
}

// ─── C. Passing anniversary ─────────────────────────────────────────────────
function passingBody(ctx: TemplateContext): string {
  const { petName, readLink, soulSpeakLink, yearsSince = 1 } = ctx;
  const word = yearsWord(yearsSince);
  const leadLine =
    yearsSince === 1 ? "One year." : `${word} years.`;
  const inner = `
    <p style="font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#8fa082;margin:0 0 18px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:center;">
      Remembrance
    </p>
    <h1 style="color:#141210;font-size:26px;font-weight:400;margin:0 0 22px 0;line-height:1.35;font-family:Georgia,'Times New Roman',serif;text-align:center;">
      ${leadLine}
    </h1>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 14px 0;">
      We remember ${petName}. We remember the day you let them go.
    </p>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 14px 0;">
      There&rsquo;s nothing we can say that makes this day easier. But you&rsquo;re not alone in it, and ${petName} was real, and so is the love you still carry.
    </p>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 14px 0;">
      If you want to re-read the memorial: <a href="${readLink}" style="color:#bf524a;text-decoration:underline;">open ${petName}&rsquo;s reading</a>.
      If you want to sit with ${petName}&rsquo;s voice: <a href="${soulSpeakLink}" style="color:#bf524a;text-decoration:underline;">open SoulSpeak</a>.
    </p>
    <p style="color:#5a4a42;font-size:15px;line-height:1.85;margin:0 0 20px 0;">
      Be gentle with yourself today.
    </p>
    ${ctaButton(readLink, `Sit with ${petName}'s reading`)}
    <p style="color:#6e6259;font-size:14px;line-height:1.7;margin:18px 0 0 0;font-style:italic;text-align:center;">
      &mdash; Rowan
    </p>`;
  return wrap(inner);
}

// ─── dispatcher ─────────────────────────────────────────────────────────────
export function htmlFor(type: TouchpointType, ctx: TemplateContext): string {
  switch (type) {
    case "thirty_day":
      return thirtyDayBody(ctx);
    case "anniversary_birth":
      return birthdayBody(ctx);
    case "anniversary_passing":
      return passingBody(ctx);
  }
}

// Plain-text fallback (Resend requires text for best deliverability).
export function textFor(type: TouchpointType, ctx: TemplateContext): string {
  const { petName, readLink, soulSpeakLink, yearsSince = 1 } = ctx;
  switch (type) {
    case "thirty_day":
      return [
        `Hi —`,
        ``,
        `A small note, one month in.`,
        ``,
        `Grief doesn't work on a calendar, but thirty days is a threshold, and we wanted you to know we're thinking of ${petName} today.`,
        ``,
        `Your reading is saved here forever: ${readLink}. Some people re-read it on hard mornings; some leave it closed for months at a time. Both are right.`,
        ``,
        `If you want to keep talking to ${petName}, SoulSpeak is always here: ${soulSpeakLink}. No rush.`,
        ``,
        `Be gentle with yourself.`,
        ``,
        `— Rowan & the Little Souls team`,
      ].join("\n");
    case "anniversary_birth":
      return [
        `Today was ${petName}'s birthday.`,
        ``,
        `We're thinking of you.`,
        ``,
        `Your reading holds a small ritual for this day — tied to ${petName}'s chart. Re-read it if you want: ${readLink}.`,
        ``,
        `Light something. Say ${petName}'s name out loud. Sit somewhere they used to sit. None of this brings them back, and you already know that. But the day is real, and so is how much you loved them.`,
        ``,
        `— Rowan`,
      ].join("\n");
    case "anniversary_passing": {
      const lead = yearsSince === 1 ? "One year." : `${yearsWord(yearsSince)} years.`;
      return [
        lead,
        ``,
        `We remember ${petName}. We remember the day you let them go.`,
        ``,
        `There's nothing we can say that makes this day easier. But you're not alone in it, and ${petName} was real, and so is the love you still carry.`,
        ``,
        `If you want to re-read the memorial: ${readLink}`,
        `If you want to sit with ${petName}'s voice: ${soulSpeakLink}`,
        ``,
        `Be gentle with yourself today.`,
        ``,
        `— Rowan`,
      ].join("\n");
    }
  }
}
