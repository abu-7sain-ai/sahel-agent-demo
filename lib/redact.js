// Strips identifiers before a question is logged: 12-digit civil IDs and passport-like tokens.
const ARABIC_DIGITS = /[٠-٩]/g;

function toWestern(s) {
  return s.replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660));
}

function redact(text) {
  return toWestern(String(text))
    .replace(/(?<!\d)\d{12}(?!\d)/g, '[ID]')
    .replace(/\b[A-Za-z]{1,2}\d{6,9}\b/g, '[PASSPORT]');
}

// True when the user pasted something that looks like a civil ID or passport number.
function hasIdentifier(text) {
  return redact(text) !== toWestern(String(text));
}

module.exports = { redact, hasIdentifier };
