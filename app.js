const workoutStorageKey = "meus-treinos-semana";
const machinesByDayStorageKey = "meus-treinos-maquinas-por-dia";
const legacyMachinesStorageKey = "meus-treinos-maquinas";
const themeStorageKey = "meus-treinos-tema";

const cards = [...document.querySelectorAll(".day-card")];
const clearAllButton = document.querySelector("#clearAll");
const themeToggle = document.querySelector("#themeToggle");
const machineTemplate = document.querySelector("#machineTemplate");

const loadJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const saveJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const hasMachineValue = (machine) => {
  const name = machine?.name ?? "";
  const load = machine?.load ?? "";
  const reps = machine?.reps ?? "";

  return name.trim().length > 0 || load.trim().length > 0 || reps.trim().length > 0;
};

const hasAnyMachineValue = (machines) => {
  return machines.some(hasMachineValue);
};

const hasAnyDayMachineValue = (machineMap) => {
  return Object.values(machineMap).some((machines) => Array.isArray(machines) && hasAnyMachineValue(machines));
};

const applyTheme = (theme) => {
  const activeTheme = theme === "dark" ? "dark" : "light";
  const nextTheme = activeTheme === "dark" ? "light" : "dark";

  document.documentElement.dataset.theme = activeTheme;
  localStorage.setItem(themeStorageKey, activeTheme);
  themeToggle.querySelector(".theme-text").textContent = nextTheme === "dark" ? "Escuro" : "Claro";
  themeToggle.setAttribute("aria-label", `Mudar para modo ${nextTheme === "dark" ? "escuro" : "claro"}`);
  themeToggle.setAttribute("title", `Mudar para modo ${nextTheme === "dark" ? "escuro" : "claro"}`);
};

const getDayMachines = (card) => {
  return [...card.querySelectorAll(".machine-row")].map((row) => ({
    name: row.querySelector(".machine-name").value,
    load: row.querySelector(".machine-load").value,
    reps: row.querySelector(".machine-reps").value
  }));
};

const setCardStatus = (card) => {
  const hasWorkout = card.querySelector("textarea").value.trim().length > 0;
  const hasMachines = hasAnyMachineValue(getDayMachines(card));

  card.classList.toggle("has-workout", hasWorkout || hasMachines);
};

const workouts = loadJson(workoutStorageKey, {});
const legacyMachines = loadJson(legacyMachinesStorageKey, []);
const machinesByDay = loadJson(machinesByDayStorageKey, {});

if (!hasAnyDayMachineValue(machinesByDay) && Array.isArray(legacyMachines) && hasAnyMachineValue(legacyMachines)) {
  machinesByDay.segunda = legacyMachines;
  saveJson(machinesByDayStorageKey, machinesByDay);
  localStorage.removeItem(legacyMachinesStorageKey);
}

const saveDayMachines = (card) => {
  const day = card.dataset.day;
  machinesByDay[day] = getDayMachines(card).filter(hasMachineValue);
  saveJson(machinesByDayStorageKey, machinesByDay);
  setCardStatus(card);
};

const createMachineRow = (card, machine = { name: "", load: "", reps: "" }) => {
  const machineList = card.querySelector("[data-machine-list]");
  const row = machineTemplate.content.firstElementChild.cloneNode(true);
  const nameInput = row.querySelector(".machine-name");
  const loadInput = row.querySelector(".machine-load");
  const repsInput = row.querySelector(".machine-reps");
  const removeButton = row.querySelector(".row-button");

  nameInput.value = machine.name ?? "";
  loadInput.value = machine.load ?? "";
  repsInput.value = machine.reps ?? "";

  nameInput.addEventListener("input", () => saveDayMachines(card));
  loadInput.addEventListener("input", () => saveDayMachines(card));
  repsInput.addEventListener("input", () => saveDayMachines(card));
  removeButton.addEventListener("click", () => {
    row.remove();
    saveDayMachines(card);
  });

  machineList.append(row);
  return row;
};

cards.forEach((card) => {
  const day = card.dataset.day;
  const textarea = card.querySelector("textarea");
  const addMachineButton = card.querySelector("[data-add-machine]");

  textarea.value = workouts[day] ?? "";

  textarea.addEventListener("input", () => {
    workouts[day] = textarea.value;
    saveJson(workoutStorageKey, workouts);
    setCardStatus(card);
  });

  (machinesByDay[day] ?? []).forEach((machine) => createMachineRow(card, machine));

  addMachineButton.addEventListener("click", () => {
    const row = createMachineRow(card);
    saveDayMachines(card);
    row.querySelector(".machine-name").focus();
  });

  setCardStatus(card);
});

clearAllButton.addEventListener("click", () => {
  const shouldClear = window.confirm("Limpar todos os treinos da semana?");

  if (!shouldClear) {
    return;
  }

  cards.forEach((card) => {
    const day = card.dataset.day;
    const textarea = card.querySelector("textarea");
    const machineList = card.querySelector("[data-machine-list]");

    workouts[day] = "";
    machinesByDay[day] = [];
    textarea.value = "";
    machineList.replaceChildren();
    setCardStatus(card);
  });

  saveJson(workoutStorageKey, workouts);
  saveJson(machinesByDayStorageKey, machinesByDay);
  localStorage.removeItem(legacyMachinesStorageKey);
});

themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

applyTheme(localStorage.getItem(themeStorageKey) ?? "light");
