export const formatCurrency = (
    amount: number,
    decimals: number,
    currency: string = 'usd',
): string =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: decimals,
    }).format(amount / 100);

/**
 * Formats a currency amount in cents with compact suffixes (k, m, b).
 * e.g. 100000 → "$1k", 2500000 → "$25k", 100000000 → "$1m"
 * Falls back to standard formatting for amounts under $1,000.
 */
export const formatCurrencyCompact = (
    amount: number,
    currency: string = 'usd',
): string => {
    const value = amount / 100;
    const symbol =
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        })
            .formatToParts(0)
            .find((p) => p.type === 'currency')?.value ?? '$';

    if (value >= 1_000_000_000) {
        const n = value / 1_000_000_000;
        return `${symbol}${Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, '')}b`;
    }
    if (value >= 1_000_000) {
        const n = value / 1_000_000;
        return `${symbol}${Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, '')}m`;
    }
    if (value >= 1_000) {
        const n = value / 1_000;
        return `${symbol}${Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, '')}k`;
    }
    return formatCurrency(amount, 0, currency);
};
