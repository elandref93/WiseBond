/**
 * Utility functions for formatting and parsing currency values
 * Designed for South African Rand (ZAR) but can be used with other currencies
 */

interface FormatCurrencyOptions {
  locale?: string;
  currency?: string;
  symbol?: string;
  decimal?: string;
  thousand?: string;
  precision?: number;
  format?: string;
}

/**
 * Format a number as currency
 * @param value - Number to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string,
  options: FormatCurrencyOptions = {}
): string {
  // Default options for South African Rand
  const defaults: Required<FormatCurrencyOptions> = {
    locale: 'en-ZA',
    currency: 'ZAR',
    symbol: 'R',
    decimal: '.',
    thousand: ',',
    precision: 2,
    format: '%s %v',
  };

  const opts = { ...defaults, ...options };
  
  // Convert value to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN and invalid values
  if (isNaN(numValue)) return `${opts.symbol}0.00`;
  
  // Format using Intl if no custom formatting needed
  if (
    opts.symbol === 'R' && 
    opts.decimal === '.' && 
    opts.thousand === ',' && 
    opts.format === '%s %v'
  ) {
    return new Intl.NumberFormat(opts.locale, {
      style: 'currency',
      currency: opts.currency,
      minimumFractionDigits: opts.precision,
      maximumFractionDigits: opts.precision,
    }).format(numValue);
  }
  
  // Custom formatting
  const negative = numValue < 0 ? '-' : '';
  const absValue = Math.abs(numValue);
  
  // Format the number with the specified precision
  let i = parseInt(absValue.toFixed(opts.precision), 10) + '';
  let j = i.length > 3 ? i.length % 3 : 0;
  
  // Build the formatted value
  const formatted = 
    negative + 
    (j ? i.substr(0, j) + opts.thousand : '') + 
    i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + opts.thousand) + 
    (opts.precision > 0 
      ? opts.decimal + 
        Math.abs(absValue - parseInt(i, 10))
          .toFixed(opts.precision)
          .slice(2) 
      : '');
  
  // Apply the format
  return opts.format
    .replace('%s', opts.symbol)
    .replace('%v', formatted);
}

/**
 * Parse a string as currency and return a number
 * @param value - String to parse as currency
 * @returns Parsed number value
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove currency symbol, spaces, and thousand separators
  const cleanValue = value
    .replace(/[R$€£¥]/g, '')   // Remove common currency symbols
    .replace(/\s/g, '')       // Remove spaces
    .replace(/,/g, '');       // Remove thousand separators
  
  // Parse as float
  const result = parseFloat(cleanValue);
  
  // Return 0 if parsing failed
  return isNaN(result) ? 0 : result;
}

/**
 * Format a number as a percentage
 * @param value - Number to format as percentage
 * @param precision - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, precision: number = 2): string {
  return `${value.toFixed(precision)}%`;
}

/**
 * Format a number with proper thousand separators
 * @param value - Number to format
 * @param precision - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, precision: number = 0): string {
  return new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

/**
 * Abbreviate large numbers for display (e.g., 1,000 to 1K)
 * @param value - Number to abbreviate 
 * @param precision - Number of decimal places
 * @returns Abbreviated number string
 */
export function abbreviateNumber(value: number, precision: number = 1): string {
  if (value < 1000) return value.toString();
  
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  const suffixIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
  
  if (suffixIndex >= suffixes.length) {
    return value.toExponential(precision);
  }
  
  const shortValue = value / Math.pow(1000, suffixIndex);
  return shortValue.toFixed(precision) + suffixes[suffixIndex];
}