import { getIndianDateKey, getValidWords, MAX_ATTEMPTS, TIME_ZONE, WORD_LENGTH } from "@/lib/drift-game";
import { corsJson, corsOptions } from "@/lib/cors";

export const runtime = "nodejs";

export function GET() {
  return corsJson({
    date: getIndianDateKey(),
    dictionaryCount: getValidWords().length,
    maxAttempts: MAX_ATTEMPTS,
    timeZone: TIME_ZONE,
    wordLength: WORD_LENGTH
  });
}

export function OPTIONS() {
  return corsOptions();
}
