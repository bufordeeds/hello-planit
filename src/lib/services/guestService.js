import { database } from '$lib/config/firebase.js';
import { ref, set, get, push, remove, onValue, off } from 'firebase/database';

class GuestService {
	constructor() {
		this.database = database;
	}

	/**
	 * Invite a guest to an event
	 * @param {string} eventId - The event ID
	 * @param {string} email - Guest's email address
	 * @param {string} role - Guest's role (viewer, member, editor, admin)
	 * @param {string} invitedBy - User ID of who sent the invitation
	 */
	async inviteGuest(eventId, email, role = 'member', invitedBy) {
		if (!eventId || !email || !invitedBy) {
			throw new Error('Event ID, email, and inviter are required');
		}

		try {
			const invitationId = push(ref(this.database, `invitations/${eventId}`)).key;
			const invitation = {
				id: invitationId,
				eventId,
				email: email.toLowerCase().trim(),
				role,
				invitedBy,
				invitedAt: Date.now(),
				status: 'pending', // pending, accepted, declined
				expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
			};

			await set(ref(this.database, `invitations/${eventId}/${invitationId}`), invitation);
			return invitation;
		} catch (error) {
			console.error('Error inviting guest:', error);
			throw new Error('Failed to send invitation');
		}
	}

	/**
	 * Get all invitations for an event
	 * @param {string} eventId - The event ID
	 * @returns {Promise<Array>} Array of invitations
	 */
	async getEventInvitations(eventId) {
		if (!eventId) {
			throw new Error('Event ID is required');
		}

		try {
			const invitationsRef = ref(this.database, `invitations/${eventId}`);
			const snapshot = await get(invitationsRef);
			const invitations = snapshot.val() || {};
			
			return Object.values(invitations).filter(invitation => 
				invitation.expiresAt > Date.now() // Only return non-expired invitations
			);
		} catch (error) {
			console.error('Error getting invitations:', error);
			throw new Error('Failed to get invitations');
		}
	}

	/**
	 * Accept an invitation and join the event
	 * @param {string} eventId - The event ID
	 * @param {string} invitationId - The invitation ID
	 * @param {Object} user - User object with uid, email, name
	 */
	async acceptInvitation(eventId, invitationId, user) {
		if (!eventId || !invitationId || !user) {
			throw new Error('Event ID, invitation ID, and user are required');
		}

		try {
			// Get the invitation
			const invitationRef = ref(this.database, `invitations/${eventId}/${invitationId}`);
			const invitationSnapshot = await get(invitationRef);
			const invitation = invitationSnapshot.val();

			if (!invitation) {
				throw new Error('Invitation not found');
			}

			if (invitation.status !== 'pending') {
				throw new Error('Invitation already processed');
			}

			if (invitation.expiresAt < Date.now()) {
				throw new Error('Invitation has expired');
			}

			if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
				throw new Error('Invitation email does not match user email');
			}

			// Add user to event members
			const memberData = {
				email: user.email,
				name: user.displayName || user.email.split('@')[0],
				role: invitation.role,
				joinedAt: Date.now(),
				permissions: this.getRolePermissions(invitation.role)
			};

			await set(ref(this.database, `events/${eventId}/members/${user.uid}`), memberData);

			// Update invitation status
			await set(ref(this.database, `invitations/${eventId}/${invitationId}/status`), 'accepted');
			await set(ref(this.database, `invitations/${eventId}/${invitationId}/acceptedAt`), Date.now());

			return memberData;
		} catch (error) {
			console.error('Error accepting invitation:', error);
			throw new Error(error.message || 'Failed to accept invitation');
		}
	}

	/**
	 * Decline an invitation
	 * @param {string} eventId - The event ID
	 * @param {string} invitationId - The invitation ID
	 */
	async declineInvitation(eventId, invitationId) {
		if (!eventId || !invitationId) {
			throw new Error('Event ID and invitation ID are required');
		}

		try {
			await set(ref(this.database, `invitations/${eventId}/${invitationId}/status`), 'declined');
			await set(ref(this.database, `invitations/${eventId}/${invitationId}/declinedAt`), Date.now());
		} catch (error) {
			console.error('Error declining invitation:', error);
			throw new Error('Failed to decline invitation');
		}
	}

	/**
	 * Remove a guest from an event
	 * @param {string} eventId - The event ID
	 * @param {string} memberId - The member's user ID
	 */
	async removeGuest(eventId, memberId) {
		if (!eventId || !memberId) {
			throw new Error('Event ID and member ID are required');
		}

		try {
			await remove(ref(this.database, `events/${eventId}/members/${memberId}`));
		} catch (error) {
			console.error('Error removing guest:', error);
			throw new Error('Failed to remove guest');
		}
	}

	/**
	 * Cancel an invitation
	 * @param {string} eventId - The event ID
	 * @param {string} invitationId - The invitation ID
	 */
	async cancelInvitation(eventId, invitationId) {
		if (!eventId || !invitationId) {
			throw new Error('Event ID and invitation ID are required');
		}

		try {
			await remove(ref(this.database, `invitations/${eventId}/${invitationId}`));
		} catch (error) {
			console.error('Error canceling invitation:', error);
			throw new Error('Failed to cancel invitation');
		}
	}

	/**
	 * Find invitation by email for a specific event
	 * @param {string} eventId - The event ID
	 * @param {string} email - User's email
	 * @returns {Promise<Object|null>} Invitation object or null
	 */
	async findInvitationByEmail(eventId, email) {
		if (!eventId || !email) {
			return null;
		}

		try {
			const invitations = await this.getEventInvitations(eventId);
			return invitations.find(inv => 
				inv.email.toLowerCase() === email.toLowerCase() && 
				inv.status === 'pending'
			) || null;
		} catch (error) {
			console.error('Error finding invitation:', error);
			return null;
		}
	}

	/**
	 * Subscribe to real-time invitation updates
	 * @param {string} eventId - The event ID
	 * @param {Function} callback - Callback function to handle updates
	 * @returns {Function} Unsubscribe function
	 */
	subscribeToInvitations(eventId, callback) {
		if (!eventId) {
			throw new Error('Event ID is required');
		}

		const invitationsRef = ref(this.database, `invitations/${eventId}`);
		
		const unsubscribe = onValue(invitationsRef, (snapshot) => {
			const invitations = snapshot.val() || {};
			const invitationList = Object.values(invitations).filter(invitation => 
				invitation.expiresAt > Date.now()
			);
			callback(invitationList);
		}, (error) => {
			console.error('Error subscribing to invitations:', error);
			callback([], error);
		});

		return () => off(invitationsRef, 'value', unsubscribe);
	}

	/**
	 * Get all pending invitations for a user across all events
	 * @param {string} email - User's email address
	 * @returns {Promise<Array>} Array of pending invitations with event details
	 */
	async getUserPendingInvitations(email) {
		if (!email) {
			return [];
		}

		try {
			// Get all invitations
			const allInvitationsRef = ref(this.database, 'invitations');
			const snapshot = await get(allInvitationsRef);
			const allInvitations = snapshot.val() || {};
			
			const userInvitations = [];
			
			// Search through all events for invitations to this email
			for (const [eventId, eventInvitations] of Object.entries(allInvitations)) {
				for (const [invitationId, invitation] of Object.entries(eventInvitations)) {
					if (invitation.email.toLowerCase() === email.toLowerCase() && 
						invitation.status === 'pending' &&
						invitation.expiresAt > Date.now()) {
						
						// Get event details
						try {
							const eventRef = ref(this.database, `events/${eventId}`);
							const eventSnapshot = await get(eventRef);
							const event = eventSnapshot.val();
							
							if (event) {
								userInvitations.push({
									...invitation,
									eventId,
									eventName: event.metadata?.name || 'Unnamed Event',
									eventType: event.metadata?.type || 'general',
									eventDates: event.metadata?.dates,
									eventLocation: event.metadata?.location
								});
							}
						} catch (err) {
							console.error('Error loading event for invitation:', err);
						}
					}
				}
			}
			
			return userInvitations.sort((a, b) => b.invitedAt - a.invitedAt);
		} catch (error) {
			console.error('Error getting user invitations:', error);
			return [];
		}
	}

	/**
	 * Get role permissions
	 * @param {string} role - The role name
	 * @returns {Array} Array of permissions
	 */
	getRolePermissions(role) {
		const permissions = {
			owner: ['read', 'write', 'invite', 'manage'],
			admin: ['read', 'write', 'invite'],
			editor: ['read', 'write'],
			member: ['read', 'write'],
			viewer: ['read']
		};

		return permissions[role] || permissions.viewer;
	}
}

// Create and export a singleton instance
export const guestService = new GuestService();
export default guestService;