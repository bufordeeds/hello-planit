<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { user } from '$lib/stores/auth.js';
	import { currentEvent, eventService } from '$lib/stores/events.js';
	import { sanitizeInput } from '$lib/utils/validation.js';
	import { formatCurrency } from '$lib/utils/formatters.js';
	import { createExpenseService } from '$lib/services/expenseService.js';
	import ExpenseForm from './ExpenseForm.svelte';
	import ExpenseSummary from './ExpenseSummary.svelte';
	
	const dispatch = createEventDispatcher();
	
	export let eventId;
	export let expenses = {};
	export let members = {};
	export let canEdit = false;
	
	let showAddExpenseModal = false;
	let editingExpense = null;
	let selectedCategory = 'all';
	let selectedMember = 'all';
	let error = null;
	let loading = false;
	let expenseService = null;
	let unsubscribeExpenses = null;
	
	// Expense categories
	const categories = [
		{ value: 'accommodation', label: 'Accommodation', icon: 'bed' },
		{ value: 'food', label: 'Food & Dining', icon: 'utensils' },
		{ value: 'transport', label: 'Transportation', icon: 'car' },
		{ value: 'entertainment', label: 'Entertainment', icon: 'ticket' },
		{ value: 'shopping', label: 'Shopping', icon: 'shopping-bag' },
		{ value: 'activities', label: 'Activities', icon: 'activity' },
		{ value: 'other', label: 'Other', icon: 'more-horizontal' },
	];
	
	// Reactive calculations
	$: expensesList = Object.values(expenses);
	$: filteredExpenses = filterExpenses(expensesList, selectedCategory, selectedMember);
	$: totalAmount = calculateTotal(expensesList);
	$: categoryTotals = calculateCategoryTotals(expensesList);
	$: memberBalances = calculateMemberBalances(expensesList, members);
	$: settlements = calculateSettlements(memberBalances, members);
	
	onMount(() => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
		
		// Initialize expense service
		if (eventId) {
			expenseService = createExpenseService(eventId);
			
			// Subscribe to real-time expense updates
			unsubscribeExpenses = expenseService.subscribeExpenses((updatedExpenses) => {
				expenses = updatedExpenses;
			});
		}
	});
	
	onDestroy(() => {
		// Clean up subscriptions
		if (unsubscribeExpenses) {
			unsubscribeExpenses();
		}
		if (expenseService) {
			expenseService.cleanup();
		}
	});
	
	function filterExpenses(expensesList, category, member) {
		return expensesList.filter(expense => {
			const categoryMatch = category === 'all' || expense.category === category;
			const memberMatch = member === 'all' || expense.paidBy === member;
			return categoryMatch && memberMatch;
		});
	}
	
	function calculateTotal(expensesList) {
		return expensesList.reduce((total, expense) => total + (expense.amount || 0), 0);
	}
	
	function calculateCategoryTotals(expensesList) {
		const totals = {};
		categories.forEach(cat => {
			totals[cat.value] = expensesList
				.filter(expense => expense.category === cat.value)
				.reduce((sum, expense) => sum + (expense.amount || 0), 0);
		});
		return totals;
	}
	
	function calculateMemberBalances(expensesList, membersData) {
		if (expenseService) {
			// Use the service method which handles proper split calculations
			const rawBalances = expenseService.calculateBalances(expenses, membersData);
			
			// Format balances for the UI
			const formattedBalances = {};
			Object.entries(rawBalances).forEach(([memberId, balance]) => {
				formattedBalances[memberId] = {
					name: membersData[memberId]?.name || membersData[memberId]?.email || 'Unknown',
					balance: balance
				};
			});
			
			return formattedBalances;
		}
		
		// Fallback calculation
		const balances = {};
		const memberIds = Object.keys(membersData);
		
		// Initialize balances
		memberIds.forEach(memberId => {
			balances[memberId] = {
				name: membersData[memberId]?.name || membersData[memberId]?.email || 'Unknown',
				paid: 0,
				owes: 0,
				balance: 0,
			};
		});
		
		// Calculate what each member paid
		expensesList.forEach(expense => {
			if (expense.paidByUserId && balances[expense.paidByUserId]) {
				balances[expense.paidByUserId].paid += expense.amount || 0;
			}
		});
		
		// Calculate what each member owes (split evenly for now)
		const totalExpenses = calculateTotal(expensesList);
		const perPersonShare = totalExpenses / memberIds.length;
		
		memberIds.forEach(memberId => {
			balances[memberId].owes = perPersonShare;
			balances[memberId].balance = balances[memberId].paid - balances[memberId].owes;
		});
		
		return balances;
	}

	function calculateSettlements(balances, membersData) {
		if (expenseService) {
			// Convert UI balances format to service format
			const serviceBalances = {};
			Object.entries(balances).forEach(([memberId, data]) => {
				serviceBalances[memberId] = data.balance;
			});
			
			const settlements = expenseService.calculateSettlements(serviceBalances);
			
			// Add member names to settlements
			return settlements.map(settlement => ({
				...settlement,
				fromName: membersData[settlement.from]?.name || membersData[settlement.from]?.email || 'Unknown',
				toName: membersData[settlement.to]?.name || membersData[settlement.to]?.email || 'Unknown'
			}));
		}
		
		return [];
	}
	
	function handleAddExpense() {
		editingExpense = null;
		showAddExpenseModal = true;
	}
	
	function handleEditExpense(expense) {
		editingExpense = expense;
		showAddExpenseModal = true;
	}
	
	async function handleExpenseSubmit(event) {
		const expenseData = event.detail;
		
		try {
			loading = true;
			error = null;
			
			if (editingExpense) {
				await updateExpense(editingExpense.id, expenseData);
			} else {
				await createExpense(expenseData);
			}
			
			showAddExpenseModal = false;
			editingExpense = null;
			
			dispatch('expensesUpdated');
		} catch (err) {
			error = err.message || 'Failed to save expense';
		} finally {
			loading = false;
		}
	}
	
	async function createExpense(expenseData) {
		if (!expenseService || !$user) {
			throw new Error('Expense service not initialized or user not authenticated');
		}
		
		try {
			// Get member details for the payer
			const paidByMember = members[expenseData.paidBy] || {};
			
			const newExpense = await expenseService.createExpense({
				...expenseData,
				paidBy: paidByMember.name || paidByMember.email || 'Unknown',
				paidByUserId: expenseData.paidBy,
				date: new Date().toISOString()
			}, $user.uid);
			
			console.log('Expense created successfully:', newExpense);
		} catch (error) {
			console.error('Error creating expense:', error);
			throw error;
		}
	}
	
	async function updateExpense(expenseId, expenseData) {
		if (!expenseService || !$user) {
			throw new Error('Expense service not initialized or user not authenticated');
		}
		
		try {
			// Get member details for the payer
			const paidByMember = members[expenseData.paidBy] || {};
			
			const updatedExpense = await expenseService.updateExpense(expenseId, {
				...expenseData,
				paidBy: paidByMember.name || paidByMember.email || 'Unknown',
				paidByUserId: expenseData.paidBy
			}, $user.uid);
			
			console.log('Expense updated successfully:', updatedExpense);
		} catch (error) {
			console.error('Error updating expense:', error);
			throw error;
		}
	}
	
	async function deleteExpense(expenseId) {
		if (!confirm('Are you sure you want to delete this expense?')) return;
		
		if (!expenseService || !$user) {
			error = 'Expense service not initialized or user not authenticated';
			return;
		}
		
		try {
			loading = true;
			error = null;
			
			await expenseService.deleteExpense(expenseId, $user.uid);
			
			console.log('Expense deleted successfully');
			dispatch('expensesUpdated');
		} catch (err) {
			error = err.message || 'Failed to delete expense';
		} finally {
			loading = false;
		}
	}
	
	function handleCloseModal() {
		showAddExpenseModal = false;
		editingExpense = null;
		error = null;
	}
	
	function getCategoryLabel(categoryValue) {
		const category = categories.find(cat => cat.value === categoryValue);
		return category ? category.label : categoryValue;
	}
	
	function getCategoryIcon(categoryValue) {
		const category = categories.find(cat => cat.value === categoryValue);
		return category ? category.icon : 'more-horizontal';
	}
	
	function getMemberName(memberId) {
		if (!memberId || !members[memberId]) return 'Unknown';
		return members[memberId].name || members[memberId].email || 'Unknown';
	}
	
	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString();
	}
</script>

<div class="expense-tracker">
	<div class="expense-tracker-header">
		<div class="header-content">
			<div class="header-info">
				<h2>Expense Tracking</h2>
				<div class="expense-stats">
					<span class="stat">{expensesList.length} expense{expensesList.length !== 1 ? 's' : ''}</span>
					<span class="stat-divider">•</span>
					<span class="stat">{formatCurrency(totalAmount)} total</span>
				</div>
			</div>
			
			{#if canEdit}
				<button class="btn btn-primary" on:click={handleAddExpense}>
					<i data-lucide="plus"></i>
					Add Expense
				</button>
			{/if}
		</div>
		
		{#if error}
			<div class="error-message">
				<i data-lucide="alert-circle"></i>
				{error}
			</div>
		{/if}
		
		<!-- Filters -->
		<div class="filters">
			<div class="filter-group">
				<label for="categoryFilter">Category</label>
				<select id="categoryFilter" bind:value={selectedCategory}>
					<option value="all">All Categories</option>
					{#each categories as category}
						<option value={category.value}>{category.label}</option>
					{/each}
				</select>
			</div>
			
			<div class="filter-group">
				<label for="memberFilter">Paid By</label>
				<select id="memberFilter" bind:value={selectedMember}>
					<option value="all">All Members</option>
					{#each Object.entries(members) as [memberId, member]}
						<option value={memberId}>{member.name || member.email}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
	
	<!-- Summary Cards -->
	<ExpenseSummary 
		{totalAmount}
		{categoryTotals}
		{memberBalances}
		{categories}
		{settlements}
		{members}
	/>
	
	<!-- Expenses List -->
	<div class="expenses-section">
		<div class="section-header">
			<h3>
				{#if selectedCategory !== 'all' || selectedMember !== 'all'}
					Filtered Expenses ({filteredExpenses.length})
				{:else}
					All Expenses ({expensesList.length})
				{/if}
			</h3>
		</div>
		
		{#if filteredExpenses.length > 0}
			<div class="expenses-list">
				{#each filteredExpenses as expense}
					<div class="expense-card">
						<div class="expense-header">
							<div class="expense-category">
								<i data-lucide={getCategoryIcon(expense.category)}></i>
								<span class="category-label">{getCategoryLabel(expense.category)}</span>
							</div>
							
							<div class="expense-amount">
								{formatCurrency(expense.amount)}
							</div>
						</div>
						
						<div class="expense-body">
							<h4 class="expense-name">{expense.name}</h4>
							
							{#if expense.description}
								<p class="expense-description">{expense.description}</p>
							{/if}
							
							<div class="expense-details">
								<div class="expense-detail">
									<i data-lucide="user"></i>
									<span>Paid by {getMemberName(expense.paidBy)}</span>
								</div>
								
								{#if expense.date}
									<div class="expense-detail">
										<i data-lucide="calendar"></i>
										<span>{formatDate(expense.date)}</span>
									</div>
								{/if}
								
								{#if expense.receipt}
									<div class="expense-detail">
										<i data-lucide="receipt"></i>
										<span>Receipt attached</span>
									</div>
								{/if}
							</div>
						</div>
						
						{#if canEdit}
							<div class="expense-actions">
								<button 
									class="btn-icon" 
									on:click={() => handleEditExpense(expense)}
									title="Edit expense"
								>
									<i data-lucide="edit-3"></i>
								</button>
								<button 
									class="btn-icon btn-danger" 
									on:click={() => deleteExpense(expense.id)}
									title="Delete expense"
								>
									<i data-lucide="trash-2"></i>
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-icon">
					<i data-lucide="receipt"></i>
				</div>
				<h3>
					{#if selectedCategory !== 'all' || selectedMember !== 'all'}
						No expenses match your filters
					{:else}
						No expenses tracked yet
					{/if}
				</h3>
				<p>
					{#if selectedCategory !== 'all' || selectedMember !== 'all'}
						Try adjusting your filters to see more expenses.
					{:else}
						Start tracking expenses by adding them above.
					{/if}
				</p>
				{#if canEdit && selectedCategory === 'all' && selectedMember === 'all'}
					<button class="btn btn-primary" on:click={handleAddExpense}>
						<i data-lucide="plus"></i>
						Add First Expense
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Expense Form Modal -->
<ExpenseForm 
	bind:isOpen={showAddExpenseModal}
	{editingExpense}
	{categories}
	{members}
	{loading}
	on:submit={handleExpenseSubmit}
	on:close={handleCloseModal}
/>

<style>
	.expense-tracker {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.expense-tracker-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	
	.header-info h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}
	
	.expense-stats {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}
	
	.stat-divider {
		color: #d1d5db;
	}
	
	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.filters {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}
	
	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}
	
	.filter-group label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.filter-group select {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		background: white;
	}
	
	.filter-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.expenses-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		overflow: hidden;
	}
	
	.section-header {
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}
	
	.section-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}
	
	.expenses-list {
		display: flex;
		flex-direction: column;
	}
	
	.expense-card {
		padding: 1.5rem;
		border-bottom: 1px solid #f3f4f6;
		transition: background 0.2s ease;
		position: relative;
	}
	
	.expense-card:last-child {
		border-bottom: none;
	}
	
	.expense-card:hover {
		background: #f9fafb;
	}
	
	.expense-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 1rem;
	}
	
	.expense-category {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.75rem;
		background: #f3f4f6;
		border-radius: 9999px;
		font-size: 0.75rem;
	}
	
	.expense-category i {
		width: 12px;
		height: 12px;
		color: #6b7280;
	}
	
	.category-label {
		color: #374151;
		font-weight: 500;
	}
	
	.expense-amount {
		font-size: 1.25rem;
		font-weight: 700;
		color: #111827;
	}
	
	.expense-body {
		margin-bottom: 1rem;
	}
	
	.expense-name {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}
	
	.expense-description {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.5;
		margin: 0 0 1rem 0;
	}
	
	.expense-details {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
	
	.expense-detail {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: #6b7280;
	}
	
	.expense-detail i {
		width: 12px;
		height: 12px;
		color: #9ca3af;
	}
	
	.expense-actions {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}
	
	.expense-card:hover .expense-actions {
		opacity: 1;
	}
	
	.btn-icon {
		background: none;
		border: none;
		padding: 0.5rem;
		border-radius: 4px;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.btn-icon:hover {
		background: #e5e7eb;
		color: #374151;
	}
	
	.btn-icon.btn-danger:hover {
		background: #fee2e2;
		color: #dc2626;
	}
	
	.btn-icon i {
		width: 14px;
		height: 14px;
	}
	
	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
	}
	
	.empty-icon {
		width: 64px;
		height: 64px;
		background: #f3f4f6;
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1rem;
		color: #9ca3af;
	}
	
	.empty-icon i {
		width: 32px;
		height: 32px;
	}
	
	.empty-state h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}
	
	.empty-state p {
		color: #6b7280;
		margin: 0 0 1.5rem 0;
	}
	
	.btn {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.btn-primary {
		background: #3b82f6;
		color: white;
	}
	
	.btn-primary:hover {
		background: #2563eb;
	}
	
	/* Mobile responsive */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: stretch;
		}
		
		.filters {
			flex-direction: column;
		}
		
		.expense-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		
		.expense-amount {
			font-size: 1.125rem;
		}
		
		.expense-details {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.expense-actions {
			position: static;
			opacity: 1;
			margin-top: 1rem;
			justify-content: flex-end;
		}
	}
</style>