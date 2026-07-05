"use client";

import { useRef, useState } from "react";

/**
 * Drag-and-drop (or click-to-browse) target for CSV files. Reads the file in
 * the browser and hands the text to the caller — the shared pattern for
 * "update this data by dropping a Robinhood export on it".
 */
export function CsvDropZone({
  onFileText,
  hint,
}: {
  onFileText: (text: string, fileName: string) => void;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFile = (file: File | undefined | null) => {
    setError(null);
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && !file.type.includes("csv") && !file.type.startsWith("text/")) {
      setError("That doesn't look like a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onFileText(String(reader.result ?? ""), file.name);
    reader.onerror = () => setError("Couldn't read that file — try again.");
    reader.readAsText(file);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          readFile(e.dataTransfer.files?.[0]);
        }}
        className={
          "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-sm transition-colors " +
          (dragging
            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
            : "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-900")
        }
      >
        <span aria-hidden>⬆</span>
        {hint}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          readFile(e.target.files?.[0]);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
