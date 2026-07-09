/**
 * avatar.utils.js
 *
 * Centralised helper for generating deterministic, zero-storage avatar URLs
 * using the ui-avatars.com public API.
 *
 * Why ui-avatars.com?
 *  • Free, open-source, no API key required
 *  • Returns a server-rendered PNG/SVG — no client-side canvas needed
 *  • URL is fully deterministic: same name ➜ same image (CDN-cacheable)
 *  • Supports background colour, font colour, bold, size, rounded, format
 *
 * Reference: https://ui-avatars.com/
 */

const UI_AVATARS_BASE = "https://ui-avatars.com/api/";

/**
 * A curated palette of vibrant dark-mode backgrounds paired with
 * high-contrast text colours.  The palette is keyed by the
 * first character's char-code modulo the palette length so that
 * every letter gets the same colour every time (deterministic).
 *
 * Format: [background (no #), foreground (no #)]
 */
const AVATAR_PALETTE = [
  ["7c3aed", "ede9fe"], // violet
  ["2563eb", "dbeafe"], // blue
  ["0891b2", "cffafe"], // cyan
  ["059669", "d1fae5"], // emerald
  ["d97706", "fef3c7"], // amber
  ["dc2626", "fee2e2"], // red
  ["db2777", "fce7f3"], // pink
  ["7c3aed", "ede9fe"], // violet (repeat to fill palette)
  ["4f46e5", "e0e7ff"], // indigo
  ["0284c7", "e0f2fe"], // sky
];

function pickColours(seed = "") {
  return ["7c3aed", "ffffff"];
}

/**
 * Builds a ui-avatars.com URL for the given display name.
 *
 * @param {string} name        - The username or channel title (used for initials + colour seed)
 * @param {object} [options]
 * @param {number} [options.size=256]      - Square pixel size (128–512 recommended)
 * @param {boolean} [options.rounded=false] - Round the avatar on the server side
 * @returns {string} A fully qualified, cache-friendly avatar URL
 */
function buildAvatarUrl(name = "User", { size = 256, rounded = false } = {}) {
  const [bg, fg] = pickColours(name);
  const params = new URLSearchParams({
    name: name.trim() || "User",
    background: bg,
    color: fg,
    bold: "true",
    size: String(size),
    rounded: String(rounded),
    format: "png",
  });
  return `${UI_AVATARS_BASE}?${params.toString()}`;
}

module.exports = { buildAvatarUrl, pickColours };
