const workoutStorageKey = "meus-treinos-semana";
const machinesByDayStorageKey = "meus-treinos-maquinas-por-dia";
const legacyMachinesStorageKey = "meus-treinos-maquinas";
const themeStorageKey = "meus-treinos-tema";

const cards = [...document.querySelectorAll(".day-card")];
const clearAllButton = document.querySelector("#clearAll");
const themeToggle = document.querySelector("#themeToggle");
const importConfigButton = document.querySelector("#importConfigBtn");
const exportConfigButton = document.querySelector("#exportConfigBtn");
const importConfigInput = document.querySelector("#importConfigInput");
const machineTemplate = document.querySelector("#machineTemplate");
const dayKeys = cards.map((card) => card.dataset.day);

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

const normalizeTheme = (theme) => {
  return theme === "dark" ? "dark" : "light";
};

const applyTheme = (theme) => {
  const activeTheme = normalizeTheme(theme);
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

const toMachineRecord = (machine) => {
  return {
    name: String(machine?.name ?? ""),
    load: String(machine?.load ?? ""),
    reps: String(machine?.reps ?? "")
  };
};

const normalizeWorkouts = (workoutsInput) => {
  const normalized = {};

  dayKeys.forEach((day) => {
    normalized[day] = String(workoutsInput?.[day] ?? "");
  });

  return normalized;
};

const normalizeMachinesByDay = (machinesInput) => {
  const normalized = {};

  dayKeys.forEach((day) => {
    const dayMachines = Array.isArray(machinesInput?.[day]) ? machinesInput[day] : [];
    normalized[day] = dayMachines.map(toMachineRecord).filter(hasMachineValue);
  });

  return normalized;
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

const renderCardFromState = (card) => {
  const day = card.dataset.day;
  const textarea = card.querySelector("textarea");
  const machineList = card.querySelector("[data-machine-list]");

  textarea.value = workouts[day] ?? "";
  machineList.replaceChildren();
  (machinesByDay[day] ?? []).forEach((machine) => createMachineRow(card, machine));
  setCardStatus(card);
};

const renderAllCardsFromState = () => {
  cards.forEach(renderCardFromState);
};

cards.forEach((card) => {
  const day = card.dataset.day;
  const textarea = card.querySelector("textarea");
  const addMachineButton = card.querySelector("[data-add-machine]");

  textarea.addEventListener("input", () => {
    workouts[day] = textarea.value;
    saveJson(workoutStorageKey, workouts);
    setCardStatus(card);
  });

  addMachineButton.addEventListener("click", () => {
    const row = createMachineRow(card);
    saveDayMachines(card);
    row.querySelector(".machine-name").focus();
  });
});

renderAllCardsFromState();

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

const buildExportPayload = () => {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    workouts: normalizeWorkouts(workouts),
    machinesByDay: normalizeMachinesByDay(machinesByDay),
    theme: normalizeTheme(document.documentElement.dataset.theme)
  };
};

const downloadConfigJson = () => {
  const payload = buildExportPayload();
  const fileBody = JSON.stringify(payload, null, 2);
  const blob = new Blob([fileBody], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");

  anchor.href = url;
  anchor.download = `treino-config-${stamp}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const parseImportPayload = (source) => {
  if (!source || typeof source !== "object") {
    throw new Error("Arquivo invalido.");
  }

  const normalizedWorkouts = normalizeWorkouts(source.workouts ?? {});
  const normalizedMachines = normalizeMachinesByDay(source.machinesByDay ?? {});
  let hasStructuredPayload = Boolean(source.workouts || source.machinesByDay);

  dayKeys.forEach((day) => {
    const dayData = source[day];

    if (!dayData || typeof dayData !== "object") {
      return;
    }

    hasStructuredPayload = true;
    normalizedWorkouts[day] = String(dayData.workout ?? dayData.treino ?? normalizedWorkouts[day] ?? "");
    normalizedMachines[day] = Array.isArray(dayData.machines)
      ? dayData.machines.map(toMachineRecord).filter(hasMachineValue)
      : Array.isArray(dayData.maquinas)
        ? dayData.maquinas.map(toMachineRecord).filter(hasMachineValue)
        : normalizedMachines[day];
  });

  if (!hasStructuredPayload) {
    throw new Error("JSON sem dados de treino.");
  }

  return {
    workouts: normalizedWorkouts,
    machinesByDay: normalizedMachines,
    theme: normalizeTheme(source.theme ?? source.tema ?? document.documentElement.dataset.theme)
  };
};

const applyImportedConfig = (importedConfig) => {
  dayKeys.forEach((day) => {
    workouts[day] = importedConfig.workouts[day] ?? "";
    machinesByDay[day] = importedConfig.machinesByDay[day] ?? [];
  });

  saveJson(workoutStorageKey, workouts);
  saveJson(machinesByDayStorageKey, machinesByDay);
  localStorage.removeItem(legacyMachinesStorageKey);
  applyTheme(importedConfig.theme);
  renderAllCardsFromState();
};

importConfigButton.addEventListener("click", () => {
  importConfigInput.click();
});

exportConfigButton.addEventListener("click", () => {
  downloadConfigJson();
});

importConfigInput.addEventListener("change", async () => {
  const [file] = importConfigInput.files ?? [];

  if (!file) {
    return;
  }

  try {
    const content = await file.text();
    const parsed = JSON.parse(content);
    const imported = parseImportPayload(parsed);

    applyImportedConfig(imported);
    window.alert("Configuracao importada com sucesso.");
  } catch (error) {
    window.alert("Nao foi possivel importar esse JSON. Verifique o formato do arquivo.");
    console.error(error);
  } finally {
    importConfigInput.value = "";
  }
});

applyTheme(localStorage.getItem(themeStorageKey) ?? "light");
