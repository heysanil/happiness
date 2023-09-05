export const formatCurrency = (amount: number, decimals: number, currency: string = 'usd'): string => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: decimals,
}).format(amount / 100);
