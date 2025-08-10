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

/* --------- Saved page ---------- */
function renderSavedPage(){
  const saved = getSavedJobs();
  app.innerHTML = `
    <section class="page">
      <div class="container">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h1>Saved jobs</h1>
          <a class="btn" href="#/">Browse</a>
        </div>

        <div style="margin-top:18px">
          ${saved.length ? `<div class="jobs-grid" id="saved-grid">${saved.map(j => renderCardHtml(j)).join('')}</div>` : `<div class="empty-state"><h3>No saved jobs</h3><p class="muted">Click the Save button on any job to add it here.</p></div>`}
        </div>
      </div>
    </section>
  `;

  // hook save/remove buttons
  const removeBtns = document.querySelectorAll('[data-action="unsave"]');
  removeBtns.forEach(b => b.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id;
    removeSavedJob(id);
    renderSavedPage();
  }));

  // hook view details on saved list
  document.querySelectorAll('[data-action="view"]').forEach(b => {
    b.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      location.hash = `#/job/${id}`;
    });
  });
}

/* --------- Job detail route ---------- */
function renderJobPage(id){
  const job = JOBS.find(j => j.id === id);
  if (!job) {
    app.innerHTML = `<section class="page"><div class="container"><h2>Job not found</h2><a class="btn" href="#/">Back</a></div></section>`;
    return;
  }

  app.innerHTML = `
    <section class="page">
      <div class="container">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:18px">
          <div style="flex:1;max-width:740px">
            <h1>${escapeHtml(job.title)}</h1>
            <div class="muted">${escapeHtml(job.company)} • ${escapeHtml(job.location)} • <span class="tag">${escapeHtml(job.type)}</span></div>
            <div style="margin-top:16px">
              <p>${escapeHtml(job.description)}</p>
            </div>

            <div style="margin-top:20px;display:flex;gap:10px">
              <button id="save-toggle" class="btn">${isSaved(job.id) ? 'Unsave' : 'Save'}</button>
              <button id="apply-btn" class="btn primary">Apply (demo)</button>
              <a class="btn" href="#/">Back to listings</a>
            </div>
          </div>

          <aside style="width:260px">
            <div class="card" style="background:var(--card);padding:14px;border-radius:12px;box-shadow:var(--shadow)">
              <h3 class="small">Job details</h3>
              <p class="muted small">Salary: ${escapeHtml(job.salary || '—')}</p>
              <p class="muted small">Posted: ${new Date(job.postedAt).toLocaleDateString()}</p>
              <div style="margin-top:10px">
                <strong class="small">Tags</strong>
                <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">${(job.tags||[]).map(t=>`<span class="tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`).join('')}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  `;

  // hooks
  byId('save-toggle').addEventListener('click', () => {
    toggleSave(job.id);
    byId('save-toggle').textContent = isSaved(job.id) ? 'Unsave' : 'Save';
  });
  byId('apply-btn').addEventListener('click', () => alert('This is a demo. Application would be submitted to the employer in a real app.'));
  // tag clicks
  document.querySelectorAll('[data-tag]').forEach(el => el.addEventListener('click', (e)=>{
    const t = e.currentTarget.dataset.tag;
    activeTagFilters.add(t);
    location.hash = '/';
    // when route changes, ensure filters reflect
    setTimeout(()=>{ /* give router time */ renderHomePage(); document.querySelector('#search')?.focus(); renderActiveChips(); applyFiltersAndRender(); }, 80);
  }));
}

/* --------- About page ---------- */
function renderAboutPage(){
  app.innerHTML = `
    <section class="page">
      <div class="container">
        <h1>About JobFinder</h1>
        <p class="muted">This is an advanced front-end prototype of a job board built with plain HTML/CSS/JS. It demonstrates filtering, local persistence, offline caching, and client-side routing.</p>
        <p style="margin-top:18px"><a class="btn" href="#/">Browse jobs</a></p>
      </div>
    </section>
  `;
}

/* ----------------- Filtering and rendering jobs ------------------ */
function applyFiltersAndRender(){
  const grid = byId('jobs-grid');
  if (!grid) return;

  let filtered = JOBS.filter(job => {
    const text = `${job.title} ${job.company} ${job.description} ${(job.tags||[]).join(' ')}`.toLowerCase();
    if (searchQ && !text.includes(searchQ)) return false;
    if (locationFilter && job.location !== locationFilter) return false;
    if (typeFilter && job.type !== typeFilter) return false;
    if (activeTagFilters.size) {
      const has = [...activeTagFilters].every(tag => (job.tags||[]).includes(tag));
      if (!has) return false;
    }
    return true;
  });

  // sort
  if (sortBy === 'title-asc') filtered.sort((a,b)=> a.title.localeCompare(b.title));
  else filtered.sort((a,b)=> new Date(b.postedAt) - new Date(a.postedAt));

  const total = filtered.length;
  const slice = filtered.slice(0, visibleCount);

  // render
  byId('result-count').textContent = `${total} result${total !== 1 ? 's' : ''}`;
  grid.innerHTML = slice.map(j => renderCardHtml(j)).join('');

  // tag click hooks and view/apply/save
  grid.querySelectorAll('.tag').forEach(el => {
    el.addEventListener('click', (e) => {
      const t = e.currentTarget.dataset.tag;
      activeTagFilters.add(t);
      renderActiveChips();
      visibleCount = PAGE_SIZE;
      applyFiltersAndRender();
      // scroll to top of results
      window.scrollTo({top: document.querySelector('.jobs-wrap').offsetTop - 80, behavior:'smooth'});
    });
  });

  grid.querySelectorAll('[data-action="view"]').forEach(b => {
    b.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      location.hash = `#/job/${id}`;
    });
  });
  grid.querySelectorAll('[data-action="save"]').forEach(b => {
    b.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      toggleSave(id);
      // re-render to update button text
      applyFiltersAndRender();
    });
  });

  // show/hide load more
  const loadMore = byId('load-more');
  if (visibleCount >= total) loadMore.style.display = 'none';
  else loadMore.style.display = 'inline-block';

  renderActiveChips();
}

function renderCardHtml(job){
  return `
    <div class="job-card" role="listitem" aria-label="${escapeHtml(job.title)} at ${escapeHtml(job.company)}">
      <div>
        <h3>${escapeHtml(job.title)}</h3>
        <div class="job-meta">
          <span class="muted">${escapeHtml(job.company)}</span>
          <span>•</span>
          <span class="muted">${escapeHtml(job.location)}</span>
          <span>•</span>
          <span class="tag" data-tag="${escapeHtml((job.type || '').toString())}">${escapeHtml(job.type)}</span>
        </div>
        <p class="job-desc">${escapeHtml(truncate(job.description, 140))}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
          ${(job.tags||[]).slice(0,4).map(t => `<span class="tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>

      <div class="job-actions">
        <button class="btn" data-action="view" data-id="${escapeHtml(job.id)}">View</button>
        <button class="btn primary" data-action="apply" data-id="${escapeHtml(job.id)}" onclick="alert('Demo: apply flow')">Apply</button>
        <button class="btn" data-action="save" data-id="${escapeHtml(job.id)}">${isSaved(job.id) ? 'Unsave' : 'Save'}</button>
      </div>
    </div>
  `;
}