(() => {
  "use strict";

  const STORAGE_KEY = "clear-ledger.transactions.v1";
  const INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Investments",
    "Gift",
    "Other income",
  ];
  const EXPENSE_CATEGORIES = [
    "Food & drink",
    "Transport",
    "Shopping",
    "Bills",
    "Health",
    "Entertainment",
    "Home",
    "Other expense",
  ];
  const CATEGORY_MARKS = {
    Salary: "↘",
    Freelance: "✳",
    Investments: "◒",
    Gift: "◇",
    "Other income": "＋",
    "Food & drink": "◌",
    Transport: "↗",
    Shopping: "▣",
    Bills: "⌂",
    Health: "✚",
    Entertainment: "♫",
    Home: "⌂",
    "Other expense": "•",
  };
  const $ = (selector) => document.querySelector(selector);
  const els = {
    list: $("#transaction-list"),
    empty: $("#empty-state"),
    count: $("#transaction-count"),
    income: $("#income-total"),
    expense: $("#expense-total"),
    balance: $("#balance-total"),
    chart: $("#monthly-chart"),
    chartSummary: $("#chart-summary"),
    categories: $("#category-summary"),
    categoryEmpty: $("#category-empty"),
    monthExpense: $("#month-expense-total"),
    dialog: $("#transaction-dialog"),
    form: $("#transaction-form"),
    title: $("#dialog-title"),
    type: $("#transaction-type"),
    amount: $("#amount"),
    category: $("#category"),
    date: $("#date"),
    description: $("#description"),
    save: $("#save-transaction"),
    categoryFilter: $("#category-filter"),
    typeFilter: $("#type-filter"),
    search: $("#search-input"),
    toast: $("#toast"),
  };
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  const shortMoney = (value) => {
    const abs = Math.abs(value);
    if (abs >= 1000000)
      return `$${(value / 1000000).toFixed(abs >= 10000000 ? 0 : 1)}m`;
    if (abs >= 10000)
      return `$${(value / 1000).toFixed(abs >= 100000 ? 0 : 1)}k`;
    return money.format(value).replace(/\.00$/, "");
  };
  const todayISO = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };
  const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };
  let transactions = loadTransactions();
  let editingId = null;
  let toastTimer;

  function loadTransactions() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(stored)) return [];
      return stored
        .filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            ["income", "expense"].includes(item.type) &&
            Number.isFinite(Number(item.amount)) &&
            Number(item.amount) > 0 &&
            typeof item.category === "string" &&
            validDate(item.date) &&
            typeof item.description === "string",
        )
        .map((item) => ({ ...item, amount: Number(item.amount) }));
    } catch (error) {
      console.warn("Could not load saved transactions.", error);
      return [];
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      return true;
    } catch (error) {
      console.error("Could not save transactions.", error);
      showToast("Could not save. Check your browser storage settings.");
      return false;
    }
  }

  function formatDate(iso) {
    const [year, month, day] = iso.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  }

  function monthKey(iso) {
    return iso.slice(0, 7);
  }
  function monthName(date) {
    return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600);
  }

  function refresh() {
    renderTotals();
    renderTransactions();
    renderFilters();
    renderMonthlyChart();
    renderCategories();
  }

  function renderTotals() {
    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
    const expense = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    els.income.textContent = money.format(income);
    els.expense.textContent = money.format(expense);
    els.balance.textContent = money.format(income - expense);
    els.count.textContent = transactions.length;
  }

  function createTransactionRow(item) {
    const row = document.createElement("tr");
    const transactionCell = document.createElement("td");
    const cell = document.createElement("div");
    cell.className = "transaction-cell";
    const symbol = document.createElement("span");
    symbol.className = `transaction-icon${item.type === "income" ? " income" : ""}`;
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = CATEGORY_MARKS[item.category] || "•";
    const copy = document.createElement("div");
    copy.className = "transaction-copy";
    const title = document.createElement("div");
    title.className = "transaction-name";
    title.textContent = item.description;
    const subtitle = document.createElement("div");
    subtitle.className = "transaction-subtitle";
    subtitle.textContent = item.type === "income" ? "Money in" : "Money out";
    copy.append(title, subtitle);
    cell.append(symbol, copy);
    transactionCell.append(cell);

    const categoryCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "category-tag";
    badge.textContent = item.category;
    categoryCell.append(badge);
    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.date);
    const amountCell = document.createElement("td");
    amountCell.className = `amount-cell${item.type === "income" ? " positive" : ""}`;
    amountCell.textContent = `${item.type === "income" ? "+" : "−"}${money.format(item.amount)}`;
    const actions = document.createElement("td");
    actions.className = "row-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "✎";
    edit.setAttribute("aria-label", `Edit ${item.description}`);
    edit.title = "Edit transaction";
    edit.addEventListener("click", () => openDialog(item));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${item.description}`);
    remove.title = "Delete transaction";
    remove.addEventListener("click", () => deleteTransaction(item.id));
    actions.append(edit, remove);
    row.append(transactionCell, categoryCell, dateCell, amountCell, actions);
    return row;
  }

  function getFilteredTransactions() {
    const type = els.typeFilter.value;
    const category = els.categoryFilter.value;
    const query = els.search.value.trim().toLocaleLowerCase();
    return transactions
      .filter(
        (item) =>
          (type === "all" || item.type === type) &&
          (category === "all" || item.category === category) &&
          (!query ||
            `${item.description} ${item.category} ${item.type}`
              .toLocaleLowerCase()
              .includes(query)),
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }

  function renderTransactions() {
    const rows = getFilteredTransactions();
    els.list.replaceChildren(...rows.map(createTransactionRow));
    els.empty.classList.toggle("visible", rows.length === 0);
    els.empty.querySelector("h3").textContent =
      transactions.length &&
      (els.search.value ||
        els.typeFilter.value !== "all" ||
        els.categoryFilter.value !== "all")
        ? "No matches yet."
        : "A fresh page.";
    els.empty.querySelector("p").textContent =
      transactions.length &&
      (els.search.value ||
        els.typeFilter.value !== "all" ||
        els.categoryFilter.value !== "all")
        ? "Try a different search or filter to find a transaction."
        : "Add your first transaction to start seeing the full picture.";
    $("#empty-add").hidden = Boolean(transactions.length);
  }

  function renderFilters() {
    const current = els.categoryFilter.value;
    const categories = [
      ...new Set(transactions.map((item) => item.category)),
    ].sort((a, b) => a.localeCompare(b));
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "All categories";
    els.categoryFilter.replaceChildren(
      all,
      ...categories.map((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        return option;
      }),
    );
    if (categories.includes(current)) els.categoryFilter.value = current;
  }

  function lastSixMonths() {
    const now = new Date();
    return Array.from(
      { length: 6 },
      (_, index) => new Date(now.getFullYear(), now.getMonth() - 5 + index, 1),
    );
  }

  function renderMonthlyChart() {
    const months = lastSixMonths();
    const values = months.map((date) => {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return {
        date,
        income: transactions
          .filter(
            (item) => item.type === "income" && monthKey(item.date) === key,
          )
          .reduce((sum, item) => sum + item.amount, 0),
        expense: transactions
          .filter(
            (item) => item.type === "expense" && monthKey(item.date) === key,
          )
          .reduce((sum, item) => sum + item.amount, 0),
      };
    });
    const ceiling = Math.max(
      1,
      ...values.flatMap((item) => [item.income, item.expense]),
    );
    const fragment = document.createDocumentFragment();
    values.forEach((value) => {
      const column = document.createElement("div");
      column.className = "month-column";
      const pair = document.createElement("div");
      pair.className = "bar-pair";
      pair.setAttribute("role", "img");
      pair.setAttribute(
        "aria-label",
        `${monthName(value.date)}: income ${money.format(value.income)}, expenses ${money.format(value.expense)}`,
      );
      [
        ["income", value.income],
        ["expense", value.expense],
      ].forEach(([kind, amount]) => {
        const bar = document.createElement("span");
        bar.className = `bar ${kind}`;
        bar.style.height = `${Math.max(amount > 0 ? 5 : 0, (amount / ceiling) * 88)}%`;
        bar.title = `${kind === "income" ? "Income" : "Expenses"}: ${money.format(amount)}`;
        pair.append(bar);
      });
      const label = document.createElement("span");
      label.className = "month-label";
      label.textContent = monthName(value.date);
      column.append(pair, label);
      fragment.append(column);
    });
    els.chart.replaceChildren(fragment);
    const thisMonth = values[values.length - 1];
    els.chartSummary.textContent = transactions.length
      ? `${monthName(thisMonth.date)}: ${shortMoney(thisMonth.income)} in · ${shortMoney(thisMonth.expense)} out`
      : "Add transactions to see your monthly flow";
  }

  function renderCategories() {
    const currentMonth = todayISO().slice(0, 7);
    const byCategory = new Map();
    transactions
      .filter(
        (item) =>
          item.type === "expense" && monthKey(item.date) === currentMonth,
      )
      .forEach((item) => {
        byCategory.set(
          item.category,
          (byCategory.get(item.category) || 0) + item.amount,
        );
      });
    const total = [...byCategory.values()].reduce(
      (sum, amount) => sum + amount,
      0,
    );
    els.monthExpense.textContent = shortMoney(total);
    const entries = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    els.categories.replaceChildren(
      ...entries.map(([category, amount]) => {
        const row = document.createElement("div");
        row.className = "category-row";
        const symbol = document.createElement("span");
        symbol.className = "category-symbol";
        symbol.setAttribute("aria-hidden", "true");
        symbol.textContent = CATEGORY_MARKS[category] || "•";
        const meta = document.createElement("div");
        meta.className = "category-meta";
        const line = document.createElement("div");
        line.className = "category-name-line";
        const name = document.createElement("span");
        name.textContent = category;
        const value = document.createElement("strong");
        value.textContent = shortMoney(amount);
        line.append(name, value);
        const track = document.createElement("div");
        track.className = "category-track";
        const bar = document.createElement("div");
        bar.className = "category-progress";
        bar.style.width = `${Math.max(4, (amount / total) * 100)}%`;
        track.append(bar);
        meta.append(line, track);
        row.append(symbol, meta);
        return row;
      }),
    );
    els.categoryEmpty.hidden = entries.length > 0;
  }

  function setCategories(type, chosen = "") {
    const options = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    els.category.replaceChildren(
      ...options.map((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        return option;
      }),
    );
    if (chosen && options.includes(chosen)) els.category.value = chosen;
  }

  function setType(type) {
    els.type.value = type;
    document.querySelectorAll(".type-option").forEach((button) => {
      const selected = button.dataset.type === type;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    setCategories(type);
  }

  function clearErrors() {
    ["amount", "category", "date", "description"].forEach(
      (name) => ($(`#${name}-error`).textContent = ""),
    );
  }

  function openDialog(item = null) {
    editingId = item ? item.id : null;
    els.form.reset();
    clearErrors();
    els.title.textContent = item ? "Edit transaction" : "Add a transaction";
    els.save.textContent = item ? "Save changes" : "Save transaction";
    setType(item?.type || "expense");
    els.amount.value = item?.amount ?? "";
    els.date.value = item?.date || todayISO();
    els.description.value = item?.description || "";
    if (item) setCategories(item.type, item.category);
    els.dialog.showModal();
    setTimeout(() => els.amount.focus(), 0);
  }

  function validateForm() {
    clearErrors();
    let valid = true;
    const amount = Number(els.amount.value);
    if (
      !els.amount.value.trim() ||
      !Number.isFinite(amount) ||
      amount < 0.01 ||
      amount > 999999999 ||
      Math.round(amount * 100) !== amount * 100
    ) {
      $("#amount-error").textContent =
        "Enter an amount from $0.01 to $999,999,999, using up to 2 decimal places.";
      valid = false;
    }
    if (!els.category.value) {
      $("#category-error").textContent = "Choose a category.";
      valid = false;
    }
    if (!validDate(els.date.value) || els.date.value > todayISO()) {
      $("#date-error").textContent = "Choose a valid date today or earlier.";
      valid = false;
    }
    if (!els.description.value.trim()) {
      $("#description-error").textContent = "Add a short description.";
      valid = false;
    }
    return valid;
  }

  function saveTransaction(event) {
    event.preventDefault();
    if (!validateForm()) return;
    const wasEditing = Boolean(editingId);
    const record = {
      id:
        editingId ||
        (globalThis.crypto?.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
      type: els.type.value,
      amount: Math.round(Number(els.amount.value) * 100) / 100,
      category: els.category.value,
      date: els.date.value,
      description: els.description.value.trim(),
    };
    const previous = transactions;
    transactions = wasEditing
      ? transactions.map((item) => (item.id === editingId ? record : item))
      : [record, ...transactions];
    if (!persist()) {
      transactions = previous;
      return;
    }
    els.dialog.close();
    refresh();
    showToast(
      wasEditing
        ? "Transaction updated."
        : `${record.type === "income" ? "Income" : "Expense"} added.`,
    );
  }

  function deleteTransaction(id) {
    const item = transactions.find((record) => record.id === id);
    if (!item) return;
    if (!window.confirm(`Delete “${item.description}”? This cannot be undone.`))
      return;
    const previous = transactions;
    transactions = transactions.filter((record) => record.id !== id);
    if (!persist()) {
      transactions = previous;
      return;
    }
    refresh();
    showToast("Transaction deleted.");
  }

  function updateTodayLabel() {
    $("#today-label").textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
      .format(new Date())
      .toUpperCase();
  }

  document
    .querySelectorAll(".type-option")
    .forEach((button) =>
      button.addEventListener("click", () => setType(button.dataset.type)),
    );
  document
    .querySelectorAll(".close-dialog")
    .forEach((button) =>
      button.addEventListener("click", () => els.dialog.close()),
    );
  ["#add-transaction", "#add-transaction-secondary", "#empty-add"].forEach(
    (selector) => $(selector).addEventListener("click", () => openDialog()),
  );
  els.form.addEventListener("submit", saveTransaction);
  els.typeFilter.addEventListener("change", renderTransactions);
  els.categoryFilter.addEventListener("change", renderTransactions);
  els.search.addEventListener("input", renderTransactions);
  els.dialog.addEventListener("click", (event) => {
    if (event.target === els.dialog) els.dialog.close();
  });
  els.dialog.addEventListener("close", clearErrors);
  updateTodayLabel();
  setCategories("expense");
  refresh();
})();
