// Main App Logic
(function() {
    'use strict';

    // ============ STATE ============
    const state = {
        pin: null,
        profiles: [],
        activeProfile: null,
        days: [],
        stats: null,
        today: null,
        loading: false,
        error: null
    };

    // ============ DOM ELEMENTS ============
    const elements = {
        // Screens
        pinScreen: document.getElementById('pin-screen'),
        profilesScreen: document.getElementById('profiles-screen'),
        profileScreen: document.getElementById('profile-screen'),

        // PIN Screen
        pinInput: document.getElementById('pin-input'),
        pinSubmit: document.getElementById('pin-submit'),
        pinError: document.getElementById('pin-error'),

        // Profiles Screen
        profilesList: document.getElementById('profiles-list'),
        createProfileBtn: document.getElementById('create-profile-btn'),
        logoutBtn: document.getElementById('logout-btn'),

        // Profile Screen
        backBtn: document.getElementById('back-btn'),
        lockBtn: document.getElementById('lock-btn'),
        profileName: document.getElementById('profile-name'),
        completionRate: document.getElementById('completion-rate'),
        currentStreak: document.getElementById('current-streak'),
        longestStreak: document.getElementById('longest-streak'),
        todayCompletion: document.getElementById('today-completion'),
        refreshBtn: document.getElementById('refresh-btn'),
        daysList: document.getElementById('days-list'),

        // Global
        loadingOverlay: document.getElementById('loading-overlay'),
        errorBanner: document.getElementById('error-banner'),
        toast: document.getElementById('toast')
    };

    // ============ UTILITY FUNCTIONS ============

    function showLoading() {
        state.loading = true;
        elements.loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        state.loading = false;
        elements.loadingOverlay.classList.add('hidden');
    }

    function showError(message) {
        elements.errorBanner.textContent = message;
        elements.errorBanner.classList.remove('hidden');
        setTimeout(() => {
            elements.errorBanner.classList.add('hidden');
        }, 5000);
    }

    function showToast(message, isError = false) {
        elements.toast.textContent = message;
        elements.toast.classList.toggle('error', isError);
        elements.toast.classList.remove('hidden');
        setTimeout(() => {
            elements.toast.classList.add('hidden');
        }, 3000);
    }

    function showScreen(screenElement) {
        // Hide all screens
        elements.pinScreen.classList.add('hidden');
        elements.profilesScreen.classList.add('hidden');
        elements.profileScreen.classList.add('hidden');

        // Show target screen
        screenElement.classList.remove('hidden');
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    function getTodayDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // ============ PIN SCREEN ============

    async function handlePinSubmit() {
        const pin = elements.pinInput.value.trim();
        
        if (!pin) {
            elements.pinError.textContent = 'Please enter a PIN';
            elements.pinError.classList.remove('hidden');
            elements.pinInput.classList.add('shake');
            setTimeout(() => elements.pinInput.classList.remove('shake'), 400);
            return;
        }

        showLoading();
        elements.pinError.classList.add('hidden');

        try {
            const isValid = await API.checkPin(pin);
            
            if (isValid) {
                // Store PIN
                localStorage.setItem('admin_pin', pin);
                state.pin = pin;
                
                // Navigate to profiles
                window.location.hash = '#/profiles';
            } else {
                // Invalid PIN
                elements.pinError.textContent = 'Invalid PIN';
                elements.pinError.classList.remove('hidden');
                elements.pinInput.classList.add('shake');
                elements.pinInput.value = '';
                setTimeout(() => elements.pinInput.classList.remove('shake'), 400);
            }
        } catch (error) {
            console.error('PIN validation error:', error);
            showError('Failed to validate PIN. Check your connection.');
        } finally {
            hideLoading();
        }
    }

    function initPinScreen() {
        elements.pinInput.value = '';
        elements.pinError.classList.add('hidden');
        elements.pinInput.focus();
    }

    // ============ PROFILES SCREEN ============

    async function loadProfiles() {
        showLoading();
        
        try {
            const profiles = await API.getProfiles();
            state.profiles = profiles;
            renderProfiles();
        } catch (error) {
            console.error('Failed to load profiles:', error);
            showError('Failed to load profiles');
        } finally {
            hideLoading();
        }
    }

    function renderProfiles() {
        elements.profilesList.innerHTML = '';

        if (state.profiles.length === 0) {
            elements.profilesList.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">No profiles found</p>';
            return;
        }

        state.profiles.forEach(profileName => {
            const card = document.createElement('div');
            card.className = 'profile-card';
            card.innerHTML = `
                <div class="profile-card-content">
                    <h3>${profileName}</h3>
                </div>
                <button class="profile-delete-btn" data-profile="${profileName}">Delete</button>
            `;
            
            // Click on card content navigates to profile
            const cardContent = card.querySelector('.profile-card-content');
            cardContent.addEventListener('click', () => {
                window.location.hash = `#/profile/${encodeURIComponent(profileName)}`;
            });
            
            // Delete button handler
            const deleteBtn = card.querySelector('.profile-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteProfile(profileName);
            });
            
            elements.profilesList.appendChild(card);
        });
    }

    function handleLogout() {
        localStorage.removeItem('admin_pin');
        state.pin = null;
        window.location.hash = '#/pin';
    }

    async function handleCreateProfile() {
        const profileName = prompt('Enter new profile name:');
        
        if (!profileName || !profileName.trim()) {
            return;
        }

        showLoading();
        try {
            await API.createProfile(profileName.trim());
            showToast('Profile created successfully!');
            
            // Reload profiles
            await loadProfiles();
        } catch (error) {
            console.error('Failed to create profile:', error);
            showToast('Failed to create profile', true);
        } finally {
            hideLoading();
        }
    }

    async function handleDeleteProfile(profileName) {
        const confirmation = prompt(`Are you sure you want to delete "${profileName}"?\nType "yes" or "Yes" to confirm:`);
        
        if (confirmation !== 'yes' && confirmation !== 'Yes') {
            return;
        }

        showLoading();
        try {
            await API.deleteProfile(profileName);
            showToast('Profile deleted successfully!');
            
            // Reload profiles
            await loadProfiles();
        } catch (error) {
            console.error('Failed to delete profile:', error);
            showToast('Failed to delete profile', true);
        } finally {
            hideLoading();
        }
    }

    // ============ PROFILE DETAIL SCREEN ============

    async function loadProfileData(profileName) {
        showLoading();
        state.activeProfile = profileName;
        elements.profileName.textContent = profileName;

        try {
            // Load stats, current day, progression status and unlocked days in parallel
            const [stats, currentDay, progressionStatus, days] = await Promise.all([
                API.getStats(profileName),
                API.getCurrentDay(profileName),
                API.getProgressionStatus(profileName),
                API.getDays(profileName)
            ]);

            state.stats = stats;
            state.currentDay = currentDay;
            state.progressionStatus = progressionStatus;
            state.days = days;

            renderStats();
            renderDays();
        } catch (error) {
            console.error('Failed to load profile data:', error);
            showError('Failed to load profile data');
        } finally {
            hideLoading();
        }
    }

    function renderStats() {
        if (!state.stats) return;

        const stats = state.stats;
        elements.completionRate.textContent = stats.completion_rate 
            ? `${Math.round(stats.completion_rate)}%` 
            : '--';
        elements.currentStreak.textContent = stats.current_streak || 0;
        elements.longestStreak.textContent = stats.longest_streak || 0;
        elements.todayCompletion.textContent = stats.today_completion !== undefined 
            ? `${stats.today_completion}/5` 
            : '--';
    }



    function renderDays() {
        elements.daysList.innerHTML = '';

        if (!state.days || state.days.length === 0) {
            elements.daysList.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">No days recorded yet</p>';
            return;
        }

        // Get current day number from progression status or current day
        const currentDayNumber = state.currentDay ? state.currentDay.day_count : 
                                (state.progressionStatus ? state.progressionStatus.current_day : null);

        // Sort days: current day first, then past days by date (most recent first)
        const sortedDays = [...state.days].sort((a, b) => {
            // Current day goes first
            if (a.day_count === currentDayNumber) return -1;
            if (b.day_count === currentDayNumber) return 1;
            // Then sort remaining by date in descending order (newest first)
            return new Date(b.date) - new Date(a.date);
        });

        sortedDays.forEach(day => {
            const isCurrentDay = day.day_count === currentDayNumber;
            const card = createDayCard(day, isCurrentDay);
            elements.daysList.appendChild(card);
        });
    }

    function createDayCard(day, isCurrentDay = false) {
        const card = document.createElement('div');
        card.className = `day-card${isCurrentDay ? ' current-day' : ''}`;
        card.dataset.dayCount = day.day_count;

        card.innerHTML = `
            <div class="day-header">
                <div class="day-number">Day ${day.day_count}</div>
                <div class="day-date">${formatDate(day.date)}</div>
            </div>
            <div class="habits-grid">
                ${createHabitToggle('water', 'Water', day.water, day.day_count)}
                ${createHabitToggle('exercise', 'Exercise', day.exercise, day.day_count)}
                ${createHabitToggle('reading', 'Reading', day.reading, day.day_count)}
                ${createHabitToggle('meditation', 'Meditation', day.meditation, day.day_count)}
                ${createHabitToggle('health_food', 'Healthy Food', day.health_food, day.day_count)}
            </div>
        `;

        // Attach toggle event listeners
        const toggles = card.querySelectorAll('.toggle-switch input');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', handleToggleChange);
        });

        return card;
    }

    function createHabitToggle(fieldName, label, isChecked, dayCount) {
        return `
            <div class="habit-item">
                <label class="habit-label">${label}</label>
                <label class="toggle-switch">
                    <input 
                        type="checkbox" 
                        ${isChecked ? 'checked' : ''} 
                        data-field="${fieldName}" 
                        data-day="${dayCount}"
                    >
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
    }

    async function handleToggleChange(event) {
        const checkbox = event.target;
        const field = checkbox.dataset.field;
        const dayCount = parseInt(checkbox.dataset.day);
        const newValue = checkbox.checked;

        // Optimistic UI - already changed by checkbox

        try {
            // Send update to backend
            await API.updateDayPartial(state.activeProfile, dayCount, field, newValue);

            // Reload stats to reflect changes
            const stats = await API.getStats(state.activeProfile);
            state.stats = stats;
            renderStats();

        } catch (error) {
            console.error('Failed to update habit:', error);
            
            // Revert UI on failure
            checkbox.checked = !newValue;
            showToast('Failed to update. Please try again.', true);
        }
    }

    async function handleRefresh() {
        if (!state.activeProfile) {
            showToast('No active profile', true);
            return;
        }

        showLoading();
        
        try {
            // Step 1: Check if we can advance
            const canAdvanceResponse = await API.canAdvance(state.activeProfile);
            console.log('Can advance check:', canAdvanceResponse);

            if (!canAdvanceResponse.can_advance) {
                // Cannot advance - show message and stop
                showToast(canAdvanceResponse.message || 'Cannot advance to next day yet');
                return;
            }

            // Step 2: Can advance - create the new day
            const advanceResponse = await API.advanceDay(state.activeProfile);
            console.log('Advance day response:', advanceResponse);

            if (advanceResponse.success) {
                // Success! Show message and reload data
                showToast(`Day ${canAdvanceResponse.next_day_count} created successfully!`);
                
                // Reload all profile data to show the new day
                await loadProfileData(state.activeProfile);
            } else {
                showToast('Failed to create new day', true);
            }

        } catch (error) {
            console.error('Refresh failed:', error);
            showToast('Failed to refresh progress. Please try again.', true);
        } finally {
            hideLoading();
        }
    }



    // ============ ROUTING ============

    function handleRoute() {
        const hash = window.location.hash || '#/pin';
        const pin = localStorage.getItem('admin_pin');

        // Check if we have a PIN
        if (!pin && !hash.startsWith('#/pin')) {
            window.location.hash = '#/pin';
            return;
        }

        // Route to appropriate screen
        if (hash.startsWith('#/pin')) {
            showScreen(elements.pinScreen);
            initPinScreen();
        } else if (hash === '#/profiles') {
            showScreen(elements.profilesScreen);
            loadProfiles();
        } else if (hash.startsWith('#/profile/')) {
            const profileName = decodeURIComponent(hash.split('/')[2]);
            showScreen(elements.profileScreen);
            loadProfileData(profileName);
        } else {
            // Default to profiles if logged in
            window.location.hash = '#/profiles';
        }
    }

    // ============ EVENT LISTENERS ============

    function initEventListeners() {
        // PIN Screen
        elements.pinSubmit.addEventListener('click', handlePinSubmit);
        elements.pinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handlePinSubmit();
            }
        });

        // Profiles Screen
        elements.createProfileBtn.addEventListener('click', handleCreateProfile);
        elements.logoutBtn.addEventListener('click', handleLogout);

        // Profile Screen
        elements.backBtn.addEventListener('click', () => {
            window.location.hash = '#/profiles';
        });
        elements.lockBtn.addEventListener('click', handleLogout);
        elements.refreshBtn.addEventListener('click', handleRefresh);

        // Hash change for routing
        window.addEventListener('hashchange', handleRoute);
    }

    // ============ INITIALIZATION ============

    function init() {
        initEventListeners();
        handleRoute();
    }

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
