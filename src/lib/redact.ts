/**
 * Finds contact details in free text (Blueprint sections 04 and 09): phone numbers, emails, URLs and social handles,
 * including digits spelled out as words. The API is the source of truth and redacts on save; the web app uses this
 * to warn landlords before they submit, so a listing isn't sent back for changes.
 */

const DIGIT_WORDS = ['zero', 'oh', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const DIGIT_WORD = `(?:${DIGIT_WORDS.join('|')})`;

const PATTERNS: { kind: ContactKind; re: RegExp }[] = [
  { kind: 'email', re: /[A-Z0-9._%+-]+\s*(?:@|\(at\)|\[at\])\s*[A-Z0-9.-]+\s*(?:\.|\(dot\)|\[dot\])\s*[A-Z]{2,}/gi },
  { kind: 'url', re: /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|ng|net|org|io|co)(?:\/\S*)?\b/gi },
  { kind: 'handle', re: /(?:^|\s)@[a-z0-9_.]{3,}|\b(?:whatsapp|instagram|telegram|ig|wa\.me)\b/gi },
  // 7+ digits, allowing spaces, dots, dashes and brackets between them, with an optional +country code.
  { kind: 'phone', re: /(?:\+?\d[\s().-]*){7,}/g },
  // Four or more digit words in a row: "zero eight zero three ..."
  { kind: 'phone', re: new RegExp(`\\b${DIGIT_WORD}(?:[\\s,-]+${DIGIT_WORD}){3,}\\b`, 'gi') },
];

export type ContactKind = 'phone' | 'email' | 'url' | 'handle';

export interface ContactMatch {
  kind: ContactKind;
  text: string;
}

export function findContactDetails(text: string): ContactMatch[] {
  const found: ContactMatch[] = [];
  for (const { kind, re } of PATTERNS) {
    for (const m of text.matchAll(re)) found.push({ kind, text: m[0].trim() });
  }
  return found;
}

export function redactContactDetails(text: string): string {
  return PATTERNS.reduce((out, { re }) => out.replace(re, (m) => (m.startsWith(' ') ? ' ' : '') + '[hidden]'), text);
}
