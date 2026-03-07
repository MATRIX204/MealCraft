// ===== SPLASH SCREEN SCRIPT =====
// DOM Elements
const orderBtn = document.getElementById('order-btn');
const loadingWrapper = document.getElementById('loading-wrapper');
const loadingBar = document.getElementById('loading-bar');
const progressPercent = document.getElementById('progress-percent');

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

// Order button click handler - Redirect to home page
orderBtn.addEventListener('click', async () => {
    // Show loading bar
    loadingWrapper.style.display = 'block';
    orderBtn.style.opacity = '0.5';
    orderBtn.disabled = true;
    
    // Start loading bar animation
    setTimeout(() => {
        loadingBar.style.width = '100%';
    }, 10);
    
    // Animate percentage
    await animateLoading();
    
    // Redirect to home page (browse mode)
    window.location.href = 'pages/home.html';
});

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