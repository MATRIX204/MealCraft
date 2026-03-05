import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// State
let currentUser = null;
let selectedRole = null;

// DOM Elements
const elements = {
  roleButtons: document.getElementById('roleButtons'),
  formSection: document.getElementById('formSection'),
  formTitle: document.getElementById('formTitle'),
  customerBtn: document.getElementById('customerBtn'),
  restaurantBtn: document.getElementById('restaurantBtn'),
  restaurantNameGroup: document.getElementById('restaurantNameGroup'),
  websiteGroup: document.getElementById('websiteGroup'),
  tagsGroup: document.getElementById('tagsGroup'),
  message: document.getElementById('message')
};

// Check authentication
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("../index.html");
    return;
  }
  currentUser = user;
  
  // Get username from session storage
  const tempUsername = sessionStorage.getItem('tempUsername');
  if (tempUsername) {
    // Will be used when saving to Firestore
    sessionStorage.removeItem('tempUsername');
  }
});

// Select role
window.selectRole = (role) => {
  selectedRole = role;
  
  // Update UI
  elements.roleButtons.classList.add('hidden');
  elements.formSection.classList.remove('hidden');
  
  // Update form title
  elements.formTitle.textContent = role === 'customer' 
    ? 'Complete Your Customer Profile' 
    : 'Complete Your Restaurant Profile';
  
  // Show/hide restaurant fields
  const isRestaurant = role === 'restaurant';
  elements.restaurantNameGroup.classList.toggle('hidden', !isRestaurant);
  elements.websiteGroup.classList.toggle('hidden', !isRestaurant);
  elements.tagsGroup.classList.toggle('hidden', !isRestaurant);
  
  // Highlight selected role
  elements.customerBtn.classList.toggle('selected', role === 'customer');
  elements.restaurantBtn.classList.toggle('selected', role === 'restaurant');
};

// Submit role data
window.submitRole = async () => {
  if (!selectedRole) {
    showMessage('Please select a role first', 'error');
    return;
  }

  // Get form values
  const formData = {
    mobile: document.getElementById('mobile').value.trim(),
    country: document.getElementById('country').value.trim(),
    state: document.getElementById('state').value.trim(),
    city: document.getElementById('city').value.trim(),
    address: document.getElementById('address').value.trim()
  };

  // Validate common fields
  for (const [key, value] of Object.entries(formData)) {
    if (!value) {
      showMessage(`Please enter your ${key}`, 'error');
      return;
    }
  }

  // Validate mobile number
  if (!isValidMobile(formData.mobile)) {
    showMessage('Please enter a valid mobile number', 'error');
    return;
  }

  try {
    // Show loading state
    const submitBtn = document.querySelector('.btn-primary');
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    // Save user data
    await setDoc(doc(db, 'users', currentUser.uid), {
      email: currentUser.email,
      username: currentUser.displayName || sessionStorage.getItem('tempUsername') || '',
      role: selectedRole,
      ...formData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Save restaurant data if applicable
    if (selectedRole === 'restaurant') {
      const restaurantData = {
        restaurantName: document.getElementById('restaurantName').value.trim(),
        website: document.getElementById('website').value.trim(),
        tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        verified: false,
        ownerId: currentUser.uid,
        createdAt: serverTimestamp()
      };

      if (!restaurantData.restaurantName) {
        showMessage('Please enter restaurant name', 'error');
        return;
      }

      await setDoc(doc(db, 'restaurants', currentUser.uid), restaurantData);
    }

    // Clear session storage
    sessionStorage.clear();
    
    // Redirect to home
    window.location.href = 'home.html';
  } catch (error) {
    console.error('Error saving data:', error);
    showMessage('Error saving your information. Please try again.', 'error');
    
    // Reset button
    const submitBtn = document.querySelector('.btn-primary');
    submitBtn.textContent = 'Continue to MealCraft';
    submitBtn.disabled = false;
  }
};

// Helper functions
const isValidMobile = (mobile) => {
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(mobile);
};

const showMessage = (message, type) => {
  elements.message.textContent = message;
  elements.message.className = `message ${type}`;
};