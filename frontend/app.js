// ==================== SHARED HELPERS ====================

// Debug area for development
function ensureDebugArea() {
    let dbg = document.getElementById('debug-area');
    if (!dbg) {
        dbg = document.createElement('pre');
        dbg.id = 'debug-area';
        dbg.style = 'background:#f4f4f4;border:1px solid #ddd;padding:8px;margin:8px;white-space:pre-wrap;max-height:200px;overflow:auto;font-size:12px;';
        document.body.insertBefore(dbg, document.body.firstChild);
    }
}
function debugPrint(obj) {
    ensureDebugArea();
    const dbg = document.getElementById('debug-area');
    try {
        dbg.textContent = (typeof obj === 'string') ? obj : JSON.stringify(obj, null, 2);
    } catch (e) {
        dbg.textContent = String(obj);
    }
}

// API fetch helper with token
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
    ensureDebugArea();
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
                <div>${q.options.map(o => `<button onclick="answerQuestion(${q.id}, ${o.id})">${o.text}</button>`).join('')}</div>
            </div>
        `).join('') + `<button onclick="submitQuiz()">Submit Quiz</button>`;
    } catch (err) {
        console.error(err);
        debugPrint({ startQuizError: err.message });
    }
}

function answerQuestion(questionId, optionId) {
    userAnswers[questionId] = optionId;
    const buttons = document.querySelectorAll(`#question-${questionId} button`);
    buttons.forEach(b => b.disabled = true);
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
            <button onclick="backToQuizzes()">Back to Quizzes</button>
        `;
    } catch(err) {
        console.error('❌ Submit error:', err);
        debugPrint({ submitQuizError: err.message });
    }
}

// Add this new function
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
        console.log('🔍 Loading results...');
        const results = await apiFetch('/api/admin/results');
        console.log('🔍 Results received:', results);
        
        const container = document.getElementById('resultsContainer');
        if (!results || results.length === 0) { 
            container.innerHTML = '<p>No results yet</p>'; 
            return; 
        }
        
        container.innerHTML = results.map(r => {
            // Handle different possible field structures
            const userEmail = r.user?.email || 'N/A';
            const quizTitle = r.quiz?.title || 'N/A';
            const score = r.score || 0;
            const total = r.totalQuestions || 0;
            const takenAt = r.takenAt ? new Date(r.takenAt).toLocaleString() : 'N/A';
            
            console.log('Mapping result:', { userEmail, quizTitle, score, total, takenAt });
            
            return `
                <div class="result-card">
                    <strong>User:</strong> ${escapeHtml(userEmail)}<br/>
                    <strong>Quiz:</strong> ${escapeHtml(quizTitle)}<br/>
                    <strong>Score:</strong> ${score}/${total}<br/>
                    <small>${takenAt}</small>
                </div>
            `;
        }).join('');
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
