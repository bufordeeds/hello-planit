// Debug utility to help identify Firebase configuration issues
import { 
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_DATABASE_URL,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_FIREBASE_STORAGE_BUCKET,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_MEASUREMENT_ID
} from '$env/static/public';

export function debugFirebaseConfig() {
	const configs = {
		apiKey: PUBLIC_FIREBASE_API_KEY,
		authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
		databaseURL: PUBLIC_FIREBASE_DATABASE_URL,
		projectId: PUBLIC_FIREBASE_PROJECT_ID,
		storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
		messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
		appId: PUBLIC_FIREBASE_APP_ID,
		measurementId: PUBLIC_FIREBASE_MEASUREMENT_ID
	};

	console.log('=== Firebase Config Debug ===');
	
	Object.entries(configs).forEach(([key, value]) => {
		if (value) {
			const hasNewline = value.includes('\n') || value.includes('\r');
			const hasEncodedNewline = value.includes('%0A') || value.includes('%0D');
			const hasExtraWhitespace = value !== value.trim();
			
			console.log(`${key}:`, {
				length: value.length,
				hasNewline,
				hasEncodedNewline,
				hasExtraWhitespace,
				value: hasNewline || hasEncodedNewline ? JSON.stringify(value) : value
			});
		} else {
			console.log(`${key}: MISSING`);
		}
	});
	
	console.log('=== End Firebase Config Debug ===');
}