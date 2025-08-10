# Klick Jobs

**Klick Jobs** is a modern, lightweight job board front-end prototype built with plain HTML, CSS, and JavaScript. It features client-side routing, offline caching, advanced filtering, local persistence for saved jobs, and theme toggling (light/dark mode).

---

## Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Customization](#customization)
- [Accessibility](#accessibility)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Demo


_This project can be run locally by serving the files or deployed to any static hosting._

---

## Features

- **Job Listings:** Browse curated job roles with essential information.
- **Search & Filtering:** Filter jobs by keyword, location, job type, tags, and sort results.
- **Pagination:** Load jobs in batches for a faster and cleaner UI.
- **Saved Jobs:** Save and unsave jobs with persistence using `localStorage`.
- **Job Detail View:** View detailed job information and easily apply (demo flow).
- **Dark Mode:** Toggle between light and dark themes, with preference saved across sessions.
- **Client-side Routing:** Navigate seamlessly between Home, Saved Jobs, Job Details, and About pages without page reloads.
- **Accessibility:** Semantic HTML and ARIA attributes for screen readers and keyboard navigation.
- **Offline Support:** Service worker registration for offline caching (assumed from the code comments).
- **Responsive Design:** Mobile-friendly navigation and layout.

---

## Technologies Used

- **HTML5** and **CSS3** (with Google Fonts: Inter & Poppins)
- **Vanilla JavaScript (ES Modules)**
- **LocalStorage** for persistence
- **Fetch API** for data retrieval
- **Service Worker** (registration code present) for offline caching
- Client-side routing using `window.location.hash`

---

## Project Structure

```

/ (root)
├── index.html          # Main HTML page
├── css/
│   └── style.css       # Stylesheet
├── js/
│   └── main.js         # Main JavaScript logic (module)
├── data/
│   └── jobs.json       # JSON file with job listings data
└── README.md           # Project documentation

````

---

## Getting Started

### Installation

1. Clone the repository or download the source files.

```bash
git clone https://github.com/AntipasZemba1/JobSite/
cd JobSite
````

2. Serve the files with a local server (recommended):

```bash
# Python 3
python3 -m http.server 8000
```

3. Open your browser and navigate to `http://localhost:8000`.

---

## Usage

* **Browse jobs:** View available jobs on the homepage.
* **Filter jobs:** Use search, location, type, and sorting dropdowns.
* **Save jobs:** Click the **Save** button on job cards or job details to bookmark jobs.
* **View saved jobs:** Navigate to the **Saved** page from the top navigation.
* **View job details:** Click **View** on any job card to see detailed information.
* **Apply for jobs:** The **Apply** button simulates a job application flow.
* **Toggle theme:** Click the **Mode** button in the header to switch between light and dark themes.
* **Navigate:** Use the top navigation or browser back/forward buttons for seamless routing.

---

## Customization

* **Jobs data:** Modify `data/jobs.json` to add or update job listings.
* **Styling:** Update `css/style.css` to change visual appearance.
* **Fonts:** Change fonts by editing the Google Fonts link in `index.html`.
* **Pagination size:** Adjust the `PAGE_SIZE` constant in `js/main.js` for how many jobs show per page.
* **Theme:** Modify or extend theme colors via CSS variables in `style.css`.

---

## Accessibility

* Semantic HTML elements and ARIA roles are used for navigation and dialogs.
* Keyboard-friendly navigation and focus management.
* Contrast-optimized color schemes for light/dark modes.
* Live regions announce job list updates for screen readers.

---

## Future Improvements

* Implement backend API integration for live job data.
* Add user authentication for persistent saved jobs across devices.
* Enhance job application flow with real submission.
* Improve offline capabilities with a full-featured service worker.
* Add internationalization/localization support.
* Include unit and integration tests.

---

## License

Copyright © 2025 Antipas Zemba. All Rights Reserved.

---
