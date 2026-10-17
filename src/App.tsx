import { useEffect, useMemo, useState } from "react";
import type { Entry } from "./domain/petLog.ts";
import { addEntry, exportEntries, getUpcomingReminders, removeEntry, restoreEntry } from "./domain/petLog.ts";
import { loadEntries, saveEntries, type StorageLike } from "./storage.ts";
import { EntryForm } from "./components/EntryForm.tsx";
import { EntryList } from "./components/EntryList.tsx";

function localDateToday(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function App() {
  const [initial] = useState(() => {
    const storage = browserStorage();
    return { storage, result: loadEntries(storage) };
  });
  const [entries, setEntries] = useState<Entry[]>(initial.result.entries);
  const [canSave, setCanSave] = useState(initial.result.status === "ready");
  const [storageMessage, setStorageMessage] = useState<string | null>(initial.result.message);
  const [lastDeleted, setLastDeleted] = useState<Entry | null>(null);
  const [today] = useState(localDateToday);

  useEffect(() => {
    if (!canSave || !initial.storage) return;
    try {
      saveEntries(initial.storage, entries);
      setStorageMessage(null);
    } catch {
      setStorageMessage("This browser could not save the latest change. You can still download a JSON backup.");
    }
  }, [canSave, entries, initial.storage]);

  useEffect(() => {
    if (!lastDeleted) return;
    const timeout = window.setTimeout(() => setLastDeleted(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [lastDeleted]);

  const reminders = useMemo(() => getUpcomingReminders(entries, today), [entries, today]);
  const orderedEntries = useMemo(
    () => entries.slice().sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id)),
    [entries],
  );
  const needsFreshStart = initial.result.status === "corrupt" && !canSave;

  function handleAdd(entry: Entry) {
    setEntries((current) => addEntry(current, entry));
  }

  function handleDelete(id: string) {
    const result = removeEntry(entries, id);
    if (!result.deleted) return;
    setEntries(result.entries);
    setLastDeleted(result.deleted);
  }

  function handleUndo() {
    if (!lastDeleted) return;
    setEntries((current) => restoreEntry(current, lastDeleted));
    setLastDeleted(null);
  }

  function startFreshNotebook() {
    setEntries([]);
    setStorageMessage(null);
    setCanSave(true);
  }

  function downloadBackup() {
    const file = new Blob([exportEntries(entries)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pati-log-backup.json";
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Pati Log home">
          <span className="wordmark-mark" aria-hidden="true">p</span>
          <span>pati<span className="wordmark-divider">/</span>log</span>
        </a>
        <span className="topbar-note">A notebook for everyday care</span>
      </header>

      <main id="top">
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">PET CARE, WRITTEN DOWN</p>
          <h1 id="page-title">The little things,<br />kept in one place.</h1>
          <p className="intro-copy">A simple log for weight checks, care routines, and notes you want to remember.</p>
        </section>

        {storageMessage && (
          <div className={`storage-notice ${needsFreshStart ? "storage-notice-warning" : ""}`} role={needsFreshStart ? "alert" : "status"}>
            <p>{storageMessage}</p>
            {needsFreshStart && (
              <button className="text-button" type="button" onClick={startFreshNotebook}>
                Start a fresh notebook
              </button>
            )}
          </div>
        )}

        <div className="workspace-grid">
          <section className="form-panel" aria-labelledby="new-entry-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MAKE A NOTE</p>
                <h2 id="new-entry-heading">New entry</h2>
              </div>
              <span className="heading-mark" aria-hidden="true">+</span>
            </div>
            <EntryForm onAdd={handleAdd} disabled={needsFreshStart} />
          </section>

          <section className="notebook-panel" aria-label="Pet care notebook">
            <div className="notebook-toolbar">
              <div>
                <p className="eyebrow">YOUR NOTES</p>
                <h2>Notebook <span className="entry-count">{entries.length}</span></h2>
              </div>
              <button className="export-button" type="button" onClick={downloadBackup}>
                <span aria-hidden="true">↧</span> Export JSON
              </button>
            </div>
            <EntryList
              entries={orderedEntries}
              reminders={reminders}
              deletedEntry={lastDeleted}
              onDelete={handleDelete}
              onUndo={handleUndo}
            />
          </section>
        </div>
      </main>

      <footer className="page-footer">
        <span className="footer-dot" aria-hidden="true"></span>
        <p>Saved in this browser. Export a JSON copy if you want to keep it elsewhere.</p>
      </footer>
    </div>
  );
}
