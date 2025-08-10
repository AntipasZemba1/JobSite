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