import { useState, type FormEvent } from "react";
import type { Entry, EntryKind } from "../domain/petLog.ts";

interface EntryFormProps {
  onAdd: (entry: Entry) => void;
  disabled?: boolean;
}

function localDateToday(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function EntryForm({ onAdd, disabled = false }: EntryFormProps) {
  const [kind, setKind] = useState<EntryKind>("note");
  const [date, setDate] = useState(localDateToday);
  const [note, setNote] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const entry: Entry = {
      id: crypto.randomUUID(),
      kind,
      date,
      note: note.trim(),
      ...(kind === "weight" ? { weightKg: Number(weightKg) } : {}),
      ...(reminderDate ? { reminderDate } : {}),
    };

    try {
      onAdd(entry);
      setNote("");
      setReminderDate("");
      setWeightKg("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That entry could not be saved.");
    }
  }

  return (
    <form className="entry-form" aria-label="Add an entry" onSubmit={submit}>
      <fieldset disabled={disabled}>
        <legend className="visually-hidden">Entry details</legend>

        <div className="field-row">
          <div className="field">
            <label htmlFor="entry-kind">Type</label>
            <select
              id="entry-kind"
              name="kind"
              value={kind}
              onChange={(event) => {
                const nextKind = event.target.value as EntryKind;
                setKind(nextKind);
                if (nextKind !== "weight") setWeightKg("");
              }}
            >
              <option value="note">Note</option>
              <option value="care">Care routine</option>
              <option value="weight">Weight</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="entry-date">Date</label>
            <input id="entry-date" name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </div>
        </div>

        {kind === "weight" && (
          <div className="field">
            <label htmlFor="entry-weight">Weight in kg</label>
            <input
              id="entry-weight"
              name="weightKg"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="e.g. 4.25"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              required
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="entry-note">Note</label>
          <textarea
            id="entry-note"
            name="note"
            rows={3}
            maxLength={1000}
            placeholder={kind === "care" ? "What did you take care of?" : "Anything you want to remember?"}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="entry-reminder-date">Reminder date <span className="optional-label">optional</span></label>
          <input
            id="entry-reminder-date"
            name="reminderDate"
            type="date"
            value={reminderDate}
            onChange={(event) => setReminderDate(event.target.value)}
          />
          <span className="field-help">Shown in the next 30 days list when the date comes up.</span>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="save-button" type="submit">
          Save entry <span aria-hidden="true">→</span>
        </button>
      </fieldset>
    </form>
  );
}
