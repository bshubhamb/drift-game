import crypto from "node:crypto";
import fs from "node:fs";
import wordListPath from "word-list";

export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;
export const TIME_ZONE = "Asia/Kolkata";

export type TileState = "locked" | "misplaced" | "drifting" | "cold";

export type Tile = {
  letter: string;
  state: TileState;
};

let cachedWords: string[] | undefined;
let cachedWordSet: Set<string> | undefined;

function loadWords() {
  if (!cachedWords) {
    cachedWords = fs
      .readFileSync(wordListPath, "utf8")
      .split(/\r?\n/)
      .map((word) => word.trim().toUpperCase())
      .filter((word) => /^[A-Z]{5}$/.test(word));
  }

  return cachedWords;
}

export function getValidWords() {
  return loadWords();
}

export function getValidWordSet() {
  if (!cachedWordSet) {
    cachedWordSet = new Set(getValidWords());
  }

  return cachedWordSet;
}

export function getIndianDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: TIME_ZONE,
    year: "numeric"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function getDailyWordIndex(dateKey: string, wordCount: number) {
  const hash = crypto.createHash("sha256").update(`drift:${dateKey}`).digest();
  const value = hash.readUInt32BE(0);

  return value % wordCount;
}

export function getDailyWord(date = new Date()) {
  const dateKey = getIndianDateKey(date);
  const words = getValidWords();

  return words[getDailyWordIndex(dateKey, words.length)];
}

function isAlphabetNeighbor(guess: string, target: string) {
  const guessIndex = guess.charCodeAt(0) - 65;
  const targetIndex = target.charCodeAt(0) - 65;
  const forward = (guessIndex + 1) % 26;
  const backward = (guessIndex + 25) % 26;

  return targetIndex === forward || targetIndex === backward;
}

export function scoreGuess(guess: string, secret: string): Tile[] {
  return guess.split("").map((letter, index) => {
    const target = secret[index];

    if (letter === target) {
      return { letter, state: "locked" };
    }

    if (secret.includes(letter)) {
      return { letter, state: "misplaced" };
    }

    if (isAlphabetNeighbor(letter, target)) {
      return { letter, state: "drifting" };
    }

    return { letter, state: "cold" };
  });
}

export function normalizeGuess(guess: unknown) {
  if (typeof guess !== "string") {
    return "";
  }

  return guess.trim().toUpperCase();
}
