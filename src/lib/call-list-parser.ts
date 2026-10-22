/**
 * Parses messy, OCR-sourced "name / phone / remark" text (e.g. pasted from
 * Google Lens on a scanned calling sheet) into structured rows.
 *
 * Real-world input is inconsistent: some rows have a name, some don't; remarks
 * sometimes sit on their own line, sometimes trail the phone number on the same
 * line; serial numbers (70, 71, 86…) are sprinkled in as noise. This is a
 * best-effort heuristic, not a guarantee — the UI that consumes it shows an
 * editable preview so a human can fix the few rows it gets wrong.
 */

export type ParsedCallRow = { name: string; remark: string; phone: string };

// A phone-ish run: starts optionally with +, 9–15 digits total once separators
// (space/hyphen) are stripped. Matches 10-digit Indian mobiles and longer
// international numbers (+966, +971, …) written with or without the +.
const PHONE_RUN = /\+?\d[\d\s-]{7,16}\d/g;

function digitsOf(s: string): string {
  return s.replace(/\D/g, "");
}

function isPhoneLike(digits: string): boolean {
  return digits.length >= 10 && digits.length <= 13;
}

/** A line that's *only* a short number (a serial/index) — discard it entirely. */
function isIndexNoise(line: string): boolean {
  return /^\d{1,3}$/.test(line.trim());
}

/** Strips a leading serial number glued to the next line, e.g. "89 NILAM RAHUL N". */
function stripLeadingIndex(line: string): string {
  return line.replace(/^\d{1,3}\s+(?=\S)/, "").trim();
}

export function parseCallList(raw: string): ParsedCallRow[] {
  const lines = raw
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isIndexNoise(l));

  const rows: ParsedCallRow[] = [];
  let nameBuffer: string[] = [];
  let current: ParsedCallRow | null = null;
  // Once the current record's remark line has been claimed, any further text
  // before the next phone belongs to the *next* record's name, not more remark.
  let remarkClaimed = false;

  const flushName = () => {
    const name = nameBuffer.join(" ").trim();
    nameBuffer = [];
    return name;
  };

  for (const line of lines) {
    const matches = line.match(PHONE_RUN) ?? [];
    const phoneMatch = matches.find((m) => isPhoneLike(digitsOf(m)));

    if (phoneMatch) {
      // Finish the previous record before starting a new one.
      if (current) rows.push(current);

      const idx = line.indexOf(phoneMatch);
      const before = stripLeadingIndex(line.slice(0, idx).trim());
      const after = line.slice(idx + phoneMatch.length).trim();
      if (before) nameBuffer.push(before);

      current = {
        name: flushName(),
        phone: digitsOf(phoneMatch),
        remark: after,
      };
      remarkClaimed = Boolean(after);
    } else if (current && !remarkClaimed) {
      // First text line after a phone (with no inline remark) — claim it.
      current.remark = line;
      remarkClaimed = true;
    } else {
      // Remark already claimed (or no record started yet) — this is the
      // start of the *next* record's name.
      nameBuffer.push(stripLeadingIndex(line));
    }
  }
  if (current) rows.push(current);

  return rows.filter((r) => isPhoneLike(r.phone));
}
