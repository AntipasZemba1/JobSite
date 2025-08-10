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