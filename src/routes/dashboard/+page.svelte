<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user, isAuthenticated } from '$lib/stores/auth.js';
	import { events, eventService, eventsLoading } from '$lib/stores/events.js';
	import { formatDate, formatEventStatus } from '$lib/utils/formatters.js';
	import EventCreationWizard from '$lib/components/events/EventCreationWizard.svelte';
	
	let showCreateEventModal = false;
	let userEventsList = [];
	
	// Redirect to home if not authenticated
	$: if (!$isAuthenticated && !$eventsLoading) {
		goto('/');
	}
	
	onMount(async () => {
		if ($user) {
			await loadUserEvents();
		}
		
		// Initialize Lucide icons
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
	});
	
	async function loadUserEvents() {
		if (!$user) return;
		
		try {
			userEventsList = await eventService.getUserEvents($user.uid);
		} catch (error) {
			console.error('Error loading events:', error);
		}
	}
	
	function handleCreateEvent() {
		showCreateEventModal = true;
	}
	
	function handleEventCreated(event) {
		console.log('Event created:', event.detail);
		// Reload events
		loadUserEvents();
		showCreateEventModal = false;
	}
	
	function handleEventClick(eventId) {
		goto(`/events/${eventId}`);
	}
	
	function getEventStatusBadge(event) {
		const status = formatEventStatus(event);
		let badgeClass = 'badge-primary';
		
		if (status === 'Today' || status === 'Tomorrow') {
			badgeClass = 'badge-success';
		} else if (status.includes('ago') || status === 'Past') {
			badgeClass = 'badge-secondary';
		} else if (status.includes('days')) {
			badgeClass = 'badge-warning';
		}
		
		return { status, badgeClass };
	}
</script>

<svelte:head>
	<title>Dashboard - Planit</title>
	<meta name="description" content="Manage your events and collaborate with friends and family." />
</svelte:head>

<div class="dashboard">
	<div class="dashboard-header">
		<div class="header-content">
			<div class="header-text">
				<h1>Welcome back{$user?.displayName ? `, ${$user.displayName}` : ''}!</h1>
				<p>Manage your events and start planning your next gathering.</p>
			</div>
			<button class="btn btn-primary" on:click={handleCreateEvent}>
				<i data-lucide="plus"></i>
				Create Event
			</button>
		</div>
	</div>

	<div class="dashboard-content">
		{#if $eventsLoading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Loading your events...</p>
			</div>
		{:else if userEventsList.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<i data-lucide="calendar-plus"></i>
				</div>
				<h2>No events yet</h2>
				<p>Create your first event to start planning with friends and family.</p>
				<button class="btn btn-primary btn-lg" on:click={handleCreateEvent}>
					<i data-lucide="calendar-plus"></i>
					Create Your First Event
				</button>
			</div>
		{:else}
			<div class="events-section">
				<div class="section-header">
					<h2>Your Events</h2>
					<p>{userEventsList.length} event{userEventsList.length !== 1 ? 's' : ''}</p>
				</div>
				
				<div class="events-grid">
					{#each userEventsList as event}
						{@const { status, badgeClass } = getEventStatusBadge(event)}
						<div 
							class="event-card" 
							on:click={() => handleEventClick(event.id)}
							role="button"
							tabindex="0"
							on:keydown={(e) => e.key === 'Enter' && handleEventClick(event.id)}
						>
							<div class="event-card-header">
								<h3 class="event-title">{event.name}</h3>
								<span class="badge {badgeClass}">{status}</span>
							</div>
							
							<div class="event-details">
								{#if event.dates}
									<div class="event-detail">
										<i data-lucide="calendar"></i>
										<span>{event.dates}</span>
									</div>
								{/if}
								
								{#if event.location}
									<div class="event-detail">
										<i data-lucide="map-pin"></i>
										<span>{event.location}</span>
									</div>
								{/if}
								
								<div class="event-detail">
									<i data-lucide="user"></i>
									<span>You are the {event.userRole}</span>
								</div>
							</div>
							
							{#if event.description}
								<p class="event-description">{event.description}</p>
							{/if}
							
							<div class="event-card-footer">
								<div class="event-meta">
									<span class="event-type">{event.type || 'general'}</span>
									{#if event.createdAt}
										<span class="event-created">Created {formatDate(event.createdAt)}</span>
									{/if}
								</div>
								<div class="event-actions">
									<button 
										class="btn-icon" 
										on:click|stopPropagation={() => console.log('Edit event', event.id)}
										title="Edit event"
									>
										<i data-lucide="edit-3"></i>
									</button>
									<button 
										class="btn-icon" 
										on:click|stopPropagation={() => console.log('Share event', event.id)}
										title="Share event"
									>
										<i data-lucide="share-2"></i>
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Event Creation Modal -->
<EventCreationWizard 
	bind:isOpen={showCreateEventModal}
	on:success={handleEventCreated}
	on:close={() => showCreateEventModal = false}
/>

<style>
	.dashboard {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;
	}

	.dashboard-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 3rem 2rem;
		border-radius: 16px;
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
	}

	.header-text h1 {
		color: white;
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
	}

	.header-text p {
		color: rgba(255, 255, 255, 0.9);
		font-size: 1.125rem;
		margin: 0;
	}

	.dashboard-content {
		min-height: 400px;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
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

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
		color: white;
	}

	.empty-icon i {
		width: 40px;
		height: 40px;
	}

	.empty-state h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #111827;
	}

	.empty-state p {
		color: #6b7280;
		font-size: 1.125rem;
		margin-bottom: 2rem;
	}

	.events-section {
		padding: 0 1rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}

	.section-header p {
		color: #6b7280;
		margin: 0;
	}

	.events-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.event-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.event-card:hover {
		box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
		border-color: #d1d5db;
	}

	.event-card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.event-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		line-height: 1.3;
	}

	.event-details {
		margin-bottom: 1rem;
	}

	.event-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.event-detail i {
		width: 16px;
		height: 16px;
		color: #9ca3af;
	}

	.event-description {
		color: #6b7280;
		font-size: 0.875rem;
		line-height: 1.5;
		margin: 0 0 1rem 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.event-card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #f3f4f6;
	}

	.event-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.event-type {
		font-size: 0.75rem;
		font-weight: 500;
		color: #3b82f6;
		text-transform: capitalize;
	}

	.event-created {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.event-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-icon {
		background: none;
		border: none;
		padding: 0.5rem;
		border-radius: 6px;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-icon:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-icon i {
		width: 16px;
		height: 16px;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-lg {
		padding: 1rem 2rem;
		font-size: 1rem;
	}

	.btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px 0 rgba(102, 126, 234, 0.5);
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge-primary {
		background-color: #dbeafe;
		color: #1e40af;
	}

	.badge-success {
		background-color: #d1fae5;
		color: #065f46;
	}

	.badge-warning {
		background-color: #fef3c7;
		color: #92400e;
	}

	.badge-secondary {
		background-color: #f3f4f6;
		color: #4b5563;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.dashboard-header {
			padding: 2rem 1rem;
		}

		.header-content {
			flex-direction: column;
			text-align: center;
			align-items: center;
		}

		.header-text h1 {
			font-size: 1.5rem;
		}

		.events-grid {
			grid-template-columns: 1fr;
		}

		.events-section {
			padding: 0;
		}

		.section-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.event-card-footer {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.event-actions {
			align-self: flex-end;
		}
	}
</style>