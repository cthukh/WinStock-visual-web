const demoFoods = [
  { type: "Maíz", quantity: 1250, sacks: 25, sackType: "50 kg", date: "2026-09-14", provider: "AgroSur", notes: "" },
  { type: "Trigo", quantity: 800, sacks: 20, sackType: "40 kg", date: "2026-09-08", provider: "Semillas del Valle", notes: "" },
  { type: "Heno", quantity: 640, sacks: 0, sackType: "A granel", date: "2026-08-29", provider: "Predio Los Aromos", notes: "" },
  { type: "Maíz", quantity: 600, sacks: 12, sackType: "50 kg", date: "2026-08-20", provider: "AgroSur", notes: "" }
];

const demoSupplies = [
  { category: "Filtros de combustible / aire / aceite", name: "Filtro de aceite · LF-900", quantity: 4, unit: "Unidades", date: "2026-10-02", provider: "AgroMecánica", price: 18500, machine: "Tractor John Deere 5075E" },
  { category: "Aceite de motor / hidráulico / 80-90 transmisión", name: "Aceite hidráulico · ISO 68", quantity: 120, unit: "Litros", date: "2026-09-26", provider: "Lubricantes del Sur", price: 2100, machine: "Carro mixer" },
  { category: "Filtros de combustible / aire / aceite", name: "Filtro de aire · AF-254", quantity: 2, unit: "Unidades", date: "2026-09-18", provider: "AgroMecánica", price: 24300, machine: "Tractor Massey Ferguson" },
  { category: "Aceite de motor / hidráulico / 80-90 transmisión", name: "Aceite de transmisión 80-90", quantity: 2, unit: "Tambores", date: "2026-08-30", provider: "Lubricantes del Sur", price: 148000, machine: "" }
];

const demoRations = [
  { id: 1, date: "2026-10-08", shift: "Mañana", food: "Maíz", quantity: 120 },
  { id: 2, date: "2026-10-08", shift: "Tarde", food: "Ensilaje", quantity: 180 },
  { id: 3, date: "2026-10-07", shift: "Mañana", food: "Concentrado", quantity: 95 },
  { id: 4, date: "2026-10-06", shift: "Tarde", food: "Maíz", quantity: 130 },
  { id: 5, date: "2026-10-05", shift: "Mañana", food: "Heno", quantity: 75 },
  { id: 6, date: "2026-10-03", shift: "Tarde", food: "Ensilaje", quantity: 160 }
];

function loadEntries(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return { entries: stored === null ? fallback : JSON.parse(stored), isDemo: stored === null };
  } catch {
    return { entries: fallback, isDemo: true };
  }
}

function saveEntries(key, entries) {
  try {
    localStorage.setItem(key, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

const foodStore = loadEntries("winstock-food-entries", demoFoods);
const supplyStore = loadEntries("winstock-supply-entries", demoSupplies);
const rationHistoryStore = loadEntries("winstock-ration-history", demoRations);
let foodEntries = foodStore.entries;
let supplyEntries = supplyStore.entries;
let rationEntries = rationHistoryStore.entries;

function formatNumber(value, maximumFractionDigits = 0) {
  return Number(value || 0).toLocaleString("es-CL", { maximumFractionDigits });
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}

function addTextCell(row, value, className = "") {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = value || "—";
  row.append(cell);
  return cell;
}

function setDemoNote(elementId, isDemo) {
  const note = document.getElementById(elementId);
  if (note) note.hidden = !isDemo;
}

function addStoredOptions(select, values) {
  const sentinel = select.querySelector('option[value="__new__"]');
  values.filter(Boolean).forEach((value) => {
    const exists = [...select.options].some((option) => option.value === value);
    if (!exists) select.add(new Option(value, value), sentinel || null);
  });
}

function groupFoods(entries) {
  const groups = new Map();
  entries.forEach((entry) => {
    const group = groups.get(entry.type) || { type: entry.type, quantity: 0, sacks: 0, lots: 0, date: "", provider: "" };
    group.quantity += Number(entry.quantity) || 0;
    group.sacks += Number(entry.sacks) || 0;
    group.lots += 1;
    if (entry.date && entry.date >= group.date) {
      group.date = entry.date;
      group.provider = entry.provider || "";
    }
    groups.set(entry.type, group);
  });
  return [...groups.values()].sort((left, right) => right.quantity - left.quantity);
}

function renderBars(target, items, getLabel, getValue, suffix) {
  target.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "chart-empty";
    empty.textContent = "No hay datos para mostrar.";
    target.append(empty);
    return;
  }
  const maxValue = Math.max(...items.map(getValue), 1);
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "chart-row";
    const labelLine = document.createElement("div");
    labelLine.className = "chart-label-line";
    const label = document.createElement("strong");
    label.textContent = getLabel(item);
    const value = document.createElement("span");
    value.textContent = `${formatNumber(getValue(item))} ${suffix}`;
    const track = document.createElement("div");
    track.className = "bar-track";
    track.setAttribute("role", "img");
    track.setAttribute("aria-label", `${getLabel(item)}: ${value.textContent}`);
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${Math.max(4, getValue(item) / maxValue * 100)}%`;
    track.append(fill);
    labelLine.append(label, value);
    row.append(labelLine, track);
    target.append(row);
  });
}

function renderFoods() {
  const groups = groupFoods(foodEntries);
  const query = document.getElementById("food-search").value.trim().toLocaleLowerCase("es");
  const selectedType = document.getElementById("food-filter").value;
  const filter = document.getElementById("food-filter");
  const previousFilter = filter.value;
  filter.innerHTML = '<option value="">Todos los alimentos</option>';
  groups.forEach((group) => filter.add(new Option(group.type, group.type)));
  filter.value = groups.some((group) => group.type === previousFilter) ? previousFilter : "";

  const visibleEntries = foodEntries.map((entry, index) => ({ entry, index })).filter(({ entry }) => {
    const matchesSearch = `${entry.type} ${entry.provider || ""}`.toLocaleLowerCase("es").includes(query);
    return matchesSearch && (!selectedType || entry.type === selectedType);
  });
  const totalKg = foodEntries.reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);
  const totalSacks = foodEntries.reduce((sum, entry) => sum + (Number(entry.sacks) || 0), 0);
  const latestDate = foodEntries.map((entry) => entry.date).filter(Boolean).sort().at(-1) || "";
  document.getElementById("food-total-kg").textContent = formatNumber(totalKg);
  document.getElementById("food-type-count").textContent = formatNumber(groups.length);
  document.getElementById("food-sack-count").textContent = formatNumber(totalSacks);
  document.getElementById("food-latest-date").textContent = formatDate(latestDate);
  document.getElementById("food-record-count").textContent = `${formatNumber(foodEntries.length)} ingresos`;
  document.querySelectorAll('[data-count="Alimentos"]').forEach((element) => { element.textContent = formatNumber(foodEntries.length); });
  renderBars(document.getElementById("food-chart"), groups.slice(0, 6), (group) => group.type, (group) => group.quantity, "kg");

  const rows = document.getElementById("food-rows");
  rows.replaceChildren();
  if (!visibleEntries.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-cell";
    cell.textContent = groups.length ? "No hay resultados para este filtro." : "Aún no hay alimentos registrados.";
    row.append(cell);
    rows.append(row);
  }
  visibleEntries.forEach(({ entry, index }) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const name = document.createElement("span");
    name.className = "item-primary";
    name.textContent = entry.type;
    const secondary = document.createElement("span");
    secondary.className = "item-secondary";
    secondary.textContent = entry.sackType || "A granel";
    nameCell.append(name, secondary);
    row.append(nameCell);
    const actions = document.createElement("td");
    actions.className = "data-table-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "icon-button";
    editButton.dataset.editFood = index;
    editButton.setAttribute("aria-label", `Editar ${entry.type}`);
    editButton.title = "Editar registro";
    editButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15l-.8 5Z"/></svg>';
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "icon-button danger";
    deleteButton.dataset.deleteFood = index;
    deleteButton.setAttribute("aria-label", `Eliminar ${entry.type}`);
    deleteButton.title = "Eliminar registro";
    deleteButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16m-10 4v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></svg>';
    actions.append(editButton, deleteButton);
    row.append(actions);
    const stockCell = addTextCell(row, `${formatNumber(entry.quantity)} kg`);
    const stock = document.createElement("span");
    stock.className = "stock-pill";
    stock.textContent = stockCell.textContent;
    stockCell.replaceChildren(stock);
    addTextCell(row, entry.sacks ? formatNumber(entry.sacks) : "A granel");
    addTextCell(row, formatDate(entry.date));
    addTextCell(row, entry.provider || "—");
    rows.append(row);
  });
}

function getRationRangeStart(range) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);

  if (range === "today") {
    return today;
  }

  if (range === "week") {
    start.setDate(today.getDate() - 6);
    return start;
  }

  if (range === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return null;
}

function isRationInRange(dateString, range) {
  const rangeStart = getRationRangeStart(range);
  const date = new Date(`${dateString}T12:00:00`);

  if (range === "all" || !rangeStart) return true;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (range === "today") {
    return date >= todayStart && date < new Date(todayStart.getTime() + 86400000);
  }

  return date >= rangeStart && date <= todayStart;
}

function renderRationHistory() {
  const rangeSelect = document.getElementById("ration-range");
  const foodSelect = document.getElementById("ration-food-filter");
  const searchInput = document.getElementById("ration-search");
  const range = rangeSelect ? rangeSelect.value : "week";
  const search = searchInput ? searchInput.value.trim().toLocaleLowerCase("es") : "";
  const selectedFood = foodSelect ? foodSelect.value : "";

  const availableFoods = [...new Set(rationEntries.map((entry) => entry.food))];
  const previousFood = foodSelect ? foodSelect.value : "";
  if (foodSelect) {
    foodSelect.innerHTML = '<option value="">Todos los alimentos</option>';
    availableFoods.forEach((food) => foodSelect.add(new Option(food, food)));
    foodSelect.value = availableFoods.includes(previousFood) ? previousFood : "";
  }

  const filteredEntries = rationEntries.filter((entry) => {
    const matchesRange = isRationInRange(entry.date, range);
    const matchesFood = !selectedFood || entry.food === selectedFood;
    const matchesSearch = !search || `${entry.food} ${entry.shift} ${entry.date}`.toLocaleLowerCase("es").includes(search);
    return matchesRange && matchesFood && matchesSearch;
  }).sort((left, right) => new Date(right.date) - new Date(left.date));

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTotal = rationEntries.filter((entry) => entry.date === todayKey).reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);
  const weekMap = new Map();
  rationEntries.filter((entry) => isRationInRange(entry.date, "week")).forEach((entry) => {
    weekMap.set(entry.food, (weekMap.get(entry.food) || 0) + (Number(entry.quantity) || 0));
  });
  const mostUsed = [...weekMap.entries()].sort((left, right) => right[1] - left[1])[0];

  const totalTodayNode = document.getElementById("ration-total-today");
  const mostUsedNode = document.getElementById("ration-most-used");
  if (totalTodayNode) totalTodayNode.textContent = `${formatNumber(todayTotal)} kg`;
  if (mostUsedNode) mostUsedNode.textContent = mostUsed ? `${mostUsed[0]} (${formatNumber(mostUsed[1])} kg)` : "Sin datos";

  const rows = document.getElementById("ration-history-rows");
  if (!rows) return;
  rows.replaceChildren();

  if (!filteredEntries.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-cell";
    cell.textContent = "No hay raciones para este filtro.";
    row.append(cell);
    rows.append(row);
    return;
  }

  filteredEntries.forEach((entry) => {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(entry.date);
    row.append(dateCell);

    const shiftCell = document.createElement("td");
    const shiftBadge = document.createElement("span");
    shiftBadge.className = `shift-badge ${entry.shift === "Mañana" ? "morning" : entry.shift === "Tarde" ? "afternoon" : "night"}`;
    shiftBadge.textContent = entry.shift === "Mañana" ? "Mañana" : entry.shift === "Tarde" ? "Tarde" : "Noche";
    shiftCell.append(shiftBadge);
    row.append(shiftCell);

    const foodCell = document.createElement("td");
    foodCell.textContent = entry.food;
    row.append(foodCell);

    const quantityCell = document.createElement("td");
    quantityCell.textContent = `${formatNumber(entry.quantity)} kg`;
    row.append(quantityCell);

    const actionsCell = document.createElement("td");
    const actionButton = document.createElement("button");
    actionButton.type = "button";
    actionButton.className = "icon-button danger";
    actionButton.dataset.deleteRation = entry.id;
    actionButton.title = "Anular ración";
    actionButton.setAttribute("aria-label", `Anular ración de ${entry.food}`);
    actionButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16m-10 4v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"/></svg>';
    actionsCell.append(actionButton);
    row.append(actionsCell);
    rows.append(row);
  });
}

function setupFoodViews() {
  const buttons = document.querySelectorAll(".view-tab[data-view]");
  const sections = document.querySelectorAll(".content-section[data-section]");
  const setView = (view) => {
    sections.forEach((section) => {
      const active = section.dataset.section === view;
      section.hidden = !active;
    });
    buttons.forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  const initialView = window.location.hash === "#historial-raciones" ? "history" : "inventory";
  setView(initialView);
}

function setupFoodDialogs() {
  const rationDialog = document.getElementById("ration-modal");
  if (!rationDialog) return;

  const rationFood = document.getElementById("ration-food");
  addStoredOptions(rationFood, foodEntries.map((entry) => entry.type));
  const rationDate = document.getElementById("ration-date");
  rationDate.value = new Date().toISOString().slice(0, 10);

  const openRationFromHash = () => {
    if (window.location.hash === "#ration-modal" && !rationDialog.open && typeof rationDialog.showModal === "function") {
      rationDialog.showModal();
    }
  };
  openRationFromHash();
  window.addEventListener("hashchange", openRationFromHash);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.closeDialog)?.close());
  });

  document.querySelectorAll("dialog.modal").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  rationDialog.addEventListener("close", () => {
    if (window.location.hash === "#ration-modal") history.replaceState(null, "", window.location.pathname + window.location.search);
  });

  document.getElementById("ration-form").addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    rationDate.value = new Date().toISOString().slice(0, 10);
    document.getElementById("ration-status").textContent = "Ración registrada para esta demostración.";
    window.setTimeout(() => {
      rationDialog.close();
      document.getElementById("ration-status").textContent = "";
    }, 800);
  });

  let deleteIndex = null;
  document.getElementById("food-rows").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-food]");
    const deleteButton = event.target.closest("[data-delete-food]");
    if (editButton) {
      const index = Number(editButton.dataset.editFood);
      const entry = foodEntries[index];
      if (!entry) return;
      document.getElementById("edit-food-index").value = index;
      document.getElementById("edit-food-type").value = entry.type;
      document.getElementById("edit-food-quantity").value = entry.quantity;
      document.getElementById("edit-food-sacks").value = entry.sacks || 0;
      document.getElementById("edit-food-date").value = entry.date || "";
      document.getElementById("edit-food-provider").value = entry.provider || "";
      document.getElementById("edit-food-modal").showModal();
    }
    if (deleteButton) {
      deleteIndex = Number(deleteButton.dataset.deleteFood);
      const entry = foodEntries[deleteIndex];
      if (!entry) return;
      document.getElementById("delete-food-name").textContent = `${entry.type} · ${formatNumber(entry.quantity)} kg`;
      document.getElementById("delete-food-modal").showModal();
    }
  });

  let deleteRationId = null;
  document.getElementById("ration-history-rows").addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-ration]");
    if (!deleteButton) return;
    deleteRationId = Number(deleteButton.dataset.deleteRation);
    const entry = rationEntries.find((item) => item.id === deleteRationId);
    if (!entry) return;
    document.getElementById("delete-ration-name").textContent = `${entry.food} · ${formatNumber(entry.quantity)} kg · ${entry.shift}`;
    document.getElementById("delete-ration-modal").showModal();
  });

  document.getElementById("confirm-delete-ration").addEventListener("click", () => {
    if (deleteRationId === null) return;
    rationEntries = rationEntries.filter((entry) => entry.id !== deleteRationId);
    saveEntries("winstock-ration-history", rationEntries);
    renderRationHistory();
    deleteRationId = null;
    document.getElementById("delete-ration-modal").close();
  });

  document.getElementById("edit-food-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const index = Number(document.getElementById("edit-food-index").value);
    if (!foodEntries[index]) return;
    foodEntries[index] = {
      ...foodEntries[index],
      type: document.getElementById("edit-food-type").value.trim(),
      quantity: Number(document.getElementById("edit-food-quantity").value),
      sacks: Number(document.getElementById("edit-food-sacks").value) || 0,
      date: document.getElementById("edit-food-date").value,
      provider: document.getElementById("edit-food-provider").value.trim()
    };
    saveEntries("winstock-food-entries", foodEntries);
    renderFoods();
    document.getElementById("edit-food-modal").close();
  });

  document.getElementById("confirm-delete-food").addEventListener("click", () => {
    if (deleteIndex === null || !foodEntries[deleteIndex]) return;
    foodEntries.splice(deleteIndex, 1);
    saveEntries("winstock-food-entries", foodEntries);
    deleteIndex = null;
    renderFoods();
    document.getElementById("delete-food-modal").close();
  });
}

function renderSupplies() {
  const query = document.getElementById("supply-search").value.trim().toLocaleLowerCase("es");
  const selectedCategory = document.getElementById("supply-filter").value;
  const categories = [...new Set(supplyEntries.map((entry) => entry.category))];
  const filter = document.getElementById("supply-filter");
  const previousFilter = filter.value;
  filter.innerHTML = '<option value="">Todas las categorías</option>';
  categories.forEach((category) => filter.add(new Option(category, category)));
  filter.value = categories.includes(previousFilter) ? previousFilter : "";
  const visibleEntries = supplyEntries.filter((entry) => {
    const text = `${entry.name} ${entry.category} ${entry.machine} ${entry.provider}`.toLocaleLowerCase("es");
    return text.includes(query) && (!selectedCategory || entry.category === selectedCategory);
  });
  const references = new Set(supplyEntries.map((entry) => entry.name)).size;
  const unitTotals = supplyEntries.reduce((totals, entry) => {
    totals[entry.unit] = (totals[entry.unit] || 0) + (Number(entry.quantity) || 0);
    return totals;
  }, {});
  const unitsText = Object.entries(unitTotals).map(([unit, value]) => `${formatNumber(value)} ${unit.toLocaleLowerCase("es")}`).join(" · ") || "0";
  document.getElementById("supply-reference-count").textContent = formatNumber(references);
  document.getElementById("supply-category-count").textContent = formatNumber(categories.length);
  document.getElementById("supply-unit-count").textContent = unitsText;
  document.getElementById("supply-machine-count").textContent = formatNumber(supplyEntries.filter((entry) => entry.machine).length);
  document.getElementById("supply-record-count").textContent = `${formatNumber(supplyEntries.length)} registros`;
  document.querySelectorAll('[data-count="Insumos"]').forEach((element) => { element.textContent = formatNumber(supplyEntries.length); });
  const categoryCounts = categories.map((category) => ({ category, count: supplyEntries.filter((entry) => entry.category === category).length })).sort((left, right) => right.count - left.count);
  renderBars(document.getElementById("supply-chart"), categoryCounts, (item) => item.category, (item) => item.count, "registros");

  const rows = document.getElementById("supply-rows");
  rows.replaceChildren();
  if (!visibleEntries.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.className = "empty-cell";
    cell.textContent = supplyEntries.length ? "No hay resultados para este filtro." : "Aún no hay insumos registrados.";
    row.append(cell);
    rows.append(row);
  }
  visibleEntries.forEach((entry) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const name = document.createElement("span");
    name.className = "item-primary";
    name.textContent = entry.name;
    const category = document.createElement("span");
    category.className = "item-secondary";
    category.textContent = entry.category;
    nameCell.append(name, category);
    row.append(nameCell);
    addTextCell(row, `${formatNumber(entry.quantity, 2)} ${entry.unit.toLocaleLowerCase("es")}`);
    addTextCell(row, entry.price ? `$${formatNumber(entry.price)}` : "—");
    addTextCell(row, entry.machine || "Sin asignar");
    addTextCell(row, formatDate(entry.date));
    addTextCell(row, entry.provider || "—");
    rows.append(row);
  });
}

function setupCustomOptions() {
  document.querySelectorAll("[data-add-option]").forEach((select) => {
    const customInput = document.getElementById(select.dataset.newField);
    select.addEventListener("change", () => {
      const adding = select.value === "__new__";
      customInput.hidden = !adding;
      customInput.required = adding;
      if (adding) customInput.focus();
    });
  });
}

function setupForms() {
  const foodForm = document.getElementById("food-form");
  if (foodForm) {
    const typeSelect = document.getElementById("food-type");
    addStoredOptions(typeSelect, foodEntries.map((entry) => entry.type));
    foodForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(foodForm);
      let type = data.get("type");
      if (type === "__new__") type = data.get("new-food-type").trim();
      const entry = {
        type,
        quantity: Number(data.get("quantity")),
        sacks: Number(data.get("sacks")) || 0,
        sackType: data.get("sackType"),
        date: data.get("date"),
        provider: data.get("provider").trim(),
        notes: data.get("notes").trim()
      };
      foodEntries.unshift(entry);
      const saved = saveEntries("winstock-food-entries", foodEntries);
      foodForm.reset();
      document.getElementById("new-food-type").hidden = true;
      document.getElementById("new-food-type").required = false;
      document.getElementById("food-status").textContent = saved ? `${type} se agregó al inventario.` : "No se pudo guardar en este navegador. Revisa sus permisos de almacenamiento.";
    });
  }

  const supplyForm = document.getElementById("supplies-form");
  if (supplyForm) {
    const categorySelect = document.getElementById("supply-category");
    addStoredOptions(categorySelect, supplyEntries.map((entry) => entry.category));
    supplyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(supplyForm);
      let category = data.get("category");
      if (category === "__new__") category = data.get("new-supply-category").trim();
      const entry = {
        category,
        name: data.get("name").trim(),
        quantity: Number(data.get("quantity")),
        unit: data.get("unit"),
        date: data.get("date"),
        provider: data.get("provider").trim(),
        price: data.get("price"),
        machine: data.get("machine").trim()
      };
      supplyEntries.unshift(entry);
      const saved = saveEntries("winstock-supply-entries", supplyEntries);
      supplyForm.reset();
      document.getElementById("new-supply-category").hidden = true;
      document.getElementById("new-supply-category").required = false;
      document.getElementById("supply-status").textContent = saved ? `${entry.name} se guardó en el inventario.` : "No se pudo guardar en este navegador. Revisa sus permisos de almacenamiento.";
    });
  }

  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("reset", () => {
      const status = form.querySelector(".form-status");
      if (status) status.textContent = "";
      form.querySelectorAll(".custom-entry").forEach((input) => { input.hidden = true; input.required = false; });
    });
  });
}

function setupNavigation() {
  const sidebar = document.getElementById("sidebar");
  const menuButton = document.getElementById("mobile-menu");
  const profileButton = document.getElementById("profile-button");
  const profileMenu = document.getElementById("profile-menu");
  menuButton.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  });
  profileButton.addEventListener("click", () => {
    const isOpen = profileButton.getAttribute("aria-expanded") !== "true";
    profileButton.setAttribute("aria-expanded", String(isOpen));
    profileMenu.hidden = !isOpen;
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".profile-wrap")) {
      profileMenu.hidden = true;
      profileButton.setAttribute("aria-expanded", "false");
    }
    if (window.innerWidth <= 760 && sidebar.classList.contains("open") && !event.target.closest("#sidebar, #mobile-menu")) {
      sidebar.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menú");
    }
  });
}

setupNavigation();
setupCustomOptions();
setupForms();
setDemoNote("dashboard-demo-note", foodStore.isDemo || supplyStore.isDemo);

if (document.body.dataset.page === "foods") {
  setupFoodViews();
  document.getElementById("food-search").addEventListener("input", renderFoods);
  document.getElementById("food-filter").addEventListener("change", renderFoods);
  document.getElementById("ration-range").addEventListener("change", renderRationHistory);
  document.getElementById("ration-food-filter").addEventListener("change", renderRationHistory);
  document.getElementById("ration-search").addEventListener("input", renderRationHistory);
  setDemoNote("food-demo-note", foodStore.isDemo);
  renderFoods();
  renderRationHistory();
  setupFoodDialogs();
}

if (document.body.dataset.page === "supplies") {
  document.getElementById("supply-search").addEventListener("input", renderSupplies);
  document.getElementById("supply-filter").addEventListener("change", renderSupplies);
  setDemoNote("supply-demo-note", supplyStore.isDemo);
  renderSupplies();
}

document.querySelectorAll('[data-count="Alimentos"]').forEach((element) => { element.textContent = formatNumber(foodEntries.length); });
document.querySelectorAll('[data-count="Insumos"]').forEach((element) => { element.textContent = formatNumber(supplyEntries.length); });