import {
  getDailyWord,
  getIndianDateKey,
  getValidWordSet,
  normalizeGuess,
  scoreGuess,
  WORD_LENGTH
} from "@/lib/drift-game";
import { corsJson, corsOptions } from "@/lib/cors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { guess?: unknown } | null;
  const guess = normalizeGuess(body?.guess);

  if (!/^[A-Z]+$/.test(guess) || guess.length !== WORD_LENGTH) {
    return corsJson(
      {
        error: "Guess must be a 5-letter word."
      },
      { status: 400 }
    );
  }

  if (!getValidWordSet().has(guess)) {
    return corsJson(
      {
        error: "That word is not in the dictionary."
      },
      { status: 422 }
    );
  }

  const answer = getDailyWord();
  const tiles = scoreGuess(guess, answer);
  const solved = guess === answer;

  return corsJson({
    date: getIndianDateKey(),
    solved,
    tiles
  });
}

export function OPTIONS() {
  return corsOptions();
}
