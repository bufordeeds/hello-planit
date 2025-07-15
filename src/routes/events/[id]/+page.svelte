<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user, isAuthenticated, loading as authLoading } from '$lib/stores/auth.js';
	import { eventService, currentEvent, eventsError } from '$lib/stores/events.js';
	import { formatDate } from '$lib/utils/formatters.js';
	import EventEditModal from '$lib/components/events/EventEditModal.svelte';
	import ShareModal from '$lib/components/events/ShareModal.svelte';

	let eventId = '';
	let event = null;
	let loading = true;
	let error = null;
	let unsubscribe = null;
	
	// Modal states
	let showEditModal = false;
	let showShareModal = false;
	let editLoading = false;

	// Get event ID from URL params
	$: eventId = $page.params.id;

	// Redirect unauthenticated users to sign up/login with return URL
	$: if (typeof window !== 'undefined' && !$isAuthenticated && !$authLoading) {
		// Store the current URL so we can redirect back after authentication
		const currentUrl = window.location.pathname;
		sessionStorage.setItem('redirectAfterAuth', currentUrl);
		goto('/?message=sign-in-required');
	}

	onMount(async () => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}

		// Only load event for authenticated users
		if ($user && eventId) {
			await loadEvent();
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
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
</script>

<svelte:head>
	<title>{event ? event.metadata.name : 'Event'} - Planit</title>
	<meta name="description" content={event ? `Event details for ${event.metadata.name}` : 'Event details'} />
</svelte:head>

<div class="event-page">
	{#if loading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Loading event...</p>
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
							<span>{Object.keys(event.members || {}).length} member{Object.keys(event.members || {}).length !== 1 ? 's' : ''}</span>
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
				<button class="nav-tab active">
					<i data-lucide="map"></i>
					Overview
				</button>
				<button class="nav-tab" disabled>
					<i data-lucide="utensils"></i>
					Meals
				</button>
				<button class="nav-tab" disabled>
					<i data-lucide="dollar-sign"></i>
					Expenses
				</button>
				<button class="nav-tab" disabled>
					<i data-lucide="users"></i>
					Members
				</button>
			</nav>
		</div>

		<!-- Event Content -->
		<div class="event-content">
			<!-- Overview Tab Content -->
			<div class="overview-section">
				<div class="overview-grid">
					<!-- Event Details Card -->
					<div class="info-card">
						<h3>Event Information</h3>
						<div class="info-grid">
							<div class="info-item">
								<span class="info-label">Created</span>
								<span class="info-value">{formatDate(event.metadata.createdAt)}</span>
							</div>
							<div class="info-item">
								<span class="info-label">Privacy</span>
								<span class="info-value">{event.settings.privacy}</span>
							</div>
							<div class="info-item">
								<span class="info-label">Editing</span>
								<span class="info-value">{event.settings.allowEditing ? 'Allowed' : 'Owner only'}</span>
							</div>
							<div class="info-item">
								<span class="info-label">Approval</span>
								<span class="info-value">{event.settings.requireApproval ? 'Required' : 'Not required'}</span>
							</div>
						</div>
					</div>

					<!-- Quick Stats Card -->
					<div class="stats-card">
						<h3>Quick Stats</h3>
						<div class="stats-grid">
							<div class="stat-item">
								<div class="stat-number">0</div>
								<div class="stat-label">Meals</div>
							</div>
							<div class="stat-item">
								<div class="stat-number">$0</div>
								<div class="stat-label">Expenses</div>
							</div>
							<div class="stat-item">
								<div class="stat-number">{Object.keys(event.members || {}).length}</div>
								<div class="stat-label">Members</div>
							</div>
						</div>
					</div>

					<!-- Members Card -->
					<div class="members-card">
						<h3>Members</h3>
						<div class="members-list">
							{#each Object.entries(event.members || {}) as [memberId, member]}
								<div class="member-item">
									<div class="member-avatar">
										{member.name ? member.name.charAt(0).toUpperCase() : '?'}
									</div>
									<div class="member-info">
										<div class="member-name">{member.name || member.email}</div>
										<div class="member-role">{member.role}</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Features Card -->
					<div class="features-card">
						<h3>Available Features</h3>
						<div class="features-list">
							<div class="feature-item" class:enabled={event.settings.features?.meals}>
								<i data-lucide="utensils"></i>
								<span>Meal Planning</span>
								{#if event.settings.features?.meals}
									<i data-lucide="check" class="feature-status enabled"></i>
								{:else}
									<i data-lucide="x" class="feature-status disabled"></i>
								{/if}
							</div>
							<div class="feature-item" class:enabled={event.settings.features?.expenses}>
								<i data-lucide="dollar-sign"></i>
								<span>Expense Tracking</span>
								{#if event.settings.features?.expenses}
									<i data-lucide="check" class="feature-status enabled"></i>
								{:else}
									<i data-lucide="x" class="feature-status disabled"></i>
								{/if}
							</div>
							<div class="feature-item" class:enabled={event.settings.features?.itinerary}>
								<i data-lucide="map"></i>
								<span>Itinerary</span>
								{#if event.settings.features?.itinerary}
									<i data-lucide="check" class="feature-status enabled"></i>
								{:else}
									<i data-lucide="x" class="feature-status disabled"></i>
								{/if}
							</div>
							<div class="feature-item" class:enabled={event.settings.features?.chat}>
								<i data-lucide="message-circle"></i>
								<span>Chat</span>
								{#if event.settings.features?.chat}
									<i data-lucide="check" class="feature-status enabled"></i>
								{:else}
									<i data-lucide="x" class="feature-status disabled"></i>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
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

	.overview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.info-card,
	.stats-card,
	.members-card,
	.features-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.info-card h3,
	.stats-card h3,
	.members-card h3,
	.features-card h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
		border-bottom: 1px solid #f3f4f6;
		padding-bottom: 0.5rem;
	}

	.info-grid {
		display: grid;
		gap: 0.75rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
	}

	.info-label {
		font-weight: 500;
		color: #6b7280;
	}

	.info-value {
		color: #111827;
		text-transform: capitalize;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.stat-item {
		text-align: center;
	}

	.stat-number {
		font-size: 1.5rem;
		font-weight: 700;
		color: #3b82f6;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.members-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.member-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: 6px;
		transition: background 0.2s ease;
	}

	.member-item:hover {
		background: #f9fafb;
	}

	.member-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.member-info {
		flex: 1;
	}

	.member-name {
		font-weight: 500;
		color: #111827;
		font-size: 0.875rem;
	}

	.member-role {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: capitalize;
	}

	.features-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 6px;
		border: 1px solid #e5e7eb;
		transition: all 0.2s ease;
	}

	.feature-item.enabled {
		background: #f0f9ff;
		border-color: #bae6fd;
	}

	.feature-item i:first-child {
		width: 20px;
		height: 20px;
		color: #6b7280;
	}

	.feature-item.enabled i:first-child {
		color: #3b82f6;
	}

	.feature-item span {
		flex: 1;
		font-weight: 500;
		color: #374151;
	}

	.feature-status {
		width: 16px;
		height: 16px;
	}

	.feature-status.enabled {
		color: #059669;
	}

	.feature-status.disabled {
		color: #9ca3af;
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

		.overview-grid {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.event-content {
			padding: 0;
		}
	}
</style>