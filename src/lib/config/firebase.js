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

// Firebase configuration
const firebaseConfig = {
	apiKey: PUBLIC_FIREBASE_API_KEY,
	authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
	databaseURL: PUBLIC_FIREBASE_DATABASE_URL,
	projectId: PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: PUBLIC_FIREBASE_APP_ID,
	measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID
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
	
	const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);
	
	if (missingKeys.length > 0) {
		console.error('Missing required Firebase configuration:', missingKeys);
		throw new Error('Invalid Firebase configuration');
	}
	
	return true;
}

// Initialize Firebase
validateConfig();
export const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

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