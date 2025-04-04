/**
 * Format a number as South African Rand currency
 * 
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number, 
  options: { 
    symbol?: string; 
    decimal?: string; 
    thousand?: string;
  } = {}
): string {
  const { 
    symbol = 'R', 
    decimal = '.', 
    thousand = ',' 
  } = options;
  
  // Handle null, undefined, or NaN values
  if (value === null || value === undefined || isNaN(value)) {
    return `${symbol}0.00`;
  }
  
  // Convert to fixed 2 decimal places and split on decimal point
  const [integerPart, decimalPart = '00'] = value.toFixed(2).split('.');
  
  // Format integer part with thousand separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
  
  // Combine with symbol and decimal parts
  return `${symbol}${formattedInteger}${decimal}${decimalPart}`;
}

/**
 * Parse a string with currency formatting back to a number
 * 
 * @param value - The string to parse
 * @returns Parsed number value
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove currency symbol, thousand separators, and anything except digits and decimal points
  const cleaned = value.replace(/[^\d.-]/g, '');
  
  // Parse as float and handle NaN
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a date to locale string
 * 
 * @param date - Date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString('en-ZA', options);
}

/**
 * Format a percentage value
 * 
 * @param value - The number to format as percentage
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimalPlaces: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${value.toFixed(decimalPlaces)}%`;
}

/**
 * Format a number with thousand separators
 * 
 * @param value - The number to format
 * @param decimalPlaces - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimalPlaces: number = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  
  return value.toLocaleString('en-ZA', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  });
}

/**
 * Format a phone number in South African format
 * 
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhone(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle +27 format
  if (digits.startsWith('27') && digits.length === 11) {
    return `+27 ${digits.substring(2, 5)} ${digits.substring(5, 8)} ${digits.substring(8)}`;
  }
  
  // Handle 0XX format
  if (digits.startsWith('0') && digits.length === 10) {
    return `0${digits.substring(1, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  }
  
  // Return original if not in expected format
  return phoneNumber;
}