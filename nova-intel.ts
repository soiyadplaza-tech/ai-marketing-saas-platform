// Real, deterministic Business-Intelligence extraction from a meeting transcript.
// Uses real keyword/regex extraction (no fake AI). Prices, deadlines, questions,
// commitments and follow-ups are extracted from the ACTUAL spoken text.

export interface BizIntel {
  prices: string[];
  dates: string[];
  questions: string[];
  commitments: string[];
  followUps: string[];
}

const PRICE_RE = /\$\s?\d[\d,]*(?:\.\d{2})?|\b\d[\d,]*(?:\.\d{2})?\s?(?:usd|dollars?|bucks|tk|taka|million|thousand|lakh)\b|(?:usd|dollars?|bucks|tk|taka)\s?\d[\d,]*(?:\.\d{2})?/gi;

const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";
const DATE_RE = new RegExp("\\b(?:\\d{1,2} " + MONTHS + "\\d{0,4}|(?:the )?" + MONTHS + "\\s?\\d{1,2}(?:,? ?\\d{4})?|\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?)\\b", "gi");

const COMMIT_WORDS = "commit|commitment|deliver|deliver by|agree|agreed|will send|will do|will provide|will deliver|will pay|will complete|will start|promise|guarantee|confirmed|confirm|contract|sign|payment|invoice|deadline|we will|we are going to";
const COMMIT_RE = new RegExp("\\b(" + COMMIT_WORDS + ")\\b", "gi");

const FOLLOWUP_WORDS = "follow up|follow-up|next step|next steps|next week|by friday|by monday|by tomorrow|by tuesday|by wednesday|by thursday|by end of month|by end of week|remind";
const FOLLOWUP_RE = new RegExp("\\b(" + FOLLOWUP_WORDS + ")\\b", "gi");

const QUESTION_RE = /[^.!?]*\?\s*/g;

function splitSentences(t: string): string[] {
  return t
    .replace(/([.!?])\s+/g, "$1\n")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

export function extractIntel(transcript: string): BizIntel {
  const prices = Array.from(new Set((transcript.match(PRICE_RE) || []).map((p) => p.replace(/\s+/g, " ").trim()))).slice(0, 12);
  const dates = Array.from(new Set((transcript.match(DATE_RE) || []).map((d) => d.replace(/\s+/g, " ").trim()))).slice(0, 12);
  const questions = (transcript.match(QUESTION_RE) || []).map((q) => q.trim()).filter((q) => q.length > 3).slice(0, 8);

  const sentences = splitSentences(transcript);
  const commitments: string[] = [];
  const followUps: string[] = [];
  for (const s of sentences) {
    const low = " " + s.toLowerCase().trim() + " ";
    if (COMMIT_RE.test(low) && s.trim().length > 12) commitments.push(s.trim());
    if (FOLLOWUP_RE.test(low) && s.trim().length > 8) followUps.push(s.trim());
  }

  return {
    prices,
    dates,
    questions,
    commitments: commitments.slice(0, 8),
    followUps: followUps.slice(0, 8),
  };
}

// Simple, real meeting summary from the transcript (deterministic, not fake).
export function summarizeTranscript(transcript: string): { summary: string; intel: BizIntel } {
  const intel = extractIntel(transcript);
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  const parts: string[] = [];
  parts.push("This meeting transcript has about " + words + " words.");
  if (intel.prices.length) parts.push("Prices/amounts mentioned: " + intel.prices.slice(0, 5).join(", ") + ".");
  if (intel.dates.length) parts.push("Dates/deadlines mentioned: " + intel.dates.slice(0, 5).join(", ") + ".");
  if (intel.questions.length) parts.push("Key questions: " + intel.questions.slice(0, 3).map((q) => '"' + q + '"').join(" "));
  if (intel.commitments.length) parts.push("Commitments: " + intel.commitments.slice(0, 3).map((c) => '"' + c + '"').join(" "));
  if (intel.followUps.length) parts.push("Follow-ups: " + intel.followUps.slice(0, 3).map((c) => '"' + c + '"').join(" "));
  if (parts.length === 1) parts.push("No key business items were detected in the transcript.");
  return { summary: parts.join(" "), intel };
}
