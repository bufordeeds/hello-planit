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

export class ExpenseService {
	constructor(eventId) {
		this.eventId = eventId;
		this.expensesRef = ref(database, `events/${eventId}/expenses`);
		this.listeners = new Map();
	}

	// Generate a unique expense ID
	generateExpenseId() {
		return push(ref(database, 'temp')).key;
	}

	// Create a new expense
	async createExpense(expenseData, userId) {
		if (!browser) {
			throw new Error('Expense creation is only available in browser');
		}
		
		if (!userId) {
			throw new Error('User must be authenticated');
		}

		try {
			const expenseRef = push(this.expensesRef);
			const expenseId = expenseRef.key;
			
			const expense = {
				name: expenseData.name,
				description: expenseData.description || '',
				amount: parseFloat(expenseData.amount) || 0,
				paidBy: expenseData.paidBy,
				paidByUserId: expenseData.paidByUserId || '',
				venmoUsername: expenseData.venmoUsername || '',
				splitType: expenseData.splitType || 'all', // 'all' or 'select'
				splitBetween: expenseData.splitBetween || 'all', // 'all' or array of member IDs
				category: expenseData.category || 'other',
				date: expenseData.date || new Date().toISOString(),
				receiptUrl: expenseData.receiptUrl || '',
				addedBy: userId,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			};

			await set(expenseRef, expense);
			
			return {
				id: expenseId,
				...expense
			};
		} catch (error) {
			console.error('Error creating expense:', error);
			throw new Error('Failed to create expense: ' + error.message);
		}
	}

	// Update an existing expense
	async updateExpense(expenseId, expenseData, userId) {
		if (!browser) {
			throw new Error('Expense update is only available in browser');
		}
		
		if (!userId) {
			throw new Error('User must be authenticated');
		}

		try {
			const expenseRef = ref(database, `events/${this.eventId}/expenses/${expenseId}`);
			
			// Get existing expense to preserve some fields
			const snapshot = await get(expenseRef);
			if (!snapshot.exists()) {
				throw new Error('Expense not found');
			}
			
			const existingExpense = snapshot.val();
			
			const updatedExpense = {
				...existingExpense,
				name: expenseData.name,
				description: expenseData.description || '',
				amount: parseFloat(expenseData.amount) || 0,
				paidBy: expenseData.paidBy,
				paidByUserId: expenseData.paidByUserId || '',
				venmoUsername: expenseData.venmoUsername || '',
				splitType: expenseData.splitType || 'all',
				splitBetween: expenseData.splitBetween || 'all',
				category: expenseData.category || 'other',
				date: expenseData.date || existingExpense.date,
				receiptUrl: expenseData.receiptUrl || '',
				updatedAt: serverTimestamp(),
			};

			await set(expenseRef, updatedExpense);
			
			return {
				id: expenseId,
				...updatedExpense
			};
		} catch (error) {
			console.error('Error updating expense:', error);
			throw new Error('Failed to update expense: ' + error.message);
		}
	}

	// Delete an expense
	async deleteExpense(expenseId, userId) {
		if (!browser) {
			throw new Error('Expense deletion is only available in browser');
		}
		
		if (!userId) {
			throw new Error('User must be authenticated');
		}

		try {
			const expenseRef = ref(database, `events/${this.eventId}/expenses/${expenseId}`);
			await remove(expenseRef);
			
			return { success: true };
		} catch (error) {
			console.error('Error deleting expense:', error);
			throw new Error('Failed to delete expense: ' + error.message);
		}
	}

	// Get a single expense
	async getExpense(expenseId) {
		try {
			const expenseRef = ref(database, `events/${this.eventId}/expenses/${expenseId}`);
			const snapshot = await get(expenseRef);
			
			if (!snapshot.exists()) {
				return null;
			}
			
			return {
				id: expenseId,
				...snapshot.val()
			};
		} catch (error) {
			console.error('Error getting expense:', error);
			throw new Error('Failed to get expense: ' + error.message);
		}
	}

	// Get all expenses for the event
	async getExpenses() {
		try {
			const snapshot = await get(this.expensesRef);
			
			if (!snapshot.exists()) {
				return {};
			}
			
			const expenses = {};
			snapshot.forEach((childSnapshot) => {
				expenses[childSnapshot.key] = {
					id: childSnapshot.key,
					...childSnapshot.val()
				};
			});
			
			return expenses;
		} catch (error) {
			console.error('Error getting expenses:', error);
			throw new Error('Failed to get expenses: ' + error.message);
		}
	}

	// Subscribe to real-time expense updates
	subscribeExpenses(callback) {
		if (!browser) return () => {};
		
		const handleUpdate = (snapshot) => {
			const expenses = {};
			if (snapshot.exists()) {
				snapshot.forEach((childSnapshot) => {
					expenses[childSnapshot.key] = {
						id: childSnapshot.key,
						...childSnapshot.val()
					};
				});
			}
			callback(expenses);
		};

		onValue(this.expensesRef, handleUpdate);
		
		// Store listener for cleanup
		this.listeners.set(callback, handleUpdate);
		
		// Return unsubscribe function
		return () => {
			off(this.expensesRef, 'value', handleUpdate);
			this.listeners.delete(callback);
		};
	}

	// Clean up all listeners
	cleanup() {
		this.listeners.forEach((listener) => {
			off(this.expensesRef, 'value', listener);
		});
		this.listeners.clear();
	}

	// Calculate total expenses
	calculateTotalExpenses(expenses) {
		return Object.values(expenses).reduce((total, expense) => {
			return total + (expense.amount || 0);
		}, 0);
	}

	// Calculate expense balances for all members
	calculateBalances(expenses, eventMembers) {
		const balances = {};
		
		// Initialize all members with 0 balance
		Object.keys(eventMembers).forEach(memberId => {
			balances[memberId] = 0;
		});

		// Process each expense
		Object.values(expenses).forEach(expense => {
			// Add amount to the person who paid
			const payerId = expense.paidByUserId || expense.paidBy;
			if (payerId && balances[payerId] !== undefined) {
				balances[payerId] += expense.amount;
			}
			
			// Calculate who should split the expense
			let splitMembers = [];
			if (expense.splitType === 'all' || expense.splitBetween === 'all') {
				splitMembers = Object.keys(eventMembers);
			} else if (Array.isArray(expense.splitBetween)) {
				splitMembers = expense.splitBetween;
			}
			
			// Subtract per-person share from each member
			if (splitMembers.length > 0) {
				const perPersonShare = expense.amount / splitMembers.length;
				splitMembers.forEach(memberId => {
					if (balances[memberId] !== undefined) {
						balances[memberId] -= perPersonShare;
					}
				});
			}
		});

		return balances;
	}

	// Calculate settlements (who owes who)
	calculateSettlements(balances) {
		const settlements = [];
		const creditors = [];
		const debtors = [];

		// Separate creditors and debtors
		Object.entries(balances).forEach(([memberId, balance]) => {
			if (balance > 0.01) {
				creditors.push({ memberId, amount: balance });
			} else if (balance < -0.01) {
				debtors.push({ memberId, amount: -balance });
			}
		});

		// Sort by amount (largest first)
		creditors.sort((a, b) => b.amount - a.amount);
		debtors.sort((a, b) => b.amount - a.amount);

		// Create working copies
		const workingCreditors = creditors.map(c => ({ ...c }));
		const workingDebtors = debtors.map(d => ({ ...d }));

		// Calculate settlements
		let i = 0, j = 0;
		while (i < workingCreditors.length && j < workingDebtors.length) {
			const creditor = workingCreditors[i];
			const debtor = workingDebtors[j];
			
			const settleAmount = Math.min(creditor.amount, debtor.amount);
			
			if (settleAmount > 0.01) {
				settlements.push({
					from: debtor.memberId,
					to: creditor.memberId,
					amount: settleAmount
				});
			}
			
			creditor.amount -= settleAmount;
			debtor.amount -= settleAmount;
			
			if (creditor.amount < 0.01) i++;
			if (debtor.amount < 0.01) j++;
		}

		return settlements;
	}

	// Get expenses by category
	getExpensesByCategory(expenses) {
		const byCategory = {};
		
		Object.values(expenses).forEach(expense => {
			const category = expense.category || 'other';
			if (!byCategory[category]) {
				byCategory[category] = {
					expenses: [],
					total: 0
				};
			}
			byCategory[category].expenses.push(expense);
			byCategory[category].total += expense.amount || 0;
		});
		
		return byCategory;
	}

	// Get expenses by payer
	getExpensesByPayer(expenses) {
		const byPayer = {};
		
		Object.values(expenses).forEach(expense => {
			const payer = expense.paidBy;
			if (!byPayer[payer]) {
				byPayer[payer] = {
					expenses: [],
					total: 0
				};
			}
			byPayer[payer].expenses.push(expense);
			byPayer[payer].total += expense.amount || 0;
		});
		
		return byPayer;
	}
}

// Factory function to create expense service instance
export function createExpenseService(eventId) {
	return new ExpenseService(eventId);
}