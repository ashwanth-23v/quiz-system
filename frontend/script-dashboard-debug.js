// Minimal debug dashboard script. Put next to your other files.
// This will not change your login/signup code.

function debugLog(msg) {
    const d = document.getElementById('debug-area');
    const p = document.createElement('p');
    p.textContent = msg;
    d.appendChild(p);
}

async function checkTokenAndFetch() {
    const token = localStorage.getItem('token');
    debugLog('token present? => ' + !!token);
    debugLog('token (short) => ' + (token ? token.slice(0,40) + '...' : 'none'));

    if (!token) {
        debugLog('No token found — you should login first via index.html (signup/login).');
        return;
    }

    debugLog('Trying fetch to /api/user/quizzes');
    try {
        const res = await fetch('http://localhost:8080/api/user/quizzes', {
            headers: { "Authorization": "Bearer " + token }
        });
        debugLog('/api/user/quizzes status: ' + res.status);
        const body = await (res.ok ? res.json() : res.text());
        debugLog('response body: ' + JSON.stringify(body));
        if (res.ok && Array.isArray(body) && body.length > 0) {
            renderQuizzes(body);
        } else if (res.ok) {
            document.getElementById('quiz-container').innerHTML = '<p>No quizzes found (backend returned empty list).</p>';
        } else {
            document.getElementById('quiz-container').innerHTML = '<p class="error">Fetch failed: ' + res.status + ' - ' + JSON.stringify(body) + '</p>';
        }
    } catch (e) {
        console.error(e);
        debugLog('Fetch error (network/CORS?): ' + e.message);
        document.getElementById('quiz-container').innerHTML = '<p class="error">Fetch error: ' + e.message + ' (check backend running and CORS)</p>';
    }
}

function renderQuizzes(quizzes) {
    const qc = document.getElementById('quiz-container');
    qc.innerHTML = quizzes.map(q => `
      <div style="border:1px solid #ddd;padding:8px;margin:6px;border-radius:6px;">
        <strong>${q.title || q.title}</strong>
        <div>${q.description || ''}</div>
        <div><button onclick="start(${q.id})">Start</button></div>
      </div>
    `).join('');
}

async function start(quizId) {
    debugLog('Start clicked for id=' + quizId);
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:8080/api/user/quiz/' + quizId, {
            headers: { "Authorization": "Bearer " + token }
        });
        debugLog('quiz fetch status: ' + res.status);
        const body = await (res.ok ? res.json() : res.text());
        debugLog('quiz response: ' + JSON.stringify(body));
        if (res.ok) {
            // show first question as example
            const q = body.questions && body.questions[0];
            if (q) {
                document.getElementById('quiz-container').innerHTML = `<h3>${q.question_text || q.text}</h3>` +
                  (q.options ? q.options.map(o => `<div>${o.option_text || o.optionText || o.text}</div>`).join('') : '');
            } else {
                document.getElementById('quiz-container').innerHTML = '<p>No questions found.</p>';
            }
        } else {
            document.getElementById('quiz-container').innerHTML = '<p class="error">Quiz fetch error: ' + res.status + '</p>';
        }
    } catch(e) {
        console.error(e);
        debugLog('start fetch error: ' + e.message);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM loaded. Running checks...');
    checkTokenAndFetch();
});
