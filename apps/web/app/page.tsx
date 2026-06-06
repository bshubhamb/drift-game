"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api-client";

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

type TileState = "empty" | "locked" | "misplaced" | "drifting" | "cold";

type Tile = {
  letter: string;
  state: TileState;
};

const STATE_LABELS: Record<TileState, string> = {
  empty: "Empty",
  locked: "Locked",
  misplaced: "Misplaced",
  drifting: "Drifting",
  cold: "Cold"
};

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"]
];

function getNeighborLetters(letter: string) {
  const index = letter.charCodeAt(0) - 65;
  const previous = String.fromCharCode(((index + 25) % 26) + 65);
  const next = String.fromCharCode(((index + 1) % 26) + 65);

  return `${previous}/${next}`;
}

export default function Home() {
  const [guess, setGuess] = useState("");
  const [rows, setRows] = useState<Tile[][]>([]);
  const [message, setMessage] = useState("Pick the lock in six words.");
  const [dictionaryCount, setDictionaryCount] = useState<number | null>(null);
  const [gameDate, setGameDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gameWon = rows.some((row) => row.every((tile) => tile.state === "locked"));
  const gameOver = gameWon || rows.length >= MAX_ATTEMPTS;
  const remainingRows = MAX_ATTEMPTS - rows.length;

  async function submitGuess() {
    const normalizedGuess = guess.toUpperCase();

    if (gameOver || isSubmitting) {
      return;
    }

    if (normalizedGuess.length !== WORD_LENGTH) {
      setMessage("Enter a 5-letter word.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl("/api/game/guess"), {
        body: JSON.stringify({ guess: normalizedGuess }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const result = (await response.json()) as { error?: string; solved?: boolean; tiles?: Tile[] };

      if (!response.ok || !result.tiles) {
        setMessage(result.error ?? "Could not check that word.");
        return;
      }

      const nextRows = [...rows, result.tiles];

      setRows(nextRows);
      setGuess("");

      if (result.solved) {
        setMessage("Unlocked. Come back tomorrow for a fresh lock.");
      } else if (nextRows.length === MAX_ATTEMPTS) {
        setMessage("Lock held. A new word arrives at midnight IST.");
      } else {
        setMessage("Use the colors to tune each slot.");
      }
    } catch {
      setMessage("Backend is not reachable right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function addLetter(letter: string) {
    if (gameOver || guess.length >= WORD_LENGTH) {
      return;
    }

    setGuess((currentGuess) => `${currentGuess}${letter}`.slice(0, WORD_LENGTH));
  }

  function deleteLetter() {
    if (gameOver) {
      return;
    }

    setGuess((currentGuess) => currentGuess.slice(0, -1));
  }

  function pressKey(key: string) {
    if (key === "ENTER") {
      submitGuess();
      return;
    }

    if (key === "BACK") {
      deleteLetter();
      return;
    }

    addLetter(key);
  }

  function resetGame() {
    setRows([]);
    setGuess("");
    setMessage("Fresh lock. Six clean attempts.");
  }

  useEffect(() => {
    async function loadToday() {
      try {
        const response = await fetch(apiUrl("/api/game/today"));
        const result = (await response.json()) as { date?: string; dictionaryCount?: number };

        if (response.ok) {
          setDictionaryCount(result.dictionaryCount ?? null);
          setGameDate(result.date ?? "");
        }
      } catch {
        setMessage("Backend is not reachable right now.");
      }
    }

    loadToday();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toUpperCase();

      if (event.repeat) {
        return;
      }

      if (key === "ENTER") {
        event.preventDefault();
        submitGuess();
      } else if (key === "BACKSPACE") {
        event.preventDefault();
        deleteLetter();
      } else if (/^[A-Z]$/.test(key)) {
        event.preventDefault();
        addLetter(key);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const activeGuessRow = Array.from({ length: WORD_LENGTH }, (_, index) => ({
    letter: guess[index] ?? "",
    state: "empty" as TileState
  }));
  const emptyRows = Array.from({ length: gameOver ? remainingRows : remainingRows - 1 }, () =>
    Array.from({ length: WORD_LENGTH }, () => ({ letter: "", state: "empty" as TileState }))
  );
  const boardRows = [
    ...rows,
    ...(gameOver ? [] : [activeGuessRow]),
    ...emptyRows
  ];

  return (
    <main className="shell">
      <section className="game-panel" aria-labelledby="game-title">
        <div className="brand-row">
          <div>
            <p className="eyebrow">The Lockpick Mechanic</p>
            <h1 id="game-title">DRIFT</h1>
          </div>
          <button className="reset-button" onClick={resetGame} type="button">
            Reset
          </button>
          <div className="attempt-meter" aria-label={`${MAX_ATTEMPTS - rows.length} attempts remaining`}>
            {Array.from({ length: MAX_ATTEMPTS }, (_, index) => (
              <span key={index} className={index < rows.length ? "spent" : ""} />
            ))}
          </div>
        </div>

        <div className="board" aria-label="Guess board">
          {boardRows.map((row, rowIndex) => (
            <div className="board-row" key={rowIndex}>
              {row.map((tile, tileIndex) => (
                <div
                  className={`tile ${tile.state}`}
                  key={`${rowIndex}-${tileIndex}`}
                  aria-label={`${tile.letter || "blank"} ${STATE_LABELS[tile.state]}`}
                  title={tile.state === "drifting" ? `${tile.letter} means ${getNeighborLetters(tile.letter)}` : STATE_LABELS[tile.state]}
                >
                  {tile.letter}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="keyboard" aria-label="Keyboard">
          {KEYBOARD_ROWS.map((keyboardRow) => (
            <div className="keyboard-row" key={keyboardRow.join("")}>
              {keyboardRow.map((key) => (
                <button
                  className={key.length > 1 ? "wide-key" : ""}
                  disabled={isSubmitting || (gameOver && key !== "ENTER")}
                  key={key}
                  onClick={() => pressKey(key)}
                  type="button"
                >
                  {key === "BACK" ? "⌫" : key}
                </button>
              ))}
            </div>
          ))}
        </div>

        <p className="status" role="status">
          {message}
        </p>
      </section>

      <aside className="side-panel" aria-label="Drift reference">
        <div className="legend">
          <h2>Signal Key</h2>
          <div><span className="swatch locked" />Locked: right letter, right slot</div>
          <div><span className="swatch misplaced" />Misplaced: letter exists elsewhere</div>
          <div><span className="swatch drifting" />Drifting: one alphabet step from this slot</div>
          <div><span className="swatch cold" />Cold: not useful for this slot</div>
        </div>

        <div className="note">
          <h2>Blue Logic</h2>
          <p>
            A blue tile turns one position into a two-letter lock. Guessing M means the hidden
            letter in that exact slot is L or N, with A and Z wrapping around.
          </p>
        </div>

        <div className="game-meta" aria-label="Daily game metadata">
          <span>Daily word changes at midnight IST.</span>
          {gameDate ? <span>Today: {gameDate}</span> : null}
          {dictionaryCount ? <span>{dictionaryCount.toLocaleString()} valid 5-letter words server-side.</span> : null}
        </div>
      </aside>
    </main>
  );
}
