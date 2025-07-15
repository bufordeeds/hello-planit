<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { eventService } from '$lib/stores/events.js';
	import { sanitizeInput } from '$lib/utils/validation.js';
	
	const dispatch = createEventDispatcher();
	
	export let isOpen = false;
	export let event = null;
	export let loading = false;
	
	let formData = {
		name: '',
		description: '',
		startDate: '',
		endDate: '',
		location: '',
		privacy: 'private',
		allowEditing: true,
		requireApproval: false,
	};
	
	let error = null;
	
	// Reset form when modal opens or event changes
	$: if (isOpen && event) {
		resetForm();
	}
	
	onMount(() => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
	});
	
	function resetForm() {
		if (event) {
			// Parse existing dates if they exist
			const dates = event.metadata?.dates || '';
			let startDate = '';
			let endDate = '';
			
			if (dates.includes(' - ')) {
				const [start, end] = dates.split(' - ');
				startDate = convertToDateInput(start);
				endDate = convertToDateInput(end);
			} else if (dates) {
				startDate = convertToDateInput(dates);
			}
			
			formData = {
				name: event.metadata?.name || '',
				description: event.metadata?.description || '',
				startDate,
				endDate,
				location: event.metadata?.location || '',
				privacy: event.settings?.privacy || 'private',
				allowEditing: event.settings?.allowEditing ?? true,
				requireApproval: event.settings?.requireApproval ?? false,
			};
		}
		error = null;
	}
	
	function convertToDateInput(dateString) {
		try {
			const date = new Date(dateString);
			if (!isNaN(date.getTime())) {
				return date.toISOString().split('T')[0];
			}
		} catch (e) {
			console.warn('Could not parse date:', dateString);
		}
		return '';
	}
	
	function formatDateRange(startDate, endDate) {
		if (!startDate) return '';
		
		const start = new Date(startDate);
		const end = endDate ? new Date(endDate) : null;
		
		const formatDate = (date) => {
			return date.toLocaleDateString('en-US', { 
				year: 'numeric', 
				month: 'long', 
				day: 'numeric' 
			});
		};
		
		if (end && start.getTime() !== end.getTime()) {
			return `${formatDate(start)} - ${formatDate(end)}`;
		} else {
			return formatDate(start);
		}
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
			error = 'Event name must be at least 2 characters long';
			return false;
		}
		
		if (!formData.startDate) {
			error = 'Please select a start date for your event';
			return false;
		}
		
		if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
			error = 'End date cannot be before start date';
			return false;
		}
		
		return true;
	}
	
	async function handleSubmit() {
		if (!validateForm()) {
			return;
		}
		
		const updates = {
			name: sanitizeInput(formData.name, 100),
			description: sanitizeInput(formData.description, 500),
			dates: formatDateRange(formData.startDate, formData.endDate),
			location: sanitizeInput(formData.location, 200),
		};
		
		const settingsUpdates = {
			privacy: formData.privacy,
			allowEditing: formData.allowEditing,
			requireApproval: formData.requireApproval,
		};
		
		dispatch('save', { 
			eventId: event.id, 
			updates, 
			settingsUpdates 
		});
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="edit-modal" on:click={handleOverlayClick} role="dialog" aria-modal="true">
		<div class="edit-modal-content">
			<button 
				class="edit-modal-close" 
				on:click={handleClose}
				aria-label="Close"
			>
				<i data-lucide="x"></i>
			</button>
			
			<div class="edit-modal-header">
				<h2>Edit Event</h2>
				<p>Update your event details</p>
			</div>

			<form class="edit-form" on:submit|preventDefault={handleSubmit}>
				{#if error}
					<div class="form-error">{error}</div>
				{/if}
				
				<div class="form-group">
					<label for="editEventName">Event Name *</label>
					<input 
						type="text" 
						id="editEventName" 
						bind:value={formData.name}
						placeholder="Enter event name"
						required 
						maxlength="100"
					/>
				</div>
				
				<div class="form-group">
					<label for="editEventDescription">Description</label>
					<textarea 
						id="editEventDescription" 
						bind:value={formData.description}
						placeholder="Describe your event (optional)" 
						rows="3"
						maxlength="500"
					></textarea>
				</div>
				
				<div class="form-group">
					<label>Event Dates *</label>
					<div class="date-picker-group">
						<div class="date-input">
							<label for="editStartDate">Start Date</label>
							<input 
								type="date" 
								id="editStartDate" 
								bind:value={formData.startDate}
								required 
							/>
						</div>
						<div class="date-input">
							<label for="editEndDate">End Date</label>
							<input 
								type="date" 
								id="editEndDate" 
								bind:value={formData.endDate}
								min={formData.startDate}
							/>
						</div>
					</div>
				</div>
				
				<div class="form-group">
					<label for="editEventLocation">Location</label>
					<input 
						type="text" 
						id="editEventLocation" 
						bind:value={formData.location}
						placeholder="Enter event location"
						maxlength="200"
					/>
				</div>
				
				<div class="form-group">
					<label for="editEventPrivacy">Privacy Setting</label>
					<select id="editEventPrivacy" bind:value={formData.privacy}>
						<option value="private">Private</option>
						<option value="invite-only">Invite Only</option>
						<option value="public">Public</option>
					</select>
				</div>
				
				<div class="form-group">
					<label class="checkbox-label">
						<input 
							type="checkbox" 
							bind:checked={formData.allowEditing}
						/>
						<span class="checkbox-custom"></span>
						<div class="checkbox-content">
							<strong>Allow members to edit</strong>
							<small>Members can add/edit meals, expenses, and itinerary items</small>
						</div>
					</label>
				</div>
				
				<div class="form-group">
					<label class="checkbox-label">
						<input 
							type="checkbox" 
							bind:checked={formData.requireApproval}
						/>
						<span class="checkbox-custom"></span>
						<div class="checkbox-content">
							<strong>Require approval for changes</strong>
							<small>You must approve all edits before they're visible</small>
						</div>
					</label>
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
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.edit-modal {
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

	.edit-modal-content {
		position: relative;
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
	}

	.edit-modal-close {
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

	.edit-modal-close:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.edit-modal-header {
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.edit-modal-header h2 {
		margin: 0 0 0.5rem 0;
		color: #111827;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.edit-modal-header p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.edit-form {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
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

	.date-picker-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.date-input {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.date-input label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
	}

	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.checkbox-label:hover {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	.checkbox-custom {
		width: 20px;
		height: 20px;
		border: 2px solid #d1d5db;
		border-radius: 4px;
		position: relative;
		transition: all 0.2s ease;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
		border-color: #3b82f6;
		background: #3b82f6;
	}

	.checkbox-custom::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(0);
		color: white;
		font-size: 12px;
		font-weight: bold;
		transition: transform 0.2s ease;
	}

	.checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
		transform: translate(-50%, -50%) scale(1);
	}

	.checkbox-label input[type="checkbox"] {
		display: none;
	}

	.checkbox-content {
		flex: 1;
	}

	.checkbox-content strong {
		display: block;
		color: #111827;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.checkbox-content small {
		display: block;
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.4;
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
		.edit-modal {
			padding: 0.5rem;
		}
		
		.edit-modal-content {
			max-height: 95vh;
		}
		
		.edit-modal-header,
		.edit-form {
			padding: 1.5rem 1rem;
		}
		
		.date-picker-group {
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