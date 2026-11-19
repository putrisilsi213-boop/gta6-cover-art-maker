// Vice Sunset Cover Studio — editor wiring.
// Owns the controls (photos, panels, layout, grade, size, caption), keeps the
// live preview in sync with the cover renderer, and exports the PNG. Photos
// are read with FileReader on this machine only and never uploaded anywhere.

import { SIZES, LAYOUTS, GRADES, defaultState, drawCover, panelRects } from './cover.js';

const $ = (id) => document.getElementById(id);
const state = defaultState();
let selectedPanel = 0;
let sampleCache = {};

function panelCount() {
  return panelRects(state.layout, 100, 100).length;
}

function activePhoto() {
  return state.panels[selectedPanel].photo;
}

function render() {
  drawCover($('cover'), state);
  $('sizeLabel').textContent = SIZES[state.size].label;
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('on', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('on', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('on', b.dataset.size === state.size);
  });
  document.querySelectorAll('[data-panel-tab]').forEach((b) => {
    const n = Number(b.dataset.panelTab);
    b.classList.toggle('on', n === selectedPanel);
    b.disabled = n >= panelCount();
    b.textContent = `Panel ${n + 1}${state.panels[n].photo ? ' ✓' : ''}`;
  });
  const p = state.panels[selectedPanel];
  $('zoom').value = p.zoom;
  $('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
  $('ox').value = p.ox;
  $('oy').value = p.oy;
  $('status').textContent = state.panels.some((q) => q.photo)
    ? `${state.panels.filter((q) => q.photo).length} photo(s) loaded — ready to export.`
    : 'Load a photo or tap a sample to start — the cover already previews with art.';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function setPanelPhoto(index, src) {
  try {
    const img = await loadImage(src);
    state.panels[index] = { photo: img, zoom: 1, ox: 0, oy: 0 };
    selectedPanel = index;
    render();
  } catch {
    $('status').textContent = 'That file could not be read as an image.';
  }
}

async function loadSample(name) {
  if (!sampleCache[name]) sampleCache[name] = `./samples/${name}.jpg`;
  await setPanelPhoto(selectedPanel, sampleCache[name]);
}

function fillAllPanels() {
  const src = activePhoto();
  if (!src) {
    $('status').textContent = 'Load a photo into the selected panel first.';
    return;
  }
  state.panels.forEach((p, i) => {
    state.panels[i] = { photo: src, zoom: p.zoom, ox: p.ox, oy: p.oy };
  });
  render();
}

function exportPng() {
  drawCover($('cover'), state);
  $('cover').toBlob((blob) => {
    if (!blob) {
      $('status').textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-sunset-cover-${state.size}-${state.layout}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $('status').textContent = `Exported ${SIZES[state.size].label} PNG — check your downloads.`;
  }, 'image/png');
}

function randomize() {
  const layouts = Object.keys(LAYOUTS);
  const grades = Object.keys(GRADES);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  state.titleSize = 0.9 + Math.random() * 0.25;
  $('titleSize').value = state.titleSize;
  render();
}

function bind() {
  $('photoFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPanelPhoto(selectedPanel, reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  document.querySelectorAll('[data-sample]').forEach((b) => {
    b.addEventListener('click', () => loadSample(b.dataset.sample));
  });
  document.querySelectorAll('[data-panel-tab]').forEach((b) => {
    b.addEventListener('click', () => {
      selectedPanel = Number(b.dataset.panelTab);
      render();
    });
  });
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.addEventListener('click', () => {
      state.layout = b.dataset.layout;
      if (selectedPanel >= panelCount()) selectedPanel = 0;
      render();
    });
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.addEventListener('click', () => {
      state.grade = b.dataset.grade;
      render();
    });
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = b.dataset.size;
      render();
    });
  });
  $('title').addEventListener('input', (e) => {
    state.title = e.target.value;
    render();
  });
  $('subtitle').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    render();
  });
  $('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    render();
  });
  $('zoom').addEventListener('input', (e) => {
    state.panels[selectedPanel].zoom = Number(e.target.value);
    render();
  });
  $('ox').addEventListener('input', (e) => {
    state.panels[selectedPanel].ox = Number(e.target.value);
    render();
  });
  $('oy').addEventListener('input', (e) => {
    state.panels[selectedPanel].oy = Number(e.target.value);
    render();
  });
  $('fillAll').addEventListener('click', fillAllPanels);
  $('random').addEventListener('click', randomize);
  $('export').addEventListener('click', exportPng);
  // Keyboard shortcut: Ctrl/Cmd+E exports, like a quick share.
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      exportPng();
    }
  });
}

// Exposed for the screenshot helper (?shot=...) and for quick console checks.
window.__cover = { state, render, loadSample, setPanelPhoto, drawCover, SIZES };
bind();
render();
