<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { eventService } from '$lib/stores/events.js';
	import { validateEvent, sanitizeInput } from '$lib/utils/validation.js';
	import { getTemplate, getTemplateOptions } from '$lib/utils/eventTemplates.js';
	
	const dispatch = createEventDispatcher();
	
	export let isOpen = false;
	
	let currentStep = 1;
	const totalSteps = 4;
	let isLoading = false;
	let error = null;
	
	let eventData = {
		name: '',
		description: '',
		dates: '',
		startDate: '',
		endDate: '',
		location: '',
		type: 'general',
		privacy: 'private',
		allowEditing: true,
		requireApproval: false,
		template: 'general',
	};
	
	// Reset form when modal opens
	$: if (isOpen) {
		currentStep = 1;
		error = null;
		eventData = {
			name: '',
			description: '',
			dates: '',
			startDate: '',
			endDate: '',
			location: '',
			type: 'general',
			privacy: 'private',
			allowEditing: true,
			requireApproval: false,
			template: 'general',
		};
	}
	
	onMount(() => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
	});
	
	function handleClose() {
		isOpen = false;
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
	
	function updateEventData(field, value) {
		if (typeof value === 'string') {
			eventData[field] = sanitizeInput(value);
		} else {
			eventData[field] = value;
		}
		eventData = { ...eventData };
	}
	
	// Convert date picker values to dates string
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
	
	// Update dates string when date picker values change
	$: if (eventData.startDate || eventData.endDate) {
		eventData.dates = formatDateRange(eventData.startDate, eventData.endDate);
	}
	
	function applyTemplateDefaults() {
		const template = getTemplate(eventData.template);
		
		// Apply default settings
		eventData.privacy = template.defaultSettings.privacy;
		eventData.allowEditing = template.defaultSettings.allowEditing;
		eventData.requireApproval = template.defaultSettings.requireApproval;
		eventData.type = eventData.template;
		
		eventData = { ...eventData };
	}
	
	function validateCurrentStep() {
		error = null;
		
		if (currentStep === 2) {
			// Validate basic information
			if (!eventData.name || eventData.name.trim().length < 2) {
				error = 'Event name must be at least 2 characters long';
				return false;
			}
			
			if (!eventData.startDate) {
				error = 'Please select a start date for your event';
				return false;
			}
			
			// Validate that end date is not before start date
			if (eventData.endDate && eventData.startDate && eventData.endDate < eventData.startDate) {
				error = 'End date cannot be before start date';
				return false;
			}
		}
		
		return true;
	}
	
	function nextStep() {
		if (!validateCurrentStep()) {
			return;
		}
		
		if (currentStep === totalSteps) {
			createEvent();
		} else {
			currentStep++;
		}
	}
	
	function previousStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}
	
	async function createEvent() {
		if (!validateCurrentStep()) {
			return;
		}
		
		try {
			isLoading = true;
			error = null;
			
			// Get template for additional settings
			const template = getTemplate(eventData.template);
			
			// Prepare event data
			const finalEventData = {
				...eventData,
				features: template.defaultSettings.features,
			};
			
			// Create the event
			const result = await eventService.createEvent(finalEventData);
			
			// Success
			handleClose();
			dispatch('success', result);
		} catch (err) {
			console.error('Event creation error:', err);
			error = err.message || 'Failed to create event';
		} finally {
			isLoading = false;
		}
	}
	
	function focusFirstInput() {
		if (typeof window !== 'undefined') {
			setTimeout(() => {
				const firstInput = document.querySelector(`.wizard-step[data-step="${currentStep}"] input:not([type="hidden"]), .wizard-step[data-step="${currentStep}"] textarea`);
				if (firstInput) {
					firstInput.focus();
				}
			}, 100);
		}
	}
	
	// Focus first input when step changes
	$: if (currentStep) {
		focusFirstInput();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="event-wizard-modal" on:click={handleOverlayClick} role="dialog" aria-modal="true">
		<div class="event-wizard-content">
			<button 
				class="event-wizard-close" 
				on:click={handleClose}
				aria-label="Close"
			>
				<i data-lucide="x"></i>
			</button>
			
			<div class="event-wizard-header">
				<h2>🚀 Launch New Mission</h2>
				<div class="step-indicator">
					<div class="step-progress">
						<div class="progress-bar" style="width: {(currentStep / totalSteps) * 100}%"></div>
					</div>
					<span class="step-text">Step {currentStep} of {totalSteps}</span>
				</div>
			</div>

			<div class="event-wizard-body">
				{#if error}
					<div class="wizard-error">{error}</div>
				{/if}
				
				<!-- Step 1: Template Selection -->
				{#if currentStep === 1}
					<div class="wizard-step" data-step="1">
						<h3>Choose Mission Type</h3>
						<p>Select a mission template to get started with pre-configured settings</p>
						
						<div class="template-grid">
							{#each getTemplateOptions() as template}
								<label class="template-card" class:selected={eventData.template === template.value}>
									<input 
										type="radio" 
										bind:group={eventData.template} 
										value={template.value}
										on:change={applyTemplateDefaults}
									/>
									<div class="template-icon">{template.icon}</div>
									<div class="template-info">
										<h4>{template.label}</h4>
										<p>{template.description}</p>
									</div>
								</label>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Step 2: Basic Information -->
				{#if currentStep === 2}
					<div class="wizard-step" data-step="2">
						<h3>Mission Details</h3>
						<p>Tell us about your mission</p>
						
						<div class="form-group">
							<label for="eventName">Mission Name *</label>
							<input 
								type="text" 
								id="eventName" 
								bind:value={eventData.name}
								placeholder="Enter mission name"
								required 
							/>
						</div>
						
						<div class="form-group">
							<label for="eventDates">Mission Dates *</label>
							<div class="date-picker-group">
								<div class="date-input">
									<label for="startDate">Start Date</label>
									<input 
										type="date" 
										id="startDate" 
										bind:value={eventData.startDate}
										required 
										min={new Date().toISOString().split('T')[0]}
									/>
								</div>
								<div class="date-input">
									<label for="endDate">End Date</label>
									<input 
										type="date" 
										id="endDate" 
										bind:value={eventData.endDate}
										min={eventData.startDate || new Date().toISOString().split('T')[0]}
									/>
								</div>
							</div>
							<small>Select start and end dates for your event (leave end date empty for single-day events)</small>
						</div>
						
						<div class="form-group">
							<label for="eventLocation">Location</label>
							<input 
								type="text" 
								id="eventLocation" 
								bind:value={eventData.location}
								placeholder="Enter event location"
							/>
						</div>
						
						<div class="form-group">
							<label for="eventDescription">Description</label>
							<textarea 
								id="eventDescription" 
								bind:value={eventData.description}
								placeholder="Describe your event (optional)" 
								rows="3"
							></textarea>
						</div>
					</div>
				{/if}

				<!-- Step 3: Privacy & Settings -->
				{#if currentStep === 3}
					<div class="wizard-step" data-step="3">
						<h3>Mission Security & Access</h3>
						<p>Configure mission security and crew permissions</p>
						
						<div class="settings-section">
							<h4>🔒 Mission Security Level</h4>
							<div class="settings-grid">
								<label class="setting-card" class:selected={eventData.privacy === 'private'}>
									<input type="radio" bind:group={eventData.privacy} value="private" />
									<div class="setting-icon">🔐</div>
									<div class="setting-info">
										<h5>Classified Mission</h5>
										<p>Only invited crew members can access this mission</p>
									</div>
								</label>
								
								<label class="setting-card" class:selected={eventData.privacy === 'invite-only'}>
									<input type="radio" bind:group={eventData.privacy} value="invite-only" />
									<div class="setting-icon">🛡️</div>
									<div class="setting-info">
										<h5>Restricted Access</h5>
										<p>Crew can request access, but requires commander approval</p>
									</div>
								</label>
								
								<label class="setting-card" class:selected={eventData.privacy === 'public'}>
									<input type="radio" bind:group={eventData.privacy} value="public" />
									<div class="setting-icon">🌍</div>
									<div class="setting-info">
										<h5>Open Mission</h5>
										<p>Anyone can discover and view this mission</p>
									</div>
								</label>
							</div>
						</div>
						
						<div class="settings-section">
							<h4>⚙️ Crew Permissions</h4>
							<div class="settings-grid">
								<label class="setting-card checkbox-card" class:selected={eventData.allowEditing}>
									<input type="checkbox" bind:checked={eventData.allowEditing} />
									<div class="setting-icon">✏️</div>
									<div class="setting-info">
										<h5>Allow Crew Edits</h5>
										<p>Crew members can modify mission plans, resources, and timeline</p>
									</div>
								</label>
								
								<label class="setting-card checkbox-card" class:selected={eventData.requireApproval}>
									<input type="checkbox" bind:checked={eventData.requireApproval} />
									<div class="setting-icon">✅</div>
									<div class="setting-info">
										<h5>Commander Approval</h5>
										<p>All changes require mission commander approval before activation</p>
									</div>
								</label>
							</div>
						</div>
					</div>
				{/if}

				<!-- Step 4: Review & Create -->
				{#if currentStep === 4}
					<div class="wizard-step" data-step="4">
						<h3>Mission Briefing Review</h3>
						<p>Review your mission parameters before launch</p>
						
						<div class="event-review">
							<div class="review-section">
								<h4>🚀 Mission Parameters</h4>
								<div class="review-item">
									<span class="review-label">Mission Name:</span>
									<span class="review-value">{eventData.name}</span>
								</div>
								<div class="review-item">
									<span class="review-label">Mission Dates:</span>
									<span class="review-value">{eventData.dates}</span>
								</div>
								<div class="review-item">
									<span class="review-label">Mission Location:</span>
									<span class="review-value">{eventData.location || 'Location TBD'}</span>
								</div>
								<div class="review-item">
									<span class="review-label">Mission Type:</span>
									<span class="review-value">{getTemplateOptions().find(t => t.value === eventData.template)?.label}</span>
								</div>
							</div>
							
							<div class="review-section">
								<h4>🔒 Security & Permissions</h4>
								<div class="review-item">
									<span class="review-label">Security Level:</span>
									<span class="review-value">{eventData.privacy.charAt(0).toUpperCase() + eventData.privacy.slice(1)}</span>
								</div>
								<div class="review-item">
									<span class="review-label">Crew Editing:</span>
									<span class="review-value">{eventData.allowEditing ? 'Crew can modify plans' : 'Commander only'}</span>
								</div>
								<div class="review-item">
									<span class="review-label">Change Approval:</span>
									<span class="review-value">{eventData.requireApproval ? 'Commander approval required' : 'Direct changes allowed'}</span>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="event-wizard-footer">
				<button 
					class="btn btn-outline" 
					on:click={previousStep}
					style="visibility: {currentStep === 1 ? 'hidden' : 'visible'}"
					disabled={isLoading}
				>
					Previous
				</button>
				
				<button 
					class="btn btn-primary" 
					on:click={nextStep}
					disabled={isLoading}
				>
					{#if isLoading}
						Creating...
					{:else}
						{currentStep === totalSteps ? 'Create Event' : 'Next'}
					{/if}
				</button>
				
				<button 
					class="btn btn-outline" 
					on:click={handleClose}
					disabled={isLoading}
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Event Creation Wizard Styles */
	.event-wizard-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(11, 20, 38, 0.9);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.event-wizard-content {
		position: relative;
		background: rgba(248, 249, 255, 0.1);
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 12px;
		width: 90%;
		max-width: 600px;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 8px 32px 0 rgba(0, 212, 255, 0.37);
		display: flex;
		flex-direction: column;
	}

	.event-wizard-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(248, 249, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		color: #E1E5F2;
		transition: all 0.2s ease;
		z-index: 10;
		backdrop-filter: blur(10px);
	}

	.event-wizard-close:hover {
		background: rgba(0, 212, 255, 0.2);
		color: #00D4FF;
		border-color: rgba(0, 212, 255, 0.5);
	}

	.event-wizard-header {
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	.event-wizard-header h2 {
		margin: 0 0 1rem 0;
		color: #F8F9FF;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.step-indicator {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.step-progress {
		flex: 1;
		height: 4px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: linear-gradient(90deg, #00D4FF 0%, #7209B7 100%);
		transition: width 0.3s ease;
		box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
	}

	.step-text {
		font-size: 0.875rem;
		color: #E1E5F2;
		white-space: nowrap;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.event-wizard-body {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
	}

	.wizard-step h3 {
		margin: 0 0 0.5rem 0;
		color: #F8F9FF;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.wizard-step p {
		margin: 0 0 2rem 0;
		color: #E1E5F2;
		font-size: 0.875rem;
	}

	.wizard-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	/* Template Grid */
	.template-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}

	.template-card {
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		background: rgba(248, 249, 255, 0.05);
		backdrop-filter: blur(10px);
	}

	.template-card:hover {
		border-color: rgba(0, 212, 255, 0.4);
		box-shadow: 0 8px 25px -3px rgba(0, 212, 255, 0.2);
		background: rgba(248, 249, 255, 0.1);
	}

	.template-card.selected {
		border-color: #00D4FF;
		background: rgba(0, 212, 255, 0.15);
		box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
	}

	.template-card input[type="radio"] {
		display: none;
	}

	.template-icon {
		font-size: 2rem;
		line-height: 1;
	}

	.template-info h4 {
		margin: 0 0 0.5rem 0;
		color: #F8F9FF;
		font-size: 1rem;
		font-weight: 600;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.template-info p {
		margin: 0;
		color: #E1E5F2;
		font-size: 0.875rem;
		line-height: 1.4;
		opacity: 0.9;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Settings Step Styling */
	.settings-section {
		margin-bottom: 2.5rem;
	}

	.settings-section h4 {
		color: #F8F9FF;
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: 1rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1rem;
	}

	/* Single column for checkbox cards on smaller screens */
	@media (max-width: 768px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}
	}

	.setting-card {
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		background: rgba(248, 249, 255, 0.05);
		backdrop-filter: blur(10px);
	}

	.setting-card:hover {
		border-color: rgba(0, 212, 255, 0.4);
		box-shadow: 0 8px 25px -3px rgba(0, 212, 255, 0.2);
		background: rgba(248, 249, 255, 0.1);
	}

	.setting-card.selected {
		border-color: #00D4FF;
		background: rgba(0, 212, 255, 0.15);
		box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
	}

	.setting-card input[type="radio"],
	.setting-card input[type="checkbox"] {
		display: none;
	}

	.setting-icon {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.setting-info h5 {
		margin: 0 0 0.5rem 0;
		color: #F8F9FF;
		font-size: 1rem;
		font-weight: 600;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.setting-info p {
		margin: 0;
		color: #E1E5F2;
		font-size: 0.875rem;
		line-height: 1.4;
		opacity: 0.9;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Form styles */
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #E1E5F2;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.form-group input,
	.form-group textarea {
		padding: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
		background: rgba(248, 249, 255, 0.1);
		color: #F8F9FF;
		backdrop-filter: blur(10px);
	}

	.form-group input::placeholder,
	.form-group textarea::placeholder {
		color: rgba(225, 229, 242, 0.6);
		opacity: 1;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #00D4FF;
		box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.3);
		background: rgba(248, 249, 255, 0.15);
	}

	.form-group small {
		font-size: 0.75rem;
		color: #E1E5F2;
		opacity: 0.8;
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

	/* Radio and Checkbox Groups */
	.radio-group,
	.checkbox-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.radio-label,
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

	.radio-label:hover,
	.checkbox-label:hover {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	.radio-custom,
	.checkbox-custom {
		width: 20px;
		height: 20px;
		border: 2px solid #d1d5db;
		border-radius: 50%;
		position: relative;
		transition: all 0.2s ease;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.checkbox-custom {
		border-radius: 4px;
	}

	.radio-label input[type="radio"]:checked + .radio-custom,
	.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
		border-color: #3b82f6;
		background: #3b82f6;
	}

	.radio-custom::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(0);
		width: 8px;
		height: 8px;
		background: white;
		border-radius: 50%;
		transition: transform 0.2s ease;
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

	.radio-label input[type="radio"]:checked + .radio-custom::after,
	.checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
		transform: translate(-50%, -50%) scale(1);
	}

	.radio-label input[type="radio"],
	.checkbox-label input[type="checkbox"] {
		display: none;
	}

	.radio-content,
	.checkbox-content {
		flex: 1;
	}

	.radio-content strong,
	.checkbox-content strong {
		display: block;
		color: #111827;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.radio-content small,
	.checkbox-content small {
		display: block;
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.4;
	}

	/* Review Section */
	.event-review {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.review-section {
		background: rgba(248, 249, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		backdrop-filter: blur(10px);
	}

	.review-section h4 {
		margin: 0 0 1rem 0;
		color: #F8F9FF;
		font-size: 1.125rem;
		font-weight: 600;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		padding-bottom: 0.5rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.review-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.review-item:last-child {
		border-bottom: none;
	}

	.review-label {
		font-weight: 500;
		color: #E1E5F2;
		min-width: 120px;
		opacity: 0.8;
	}

	.review-value {
		color: #F8F9FF;
		text-align: right;
		flex: 1;
		font-weight: 500;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	/* Wizard Footer */
	.event-wizard-footer {
		padding: 1.5rem 2rem;
		border-top: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.btn {
		padding: 0.5rem 1rem;
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
		background: rgba(248, 249, 255, 0.1);
		color: #E1E5F2;
		border: 1px solid rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(10px);
	}

	.btn-outline:hover:not(:disabled) {
		background: rgba(248, 249, 255, 0.2);
		border-color: rgba(0, 212, 255, 0.5);
		color: #00D4FF;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.event-wizard-content {
			width: 95%;
			max-height: 95vh;
		}
		
		.event-wizard-header,
		.event-wizard-body,
		.event-wizard-footer {
			padding: 1rem;
		}
		
		.template-grid {
			grid-template-columns: 1fr;
		}
		
		.template-card {
			padding: 1rem;
		}
		
		.date-picker-group {
			grid-template-columns: 1fr;
		}
		
		.step-indicator {
			flex-direction: column;
			gap: 0.5rem;
			align-items: stretch;
		}
		
		.event-wizard-footer {
			flex-direction: column-reverse;
			gap: 0.75rem;
		}
		
		.event-wizard-footer .btn {
			width: 100%;
		}
		
		.review-item {
			flex-direction: column;
			gap: 0.25rem;
		}
		
		.review-value {
			text-align: left;
		}
	}
</style>