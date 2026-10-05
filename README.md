# expense-tracker-Amal-Jyothy-V-c

Expense Tracker

A responsive, browser-based expense tracker built with plain HTML, CSS, and JavaScript. No build step, account, server, or third-party runtime dependency is required.

Run without Git
Open this repository on GitHub.
Select the green Code button, then choose Download ZIP.
Extract the downloaded ZIP file.
Open the extracted folder and double-click index.html. The app opens in your browser.
Run locally with a server
For a local HTTP server, run this from the project directory:

python3 -m http.server 8000
Then visit http://localhost:8000.

Features
Add, edit, and delete income and expense transactions.
Record amount, category, date, and description, with inline validation.
View overall income, expenses, and current balance.
Filter by transaction type or category and search descriptions/categories.
Review a six-month income/expense chart and this-month category spending summary.
Automatically save transactions in browser localStorage so they persist after refresh.
Responsive desktop and mobile layouts.
All amounts are displayed in USD. Data is stored only in the current browser on the current device. Clearing browser storage or using another browser/device will not transfer the data.

Files
index.html — accessible page structure and transaction form.
styles.css — responsive dashboard and form styles.
app.js — transaction logic, charts, validation, filtering, and local storage.
