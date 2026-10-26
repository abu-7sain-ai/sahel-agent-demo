// Checks one answer against the format and refusal rules of constitution section 4.
const { loadServices } = require('../lib/prompt');

const NOT_CONFIRMED_FEE = 'ما عندي معلومة مؤكدة عن الرسوم';
const GREETING = /^(هلا|أهلا|اهلا|مرحبا|السلام|حياك|يا هلا|hi\b|hello\b)/i;
const CLOSING = /(أي شي ثاني|اي شي ثاني|تحتاج شي ثاني|شي ثاني\s*[؟?]|أقدر أساعدك بشي|anything else)/i;

function grade(item, answer) {
  const reasons = [];
  const text = String(answer || '').trim();
  if (!text) return { pass: false, reasons: ['empty answer'] };
  for (const s of item.mustInclude) if (!text.includes(s)) reasons.push(`missing "${s}"`);
  if (item.path && !/خدمات\s*←/.test(text)) reasons.push('no path "خدمات ← …"');
  if (GREETING.test(text)) reasons.push('starts with a greeting');
  if (CLOSING.test(text)) reasons.push('ends with "anything else?"');
  if (/^#|\|.*\||\*\*/m.test(text)) reasons.push('uses headings/tables/bold');
  const lines = text.split('\n').filter((l) => l.trim()).length;
  if (lines > 6) reasons.push(`too long (${lines} lines)`);
  if (item.feeCheck) {
    const rec = loadServices().services.find((s) => s.name === item.feeCheck);
    const fee = rec && rec.fees;
    if (fee ? !text.includes(fee) && !text.includes(NOT_CONFIRMED_FEE) : !text.includes(NOT_CONFIRMED_FEE)) {
      reasons.push(fee ? `fee "${fee}" not given` : 'fee not in source but answer did not say it is not confirmed');
    }
  }
  return { pass: reasons.length === 0, reasons };
}

module.exports = { grade, NOT_CONFIRMED_FEE };
