// ===== LOGIN PAGE SCRIPT =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc,
    setDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
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
const toSignupBtn = document.getElementById('to-signup-btn');
const submitBtn = document.getElementById('submit-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageDiv = document.getElementById('message');
const googleBtn = document.getElementById('google-login');
const forgotLink = document.getElementById('forgot-link');

// Error message elements
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');

// ===== VALIDATION =====
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const deliveryEmailPattern = /@mealcraft\.delivery$/;

// Admin credentials
const ADMIN_EMAIL = 'admin@mealcraft.com';
const ADMIN_PASSWORD = 'admin123';

// Clear all errors
const clearErrors = () => {
    emailError.textContent = '';
    emailError.classList.remove('visible');
    passwordError.textContent = '';
    passwordError.classList.remove('visible');
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');
};

// Show field error
const showFieldError = (field, message) => {
    if (field === 'email') {
        emailError.textContent = message;
        emailError.classList.add('visible');
        emailInput.classList.add('error');
    } else if (field === 'password') {
        passwordError.textContent = message;
        passwordError.classList.add('visible');
        passwordInput.classList.add('error');
    }
};

// ===== ADMIN AUTO-FILL FUNCTION =====
window.fillAdminCredentials = () => {
    emailInput.value = ADMIN_EMAIL;
    passwordInput.value = ADMIN_PASSWORD;
    
    // Visual feedback
    emailInput.style.borderColor = '#10b981';
    passwordInput.style.borderColor = '#10b981';
    
    showMessage('✅ Admin credentials filled! Click Log In', 'success');
};

// ===== DELIVERY BOY LOGIN FUNCTION (Vehicle Number as Password) =====
const loginDeliveryBoy = async (email, vehicleNumber) => {
    try {
        console.log("Attempting delivery login with email:", email);
        console.log("Vehicle number provided:", vehicleNumber);
        
        // Query deliveryBoys collection for matching email
        const deliveryQuery = query(
            collection(db, 'deliveryBoys'),
            where('email', '==', email)
        );
        
        const deliverySnapshot = await getDocs(deliveryQuery);
        
        if (deliverySnapshot.empty) {
            console.log("No delivery boy found with email:", email);
            return { success: false, error: 'No delivery account found with this email' };
        }
        
        // Get delivery boy data
        const deliveryDoc = deliverySnapshot.docs[0];
        const deliveryData = deliveryDoc.data();
        
        console.log("Found delivery boy:", deliveryData.fullName);
        
        // Check if delivery boy is active
        if (deliveryData.status !== 'active') {
            return { success: false, error: 'Your account is inactive. Please contact admin.' };
        }
        
        // Get the stored vehicle number (check both possible field names)
        const storedVehicle = deliveryData.vehicle || deliveryData.vehicleNumber || '';
        
        console.log("Stored vehicle:", storedVehicle);
        console.log("Provided vehicle:", vehicleNumber);
        
        // Compare vehicle numbers (case insensitive, trim spaces)
        if (storedVehicle.trim().toLowerCase() !== vehicleNumber.trim().toLowerCase()) {
            return { success: false, error: 'Invalid vehicle number' };
        }
        
        // For delivery boys, we don't use Firebase Auth
        // Just store session data and return success
        sessionStorage.setItem('deliveryId', deliveryDoc.id);
        sessionStorage.setItem('deliveryName', deliveryData.fullName || deliveryData.name);
        sessionStorage.setItem('deliveryEmail', deliveryData.email);
        sessionStorage.setItem('deliveryVehicle', storedVehicle);
        sessionStorage.setItem('deliveryLoginMethod', 'vehicle');
        
        return { 
            success: true, 
            data: {
                id: deliveryDoc.id,
                ...deliveryData
            }
        };
        
    } catch (error) {
        console.error('Delivery login error:', error);
        
        if (error.code === 'permission-denied') {
            return { success: false, error: 'Permission denied. Please check Firebase rules.' };
        }
        
        return { success: false, error: 'Database error: ' + error.message };
    }
};

// ===== AUTH STATE CHECK =====
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("Auth state changed - user:", user.uid, user.email);
        
        // Check if this is a delivery login (from session)
        const deliveryId = sessionStorage.getItem('deliveryId');
        const loginMethod = sessionStorage.getItem('deliveryLoginMethod');
        
        if (deliveryId && loginMethod === 'vehicle') {
            console.log("Delivery session found (vehicle login), redirecting to delivery page");
            window.location.href = 'pages/delivery.html';
            return;
        }
        
        // Regular user login (Firebase Auth)
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                if (userData.role === 'admin' || user.email === ADMIN_EMAIL) {
                    window.location.href = 'pages/admin.html';
                } else if (userData.role === 'delivery') {
                    // This should not happen for delivery boys using vehicle login
                    window.location.href = 'pages/delivery.html';
                } else {
                    window.location.href = 'pages/home.html';
                }
            } else {
                window.location.href = 'pages/role.html';
            }
        } catch (error) {
            console.error('Auth state error:', error);
        }
    }
});

// ===== EVENT LISTENERS =====
// Sign Up button
toSignupBtn.addEventListener('click', () => {
    window.location.href = 'signup.html';
});

// Forgot password - only for regular users
forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    clearErrors();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showFieldError('email', 'Please enter your email address');
        return;
    }
    
    if (!emailPattern.test(email)) {
        showFieldError('email', 'Please enter a valid email address');
        return;
    }
    
    // Check if it's a delivery email
    if (deliveryEmailPattern.test(email)) {
        showMessage('Delivery boys use vehicle number as password. Please contact admin if you forgot your vehicle number.', 'info');
        return;
    }
    
    try {
        setLoading(true);
        await sendPasswordResetEmail(auth, email);
        showMessage('Password reset email sent! Check your inbox.', 'success');
        setLoading(false);
    } catch (error) {
        console.error('Password reset error:', error);
        if (error.code === 'auth/user-not-found') {
            showFieldError('email', 'No account found with this email');
        } else {
            showMessage('Error sending reset email. Please try again.', 'error');
        }
        setLoading(false);
    }
});

// Google login - disabled for delivery emails
googleBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    
    // Check if trying to use Google with delivery email
    if (email && deliveryEmailPattern.test(email)) {
        showMessage('Delivery boys cannot use Google login. Please use email and vehicle number.', 'error');
        return;
    }
    
    clearErrors();
    const provider = new GoogleAuthProvider();
    
    try {
        setLoading(true);
        showMessage('Connecting to Google...', 'info');

        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
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
            if (userData.role === 'admin') {
                window.location.href = 'pages/admin.html';
            } else if (userData.role === 'delivery') {
                window.location.href = 'pages/delivery.html';
            } else {
                window.location.href = 'pages/home.html';
            }
        }
    } catch (error) {
        console.error('Google login error:', error);
        handleAuthError(error);
        setLoading(false);
    }
});

// Form submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Validation
    let isValid = true;
    
    if (!email) {
        showFieldError('email', 'Please enter your email');
        isValid = false;
    } else if (!emailPattern.test(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!password) {
        showFieldError('password', 'Please enter your password');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Check if it's a delivery boy login (using vehicle number as password)
    if (deliveryEmailPattern.test(email)) {
        setLoading(true);
        showMessage('Verifying delivery credentials...', 'info');
        
        // Delivery boy login - vehicle number is used as password
        const result = await loginDeliveryBoy(email, password);
        
        if (result.success) {
            showMessage('✅ Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'pages/delivery.html';
            }, 1500);
        } else {
            showFieldError('password', result.error);
            setLoading(false);
        }
        return;
    }
    
    // Regular Firebase Auth login for customers and admin
    try {
        setLoading(true);
        showMessage('Logging in...', 'info');

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (userData.role === 'admin' || email === ADMIN_EMAIL) {
                window.location.href = 'pages/admin.html';
            } else if (userData.role === 'delivery') {
                window.location.href = 'pages/delivery.html';
            } else {
                window.location.href = 'pages/home.html';
            }
        } else {
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                username: email.split('@')[0],
                fullName: email.split('@')[0],
                role: email === ADMIN_EMAIL ? 'admin' : 'customer',
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            
            if (email === ADMIN_EMAIL) {
                window.location.href = 'pages/admin.html';
            } else {
                window.location.href = 'pages/role.html';
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        
        if (error.code === 'auth/user-not-found') {
            showFieldError('email', 'No account found with this email');
        } else if (error.code === 'auth/wrong-password') {
            showFieldError('password', 'Incorrect password');
        } else if (error.code === 'auth/invalid-email') {
            showFieldError('email', 'Invalid email format');
        } else if (error.code === 'auth/too-many-requests') {
            showMessage('Too many failed attempts. Try again later.', 'error');
        } else {
            handleAuthError(error);
        }
        
        setLoading(false);
    }
});

// ===== HELPER FUNCTIONS =====
const setLoading = (loading) => {
    submitBtn.disabled = loading;
    googleBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Processing...' : 'Log In';
};

const showMessage = (message, type) => {
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
            message = 'Sign in cancelled.';
            break;
        default:
            message = error.message;
    }
    
    showMessage(message, 'error');
};

// Clear errors on input
emailInput.addEventListener('input', () => {
    emailError.classList.remove('visible');
    emailInput.classList.remove('error');
    emailInput.style.borderColor = ''; // Reset border color
});

passwordInput.addEventListener('input', () => {
    passwordError.classList.remove('visible');
    passwordInput.classList.remove('error');
    passwordInput.style.borderColor = ''; // Reset border color
});