import { database } from '$lib/config/firebase.js';
import { ref, set, get, onValue, off } from 'firebase/database';

class ItineraryService {
	constructor() {
		this.database = database;
	}

	/**
	 * Update a specific itinerary field for an event
	 * @param {string} eventId - The event ID
	 * @param {string} field - The field to update (e.g., 'friday-plan', 'specialNotes')
	 * @param {string} value - The new value
	 */
	async updateItineraryField(eventId, field, value) {
		if (!eventId || !field) {
			throw new Error('Event ID and field are required');
		}

		try {
			const itineraryRef = ref(this.database, `events/${eventId}/itinerary/${field}`);
			await set(itineraryRef, value);
		} catch (error) {
			console.error('Error updating itinerary field:', error);
			throw new Error('Failed to update itinerary');
		}
	}

	/**
	 * Get the complete itinerary for an event
	 * @param {string} eventId - The event ID
	 * @returns {Promise<Object>} The itinerary data
	 */
	async getItinerary(eventId) {
		if (!eventId) {
			throw new Error('Event ID is required');
		}

		try {
			const itineraryRef = ref(this.database, `events/${eventId}/itinerary`);
			const snapshot = await get(itineraryRef);
			return snapshot.val() || {};
		} catch (error) {
			console.error('Error getting itinerary:', error);
			throw new Error('Failed to get itinerary');
		}
	}

	/**
	 * Subscribe to real-time itinerary updates
	 * @param {string} eventId - The event ID
	 * @param {Function} callback - Callback function to handle updates
	 * @returns {Function} Unsubscribe function
	 */
	subscribeToItinerary(eventId, callback) {
		if (!eventId) {
			throw new Error('Event ID is required');
		}

		const itineraryRef = ref(this.database, `events/${eventId}/itinerary`);
		
		const unsubscribe = onValue(itineraryRef, (snapshot) => {
			const itineraryData = snapshot.val() || {};
			callback(itineraryData);
		}, (error) => {
			console.error('Error subscribing to itinerary:', error);
			callback(null, error);
		});

		return () => off(itineraryRef, 'value', unsubscribe);
	}
}

// Create and export a singleton instance
export const itineraryService = new ItineraryService();
export default itineraryService;