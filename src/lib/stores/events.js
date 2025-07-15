import { writable, derived } from 'svelte/store';
import { user } from './auth.js';
import { 
	ref, 
	push, 
	set, 
	get, 
	query, 
	orderByChild, 
	equalTo,
	onValue, 
	off,
	serverTimestamp,
	remove,
	update
} from 'firebase/database';
import { database } from '$lib/config/firebase.js';

// Event stores
export const events = writable([]);
export const currentEvent = writable(null);
export const eventsLoading = writable(false);
export const eventsError = writable(null);

// Derived stores
export const userEvents = derived(
	[events, user],
	([$events, $user]) => $events.filter(event => 
		$user && event.members && event.members[$user.uid]
	)
);

// Event service functions
export const eventService = {
	// Create a new event
	async createEvent(eventData) {
		const currentUser = get(user);
		if (!currentUser) throw new Error('User must be authenticated');

		try {
			eventsLoading.set(true);
			eventsError.set(null);

			const eventRef = push(ref(database, 'events'));
			const eventId = eventRef.key;
			
			const event = {
				metadata: {
					name: eventData.name,
					description: eventData.description || '',
					dates: eventData.dates,
					location: eventData.location || '',
					type: eventData.type || 'general',
					createdBy: currentUser.uid,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp(),
				},
				settings: {
					privacy: eventData.privacy || 'private',
					allowEditing: eventData.allowEditing !== false,
					requireApproval: eventData.requireApproval || false,
					features: {
						meals: true,
						expenses: true,
						itinerary: true,
						chat: false,
					},
				},
				members: {
					[currentUser.uid]: {
						name: currentUser.displayName || currentUser.email,
						email: currentUser.email,
						role: 'owner',
						joinedAt: serverTimestamp(),
						permissions: ['read', 'write', 'delete', 'invite', 'admin'],
					},
				},
				itinerary: {
					notes: '',
					days: {},
				},
				meals: {},
				expenses: {},
			};

			await set(eventRef, event);

			// Add event to user's event list
			await this.addEventToUser(currentUser.uid, eventId, 'owner');

			return { eventId, event };
		} catch (error) {
			eventsError.set(error.message);
			throw error;
		} finally {
			eventsLoading.set(false);
		}
	},

	// Add event to user's event list
	async addEventToUser(userId, eventId, role = 'member') {
		const userEventRef = ref(database, `users/${userId}/events/${eventId}`);
		await set(userEventRef, {
			role,
			joinedAt: serverTimestamp(),
		});
	},

	// Get user's events
	async getUserEvents(userId) {
		try {
			eventsLoading.set(true);
			const userEventsRef = ref(database, `users/${userId}/events`);
			const snapshot = await get(userEventsRef);
			
			if (!snapshot.exists()) return [];

			const userEvents = snapshot.val();
			const eventIds = Object.keys(userEvents);
			
			// Fetch event metadata for each event
			const eventPromises = eventIds.map(async (eventId) => {
				const eventRef = ref(database, `events/${eventId}/metadata`);
				const eventSnapshot = await get(eventRef);
				
				if (eventSnapshot.exists()) {
					return {
						id: eventId,
						...eventSnapshot.val(),
						userRole: userEvents[eventId].role,
						joinedAt: userEvents[eventId].joinedAt,
					};
				}
				return null;
			});

			const eventsList = (await Promise.all(eventPromises)).filter(Boolean);
			events.set(eventsList);
			return eventsList;
		} catch (error) {
			eventsError.set(error.message);
			return [];
		} finally {
			eventsLoading.set(false);
		}
	},

	// Get event details
	async getEvent(eventId) {
		try {
			const eventRef = ref(database, `events/${eventId}`);
			const snapshot = await get(eventRef);
			
			if (!snapshot.exists()) {
				throw new Error('Event not found');
			}

			const event = {
				id: eventId,
				...snapshot.val(),
			};
			
			currentEvent.set(event);
			return event;
		} catch (error) {
			eventsError.set(error.message);
			throw error;
		}
	},

	// Update event metadata
	async updateEvent(eventId, updates) {
		const currentUser = get(user);
		if (!currentUser) throw new Error('User must be authenticated');

		try {
			// Check permissions
			const hasPermission = await this.checkPermission(eventId, currentUser.uid, 'write');
			if (!hasPermission) throw new Error('Permission denied');

			const eventRef = ref(database, `events/${eventId}/metadata`);
			await update(eventRef, {
				...updates,
				updatedAt: serverTimestamp(),
			});

			// Update current event if it's the one being edited
			const current = get(currentEvent);
			if (current && current.id === eventId) {
				currentEvent.update(event => ({
					...event,
					metadata: { ...event.metadata, ...updates }
				}));
			}
		} catch (error) {
			eventsError.set(error.message);
			throw error;
		}
	},

	// Delete event
	async deleteEvent(eventId) {
		const currentUser = get(user);
		if (!currentUser) throw new Error('User must be authenticated');

		try {
			// Check if user is owner
			const memberRef = ref(database, `events/${eventId}/members/${currentUser.uid}`);
			const memberSnapshot = await get(memberRef);
			
			if (!memberSnapshot.exists() || memberSnapshot.val().role !== 'owner') {
				throw new Error('Only event owners can delete events');
			}

			// Get all members to remove event from their lists
			const membersRef = ref(database, `events/${eventId}/members`);
			const membersSnapshot = await get(membersRef);
			
			if (membersSnapshot.exists()) {
				const members = membersSnapshot.val();
				const memberIds = Object.keys(members);
				
				// Remove event from all members' event lists
				await Promise.all(
					memberIds.map(memberId => 
						remove(ref(database, `users/${memberId}/events/${eventId}`))
					)
				);
			}

			// Delete the event
			await remove(ref(database, `events/${eventId}`));

			// Update stores
			events.update(list => list.filter(e => e.id !== eventId));
			const current = get(currentEvent);
			if (current && current.id === eventId) {
				currentEvent.set(null);
			}
		} catch (error) {
			eventsError.set(error.message);
			throw error;
		}
	},

	// Check user permissions
	async checkPermission(eventId, userId, requiredPermission) {
		try {
			const memberRef = ref(database, `events/${eventId}/members/${userId}`);
			const snapshot = await get(memberRef);
			
			if (!snapshot.exists()) return false;

			const member = snapshot.val();
			const permissions = member.permissions || [];
			
			return permissions.includes(requiredPermission);
		} catch (error) {
			return false;
		}
	},

	// Get permissions for role
	getPermissionsForRole(role) {
		const rolePermissions = {
			owner: ['read', 'write', 'delete', 'invite', 'admin'],
			admin: ['read', 'write', 'invite', 'admin'],
			editor: ['read', 'write'],
			member: ['read'],
			viewer: ['read'],
		};

		return rolePermissions[role] || ['read'];
	},

	// Subscribe to event changes
	subscribeToEvent(eventId, callback) {
		const eventRef = ref(database, `events/${eventId}`);
		const unsubscribe = onValue(eventRef, (snapshot) => {
			if (snapshot.exists()) {
				const event = {
					id: eventId,
					...snapshot.val(),
				};
				callback(event);
				currentEvent.set(event);
			} else {
				callback(null);
				currentEvent.set(null);
			}
		});

		return unsubscribe;
	},

	// Subscribe to user events
	subscribeToUserEvents(userId, callback) {
		const userEventsRef = ref(database, `users/${userId}/events`);
		return onValue(userEventsRef, async (snapshot) => {
			if (snapshot.exists()) {
				const userEvents = snapshot.val();
				const eventIds = Object.keys(userEvents);
				
				// Fetch event metadata for each event
				const eventPromises = eventIds.map(async (eventId) => {
					const eventRef = ref(database, `events/${eventId}/metadata`);
					const eventSnapshot = await get(eventRef);
					
					if (eventSnapshot.exists()) {
						return {
							id: eventId,
							...eventSnapshot.val(),
							userRole: userEvents[eventId].role,
							joinedAt: userEvents[eventId].joinedAt,
						};
					}
					return null;
				});

				const eventsList = (await Promise.all(eventPromises)).filter(Boolean);
				events.set(eventsList);
				callback(eventsList);
			} else {
				events.set([]);
				callback([]);
			}
		});
	},

	// Invite user to event
	async inviteUser(eventId, inviteData) {
		const currentUser = get(user);
		if (!currentUser) throw new Error('User must be authenticated');

		try {
			// Check permissions
			const hasPermission = await this.checkPermission(eventId, currentUser.uid, 'invite');
			if (!hasPermission) throw new Error('Permission denied');

			const inviteRef = push(ref(database, `events/${eventId}/invitations`));
			await set(inviteRef, {
				email: inviteData.email,
				role: inviteData.role || 'member',
				invitedBy: currentUser.uid,
				invitedAt: serverTimestamp(),
				status: 'pending',
				message: inviteData.message || '',
			});

			return inviteRef.key;
		} catch (error) {
			eventsError.set(error.message);
			throw error;
		}
	},

	// Clear error
	clearError() {
		eventsError.set(null);
	}
};