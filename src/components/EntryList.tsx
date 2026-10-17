import type { Entry } from "../domain/petLog.ts";
import { deleteEntryLabel } from "./entryLabels.ts";

interface EntryListProps {
  entries: Entry[];
  reminders: Entry[];
  deletedEntry: Entry | null;
  onDelete: (id: string) => void;
  onUndo: () => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeZone: "UTC",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T12:00:00.000Z`));
}

function kindLabel(entry: Entry): string {
  if (entry.kind === "weight") return "WEIGHT";
  if (entry.kind === "care") return "CARE";
  return "NOTE";
}

export function EntryList({ entries, reminders, deletedEntry, onDelete, onUndo }: EntryListProps) {
  return (
    <>
      <section className="reminder-box" aria-labelledby="reminders-heading">
        <div className="reminder-heading">
          <div>
            <p className="eyebrow">COMING UP</p>
            <h3 id="reminders-heading">Dates to remember</h3>
          </div>
          <span className="calendar-mark" aria-hidden="true">▦</span>
        </div>
        {reminders.length === 0 ? (
          <p className="empty-reminders">No reminders in the next 30 days.</p>
        ) : (
          <ul className="reminder-list" aria-label="Upcoming reminders">
            {reminders.map((entry) => (
              <li className="reminder-item" key={`reminder-${entry.id}`}>
                <time dateTime={entry.reminderDate}>{formatDate(entry.reminderDate ?? entry.date)}</time>
                <span>{entry.note}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {deletedEntry && (
        <div className="undo-notice" role="status">
          <span>Entry removed.</span>
          <button className="text-button" type="button" onClick={onUndo}>Undo</button>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="empty-notebook">
          <span className="empty-stamp" aria-hidden="true">p</span>
          <h3>Nothing here yet.</h3>
          <p>Weight checks, care routines, and small notes will show up here.</p>
        </div>
      ) : (
        <ul className="entry-list" aria-label="Notebook entries">
          {entries.map((entry, index) => (
            <li className="entry-card" key={entry.id}>
              <div className="entry-card-top">
                <span className={`entry-kind entry-kind-${entry.kind}`}>{kindLabel(entry)}</span>
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                <button
                  className="remove-button"
                  type="button"
                  aria-label={deleteEntryLabel(entry, index, entries.length)}
                  onClick={() => onDelete(entry.id)}
                >
                  Remove
                </button>
              </div>
              <p className="entry-note">{entry.note}</p>
              {entry.kind === "weight" && entry.weightKg !== undefined && (
                <p className="entry-weight">{entry.weightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
