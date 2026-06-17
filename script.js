/* ═══════════════════════════════════════════════════════════
   SUDIPTA.DEV — script.js
   Vanilla JS · No dependencies · GitHub Pages compatible
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── CONFIG ─────────────────────────────────────────────── */
const BASE = '';   // set to '' for root GitHub Pages; '/repo-name' if project page
const DATA = `${BASE}/data`;

/* ─── STATE ──────────────────────────────────────────────── */
const state = {
  projects:    [],
  apps:        [],
  posts:       [],
  notes:       [],
  experiments: [],
  journey:     [],
  profile:     {},
  activeFilter: 'all',
  activeBlogFilter: 'all',
  activeVaultTab: null,
  searchIndex:  [],
};

/* ─── HELPERS ────────────────────────────────────────────── */
async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn(`fetchJSON failed: ${url}`, e);
    return null;
  }
}

function el(tag, cls, html) {
  const d = document.createElement(tag);
  if (cls) d.className = cls;
  if (html !== undefined) d.innerHTML = html;
  return d;
}

function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function tagsHtml(tags = []) {
  return tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
}

function showToast(msg, duration = 2800) {
  const t = qs('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

/* ─── NAV ────────────────────────────────────────────────── */
function initNav() {
  const nav    = qs('#nav');
  const burger = qs('#navHamburger');
  const menu   = qs('#navMenu');

  // Scroll style
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Hamburger
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('open', !open);
  });

  // Close menu on link click
  qsa('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
    });
  });

  // Active link on scroll
  const sections = qsa('section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        qsa('.nav-link').forEach(a => {
          a.classList.toggle('active', a.getAttribute('data-nav') === e.target.id);
        });
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(s => observer.observe(s));
}

/* ─── HERO TERMINAL ANIMATION ────────────────────────────── */
function initTerminal() {
  const out1 = qs('#termOut1');
  const out2 = qs('#termOut2');

  function typeText(el, text, delay = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        let i = 0;
        el.innerHTML = '';
        const tick = setInterval(() => {
          el.innerHTML += text[i] === '<'
            ? text.slice(i, text.indexOf('>', i) + 1)
            : escapeHtml(text[i]);
          i++;
          if (i >= text.length) { clearInterval(tick); resolve(); }
        }, 28);
      }, delay);
    });
  }

  async function run() {
    await typeText(out1, 'sudipta — AI developer, Python builder, Android tinkerer', 600);
    await typeText(out2, 'AI · ML · Automation · History · Geography · Productivity', 1200);
  }

  run();
}

/* ─── PROFILE / HERO BADGES ──────────────────────────────── */
async function loadProfile() {
  const data = await fetchJSON(`${DATA}/profile.json`);
  if (!data) return;
  state.profile = data;

  // Badges
  const container = qs('#heroBadges');
  if (container && data.badges) {
    container.innerHTML = data.badges
      .map(b => `<span class="hero-badge">${escapeHtml(b)}</span>`)
      .join('');
  }

  // About section
  const bio = qs('#aboutBio');
  if (bio && data.bio) {
    bio.innerHTML = data.bio.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  }

  // Skills
  const skills = qs('#skillsBlock');
  if (skills && data.skills) {
    skills.innerHTML = data.skills.map(group => `
      <div class="skill-group">
        <h4 class="skill-group-title">${escapeHtml(group.category)}</h4>
        <div class="skill-tags">${group.items.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
      </div>
    `).join('');
  }

  // Stats
  const stats = qs('#aboutStats');
  if (stats && data.stats) {
    stats.innerHTML = data.stats.map(s => `
      <div class="about-stat">
        <span class="about-stat-value">${escapeHtml(String(s.value))}</span>
        <span class="about-stat-label">${escapeHtml(s.label)}</span>
      </div>
    `).join('');
  }

  // Footer year
  const yr = qs('#footerYear');
  if (yr) yr.textContent = new Date().getFullYear();

  // Contact
  const contact = qs('#contactGrid');
  if (contact && data.contact) {
    contact.innerHTML = data.contact.map(c => `
      <a class="contact-card" href="${escapeHtml(c.url)}" target="_blank" rel="noopener">
        <div class="contact-icon">${c.icon}</div>
        <div>
          <div class="contact-label">${escapeHtml(c.label)}</div>
          <div class="contact-value">${escapeHtml(c.value)}</div>
        </div>
      </a>
    `).join('');
  }
}

/* ─── PROJECTS ───────────────────────────────────────────── */
async function loadProjects() {
  const data = await fetchJSON(`${DATA}/projects.json`);
  if (!data) return;
  state.projects = data.projects || [];
  renderProjects();
  buildProjectFilters();
  renderFeatured();
}

function buildProjectFilters() {
  const bar = qs('.filter-bar');
  const categories = [...new Set(state.projects.map(p => p.category).filter(Boolean))];
  categories.forEach(cat => {
    const btn = el('button', 'filter-btn', escapeHtml(cat));
    btn.dataset.filter = cat;
    bar.appendChild(btn);
  });

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    qsa('.filter-btn', bar).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeFilter = btn.dataset.filter;
    renderProjects();
  });
}

function renderProjects() {
  const grid = qs('#projectsGrid');
  const filtered = state.activeFilter === 'all'
    ? state.projects
    : state.projects.filter(p => p.category === state.activeFilter);

  if (!filtered.length) {
    grid.innerHTML = '<p class="empty-msg">No projects in this category yet.</p>';
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <article class="project-card reveal" role="listitem" data-id="${escapeHtml(p.id)}">
      <div class="project-card-top">
        <div class="project-icon">${p.icon || '🛠️'}</div>
        <div class="project-links">
          ${p.github ? `<a href="${escapeHtml(p.github)}" target="_blank" rel="noopener" class="project-link-icon" aria-label="GitHub" title="View on GitHub">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
          </a>` : ''}
          ${p.demo ? `<a href="${escapeHtml(p.demo)}" target="_blank" rel="noopener" class="project-link-icon" aria-label="Live demo" title="Live demo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>` : ''}
        </div>
      </div>
      <h3 class="project-title">${escapeHtml(p.title)}</h3>
      <p class="project-desc">${escapeHtml(p.summary)}</p>
      <div class="project-tags">${tagsHtml(p.tags)}</div>
      <button class="project-more" data-id="${escapeHtml(p.id)}">Details →</button>
    </article>
  `).join('');

  // Attach modal triggers
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.project-more');
    if (btn) openProjectModal(btn.dataset.id);
  });

  revealObserver();
}

function renderFeatured() {
  const featured = state.projects.filter(p => p.featured).slice(0, 3);
  const container = qs('#featuredCards');
  if (!container || !featured.length) return;

  container.innerHTML = featured.map(p => `
    <div class="featured-card reveal" data-id="${escapeHtml(p.id)}" role="button" tabindex="0" aria-label="View project: ${escapeHtml(p.title)}">
      <div class="featured-card-icon">${p.icon || '🛠️'}</div>
      <div>
        <div class="featured-card-title">${escapeHtml(p.title)}</div>
        <div class="featured-card-desc">${escapeHtml(p.summary)}</div>
      </div>
    </div>
  `).join('');

  container.addEventListener('click', e => {
    const card = e.target.closest('.featured-card');
    if (card) openProjectModal(card.dataset.id);
  });

  revealObserver();
}

/* ─── PROJECT MODAL ──────────────────────────────────────── */
function openProjectModal(id) {
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  const content = qs('#modalContent');
  content.innerHTML = `
    <div class="modal-header">
      <span class="modal-icon">${p.icon || '🛠️'}</span>
      <div>
        <h2 class="modal-title" id="modalTitle">${escapeHtml(p.title)}</h2>
        <div class="modal-meta">
          <span class="tag">${escapeHtml(p.category || '')}</span>
          ${p.status ? `<span class="status-badge status-badge--${escapeHtml(p.status)}">${escapeHtml(p.status)}</span>` : ''}
        </div>
      </div>
    </div>
    <p class="modal-desc">${escapeHtml(p.description || p.summary)}</p>
    ${p.features && p.features.length ? `
      <h4 class="modal-subhead">Features</h4>
      <ul class="modal-list">${p.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
    ` : ''}
    <div class="modal-tags">${tagsHtml(p.tags)}</div>
    <div class="modal-actions">
      ${p.github ? `<a href="${escapeHtml(p.github)}" class="btn btn--primary" target="_blank" rel="noopener">View on GitHub</a>` : ''}
      ${p.demo ? `<a href="${escapeHtml(p.demo)}" class="btn btn--ghost" target="_blank" rel="noopener">Live Demo</a>` : ''}
    </div>
  `;
  openModal('#projectModal');
}

/* ─── APPS ───────────────────────────────────────────────── */
async function loadApps() {
  const data = await fetchJSON(`${DATA}/apps.json`);
  if (!data) return;
  state.apps = data.apps || [];
  renderApps(state.apps);
  initAppsSearch();
}

function renderApps(apps) {
  const grid = qs('#appsGrid');
  if (!apps.length) {
    grid.innerHTML = '<p class="empty-msg">No apps published yet.</p>';
    return;
  }
  grid.innerHTML = apps.map(app => `
    <article class="app-card reveal" role="listitem">
      <div class="app-card-header">
        <div class="app-icon-wrap">
          ${app.icon_url
            ? `<img src="${escapeHtml(app.icon_url)}" alt="${escapeHtml(app.name)} icon" class="app-icon-img" loading="lazy" />`
            : `<div class="app-icon-placeholder">${(app.name[0] || '?').toUpperCase()}</div>`}
        </div>
        <div>
          <h3 class="app-name">${escapeHtml(app.name)}</h3>
          <span class="app-version">v${escapeHtml(app.version)}</span>
        </div>
      </div>
      <p class="app-desc">${escapeHtml(app.summary)}</p>
      <div class="app-tags">${tagsHtml(app.tags)}</div>
      <div class="app-actions">
        ${app.apk_url ? `<a href="${escapeHtml(app.apk_url)}" class="btn btn--primary" download>↓ Download APK</a>` : ''}
        <button class="btn btn--ghost app-details-btn" data-id="${escapeHtml(app.id)}">Details</button>
      </div>
    </article>
  `).join('');

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.app-details-btn');
    if (btn) openAppModal(btn.dataset.id);
  });

  revealObserver();
}

function initAppsSearch() {
  const input = qs('#appsSearchInput');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const filtered = !q ? state.apps
      : state.apps.filter(a =>
          a.name.toLowerCase().includes(q) ||
          (a.summary || '').toLowerCase().includes(q) ||
          (a.tags || []).some(t => t.toLowerCase().includes(q))
        );
    renderApps(filtered);
  });
}

function openAppModal(id) {
  const app = state.apps.find(x => x.id === id);
  if (!app) return;
  const content = qs('#appModalContent');
  content.innerHTML = `
    <div class="modal-header">
      <div class="app-icon-wrap">
        ${app.icon_url
          ? `<img src="${escapeHtml(app.icon_url)}" alt="" class="app-icon-img" />`
          : `<div class="app-icon-placeholder">${(app.name[0] || '?').toUpperCase()}</div>`}
      </div>
      <div>
        <h2 class="modal-title" id="appModalTitle">${escapeHtml(app.name)}</h2>
        <span class="app-version">v${escapeHtml(app.version)} · ${escapeHtml(app.platform || 'Android')}</span>
      </div>
    </div>
    <p class="modal-desc">${escapeHtml(app.description || app.summary)}</p>
    ${app.screenshots && app.screenshots.length ? `
      <div class="app-screenshots">
        ${app.screenshots.map(s => `<img src="${escapeHtml(s)}" alt="Screenshot" class="app-screenshot" loading="lazy" />`).join('')}
      </div>
    ` : ''}
    ${app.changelog && app.changelog.length ? `
      <h4 class="modal-subhead">Changelog</h4>
      <ul class="modal-list">
        ${app.changelog.map(c => `<li><strong>${escapeHtml(c.version)}</strong> — ${escapeHtml(c.note)}</li>`).join('')}
      </ul>
    ` : ''}
    <div class="modal-tags">${tagsHtml(app.tags)}</div>
    <div class="modal-actions">
      ${app.apk_url ? `<a href="${escapeHtml(app.apk_url)}" class="btn btn--primary" download>↓ Download APK</a>` : ''}
      ${app.github ? `<a href="${escapeHtml(app.github)}" class="btn btn--ghost" target="_blank" rel="noopener">Source Code</a>` : ''}
    </div>
  `;
  openModal('#appModal');
}

/* ─── JOURNEY / TIMELINE ─────────────────────────────────── */
async function loadJourney() {
  const data = await fetchJSON(`${DATA}/journey.json`);
  if (!data) return;

  const timeline = qs('#timeline');
  if (timeline && data.milestones) {
    timeline.innerHTML = data.milestones.map((m, i) => `
      <div class="timeline-item reveal" role="listitem">
        <div class="timeline-marker ${m.type === 'goal' ? 'timeline-marker--goal' : ''}"></div>
        <div class="timeline-card">
          <time class="timeline-date" datetime="${escapeHtml(m.date)}">${formatDate(m.date)}</time>
          <h3 class="timeline-title">${escapeHtml(m.title)}</h3>
          <p class="timeline-desc">${escapeHtml(m.description)}</p>
          ${m.tags ? `<div class="timeline-tags">${tagsHtml(m.tags)}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  const goals = qs('#goalsList');
  if (goals && data.goals) {
    goals.innerHTML = data.goals.map(g => `
      <li class="goal-item" role="listitem">
        <span class="goal-icon">${g.done ? '✅' : '🎯'}</span>
        <span class="${g.done ? 'goal-done' : ''}">${escapeHtml(g.text)}</span>
      </li>
    `).join('');
  }

  revealObserver();
}

/* ─── KNOWLEDGE VAULT ────────────────────────────────────── */
async function loadVault() {
  const data = await fetchJSON(`${DATA}/notes.json`);
  if (!data) return;
  state.notes = data.categories || [];
  renderVaultTabs();
}

function renderVaultTabs() {
  const tabs = qs('#vaultTabs');
  if (!tabs || !state.notes.length) return;

  tabs.innerHTML = state.notes.map((cat, i) => `
    <button class="vault-tab ${i === 0 ? 'active' : ''}" 
            role="tab" 
            aria-selected="${i === 0}" 
            data-tab="${escapeHtml(cat.id)}">
      ${cat.icon || ''} ${escapeHtml(cat.label)}
    </button>
  `).join('');

  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.vault-tab');
    if (!btn) return;
    qsa('.vault-tab', tabs).forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    renderVaultContent(btn.dataset.tab);
  });

  // Load first tab
  renderVaultContent(state.notes[0].id);
}

function renderVaultContent(tabId) {
  const cat = state.notes.find(c => c.id === tabId);
  const content = qs('#vaultContent');
  if (!cat || !content) return;

  content.innerHTML = `
    <div class="vault-notes-grid">
      ${cat.notes.map(note => `
        <div class="note-card reveal">
          <div class="note-card-header">
            <h3 class="note-title">${escapeHtml(note.title)}</h3>
            <time class="note-date">${formatDate(note.updated)}</time>
          </div>
          <p class="note-summary">${escapeHtml(note.summary)}</p>
          ${note.points && note.points.length ? `
            <ul class="note-points">
              ${note.points.map(pt => `<li>${escapeHtml(pt)}</li>`).join('')}
            </ul>
          ` : ''}
          ${note.tags ? `<div class="note-tags">${tagsHtml(note.tags)}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  revealObserver();
}

/* ─── EXPERIMENTS ────────────────────────────────────────── */
async function loadExperiments() {
  const data = await fetchJSON(`${DATA}/experiments.json`);
  if (!data) return;
  state.experiments = data.experiments || [];

  const grid = qs('#experimentsGrid');
  if (!grid) return;

  grid.innerHTML = state.experiments.map(exp => `
    <div class="experiment-card reveal" role="listitem">
      <div class="experiment-header">
        <span class="experiment-icon">${exp.icon || '🧪'}</span>
        <span class="experiment-status experiment-status--${escapeHtml(exp.status || 'idea')}">${escapeHtml(exp.status || 'idea')}</span>
      </div>
      <h3 class="experiment-title">${escapeHtml(exp.title)}</h3>
      <p class="experiment-desc">${escapeHtml(exp.description)}</p>
      ${exp.tags ? `<div class="experiment-tags">${tagsHtml(exp.tags)}</div>` : ''}
      ${exp.url ? `<a href="${escapeHtml(exp.url)}" class="experiment-link" target="_blank" rel="noopener">Try it →</a>` : ''}
    </div>
  `).join('');

  revealObserver();
}

/* ─── BLOG ───────────────────────────────────────────────── */
async function loadBlog() {
  const data = await fetchJSON(`${DATA}/posts.json`);
  if (!data) return;
  state.posts = data.posts || [];
  renderBlog();
  buildBlogFilters();
}

function buildBlogFilters() {
  const bar = qs('.blog-filter');
  const categories = [...new Set(state.posts.map(p => p.category).filter(Boolean))];
  categories.forEach(cat => {
    const btn = el('button', 'filter-btn', escapeHtml(cat));
    btn.dataset.blogFilter = cat;
    bar.appendChild(btn);
  });

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    qsa('.filter-btn', bar).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeBlogFilter = btn.dataset.blogFilter || 'all';
    renderBlog();
  });
}

function renderBlog() {
  const grid = qs('#blogGrid');
  const filtered = state.activeBlogFilter === 'all'
    ? state.posts
    : state.posts.filter(p => p.category === state.activeBlogFilter);

  if (!filtered.length) {
    grid.innerHTML = '<p class="empty-msg">No posts yet.</p>';
    return;
  }

  grid.innerHTML = filtered.map(post => `
    <article class="blog-card reveal" role="listitem">
      <div class="blog-card-meta">
        <span class="tag">${escapeHtml(post.category)}</span>
        <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
      </div>
      <h3 class="blog-title">${escapeHtml(post.title)}</h3>
      <p class="blog-summary">${escapeHtml(post.summary)}</p>
      <div class="blog-footer">
        <div class="blog-tags">${tagsHtml(post.tags)}</div>
        <button class="blog-read-btn" data-id="${escapeHtml(post.id)}">Read →</button>
      </div>
    </article>
  `).join('');

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.blog-read-btn');
    if (btn) openBlogModal(btn.dataset.id);
  });

  revealObserver();
}

function openBlogModal(id) {
  const post = state.posts.find(p => p.id === id);
  if (!post) return;
  const content = qs('#blogModalContent');

  // Simple markdown-like rendering for content
  const bodyHtml = renderMarkdown(post.content || post.summary);

  content.innerHTML = `
    <header class="blog-modal-header">
      <div class="blog-modal-meta">
        <span class="tag">${escapeHtml(post.category)}</span>
        <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
      </div>
      <h1 class="blog-modal-title" id="blogModalTitle">${escapeHtml(post.title)}</h1>
      <p class="blog-modal-summary">${escapeHtml(post.summary)}</p>
      <div class="blog-modal-tags">${tagsHtml(post.tags)}</div>
    </header>
    <div class="blog-modal-body prose">
      ${bodyHtml}
    </div>
  `;
  openModal('#blogModal');
}

/* ─── SIMPLE MARKDOWN RENDERER ───────────────────────────── */
function renderMarkdown(md = '') {
  return md
    .split('\n\n')
    .map(block => {
      block = block.trim();
      if (!block) return '';
      // Headings
      if (/^#{3}\s/.test(block)) return `<h3>${escapeHtml(block.replace(/^###\s+/, ''))}</h3>`;
      if (/^#{2}\s/.test(block)) return `<h2>${escapeHtml(block.replace(/^##\s+/, ''))}</h2>`;
      if (/^#\s/.test(block)) return `<h1>${escapeHtml(block.replace(/^#\s+/, ''))}</h1>`;
      // Code block
      if (block.startsWith('```')) {
        const code = block.replace(/^```[^\n]*\n/, '').replace(/```$/, '');
        return `<pre><code>${escapeHtml(code)}</code></pre>`;
      }
      // Unordered list
      if (block.split('\n').every(l => /^[-*]\s/.test(l))) {
        const items = block.split('\n').map(l => `<li>${escapeHtml(l.replace(/^[-*]\s+/, ''))}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      // Inline formatting: bold, code
      let para = escapeHtml(block)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code>$1</code>');
      return `<p>${para}</p>`;
    })
    .join('\n');
}

/* ─── MODAL SYSTEM ───────────────────────────────────────── */
function openModal(sel) {
  const overlay = qs(sel);
  overlay.hidden = false;
  overlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  const closeBtn = overlay.querySelector('.modal-close');
  if (closeBtn) closeBtn.focus();
}

function closeModal(sel) {
  const overlay = qs(sel);
  if (overlay) {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }
}

function initModals() {
  const modals = [
    { overlay: '#projectModal', close: '#modalClose' },
    { overlay: '#appModal',     close: '#appModalClose' },
    { overlay: '#blogModal',    close: '#blogModalClose' },
  ];

  modals.forEach(({ overlay, close }) => {
    const el = qs(overlay);
    if (!el) return;

    qs(close, el)?.addEventListener('click', () => closeModal(overlay));
    el.addEventListener('click', e => {
      if (e.target === el) closeModal(overlay);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      modals.forEach(({ overlay }) => closeModal(overlay));
      closeSearch();
    }
  });
}

/* ─── SEARCH ─────────────────────────────────────────────── */
function buildSearchIndex() {
  const idx = [];
  state.projects.forEach(p => idx.push({ type: 'project', title: p.title, desc: p.summary, section: 'projects', id: p.id }));
  state.apps.forEach(a => idx.push({ type: 'app', title: a.name, desc: a.summary, section: 'apps', id: a.id }));
  state.posts.forEach(p => idx.push({ type: 'post', title: p.title, desc: p.summary, section: 'blog', id: p.id }));
  state.experiments.forEach(e => idx.push({ type: 'lab', title: e.title, desc: e.description, section: 'experiments', id: e.id }));
  state.notes.forEach(cat => {
    cat.notes.forEach(n => idx.push({ type: 'note', title: n.title, desc: n.summary, section: 'vault', id: cat.id }));
  });
  state.searchIndex = idx;
}

function initSearch() {
  const overlay  = qs('#searchOverlay');
  const input    = qs('#searchInput');
  const results  = qs('#searchResults');
  const fabBtn   = qs('#fabSearch');
  let focusIdx   = -1;

  function openSearch() {
    overlay.classList.add('open');
    input.focus();
    input.value = '';
    results.innerHTML = '';
  }

  function closeSearch() {
    overlay.classList.remove('open');
    input.blur();
  }

  fabBtn.addEventListener('click', openSearch);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });

  // Keyboard shortcut: / or Ctrl+K
  document.addEventListener('keydown', e => {
    if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !overlay.classList.contains('open')) {
      e.preventDefault();
      openSearch();
    }
  });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    focusIdx = -1;
    if (!q) { results.innerHTML = ''; return; }

    const hits = state.searchIndex
      .filter(item =>
        item.title.toLowerCase().includes(q) ||
        (item.desc || '').toLowerCase().includes(q)
      )
      .slice(0, 8);

    if (!hits.length) {
      results.innerHTML = `<div class="search-empty">No results for "${escapeHtml(q)}"</div>`;
      return;
    }

    results.innerHTML = hits.map((h, i) => `
      <div class="search-result-item" role="option" data-idx="${i}" data-section="${h.section}" data-id="${escapeHtml(h.id || '')}">
        <span class="search-result-type">${h.type}</span>
        <div>
          <div class="search-result-title">${escapeHtml(h.title)}</div>
          <div class="search-result-desc">${escapeHtml(h.desc || '')}</div>
        </div>
      </div>
    `).join('');

    results.addEventListener('click', e => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      const hit = hits[+item.dataset.idx];
      closeSearch();
      navigateTo(hit);
    }, { once: true });
  });

  input.addEventListener('keydown', e => {
    const items = qsa('.search-result-item', results);
    if (e.key === 'ArrowDown') {
      focusIdx = Math.min(focusIdx + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      focusIdx = Math.max(focusIdx - 1, 0);
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      items[focusIdx]?.click();
    }
    items.forEach((it, i) => it.classList.toggle('focused', i === focusIdx));
  });

  window.closeSearch = closeSearch;
}

function navigateTo(hit) {
  const section = qs(`#${hit.section}`);
  if (!section) return;
  section.scrollIntoView({ behavior: 'smooth' });

  // Open modal if applicable
  if (hit.section === 'projects' && hit.id) {
    setTimeout(() => openProjectModal(hit.id), 500);
  } else if (hit.section === 'apps' && hit.id) {
    setTimeout(() => openAppModal(hit.id), 500);
  } else if (hit.section === 'blog' && hit.id) {
    setTimeout(() => openBlogModal(hit.id), 500);
  }
}

/* ─── SCROLL REVEAL ──────────────────────────────────────── */
let revealObserverInstance = null;
function revealObserver() {
  if (revealObserverInstance) {
    // Re-observe new elements
    qsa('.reveal:not(.visible)').forEach(el => revealObserverInstance.observe(el));
    return;
  }
  revealObserverInstance = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserverInstance.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  qsa('.reveal').forEach(el => revealObserverInstance.observe(el));
}

/* ─── BOOT ───────────────────────────────────────────────── */
async function boot() {
    console.log("BOOT START");

    try {
        initNav();
        console.log("nav ok");

        initTerminal();
        console.log("terminal ok");

        initModals();
        console.log("modals ok");

        initSearch();
        console.log("search ok");

        revealObserver();
        console.log("reveal ok");

        await Promise.all([
            loadProfile(),
            loadProjects(),
            loadApps(),
            loadJourney(),
            loadVault(),
            loadExperiments(),
            loadBlog(),
        ]);

        console.log("all data loaded");

        buildSearchIndex();
        console.log("search index built");

    } catch(e) {
        console.error("BOOT ERROR:", e);
    }
}

document.addEventListener('DOMContentLoaded', boot);
