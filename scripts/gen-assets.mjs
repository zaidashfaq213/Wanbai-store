// One-shot asset generator: brand product tiles, partner glyphs, logo, favicon.
// Run: node scripts/gen-assets.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import * as si from "simple-icons";

const ROOT = new URL("..", import.meta.url).pathname;
const icons = Object.keys(si).map((k) => si[k]).filter((o) => o && o.slug);
const byTitle = (t) => icons.find((o) => o.title.toLowerCase() === t.toLowerCase());

function iconPath(title) {
  const o = byTitle(title);
  if (!o) throw new Error(`simple-icon not found: ${title}`);
  return o.path;
}

// White brand glyph from a simple-icons 24px path, centered on a 256 tile.
function glyph(title, color = "#ffffff") {
  const scale = 5.6;
  const off = (256 - 24 * scale) / 2;
  return `<g transform="translate(${off.toFixed(1)},${off.toFixed(
    1,
  )}) scale(${scale})" fill="${color}"><path d="${iconPath(title)}"/></g>`;
}

// A multi-line wordmark centered on the 256 tile.
function wordmark(words, color = "#ffffff") {
  const maxLen = Math.max(...words.map((w) => w.length));
  let fs = Math.floor(380 / maxLen);
  fs = Math.max(34, Math.min(76, fs));
  const lineH = fs * 1.04;
  const totalH = lineH * words.length;
  const startY = 128 - totalH / 2 + fs * 0.76;
  return words
    .map(
      (w, i) =>
        `<text x="128" y="${Math.round(
          startY + i * lineH,
        )}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" letter-spacing="0.5" fill="${color}" font-size="${fs}">${w}</text>`,
    )
    .join("");
}

// Hand-drawn white emblems for brands not in simple-icons.
const emblems = {
  windows: `<g fill="#fff"><rect x="74" y="74" width="48" height="48" rx="4"/><rect x="134" y="74" width="48" height="48" rx="4"/><rect x="74" y="134" width="48" height="48" rx="4"/><rect x="134" y="134" width="48" height="48" rx="4"/></g>`,
  receipt: `<g fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><path d="M86 70h84v116l-16-10-14 10-14-10-14 10-16-10z"/><path d="M104 100h48M104 124h48M104 148h30"/></g>`,
  amazon: `<g><text x="128" y="120" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" fill="#fff" font-size="50">amazon</text><path d="M86 150c26 18 60 18 86 0" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/><path d="M168 150l8 2-4 8z" fill="#fff"/></g>`,
  eightball: `<g><circle cx="128" cy="128" r="62" fill="#161616"/><circle cx="106" cy="106" r="16" fill="#ffffff" opacity="0.85"/><circle cx="128" cy="134" r="30" fill="#ffffff"/><text x="128" y="148" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="40" fill="#111">8</text></g>`,
};

function emblem(key) {
  return emblems[key];
}

function tile(slug, c1, c2, inner) {
  const svg = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.25"/><stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
</defs>
<rect width="256" height="256" rx="58" fill="url(#g)"/>
<circle cx="206" cy="44" r="96" fill="#ffffff" opacity="0.08"/>
<rect width="256" height="256" rx="58" fill="url(#s)"/>
${inner}
</svg>`;
  mkdirSync(`${ROOT}public/products`, { recursive: true });
  writeFileSync(`${ROOT}public/products/${slug}.svg`, svg);
}

// slug, color1, color2, render
const products = [
  ["free-fire", "#FF9D00", "#FF2D00", wordmark(["FREE", "FIRE"])],
  ["pubg-mobile", "#3A3A3A", "#0D0D0D", glyph("PUBG")],
  ["efootball", "#00C2A8", "#0047FF", wordmark(["eFootball"])],
  ["call-of-duty", "#3D3D3D", "#000000", wordmark(["CALL OF", "DUTY"])],
  ["mobile-legends", "#2D7DF6", "#0A2A66", wordmark(["MOBILE", "LEGENDS"])],
  ["genshin-impact", "#58C5F2", "#2B6CB0", wordmark(["Genshin"])],
  ["clash-of-clans", "#F2A93B", "#C2410C", wordmark(["CLASH OF", "CLANS"])],
  ["blood-strike", "#E11D2A", "#1A1A1A", wordmark(["BLOOD", "STRIKE"])],
  ["brawl-stars", "#FFB300", "#FF6F00", wordmark(["BRAWL", "STARS"])],
  ["8-ball-pool", "#16A34A", "#0B5E2E", emblem("eightball")],
  ["pubg-new-state", "#2B2B2B", "#0D0D0D", wordmark(["PUBG", "NEW STATE"])],
  ["jawaker", "#C0392B", "#7B241C", wordmark(["JAWAKER"])],
  ["steam", "#2A475E", "#16202D", glyph("Steam")],
  ["roblox", "#3B3F45", "#16181C", glyph("Roblox")],
  ["playstation", "#0070D1", "#003791", glyph("PlayStation")],
  ["xbox", "#107C10", "#0A4F0A", wordmark(["XBOX"])],
  ["razer-gold", "#0B7A00", "#053D00", glyph("Razer")],
  ["yalla-ludo", "#FF7A00", "#E10000", wordmark(["YALLA", "LUDO"])],
  ["bill-payment", "#16A34A", "#0A6E3A", emblem("receipt")],
  ["starlink", "#1F2937", "#0B1220", wordmark(["STARLINK"])],
  ["tiktok-coins", "#25303A", "#0B0F14", glyph("TikTok")],
  ["x-twitter", "#1A1A1A", "#000000", glyph("X")],
  ["facebook", "#1877F2", "#0A4DBE", glyph("Facebook")],
  ["snapchat", "#FFFC00", "#FFE600", glyph("Snapchat")],
  ["instagram", "#F77737", "#C13584", glyph("Instagram")],
  ["youtube", "#FF0000", "#C4302B", glyph("YouTube")],
  ["office-365", "#EB3C00", "#D83B01", wordmark(["Office", "365"])],
  ["windows-11", "#0078D4", "#00A4EF", emblem("windows")],
  ["windows-10", "#00A4EF", "#0050A0", emblem("windows")],
  ["itunes", "#EA4CC0", "#A24BFF", glyph("iTunes")],
  ["amazon", "#FF9900", "#FF6A00", emblem("amazon")],
  ["noon", "#FFE100", "#F5C400", wordmark(["noon"], "#262673")],
  ["nintendo", "#E60012", "#B3000E", wordmark(["Nintendo"])],
  ["vodafone", "#E60000", "#A30000", glyph("Vodafone")],
  ["orange", "#FF7900", "#E66E00", glyph("Orange")],
  ["zain", "#8CC63F", "#00A99D", wordmark(["zain"])],
  ["etisalat", "#E2001A", "#B00015", wordmark(["e&"])],
  ["netflix", "#E50914", "#7A0009", glyph("Netflix")],
  ["spotify", "#1ED760", "#11823B", glyph("Spotify")],
  ["shahid-vip", "#6D28D9", "#9B27D6", wordmark(["shahid", "VIP"])],
  ["nordvpn", "#4687FF", "#2A5FD0", glyph("NordVPN")],
];

for (const [slug, c1, c2, inner] of products) tile(slug, c1, c2, inner);
console.log(`✓ ${products.length} product tiles`);

// ---- Partner glyphs: brand color on transparent (shown on white chips) ----
function partnerIcon(title, hex) {
  const scale = 30 / 24;
  const x = (120 - 30) / 2;
  const y = (44 - 30) / 2;
  return `<g transform="translate(${x},${y}) scale(${scale})" fill="${hex}"><path d="${iconPath(
    title,
  )}"/></g>`;
}
function partnerWord(word, hex) {
  const fs = Math.max(16, Math.min(24, Math.floor(300 / word.length)));
  return `<text x="60" y="29" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" fill="${hex}" font-size="${fs}">${word}</text>`;
}
function partner(slug, inner) {
  const svg = `<svg width="120" height="44" viewBox="0 0 120 44" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  mkdirSync(`${ROOT}public/brands`, { recursive: true });
  writeFileSync(`${ROOT}public/brands/${slug}.svg`, svg);
}

const partners = [
  ["garena", partnerWord("Garena", "#EE3124")],
  ["pubg", partnerIcon("PUBG", "#C9A227")],
  ["supercell", partnerWord("Supercell", "#111827")],
  ["steam", partnerIcon("Steam", "#1B2838")],
  ["roblox", partnerIcon("Roblox", "#111827")],
  ["xbox", partnerWord("XBOX", "#107C10")],
  ["playstation", partnerIcon("PlayStation", "#003791")],
  ["itunes", partnerIcon("iTunes", "#C026D3")],
  ["netflix", partnerIcon("Netflix", "#E50914")],
  ["spotify", partnerIcon("Spotify", "#1DB954")],
  ["razer", partnerIcon("Razer", "#00A000")],
  ["konami", partnerWord("KONAMI", "#C8102E")],
  ["nintendo", partnerWord("Nintendo", "#E60012")],
];
for (const [slug, inner] of partners) partner(slug, inner);
console.log(`✓ ${partners.length} partner glyphs`);

// ---- 3D logo + favicon ----
function hexLerp(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

function buildLogo() {
  const W = "M15 19 L24 45 L32 31 L40 45 L49 19"; // W centerline
  const dx = 0.55;
  const dy = 0.7;
  const steps = 12;
  // Extruded side faces: dark brand shades stepping toward the viewer.
  let depth = "";
  for (let i = steps; i >= 1; i--) {
    const col = hexLerp("#2a0a52", "#5b1690", 1 - i / steps);
    depth += `<path d="${W}" fill="none" stroke="${col}" stroke-width="8.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(${(
      i * dx
    ).toFixed(2)},${(i * dy).toFixed(2)})"/>`;
  }
  return `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4c1d95"/><stop offset="0.5" stop-color="#86198f"/><stop offset="1" stop-color="#9d174d"/></linearGradient>
<linearGradient id="wface" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset="0.45" stop-color="#a855f7"/><stop offset="1" stop-color="#ec4899"/></linearGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/><stop offset="0.45" stop-color="#ffffff" stop-opacity="0.05"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
<filter id="soft" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter>
</defs>
<rect width="64" height="64" rx="17" fill="url(#bg)"/>
<ellipse cx="20" cy="10" rx="40" ry="20" fill="url(#sheen)"/>
<g opacity="0.45" filter="url(#soft)"><path d="${W}" fill="none" stroke="#1a0533" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" transform="translate(3,4)"/></g>
${depth}
<path d="${W}" fill="none" stroke="url(#wface)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${W}" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(-0.7,-1)"/>
<circle cx="50.5" cy="15.5" r="4.6" fill="#fde047"/>
<circle cx="49" cy="14" r="1.5" fill="#ffffff" opacity="0.85"/>
</svg>`;
}

const iconSvg = buildLogo();
writeFileSync(`${ROOT}app/icon.svg`, iconSvg);
mkdirSync(`${ROOT}public`, { recursive: true });
writeFileSync(`${ROOT}public/logo.svg`, iconSvg);
console.log("✓ 3D app/icon.svg + public/logo.svg");
