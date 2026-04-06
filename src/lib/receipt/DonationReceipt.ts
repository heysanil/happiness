import { jsPDF } from 'jspdf';
import { decompress } from 'wawoff2';

interface ReceiptData {
    donation: {
        id: string;
        amount: number;
        amountCurrency: string;
        createdAt: Date;
    };
    donor: {
        firstName: string;
        lastName: string;
        email: string;
        company: string | null;
    };
    page: {
        name: string;
        organizer: string;
        fsProject: string | null;
    };
    config: {
        name: string;
        fiscalSponsorMode: boolean;
        fiscalSponsorName: string;
        fiscalSponsorEIN: string;
    };
}

function formatAmount(cents: number, currency: string): string {
    const dollars = cents / 100;
    const formatted = dollars.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${currency.toUpperCase() === 'USD' ? '$' : `${currency.toUpperCase()} `}${formatted}`;
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

// Cache decoded TTF binaries in memory across requests (fetch + decompress once)
let fontCache: { vfsName: string; binary: string; style: string }[] | null =
    null;

async function loadGraphikFonts(doc: jsPDF) {
    if (!fontCache) {
        const baseUrl = 'https://slingshot.fm/fonts/graphik';
        const variants = [
            { file: 'Graphik-Regular-Web.woff2', style: 'normal' },
            { file: 'Graphik-Medium-Web.woff2', style: 'medium' },
            { file: 'Graphik-Semibold-Web.woff2', style: 'semibold' },
        ];

        fontCache = [];
        for (const variant of variants) {
            const res = await fetch(`${baseUrl}/${variant.file}`);
            const woff2 = new Uint8Array(await res.arrayBuffer());
            const ttf = await decompress(woff2);
            const binary = Buffer.from(ttf).toString('binary');
            const vfsName = variant.file.replace('.woff2', '.ttf');
            fontCache.push({ vfsName, binary, style: variant.style });
        }
    }

    // Register fonts on this specific jsPDF instance
    for (const { vfsName, binary, style } of fontCache) {
        doc.addFileToVFS(vfsName, binary);
        doc.addFont(vfsName, 'Graphik', style);
    }
    doc.setFont('Graphik');
}

export async function generateReceipt(data: ReceiptData): Promise<Buffer> {
    const { donation, donor, page, config } = data;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const m = 56; // margin
    const w = pageWidth - m * 2; // content width

    // Load Graphik, fall back to Helvetica
    try {
        await loadGraphikFonts(doc);
    } catch {
        // Graphik unavailable — Helvetica is the default
    }

    const font = doc.getFont().fontName;
    let y = m;

    // ─── Header ───────────────────────────────────────────
    doc.setFont(font, 'semibold');
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39);
    doc.text(config.name, m, y + 20);

    doc.setFont(font, 'normal');
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text('Donation Receipt', m, y + 40);

    y += 56;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.line(m, y, m + w, y);
    y += 28;

    // ─── Section helpers ──────────────────────────────────
    const labelX = m;
    const valueX = m + 120;
    const rowH = 20;

    function sectionTitle(title: string) {
        doc.setFont(font, 'semibold');
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(title.toUpperCase(), labelX, y);
        y += 22;
    }

    function row(label: string, value: string, bold = false) {
        doc.setFont(font, 'medium');
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(label, labelX, y);

        doc.setFont(font, bold ? 'semibold' : 'normal');
        doc.setTextColor(26, 26, 26);
        doc.text(value, valueX, y);
        y += rowH;
    }

    function divider() {
        y += 4;
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.5);
        doc.line(m, y, m + w, y);
        y += 20;
    }

    // ─── Donor Information ────────────────────────────────
    sectionTitle('Donor Information');
    row('Name', `${donor.firstName} ${donor.lastName}`);
    row('Email', donor.email);
    if (donor.company) {
        row('Organization', donor.company);
    }

    divider();

    // ─── Donation Details ─────────────────────────────────
    sectionTitle('Donation Details');
    row('Amount', formatAmount(donation.amount, donation.amountCurrency), true);
    row('Date', formatDate(new Date(donation.createdAt)));
    row('Campaign', page.name);
    row('Organizer', page.organizer);
    row('Reference', donation.id);

    // ─── Fiscal Sponsor ───────────────────────────────────
    if (config.fiscalSponsorMode) {
        divider();

        sectionTitle('Tax-Deductible Donation');
        row('Fiscal Sponsor', config.fiscalSponsorName);
        row('EIN', config.fiscalSponsorEIN);
        if (page.fsProject) {
            row('Project', page.fsProject);
        }

        y += 4;
        const taxText = page.fsProject
            ? `This donation was made to ${page.fsProject}, a fiscally-sponsored project of ${config.fiscalSponsorName} (EIN: ${config.fiscalSponsorEIN}), a tax-exempt organization under Section 501(c)(3) of the Internal Revenue Code. No goods or services were provided in exchange for this contribution. This receipt may be used for tax purposes.`
            : `This donation was made to ${config.fiscalSponsorName} (EIN: ${config.fiscalSponsorEIN}), a tax-exempt organization under Section 501(c)(3) of the Internal Revenue Code. No goods or services were provided in exchange for this contribution. This receipt may be used for tax purposes.`;
        doc.setFont(font, 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(107, 114, 128);
        const taxLines = doc.splitTextToSize(taxText, w);
        doc.text(taxLines, m, y);
    }

    // ─── Footer ───────────────────────────────────────────
    const footerY = doc.internal.pageSize.getHeight() - m;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(m, footerY - 20, m + w, footerY - 20);
    doc.setFont(font, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    const footerText = `Generated by ${config.name} on ${formatDate(new Date())}`;
    const footerW = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerW) / 2, footerY);

    return Buffer.from(doc.output('arraybuffer'));
}
