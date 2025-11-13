// Admin functionality
document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();

    // Check if user is admin
    if (!user || user.role !== 'admin') {
        window.location.href = 'home.html';
        return;
    }

    initializeAdmin();
});

async function initializeAdmin() {
    await loadCategories();
    await loadQuestions();

    // Event listeners
    const questionForm = document.getElementById('questionForm');
    const categoryForm = document.getElementById('categoryForm');

    if (questionForm) {
        questionForm.addEventListener('submit', handleAddQuestion);
    }

    if (categoryForm) {
        categoryForm.addEventListener('submit', handleAddCategory);
    }
}

async function loadCategories() {
    try {
        const categories = await fetchCategories();
        const categorySelect = document.getElementById('questionCategory');

        if (categorySelect) {
            // Clear existing options except the first one
            while (categorySelect.children.length > 1) {
                categorySelect.removeChild(categorySelect.lastChild);
            }

            // Add categories to dropdown
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }

        // Also populate categories list if exists
        const categoriesList = document.getElementById('categoriesList');
        if (categoriesList) {
            categoriesList.innerHTML = categories.map(category => `
                <div class="category-item">
                    <h4>${category.name}</h4>
                    <p>${category.description || 'No description'}</p>
                    <small>ID: ${category.id} | Created: ${new Date(category.created_at).toLocaleDateString()}</small>
                </div>
            `).join('');
        }

    } catch (error) {
        showMessage('Error loading categories: ' + error.message);
    }
}



async function handleAddQuestion(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding Question...';
    submitBtn.disabled = true;

    const formData = new FormData(e.target);
    const questionData = {
        category_id: parseInt(document.getElementById('questionCategory').value),
        question_text: document.getElementById('questionText').value,
        option_a: document.getElementById('optionA').value,
        option_b: document.getElementById('optionB').value,
        option_c: document.getElementById('optionC').value,
        option_d: document.getElementById('optionD').value,
        correct_answer: document.getElementById('correctAnswer').value,
        points: parseInt(document.getElementById('questionPoints').value)
    };

    // Validate that all options are different
    const options = [questionData.option_a, questionData.option_b, questionData.option_c, questionData.option_d];
    const uniqueOptions = new Set(options);
    if (uniqueOptions.size !== 4) {
        showMessage('All options must be different');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }

    try {
        const result = await addQuestion(questionData);

        if (result.message) {
            showMessage('Question added successfully!', 'success');
            e.target.reset();
            await loadQuestions(); // Refresh questions list
        } else {
            showMessage(result.message || 'Failed to add question');
        }
    } catch (error) {
        showMessage('Error adding question: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleAddCategory(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding Category...';
    submitBtn.disabled = true;

    const formData = new FormData(e.target);
    const categoryData = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value
    };

    try {
        const result = await addCategory(categoryData);

        if (result.message) {
            showMessage('Category added successfully!', 'success');
            e.target.reset();
            await loadCategories(); // Refresh categories list
        } else {
            showMessage(result.message || 'Failed to add category');
        }
    } catch (error) {
        showMessage('Error adding category: ' + error.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Tab functionality
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');

    // Load data for the tab if needed
    if (tabName === 'questions') {
        loadQuestions();
    } else if (tabName === 'categories') {
        loadCategories();
    }
}