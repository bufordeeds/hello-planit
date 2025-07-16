<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { user } from '$lib/stores/auth.js';
	import { formatDate } from '$lib/utils/formatters.js';
	import { itineraryService } from '$lib/services/itineraryService.js';
	
	const dispatch = createEventDispatcher();
	
	export let eventId;
	export let eventDays = ['day-1', 'day-2'];
	export let canEdit = false;
	export let itineraryData = {};
	
	let error = null;
	let loading = false;
	let savingTimeout = null;
	
	// Reactive variables for form data
	$: daySchedules = eventDays.reduce((acc, day) => {
		acc[day] = itineraryData[`${day}-schedule`] || '';
		return acc;
	}, {});
	
	$: specialNotes = itineraryData.specialNotes || '';
	
	onMount(() => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
	});
	
	onDestroy(() => {
		if (savingTimeout) {
			clearTimeout(savingTimeout);
		}
	});
	
	function handleScheduleChange(day, value) {
		daySchedules[day] = value;
		debouncedSave(`${day}-schedule`, value);
	}
	
	function handleNotesChange(value) {
		specialNotes = value;
		debouncedSave('specialNotes', value);
	}
	
	function debouncedSave(field, value) {
		if (!canEdit) return;
		
		if (savingTimeout) {
			clearTimeout(savingTimeout);
		}
		
		savingTimeout = setTimeout(() => {
			saveItineraryField(field, value);
		}, 1000); // Save after 1 second of no typing
	}
	
	async function saveItineraryField(field, value) {
		if (!canEdit) return;
		
		try {
			error = null;
			
			await itineraryService.updateItineraryField(eventId, field, value);
			
			dispatch('itineraryUpdated', {
				field,
				value
			});
		} catch (err) {
			console.error('Error saving itinerary field:', err);
			error = err.message || 'Failed to save itinerary changes';
		}
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
			'rehearsal-day': 'Rehearsal Day',
		};
		return dayLabels[day] || day.charAt(0).toUpperCase() + day.slice(1);
	}
	
	function getDayPlaceholder(day) {
		const placeholders = {
			'friday': "Friday's schedule: When are we meeting? Where? What activities? Transportation plans...",
			'saturday': "Saturday's schedule: Activities? Celebration plans? What time? Where?",
			'sunday': "Sunday's schedule: Check-out time? Departure plans? Final activities? Travel arrangements?",
			'party-day': "Party schedule: Setup time? Activities? Entertainment? Timeline?",
			'wedding-day': "Wedding day schedule: Ceremony time? Reception details? Transportation?",
			'rehearsal-day': "Rehearsal schedule: Rehearsal time? Dinner plans? Final preparations?",
		};
		return placeholders[day] || `${getDayLabel(day)} schedule: Activities, timing, locations, and plans...`;
	}
</script>

<div class="itinerary-planner">
	<div class="itinerary-header">
		<div class="header-content">
			<div class="header-info">
				<h2>Itinerary</h2>
				<p class="header-description">Plan your daily schedule and activities</p>
			</div>
		</div>
		
		{#if error}
			<div class="error-message">
				<i data-lucide="alert-circle"></i>
				{error}
			</div>
		{/if}
	</div>
	
	<!-- Daily Schedule Section -->
	<div class="itinerary-section">
		<h3>Daily Schedule</h3>
		
		{#each eventDays as day}
			<div class="day-schedule">
				<h4>{getDayLabel(day)}</h4>
				<textarea
					class="schedule-input"
					placeholder={getDayPlaceholder(day)}
					value={daySchedules[day]}
					disabled={!canEdit}
					on:input={(e) => handleScheduleChange(day, e.target.value)}
				></textarea>
			</div>
		{/each}
	</div>
	
	<!-- Special Notes Section -->
	<div class="special-notes">
		<h3>Special Notes & Dietary Restrictions</h3>
		<textarea
			class="notes-textarea"
			placeholder="Add any special notes, dietary restrictions, allergies, or preferences here..."
			value={specialNotes}
			disabled={!canEdit}
			on:input={(e) => handleNotesChange(e.target.value)}
		></textarea>
	</div>
	
	{#if !canEdit}
		<div class="read-only-notice">
			<i data-lucide="lock"></i>
			<span>You don't have permission to edit the itinerary</span>
		</div>
	{/if}
</div>

<style>
	.itinerary-planner {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.itinerary-header {
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
		margin: 0 0 0.25rem 0;
	}
	
	.header-description {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
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
	
	.itinerary-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
	}
	
	.itinerary-section h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1.5rem 0;
	}
	
	.day-schedule {
		margin-bottom: 1.5rem;
	}
	
	.day-schedule:last-child {
		margin-bottom: 0;
	}
	
	.day-schedule h4 {
		font-size: 1rem;
		font-weight: 600;
		color: #374151;
		margin: 0 0 0.75rem 0;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid #e5e7eb;
	}
	
	.schedule-input {
		width: 100%;
		min-height: 120px;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
		font-size: 0.875rem;
		font-family: inherit;
		line-height: 1.5;
		resize: vertical;
		transition: border-color 0.3s ease;
		background: white;
	}
	
	.schedule-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.schedule-input:disabled {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
	}
	
	.special-notes {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
	}
	
	.special-notes h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
	}
	
	.notes-textarea {
		width: 100%;
		min-height: 100px;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
		font-size: 0.875rem;
		font-family: inherit;
		line-height: 1.5;
		resize: vertical;
		transition: border-color 0.3s ease;
		background: white;
	}
	
	.notes-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.notes-textarea:disabled {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
	}
	
	.read-only-notice {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #f3f4f6;
		border: 1px solid #d1d5db;
		color: #6b7280;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
	}
	
	.read-only-notice i {
		width: 16px;
		height: 16px;
	}
	
	/* Mobile responsive */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: stretch;
		}
		
		.schedule-input,
		.notes-textarea {
			min-height: 80px;
		}
	}
</style>