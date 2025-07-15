// Formatting utilities for displaying data

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
	const num = parseFloat(amount);
	
	if (isNaN(num)) return '$0.00';
	
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
};

// Format date
export const formatDate = (date, options = {}) => {
	if (!date) return '';
	
	let dateObj;
	if (typeof date === 'string' || typeof date === 'number') {
		dateObj = new Date(date);
	} else if (date instanceof Date) {
		dateObj = date;
	} else {
		return '';
	}
	
	if (isNaN(dateObj.getTime())) return '';
	
	const defaultOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		...options,
	};
	
	return dateObj.toLocaleDateString('en-US', defaultOptions);
};

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
	if (!date) return '';
	
	let dateObj;
	if (typeof date === 'string' || typeof date === 'number') {
		dateObj = new Date(date);
	} else if (date instanceof Date) {
		dateObj = date;
	} else {
		return '';
	}
	
	if (isNaN(dateObj.getTime())) return '';
	
	const now = new Date();
	const diffMs = now - dateObj;
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);
	
	if (diffSeconds < 60) {
		return 'just now';
	} else if (diffMinutes < 60) {
		return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
	} else if (diffHours < 24) {
		return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
	} else if (diffDays < 7) {
		return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
	} else {
		return formatDate(dateObj);
	}
};

// Truncate text
export const truncateText = (text, maxLength = 100, suffix = '...') => {
	if (!text || typeof text !== 'string') return '';
	if (text.length <= maxLength) return text;
	
	return text.substring(0, maxLength - suffix.length) + suffix;
};

// Capitalize first letter
export const capitalize = (text) => {
	if (!text || typeof text !== 'string') return '';
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Title case
export const titleCase = (text) => {
	if (!text || typeof text !== 'string') return '';
	
	return text
		.toLowerCase()
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

// Format user name
export const formatUserName = (user) => {
	if (!user) return 'User';
	
	if (user.displayName) return user.displayName;
	if (user.name) return user.name;
	if (user.email) return user.email.split('@')[0];
	
	return 'User';
};

// Format user initials
export const formatUserInitials = (user) => {
	const name = formatUserName(user);
	const parts = name.split(' ');
	
	if (parts.length === 1) {
		return parts[0].charAt(0).toUpperCase();
	}
	
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Format phone number
export const formatPhoneNumber = (phone) => {
	if (!phone) return '';
	
	// Remove all non-digits
	const cleaned = phone.replace(/\D/g, '');
	
	// Check if it's a US phone number
	if (cleaned.length === 10) {
		return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
	} else if (cleaned.length === 11 && cleaned.startsWith('1')) {
		return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
	}
	
	return phone; // Return original if can't format
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
	const num = parseFloat(value);
	if (isNaN(num)) return '0%';
	
	return `${(num * 100).toFixed(decimals)}%`;
};

// Format list of items with proper grammar
export const formatList = (items, conjunction = 'and') => {
	if (!Array.isArray(items) || items.length === 0) return '';
	
	if (items.length === 1) return items[0];
	if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
	
	const allButLast = items.slice(0, -1).join(', ');
	const last = items[items.length - 1];
	
	return `${allButLast}, ${conjunction} ${last}`;
};

// Format event status
export const formatEventStatus = (event) => {
	if (!event || !event.metadata) return 'Unknown';
	
	const now = new Date();
	const eventDate = new Date(event.metadata.dates);
	
	if (isNaN(eventDate.getTime())) return 'Scheduled';
	
	if (eventDate > now) {
		const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
		if (daysUntil === 1) return 'Tomorrow';
		if (daysUntil <= 7) return `In ${daysUntil} days`;
		return 'Upcoming';
	} else {
		const daysSince = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
		if (daysSince === 0) return 'Today';
		if (daysSince === 1) return 'Yesterday';
		if (daysSince <= 7) return `${daysSince} days ago`;
		return 'Past';
	}
};

// Format role for display
export const formatRole = (role) => {
	const roleMap = {
		owner: 'Owner',
		admin: 'Admin',
		editor: 'Editor',
		member: 'Member',
		viewer: 'Viewer',
	};
	
	return roleMap[role] || capitalize(role);
};

// Generate color for user avatar
export const generateAvatarColor = (userId) => {
	const colors = [
		'#f87171', '#fb923c', '#fbbf24', '#a3e635',
		'#34d399', '#22d3ee', '#60a5fa', '#a78bfa',
		'#f472b6', '#fb7185', '#fdba74', '#fde047',
	];
	
	// Use user ID to generate consistent color
	let hash = 0;
	for (let i = 0; i < userId.length; i++) {
		hash = userId.charCodeAt(i) + ((hash << 5) - hash);
	}
	
	return colors[Math.abs(hash) % colors.length];
};