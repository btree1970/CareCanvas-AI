// Healthcare-specific validation utilities

export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeInput(input: any): string {
  if (typeof input !== 'string') return String(input || '');
  
  // Remove potentially harmful characters while preserving medical information
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  const minDate = new Date('1900-01-01');
  
  return date instanceof Date && 
         !isNaN(date.getTime()) && 
         date >= minDate && 
         date <= now;
}

export function validateSSN(ssn: string): boolean {
  if (!ssn) return false;
  const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
  return ssnRegex.test(ssn);
}

export function validateInsuranceId(id: string): boolean {
  if (!id) return false;
  // Basic alphanumeric validation for insurance IDs
  return /^[A-Za-z0-9]{3,20}$/.test(id);
}