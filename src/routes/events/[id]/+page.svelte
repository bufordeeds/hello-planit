<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user, isAuthenticated, loading as authLoading } from '$lib/stores/auth.js';
	import { eventService, currentEvent, eventsError } from '$lib/stores/events.js';
	import { itineraryService } from '$lib/services/itineraryService.js';
	import { formatDate } from '$lib/utils/formatters.js';
	import EventEditModal from '$lib/components/events/EventEditModal.svelte';
	import ShareModal from '$lib/components/events/ShareModal.svelte';
	import MealPlanner from '$lib/components/meals/MealPlanner.svelte';
	import ExpenseTracker from '$lib/components/expenses/ExpenseTracker.svelte';
	import ItineraryPlanner from '$lib/components/itinerary/ItineraryPlanner.svelte';
	import GuestManager from '$lib/components/guests/GuestManager.svelte';

	let eventId = '';
	let event = null;
	let loading = true;
	let error = null;
	let unsubscribe = null;
	let itineraryUnsubscribe = null;
	
	// Modal states
	let showEditModal = false;
	let showShareModal = false;
	let editLoading = false;
	
	// Tab state
	let activeTab = 'itinerary';

	// Get event ID from URL params
	$: eventId = $page.params.id;

	// Redirect unauthenticated users to sign up/login with return URL
	$: if (typeof window !== 'undefined' && !$isAuthenticated && !$authLoading) {
		// Store the current URL so we can redirect back after authentication
		const currentUrl = window.location.pathname;
		sessionStorage.setItem('redirectAfterAuth', currentUrl);
		goto('/?message=sign-in-required');
	}

	// Reactively load event when user authentication changes
	$: if ($user && eventId && !$authLoading) {
		loadEvent();
	}

	onMount(async () => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
		if (itineraryUnsubscribe) {
			itineraryUnsubscribe();
		}
	});

	async function loadEvent() {
		try {
			loading = true;
			error = null;
			
			// Subscribe to real-time updates
			unsubscribe = eventService.subscribeToEvent(eventId, (eventData) => {
				event = eventData;
				loading = false;
				
				if (!eventData) {
					error = 'Event not found or you do not have access to it.';
				}
			});
			
			// Subscribe to itinerary updates
			itineraryUnsubscribe = itineraryService.subscribeToItinerary(eventId, (itineraryData) => {
				if (event) {
					event = { ...event, itinerary: itineraryData };
				}
			});
		} catch (err) {
			console.error('Error loading event:', err);
			error = err.message || 'Failed to load event';
			loading = false;
		}
	}

	function handleBackToDashboard() {
		goto('/dashboard');
	}

	function handleEditEvent() {
		showEditModal = true;
	}

	function handleShareEvent() {
		showShareModal = true;
	}

	async function handleDeleteEvent() {
		if (!confirm(`Are you sure you want to delete "${event?.metadata?.name}"? This action cannot be undone.`)) {
			return;
		}
		
		try {
			loading = true;
			await eventService.deleteEvent(eventId);
			goto('/dashboard');
		} catch (err) {
			error = err.message || 'Failed to delete event';
		} finally {
			loading = false;
		}
	}

	function switchTab(tabName) {
		activeTab = tabName;
	}

	function getDaysFromEvent(event) {
		if (!event) return ['day-1', 'day-2'];
		
		// Generate days based on event type or use defaults
		const eventType = event.metadata?.type || 'general';
		
		// For weekend events, use Fri/Sat/Sun
		if (eventType === 'birthday' || eventType === 'weekend' || eventType === 'vacation') {
			return ['friday', 'saturday', 'sunday'];
		}
		
		// For party events, use party day
		if (eventType === 'party') {
			return ['party-day'];
		}
		
		// For wedding events, use wedding day plus additional days
		if (eventType === 'wedding') {
			return ['rehearsal-day', 'wedding-day'];
		}
		
		// Default to 2-day event
		return ['day-1', 'day-2'];
	}

	function getMealSlotsFromEvent(event) {
		if (!event) return ['breakfast', 'lunch', 'dinner'];
		
		const eventType = event.metadata?.type || 'general';
		
		// For business events, focus on business meals
		if (eventType === 'business') {
			return ['lunch', 'dinner'];
		}
		
		// For party events, focus on party food
		if (eventType === 'party') {
			return ['appetizers', 'main', 'dessert'];
		}
		
		// For wedding events, include special wedding meals
		if (eventType === 'wedding') {
			return ['brunch', 'cocktail', 'dinner', 'cake'];
		}
		
		// Default to standard meals
		return ['breakfast', 'lunch', 'dinner'];
	}

	function canUserEdit() {
		if (!event || !$user) return false;
		
		const member = event.members?.[$user.uid];
		if (!member) return false;
		
		// Check if user has write permissions
		return member.permissions?.includes('write') || member.role === 'owner';
	}
	
	async function handleEditSave(eventData) {
		try {
			editLoading = true;
			const { eventId: id, updates, settingsUpdates } = eventData.detail;
			
			// Update event metadata
			await eventService.updateEvent(id, updates);
			
			// Update event settings if provided
			if (settingsUpdates) {
				await eventService.updateEventSettings(id, settingsUpdates);
			}
			
			showEditModal = false;
			
			// Refresh event data
			await loadEvent();
		} catch (err) {
			error = err.message || 'Failed to update event';
		} finally {
			editLoading = false;
		}
	}
	
	function handleEditClose() {
		showEditModal = false;
	}
	
	function handleShareClose() {
		showShareModal = false;
	}

	function getUserRole() {
		if (!event || !$user) return null;
		const member = event.members && event.members[$user.uid];
		return member ? member.role : null;
	}

	function canEdit() {
		const role = getUserRole();
		return role === 'owner' || role === 'admin' || (role === 'editor' && event?.settings?.allowEditing);
	}

	function canDelete() {
		const role = getUserRole();
		return role === 'owner';
	}

	function canInvite() {
		const role = getUserRole();
		return role === 'owner' || role === 'admin';
	}
</script>

<svelte:head>
	<title>{event ? event.metadata.name : 'Event'} - Planit</title>
	<meta name="description" content={event ? `Event details for ${event.metadata.name}` : 'Event details'} />
</svelte:head>

<div class="event-page">
	{#if loading || $authLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>{$authLoading ? 'Checking authentication...' : 'Loading event...'}</p>
		</div>
	{:else if error}
		<div class="error-state">
			<div class="error-icon">
				<i data-lucide="alert-circle"></i>
			</div>
			<h2>Event Not Found</h2>
			<p>{error}</p>
			<button class="btn btn-primary" on:click={handleBackToDashboard}>
				<i data-lucide="arrow-left"></i>
				Back to Dashboard
			</button>
		</div>
	{:else if event}
		<!-- Event Header -->
		<div class="event-header">
			<div class="header-top">
				<button class="btn-back" on:click={handleBackToDashboard}>
					<i data-lucide="arrow-left"></i>
					Back to Dashboard
				</button>
				
				<div class="header-actions">
					{#if canEdit()}
						<button class="btn btn-outline" on:click={handleEditEvent}>
							<i data-lucide="edit-3"></i>
							Edit
						</button>
					{/if}
					
					<button class="btn btn-outline" on:click={handleShareEvent}>
						<i data-lucide="share-2"></i>
						Share
					</button>
					
					{#if canDelete()}
						<button class="btn btn-danger" on:click={handleDeleteEvent}>
							<i data-lucide="trash-2"></i>
							Delete
						</button>
					{/if}
				</div>
			</div>
			
			<div class="header-content">
				<div class="event-info">
					<h1>{event.metadata.name}</h1>
					
					<div class="event-meta">
						{#if event.metadata.dates}
							<div class="meta-item">
								<i data-lucide="calendar"></i>
								<span>{event.metadata.dates}</span>
							</div>
						{/if}
						
						{#if event.metadata.location}
							<div class="meta-item">
								<i data-lucide="map-pin"></i>
								<span>{event.metadata.location}</span>
							</div>
						{/if}
						
						<div class="meta-item">
							<i data-lucide="users"></i>
							<span>{Object.keys(event.members || {}).length} guest{Object.keys(event.members || {}).length !== 1 ? 's' : ''}</span>
						</div>
						
						<div class="meta-item">
							<i data-lucide="user"></i>
							<span>You are the {getUserRole()}</span>
						</div>
					</div>
					
					{#if event.metadata.description}
						<p class="event-description">{event.metadata.description}</p>
					{/if}
				</div>
				
				<div class="event-badge">
					<span class="badge badge-primary">{event.metadata.type || 'general'}</span>
				</div>
			</div>
		</div>

		<!-- Event Navigation -->
		<div class="event-nav">
			<nav class="nav-tabs">
				<button 
					class="nav-tab" 
					class:active={activeTab === 'itinerary'}
					on:click={() => switchTab('itinerary')}
				>
					<i data-lucide="calendar"></i>
					Itinerary
				</button>
				<button 
					class="nav-tab" 
					class:active={activeTab === 'meals'}
					on:click={() => switchTab('meals')}
				>
					<i data-lucide="utensils"></i>
					Meals
				</button>
				<button 
					class="nav-tab" 
					class:active={activeTab === 'expenses'}
					on:click={() => switchTab('expenses')}
				>
					<i data-lucide="dollar-sign"></i>
					Expenses
				</button>
				<button 
					class="nav-tab" 
					class:active={activeTab === 'guests'}
					on:click={() => switchTab('guests')}
				>
					<i data-lucide="users"></i>
					Guests
				</button>
			</nav>
		</div>

		<!-- Event Content -->
		<div class="event-content">
			{#if activeTab === 'itinerary'}
				<!-- Itinerary Tab Content -->
				<div class="itinerary-section">
					<ItineraryPlanner 
						{eventId}
						eventDays={getDaysFromEvent(event)}
						canEdit={canUserEdit()}
						itineraryData={event?.itinerary || {}}
						on:itineraryUpdated={() => {}}
					/>
				</div>
			{:else if activeTab === 'meals'}
				<!-- Meals Tab Content -->
				<div class="meals-section">
					<MealPlanner 
						{eventId}
						eventDays={getDaysFromEvent(event)}
						mealSlots={getMealSlotsFromEvent(event)}
						canEdit={canUserEdit()}
						on:mealsUpdated={() => {}}
					/>
				</div>
			{:else if activeTab === 'expenses'}
				<!-- Expenses Tab Content -->
				<div class="expenses-section">
					<ExpenseTracker 
						{eventId}
						members={event?.members || {}}
						canEdit={canUserEdit()}
						on:expensesUpdated={() => {}}
					/>
				</div>
			{:else if activeTab === 'guests'}
				<!-- Guests Tab Content -->
				<div class="guests-section">
					<GuestManager 
						{eventId}
						members={event?.members || {}}
						canInvite={canInvite()}
						on:guestInvited={() => {}}
						on:invitationCanceled={() => {}}
						on:guestRemoved={() => {}}
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Edit Modal -->
<EventEditModal 
	bind:isOpen={showEditModal}
	{event}
	loading={editLoading}
	on:save={handleEditSave}
	on:close={handleEditClose}
/>

<!-- Share Modal -->
<ShareModal 
	bind:isOpen={showShareModal}
	{event}
	on:close={handleShareClose}
/>

<style>
	.event-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;
		min-height: calc(100vh - 80px);
	}


	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		min-height: 400px;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-icon {
		width: 80px;
		height: 80px;
		background: #fee2e2;
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
		color: #dc2626;
	}

	.error-icon i {
		width: 40px;
		height: 40px;
	}

	.error-state h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #111827;
	}

	.error-state p {
		color: #6b7280;
		font-size: 1.125rem;
		margin-bottom: 2rem;
	}

	.event-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		border-radius: 16px;
		margin-bottom: 2rem;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.btn-back {
		background: rgba(255, 255, 255, 0.2);
		border: none;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: background 0.2s ease;
	}

	.btn-back:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 2rem;
	}

	.event-info {
		flex: 1;
	}

	.event-info h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
		color: white;
	}

	.event-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.9);
		font-size: 0.875rem;
	}

	.meta-item i {
		width: 16px;
		height: 16px;
		color: rgba(255, 255, 255, 0.7);
	}

	.event-description {
		color: rgba(255, 255, 255, 0.9);
		font-size: 1rem;
		line-height: 1.5;
		margin: 0;
	}

	.event-badge {
		flex-shrink: 0;
	}

	.event-nav {
		margin-bottom: 2rem;
	}

	.nav-tabs {
		display: flex;
		border-bottom: 1px solid #e5e7eb;
		gap: 0;
	}

	.nav-tab {
		background: none;
		border: none;
		padding: 1rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.nav-tab:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.nav-tab:hover:not(:disabled) {
		color: #374151;
	}

	.nav-tab.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
	}

	.nav-tab i {
		width: 16px;
		height: 16px;
	}

	.event-content {
		padding: 0 1rem;
	}

	.meals-section {
		max-width: 100%;
	}

	.expenses-section {
		max-width: 100%;
	}

	.itinerary-section {
		max-width: 100%;
	}

	.guests-section {
		max-width: 100%;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.btn-outline {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.btn-outline:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.btn-danger {
		background: #dc2626;
		color: white;
	}

	.btn-danger:hover {
		background: #b91c1c;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge-primary {
		background-color: rgba(255, 255, 255, 0.2);
		color: white;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.event-header {
			padding: 1.5rem 1rem;
		}

		.header-top,
		.header-content {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.header-actions {
			justify-content: center;
		}

		.event-info h1 {
			font-size: 1.5rem;
			text-align: center;
		}

		.event-meta {
			justify-content: center;
		}

		.event-badge {
			align-self: center;
		}

		.nav-tabs {
			overflow-x: auto;
		}

		.nav-tab {
			white-space: nowrap;
			min-width: fit-content;
		}


		.event-content {
			padding: 0;
		}
	}
</style>