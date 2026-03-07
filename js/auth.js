import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Login function - FIXED VERSION
const login = async () => {
  const email = elements.email.value.trim();
  const password = elements.password.value;

  if (!email || !password) {
    showMessage('Please fill in all fields', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showMessage('Please enter a valid email address', 'error');
    return;
  }

  try {
    setLoading(true);
    showMessage('Logging in...', 'info');

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("User logged in:", user.email);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("User role:", userData.role);
      
      // Strict admin check
      if (userData.role === 'admin' || email === 'admin@mealcraft.com') {
        console.log("Redirecting to admin panel...");
        window.location.href = 'pages/admin.html';
      } else {
        console.log("Redirecting to home...");
        window.location.href = 'pages/home.html';
      }
    } else {
      console.log("New user - redirecting to role selection");
      
      // Create basic user document if it doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: user.displayName || email.split('@')[0],
        role: email === 'admin@mealcraft.com' ? 'admin' : 'customer',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      if (email === 'admin@mealcraft.com') {
        window.location.href = 'pages/admin.html';
      } else {
        window.location.href = 'pages/role.html';
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    handleAuthError(error);
    setLoading(false);
  }
};

// Signup function - FIXED VERSION
const signup = async () => {
  const username = elements.username.value.trim();
  const email = elements.email.value.trim();
  const password = elements.password.value;
  const confirmPassword = elements.confirmPassword.value;

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
    setLoading(true);
    showMessage('Creating account...', 'info');

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("User created:", user.email);
    
    // Determine role
    let role = 'customer';
    if (email === 'admin@mealcraft.com') {
      role = 'admin';
    }
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      username: username,
      fullName: username,
      role: role,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log("User document created with role:", role);
    
    showMessage('Account created successfully!', 'success');
    
    // Redirect based on role
    setTimeout(() => {
      if (role === 'admin') {
        window.location.href = 'pages/admin.html';
      } else {
        window.location.href = 'pages/role.html';
      }
    }, 1500);
  } catch (error) {
    console.error('Signup error:', error);
    handleAuthError(error);
    setLoading(false);
  }
};

// Google login - FIXED VERSION
window.googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  
  try {
    setLoading(true);
    showMessage('Connecting to Google...', 'info');

    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    console.log("Google user:", user.email);

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      console.log("Creating new user document for Google user");
      
      // Create new user document
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        username: user.displayName || user.email.split('@')[0],
        fullName: user.displayName || user.email.split('@')[0],
        role: 'customer',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      window.location.href = 'pages/role.html';
    } else {
      const userData = userDoc.data();
      console.log("Existing user role:", userData.role);
      
      if (userData.role === 'admin') {
        window.location.href = 'pages/admin.html';
      } else {
        window.location.href = 'pages/home.html';
      }
    }
  } catch (error) {
    console.error('Google login error:', error);
    handleAuthError(error);
    setLoading(false);
  }
};

// Helper functions
const setLoading = (loading) => {
  elements.mainBtn.disabled = loading;
  elements.mainBtn.innerHTML = loading ? '<span>Please wait...</span>' : (isSignup ? '<span>Sign Up</span>' : '<span>Sign In</span>');
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const showMessage = (message, type) => {
  elements.message.textContent = message;
  elements.message.className = `message ${type}`;
  elements.message.style.display = 'block';
  
  if (type !== 'error') {
    setTimeout(() => {
      elements.message.style.display = 'none';
    }, 3000);
  }
};

const clearMessage = () => {
  elements.message.textContent = '';
  elements.message.className = 'message';
  elements.message.style.display = 'none';
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
    case 'auth/network-request-failed':
      message = 'Network error. Check your connection.';
      break;
    default:
      message = error.message;
  }
  
  showMessage(message, 'error');
  setLoading(false);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Hide signup fields initially
  elements.usernameGroup.style.display = 'none';
  elements.confirmPasswordGroup.style.display = 'none';
  
  // Check if user is already logged in
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("Already logged in:", user.email);
      
      // Check if on login page
      if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.role === 'admin' || user.email === 'admin@mealcraft.com') {
            window.location.href = 'pages/admin.html';
          } else if (userData.role === 'delivery') {
            window.location.href = 'pages/delivery.html';
          } else {
            window.location.href = 'pages/home.html';
          }
        }
      }
    }
    unsubscribe();
  });
});