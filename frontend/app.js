// app.js — your original code with debug-toggle + inline SVG icons added
// ==================== SVG ICONS (inline, offline) ====================
(function injectSvgSprite() {
    if (document.getElementById('__svg_sprite')) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('id', '__svg_sprite');
    svg.setAttribute('style', 'display:none;');
    svg.innerHTML = `
      <symbol id="icon-logout" viewBox="0 0 24 24">
        <path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
      </symbol>
      <symbol id="icon-plus" viewBox="0 0 24 24">
        <path fill="currentColor" d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </symbol>
      <symbol id="icon-back" viewBox="0 0 24 24">
        <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
      </symbol>
    `;
    document.body.prepend(svg);
})();

// ==================== SHARED HELPERS ====================

// Debug area for development (updated to support toggle)
function ensureDebugArea() {
    let dbg = document.getElementById('debug-area');
    if (!dbg) {
        dbg = document.createElement('pre');
        dbg.id = 'debug-area';
        dbg.style = 'background:#f4f4f4;border:1px solid #ddd;padding:8px;margin:8px;white-space:pre-wrap;max-height:200px;overflow:auto;font-size:12px;';
        // insert at top of body so it's visible
        const container = document.body;
        container.insertBefore(dbg, container.firstChild);
    }
    // visibility controlled by persisted setting
    const visible = localStorage.getItem('debugVisible') === 'true';
    dbg.style.display = visible ? 'block' : 'none';
}

// create floating toggle button (top-right)
function ensureDebugToggle() {
    if (document.getElementById('debug-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'debug-toggle';
    btn.title = 'Toggle debug area';
    btn.setAttribute('aria-pressed', 'false');
    btn.style = `
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 9999;
        width:40px;
        height:40px;
        border-radius:10px;
        border: none;
        background: linear-gradient(90deg,#60a5fa,#6ee7b7);
        box-shadow: 0 8px 20px rgba(2,6,23,0.5);
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
    `;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><use href="#icon-plus" fill="#04202a"></use></svg>`;
    btn.addEventListener('click', () => {
        const dbg = document.getElementById('debug-area');
        if (!dbg) return;
        const now = dbg.style.display !== 'block';
        dbg.style.display = now ? 'block' : 'none';
        localStorage.setItem('debugVisible', now ? 'true' : 'false');
        btn.setAttribute('aria-pressed', now ? 'true' : 'false');
        // adjust icon to back/plus for clarity
        btn.innerHTML = now
            ? `<svg width="18" height="18" viewBox="0 0 24 24"><use href="#icon-back" fill="#04202a"></use></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24"><use href="#icon-plus" fill="#04202a"></use></svg>`;
    });
    document.body.appendChild(btn);

    // set initial pressed state & icon
    const initVisible = localStorage.getItem('debugVisible') === 'true';
    if (initVisible) {
        btn.setAttribute('aria-pressed', 'true');
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24"><use href="#icon-back" fill="#04202a"></use></svg>`;
    }
}

function debugPrint(obj) {
    ensureDebugArea();
    ensureDebugToggle();
    const dbg = document.getElementById('debug-area');
    try {
        dbg.textContent = (typeof obj === 'string') ? obj : JSON.stringify(obj, null, 2);
    } catch (e) {
        dbg.textContent = String(obj);
    }
}

// ==================== ICON HELPERS ====================
// Adds small inline icons to specific buttons (non-destructive)
function decorateButtonsWithIcons() {
    // logoutBtn: keep id, just insert icon at start
    const logout = document.getElementById('logoutBtn');
    if (logout && !logout.dataset.iconInjected) {
        const existing = logout.innerHTML;
        logout.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" style="margin-right:6px;vertical-align:middle;"><use href="#icon-logout" fill="currentColor"></use></svg>${existing}`;
        logout.dataset.iconInjected = '1';
    }

    // Add small plus icon to Create Quiz and Add Question submit buttons where present
    document.querySelectorAll('form button[type="submit"]').forEach(btn => {
        if (!btn.dataset.iconInjected) {
            // do not modify login/signup buttons (these should be left as-is for clarity)
            const formId = btn.closest('form')?.id || '';
            if (formId === 'loginForm' || formId === 'signupForm') return;
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" style="margin-right:6px;vertical-align:middle;"><use href="#icon-plus" fill="currentColor"></use></svg>${btn.innerHTML}`;
            btn.dataset.iconInjected = '1';
        }
    });
}

// ==================== API / AUTH HELPERS (unchanged) ====================

const API_BASE = "http://localhost:8080";
async function apiFetch(path, opts = {}) {
    const token = localStorage.getItem('token');
    opts.headers = opts.headers || {};
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
    const res = await fetch(API_BASE + path, opts);
    if (!res.ok) {
        const text = await res.text().catch(()=>null);
        let errMsg = `HTTP ${res.status}`;
        try { const j = JSON.parse(text); errMsg = j.message || JSON.stringify(j); } catch(e){ if(text) errMsg=text; }
        const err = new Error(errMsg);
        err.status = res.status;
        throw err;
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return res.json();
}

// ==================== LOGIN / SIGNUP ====================

async function login(event) {
    event.preventDefault();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const errorMsg = document.getElementById('error');
    try {
        const resp = await fetch(API_BASE + "/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        if (!resp.ok) {
            const errBody = await resp.json().catch(()=>null);
            throw new Error(errBody?.message || "Invalid email or password");
        }
        const data = await resp.json();
        localStorage.setItem('token', data.token || data.accessToken || data.jwt);
        localStorage.setItem('role', (data.role || data.userRole || 'USER').toUpperCase());
        const role = localStorage.getItem('role');
        if (role === 'ADMIN') window.location.href = "admin.html";
        else window.location.href = "dashboard.html";
    } catch (err) {
        console.error(err);
        if (errorMsg) errorMsg.textContent = err.message || "Login failed";
        debugPrint({ loginError: err.message || String(err) });
    }
}
const loginForm = document.getElementById('loginForm');
if (loginForm) loginForm.addEventListener('submit', login);

async function signup(event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const role = document.getElementById('role')?.value || 'USER';
    const errorMsg = document.getElementById('signupError');
    try {
        const response = await fetch(API_BASE + "/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role })
        });
        if (!response.ok) {
            const data = await (response.json().catch(() => ({})));
            throw new Error(data.message || "Signup failed");
        }
        alert("Signup successful! Please login.");
        window.location.href = "index.html";
    } catch (err) {
        console.error(err);
        if (errorMsg) errorMsg.textContent = err.message;
        debugPrint({ signupError: err.message });
    }
}
const signupForm = document.getElementById('signupForm');
if (signupForm) signupForm.addEventListener('submit', signup);

// ==================== ROLE-BASED INIT ====================

document.addEventListener('DOMContentLoaded', () => {
    // ensure debug area & toggle (toggle uses persisted choice)
    ensureDebugArea();
    ensureDebugToggle();
    decorateButtonsWithIcons();

    const role = (localStorage.getItem('role') || '').toUpperCase();
    const token = localStorage.getItem('token');
    if (!token) {
        debugPrint("No token found. Login required.");
        return;
    }
    // user page
    if (document.getElementById('quiz-container') && role === 'USER') {
        loadQuizzes();
    }
    // admin page
    if (document.getElementById('quizzesContainer') && role === 'ADMIN') {
        renderAdminQuizzes();
        populateQuizSelect();
        loadResults();
    }
});

// ==================== USER FUNCTIONS ====================

let currentQuiz = null;
let userAnswers = {};

async function loadQuizzes() {
    try {
        debugPrint('Fetching quizzes for user...');
        const quizzes = await apiFetch('/api/user/quizzes');
        const quizContainer = document.getElementById("quiz-container");
        if (!quizzes || quizzes.length === 0) {
            quizContainer.innerHTML = `<p>No quizzes available</p>`;
            return;
        }
        quizContainer.innerHTML = quizzes.map(q => `
            <div class="quiz-item">
                <h3>${q.title || q.name}</h3>
                <p>${q.description || ''}</p>
                <button onclick="startQuiz(${q.id})">Start Quiz</button>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        debugPrint({ loadQuizzesError: err.message });
    }
}

async function startQuiz(quizId) {
    try {
        const quiz = await apiFetch(`/api/user/quizzes/${quizId}`);
        currentQuiz = quiz;
        userAnswers = {};
        const questions = (quiz.questions || []).map(q => ({
            id: q.id,
            text: q.question_text || q.text,
            options: (q.options || []).map(o => ({id:o.id, text:o.option_text || o.text}))
        }));
        const quizContainer = document.getElementById("quiz-container");
        quizContainer.innerHTML = questions.map(q => `
            <div class="question" id="question-${q.id}">
                <p>${q.text}</p>
                <div class="options">
                    ${q.options.map(o => `<button type="button" onclick="answerQuestion(${q.id}, ${o.id})">${o.text}</button>`).join('')}
                </div>
            </div>
        `).join('') + `<div style="text-align:right;"><button type="button" onclick="submitQuiz()" class="submitQuizBtn">Submit Quiz</button></div>`;
    } catch (err) {
        console.error(err);
        debugPrint({ startQuizError: err.message });
    }
}


function answerQuestion(questionId, optionId) {
    userAnswers[questionId] = optionId;
    const buttons = document.querySelectorAll(`#question-${questionId} .options button`);
    buttons.forEach(b => {
        const bOptionId = parseInt(b.getAttribute('onclick')?.match(/\d+/g)[1]);
        if (bOptionId === optionId) b.classList.add('selected');
        else b.classList.remove('selected');
    });
}



async function submitQuiz() {
    try {
        console.log('🎯 Submitting quiz:', currentQuiz.id);
        console.log('🎯 Answers:', userAnswers);

        const result = await apiFetch('/api/user/quizzes/submit', {  // ✅ Changed endpoint
            method: 'POST',
            body: JSON.stringify({ quizId: currentQuiz.id, answers: userAnswers })
        });

        console.log('🎯 Result received:', result);

        const quizContainer = document.getElementById("quiz-container");
        const resultContainer = document.getElementById("result-container");

        quizContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = `
            <h2>Quiz Result</h2>
            <p>Score: ${result.score}/${result.total}</p>
            <button onclick="backToQuizzes()"><svg width="14" height="14" viewBox="0 0 24 24" style="margin-right:6px;vertical-align:middle;"><use href="#icon-back" fill="currentColor"></use></svg>Back to Quizzes</button>
        `;
    } catch(err) {
        console.error('❌ Submit error:', err);
        debugPrint({ submitQuizError: err.message });
    }
}

function backToQuizzes() {
    const quizContainer = document.getElementById("quiz-container");
    const resultContainer = document.getElementById("result-container");

    resultContainer.style.display = 'none';
    quizContainer.style.display = 'block';

    loadQuizzes(); // Reload the quiz list
}

// ==================== ADMIN FUNCTIONS ====================

function escapeHtml(str=''){ return String(str).replace(/[&<>"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])) }

async function renderAdminQuizzes() {
    try {
        const quizzes = await apiFetch('/api/admin/quizzes');
        const cont = document.getElementById('quizzesContainer');
        if (!quizzes || quizzes.length===0) { cont.innerHTML='<p>No quizzes yet.</p>'; return; }
        cont.innerHTML = quizzes.map(q => `
            <div class="quiz-card">
                <h3>${escapeHtml(q.title)}</h3>
                <p>${escapeHtml(q.description||'')}</p>
                <button data-id="${q.id}" class="delQuizBtn">Delete</button>
            </div>
        `).join('');
        document.querySelectorAll('.delQuizBtn').forEach(btn=>{
            btn.addEventListener('click', async ()=>{
                const id=btn.getAttribute('data-id');
                if(!confirm('Delete quiz #'+id+'?')) return;
                await apiFetch(`/api/admin/quizzes/${id}`,{method:'DELETE'});
                renderAdminQuizzes();
                populateQuizSelect();
            });
        });
    } catch(err){ console.error(err); }
}

async function populateQuizSelect() {
    try{
        const quizzes = await apiFetch('/api/admin/quizzes');
        const sel = document.getElementById('selectQuizForQuestion');
        sel.innerHTML = quizzes.map(q=>`<option value="${q.id}">${escapeHtml(q.title)}</option>`).join('');
    } catch(err){ console.error(err); }
}

document.getElementById('createQuizForm')?.addEventListener('submit', async e=>{
    e.preventDefault();
    const title=document.getElementById('quizTitle').value.trim();
    const description=document.getElementById('quizDescription').value.trim();
    await apiFetch('/api/admin/quizzes',{method:'POST',body:JSON.stringify({title,description})});
    alert('Quiz created'); renderAdminQuizzes(); populateQuizSelect();
});

document.getElementById('addQuestionForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const quizId = document.getElementById('selectQuizForQuestion')?.value;
    if (!quizId) {
        alert('Please select a quiz first.');
        return;
    }
    const questionText = document.getElementById('questionText').value.trim();
    const optionEls = Array.from(document.querySelectorAll('.optText'));
    if (!questionText || optionEls.length === 0) {
        alert('Enter a question and options.');
        return;
    }
    const correctIndex = parseInt(document.querySelector('input[name="correctOption"]:checked')?.value || 0, 10);
    const options = optionEls.map((el, idx) => ({ optionText: el.value.trim(), isCorrect: idx === correctIndex }));

    const payload = { text: questionText, options };
    console.log('[DEBUG] Sending to /api/admin/quizzes/' + quizId + '/questions');
    console.log('[DEBUG] Payload:', JSON.stringify(payload, null, 2));
    console.log('[DEBUG] Token:', localStorage.getItem('token')?.substring(0, 20) + '...');

    await apiFetch(`/api/admin/quizzes/${encodeURIComponent(quizId)}/questions`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    alert('Question added');
    optionEls.forEach(el => el.value = '');
    document.getElementById('questionText').value = '';
});

async function loadResults() {
    try {
        const results = await apiFetch('/api/admin/results');
        const container = document.getElementById('resultsContainer');
        if (!results || results.length === 0) { 
            container.innerHTML = '<p>No results yet</p>'; 
            return; 
        }
        
        container.innerHTML = results.map(r => {
            const userEmail = r.user?.email || 'N/A';
            const quizTitle = r.quiz?.title || 'N/A';
            const score = r.score || 0;
            const total = r.totalQuestions || 0;
            const takenAt = r.takenAt ? new Date(r.takenAt).toLocaleString() : 'N/A';
            const resultId = r.id; // ensure your API sends unique id

            return `
                <div class="result-card" data-id="${resultId}">
                    <strong>User:</strong> ${escapeHtml(userEmail)}<br/>
                    <strong>Quiz:</strong> ${escapeHtml(quizTitle)}<br/>
                    <strong>Score:</strong> ${score}/${total}<br/>
                    <small>${takenAt}</small><br/>
                    <button type="button" class="deleteResultBtn">Delete</button>
                </div>
            `;
        }).join('');

        // Attach delete handlers
        document.querySelectorAll('.deleteResultBtn').forEach(btn => {
            btn.addEventListener('click', async e => {
                const card = e.target.closest('.result-card');
                const id = card.dataset.id;
                if (!id || !confirm('Delete this result?')) return;
                try {
                    await apiFetch(`/api/admin/results/${encodeURIComponent(id)}`, { method: 'DELETE' });
                    card.remove(); // remove from DOM instantly
                    debugPrint(`Result ${id} deleted`);
                } catch (err) {
                    console.error(err);
                    alert('Failed to delete result: ' + err.message);
                }
            });
        });

    } catch(err) { 
        console.error('❌ Error loading results:', err);
        const container = document.getElementById('resultsContainer');
        container.innerHTML = '<p style="color:red;">Error loading results: ' + err.message + '</p>';
    }
}


// Logout button
document.getElementById('logoutBtn')?.addEventListener('click', ()=>{
    localStorage.removeItem('token'); localStorage.removeItem('role'); window.location.href='index.html';
});
