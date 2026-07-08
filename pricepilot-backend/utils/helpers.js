function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\bminimilist\b/g, 'minimalist')
    .replace(/\bsun screen\b/g, 'sunscreen')
    .replace(/\s+/g, ' ');
}

function slugifyPlatform(value) {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

module.exports = {
  normalizeText,
  slugifyPlatform,
  safeNumber
};
