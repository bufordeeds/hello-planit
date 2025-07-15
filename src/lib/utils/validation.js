// Input validation utilities

// Event validation
export const validateEvent = (eventData) => {
	const errors = [];

	if (!eventData.name || eventData.name.trim().length < 2) {
		errors.push('Event name must be at least 2 characters long');
	}

	if (eventData.name && eventData.name.length > 100) {
		errors.push('Event name cannot exceed 100 characters');
	}

	if (!eventData.dates || eventData.dates.trim().length === 0) {
		errors.push('Event dates are required');
	}

	if (eventData.description && eventData.description.length > 500) {
		errors.push('Event description cannot exceed 500 characters');
	}

	if (eventData.location && eventData.location.length > 200) {
		errors.push('Event location cannot exceed 200 characters');
	}

	if (eventData.privacy && !['public', 'private', 'invite-only'].includes(eventData.privacy)) {
		errors.push('Privacy setting must be public, private, or invite-only');
	}

	if (eventData.type && !['general', 'birthday', 'vacation', 'business', 'wedding', 'party', 'weekend'].includes(eventData.type)) {
		errors.push('Event type is not valid');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};

// Email validation
export const isValidEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

// URL validation
export const isValidUrl = (url) => {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
};

// Password validation
export const validatePassword = (password) => {
	const errors = [];

	if (!password || password.length < 6) {
		errors.push('Password must be at least 6 characters long');
	}

	if (password && password.length > 128) {
		errors.push('Password cannot exceed 128 characters');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};

// Sanitize HTML to prevent XSS
export const sanitizeHtml = (input) => {
	if (typeof input !== 'string') return '';
	
	return input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
		.replace(/\//g, '&#x2F;');
};

// Validate and sanitize text input
export const sanitizeInput = (input, maxLength = 1000) => {
	if (typeof input !== 'string') return '';
	
	return sanitizeHtml(input.trim()).substring(0, maxLength);
};

// Check if date string is valid
export const isValidDate = (dateString) => {
	const date = new Date(dateString);
	return date instanceof Date && !isNaN(date);
};