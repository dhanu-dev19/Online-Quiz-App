// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Check if user is already logged in
    const user = getCurrentUser();
    if (user && (window.location.pathname.includes('login.html') ||
                 window.location.pathname.includes('register.html') ||
                 window.location.pathname.includes('index.html'))) {
        window.location.href = 'home.html';
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;

    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        const result = await loginUser(data);

        if (result.token && result.user) {
            const userData = {
                ...result.user,
                token: result.token
            };
            setCurrentUser(userData);
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            showMessage(result.message || 'Login failed');
        }
    } catch (error) {
        showMessage(error.message || 'An error occurred during login');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    const formData = new FormData(e.target);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
        showMessage('Passwords do not match');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
    }

    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: password
    };

    try {
        const result = await registerUser(data);

        if (result.message) {
            showMessage('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(result.message || 'Registration failed');
        }
    } catch (error) {
        showMessage(error.message || 'An error occurred during registration');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}