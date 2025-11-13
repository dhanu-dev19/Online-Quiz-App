// Quiz functionality
let currentQuestion = 0;
let userAnswers = {};
let timer = 0;
let timerInterval;
let questions = [];
let currentCategoryId = null;

document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    initializeQuiz();
});

async function initializeQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    currentCategoryId = urlParams.get('category');

    if (!currentCategoryId) {
        showMessage('No category selected');
        return;
    }

    try {
        questions = await fetchQuestions(currentCategoryId);
        if (questions.length === 0) {
            showMessage('No questions available for this category');
            return;
        }

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('quizContent').classList.remove('hidden');

        setupQuiz();
        startTimer();
        displayQuestion(0);
        setupQuestionDots();

    } catch (error) {
        showMessage('Error loading questions: ' + error.message);
    }
}

function setupQuiz() {
    document.getElementById('totalQuestions').textContent = questions.length;

    // Get category name from first question or use generic title
    const categoryName = questions[0]?.category_name || 'Quiz';
    document.getElementById('quizTitle').textContent = `${categoryName} Quiz`;

    // Event listeners for navigation
    document.getElementById('prevBtn').addEventListener('click', goToPreviousQuestion);
    document.getElementById('nextBtn').addEventListener('click', goToNextQuestion);
    document.getElementById('submitBtn').addEventListener('click', submitQuiz);
}

function displayQuestion(index) {
    if (index < 0 || index >= questions.length) return;

    currentQuestion = index;
    const question = questions[index];

    // Update question display
    document.getElementById('questionNumber').textContent = `Q${index + 1}`;
    document.getElementById('questionText').textContent = question.question_text;
    document.getElementById('questionPoints').textContent = `${question.points} point${question.points !== 1 ? 's' : ''}`;
    document.getElementById('currentQuestion').textContent = index + 1;

    // Update options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    const options = [
        { letter: 'a', text: question.option_a },
        { letter: 'b', text: question.option_b },
        { letter: 'c', text: question.option_c },
        { letter: 'd', text: question.option_d }
    ];

    options.forEach((option, optionIndex) => {
        const optionEl = document.createElement('label');
        optionEl.className = `option ${userAnswers[index] === option.letter ? 'selected' : ''}`;
        optionEl.innerHTML = `
            <input type="radio" name="answer" value="${option.letter}"
                   ${userAnswers[index] === option.letter ? 'checked' : ''}>
            <span class="option-letter"></span>
            <span class="option-text">${option.text}</span>
        `;
        optionEl.addEventListener('click', () => selectAnswer(option.letter));
        optionsContainer.appendChild(optionEl);
    });

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').classList.toggle('hidden', index === questions.length - 1);
    document.getElementById('submitBtn').classList.toggle('hidden', index !== questions.length - 1);

    // Update progress
    const progress = ((index + 1) / questions.length) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;

    // Update active dot
    updateQuestionDots();
}

function selectAnswer(answer) {
    userAnswers[currentQuestion] = answer;
    displayQuestion(currentQuestion); // Refresh to show selection
}

function goToPreviousQuestion() {
    if (currentQuestion > 0) {
        displayQuestion(currentQuestion - 1);
    }
}

function goToNextQuestion() {
    if (currentQuestion < questions.length - 1) {
        displayQuestion(currentQuestion + 1);
    }
}

function setupQuestionDots() {
    const dotsContainer = document.getElementById('questionDots');
    dotsContainer.innerHTML = '';

    questions.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.textContent = index + 1;
        dot.addEventListener('click', () => displayQuestion(index));
        dotsContainer.appendChild(dot);
    });

    updateQuestionDots();
}

function updateQuestionDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentQuestion);
        dot.classList.toggle('answered', userAnswers[index] !== undefined);
    });
}

function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        document.getElementById('timer').textContent = formatTime(timer);
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

async function submitQuiz() {
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    stopTimer();

    try {
     // Map question IDs to selected answers
const formattedAnswers = {};
questions.forEach((q, index) => {
    if (userAnswers[index]) {
        formattedAnswers[q.id] = userAnswers[index];
    }
});

const quizData = {
    category_id: parseInt(currentCategoryId),
    answers: formattedAnswers,
    time_taken: timer
};


        // ✅ Call the backend endpoint
        const result = await submitQuizToServer(quizData);

        // Display results
        document.getElementById('quizContent').classList.add('hidden');
        document.getElementById('resultSection').classList.remove('hidden');

 const maxMarks = result.total_questions * 5;
const percentage = (result.score / maxMarks) * 100;

        document.getElementById('resultSection').innerHTML = `
            <h2>Quiz Completed! </h2>
            <p class="completion-time">Time: ${formatTime(timer)}</p>

            <div class="score-circle">
                <div class="score-percentage">${percentage.toFixed(1)}%</div>
                <div class="score-detail">${result.score}/${result.total_questions}</div>
            </div>

            <div class="result-stats">
                <div class="stat">
                    <div class="stat-label">Correct Answers</div>
                    <div class="stat-value correct">${result.score}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Total Questions</div>
                    <div class="stat-value">${result.total_questions}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Time Taken</div>
                    <div class="stat-value">${formatTime(timer)}</div>
                </div>
            </div>

            <div class="result-actions">
                <a href="home.html" class="btn btn-primary">Back to Home</a>
                <a href="leaderboard.html?category=${currentCategoryId}" class="btn btn-secondary">View Leaderboard</a>
                <button onclick="location.reload()" class="btn btn-success">Retry Quiz</button>
            </div>
        `;
    } catch (error) {
        showMessage('Error submitting quiz: ' + error.message);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function submitQuizToServer(quizData) {
    const user = getCurrentUser();

    const response = await fetch('http://localhost:5000/submit-quiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(quizData)
    });

    if (!response.ok) {
        throw new Error('Failed to submit quiz');
    }

    return await response.json();
}
