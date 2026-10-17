# Pati Log

A small browser notebook for weight entries, care routines, and the notes you want to keep. It needs no account or server: entries are saved in the current browser profile.

## Run it

You’ll need Node.js 22.12 or later and npm.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. To run the checks:

```sh
npm test
npm run typecheck
npm run build
```

## Using the notebook

Choose **Note**, **Care routine**, or **Weight**, add a date and a short note, then save it. Weight entries also take a positive value in kilograms. An optional reminder date appears in the “Dates to remember” list when it falls within the next 30 days; the app does not send notifications. Removed entries can be restored with **Undo** for a few seconds.

**Export JSON** downloads `pati-log-backup.json`. The file contains a versioned copy of the entries so it can be kept elsewhere. Importing a backup back into the app is not supported yet.

Example entry (fictional):

```text
Note · 2026-10-17 · Long walk in the park.
```

## Storage and limits

Entries stay in this browser’s `localStorage`; they are not sent to a Pati Log service. Clearing browser data can remove them, so download a backup if you want another copy. If saved data cannot be read, the app leaves it untouched and asks before starting a fresh notebook.

This is a personal notebook, not veterinary guidance. It stores what you enter and does not interpret weight values, suggest treatment, or send reminders outside the page.

## Checks

`npm test` runs the domain, storage, and static UI-contract checks with Node’s built-in test runner. It passes here (19 tests). The current workspace has no installed npm packages; its offline cache could not supply `@types/react`, so `npm run typecheck` and `npm run build` were not verified here.
