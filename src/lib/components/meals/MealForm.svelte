<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { sanitizeInput } from '$lib/utils/validation.js';
	
	const dispatch = createEventDispatcher();
	
	export let isOpen = false;
	export let editingMeal = null;
	export let selectedDay = 'day-1';
	export let selectedSlot = 'breakfast';
	export let eventDays = ['day-1', 'day-2'];
	export let mealSlots = ['breakfast', 'lunch', 'dinner'];
	export let members = {};
	export let loading = false;
	
	let formData = {
		name: '',
		description: '',
		location: '',
		time: '',
		cost: '',
		servings: '',
		assignedTo: '',
		day: selectedDay,
		slot: selectedSlot,
	};
	
	let error = null;
	
	// Reset form when modal opens or editing meal changes
	$: if (isOpen) {
		resetForm();
	}
	
	onMount(() => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
	});
	
	function resetForm() {
		if (editingMeal) {
			formData = {
				name: editingMeal.name || '',
				description: editingMeal.description || '',
				location: editingMeal.location || '',
				time: editingMeal.time || '',
				cost: editingMeal.cost || '',
				servings: editingMeal.servings || '',
				assignedTo: editingMeal.assignedTo || '',
				day: editingMeal.day || selectedDay,
				slot: editingMeal.slot || selectedSlot,
			};
		} else {
			formData = {
				name: '',
				description: '',
				location: '',
				time: '',
				cost: '',
				servings: '',
				assignedTo: '',
				day: selectedDay,
				slot: selectedSlot,
			};
		}
		error = null;
	}
	
	function handleClose() {
		dispatch('close');
	}
	
	function handleOverlayClick(event) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
	
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
	
	function validateForm() {
		error = null;
		
		if (!formData.name || formData.name.trim().length < 2) {
			error = 'Meal name must be at least 2 characters long';
			return false;
		}
		
		if (formData.name.length > 100) {
			error = 'Meal name cannot exceed 100 characters';
			return false;
		}
		
		if (formData.description && formData.description.length > 500) {
			error = 'Description cannot exceed 500 characters';
			return false;
		}
		
		if (formData.location && formData.location.length > 200) {
			error = 'Location cannot exceed 200 characters';
			return false;
		}
		
		if (formData.cost && isNaN(parseFloat(formData.cost))) {
			error = 'Cost must be a valid number';
			return false;
		}
		
		if (formData.servings && (isNaN(parseInt(formData.servings)) || parseInt(formData.servings) < 1)) {
			error = 'Servings must be a positive number';
			return false;
		}
		
		if (!eventDays.includes(formData.day)) {
			error = 'Invalid day selected';
			return false;
		}
		
		if (!mealSlots.includes(formData.slot)) {
			error = 'Invalid meal slot selected';
			return false;
		}
		
		return true;
	}
	
	function handleSubmit() {
		if (!validateForm()) {
			return;
		}
		
		const sanitizedData = {
			name: sanitizeInput(formData.name, 100),
			description: sanitizeInput(formData.description, 500),
			location: sanitizeInput(formData.location, 200),
			time: sanitizeInput(formData.time, 50),
			cost: formData.cost ? parseFloat(formData.cost) : null,
			servings: formData.servings ? parseInt(formData.servings) : null,
			assignedTo: sanitizeInput(formData.assignedTo, 100),
			day: formData.day,
			slot: formData.slot,
		};
		
		dispatch('submit', sanitizedData);
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
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="meal-form-modal" on:click={handleOverlayClick} role="dialog" aria-modal="true">
		<div class="meal-form-content">
			<button 
				class="meal-form-close" 
				on:click={handleClose}
				aria-label="Close"
			>
				<i data-lucide="x"></i>
			</button>
			
			<div class="meal-form-header">
				<h2>{editingMeal ? 'Edit Meal' : 'Add New Meal'}</h2>
				<p>Add details for your meal planning</p>
			</div>

			<form class="meal-form" on:submit|preventDefault={handleSubmit}>
				{#if error}
					<div class="form-error">{error}</div>
				{/if}
				
				<!-- Basic Information -->
				<div class="form-section">
					<h3>Basic Information</h3>
					
					<div class="form-group">
						<label for="mealName">Meal Name *</label>
						<input 
							type="text" 
							id="mealName" 
							bind:value={formData.name}
							placeholder="Enter meal name"
							required 
							maxlength="100"
						/>
					</div>
					
					<div class="form-group">
						<label for="mealDescription">Description</label>
						<textarea 
							id="mealDescription" 
							bind:value={formData.description}
							placeholder="Describe the meal (optional)" 
							rows="3"
							maxlength="500"
						></textarea>
						<small>{formData.description.length}/500 characters</small>
					</div>
				</div>
				
				<!-- Scheduling -->
				<div class="form-section">
					<h3>Scheduling</h3>
					
					<div class="form-row">
						<div class="form-group">
							<label for="mealDay">Day</label>
							<select id="mealDay" bind:value={formData.day} required>
								{#each eventDays as day}
									<option value={day}>{getDayLabel(day)}</option>
								{/each}
							</select>
						</div>
						
						<div class="form-group">
							<label for="mealSlot">Meal Time</label>
							<select id="mealSlot" bind:value={formData.slot} required>
								{#each mealSlots as slot}
									<option value={slot}>{getSlotLabel(slot)}</option>
								{/each}
							</select>
						</div>
					</div>
					
					<div class="form-group">
						<label for="mealTime">Specific Time</label>
						<input 
							type="text" 
							id="mealTime" 
							bind:value={formData.time}
							placeholder="e.g., 7:00 PM, 12:30 PM"
							maxlength="50"
						/>
					</div>
				</div>
				
				<!-- Details -->
				<div class="form-section">
					<h3>Additional Details</h3>
					
					<div class="form-group">
						<label for="mealLocation">Location</label>
						<input 
							type="text" 
							id="mealLocation" 
							bind:value={formData.location}
							placeholder="Restaurant, kitchen, venue, etc."
							maxlength="200"
						/>
					</div>
					
					<div class="form-row">
						<div class="form-group">
							<label for="mealCost">Estimated Cost</label>
							<div class="input-with-prefix">
								<span class="input-prefix">$</span>
								<input 
									type="number" 
									id="mealCost" 
									bind:value={formData.cost}
									placeholder="0.00"
									min="0"
									step="0.01"
								/>
							</div>
						</div>
						
						<div class="form-group">
							<label for="mealServings">Servings</label>
							<input 
								type="number" 
								id="mealServings" 
								bind:value={formData.servings}
								placeholder="Number of people"
								min="1"
								step="1"
							/>
						</div>
					</div>
					
					<div class="form-group">
						<label for="mealAssignee">Assigned To</label>
						<select 
							id="mealAssignee" 
							bind:value={formData.assignedTo}
						>
							<option value="">No one assigned</option>
							{#each Object.entries(members) as [memberId, member]}
								<option value={memberId}>{member.name || member.email}</option>
							{/each}
						</select>
					</div>
				</div>
				
				<div class="form-actions">
					<button 
						type="button" 
						class="btn btn-outline" 
						on:click={handleClose}
						disabled={loading}
					>
						Cancel
					</button>
					
					<button 
						type="submit" 
						class="btn btn-primary" 
						disabled={loading}
					>
						{#if loading}
							{editingMeal ? 'Updating...' : 'Adding...'}
						{:else}
							{editingMeal ? 'Update Meal' : 'Add Meal'}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.meal-form-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.meal-form-content {
		position: relative;
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
	}

	.meal-form-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		color: #6b7280;
		transition: all 0.2s ease;
		z-index: 10;
	}

	.meal-form-close:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.meal-form-header {
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.meal-form-header h2 {
		margin: 0 0 0.5rem 0;
		color: #111827;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.meal-form-header p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.meal-form {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-section h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
		background: white;
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group small {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.input-with-prefix {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-prefix {
		position: absolute;
		left: 0.75rem;
		color: #6b7280;
		font-size: 0.875rem;
		z-index: 1;
		pointer-events: none;
	}

	.input-with-prefix input {
		padding-left: 2rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
		margin-top: auto;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		min-width: 100px;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-outline {
		background: transparent;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-outline:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.meal-form-modal {
			padding: 0.5rem;
		}
		
		.meal-form-content {
			max-height: 95vh;
		}
		
		.meal-form-header,
		.meal-form {
			padding: 1.5rem 1rem;
		}
		
		.form-row {
			grid-template-columns: 1fr;
		}
		
		.form-actions {
			flex-direction: column-reverse;
		}
		
		.btn {
			width: 100%;
		}
	}
</style>