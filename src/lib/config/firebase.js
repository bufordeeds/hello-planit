import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { browser } from '$app/environment';
import { 
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_DATABASE_URL,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_MEASUREMENT_ID,
	PUBLIC_ENABLE_ANALYTICS
} from '$env/static/public';
import { debugFirebaseConfig } from '$lib/utils/debug.js';

// Firebase configuration - sanitize environment variables
const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY?.trim(),
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
	databaseURL: PUBLIC_FIREBASE_DATABASE_URL?.trim(),
	projectId: PUBLIC_FIREBASE_PROJECT_ID?.trim(),
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
	appId: PUBLIC_FIREBASE_APP_ID?.trim(),
	measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID?.trim()
};

// Validate configuration
function validateConfig() {
	const requiredKeys = [
		'apiKey',
		'authDomain', 
		'databaseURL',
		'projectId',
		'storageBucket',
		'messagingSenderId',
		'appId'
	];
	
	// Check for missing keys
	const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
	
	if (missingKeys.length > 0) {
		console.error('Missing required Firebase configuration:', missingKeys);
		throw new Error('Invalid Firebase configuration');
	}
	
	// Check for malformed URLs or values with newlines
	const malformedKeys = requiredKeys.filter(key => {
		const value = firebaseConfig[key];
		return value && (value.includes('\n') || value.includes('\r') || value.includes('%0A'));
	});
	
	if (malformedKeys.length > 0) {
		console.error('Malformed Firebase configuration values:', malformedKeys);
		throw new Error('Firebase configuration contains invalid characters');
	}
	
	return true;
}

// Initialize Firebase only once
let app;
let auth;
let database;
let storage;

try {
	// Debug configuration in development or if there are issues
	if (!browser || window.location.hostname === 'localhost') {
		debugFirebaseConfig();
	}
	
	validateConfig();
	
	// Check if Firebase is already initialized
	if (!app) {
		console.log('Initializing Firebase with config:', {
			...firebaseConfig,
			apiKey: '***' // Hide sensitive data in logs
		});
		
		app = initializeApp(firebaseConfig);
		auth = getAuth(app);
		
		// Initialize database with explicit URL
		if (firebaseConfig.databaseURL) {
			database = getDatabase(app, firebaseConfig.databaseURL);
			console.log('Firebase Database initialized successfully with URL:', firebaseConfig.databaseURL);
		} else {
			console.error('Database URL is missing!');
			throw new Error('Firebase Database URL is required');
		}
		
		storage = getStorage(app);
	}
} catch (error) {
	console.error('Failed to initialize Firebase:', error);
	throw error;
}

export { app, auth, database, storage };

// Initialize analytics only in browser and if enabled
export const analytics = browser && PUBLIC_ENABLE_ANALYTICS === 'true' 
	? getAnalytics(app) 
	: null;

// Utility functions
export const generateId = () => {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getSessionId = () => {
	if (!browser) return null;
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get('session') || null;
};

export const createSessionUrl = (sessionId) => {
	if (!browser) return '';
	const url = new URL(window.location.href);
	url.searchParams.set('session', sessionId);
	return url.toString();
};