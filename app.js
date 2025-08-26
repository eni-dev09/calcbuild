// CalcBuild — simple local-first estimator
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

function fmt(n) {
  const num = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(num);
}

function readNumber(id) { return parseFloat(qs(id).value || '0') || 0; }

function addRoomRow(room = { name: '', L: 4, W: 3, openings: 2 }) {
  const wrap = document.createElement('div');
  wrap.className = 'room-row';
  wrap.innerHTML = `
    <input class="r-name" placeholder="Séjour / Chambre / Cuisine" value="${room.name || ''}" />
    <input class="r-L" type="number" min="0" step="0.01" value="${room.L ?? 4}" />
    <input class="r-W" type="number" min="0" step="0.01" value="${room.W ?? 3}" />
    <input class="r-openings" type="number" min="0" step="0.01" value="${room.openings ?? 2}" />
    <button class="del">🗑️</button>
  `;
  wrap.querySelector('.del').addEventListener('click', () => {
    wrap.remove();
    compute();
  });
  qs('#rooms').appendChild(wrap);
}

function getRooms() {
  return qsa('#rooms .room-row').map(row => ({
    name: row.querySelector('.r-name').value.trim() || 'Pièce',
    L: parseFloat(row.querySelector('.r-L').value || '0') || 0,
    W: parseFloat(row.querySelector('.r-W').value || '0') || 0,
    openings: parseFloat(row.querySelector('.r-openings').value || '0') || 0,
  }));
}

function perimeter(L, W) { return 2 * (L + W); }

function compute() {
  const H = readNumber('#wallHeight');
  const rooms = getRooms();
  const waste = readNumber('#wallWaste') / 100;
  const coverage = readNumber('#paintCoverage');
  const pricePaint = readNumber('#paintPrice');
  const pricePlaster = readNumber('#plasterPrice');
  const priceIns = readNumber('#insulationPrice');

  // Wall area per room: (perimeter * H - openings) with waste
  let totalWallArea = 0;
  rooms.forEach(r => {
    const gross = perimeter(r.L, r.W) * H;
    const net = Math.max(0, gross - r.openings);
    totalWallArea += net;
  });
  totalWallArea *= (1 + waste);

  const liters = totalWallArea / Math.max(coverage, 0.0001);
  const paintCost = liters * pricePaint;
  const plasterCost = totalWallArea * pricePlaster;
  const insCost = totalWallArea * priceIns;
  const totalCost = paintCost + plasterCost + insCost;

  qs('#wallArea').textContent = fmt(totalWallArea);
  qs('#paintLiters').textContent = fmt(liters);
  qs('#paintCost').textContent = fmt(paintCost);
  qs('#plasterCost').textContent = fmt(plasterCost);
  qs('#insulationCost').textContent = fmt(insCost);
  qs('#totalCost').textContent = fmt(totalCost);
}

function saveProject() {
  const data = {
    projectName: qs('#projectName').value.trim(),
    wallHeight: readNumber('#wallHeight'),
    paintCoverage: readNumber('#paintCoverage'),
    paintPrice: readNumber('#paintPrice'),
    plasterPrice: readNumber('#plasterPrice'),
    insulationPrice: readNumber('#insulationPrice'),
    wallWaste: readNumber('#wallWaste'),
    rooms: getRooms(),
  };
  const key = data.projectName || 'Projet sans nom';
  const all = JSON.parse(localStorage.getItem('calcbuild_projects') || '{}');
  all[key] = data;
  localStorage.setItem('calcbuild_projects', JSON.stringify(all));
  alert('Projet enregistré ✅');
}

function loadProject() {
  const all = JSON.parse(localStorage.getItem('calcbuild_projects') || '{}');
  const names = Object.keys(all);
  if (!names.length) { alert('Aucun projet enregistré.'); return; }
  const pick = prompt('Nom du projet à charger:\n' + names.join('\n'));
  if (!pick || !all[pick]) return;
  const d = all[pick];
  qs('#projectName').value = d.projectName || '';
  qs('#wallHeight').value = d.wallHeight ?? 2.5;
  qs('#paintCoverage').value = d.paintCoverage ?? 10;
  qs('#paintPrice').value = d.paintPrice ?? 18;
  qs('#plasterPrice').value = d.plasterPrice ?? 12;
  qs('#insulationPrice').value = d.insulationPrice ?? 25;
  qs('#wallWaste').value = d.wallWaste ?? 7.5;
  qs('#rooms').innerHTML = '';
  (d.rooms || []).forEach(addRoomRow);
  compute();
}

function newProject() {
  if (!confirm('Effacer les champs et repartir à zéro ?')) return;
  qs('#projectName').value = '';
  qs('#rooms').innerHTML = '';
  addRoomRow({ name: 'Séjour', L: 6, W: 4, openings: 3 });
  addRoomRow({ name: 'Chambre', L: 3.5, W: 3, openings: 2 });
  compute();
}

function exportCSV() {
  const rooms = getRooms();
  const lines = [['Nom','L (m)','W (m)','Ouvertures (m²)']];
  rooms.forEach(r => lines.push([r.name, r.L, r.W, r.openings]));
  const totals = [
    '', '', '', '',
    'Surface murs (m²)', qs('#wallArea').textContent,
    'Peinture (L)', qs('#paintLiters').textContent,
    'Coût peinture (€)', qs('#paintCost').textContent,
    'Enduit (€)', qs('#plasterCost').textContent,
    'Isolation (€)', qs('#insulationCost').textContent,
    'Total (€)', qs('#totalCost').textContent,
  ];
  const csv = lines.map(row => row.join(';')).join('\n') + '\n\n' + totals.join(';');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (qs('#projectName').value.trim() || 'calcbuild') + '.csv';
  a.click();
}

function printReport() { window.print(); }

// Event bindings
qs('#addRoom').addEventListener('click', () => { addRoomRow(); compute(); });
qs('#saveProject').addEventListener('click', saveProject);
qs('#loadProject').addEventListener('click', loadProject);
qs('#newProject').addEventListener('click', newProject);
qs('#exportCSV').addEventListener('click', exportCSV);
qs('#printReport').addEventListener('click', printReport);
['#projectName','#wallHeight','#paintCoverage','#paintPrice','#plasterPrice','#insulationPrice','#wallWaste'].forEach(id => {
  qs(id).addEventListener('input', compute);
});

// Seed
newProject();
compute();
