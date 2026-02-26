const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "Fanbroj <noreply@fanbroj.net>";
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fanbroj.net";

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}): Promise<{ success: boolean; error?: string }> {
    if (!RESEND_API_KEY) {
        console.warn("[Email] RESEND_API_KEY not set — skipping email to:", to);
        return { success: false, error: "Email service not configured" };
    }
    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
        });
        if (!res.ok) {
            const body = await res.text();
            console.error("[Email] Resend error:", res.status, body);
            return { success: false, error: body };
        }
        return { success: true };
    } catch (err) {
        console.error("[Email] Send error:", err);
        return { success: false, error: String(err) };
    }
}

// ── Templates ──────────────────────────────────────────────────────────────

const PLAN_PRICES: Record<string, number> = {
    match: 1.5, weekly: 3, monthly: 6, yearly: 80,
};

export function buildCheckoutRecoveryEmail(plan: string) {
    const name = plan.charAt(0).toUpperCase() + plan.slice(1);
    const price = PLAN_PRICES[plan] ?? 6;
    return {
        subject: `Complete your Fanbroj ${name} Plan — $${price.toFixed(2)}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0b1120;font-family:system-ui,-apple-system,sans-serif;color:#e1e2e6;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0;">FANBROJ</h1>
    <p style="color:#4ade80;font-size:11px;font-weight:700;letter-spacing:0.12em;margin:4px 0 0;">PREMIUM STREAMING</p>
  </div>
  <h2 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 12px;">You left something behind</h2>
  <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 24px;">
    You started checkout for the <strong style="color:#fff;">${name} Plan</strong> but didn't complete it.
    Your subscription is ready — click below to finish in seconds.
  </p>
  <div style="background:#111827;border:1px solid rgba(74,222,128,0.2);border-radius:12px;padding:20px;margin:0 0 28px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 4px;">Plan</p>
      <p style="color:#fff;font-size:18px;font-weight:900;margin:0;">${name}</p>
    </div>
    <p style="color:#4ade80;font-size:28px;font-weight:900;margin:0;">$${price.toFixed(2)}</p>
  </div>
  <div style="text-align:center;margin:0 0 28px;">
    <a href="${SITE_URL}/pay?plan=${plan}"
       style="display:inline-block;background:#3b82f6;color:#fff;font-weight:900;font-size:16px;padding:16px 48px;border-radius:8px;text-decoration:none;letter-spacing:0.04em;">
      COMPLETE MY ORDER →
    </a>
  </div>
  <div style="background:#111827;border-radius:10px;padding:16px;margin:0 0 24px;">
    <p style="color:#4ade80;font-size:12px;font-weight:700;margin:0 0 8px;">✓ What you get:</p>
    <p style="color:#9ca3af;font-size:13px;margin:0 0 4px;">• Unlimited movies &amp; series — Hindi Af Somali</p>
    <p style="color:#9ca3af;font-size:13px;margin:0 0 4px;">• Live sports matches HD</p>
    <p style="color:#9ca3af;font-size:13px;margin:0 0 4px;">• Android app + offline access</p>
    <p style="color:#9ca3af;font-size:13px;margin:0;">• 7-day money-back guarantee</p>
  </div>
  <p style="color:#374151;font-size:11px;text-align:center;margin:0;">
    © ${new Date().getFullYear()} Fanbroj. You received this because you started a checkout.<br>
    <a href="${SITE_URL}" style="color:#4b5563;">Visit site</a>
  </p>
</div>
</body></html>`,
    };
}

export function buildWelcomeEmail(plan: string, accessCode?: string) {
    const name = plan.charAt(0).toUpperCase() + plan.slice(1);
    return {
        subject: `Welcome to Fanbroj Premium! Your ${name} plan is active 🎬`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0b1120;font-family:system-ui,-apple-system,sans-serif;color:#e1e2e6;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <div style="text-align:center;margin-bottom:32px;">
    <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0;">FANBROJ</h1>
    <p style="color:#4ade80;font-size:11px;font-weight:700;letter-spacing:0.12em;margin:4px 0 0;">PREMIUM STREAMING</p>
  </div>
  <div style="text-align:center;font-size:48px;margin:0 0 20px;">🎬</div>
  <h2 style="color:#fff;font-size:24px;font-weight:800;text-align:center;margin:0 0 12px;">You're all set!</h2>
  <p style="color:#9ca3af;font-size:15px;line-height:1.7;text-align:center;margin:0 0 28px;">
    Your <strong style="color:#fff;">${name} Plan</strong> is now active. Start watching thousands of movies and live sports.
  </p>
  ${accessCode ? `
  <div style="background:#111827;border:1px solid rgba(74,222,128,0.25);border-radius:12px;padding:20px;margin:0 0 28px;text-align:center;">
    <p style="color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 8px;">Your Access Code — save this</p>
    <p style="color:#4ade80;font-family:monospace;font-size:24px;font-weight:900;letter-spacing:0.15em;margin:0;">${accessCode}</p>
  </div>
  ` : ""}
  <div style="background:#111827;border-radius:12px;padding:20px;margin:0 0 28px;">
    <p style="color:#9ca3af;font-size:14px;margin:0 0 10px;">🎬 <a href="${SITE_URL}/movies" style="color:#3b82f6;">Browse Hindi Af Somali movies</a></p>
    <p style="color:#9ca3af;font-size:14px;margin:0 0 10px;">⚽ <a href="${SITE_URL}/ciyaar" style="color:#3b82f6;">Watch live sports</a></p>
    <p style="color:#9ca3af;font-size:14px;margin:0;">📱 <a href="${SITE_URL}/apps/android" style="color:#3b82f6;">Download Android app</a></p>
  </div>
  <div style="text-align:center;">
    <a href="${SITE_URL}" style="display:inline-block;background:#3b82f6;color:#fff;font-weight:900;font-size:16px;padding:14px 40px;border-radius:8px;text-decoration:none;">
      START WATCHING →
    </a>
  </div>
</div>
</body></html>`,
    };
}

export function buildOnboardingDay3Email() {
    return {
        subject: "3 days in — Did you know Fanbroj can do this? 🎬",
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0b1120;font-family:system-ui,-apple-system,sans-serif;color:#e1e2e6;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 24px;">FANBROJ</h1>
  <h2 style="color:#fff;font-size:20px;font-weight:800;margin:0 0 12px;">You've been watching for 3 days!</h2>
  <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 24px;">
    Here are features you might have missed:
  </p>
  <div style="background:#111827;border-radius:12px;padding:20px;margin:0 0 24px;">
    <p style="color:#4ade80;font-size:14px;font-weight:700;margin:0 0 12px;">📱 Download the Android App</p>
    <p style="color:#9ca3af;font-size:13px;margin:0 0 16px;">Watch offline, get push notifications for new episodes and live matches.</p>
    <a href="${SITE_URL}/apps/android" style="display:inline-block;background:#4ade80;color:#000;font-weight:700;font-size:13px;padding:10px 24px;border-radius:6px;text-decoration:none;">Download APK →</a>
  </div>
  <div style="background:#111827;border-radius:12px;padding:20px;margin:0 0 24px;">
    <p style="color:#3b82f6;font-size:14px;font-weight:700;margin:0 0 12px;">⚽ Live Sports Alerts</p>
    <p style="color:#9ca3af;font-size:13px;margin:0 0 16px;">Enable notifications and we'll alert you 30 minutes before every big match.</p>
    <a href="${SITE_URL}/ciyaar" style="display:inline-block;background:#3b82f6;color:#fff;font-weight:700;font-size:13px;padding:10px 24px;border-radius:6px;text-decoration:none;">See Live Matches →</a>
  </div>
  <div style="background:#111827;border-radius:12px;padding:20px;margin:0 0 24px;">
    <p style="color:#f59e0b;font-size:14px;font-weight:700;margin:0 0 12px;">🎬 Trending This Week</p>
    <p style="color:#9ca3af;font-size:13px;margin:0 0 16px;">Don't miss the most-watched Hindi Af Somali movies right now.</p>
    <a href="${SITE_URL}/movies" style="display:inline-block;background:#f59e0b;color:#000;font-weight:700;font-size:13px;padding:10px 24px;border-radius:6px;text-decoration:none;">Browse Movies →</a>
  </div>
  <p style="color:#374151;font-size:11px;text-align:center;margin:0;">© ${new Date().getFullYear()} Fanbroj · <a href="${SITE_URL}" style="color:#4b5563;">Visit site</a></p>
</div>
</body></html>`,
    };
}

export function buildOnboardingDay7Email() {
    return {
        subject: "One week on Fanbroj — here's what's new 🌟",
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0b1120;font-family:system-ui,-apple-system,sans-serif;color:#e1e2e6;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 24px;">FANBROJ</h1>
  <h2 style="color:#fff;font-size:20px;font-weight:800;margin:0 0 12px;">You've been with us for a week! 🎉</h2>
  <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 24px;">
    We add new movies and series every week. Here's what arrived this week — check it out before everyone else.
  </p>
  <div style="text-align:center;margin:0 0 28px;">
    <a href="${SITE_URL}/movies?sort=newest"
       style="display:inline-block;background:#3b82f6;color:#fff;font-weight:900;font-size:16px;padding:14px 40px;border-radius:8px;text-decoration:none;">
      SEE NEW ARRIVALS →
    </a>
  </div>
  <div style="background:#111827;border-radius:12px;padding:16px;margin:0 0 24px;">
    <p style="color:#9ca3af;font-size:13px;margin:0 0 8px;">💬 Love Fanbroj? Tell your family and friends!</p>
    <p style="color:#9ca3af;font-size:13px;margin:0;">Share this link: <a href="${SITE_URL}" style="color:#4ade80;">${SITE_URL}</a></p>
  </div>
  <p style="color:#374151;font-size:11px;text-align:center;margin:0;">© ${new Date().getFullYear()} Fanbroj · <a href="${SITE_URL}" style="color:#4b5563;">Visit site</a></p>
</div>
</body></html>`,
    };
}

export function buildRenewalReminderEmail(plan: string, daysLeft: number) {
    const name = plan.charAt(0).toUpperCase() + plan.slice(1);
    const price = PLAN_PRICES[plan] ?? 6;
    return {
        subject: `⚠️ Your Fanbroj ${name} plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0b1120;font-family:system-ui,-apple-system,sans-serif;color:#e1e2e6;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 24px;">FANBROJ</h1>
  <h2 style="color:#f59e0b;font-size:20px;font-weight:800;margin:0 0 12px;">
    Your plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}
  </h2>
  <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 24px;">
    Renew your <strong style="color:#fff;">${name} Plan</strong> now to keep uninterrupted access to all movies, series, and live sports.
  </p>
  <div style="text-align:center;margin:0 0 24px;">
    <a href="${SITE_URL}/pay?plan=${plan}"
       style="display:inline-block;background:#f59e0b;color:#000;font-weight:900;font-size:16px;padding:16px 48px;border-radius:8px;text-decoration:none;">
      RENEW NOW — $${price.toFixed(2)}
    </a>
  </div>
  <p style="color:#4b5563;font-size:12px;text-align:center;margin:0;">7-day money-back guarantee · No hidden fees · Cancel anytime</p>
</div>
</body></html>`,
    };
}
