/**
 * MAD - Mobile Athlete Data Collection
 * Form validation, data collection, and webhook submission
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        webhookUrl: 'https://webhook.athleticascent.co.uk/webhook/mad-form',
        submitTimeout: 30000 // 30 seconds
    };

    // DOM Elements
    const form = document.getElementById('registration-form');
    const submitButton = form.querySelector('button[type="submit"]');
    const statusDiv = document.getElementById('form-status');
    const dobField = document.getElementById('athlete-dob');
    const parentSection = document.querySelectorAll('fieldset')[1]; // Parent/Guardian section

    // Validation patterns
    const PATTERNS = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        ukPhone: /^(?:(?:\+44\s?|0)(?:7\d{3}|\d{4})\s?\d{3}\s?\d{3,4}|\d{10,11})$/,
        date: /^\d{4}-\d{2}-\d{2}$/
    };

    // Error messages
    const MESSAGES = {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        phone: 'Please enter a valid UK phone number',
        date: 'Please enter a valid date',
        consent: 'You must agree to continue',
        futureDate: 'Date of birth cannot be in the future',
        tooOld: 'Please check the date of birth'
    };

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

        // Type-specific validation
        switch (type) {
            case 'email':
                if (value && !PATTERNS.email.test(value)) {
                    showError(field, MESSAGES.email);
                    return false;
                }
                break;

            case 'tel':
                if (value && !PATTERNS.ukPhone.test(value.replace(/\s/g, ''))) {
                    showError(field, MESSAGES.phone);
                    return false;
                }
                break;

            case 'date':
                if (value) {
                    const date = new Date(value);
                    const today = new Date();

                    if (isNaN(date.getTime())) {
                        showError(field, MESSAGES.date);
                        return false;
                    }

                    // Check if date is in the future (for DOB)
                    if (field.id === 'athlete-dob' && date > today) {
                        showError(field, MESSAGES.futureDate);
                        return false;
                    }

                    // Check if date is unrealistically old (before 1920)
                    if (field.id === 'athlete-dob' && date.getFullYear() < 1920) {
                        showError(field, MESSAGES.tooOld);
                        return false;
                    }
                }
                break;

            case 'checkbox':
                if (isRequired && !field.checked) {
                    showError(field, MESSAGES.consent);
                    return false;
                }
                break;
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
     * Check if athlete is under 16 based on current DoB value
     */
    function isAthleteUnder16() {
        const dobValue = dobField.value;
        if (!dobValue) return false;
        const dob = new Date(dobValue);
        if (isNaN(dob.getTime())) return false;
        return calculateAge(dob) < 16;
    }

    /**
     * Collect form data into submission format
     */
    function collectFormData() {
        const isMinor = isAthleteUnder16();

        return {
            athlete: {
                firstName: document.getElementById('athlete-first-name').value.trim(),
                lastName: document.getElementById('athlete-last-name').value.trim(),
                dateOfBirth: document.getElementById('athlete-dob').value,
                gender: capitalizeFirst(document.getElementById('athlete-gender').value),
                email: document.getElementById('athlete-email').value.trim() || null,
                phone: document.getElementById('athlete-phone').value.trim() || null,
                isMinor: isMinor
            },
            parent: isMinor ? {
                firstName: document.getElementById('parent-first-name').value.trim(),
                lastName: document.getElementById('parent-last-name').value.trim(),
                email: document.getElementById('parent-email').value.trim(),
                phone: document.getElementById('parent-phone').value.trim(),
                relationship: capitalizeFirst(document.getElementById('parent-relationship').value)
            } : null,
            emergency: {
                name: document.getElementById('emergency-name').value.trim(),
                phone: document.getElementById('emergency-phone').value.trim()
            },
            consent: {
                privacyNotice: document.getElementById('consent-privacy').checked,
                dataCollection: document.getElementById('consent-data').checked,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Capitalize first letter
     */
    function capitalizeFirst(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Calculate age from date of birth
     */
    function calculateAge(dob) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    }

    /**
     * Toggle parent/guardian section visibility based on athlete age
     */
    function updateParentSectionVisibility() {
        const dobValue = dobField.value;
        const guardianStatement = document.getElementById('guardian-statement');
        const adultStatement = document.getElementById('adult-statement');

        if (!dobValue) {
            // No DoB entered yet - hide parent section, show guardian statement by default
            parentSection.style.display = 'none';
            setParentFieldsRequired(false);
            guardianStatement.style.display = 'block';
            adultStatement.style.display = 'none';
            return;
        }

        const dob = new Date(dobValue);
        if (isNaN(dob.getTime())) {
            return; // Invalid date, don't change visibility
        }

        const age = calculateAge(dob);
        const isUnder16 = age < 16;

        parentSection.style.display = isUnder16 ? 'block' : 'none';
        setParentFieldsRequired(isUnder16);

        // Toggle consent statements
        guardianStatement.style.display = isUnder16 ? 'block' : 'none';
        adultStatement.style.display = isUnder16 ? 'none' : 'block';
    }

    /**
     * Set required attribute on parent/guardian fields
     */
    function setParentFieldsRequired(isRequired) {
        const parentFields = parentSection.querySelectorAll('input, select');
        parentFields.forEach(field => {
            if (isRequired) {
                field.setAttribute('required', '');
                field.setAttribute('aria-required', 'true');
            } else {
                field.removeAttribute('required');
                field.removeAttribute('aria-required');
                clearError(field); // Clear any validation errors
            }
        });
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
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Registration';
            submitButton.classList.remove('loading');
        }
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
        showStatus('Submitting registration...', 'info');

        // Submit to webhook
        const result = await submitForm(formData);

        // Handle result
        setLoading(false);

        if (result.success) {
            const athleteName = result.data.athleteName;
            const encodedName = encodeURIComponent(athleteName);
            const discoveryLink = 'discovery.html?athlete=' + encodedName;

            // Show success with link to Discovery Form
            statusDiv.innerHTML =
                '<strong>Registration successful!</strong> ' + athleteName + ' has been registered.<br><br>' +
                '<a href="' + discoveryLink + '" class="discovery-link">Continue to Discovery Form →</a><br>' +
                '<span class="discovery-note">Complete the Discovery Form to provide additional context about the athlete and finalise consent.</span>';
            statusDiv.className = 'form-status success';
            statusDiv.style.display = 'block';

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
        if (field.tagName === 'INPUT' || field.tagName === 'SELECT') {
            validateField(field);
        }
    }

    /**
     * Initialize form
     */
    function init() {
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

        // DoB change handler - show/hide parent section based on age
        dobField.addEventListener('change', updateParentSectionVisibility);

        // Initialize parent section visibility (hidden until DoB entered)
        updateParentSectionVisibility();

        console.log('MAD Registration Form initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
