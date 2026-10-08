// Turns a seller's pasted listing text (emoji, bullets, shouting) into a tidy
// structure: a short intro plus a checklist of features. Nothing is rewritten,
// only cleaned: emoji and bullet marks are removed and duplicates dropped.

const EMOJI = new RegExp("(?:[\\p{Extended_Pictographic}\\p{Regional_Indicator}]|\\uFE0F|\\u200D|\\u20E3)", "gu");
const BULLET = /^\s*(?:[•·▪◦●○■□✓✔→>*-]|\d+[.)])\s*/u;

function sentenceCase(s) {
  // ALL CAPS shouting → normal sentence case; mixed case is left alone.
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (letters.length > 6 && letters === letters.toUpperCase()) {
    const t = s.toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  return s;
}

function clean(line) {
  return sentenceCase(line.replace(EMOJI, "").replace(/\s+/g, " ").trim().replace(/^[-–—:]+\s*/, ""));
}

export function parseAbout(...texts) {
  const seen = new Set();
  const intro = [];
  const features = [];
  for (const text of texts) {
    if (!text) continue;
    for (const raw of String(text).split(/\r?\n/)) {
      const noEmoji = raw.replace(EMOJI, "");
      const isBullet = BULLET.test(noEmoji);
      const line = clean(noEmoji.replace(BULLET, ""));
      if (line.length < 2) continue;
      const key = line.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (isBullet && line.length <= 80) features.push(line);
      else intro.push(line);
    }
  }
  return { intro, features };
}
