// ===== SIGNUP PAGE SCRIPT =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
    apiKey: "AIzaSyAT4CDao7eHCFU0OO_dee_m6BpjzKv_308",
    authDomain: "mealcraft-9db35.firebaseapp.com",
    projectId: "mealcraft-9db35",
    messagingSenderId: "1052912873454",
    appId: "1:1052912873454:web:2b794eb8e9524f0ba068ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== DOM ELEMENTS =====
const authForm = document.getElementById('auth-form');
const toLoginBtn = document.getElementById('to-login-btn');
const submitBtn = document.getElementById('submit-btn');
const googleBtn = document.getElementById('google-signup'); // may be null — handled below
const messageDiv = document.getElementById('message');

// Input Elements
const fullNameInput = document.getElementById('full-name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirm-password');

// Error Elements
const nameError = document.getElementById('name-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmError = document.getElementById('confirm-error');
const strengthBar = document.getElementById('strength-bar');

// ===== VALIDATION =====
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Clear all errors
const clearErrors = () => {
    const errorElements = [nameError, emailError, passwordError, confirmError];
    const inputElements = [fullNameInput, emailInput, passwordInput, confirmInput];
    
    errorElements.forEach(el => {
        if (el) {
            el.textContent = '';
            el.classList.remove('visible');
        }
    });
    
    inputElements.forEach(el => {
        if (el) el.classList.remove('error');
    });
};

// Show field error
const showFieldError = (field, message) => {
    const errorMap = {
        name:     { element: nameError,     input: fullNameInput },
        email:    { element: emailError,    input: emailInput },
        password: { element: passwordError, input: passwordInput },
        confirm:  { element: confirmError,  input: confirmInput }
    };
    
    if (errorMap[field]) {
        errorMap[field].element.textContent = message;
        errorMap[field].element.classList.add('visible');
        errorMap[field].input.classList.add('error');
    }
};

// ===== PASSWORD STRENGTH CHECKER (visual only — no enforcement) =====
if (passwordInput) {
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        let strength = 0;

        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;

        if (password.length === 0) {
            strengthBar.className = 'strength-bar';
        } else if (strength <= 1) {
            strengthBar.className = 'strength-bar weak';
        } else if (strength === 2) {
            strengthBar.className = 'strength-bar medium';
        } else {
            strengthBar.className = 'strength-bar strong';
        }

        if (passwordError) {
            passwordError.classList.remove('visible');
            passwordInput.classList.remove('error');
        }
    });
}

// ===== PASSWORD MATCH CHECKER =====
if (confirmInput) {
    confirmInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        if (confirm.length > 0 && password !== confirm) {
            confirmError.textContent = 'Passwords do not match';
            confirmError.classList.add('visible');
            confirmInput.classList.add('error');
        } else {
            confirmError.classList.remove('visible');
            confirmInput.classList.remove('error');
        }
    });
}

// ===== SMOOTH REDIRECT HELPER =====
const smoothRedirect = (url, delayMs = 1200) => {
    setTimeout(() => {
        // Fade-out the page then navigate
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = url;
        }, 500);
    }, delayMs);
};

// ===== AUTH STATE CHECK =====
// Only redirect when a *persisted* session exists on page load — do NOT
// intercept the auth event that fires immediately after our own signup.
let signupInProgress = false;

onAuthStateChanged(auth, (user) => {
    if (user && !signupInProgress) {
        // Already logged in — send them to role page or home
        window.location.replace('pages/role.html');
    }
});

// ===== EVENT LISTENERS =====
// Login button
if (toLoginBtn) {
    toLoginBtn.addEventListener('click', () => {
        document.body.style.transition = 'opacity 0.4s ease';
        document.body.style.opacity = '0';
        setTimeout(() => { window.location.href = 'login.html'; }, 400);
    });
}

// Google signup (button may not be present in all layouts)
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        clearErrors();
        const provider = new GoogleAuthProvider();

        try {
            signupInProgress = true;
            setLoading(true);
            showMessage('Connecting to Google...', 'info');

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                username: user.displayName || user.email.split('@')[0],
                fullName: user.displayName || user.email.split('@')[0],
                role: 'customer',
                status: 'active',
                profileCompleted: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            showMessage('Account created! Redirecting...', 'success');
            smoothRedirect('pages/role.html');

        } catch (error) {
            console.error('Google signup error:', error);
            handleAuthError(error);
            signupInProgress = false;
            setLoading(false);
        }
    });
}

// ===== FORM SUBMISSION =====
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const fullName       = fullNameInput.value.trim();
        const email          = emailInput.value.trim();
        const password       = passwordInput.value;
        const confirmPassword = confirmInput.value;

        let isValid = true;

        // Name validation
        if (!fullName) {
            showFieldError('name', 'Please enter your full name');
            isValid = false;
        } else if (fullName.length < 2) {
            showFieldError('name', 'Name must be at least 2 characters');
            isValid = false;
        }

        // Email validation
        if (!email) {
            showFieldError('email', 'Please enter your email');
            isValid = false;
        } else if (!emailPattern.test(email)) {
            showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation — only minimum 8 characters required
        if (!password) {
            showFieldError('password', 'Please enter a password');
            isValid = false;
        } else if (password.length < 8) {
            showFieldError('password', 'Password must be at least 8 characters');
            isValid = false;
        }

        // Confirm password
        if (!confirmPassword) {
            showFieldError('confirm', 'Please confirm your password');
            isValid = false;
        } else if (password !== confirmPassword) {
            showFieldError('confirm', 'Passwords do not match');
            isValid = false;
        }

        if (!isValid) return;

        try {
            signupInProgress = true;
            setLoading(true);
            showMessage('Creating your account...', 'info');

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            await updateProfile(user, { displayName: fullName });

            // Save to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                username: fullName,
                fullName: fullName,
                role: 'customer',
                status: 'active',
                profileCompleted: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            showMessage('Account created successfully! Redirecting...', 'success');
            smoothRedirect('pages/role.html');

        } catch (error) {
            console.error('Signup error:', error);
            signupInProgress = false;

            if (error.code === 'auth/email-already-in-use') {
                showFieldError('email', 'This email is already registered');
            } else if (error.code === 'auth/weak-password') {
                showFieldError('password', 'Password is too weak (Firebase requires ≥6 chars)');
            } else if (error.code === 'auth/invalid-email') {
                showFieldError('email', 'Invalid email format');
            } else {
                handleAuthError(error);
            }

            setLoading(false);
        }
    });
}

// ===== HELPER FUNCTIONS =====
const setLoading = (loading) => {
    if (submitBtn) {
        submitBtn.disabled = loading;
        submitBtn.textContent = loading ? 'Processing...' : 'Sign Up';
    }
    // Only touch googleBtn if it actually exists
    if (googleBtn) googleBtn.disabled = loading;
};

const showMessage = (message, type) => {
    if (!messageDiv) return;
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;

    if (type !== 'error') {
        setTimeout(() => {
            messageDiv.className = 'message';
        }, 3000);
    }
};

const handleAuthError = (error) => {
    let message = 'An error occurred. Please try again.';

    switch (error.code) {
        case 'auth/network-request-failed':
            message = 'Network error. Check your connection.';
            break;
        case 'auth/popup-closed-by-user':
            message = 'Sign up cancelled.';
            break;
        default:
            message = error.message;
    }

    showMessage(message, 'error');
};

// Clear errors on input
if (fullNameInput) {
    fullNameInput.addEventListener('input', () => {
        nameError.classList.remove('visible');
        fullNameInput.classList.remove('error');
    });
}

if (emailInput) {
    emailInput.addEventListener('input', () => {
        emailError.classList.remove('visible');
        emailInput.classList.remove('error');
    });
}