import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { 
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	onAuthStateChanged,
	updateProfile,
	sendPasswordResetEmail,
	EmailAuthProvider,
	reauthenticateWithCredential,
	updatePassword
} from 'firebase/auth';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import { auth, database } from '$lib/config/firebase.js';

// Auth providers
const googleProvider = new GoogleAuthProvider();

// Stores
export const user = writable(null);
export const loading = writable(true);
export const error = writable(null);

// Derived stores
export const isAuthenticated = derived(user, ($user) => !!$user);
export const userProfile = writable(null);

// Initialize auth state listener (only in browser)
if (browser) {
	onAuthStateChanged(auth, async (firebaseUser) => {
		loading.set(false);
		
		if (firebaseUser) {
			user.set(firebaseUser);
			await updateUserProfile(firebaseUser.uid, {
				name: firebaseUser.displayName || 'Anonymous',
				email: firebaseUser.email,
				photoURL: firebaseUser.photoURL || null,
				lastLogin: serverTimestamp(),
			});
			
			// Load user profile
			const profile = await getUserProfile(firebaseUser.uid);
			userProfile.set(profile);
		} else {
			user.set(null);
			userProfile.set(null);
		}
	});
}

// Authentication functions
export const authService = {
	// Sign up with email and password
	async signUpWithEmail(email, password, displayName) {
		try {
			loading.set(true);
			error.set(null);
			
			const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
			
			// Update display name
			if (displayName) {
				await updateProfile(firebaseUser, { displayName });
			}
			
			// Create user profile in database
			await createUserProfile(firebaseUser.uid, {
				name: displayName || email.split('@')[0],
				email: email,
			});
			
			return { user: firebaseUser, error: null };
		} catch (err) {
			error.set(err.message);
			return { user: null, error: err.message };
		} finally {
			loading.set(false);
		}
	},

	// Sign in with email and password
	async signInWithEmail(email, password) {
		try {
			loading.set(true);
			error.set(null);
			
			const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
			return { user: firebaseUser, error: null };
		} catch (err) {
			error.set(err.message);
			return { user: null, error: err.message };
		} finally {
			loading.set(false);
		}
	},

	// Sign in with Google
	async signInWithGoogle() {
		try {
			loading.set(true);
			error.set(null);
			
			const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
			
			// Create/update user profile
			await createUserProfile(firebaseUser.uid, {
				name: firebaseUser.displayName,
				email: firebaseUser.email,
				photoURL: firebaseUser.photoURL,
			});
			
			return { user: firebaseUser, error: null };
		} catch (err) {
			error.set(err.message);
			return { user: null, error: err.message };
		} finally {
			loading.set(false);
		}
	},

	// Sign out
	async signOut() {
		try {
			loading.set(true);
			await signOut(auth);
			return { error: null };
		} catch (err) {
			error.set(err.message);
			return { error: err.message };
		} finally {
			loading.set(false);
		}
	},

	// Send password reset email
	async sendPasswordReset(email) {
		try {
			await sendPasswordResetEmail(auth, email);
			return { error: null };
		} catch (err) {
			return { error: err.message };
		}
	},

	// Update password
	async updatePassword(currentPassword, newPassword) {
		try {
			const firebaseUser = auth.currentUser;
			if (!firebaseUser || !firebaseUser.email) throw new Error('No user logged in');
			
			// Re-authenticate user
			const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
			await reauthenticateWithCredential(firebaseUser, credential);
			
			// Update password
			await updatePassword(firebaseUser, newPassword);
			return { error: null };
		} catch (err) {
			return { error: err.message };
		}
	},

	// Clear error
	clearError() {
		error.set(null);
	}
};

// User profile functions
async function createUserProfile(userId, data) {
	const userRef = ref(database, `users/${userId}/profile`);
	const snapshot = await get(userRef);
	
	if (!snapshot.exists()) {
		await set(userRef, {
			...data,
			createdAt: serverTimestamp(),
			preferences: {
				theme: 'light',
				notifications: true,
				emailUpdates: true,
			},
		});
	} else {
		// Update existing profile
		await updateUserProfile(userId, data);
	}
}

async function updateUserProfile(userId, data) {
	const userRef = ref(database, `users/${userId}/profile`);
	const updates = {};
	
	Object.keys(data).forEach(key => {
		if (data[key] !== undefined) {
			updates[key] = data[key];
		}
	});
	
	if (Object.keys(updates).length > 0) {
		await set(userRef, updates);
	}
}

export async function getUserProfile(userId) {
	const userRef = ref(database, `users/${userId}/profile`);
	const snapshot = await get(userRef);
	return snapshot.val();
}

export async function updateUserPreferences(preferences) {
	const firebaseUser = auth.currentUser;
	if (!firebaseUser) throw new Error('No user logged in');
	
	const prefsRef = ref(database, `users/${firebaseUser.uid}/profile/preferences`);
	await set(prefsRef, preferences);
}