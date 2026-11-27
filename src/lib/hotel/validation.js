/**
 * Unified client-side validation & input sanitization utilities.
 * Rules match backend-hotel-meri/utils/validation.js.
 */

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const NAME_REGEX = /^[A-Za-z\s.'-]+$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Sanitizes typed or pasted phone input to at most 10 digits (digits only).
 * If a pasted 12-digit number starts with "91" or 11-digit starts with "0",
 * strips the country/trunk prefix before capping to 10 digits.
 */
export function sanitizePhoneInput(raw) {
  if (typeof raw !== "string") return "";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

/**
 * Strips digits and disallowed symbols from name input while typing/pasting.
 */
export function sanitizeNameInput(raw, max = 80) {
  if (typeof raw !== "string") return "";
  return raw.replace(/[^A-Za-z\s.'-]/g, "").slice(0, max);
}

/**
 * Formats and restricts Govt ID input while typing/pasting according to the selected ID type.
 * - Aadhaar Card: 12 digits formatted as "XXXX XXXX XXXX" (max 14 chars with spaces)
 * - PAN Card: 10 alphanumeric uppercase
 * - Passport: 9 alphanumeric uppercase
 * - Voter ID: 10 alphanumeric uppercase
 * - Driving License / Other: up to 20-24 alphanumeric/hyphen/space chars
 */
export function sanitizeIdInput(raw, idType = "Aadhaar Card") {
  if (typeof raw !== "string") return "";
  if (idType === "Aadhaar Card") {
    const digits = raw.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }
  if (idType === "PAN Card" || idType === "Voter ID") {
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  }
  if (idType === "Passport") {
    return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
  }
  return raw.toUpperCase().replace(/[^A-Z0-9\s-]/g, "").slice(0, 20);
}

export function validatePhoneNumber(phone, { required = true } = {}) {
  if (phone === null || phone === undefined || (typeof phone === "string" && phone.trim() === "")) {
    if (!required) return { valid: true, digits: "", formatted: "" };
    return { valid: false, error: "Please enter a valid 10-digit mobile number." };
  }
  if (typeof phone !== "string") {
    return { valid: false, error: "Please enter a valid 10-digit mobile number." };
  }
  const trimmed = phone.trim();
  if (!/^\d{10}$/.test(trimmed)) {
    return {
      valid: false,
      error: "Please enter a valid 10-digit mobile number (digits only, no spaces or special characters).",
    };
  }
  if (!/^[6-9]/.test(trimmed)) {
    return {
      valid: false,
      error: "Indian mobile numbers must start with 6, 7, 8, or 9.",
    };
  }
  return {
    valid: true,
    digits: trimmed,
    formatted: trimmed,
  };
}

export function validateEmail(email, { required = true } = {}) {
  if (email === null || email === undefined || (typeof email === "string" && email.trim() === "")) {
    if (!required) return { valid: true, email: "" };
    return { valid: false, error: "Please enter a valid email address." };
  }
  if (typeof email !== "string") {
    return { valid: false, error: "Please enter a valid email address." };
  }
  const clean = email.trim();
  if (clean.length > 254 || clean.includes("..") || !EMAIL_REGEX.test(clean)) {
    return { valid: false, error: "Please enter a valid email address." };
  }
  return { valid: true, email: clean.toLowerCase() };
}

export function validateName(name, { label = "Name", min = 2, max = 80, required = true } = {}) {
  if (name === null || name === undefined || (typeof name === "string" && name.trim() === "")) {
    if (!required) return { valid: true, value: "" };
    return { valid: false, error: `${label} is required.` };
  }
  if (typeof name !== "string") {
    return { valid: false, error: `${label} must be text.` };
  }
  const clean = name.trim().replace(/\s+/g, " ");
  if (clean.length < min || clean.length > max) {
    return { valid: false, error: `${label} must be between ${min} and ${max} characters.` };
  }
  if (!NAME_REGEX.test(clean)) {
    return { valid: false, error: `${label} may only contain letters, spaces, periods, hyphens, and apostrophes.` };
  }
  return { valid: true, value: clean };
}

export function validatePassword(password, { min = 6, max = 64, required = true } = {}) {
  if (password === null || password === undefined || password === "") {
    if (!required) return { valid: true };
    return { valid: false, error: "Password is required." };
  }
  if (typeof password !== "string" || password.trim().length === 0) {
    return { valid: false, error: "Password cannot be empty or whitespace only." };
  }
  if (password.length < min || password.length > max) {
    return { valid: false, error: `Password must be between ${min} and ${max} characters.` };
  }
  return { valid: true };
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return { valid: false, error: "Please confirm your password." };
  }
  if (password !== confirmPassword) {
    return { valid: false, error: "Passwords do not match." };
  }
  return { valid: true };
}

export function validateISODate(dateStr, { label = "Date", required = true } = {}) {
  if (dateStr === null || dateStr === undefined || dateStr === "") {
    if (!required) return { valid: true, value: "" };
    return { valid: false, error: `${label} is required.` };
  }
  if (typeof dateStr !== "string" || !ISO_DATE_REGEX.test(dateStr.trim())) {
    return { valid: false, error: `${label} must be a valid date.` };
  }
  const clean = dateStr.trim();
  const [y, m, d] = clean.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return { valid: false, error: `${label} is not a valid calendar date.` };
  }
  return { valid: true, value: clean };
}

export function validateDateRange(checkIn, checkOut, { allowPast = false } = {}) {
  const inRes = validateISODate(checkIn, { label: "Check-in date" });
  if (!inRes.valid) return inRes;
  const outRes = validateISODate(checkOut, { label: "Check-out date" });
  if (!outRes.valid) return outRes;

  if (!allowPast) {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (inRes.value < todayIso) {
      return { valid: false, error: "Check-in date cannot be in the past." };
    }
  }
  if (outRes.value <= inRes.value) {
    return { valid: false, error: "Check-out date must be later than check-in date." };
  }
  return { valid: true, checkIn: inRes.value, checkOut: outRes.value };
}

export function validateInteger(val, { label = "Value", min = 0, max = Number.MAX_SAFE_INTEGER, required = true } = {}) {
  if (val === null || val === undefined || val === "") {
    if (!required) return { valid: true, value: undefined };
    return { valid: false, error: `${label} is required.` };
  }
  const num = Number(val);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return { valid: false, error: `${label} must be a whole number.` };
  }
  if (num < min || num > max) {
    return { valid: false, error: `${label} must be between ${min} and ${max}.` };
  }
  return { valid: true, value: num };
}

export function validateText(val, { label = "Field", min = 1, max = 500, required = true } = {}) {
  if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
    if (!required) return { valid: true, value: "" };
    return { valid: false, error: `${label} is required.` };
  }
  if (typeof val !== "string") {
    return { valid: false, error: `${label} must be text.` };
  }
  const clean = val.trim();
  if (clean.length < min || clean.length > max) {
    return { valid: false, error: `${label} must be between ${min} and ${max} characters.` };
  }
  return { valid: true, value: clean };
}

export function validatePostalCode(val, { required = true } = {}) {
  if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
    if (!required) return { valid: true, value: "" };
    return { valid: false, error: "Postal / PIN code is required." };
  }
  const clean = String(val).trim();
  if (!/^\d{6}$/.test(clean)) {
    return { valid: false, error: "Please enter a valid 6-digit PIN code." };
  }
  return { valid: true, value: clean };
}

export function validateIdNumber(val, idType = "Aadhaar Card") {
  if (!val || typeof val !== "string" || !val.trim()) {
    return { valid: false, error: `Please enter a valid ${idType} number.` };
  }
  const clean = val.trim().toUpperCase();
  if (idType === "Aadhaar Card" && !/^\d{12}$/.test(clean.replace(/\s+/g, ""))) {
    return { valid: false, error: "Aadhaar number must be 12 digits." };
  }
  if (idType === "PAN Card" && !/^[A-Z]{5}\d{4}[A-Z]$/.test(clean)) {
    return { valid: false, error: "PAN number must follow format ABCDE1234F." };
  }
  if (clean.length < 4 || clean.length > 30 || !/^[A-Z0-9\s-]+$/.test(clean)) {
    return { valid: false, error: `Please enter a valid ${idType} number (4–30 alphanumeric characters).` };
  }
  return { valid: true, value: clean };
}

export function validateUploadFile(file, { maxMB = 5 } = {}) {
  if (!file) return { valid: true };
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return { valid: false, error: "Only JPG, PNG, WebP, or PDF files are allowed." };
  }
  if (file.size > maxMB * 1024 * 1024) {
    return { valid: false, error: `File size must not exceed ${maxMB} MB.` };
  }
  return { valid: true };
}
