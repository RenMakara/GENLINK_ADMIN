/** Checks text and UI token contrast against WCAG thresholds. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'app', 'globals.css'), 'utf8');

/** Pairs that render text on a surface. Anything here must reach 4.5:1. */
const TEXT_PAIRS = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
  ['warning-foreground', 'warning'],
  ['success-foreground', 'success'],
  ['sidebar-foreground', 'sidebar'],
  ['sidebar-primary-foreground', 'sidebar-primary'],
  ['sidebar-accent-foreground', 'sidebar-accent'],
  // Muted text is still text. It is the pair most often waved through, and the one most
  // often below AA.
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'muted'],
];

/** Checks 3:1 contrast for control boundaries and focus indicators. */
const UI_PAIRS = [
  // `--input` draws the edge of a text field. Without it there is nothing else marking where
  // the control is, so it has to be findable.
  ['input', 'background'],
  ['input', 'card'],
  // Focus indicator. Required by 1.4.11 and 2.4.11 both.
  ['ring', 'background'],
  ['ring', 'card'],
];

/** Reports decorative border contrast without enforcing a threshold. */
const INFORMATIONAL_PAIRS = [
  ['border', 'background'],
  ['border', 'card'],
];

const AA_TEXT = 4.5;
const AA_UI = 3.0;

function parseBlock(selector) {
  const match = css.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'));
  if (!match) throw new Error(`Could not find the ${selector} block in globals.css`);
  const tokens = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/);
    if (m) tokens[m[1]] = m[2];
  }
  return tokens;
}

function toRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

/** WCAG relative luminance. */
function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const themes = { light: parseBlock(':root'), dark: parseBlock('\\.dark') };

let failures = 0;
let checked = 0;

for (const [themeName, tokens] of Object.entries(themes)) {
  console.log(`\n${themeName}`);
  for (const [group, pairs, threshold] of [
    ['text', TEXT_PAIRS, AA_TEXT],
    ['ui', UI_PAIRS, AA_UI],
    ['decorative', INFORMATIONAL_PAIRS, 0],
  ]) {
    for (const [fg, bg] of pairs) {
      // The dark block only overrides what changes; fall back to :root otherwise.
      const fgHex = tokens[fg] ?? themes.light[fg];
      const bgHex = tokens[bg] ?? themes.light[bg];
      if (!fgHex || !bgHex) {
        console.log(`  SKIP  ${fg} on ${bg} (not defined as hex)`);
        continue;
      }
      checked++;
      const r = ratio(fgHex, bgHex);
      const enforced = threshold > 0;
      const ok = r >= threshold;
      if (enforced && !ok) failures++;
      const label = !enforced ? 'INFO' : ok ? 'PASS' : 'FAIL';
      const min = enforced ? `(min ${threshold})` : '(not enforced)';
      console.log(
        `  ${label}  ${r.toFixed(2)}:1  ${min}  ` +
          `${fg} ${fgHex} on ${bg} ${bgHex}  [${group}]`,
      );
    }
  }
}

console.log(`\n${checked} pairs checked, ${failures} below threshold`);

if (failures > 0) {
  console.error(
    '\nContrast check FAILED. SSOT §11.8 requires 4.5:1 for text.\n' +
      'Darken the foreground or lighten the surface - do not lower the threshold.',
  );
  process.exit(1);
}
console.log('Contrast check passed (WCAG 2.1 AA).');
