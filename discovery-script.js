/**
 * MAD - Mobile Athlete Data Collection
 * Discovery Form validation, data collection, and webhook submission
 * Form 2 - Captures athlete context and finalises GDPR consent
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        webhookUrl: 'https://expressions-part-fifth-oliver.trycloudflare.com/webhook/mad-discovery',
        submitTimeout: 30000 // 30 seconds
    };

    // DOM Elements
    const form = document.getElementById('discovery-form');
    const submitButton = document.getElementById('submit-btn');
    const statusDiv = document.getElementById('form-status');
    const athleteNameInput = document.getElementById('athlete-name');
    const athleteNameDisplay = document.getElementById('athlete-name-display');
    const consentPrivacy = document.getElementById('consent-privacy');
    const consentData = document.getElementById('consent-data');

    // Error messages
    const MESSAGES = {
        required: 'This field is required',
        number: 'Please enter a valid number',
        range: 'Please enter a value between {min} and {max}',
        consent: 'You must agree to continue',
        noAthlete: 'Athlete not identified. Please use the link from your registration confirmation.'
    };

    /**
     * Get athlete name from URL parameter
     */
    function getAthleteFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('athlete') || params.get('athleteName');
    }

    /**
     * Show error message for a field
     */
    function showError(field, message) {
        clearError(field);

        field.classList.add('field-error');
        field.setAttribute('aria-invalid', 'true');

        const errorId = field.id + '-error';
        const errorSpan = document.createElement('span');
        errorSpan.id = errorId;
        errorSpan.className = 'error-message';
        errorSpan.setAttribute('role', 'alert');
        errorSpan.textContent = message;

        field.setAttribute('aria-describedby', errorId);
        field.parentNode.insertBefore(errorSpan, field.nextSibling);
    }

    /**
     * Clear error message for a field
     */
    function clearError(field) {
        field.classList.remove('field-error');
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');

        const errorId = field.id + '-error';
        const existingError = document.getElementById(errorId);
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Validate a single field
     */
    function validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const isRequired = field.hasAttribute('required');

        // Clear previous error
        clearError(field);

        // Required field check
        if (isRequired && !value) {
            if (type === 'checkbox' && !field.checked) {
                showError(field, MESSAGES.consent);
                return false;
            } else if (type !== 'checkbox') {
                showError(field, MESSAGES.required);
                return false;
            }
        }

        // Skip further validation if empty and not required
        if (!value && !isRequired) {
            return true;
        }

        // Number range validation
        if (type === 'number' && value) {
            const numValue = parseFloat(value);
            const min = field.hasAttribute('min') ? parseFloat(field.getAttribute('min')) : null;
            const max = field.hasAttribute('max') ? parseFloat(field.getAttribute('max')) : null;

            if (isNaN(numValue)) {
                showError(field, MESSAGES.number);
                return false;
            }

            if (min !== null && max !== null && (numValue < min || numValue > max)) {
                showError(field, MESSAGES.range.replace('{min}', min).replace('{max}', max));
                return false;
            }
        }

        // Checkbox validation
        if (type === 'checkbox' && isRequired && !field.checked) {
            showError(field, MESSAGES.consent);
            return false;
        }

        return true;
    }

    /**
     * Validate entire form
     */
    function validateForm() {
        const fields = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        let firstErrorField = null;

        // Check athlete identification first
        if (!athleteNameInput.value) {
            showStatus(MESSAGES.noAthlete, 'error');
            return false;
        }

        fields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = field;
                }
            }
        });

        // Focus first error field
        if (firstErrorField) {
            firstErrorField.focus();
        }

        return isValid;
    }

    /**
     * Collect form data into submission format
     */
    function collectFormData() {
        return {
            athleteName: athleteNameInput.value,
            training: {
                yearsTotal: parseIntOrNull(document.getElementById('training-years-total').value),
                yearsWithCoach: parseIntOrNull(document.getElementById('training-years-coach').value),
                sessionsPerWeek: parseIntOrNull(document.getElementById('sessions-per-week').value),
                trainingGroup: document.getElementById('training-group').value || null,
                previousSports: document.getElementById('previous-sports').value.trim() || null
            },
            events: {
                currentEvents: document.getElementById('current-events').value.trim() || null
            },
            goals: {
                shortTerm: document.getElementById('goals-short-term').value.trim(),
                mediumTerm: document.getElementById('goals-medium-term').value.trim() || null,
                longTerm: document.getElementById('goals-long-term').value.trim() || null,
                motivation: document.getElementById('motivation').value.trim() || null
            },
            growth: {
                height: parseFloatOrNull(document.getElementById('height').value),
                weight: parseFloatOrNull(document.getElementById('weight').value),
                motherHeight: parseFloatOrNull(document.getElementById('mother-height').value),
                fatherHeight: parseFloatOrNull(document.getElementById('father-height').value)
            },
            health: {
                injuryHistory: document.getElementById('injury-history').value.trim() || null,
                medicalConditions: document.getElementById('medical-conditions').value.trim() || null,
                dietaryRequirements: document.getElementById('dietary-requirements').value.trim() || null
            },
            lifestyle: {
                school: document.getElementById('school').value.trim(),
                yearGroup: document.getElementById('year-group').value,
                schoolSports: document.getElementById('school-sports').value.trim() || null,
                otherActivities: document.getElementById('other-activities').value.trim() || null
            },
            family: {
                livesWith: document.getElementById('lives-with').value.trim() || null,
                siblings: document.getElementById('siblings').value.trim() || null,
                parentInvolvement: document.getElementById('parent-involvement').value || null,
                communicationPreference: document.getElementById('communication-preference').value || null
            },
            logistics: {
                travelToTraining: document.getElementById('travel-to-training').value.trim() || null,
                travelTime: parseIntOrNull(document.getElementById('travel-time').value),
                facilityAccess: document.getElementById('facility-access').value.trim() || null,
                competitionTravel: document.getElementById('competition-travel').value || null
            },
            calendar: {
                knownAbsences: document.getElementById('known-absences').value.trim() || null,
                examPeriods: document.getElementById('exam-periods').value.trim() || null
            },
            consent: {
                privacyNotice: consentPrivacy.checked,
                dataCollection: consentData.checked,
                scope: 'registration_and_discovery',
                timestamp: new Date().toISOString(),
                formVersion: '2.0'
            }
        };
    }

    /**
     * Parse integer or return null
     */
    function parseIntOrNull(value) {
        if (!value || value.trim() === '') return null;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
    }

    /**
     * Parse float or return null
     */
    function parseFloatOrNull(value) {
        if (!value || value.trim() === '') return null;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    }

    /**
     * Show status message
     */
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'form-status ' + type;
        statusDiv.style.display = 'block';
    }

    /**
     * Set form loading state
     */
    function setLoading(isLoading) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';
            submitButton.classList.add('loading');
        } else {
            updateSubmitButtonState();
            submitButton.textContent = 'Submit Discovery Form';
            submitButton.classList.remove('loading');
        }
    }

    /**
     * Update submit button state based on consent checkboxes
     */
    function updateSubmitButtonState() {
        const bothChecked = consentPrivacy.checked && consentData.checked;
        const hasAthlete = !!athleteNameInput.value;
        submitButton.disabled = !(bothChecked && hasAthlete);
    }

    /**
     * Submit form data to webhook
     */
    async function submitForm(data) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.submitTimeout);

        try {
            const response = await fetch(CONFIG.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const result = await response.json();

            if (response.ok && result.success) {
                return { success: true, data: result };
            } else {
                return {
                    success: false,
                    error: result.message || 'Submission failed',
                    details: result.details || []
                };
            }
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                return { success: false, error: 'Request timed out. Please try again.' };
            }

            return {
                success: false,
                error: 'Unable to connect to the server. Please check your connection and try again.'
            };
        }
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(event) {
        event.preventDefault();

        // Validate form
        if (!validateForm()) {
            showStatus('Please correct the errors above.', 'error');
            return;
        }

        // Collect data
        const formData = collectFormData();

        // Show loading state
        setLoading(true);
        showStatus('Submitting discovery form...', 'info');

        // Submit to webhook
        const result = await submitForm(formData);

        // Handle result
        setLoading(false);

        if (result.success) {
            showStatus(
                'Discovery form submitted successfully! ' +
                formData.athleteName + '\'s profile is now complete and active.',
                'success'
            );
            form.reset();
            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            let errorMessage = result.error;
            if (result.details && result.details.length > 0) {
                errorMessage += ': ' + result.details.join(', ');
            }
            showStatus(errorMessage, 'error');
        }
    }

    /**
     * Handle field blur for inline validation
     */
    function handleFieldBlur(event) {
        const field = event.target;
        if (field.tagName === 'INPUT' || field.tagName === 'SELECT' || field.tagName === 'TEXTAREA') {
            validateField(field);
        }
    }

    /**
     * Initialize form
     */
    function init() {
        // Get athlete name from URL
        const athleteName = getAthleteFromUrl();

        if (athleteName) {
            athleteNameInput.value = athleteName;
            athleteNameDisplay.textContent = athleteName;
        } else {
            athleteNameDisplay.textContent = 'Unknown athlete';
            showStatus(MESSAGES.noAthlete, 'error');
        }

        // Update submit button state initially
        updateSubmitButtonState();

        // Form submission
        form.addEventListener('submit', handleSubmit);

        // Inline validation on blur
        form.addEventListener('blur', handleFieldBlur, true);

        // Clear error on input
        form.addEventListener('input', function(event) {
            const field = event.target;
            if (field.classList.contains('field-error')) {
                clearError(field);
            }
        });

        // Consent checkbox listeners - enable/disable submit button
        consentPrivacy.addEventListener('change', updateSubmitButtonState);
        consentData.addEventListener('change', updateSubmitButtonState);

        console.log('MAD Discovery Form initialized');
        if (athleteName) {
            console.log('Completing discovery for:', athleteName);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
