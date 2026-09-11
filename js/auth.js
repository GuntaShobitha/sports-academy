/**
 * STACKLY SPORTS ACADEMY - AUTHENTICATION SCRIPT
 * LocalStorage session management, User & Admin role routing, input validation
 */

const STORAGE_USERS_KEY = 'stackly_academy_users';
const STORAGE_CURRENT_USER_KEY = 'stackly_current_user';

// Seed default demo accounts if not already stored
(function seedDefaultAccounts() {
  const existingUsers = localStorage.getItem(STORAGE_USERS_KEY);
  if (!existingUsers) {
    const defaultAccounts = [
      {
        name: 'Alexander Vance',
        email: 'alexander.vance@elite.com',
        phone: '+1 (555) 234-8901',
        password: 'User123!',
        role: 'user'
      },
      {
        name: 'Coach Marcus Stone',
        email: 'admin@stackly.com',
        phone: '+1 (555) 987-6543',
        password: 'Admin123!',
        role: 'admin'
      }
    ];
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(defaultAccounts));
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
  initSocialAndForgotLinks();
});

/* --- Login Handling --- */
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const role = document.getElementById('role')?.value;
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked;

    // Reset error states
    clearErrors(loginForm);

    let hasError = false;

    if (!role) {
      showFieldError('role', 'Please select your role');
      hasError = true;
    }

    if (!email) {
      showFieldError('email', 'Email address is required');
      hasError = true;
    } else if (!isValidEmail(email)) {
      showFieldError('email', 'Please enter a valid email address');
      hasError = true;
    }

    if (!password) {
      showFieldError('password', 'Password is required');
      hasError = true;
    }

    if (hasError) return;

    // Open access: any valid email + password combination is accepted.
    // If the email matches an existing stored account, reuse its profile details.
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
    const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Save current active session
    const sessionData = {
      name: matchedUser ? matchedUser.name : email.split('@')[0],
      email: email, // Exact email preserved
      role: role,
      phone: matchedUser ? (matchedUser.phone || '') : '',
      loginTime: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(sessionData));

    if (rememberMe) {
      localStorage.setItem('stackly_remember_email', email);
    } else {
      localStorage.removeItem('stackly_remember_email');
    }

    showFormAlert(loginForm, 'Login successful! Entering dashboard...', 'success');

    setTimeout(() => {
      if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'user-dashboard.html';
      }
    }, 800);
  });

  // Prefill remembered email if available
  const remembered = localStorage.getItem('stackly_remember_email');
  if (remembered) {
    const emailInput = document.getElementById('email');
    const rememberCheckbox = document.getElementById('rememberMe');
    if (emailInput) emailInput.value = remembered;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }
}

/* --- Registration Handling --- */
function initRegisterForm() {
  const regForm = document.getElementById('registerForm');
  if (!regForm) return;

  regForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const role = document.getElementById('role')?.value;
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    clearErrors(regForm);
    let hasError = false;

    if (!role) {
      showFieldError('role', 'Please choose an account role');
      hasError = true;
    }

    if (!name || name.length < 2) {
      showFieldError('name', 'Full Name must be at least 2 characters');
      hasError = true;
    }

    if (!email || !isValidEmail(email)) {
      showFieldError('email', 'Please provide a valid email address');
      hasError = true;
    }

    if (!phone || phone.length < 7) {
      showFieldError('phone', 'Please provide a valid phone number');
      hasError = true;
    }

    if (!password || password.length < 6) {
      showFieldError('password', 'Password must be at least 6 characters');
      hasError = true;
    }

    if (password !== confirmPassword) {
      showFieldError('confirmPassword', 'Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]');
    const isDuplicate = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (isDuplicate) {
      showFormAlert(regForm, 'An account with this email address already exists. Please login.', 'error');
      return;
    }

    // Add new user
    const newUser = {
      name,
      email,
      phone,
      password,
      role
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));

    // Auto-login or redirect
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(newUser));

    showFormAlert(regForm, 'Account created successfully! Redirecting to your dashboard...', 'success');

    setTimeout(() => {
      if (role === 'admin') {
        window.location.href = './login.html';
      } else {
        window.location.href = './login.html';
      }
    }, 1000);
  });
}

/* --- Social Links & Forgot Password Redirection --- */
function initSocialAndForgotLinks() {
  // Requirement: Forgot password must redirect to 404.html
  const forgotLinks = document.querySelectorAll('.forgot-password-link');
  forgotLinks.forEach(l => {
    l.setAttribute('href', '404.html');
  });

  // Requirement: Every social media icon must redirect to 404.html
  const socialLinks = document.querySelectorAll('.footer-social-btn, .social-icon-link');
  socialLinks.forEach(l => {
    l.setAttribute('href', '404.html');
  });
}

/* --- Validation Helpers --- */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add('input-error');
  const parent = field.closest('.form-group') || field.parentElement;
  let err = parent.querySelector('.field-error-msg');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field-error-msg';
    err.style.color = 'var(--accent-red)';
    err.style.fontSize = '0.75rem';
    err.style.marginTop = '0.3rem';
    parent.appendChild(err);
  }
  err.textContent = message;
}

function clearErrors(form) {
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  form.querySelectorAll('.field-error-msg').forEach(el => el.remove());
  const alert = form.querySelector('.form-alert');
  if (alert) alert.remove();
}

function showFormAlert(form, message, type = 'info') {
  let alert = form.querySelector('.form-alert');
  if (!alert) {
    alert = document.createElement('div');
    alert.className = 'form-alert';
    alert.style.padding = '0.85rem 1.25rem';
    alert.style.borderRadius = 'var(--radius-md)';
    alert.style.marginBottom = '1.25rem';
    alert.style.fontSize = '0.875rem';
    alert.style.fontWeight = '600';
    form.prepend(alert);
  }

  if (type === 'error') {
    alert.style.background = 'rgba(239, 68, 68, 0.15)';
    alert.style.color = '#f87171';
    alert.style.border = '1px solid rgba(239, 68, 68, 0.3)';
  } else {
    alert.style.background = 'rgba(16, 185, 129, 0.15)';
    alert.style.color = '#34d399';
    alert.style.border = '1px solid rgba(16, 185, 129, 0.3)';
  }

  alert.textContent = message;
}
