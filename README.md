**Live website:** [Open Expense Tracker](https://amaljyothyvc.github.io/expense-tracker-Amal-Jyothy-V-c/)

# Expense Tracker

A responsive browser-based expense tracker built with HTML, CSS, and JavaScript. No installation or build step is required.

## Run without Git

1. Open this repository on GitHub.
2. Select **Code → Download ZIP**.
3. Extract the downloaded ZIP file.
4. Open the extracted folder and double-click **`index.html`**. The app opens in your browser.

## Run with a local server (optional)

From the project directory, run:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Features

- Add, edit, and delete income and expense transactions.
- Record amount, category, date, and description, with inline validation.
- View total income, total expenses, and current balance.
- Filter by transaction type or category and search transactions.
- See a six-month income/expense chart and a monthly category-wise expense summary.
- Save data in browser `localStorage` so it remains after refreshing the page.
- Responsive layout for desktop and mobile screens.

Amounts are displayed in USD. Transaction data stays in the current browser on the current device; clearing browser storage or switching devices will not transfer it.

## Project files

- `index.html` — page structure and transaction form.
- `styles.css` — responsive dashboard and form styling.
- `app.js` — transaction logic, validation, filtering, charts, and local storage.
- `.gitignore` — ignores common operating-system metadata files.
