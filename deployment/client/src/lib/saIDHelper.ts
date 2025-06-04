/**
 * Helper functions for South African ID number validation and extraction
 */

/**
 * Validates a South African ID number using the Luhn algorithm
 * @param idNumber - 13-digit South African ID number
 * @returns boolean indicating whether the ID number is valid
 */
export function validateSAID(idNumber: string): boolean {
  // Check if it's exactly 13 digits
  if (!/^\d{13}$/.test(idNumber)) {
    return false;
  }

  // Extract check digit (last digit)
  const digits = idNumber.split('').map(Number);
  const checkDigit = digits.pop() as number;

  // Apply Luhn Algorithm
  const sum = digits.reverse()
    .map((d, i) => (i % 2 === 0) ? 
      ((d * 2) > 9 ? (d * 2) - 9 : (d * 2)) : d)
    .reduce((acc, val) => acc + val, 0);
  
  return (10 - (sum % 10)) % 10 === checkDigit;
}

/**
 * Extracts date of birth from South African ID number
 * @param idNumber - 13-digit South African ID number
 * @returns Date object representing the date of birth
 */
export function extractDateOfBirth(idNumber: string): Date | null {
  if (!validateSAID(idNumber)) {
    return null;
  }

  // Format: YYMMDD
  const birthDateStr = idNumber.substring(0, 6);
  
  // Extract components
  const year = parseInt(birthDateStr.substring(0, 2));
  const month = parseInt(birthDateStr.substring(2, 4)) - 1; // JS months are 0-indexed
  const day = parseInt(birthDateStr.substring(4, 6));
  
  // Determine full year (ID numbers don't specify century)
  let fullYear: number;
  const currentYear = new Date().getFullYear();
  const century = Math.floor(currentYear / 100) * 100;
  
  // If calculated year is in the future, assume previous century
  if (century + year > currentYear) {
    fullYear = (century - 100) + year;
  } else {
    fullYear = century + year;
  }
  
  const date = new Date(fullYear, month, day);
  
  // Validate the date is legitimate
  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null; // Invalid date components
  }
  
  return date;
}

/**
 * Calculates age from South African ID number
 * @param idNumber - 13-digit South African ID number
 * @returns number representing the person's age or null if invalid
 */
export function calculateAgeFromID(idNumber: string): number | null {
  const dob = extractDateOfBirth(idNumber);
  if (!dob) {
    return null;
  }
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  
  // Adjust age if birthday hasn't occurred yet this year
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Extracts gender from South African ID number
 * @param idNumber - 13-digit South African ID number
 * @returns 'male' or 'female' or null if invalid
 */
export function extractGender(idNumber: string): 'male' | 'female' | null {
  if (!validateSAID(idNumber)) {
    return null;
  }
  
  // The gender is encoded in digits 7-10 (0-based index 6-9)
  // Values 0000-4999 are female, 5000-9999 are male
  const genderDigits = parseInt(idNumber.substring(6, 10));
  return genderDigits < 5000 ? 'female' : 'male';
}

/**
 * Extracts citizenship from South African ID number
 * @param idNumber - 13-digit South African ID number
 * @returns 'SA Citizen', 'Permanent Resident', or null if invalid
 */
export function extractCitizenship(idNumber: string): 'SA Citizen' | 'Permanent Resident' | null {
  if (!validateSAID(idNumber)) {
    return null;
  }
  
  // The citizenship is encoded in digit 11 (0-based index 10)
  // 0 = SA Citizen, 1 = Permanent Resident
  const citizenshipDigit = parseInt(idNumber.charAt(10));
  return citizenshipDigit === 0 ? 'SA Citizen' : 'Permanent Resident';
}

/**
 * Formats a date as YYYY-MM-DD
 * @param date - Date object
 * @returns formatted date string
 */
export function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats an ID number as a displayed string with spaces for readability
 * @param idNumber - 13-digit South African ID number
 * @returns formatted ID number (e.g., "800101 5009 087")
 */
export function formatIDNumber(idNumber: string): string {
  if (!idNumber || idNumber.length !== 13) {
    return idNumber || '';
  }
  
  // Format as: YYMMDD SSSSC Z
  return `${idNumber.substring(0, 6)} ${idNumber.substring(6, 10)} ${idNumber.substring(10)}`;
}