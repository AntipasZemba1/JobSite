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

