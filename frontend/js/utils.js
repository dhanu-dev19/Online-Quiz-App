// Utility functions
const API_BASE_URL = 'http://localhost:5000';

function showMessage(message, type = 'error')
{
    const messageEl = document.getElementById('message');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');

        if (type === 'success') {
            setTimeout(() => {
                messageEl.classList.add('hidden');
            }, 3000);
        }
    }
}

function getCurrentUser()
{
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user)
{
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getAuthToken()
{
    const user = getCurrentUser();
    return user ? user.token : null;
}

function logout()
{
    localStorage.removeItem('currentUser');
}

function formatTime(seconds)
{
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Real API functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Specific API functions
async function registerUser(userData) {
    return await apiCall('/register', {
        method: 'POST',
        body: userData
    });
}

async function loginUser(credentials) {
    return await apiCall('/login', {
        method: 'POST',
        body: credentials
    });
}

async function fetchCategories() {
    return await apiCall('/categories');
}

async function fetchQuestions(categoryId) {
    return await apiCall(`/questions/${categoryId}`);
}

async function submitQuiz(quizData) {
    return await apiCall('/submit-quiz', {
        method: 'POST',
        body: quizData
    });
}

async function fetchLeaderboard(categoryId) {
    const endpoint = categoryId ? `/leaderboard/${categoryId}` : '/leaderboard';
    return await apiCall(endpoint);
}

async function addQuestion(questionData) {
    return await apiCall('/admin/questions', {
        method: 'POST',
        body: questionData
    });
}

async function addCategory(categoryData) {
    return await apiCall('/admin/categories', {
        method: 'POST',
        body: categoryData
    });
}

