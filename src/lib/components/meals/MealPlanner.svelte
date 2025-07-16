<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { user } from '$lib/stores/auth.js';
	import { currentEvent, eventService } from '$lib/stores/events.js';
	import { sanitizeInput, validateEvent } from '$lib/utils/validation.js';
	import { formatCurrency } from '$lib/utils/formatters.js';
	import { createMealService } from '$lib/services/mealService.js';
	import MealForm from './MealForm.svelte';
	
	const dispatch = createEventDispatcher();
	
	export let eventId;
	export let meals = {};
	export let mealSlots = ['breakfast', 'lunch', 'dinner'];
	export let eventDays = ['day-1', 'day-2'];
	export let canEdit = false;
	
	let showAddMealModal = false;
	let editingMeal = null;
	let selectedDay = eventDays[0] || 'day-1';
	let selectedSlot = 'breakfast';
	let error = null;
	let loading = false;
	let mealService = null;
	let unsubscribeMeals = null;
	
	// Reactive meal grid
	$: mealGrid = createMealGrid(meals, eventDays, mealSlots);
	$: totalCost = calculateTotalCost(meals);
	$: mealCount = Object.keys(meals).length;
	
	onMount(() => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
		
		// Initialize meal service
		if (eventId) {
			mealService = createMealService(eventId);
			
			// Subscribe to real-time meal updates
			unsubscribeMeals = mealService.subscribeMeals((updatedMeals) => {
				meals = updatedMeals;
			});
		}
	});
	
	onDestroy(() => {
		// Clean up subscriptions
		if (unsubscribeMeals) {
			unsubscribeMeals();
		}
		if (mealService) {
			mealService.cleanup();
		}
	});
	
	function createMealGrid(mealsData, days, slots) {
		const grid = {};
		
		days.forEach(day => {
			grid[day] = {};
			slots.forEach(slot => {
				grid[day][slot] = Object.values(mealsData).filter(meal => 
					meal.day === day && meal.slot === slot
				);
			});
		});
		
		return grid;
	}
	
	function calculateTotalCost(mealsData) {
		if (mealService) {
			return mealService.calculateTotalCost(mealsData);
		}
		return Object.values(mealsData).reduce((total, meal) => {
			return total + (meal.cost || 0);
		}, 0);
	}
	
	function handleAddMeal(day = null, slot = null) {
		selectedDay = day || selectedDay;
		selectedSlot = slot || selectedSlot;
		editingMeal = null;
		showAddMealModal = true;
	}
	
	function handleEditMeal(meal) {
		editingMeal = meal;
		selectedDay = meal.day;
		selectedSlot = meal.slot;
		showAddMealModal = true;
	}
	
	async function handleMealSubmit(event) {
		const mealData = event.detail;
		
		try {
			loading = true;
			error = null;
			
			if (editingMeal) {
				await updateMeal(editingMeal.id, mealData);
			} else {
				await createMeal(mealData);
			}
			
			showAddMealModal = false;
			editingMeal = null;
			
			dispatch('mealsUpdated');
		} catch (err) {
			error = err.message || 'Failed to save meal';
		} finally {
			loading = false;
		}
	}
	
	async function createMeal(mealData) {
		if (!mealService || !$user) {
			throw new Error('Meal service not initialized or user not authenticated');
		}
		
		try {
			const newMeal = await mealService.createMeal({
				...mealData,
				day: selectedDay,
				slot: selectedSlot
			}, $user.uid);
			
			console.log('Meal created successfully:', newMeal);
		} catch (error) {
			console.error('Error creating meal:', error);
			throw error;
		}
	}
	
	async function updateMeal(mealId, mealData) {
		if (!mealService || !$user) {
			throw new Error('Meal service not initialized or user not authenticated');
		}
		
		try {
			const updatedMeal = await mealService.updateMeal(mealId, {
				...mealData,
				day: selectedDay,
				slot: selectedSlot
			}, $user.uid);
			
			console.log('Meal updated successfully:', updatedMeal);
		} catch (error) {
			console.error('Error updating meal:', error);
			throw error;
		}
	}
	
	async function deleteMeal(mealId) {
		if (!confirm('Are you sure you want to delete this meal?')) return;
		
		if (!mealService || !$user) {
			error = 'Meal service not initialized or user not authenticated';
			return;
		}
		
		try {
			loading = true;
			error = null;
			
			await mealService.deleteMeal(mealId, $user.uid);
			
			console.log('Meal deleted successfully');
			dispatch('mealsUpdated');
		} catch (err) {
			error = err.message || 'Failed to delete meal';
		} finally {
			loading = false;
		}
	}
	
	function handleCloseModal() {
		showAddMealModal = false;
		editingMeal = null;
		error = null;
	}
	
	function getDayLabel(day) {
		const dayLabels = {
			'day-1': 'Day 1',
			'day-2': 'Day 2', 
			'day-3': 'Day 3',
			'friday': 'Friday',
			'saturday': 'Saturday',
			'sunday': 'Sunday',
			'party-day': 'Party Day',
			'wedding-day': 'Wedding Day',
		};
		return dayLabels[day] || day.charAt(0).toUpperCase() + day.slice(1);
	}
	
	function getSlotLabel(slot) {
		const slotLabels = {
			'breakfast': 'Breakfast',
			'brunch': 'Brunch',
			'lunch': 'Lunch',
			'dinner': 'Dinner',
			'appetizers': 'Appetizers',
			'main': 'Main Course',
			'dessert': 'Dessert',
			'cake': 'Cake',
			'cocktail': 'Cocktail Hour',
		};
		return slotLabels[slot] || slot.charAt(0).toUpperCase() + slot.slice(1);
	}
	
	function getSlotIcon(slot) {
		const slotIcons = {
			'breakfast': 'coffee',
			'brunch': 'coffee',
			'lunch': 'utensils',
			'dinner': 'utensils',
			'appetizers': 'cookie',
			'main': 'utensils',
			'dessert': 'cake',
			'cake': 'cake',
			'cocktail': 'wine',
		};
		return slotIcons[slot] || 'utensils';
	}
</script>

<div class="meal-planner">
	<div class="meal-planner-header">
		<div class="header-content">
			<div class="header-info">
				<h2>Meal Planning</h2>
				<div class="meal-stats">
					<span class="stat">{mealCount} meal{mealCount !== 1 ? 's' : ''}</span>
					<span class="stat-divider">•</span>
					<span class="stat">{formatCurrency(totalCost)} total</span>
				</div>
			</div>
			
			{#if canEdit}
				<button class="btn btn-primary" on:click={() => handleAddMeal()}>
					<i data-lucide="plus"></i>
					Add Meal
				</button>
			{/if}
		</div>
		
		{#if error}
			<div class="error-message">
				<i data-lucide="alert-circle"></i>
				{error}
			</div>
		{/if}
	</div>
	
	<div class="meal-grid">
		<div class="grid-header">
			<div class="grid-corner"></div>
			{#each mealSlots as slot}
				<div class="slot-header">
					<i data-lucide={getSlotIcon(slot)}></i>
					{getSlotLabel(slot)}
				</div>
			{/each}
		</div>
		
		{#each eventDays as day}
			<div class="day-row">
				<div class="day-header">
					<span class="day-label">{getDayLabel(day)}</span>
				</div>
				
				{#each mealSlots as slot}
					<div class="meal-cell">
						{#if mealGrid[day] && mealGrid[day][slot]}
							{#each mealGrid[day][slot] as meal}
								<div class="meal-card">
									<div class="meal-header">
										<h4 class="meal-name">{meal.name}</h4>
										{#if canEdit}
											<div class="meal-actions">
												<button 
													class="btn-icon" 
													on:click={() => handleEditMeal(meal)}
													title="Edit meal"
												>
													<i data-lucide="edit-3"></i>
												</button>
												<button 
													class="btn-icon btn-danger" 
													on:click={() => deleteMeal(meal.id)}
													title="Delete meal"
												>
													<i data-lucide="trash-2"></i>
												</button>
											</div>
										{/if}
									</div>
									
									{#if meal.description}
										<p class="meal-description">{meal.description}</p>
									{/if}
									
									<div class="meal-details">
										{#if meal.location}
											<div class="meal-detail">
												<i data-lucide="map-pin"></i>
												<span>{meal.location}</span>
											</div>
										{/if}
										
										{#if meal.time}
											<div class="meal-detail">
												<i data-lucide="clock"></i>
												<span>{meal.time}</span>
											</div>
										{/if}
										
										{#if meal.cost}
											<div class="meal-detail">
												<i data-lucide="dollar-sign"></i>
												<span>{formatCurrency(meal.cost)}</span>
											</div>
										{/if}
										
										{#if meal.servings}
											<div class="meal-detail">
												<i data-lucide="users"></i>
												<span>{meal.servings} serving{meal.servings !== 1 ? 's' : ''}</span>
											</div>
										{/if}
									</div>
									
									{#if meal.assignedTo}
										<div class="meal-assignment">
											<i data-lucide="user-check"></i>
											<span>Assigned to {meal.assignedTo}</span>
										</div>
									{/if}
								</div>
							{/each}
						{/if}
						
						{#if canEdit}
							<button 
								class="add-meal-btn" 
								on:click={() => handleAddMeal(day, slot)}
								title="Add meal to {getSlotLabel(slot)} on {getDayLabel(day)}"
							>
								<i data-lucide="plus"></i>
								<span>Add {getSlotLabel(slot)}</span>
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
	
	{#if mealCount === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<i data-lucide="utensils"></i>
			</div>
			<h3>No meals planned yet</h3>
			<p>Start planning your meals by adding them to the schedule above.</p>
			{#if canEdit}
				<button class="btn btn-primary" on:click={() => handleAddMeal()}>
					<i data-lucide="plus"></i>
					Add First Meal
				</button>
			{/if}
		</div>
	{/if}
</div>

<!-- Meal Form Modal -->
<MealForm 
	bind:isOpen={showAddMealModal}
	{editingMeal}
	{selectedDay}
	{selectedSlot}
	{eventDays}
	{mealSlots}
	{loading}
	on:submit={handleMealSubmit}
	on:close={handleCloseModal}
/>

<style>
	.meal-planner {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.meal-planner-header {
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
	
	.meal-stats {
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
	
	.meal-grid {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		overflow: hidden;
	}
	
	.grid-header {
		display: grid;
		grid-template-columns: 120px repeat(var(--slot-count, 3), 1fr);
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}
	
	.grid-corner {
		padding: 1rem;
		border-right: 1px solid #e5e7eb;
	}
	
	.slot-header {
		padding: 1rem;
		border-right: 1px solid #e5e7eb;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}
	
	.slot-header:last-child {
		border-right: none;
	}
	
	.slot-header i {
		width: 16px;
		height: 16px;
		color: #6b7280;
	}
	
	.day-row {
		display: grid;
		grid-template-columns: 120px repeat(var(--slot-count, 3), 1fr);
		border-bottom: 1px solid #e5e7eb;
	}
	
	.day-row:last-child {
		border-bottom: none;
	}
	
	.day-header {
		padding: 1rem;
		border-right: 1px solid #e5e7eb;
		background: #f9fafb;
		display: flex;
		align-items: center;
	}
	
	.day-label {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}
	
	.meal-cell {
		padding: 1rem;
		border-right: 1px solid #e5e7eb;
		min-height: 120px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.meal-cell:last-child {
		border-right: none;
	}
	
	.meal-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 0.75rem;
		transition: all 0.2s ease;
	}
	
	.meal-card:hover {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		border-color: #cbd5e1;
	}
	
	.meal-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	.meal-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		line-height: 1.3;
	}
	
	.meal-actions {
		display: flex;
		gap: 0.25rem;
	}
	
	.meal-description {
		font-size: 0.75rem;
		color: #6b7280;
		line-height: 1.4;
		margin: 0 0 0.5rem 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.meal-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.meal-detail {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: #6b7280;
	}
	
	.meal-detail i {
		width: 12px;
		height: 12px;
		color: #9ca3af;
	}
	
	.meal-assignment {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: #3b82f6;
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #e2e8f0;
	}
	
	.meal-assignment i {
		width: 12px;
		height: 12px;
	}
	
	.add-meal-btn {
		background: none;
		border: 2px dashed #d1d5db;
		border-radius: 6px;
		padding: 1rem;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		text-align: center;
	}
	
	.add-meal-btn:hover {
		border-color: #9ca3af;
		color: #374151;
		background: #f9fafb;
	}
	
	.add-meal-btn i {
		width: 16px;
		height: 16px;
	}
	
	.btn-icon {
		background: none;
		border: none;
		padding: 0.25rem;
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
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
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
		.meal-grid {
			display: block;
		}
		
		.grid-header {
			display: none;
		}
		
		.day-row {
			display: block;
			border-bottom: 2px solid #e5e7eb;
			margin-bottom: 1rem;
		}
		
		.day-header {
			background: #f3f4f6;
			border-right: none;
			border-bottom: 1px solid #e5e7eb;
			text-align: center;
			font-weight: 700;
		}
		
		.meal-cell {
			border-right: none;
			border-bottom: 1px solid #f3f4f6;
			padding: 1rem;
		}
		
		.meal-cell:before {
			content: attr(data-slot);
			display: block;
			font-weight: 600;
			color: #6b7280;
			font-size: 0.875rem;
			margin-bottom: 0.75rem;
			text-transform: capitalize;
		}
		
		.header-content {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>