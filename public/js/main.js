/* ════════════════════════════════════════════════
   DECODELABS — PROJECT 3
   main.js  |  Vanilla JS · DOM Manipulation
   Engineering Standards:
     js-  prefix → JavaScript hooks only
     is-  prefix → visual / behavioural state
   ════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════
   UTILITY: Toast Notification
   createElement() + appendChild() → IPO loop
═══════════════════════════════════════════════ */
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.classList.add('toast', `is-${type}`);
  toast.textContent = msg;

  container.appendChild(toast);

  // Trigger CSS enter animation (double rAF ensures paint happens first)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('is-visible'));
  });

  // Auto-remove after 3.5 s
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}


/* ═══════════════════════════════════════════════
   MODULE 01 — DARK MODE TOGGLE
   PDF Slide 16: Case Study · The Dark Mode Toggle
   INPUT  → user clicks toggle
   PROCESS→ JS checks isDark state, updates localStorage
   OUTPUT → classList.toggle('.dark-mode') on <body>
═══════════════════════════════════════════════ */
(function initDarkMode() {
  const toggle = document.querySelector('.js-dark-toggle');

  // Restore saved preference on load
  let isDark = localStorage.getItem('dl-theme') === 'dark';
  document.body.classList.toggle('dark-mode', isDark);

  toggle.addEventListener('click', () => {
    isDark = !isDark;                                          // flip state
    document.body.classList.toggle('dark-mode', isDark);      // mutate DOM
    localStorage.setItem('dl-theme', isDark ? 'dark' : 'light'); // persist
    showToast(isDark ? '🌙 Dark mode on' : '☀️ Light mode on', 'info');
  });
})();


/* ═══════════════════════════════════════════════
   MODULE 01b — MOBILE MENU
   classList.toggle on nav drawer
═══════════════════════════════════════════════ */
(function initMobileMenu() {
  const menuBtn  = document.querySelector('.js-menu-toggle');
  const menu     = document.querySelector('.js-mobile-menu');
  const closeLinks = document.querySelectorAll('.js-menu-close');

  menuBtn.addEventListener('click', () => {
    menu.classList.toggle('is-open');
  });

  closeLinks.forEach(link => {
    link.addEventListener('click', () => menu.classList.remove('is-open'));
  });
})();


/* ═══════════════════════════════════════════════
   MODULE 02 — COUNTER
   PDF Slide 11: Phase 2 · State Management
   State: let count  (mutable — value must change)
   DOM refs: const   (immutable binding)
═══════════════════════════════════════════════ */
(function initCounter() {
  let count = 0;                                   // STATE
  const display = document.getElementById('counterDisplay');
  const history = document.getElementById('counterHistory');
  const actions = [];

  function render() {
    // OUTPUT: textContent — safe injection (no innerHTML)
    display.textContent = count;

    // Color state
    display.style.color =
      count > 0  ? 'var(--accent)' :
      count < 0  ? 'var(--accent-red)' :
                   'var(--accent-blue)';

    // Bump animation via is- class
    display.classList.add('is-bump');
    setTimeout(() => display.classList.remove('is-bump'), 160);

    // History log (last 3)
    if (actions.length > 3) actions.shift();
    history.textContent = actions.length ? actions.join('  →  ') : '— no actions yet —';
  }

  // Single event listener pattern — data-action attribute
  document.querySelectorAll('.js-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;           // INPUT: read data attribute

      // PROCESS: business logic
      if      (action === 'inc')   { count++;       actions.push(`+1 → ${count}`); }
      else if (action === 'dec')   { count--;       actions.push(`-1 → ${count}`); }
      else if (action === 'inc10') { count += 10;   actions.push(`+10 → ${count}`); }
      else if (action === 'dec10') { count -= 10;   actions.push(`-10 → ${count}`); }
      else if (action === 'reset') { count = 0;     actions.length = 0; }

      render();                                    // OUTPUT
    });
  });
})();


/* ═══════════════════════════════════════════════
   MODULE 03 — ACCORDION
   PDF Slide 15: Dynamic Content & Classes
   classList.toggle('is-open') — decoupled pattern
   JS handles behavior · CSS handles visuals
═══════════════════════════════════════════════ */
(function initAccordion() {
  const items = document.querySelectorAll('.js-accordion');

  items.forEach(item => {
    const trigger = item.querySelector('.js-accordion-trigger');

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Close all (one open at a time)
      items.forEach(i => i.classList.remove('is-open'));

      // Toggle clicked item
      if (!isOpen) item.classList.add('is-open');
    });
  });
})();


/* ═══════════════════════════════════════════════
   MODULE 04 — LIVE FORM WITH VALIDATION
   PDF Slide 9: Sensory Receptors (keyboard input)
   PDF Slide 14: Phase 3 — Mutating the DOM
   — Real-time 'input' events → live preview
   — Submit validation → error state classes
   — Entries added dynamically via createElement
═══════════════════════════════════════════════ */
(function initForm() {
  const fName    = document.getElementById('fName');
  const fEmail   = document.getElementById('fEmail');
  const fRole    = document.getElementById('fRole');
  const fMsg     = document.getElementById('fMsg');
  const charCount = document.getElementById('charCount');
  const preview  = document.getElementById('livePreview');
  const submitBtn = document.querySelector('.js-submit-form');
  const subWrap  = document.getElementById('submissionsWrap');
  const subList  = document.getElementById('submissionsList');
  const subCount = document.getElementById('submissionCount');

  let submissions = 0;

  // Validators
  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  // Show / hide individual field errors
  function setError(input, errId, show) {
    input.classList.toggle('is-error', show);
    document.getElementById(errId).classList.toggle('is-visible', show);
  }

  // Live preview update on every keystroke
  function updatePreview() {
    const name  = fName.value.trim();
    const email = fEmail.value.trim();
    const role  = fRole.value;
    const msg   = fMsg.value.trim();

    if (!name && !msg) {
      preview.innerHTML = '';
      preview.classList.remove('is-filled');
      const ph = document.createElement('div');
      ph.className = 'preview-placeholder';
      ph.textContent = 'Start filling the form…';
      preview.appendChild(ph);
      return;
    }

    preview.classList.add('is-filled');
    preview.innerHTML = '';   // clear before re-render

    if (name) {
      const el = document.createElement('div');
      el.className = 'preview-name';
      el.textContent = name;
      preview.appendChild(el);
    }
    if (email) {
      const el = document.createElement('div');
      el.className = 'preview-email';
      el.textContent = email;
      preview.appendChild(el);
    }
    if (role) {
      const el = document.createElement('div');
      el.className = 'preview-role';
      el.textContent = role;
      preview.appendChild(el);
    }
    if (msg) {
      const el = document.createElement('div');
      el.className = 'preview-msg';
      el.textContent = msg;
      preview.appendChild(el);
    }
  }

  // INPUT events (keyup for real-time)
  fName.addEventListener('input',  updatePreview);
  fEmail.addEventListener('input', updatePreview);
  fRole.addEventListener('change', updatePreview);
  fMsg.addEventListener('input', () => {
    charCount.textContent = fMsg.value.length;
    updatePreview();
  });

  // SUBMIT
  submitBtn.addEventListener('click', () => {
    const name  = fName.value.trim();
    const email = fEmail.value.trim();
    const msg   = fMsg.value.trim();
    let valid = true;

    // Validate each field
    if (name.length < 2)      { setError(fName, 'fNameErr', true);  valid = false; } else { setError(fName, 'fNameErr', false); }
    if (!isValidEmail(email)) { setError(fEmail, 'fEmailErr', true); valid = false; } else { setError(fEmail, 'fEmailErr', false); }
    if (!msg)                 { setError(fMsg, 'fMsgErr', true);     valid = false; } else { setError(fMsg, 'fMsgErr', false); }

    if (!valid) {
      showToast('❌ Please fix the errors above.', 'error');
      return;
    }

    // Create entry node dynamically
    const entry = document.createElement('div');
    entry.className = 'submission-entry';
    entry.innerHTML = `<strong>${name}</strong> · ${email}<br/><span style="color:var(--text-muted);font-size:12px">${msg}</span>`;

    submissions++;
    subCount.textContent = submissions;
    subList.appendChild(entry);
    subWrap.style.display = 'block';

    // Reset
    fName.value = fEmail.value = fMsg.value = '';
    fRole.selectedIndex = 0;
    charCount.textContent = '0';
    updatePreview();

    showToast(`✅ Message from ${name} submitted!`, 'success');
  });

  // Clear error on re-focus
  [fName, fEmail, fMsg].forEach(el => {
    el.addEventListener('focus', () => el.classList.remove('is-error'));
  });
})();


/* ═══════════════════════════════════════════════
   MODULE 05 — DYNAMIC GALLERY + FILTER + SEARCH
   PDF Conclusion: "dynamic image gallery"
   — createElement + appendChild builds all cards
   — filter via classList.toggle('is-hidden')
   — search via keyup event
═══════════════════════════════════════════════ */
(function initGallery() {
  const CARDS = [
    { cat: 'html', title: 'Semantic Structure',  desc: 'header, nav, main, section, article, footer — meaningful elements over generic divs.' },
    { cat: 'html', title: 'Forms & Inputs',       desc: 'input, select, textarea, label — collecting data from users.' },
    { cat: 'html', title: 'DOM Tree',             desc: 'HTML is parsed into a tree of Nodes the browser holds in volatile memory.' },
    { cat: 'html', title: 'document.querySelector', desc: 'Target any node in the DOM tree using CSS selectors.' },
    { cat: 'css',  title: 'classList API',        desc: '.add(), .remove(), .toggle(), .contains() — the bridge between JS and CSS.' },
    { cat: 'css',  title: 'CSS Transitions',      desc: 'transition: all 0.3s ease — CSS handles the animation, JS handles the trigger.' },
    { cat: 'css',  title: 'Custom Properties',    desc: '--accent: #3a6b5c — variables that update globally and enable theming.' },
    { cat: 'css',  title: 'Responsive Grid',      desc: 'grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)) — fluid layouts.' },
    { cat: 'js',   title: 'Event Listeners',      desc: 'addEventListener() wires a callback to any DOM node for any event type.' },
    { cat: 'js',   title: 'State Variables',      desc: 'let isDark = false — the collection of data that determines what the user sees.' },
    { cat: 'js',   title: 'textContent',          desc: 'Safe DOM mutation — unlike innerHTML, no XSS risk when injecting data.' },
    { cat: 'js',   title: 'createElement',        desc: 'document.createElement() + appendChild() — building nodes programmatically.' },
    { cat: 'js',   title: 'IPO Loop',             desc: 'Input (event) → Process (function + state) → Output (DOM mutation).' },
    { cat: 'js',   title: 'localStorage',         desc: 'Persist state across page reloads. Key-value store in the browser.' },
    { cat: 'js',   title: 'const vs let',         desc: 'const for DOM refs (immutable binding). let only when the value must change.' },
    { cat: 'js',   title: 'js- / is- Prefixes',   desc: 'js- hooks never styled. is- classes define state only. Decoupling principle.' },
  ];

  const grid      = document.getElementById('galleryGrid');
  const noResults = document.getElementById('noResults');
  const pills     = document.querySelectorAll('.js-pill');
  const search    = document.querySelector('.js-search');

  let activeFilter = 'all';
  let searchTerm   = '';

  // Build all cards once
  CARDS.forEach(data => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.dataset.category = data.cat;

    const catEl = document.createElement('div');
    catEl.className = `card-cat cat-${data.cat}`;
    catEl.textContent = data.cat.toUpperCase();

    const title = document.createElement('h4');
    title.textContent = data.title;

    const desc = document.createElement('p');
    desc.textContent = data.desc;

    card.appendChild(catEl);
    card.appendChild(title);
    card.appendChild(desc);
    grid.appendChild(card);
  });

  // Filter logic
  function applyFilters() {
    const cards = grid.querySelectorAll('.gallery-card');
    let visible = 0;

    cards.forEach(card => {
      const catMatch    = activeFilter === 'all' || card.dataset.category === activeFilter;
      const titleText   = card.querySelector('h4').textContent.toLowerCase();
      const descText    = card.querySelector('p').textContent.toLowerCase();
      const searchMatch = searchTerm === '' || titleText.includes(searchTerm) || descText.includes(searchTerm);
      const show = catMatch && searchMatch;

      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });

    noResults.classList.toggle('is-hidden', visible > 0);
  }

  // Pill filter
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      activeFilter = pill.dataset.filter;
      applyFilters();
    });
  });

  // Live search
  search.addEventListener('keyup', () => {
    searchTerm = search.value.trim().toLowerCase();
    applyFilters();
  });
})();


/* ═══════════════════════════════════════════════
   MODULE 06 — JS BASICS QUIZ
   Full IPO Loop with score state object
   createElement() builds question UI dynamically
═══════════════════════════════════════════════ */
(function initQuiz() {
  const QUESTIONS = [
    {
      q: 'What does DOM stand for?',
      options: ['Document Object Model', 'Data Object Manager', 'Dynamic Output Module', 'Design Object Map'],
      correct: 0,
      explain: '✅ DOM = Document Object Model — the browser\'s living tree of HTML nodes.'
    },
    {
      q: 'Which variable declaration should you AVOID in modern JavaScript?',
      options: ['const', 'let', 'var', 'All of the above'],
      correct: 2,
      explain: '✅ var is function-scoped and prone to hoisting bugs. Always use const or let.'
    },
    {
      q: 'What is the safest way to inject text into the DOM?',
      options: ['element.innerHTML', 'element.textContent', 'document.write()', 'eval()'],
      correct: 1,
      explain: '✅ textContent prevents XSS attacks. innerHTML executes scripts.'
    },
    {
      q: 'What does classList.toggle("is-open") do?',
      options: [
        'Removes the class permanently',
        'Adds the class if absent, removes if present',
        'Only adds the class',
        'Reloads the page'
      ],
      correct: 1,
      explain: '✅ toggle() adds the class if it doesn\'t exist, removes it if it does.'
    },
    {
      q: 'In the IPO model, what is the OUTPUT phase?',
      options: [
        'The user clicking a button',
        'The JavaScript function running',
        'A visible DOM change reflecting the new state',
        'Writing to localStorage'
      ],
      correct: 2,
      explain: '✅ Output = DOM Mutation. The visible reaction the user sees after logic runs.'
    },
    {
      q: 'What is the purpose of the "js-" prefix on a class name?',
      options: [
        'It styles the element with CSS',
        'It marks the class as a JavaScript hook — never for styling',
        'It means the element is hidden',
        'It is shorthand for JSON'
      ],
      correct: 1,
      explain: '✅ js- prefix = JS hook only. Decouples markup from logic. Never use for CSS.'
    },
  ];

  const container = document.getElementById('quizContainer');

  // State object
  const state = {
    answers: new Array(QUESTIONS.length).fill(null),
    score: 0,
    submitted: 0,
  };

  // Build question elements
  QUESTIONS.forEach((qData, qIndex) => {
    const qBlock = document.createElement('div');
    qBlock.className = 'quiz-question';

    const num = document.createElement('div');
    num.className = 'quiz-q-num';
    num.textContent = `Question ${qIndex + 1} of ${QUESTIONS.length}`;

    const qText = document.createElement('div');
    qText.className = 'quiz-q-text';
    qText.textContent = qData.q;

    const opts = document.createElement('div');
    opts.className = 'quiz-options';

    qData.options.forEach((opt, oIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option js-quiz-option';
      btn.textContent = opt;
      btn.dataset.qIndex = qIndex;
      btn.dataset.oIndex = oIndex;
      opts.appendChild(btn);
    });

    const feedback = document.createElement('div');
    feedback.className = 'quiz-feedback';
    feedback.id = `feedback-${qIndex}`;

    qBlock.appendChild(num);
    qBlock.appendChild(qText);
    qBlock.appendChild(opts);
    qBlock.appendChild(feedback);
    container.appendChild(qBlock);
  });

  // Scoreboard
  const scoreBoard = document.createElement('div');
  scoreBoard.className = 'quiz-score-board';
  scoreBoard.innerHTML = `
    <div class="score-big" id="scoreBig">0/${QUESTIONS.length}</div>
    <div class="score-label" id="scoreLabel">Complete all questions to see your score</div>
    <button class="btn btn-green" id="quizRetry" style="margin-top:16px">Retry Quiz</button>
  `;
  container.appendChild(scoreBoard);

  // Click handler (event delegation)
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-quiz-option');
    if (!btn) return;

    const qIndex = parseInt(btn.dataset.qIndex);
    const oIndex = parseInt(btn.dataset.oIndex);

    // Already answered?
    if (state.answers[qIndex] !== null) return;

    // Record answer
    state.answers[qIndex] = oIndex;
    state.submitted++;

    const isCorrect = oIndex === QUESTIONS[qIndex].correct;
    if (isCorrect) state.score++;

    // Disable all options for this question
    const qBlock = btn.closest('.quiz-question');
    qBlock.querySelectorAll('.js-quiz-option').forEach((opt, i) => {
      opt.disabled = true;
      if (i === QUESTIONS[qIndex].correct) opt.classList.add('is-correct');
    });
    if (!isCorrect) btn.classList.add('is-wrong');

    // Show feedback
    const feedback = document.getElementById(`feedback-${qIndex}`);
    feedback.textContent = QUESTIONS[qIndex].explain;
    feedback.classList.add('is-visible', isCorrect ? 'is-correct' : 'is-wrong');

    // Show scoreboard when all answered
    if (state.submitted === QUESTIONS.length) {
      const pct = Math.round((state.score / QUESTIONS.length) * 100);
      document.getElementById('scoreBig').textContent = `${state.score}/${QUESTIONS.length}`;
      document.getElementById('scoreLabel').textContent =
        pct === 100 ? '🎉 Perfect score! DOM master!' :
        pct >= 60   ? `Good job! ${pct}% — keep practising.` :
                      `${pct}% — review the modules above.`;
      scoreBoard.classList.add('is-visible');
      showToast(`Quiz done! Score: ${state.score}/${QUESTIONS.length}`, pct >= 60 ? 'success' : 'error');
    }
  });

  // Retry
  document.getElementById('quizRetry').addEventListener('click', () => {
    location.reload();
  });
})();


/* ═══════════════════════════════════════════════
   MODULE 07 — CODE COPY BUTTON
   PDF Slide 17: Engineering Standards
═══════════════════════════════════════════════ */
(function initCodeCopy() {
  document.querySelectorAll('.js-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = btn.closest('.code-block').querySelector('code');
      navigator.clipboard.writeText(pre.textContent).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('is-copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('is-copied');
        }, 2000);
      });
    });
  });
})();
