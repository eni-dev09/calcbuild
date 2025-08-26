// CalcBuild — simple local-first estimator
const qs = selector => document.querySelector(selector);
const qsa = selector => Array.from(document.querySelectorAll(selector));

// --- Helper Functions ---

/**
 * Formats a number to a string with two decimal places.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number string.
 */
function formatNumber(num) {
  const formattedNum = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(formattedNum);
}

/**
 * Reads a number value from an input element.
 * @param {string} selector - The CSS selector for the input.
 * @returns {number} The parsed number, or 0 if invalid.
 */
function readNumberFromInput(selector) {
  return parseFloat(qs(selector).value) || 0;
}

/**
 * Calculates the perimeter of a rectangle.
 * @param {number} length - The length of the room.
 * @param {number} width - The width of the room.
 * @returns {number} The perimeter.
 */
function calculatePerimeter(length, width) {
  return 2 * (length + width);
}

// --- DOM Manipulation ---

/**
 * Adds a new room row to the UI.
 * @param {object} [room] - An optional room object with `name`, `L`, `W`, and `openings`.
 */
function addRoomRow(room = {}) {
  const roomDefaults = { name: '', L: 4, W: 3, openings: 2 };
  const roomData = { ...roomDefaults, ...room };

  const roomRow = document.createElement('div');
  roomRow.className = 'room-row';
  roomRow.innerHTML = `
    <input class="r-name" placeholder="Living Room / Bedroom / Kitchen" value="${roomData.name}" />
    <input class="r-L" type="number" min="0" step="0.01" value="${roomData.L}" />
    <input class="r-W" type="number" min="0" step="0.01" value="${roomData.W}" />
    <input class="r-openings" type="number" min="0" step="0.01" value="${roomData.openings}" />
    <button class="del" aria-label="Delete room">🗑️</button>
  `;
  
  roomRow.querySelector('.del').addEventListener('click', () => {
    roomRow.remove();
    compute();
  });
  
  qs('#rooms').appendChild(roomRow);
}

/**
 * Gathers data from all room rows in the UI.
 * @returns {Array<object>} An array of room data objects.
 */
function getRoomsData() {
  return qsa('#rooms .room-row').map(row => ({
    name: row.querySelector('.r-name').value.trim() || 'Room',
    L: parseFloat(row.querySelector('.r-L').value) || 0,
    W: parseFloat(row.querySelector('.r-W').value) || 0,
    openings: parseFloat(row.querySelector('.r-openings').value) || 0,
  }));
}

// --- Main Calculation Logic ---

/**
 * Computes the total estimate based on current input values.
 */
function compute() {
  const wallHeight = readNumberFromInput('#wallHeight');
  const rooms = getRoomsData();
  const wastePercentage = readNumberFromInput('#wallWaste') / 100;
  const paintCoverage = readNumberFromInput('#paintCoverage');
  const paintPrice = readNumberFromInput('#paintPrice');
  const plasterPrice = readNumberFromInput('#plasterPrice');
  const insulationPrice = readNumberFromInput('#insulationPrice');

  let totalWallArea = 0;
  rooms.forEach(room => {
    const perimeter = calculatePerimeter(room.L, room.W);
    const grossArea = perimeter * wallHeight;
    const netArea = Math.max(0, grossArea - room.openings);
    totalWallArea += netArea;
  });

  // Apply waste margin to the total area
  totalWallArea *= (1 + wastePercentage);

  const paintRequired = totalWallArea / Math.max(paintCoverage, 0.0001); // Prevent division by zero
  const paintCost = paintRequired * paintPrice;
  const plasterCost = totalWallArea * plasterPrice;
  const insulationCost = totalWallArea * insulationPrice;
  const totalCost = paintCost + plasterCost + insulationCost;

  // Update results in the UI
  qs('#wallArea').textContent = formatNumber(totalWallArea);
  qs('#paintLiters').textContent = formatNumber(paintRequired);
  qs('#paintCost').textContent = formatNumber(paintCost);
  qs('#plasterCost').textContent = formatNumber(plasterCost);
  qs('#insulationCost').textContent = formatNumber(insulationCost);
  qs('#totalCost').textContent = formatNumber(totalCost);
}

// --- Local Storage and Data Management ---

/**
 * Saves the current project data to local storage.
 */
function saveProject() {
  const projectName = qs('#projectName').value.trim();
  const data = {
    projectName,
    wallHeight: readNumberFromInput('#wallHeight'),
    paintCoverage: readNumberFromInput('#paintCoverage'),
    paintPrice: readNumberFromInput('#paintPrice'),
    plasterPrice: readNumberFromInput('#plasterPrice'),
    insulationPrice: readNumberFromInput('#insulationPrice'),
    wallWaste: readNumberFromInput('#wallWaste'),
    rooms: getRoomsData(),
  };

  const key = projectName || 'Unnamed Project';
  const allProjects = JSON.parse(localStorage.getItem('calcbuild_projects') || '{}');
  allProjects[key] = data;
  localStorage.setItem('calcbuild_projects', JSON.stringify(allProjects));
  alert('Project saved successfully! ✅');
}

/**
 * Loads a project from local storage.
 */
function loadProject() {
  const allProjects = JSON.parse(localStorage.getItem('calcbuild_projects') || '{}');
  const projectNames = Object.keys(allProjects);

  if (!projectNames.length) {
    alert('No saved projects found.');
    return;
  }

  const promptMessage = 'Enter the name of the project to load:\n' + projectNames.join('\n');
  const projectToLoad = prompt(promptMessage);

  if (!projectToLoad || !allProjects[projectToLoad]) {
    return;
  }

  const projectData = allProjects[projectToLoad];

  // Set general project data
  qs('#projectName').value = projectData.projectName ?? '';
  qs('#wallHeight').value = projectData.wallHeight ?? 2.5;
  qs('#paintCoverage').value = projectData.paintCoverage ?? 10;
  qs('#paintPrice').value = projectData.paintPrice ?? 18;
  qs('#plasterPrice').value = projectData.plasterPrice ?? 12;
  qs('#insulationPrice').value = projectData.insulationPrice ?? 25;
  qs('#wallWaste').value = projectData.wallWaste ?? 7.5;

  // Clear existing rooms and add loaded rooms
  qs('#rooms').innerHTML = '';
  (projectData.rooms || []).forEach(addRoomRow);
  compute();
}

/**
 * Resets the application to a new, clean state.
 */
function newProject() {
  if (!confirm('Are you sure you want to clear all fields and start a new project?')) {
    return;
  }
  
  // Clear general project data
  qs('#projectName').value = '';
  qs('#wallHeight').value = 2.5;
  qs('#paintCoverage').value = 10;
  qs('#paintPrice').value = 18;
  qs('#plasterPrice').value = 12;
  qs('#insulationPrice').value = 25;
  qs('#wallWaste').value = 7.5;
  
  // Clear and re-populate rooms with defaults
  qs('#rooms').innerHTML = '';
  addRoomRow({ name: 'Living Room', L: 6, W: 4, openings: 3 });
  addRoomRow({ name: 'Bedroom', L: 3.5, W: 3, openings: 2 });
  compute();
}

/**
 * Exports the project data to a CSV file.
 */
function exportCSV() {
  const rooms = getRoomsData();
  const headers = ['Name', 'Length (m)', 'Width (m)', 'Openings (m²)'];
  const csvRows = [headers.join(';')];
  
  rooms.forEach(room => {
    csvRows.push([room.name, room.L, room.W, room.openings].join(';'));
  });

  const totals = [
    '', '', '', '',
    'Wall Area (m²)', qs('#wallArea').textContent,
    'Paint Required (L)', qs('#paintLiters').textContent,
    'Paint Cost (€)', qs('#paintCost').textContent,
    'Render Cost (€)', qs('#plasterCost').textContent,
    'Insulation Cost (€)', qs('#insulationCost').textContent,
    'Total Cost (€)', qs('#totalCost').textContent,
  ];
  
  const csvContent = csvRows.join('\n') + '\n\n' + totals.join(';');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (qs('#projectName').value.trim() || 'calcbuild_report') + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Triggers the browser's print dialog for a printable report.
 */
function printReport() {
  window.print();
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
  // Add listeners for buttons
  qs('#addRoom').addEventListener('click', () => { addRoomRow(); compute(); });
  qs('#saveProject').addEventListener('click', saveProject);
  qs('#loadProject').addEventListener('click', loadProject);
  qs('#newProject').addEventListener('click', newProject);
  qs('#exportCSV').addEventListener('click', exportCSV);
  qs('#printReport').addEventListener('click', printReport);

  // Add listeners for real-time calculation on input changes
  const inputs = qsa('input');
  inputs.forEach(input => input.addEventListener('input', compute));

  // Initialize with a new project
  newProject();
  compute();
});
