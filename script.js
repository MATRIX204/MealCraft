// ===== SPLASH SCREEN SCRIPT =====

// ── Sign out any active admin Firebase session immediately ──────────────
// We load Firebase compat scripts lazily to do this without making
// index.html depend on Firebase modules in a blocking way.
(async () => {
    try {
        // Dynamically import Firebase so the rest of the page doesn't wait
        const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
        const { getAuth, signOut, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");

        const firebaseConfig = {
            apiKey: "AIzaSyAT4CDao7eHCFU0OO_dee_m6BpjzKv_308",
            authDomain: "mealcraft-9db35.firebaseapp.com",
            projectId: "mealcraft-9db35",
            messagingSenderId: "1052912873454",
            appId: "1:1052912873454:web:2b794eb8e9524f0ba068ff"
        };

        const ADMIN_EMAIL = 'admin@mealcraft.com';
        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
        const auth = getAuth(app);

        onAuthStateChanged(auth, async (user) => {
            if (user && user.email === ADMIN_EMAIL) {
                // Admin is still signed in — sign them out so they can't bleed into guest mode
                await signOut(auth);
                // Also clear any localStorage traces of admin
                localStorage.removeItem('lastLoggedInUser');
                localStorage.removeItem('lastUserName');
                localStorage.removeItem('lastUserRole');
                sessionStorage.clear();
                // Refresh UI now that we know there's no last user
                checkLastUser();
            }
        });
    } catch (e) {
        // Firebase unavailable (offline) — just continue
        console.warn('Firebase check skipped:', e.message);
    }
})();

// DOM Elements
const orderBtn = document.getElementById('order-btn');
const loadingWrapper = document.getElementById('loading-wrapper');
const loadingBar = document.getElementById('loading-bar');
const progressPercent = document.getElementById('progress-percent');
const lastUserInfo = document.getElementById('lastUserInfo');
const guestLink = document.getElementById('guestLink');

// Check for last logged in user (not admin)
const checkLastUser = () => {
    try {
        const lastUser = localStorage.getItem('lastLoggedInUser');
        const lastUserName = localStorage.getItem('lastUserName');
        
        if (lastUser && lastUser !== 'admin@mealcraft.com') {
            // Show last user info
            lastUserInfo.style.display = 'inline-block';
            lastUserInfo.innerHTML = `<i class="fas fa-history"></i> Last login: <strong>${lastUserName || lastUser}</strong>`;
            
            // Change button text to reflect last user
            orderBtn.innerHTML = `Continue as ${lastUserName || 'User'} →`;
        } else {
            lastUserInfo.style.display = 'none';
            orderBtn.innerHTML = 'Browse Menu →';
        }
    } catch (error) {
        console.error('Error checking last user:', error);
    }
};

// Save guest mode preference
const setGuestMode = () => {
    localStorage.setItem('browseMode', 'guest');
    localStorage.removeItem('lastLoggedInUser'); // Clear any previous login
};

// Clear ALL admin-related data unconditionally every time the splash loads
const clearAdminData = () => {
    const lastUser = localStorage.getItem('lastLoggedInUser');
    if (!lastUser || lastUser === 'admin@mealcraft.com') {
        localStorage.removeItem('lastLoggedInUser');
        localStorage.removeItem('lastUserName');
        localStorage.removeItem('lastUserRole');
    }
    // Always clear session — admin panel uses sessionStorage for its state
    sessionStorage.removeItem('deliveryId');
    sessionStorage.removeItem('deliveryLoginMethod');
};

// Loading animation
const animateLoading = () => {
    return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            if (progress <= 100) {
                progressPercent.textContent = progress + '%';
            } else {
                clearInterval(interval);
                resolve();
            }
        }, 40); // 40ms * 50 = 2000ms (2 seconds)
    });
};

// Redirect to home with mode
const goToHome = (mode = 'guest') => {
    // Show loading bar
    loadingWrapper.style.display = 'block';
    orderBtn.style.opacity = '0.5';
    orderBtn.disabled = true;
    
    // Start loading bar animation
    setTimeout(() => {
        loadingBar.style.width = '100%';
    }, 10);
    
    // Animate percentage
    animateLoading().then(() => {
        // Store the mode in session storage for the home page
        sessionStorage.setItem('entryMode', mode);
        
        // Redirect to home page
        window.location.href = 'pages/home.html';
    });
};

// Order button click handler
orderBtn.addEventListener('click', async () => {
    const lastUser = localStorage.getItem('lastLoggedInUser');
    
    // If there's a last user (not admin), try to auto-login
    if (lastUser && lastUser !== 'admin@mealcraft.com') {
        // Store that we're continuing as this user
        sessionStorage.setItem('continueAsUser', lastUser);
        goToHome('returning');
    } else {
        // No last user, go as guest
        setGuestMode();
        goToHome('guest');
    }
});

// Guest link click handler
guestLink.addEventListener('click', (e) => {
    e.preventDefault();
    setGuestMode();
    goToHome('guest');
});

// Clear any admin data on load
clearAdminData();

// Check for last user on load
checkLastUser();

// Smooth entrance animation
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.hero').style.opacity = '0';
    document.querySelector('.hero').style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        document.querySelector('.hero').style.transition = 'all 0.8s ease';
        document.querySelector('.hero').style.opacity = '1';
        document.querySelector('.hero').style.transform = 'translateY(0)';
    }, 100);
});