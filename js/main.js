// main.js (module)
const DATA_PATH = './data/jobs.json';
const PAGE_SIZE = 4;

const app = document.getElementById('app');
const themeToggle = () => document.getElementById('theme-toggle');
const navToggle = () => document.getElementById('nav-toggle');
const navList = () => document.getElementById('nav-list');

let JOBS = [];
let visibleCount = PAGE_SIZE;
let activeTagFilters = new Set();
let searchQ = '';
let locationFilter = '';
let typeFilter = '';
let sortBy = 'newest';

// localStorage keys
const LS_SAVED = 'jf_saved_jobs_v1';
const LS_THEME = 'jf_theme_v1';

function byId(id){ return document.getElementById(id); }

// init
document.addEventListener('DOMContentLoaded', async () => {
  hookHeader();
  await tryRegisterSW();
  renderRouter(); // initial view render
  window.addEventListener('hashchange', renderRouter);
});

async function fetchJobs(){
  // show skeleton while fetching
  await new Promise(r => setTimeout(r, 300)); // tiny delay for UX
  const res = await fetch(DATA_PATH);
  return res.json();
}

// Router
async function renderRouter(){
  const hash = location.hash.replace(/^#/, '') || '/';
  if (hash.startsWith('/job/')) {
    // job detail page
    const id = hash.split('/')[2];
    await ensureJobs();
    renderJobPage(id);
  } else if (hash === '/saved') {
    await ensureJobs();
    renderSavedPage();
  } else if (hash === '/about') {
    renderAboutPage();
  } else {
    await ensureJobs();
    renderHomePage();
  }
}

async function ensureJobs(){
  if (JOBS.length) return;
  showFullScreenSkeleton();
  try {
    JOBS = await fetchJobs();
  } catch (e){
    console.error('Failed to load jobs', e);
    JOBS = [];
  } finally {
    hideFullScreenSkeleton();
  }
}

/* ----------------- HEADER & theme ------------------ */
function hookHeader(){
  // nav toggle (mobile)
  if (navToggle()) {
    navToggle().addEventListener('click', () => {
      const expanded = navToggle().getAttribute('aria-expanded') === 'true';
      navToggle().setAttribute('aria-expanded', String(!expanded));
      navList().classList.toggle('show');
    });
  }

  // theme
  const tbtn = themeToggle();
  const saved = localStorage.getItem(LS_THEME) || 'light';
  setTheme(saved);
  if (tbtn){
    tbtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }
}
function setTheme(t){
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
  localStorage.setItem(LS_THEME, t);
  const btn = themeToggle();
  if (btn) {
    btn.setAttribute('aria-pressed', String(t === 'dark'));
    btn.textContent = t === 'dark' ? 'Light' : 'Dark';
  }
}

/* ----------------- Views ------------------ */

function showFullScreenSkeleton(){
  app.innerHTML = `
    <section class="page">
      <div class="container">
        <div class="hero">
          <div style="display:flex;gap:16px;align-items:center;">
            <div style="width:48%;"><div class="skeleton" style="height:88px;border-radius:12px"></div></div>
            <div style="width:48%"><div class="skeleton" style="height:88px;border-radius:12px"></div></div>
          </div>
        </div>

        <div class="jobs-wrap" style="margin-top:18px">
          <aside class="filters"><div class="skeleton" style="height:240px;border-radius:12px"></div></aside>
          <section style="flex:1">
            <div class="jobs-grid">
              ${Array.from({length:PAGE_SIZE}).map(()=>`<div class="job-card"><div class="skeleton" style="height:16px;width:60%"></div><div style="height:8px"></div><div class="skeleton" style="height:12px;width:90%"></div><div style="height:10px"></div><div class="skeleton" style="height:12px;width:40%"></div></div>`).join('')}
            </div>
          </section>
        </div>
      </div>
    </section>
  `;
}

function hideFullScreenSkeleton(){
  // noop; subsequent render will replace content
}

/* --------- HOME PAGE (jobs list) ---------- */
function renderHomePage(){
  // build UI skeleton
  app.innerHTML = `
    <section class="page">
      <div class="container">
        <div class="hero">
          <div class="hero-inner">
            <div class="hero-content">
              <h1>Find your next great job</h1>
              <p class="lead muted">Curated roles. Fast filtering. Save your favorites.</p>
            </div>
            <div>
              <a class="btn primary" href="#/saved">View saved</a>
            </div>
          </div>
        </div>

        <div class="jobs-wrap" style="margin-top:18px">
          <aside class="filters" id="filters-pane">
            <div class="filter-group">
              <label for="search">Search</label>
              <input id="search" class="input" type="search" placeholder="Keyword, title or company" />
            </div>

            <div class="filter-group">
              <label>Active filters</label>
              <div class="active-chips" id="active-chips"></div>
            </div>

            <div class="filter-group">
              <label for="filter-location">Location</label>
              <select id="filter-location" class="input"><option value="">Anywhere</option></select>
            </div>

            <div class="filter-group">
              <label for="filter-type">Job Type</label>
              <select id="filter-type" class="input"><option value="">Any</option></select>
            </div>

            <div class="filter-group">
              <label for="sort-by">Sort</label>
              <select id="sort-by" class="input">
                <option value="newest">Newest</option>
                <option value="title-asc">Title A→Z</option>
              </select>
            </div>

            <div class="filter-actions">
              <button id="clear-filters" class="btn">Clear</button>
            </div>
          </aside>

          <section style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <h2>Open positions</h2>
              <div class="result-count muted" id="result-count">—</div>
            </div>

            <div id="jobs-grid" class="jobs-grid" role="list" aria-live="polite"></div>

            <div style="margin-top:14px;display:flex;justify-content:center">
              <button id="load-more" class="btn">Load more</button>
            </div>
          </section>
        </div>
      </div>
    </section>
  `;

  // hook filters and initial populate
  populateFilterOptions();
  hookHomeEvents();
  applyFiltersAndRender();
}

function populateFilterOptions(){
  const locSel = byId('filter-location');
  const typeSel = byId('filter-type');

  // populate unique options from JOBS
  const locs = Array.from(new Set(JOBS.map(j => j.location))).sort();
  locSel.innerHTML = `<option value="">Anywhere</option>` + locs.map(l => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`).join('');

  const types = Array.from(new Set(JOBS.map(j => j.type))).sort();
  typeSel.innerHTML = `<option value="">Any</option>` + types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
}

function hookHomeEvents(){
  const searchEl = byId('search');
  const locEl = byId('filter-location');
  const typeEl = byId('filter-type');
  const sortEl = byId('sort-by');
  const clearEl = byId('clear-filters');
  const loadMoreBtn = byId('load-more');

  searchEl.addEventListener('input', debounce((e)=>{
    searchQ = e.target.value.trim().toLowerCase();
    visibleCount = PAGE_SIZE;
    applyFiltersAndRender();
  }, 200));

  locEl.addEventListener('change', (e)=>{ locationFilter = e.target.value; visibleCount = PAGE_SIZE; applyFiltersAndRender(); });
  typeEl.addEventListener('change', (e)=>{ typeFilter = e.target.value; visibleCount = PAGE_SIZE; applyFiltersAndRender(); });
  sortEl.addEventListener('change', (e)=>{ sortBy = e.target.value; visibleCount = PAGE_SIZE; applyFiltersAndRender(); });

  clearEl.addEventListener('click', ()=>{
    searchQ = ''; locationFilter=''; typeFilter=''; sortBy='newest'; activeTagFilters.clear(); visibleCount = PAGE_SIZE;
    byId('search').value = '';
    byId('filter-location').value = '';
    byId('filter-type').value = '';
    byId('sort-by').value = 'newest';
    renderActiveChips();
    applyFiltersAndRender();
  });

  loadMoreBtn.addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    applyFiltersAndRender();
  });
}