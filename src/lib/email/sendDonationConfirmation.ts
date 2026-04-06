import { HappinessConfig } from 'happiness.config';
import nodemailer from 'nodemailer';

interface DonationEmailData {
    donationID: string;
    donorEmail: string;
    donorName: string;
    amount: number;
    amountCurrency: string;
    campaignName: string;
    organizer: string;
    fsProject: string | null;
    date: Date;
}

function formatAmount(cents: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(cents / 100);
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

const getTransporter = (() => {
    let transporter: nodemailer.Transporter | null = null;
    return () => {
        if (!transporter) {
            if (
                !process.env.SMTP_HOST ||
                !process.env.SMTP_USER ||
                !process.env.SMTP_PASS
            ) {
                return null;
            }
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT ?? 587),
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
        return transporter;
    };
})();

export async function sendDonationConfirmation(
    data: DonationEmailData,
): Promise<void> {
    const transporter = getTransporter();
    if (!transporter) {
        console.warn(
            '[email] SMTP not configured, skipping donation confirmation email',
        );
        return;
    }

    const {
        donationID,
        donorEmail,
        donorName,
        amount,
        amountCurrency,
        campaignName,
        organizer,
        fsProject,
        date,
    } = data;

    const amountStr = formatAmount(amount, amountCurrency);
    const dateStr = formatDate(date);
    const baseURL =
        process.env.BETTER_AUTH_URL ||
        process.env.NEXT_PUBLIC_DEFAULT_BASE_URL ||
        'https://slingshot.giving';
    const receiptURL = `${baseURL}/receipts/${donationID}`;
    const appName = HappinessConfig.name;

    const fiscalNote = HappinessConfig.fiscalSponsorMode
        ? fsProject
            ? `\n\nThis donation was made to ${fsProject}, a fiscally-sponsored project of ${HappinessConfig.fiscalSponsorName} (EIN: ${HappinessConfig.fiscalSponsorEIN}), a tax-exempt organization under Section 501(c)(3). No goods or services were provided in exchange for this contribution.`
            : `\n\nThis donation was made to ${HappinessConfig.fiscalSponsorName} (EIN: ${HappinessConfig.fiscalSponsorEIN}), a tax-exempt organization under Section 501(c)(3). No goods or services were provided in exchange for this contribution.`
        : '';

    const textBody = `Hi ${donorName},

Thank you for your generous donation of ${amountStr} to ${campaignName}, organized by ${organizer}.

Donation Details
Amount: ${amountStr}
Date: ${dateStr}
Campaign: ${campaignName}
Reference: ${donationID}${fiscalNote}

View your receipt: ${receiptURL}

Thank you for your support!
${appName}`;

    const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0; color: #1a1a1a;">
  <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 4px;">Thank you for your donation!</h2>
  <p style="color: #6b7280; margin-top: 0;">Hi ${donorName}, your contribution makes a difference.</p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 10px 0; font-weight: 500; color: #6b7280; width: 120px;">Amount</td>
      <td style="padding: 10px 0; font-weight: 600;">${amountStr}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 10px 0; font-weight: 500; color: #6b7280;">Date</td>
      <td style="padding: 10px 0;">${dateStr}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 10px 0; font-weight: 500; color: #6b7280;">Campaign</td>
      <td style="padding: 10px 0;">${campaignName}</td>
    </tr>
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 10px 0; font-weight: 500; color: #6b7280;">Organizer</td>
      <td style="padding: 10px 0;">${organizer}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; font-weight: 500; color: #6b7280;">Reference</td>
      <td style="padding: 10px 0; font-family: monospace; font-size: 13px;">${donationID}</td>
    </tr>
  </table>

  ${
      HappinessConfig.fiscalSponsorMode
          ? `<p style="font-size: 13px; color: #374151; background: #f9fafb; padding: 14px; border-radius: 6px; line-height: 1.5;">
      ${fsProject ? `This donation was made to ${fsProject}, a fiscally-sponsored project of ${HappinessConfig.fiscalSponsorName} (EIN: ${HappinessConfig.fiscalSponsorEIN}), a tax-exempt organization under Section 501(c)(3). No goods or services were provided in exchange for this contribution.` : `This donation was made to ${HappinessConfig.fiscalSponsorName} (EIN: ${HappinessConfig.fiscalSponsorEIN}), a tax-exempt organization under Section 501(c)(3). No goods or services were provided in exchange for this contribution.`}
    </p>`
          : ''
  }

  <a href="${receiptURL}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 8px;">View Receipt</a>

  <p style="color: #9ca3af; font-size: 13px; margin-top: 32px;">Thank you for your support!<br>${appName}</p>
</div>`;

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: donorEmail,
            subject: `Donation confirmation — ${amountStr} to ${campaignName}`,
            text: textBody,
            html: htmlBody,
        });
        console.log(
            `[email] Donation confirmation sent to ${donorEmail} for ${donationID}`,
        );
    } catch (err) {
        console.error('[email] Failed to send donation confirmation:', err);
    }
}
