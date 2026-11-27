import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizePhoneInput,
  sanitizeNameInput,
  sanitizeIdInput,
  validatePhoneNumber,
  validateEmail,
  validateName,
  validatePassword,
  validateConfirmPassword,
  validateDateRange,
  validateInteger,
  validateText,
  validatePostalCode,
  validateIdNumber,
  validateUploadFile,
} from "../src/lib/hotel/validation.js";

test("Mobile number validation: exact 10-digit Indian mobile rules", () => {
  assert.equal(validatePhoneNumber("9876543210").valid, true);
  assert.equal(validatePhoneNumber("6000000000").valid, true);
  assert.equal(validatePhoneNumber("987654321").valid, false); // 9 digits (1 below min)
  assert.equal(validatePhoneNumber("98765432101").valid, false); // 11 digits (1 above max)
  assert.equal(validatePhoneNumber("1234567890").valid, false); // invalid starting digit
  assert.equal(validatePhoneNumber("98765abc10").valid, false); // alphabets
  assert.equal(validatePhoneNumber("98765@3210").valid, false); // special characters
  assert.equal(validatePhoneNumber("98765 43210").valid, false); // spaces not allowed
  assert.equal(validatePhoneNumber("").valid, false); // empty
  assert.equal(validatePhoneNumber("   ").valid, false); // whitespace only
  assert.equal(validatePhoneNumber(null).valid, false); // null
  assert.equal(validatePhoneNumber(undefined).valid, false); // undefined
  assert.equal(validatePhoneNumber("", { required: false }).valid, true); // optional empty
});

test("Mobile number input sanitization: typing and pasting", () => {
  assert.equal(sanitizePhoneInput("98765432101"), "9876543210");
  assert.equal(sanitizePhoneInput("98765abc10"), "9876510");
  assert.equal(sanitizePhoneInput("98765@3210"), "987653210");
  assert.equal(sanitizePhoneInput("+91 98765 43210"), "9876543210");
  assert.equal(sanitizePhoneInput("09876543210"), "9876543210");
});

test("Email validation: format, trimming, and edge cases", () => {
  const res = validateEmail("  Guest.User@Example.COM  ");
  assert.equal(res.valid, true);
  assert.equal(res.email, "guest.user@example.com");

  assert.equal(validateEmail("").valid, false);
  assert.equal(validateEmail("   ").valid, false);
  assert.equal(validateEmail("invalid-email").valid, false);
  assert.equal(validateEmail("user@").valid, false);
  assert.equal(validateEmail("@example.com").valid, false);
  assert.equal(validateEmail("user@domain").valid, false);
  assert.equal(validateEmail("user..name@example.com").valid, false);
  assert.equal(validateEmail("user name@example.com").valid, false);
  assert.equal(validateEmail(null).valid, false);
});

test("Name validation: min/max length, no numbers or special symbols", () => {
  assert.equal(validateName("Aarav Sharma").valid, true);
  assert.equal(validateName("Ab").valid, true); // min 2
  assert.equal(validateName("A".repeat(80)).valid, true); // max 80
  assert.equal(validateName("A").valid, false); // 1 below min
  assert.equal(validateName("A".repeat(81)).valid, false); // 1 above max
  assert.equal(validateName("Aarav123").valid, false); // numbers
  assert.equal(validateName("Aarav@!").valid, false); // special chars
  assert.equal(validateName("   ").valid, false); // whitespace only
  assert.equal(validateName("").valid, false); // empty
  assert.equal(sanitizeNameInput("Aarav123! Sharma"), "Aarav Sharma");
});

test("Password & confirm password validation", () => {
  assert.equal(validatePassword("secret").valid, true); // min 6
  assert.equal(validatePassword("a".repeat(64)).valid, true); // max 64
  assert.equal(validatePassword("12345").valid, false); // 1 below min
  assert.equal(validatePassword("a".repeat(65)).valid, false); // 1 above max
  assert.equal(validatePassword("      ").valid, false); // whitespace only
  assert.equal(validatePassword("").valid, false);
  assert.equal(validateConfirmPassword("secret1", "secret1").valid, true);
  assert.equal(validateConfirmPassword("secret1", "secret2").valid, false);
});

test("Date range validation: check-in and check-out rules", () => {
  assert.equal(validateDateRange("2099-05-10", "2099-05-12").valid, true);
  assert.equal(validateDateRange("2099-05-10", "2099-05-10").valid, false); // same day
  assert.equal(validateDateRange("2099-05-12", "2099-05-10").valid, false); // checkout < checkin
  assert.equal(validateDateRange("2020-01-01", "2020-01-03").valid, false); // past checkin
  assert.equal(validateDateRange("2099-02-30", "2099-03-02").valid, false); // invalid calendar date
  assert.equal(validateDateRange("bad-date", "2099-05-12").valid, false);
});

test("Integer, text, PIN code, Govt ID, and file upload validation", () => {
  assert.equal(validateInteger(2, { min: 1, max: 3 }).valid, true);
  assert.equal(validateInteger(0, { min: 1, max: 3 }).valid, false);
  assert.equal(validateInteger(4, { min: 1, max: 3 }).valid, false);
  assert.equal(validateInteger(1.5, { min: 1, max: 3 }).valid, false); // decimal rejected
  assert.equal(validateInteger(-1, { min: 1, max: 3 }).valid, false); // negative rejected

  assert.equal(validateText("   ", { min: 5, max: 200 }).valid, false);
  assert.equal(validateText("Valid inquiry message", { min: 5, max: 200 }).valid, true);

  assert.equal(validatePostalCode("462001").valid, true);
  assert.equal(validatePostalCode("46200").valid, false);
  assert.equal(validatePostalCode("4620011").valid, false);

  assert.equal(validateIdNumber("548212904589", "Aadhaar Card").valid, true);
  assert.equal(validateIdNumber("12345", "Aadhaar Card").valid, false);
  assert.equal(validateIdNumber("ABCDE1234F", "PAN Card").valid, true);
  assert.equal(validateIdNumber("INVALID", "PAN Card").valid, false);

  assert.equal(validateUploadFile({ type: "image/jpeg", size: 1024 * 1024 }).valid, true);
  assert.equal(validateUploadFile({ type: "application/exe", size: 1024 }).valid, false);
  assert.equal(validateUploadFile({ type: "image/png", size: 6 * 1024 * 1024 }).valid, false);
});

test("Govt ID input sanitization: Aadhaar formatting & length caps", () => {
  assert.equal(sanitizeIdInput("123456789012", "Aadhaar Card"), "1234 5678 9012");
  assert.equal(sanitizeIdInput("1234664544561454153415", "Aadhaar Card"), "1234 6645 4456");
  assert.equal(sanitizeIdInput("12ab34cd5678ef", "Aadhaar Card"), "1234 5678");
  assert.equal(sanitizeIdInput("abcde1234fxyz", "PAN Card"), "ABCDE1234F");
  assert.equal(sanitizeIdInput("a12345678999", "Passport"), "A12345678");
});
