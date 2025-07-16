import { 
	ref, 
	push, 
	set, 
	get, 
	remove,
	onValue, 
	off,
	serverTimestamp 
} from 'firebase/database';
import { database } from '$lib/config/firebase.js';
import { browser } from '$app/environment';

export class MealService {
	constructor(eventId) {
		this.eventId = eventId;
		this.mealsRef = ref(database, `events/${eventId}/meals`);
		this.listeners = new Map();
	}

	// Generate a unique meal ID
	generateMealId() {
		return push(ref(database, 'temp')).key;
	}

	// Create a new meal
	async createMeal(mealData, userId) {
		if (!browser) {
			throw new Error('Meal creation is only available in browser');
		}
		
		if (!userId) {
			throw new Error('User must be authenticated');
		}

		try {
			const mealRef = push(this.mealsRef);
			const mealId = mealRef.key;
			
			const meal = {
				name: mealData.name,
				description: mealData.description || '',
				recipeLink: mealData.recipeLink || '',
				claimedBy: mealData.claimedBy || '',
				slot: mealData.slot, // breakfast, lunch, dinner
				day: mealData.day, // day-1, day-2, etc
				time: mealData.time || '',
				location: mealData.location || '',
				cost: mealData.cost || 0,
				servings: mealData.servings || 1,
				assignedTo: mealData.assignedTo || '',
				addedBy: userId,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			};

			await set(mealRef, meal);
			
			return {
				id: mealId,
				...meal
			};
		} catch (error) {
			console.error('Error creating meal:', error);
			throw new Error('Failed to create meal: ' + error.message);
		}
	}

	// Update an existing meal
	async updateMeal(mealId, mealData, userId) {
		if (!browser) {
			throw new Error('Meal update is only available in browser');
		}
		
		if (!userId) {
			throw new Error('User must be authenticated');
		}

		try {
			const mealRef = ref(database, `events/${this.eventId}/meals/${mealId}`);
			
			// Get existing meal to preserve some fields
			const snapshot = await get(mealRef);
			if (!snapshot.exists()) {
				throw new Error('Meal not found');
			}
			
			const existingMeal = snapshot.val();
			
			const updatedMeal = {
				...existingMeal,
				name: mealData.name,
				description: mealData.description || '',
				recipeLink: mealData.recipeLink || '',
				claimedBy: mealData.claimedBy || '',
				slot: mealData.slot,
				day: mealData.day,
				time: mealData.time || '',
				location: mealData.location || '',
				cost: mealData.cost || 0,
				servings: mealData.servings || 1,
				assignedTo: mealData.assignedTo || '',
				updatedAt: serverTimestamp(),
			};

			await set(mealRef, updatedMeal);
			
			return {
				id: mealId,
				...updatedMeal
			};
		} catch (error) {
			console.error('Error updating meal:', error);
			throw new Error('Failed to update meal: ' + error.message);
		}
	}

	// Delete a meal
	async deleteMeal(mealId, userId) {
		if (!browser) {
			throw new Error('Meal deletion is only available in browser');
		}
		
		if (!userId) {
			throw new Error('User must be authenticated');
		}

		try {
			const mealRef = ref(database, `events/${this.eventId}/meals/${mealId}`);
			await remove(mealRef);
			
			return { success: true };
		} catch (error) {
			console.error('Error deleting meal:', error);
			throw new Error('Failed to delete meal: ' + error.message);
		}
	}

	// Get a single meal
	async getMeal(mealId) {
		try {
			const mealRef = ref(database, `events/${this.eventId}/meals/${mealId}`);
			const snapshot = await get(mealRef);
			
			if (!snapshot.exists()) {
				return null;
			}
			
			return {
				id: mealId,
				...snapshot.val()
			};
		} catch (error) {
			console.error('Error getting meal:', error);
			throw new Error('Failed to get meal: ' + error.message);
		}
	}

	// Get all meals for the event
	async getMeals() {
		try {
			const snapshot = await get(this.mealsRef);
			
			if (!snapshot.exists()) {
				return {};
			}
			
			const meals = {};
			snapshot.forEach((childSnapshot) => {
				meals[childSnapshot.key] = {
					id: childSnapshot.key,
					...childSnapshot.val()
				};
			});
			
			return meals;
		} catch (error) {
			console.error('Error getting meals:', error);
			throw new Error('Failed to get meals: ' + error.message);
		}
	}

	// Subscribe to real-time meal updates
	subscribeMeals(callback) {
		if (!browser) return () => {};
		
		const handleUpdate = (snapshot) => {
			const meals = {};
			if (snapshot.exists()) {
				snapshot.forEach((childSnapshot) => {
					meals[childSnapshot.key] = {
						id: childSnapshot.key,
						...childSnapshot.val()
					};
				});
			}
			callback(meals);
		};

		onValue(this.mealsRef, handleUpdate);
		
		// Store listener for cleanup
		this.listeners.set(callback, handleUpdate);
		
		// Return unsubscribe function
		return () => {
			off(this.mealsRef, 'value', handleUpdate);
			this.listeners.delete(callback);
		};
	}

	// Clean up all listeners
	cleanup() {
		this.listeners.forEach((listener) => {
			off(this.mealsRef, 'value', listener);
		});
		this.listeners.clear();
	}

	// Utility functions for meal organization
	organizeMealsByDay(meals) {
		const organized = {};
		
		Object.values(meals).forEach(meal => {
			if (!organized[meal.day]) {
				organized[meal.day] = {};
			}
			if (!organized[meal.day][meal.slot]) {
				organized[meal.day][meal.slot] = [];
			}
			organized[meal.day][meal.slot].push(meal);
		});
		
		return organized;
	}

	// Calculate total meal cost
	calculateTotalCost(meals) {
		return Object.values(meals).reduce((total, meal) => {
			return total + (meal.cost || 0);
		}, 0);
	}

	// Get meals by claimer
	getMealsByClaimer(meals) {
		const byClaimer = {};
		
		Object.values(meals).forEach(meal => {
			if (meal.claimedBy) {
				if (!byClaimer[meal.claimedBy]) {
					byClaimer[meal.claimedBy] = [];
				}
				byClaimer[meal.claimedBy].push(meal);
			}
		});
		
		return byClaimer;
	}
}

// Factory function to create meal service instance
export function createMealService(eventId) {
	return new MealService(eventId);
}