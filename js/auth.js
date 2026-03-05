 import { auth } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// DOM Elements
const elements = {
  title: document.getElementById('title'),
  subtitle: document.getElementById('subtitle'),
  usernameGroup: document.getElementById('usernameGroup'),
  confirmPasswordGroup: document.getElementById('confirmPasswordGroup'),
  mainBtn: document.getElementById('mainBtn'),
  toggleText: document.getElementById('toggleText'),
  toggleLink: document.getElementById('toggleLink'),
  message: document.getElementById('message'),
  username: document.getElementById('username'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  confirmPassword: document.getElementById('confirmPassword')
};

let isSignup = false;

// Toggle between login and signup
window.toggleAuthMode = () => {
  isSignup = !isSignup;
  clearMessage();
  
  if (isSignup) {
    elements.title.textContent = 'Create Account';
    elements.subtitle.textContent = 'Join MealCraft today';
    elements.mainBtn.textContent = 'Sign Up';
    elements.toggleText.textContent = 'Already have an account?';
    elements.toggleLink.textContent = 'Sign In';
    elements.usernameGroup.style.display = 'block';
    elements.confirmPasswordGroup.style.display = 'block';
  } else {
    elements.title.textContent = 'Welcome Back';
    elements.subtitle.textContent = 'Sign in to continue';
    elements.mainBtn.textContent = 'Sign In';
    elements.toggleText.textContent = 'Don\'t have an account?';
    elements.toggleLink.textContent = 'Create Account';
    elements.usernameGroup.style.display = 'none';
    elements.confirmPasswordGroup.style.display = 'none';
  }
};

// Handle authentication
window.handleAuth = () => {
  if (isSignup) {
    signup();
  } else {
    login();
  }
};

// Login function
const login = async () => {
  const email = elements.email.value.trim();
  const password = elements.password.value;

  // Validation
  if (!email || !password) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showMessage('Please enter a valid email address', 'error');
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'pages/home.html';
  } catch (error) {
    handleAuthError(error);
  }
};

// Signup function
const signup = async () => {
  const username = elements.username.value.trim();
  const email = elements.email.value.trim();
  const password = elements.password.value;
  const confirmPassword = elements.confirmPassword.value;

  // Validation
  if (!username || !email || !password || !confirmPassword) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showMessage('Please enter a valid email address', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('Password must be at least 6 characters long', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('Passwords do not match', 'error');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Store username in session for later use
    sessionStorage.setItem('tempUsername', username);
    window.location.href = 'pages/role.html';
  } catch (error) {
    handleAuthError(error);
  }
};

// Google login
window.googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  
  try {
    await signInWithPopup(auth, provider);
    window.location.href = 'pages/home.html';
  } catch (error) {
    handleAuthError(error);
  }
};

// Helper functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const showMessage = (message, type) => {
  elements.message.textContent = message;
  elements.message.className = `message ${type}`;
};

const clearMessage = () => {
  elements.message.textContent = '';
  elements.message.className = 'message';
};

const handleAuthError = (error) => {
  let message = 'An error occurred. Please try again.';
  
  switch (error.code) {
    case 'auth/invalid-email':
      message = 'Invalid email address.';
      break;
    case 'auth/user-disabled':
      message = 'This account has been disabled.';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password.';
      break;
    case 'auth/email-already-in-use':
      message = 'An account already exists with this email.';
      break;
    case 'auth/weak-password':
      message = 'Password is too weak.';
      break;
    case 'auth/popup-closed-by-user':
      message = 'Sign in cancelled.';
      break;
  }
  
  showMessage(message, 'error');
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Hide signup fields initially
  elements.usernameGroup.style.display = 'none';
  elements.confirmPasswordGroup.style.display = 'none';
});