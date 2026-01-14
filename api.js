// API Module - All backend communication
const API = (() => {
    const BASE_URL = 'https://log75-x73s4.ondigitalocean.app';
    const API_PREFIX = '/api/v1';

    // Helper to get full API URL
    const getUrl = (path) => {
        return `${BASE_URL}${API_PREFIX}${path}`;
    };

    // Helper to get PIN from localStorage
    const getPin = () => {
        return localStorage.getItem('admin_pin');
    };

    // Helper to build headers
    const getHeaders = (includePin = false) => {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includePin) {
            const pin = getPin();
            if (pin) {
                headers['X-ADMIN-PIN'] = pin;
            }
        }
        
        return headers;
    };

    // Generic fetch wrapper with error handling
    const fetchAPI = async (url, options = {}) => {
        try {
            // Ensure headers are always set
            if (!options.headers) {
                options.headers = {};
            }
            
            const response = await fetch(url, options);
            
            // Handle 401 - unauthorized
            if (response.status === 401) {
                localStorage.removeItem('admin_pin');
                window.location.hash = '#/pin';
                throw new Error('Unauthorized - PIN cleared');
            }

            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Parse JSON response
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };

    return {
        // ============ AUTH ============
        
        /**
         * Validate PIN
         * POST /check-pin
         */
        checkPin: async (pin) => {
            const url = `${BASE_URL}${API_PREFIX}/check-pin`;
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "pin": pin })
                });

                if (!response.ok) {
                    console.error('PIN check failed with status:', response.status);
                    const responseText = await response.text();
                    console.error('Response body:', responseText);
                    return false;
                }

                const data = await response.json();
                // Handle both { "valid": true } and raw true
                return data === true || data.valid === true;
            } catch (error) {
                console.error('PIN check error:', error);
                return false;
            }
        },

        // ============ PROFILES ============

        /**
         * Get all profiles
         * GET /api/v1/profiles/
         */
        getProfiles: async () => {
            const url = getUrl('/');
            const data = await fetchAPI(url);
            return data.profiles || [];
        },

        /**
         * Get single profile metadata
         * GET /api/v1/profiles/{profile_name}
         */
        getProfile: async (profileName) => {
            const url = getUrl(`/${encodeURIComponent(profileName)}`);
            return await fetchAPI(url);
        },

        /**
         * Create new profile
         * POST /api/v1/profiles/
         */
        createProfile: async (name) => {
            const url = getUrl('/');
            const headers = getHeaders(true);
            return await fetchAPI(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ name })
            });
        },

        /**
         * Delete profile
         * DELETE /api/v1/{profile_name}
         */
        deleteProfile: async (name) => {
            const url = getUrl(`/${encodeURIComponent(name)}`);
            const pin = getPin();
            return await fetchAPI(url, {
                method: 'DELETE',
                headers: {
                    'X-ADMIN-PIN': pin
                }
            });
        },

        // ============ DAYS ============

        /**
         * Get unlocked days for profile
         * GET /api/v1/profiles/{profile_name}/days
         */
        getDays: async (profileName) => {
            const url = getUrl(`/${encodeURIComponent(profileName)}/days`);
            return await fetchAPI(url);
        },

        /**
         * Get single day
         * GET /api/v1/profiles/{profile_name}/days/{day_count}
         */
        getDay: async (profileName, dayCount) => {
            const url = getUrl(`/${encodeURIComponent(profileName)}/days/${dayCount}`);
            return await fetchAPI(url);
        },

        /**
         * Get current day data
         * GET /api/v1/profiles/{profile_name}/current-day
         */
        getCurrentDay: async (profileName) => {
            const url = getUrl(`/${encodeURIComponent(profileName)}/current-day`);
            return await fetchAPI(url);
        },

        /**
         * Get progression status
         * GET /api/v1/profiles/{profile_name}/progression-status
         */
        getProgressionStatus: async (profileName) => {
            const url = getUrl(`/${encodeURIComponent(profileName)}/progression-status`);
            return await fetchAPI(url);
        },



        /**
         * Partial update (single field)
         * PATCH /api/v1/profiles/{profile_name}/days/{day_count}
         */
        updateDayPartial: async (profileName, dayCount, field, value) => {
            const url = getUrl(`/${encodeURIComponent(profileName)}/days/${dayCount}`);
            const headers = getHeaders(true);
            return await fetchAPI(url, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ [field]: value })
            });
        },

        /**
         * Full update (all fields)
         * PUT /api/v1/profiles/{profile_name}/days/{day_count}
         */
        updateDayFull: async (profileName, dayCount, data) => {
            const url = getUrl(`/${encodeURIComponent(profileName)}/days/${dayCount}`);
            const headers = getHeaders(true);
            return await fetchAPI(url, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(data)
            });
        },

        // ============ STATS ============

        /**
         * Get profile stats
         * GET /api/v1/stats/{profile_name}
         */
        getStats: async (profileName) => {
            const url = getUrl(`/${encodeURIComponent(profileName)}`);
            return await fetchAPI(url);
        },

        /**
         * Get global stats
         * GET /api/v1/stats/
         */
        getGlobalStats: async () => {
            const url = getUrl('/');
            return await fetchAPI(url);
        }
    };
})();
