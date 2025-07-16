<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user, isAuthenticated } from '$lib/stores/auth.js';
	import { events, eventService, eventsLoading } from '$lib/stores/events.js';
	import { formatDate, formatEventStatus } from '$lib/utils/formatters.js';
	import EventCreationWizard from '$lib/components/events/EventCreationWizard.svelte';
	import PendingInvitations from '$lib/components/invitations/PendingInvitations.svelte';
	
	let showCreateEventModal = false;
	let userEventsList = [];
	
	// Redirect to home if not authenticated (browser only)
	$: if (typeof window !== 'undefined' && !$isAuthenticated && !$eventsLoading) {
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
	<title>Mission Control - Planit</title>
	<meta name="description" content="Command center for your adventures. Manage missions and coordinate with your crew." />
</svelte:head>

<div class="dashboard">
	<div class="dashboard-header">
		<div class="header-content">
			<div class="header-text">
				<h1>Welcome back{$user?.displayName ? `, ${$user.displayName}` : ''}!</h1>
				<p>Command your missions and start planning your next adventure.</p>
			</div>
			<button class="btn btn-primary" on:click={handleCreateEvent}>
				<i data-lucide="rocket"></i>
				Launch Mission
			</button>
		</div>
	</div>

	<div class="dashboard-content">
		<!-- Pending Invitations -->
		<PendingInvitations />
		
		{#if $eventsLoading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Loading your missions...</p>
			</div>
		{:else if userEventsList.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<i data-lucide="calendar-plus"></i>
				</div>
				<h2>No missions yet</h2>
				<p>Launch your first mission to start planning adventures with your crew.</p>
				<button class="btn btn-primary btn-lg" on:click={handleCreateEvent}>
					<i data-lucide="rocket"></i>
					Launch Your First Mission
				</button>
			</div>
		{:else}
			<div class="events-section">
				<div class="section-header">
					<h2>Your Missions</h2>
					<p>{userEventsList.length} mission{userEventsList.length !== 1 ? 's' : ''}</p>
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
									<span>You are the {event.userRole === 'owner' ? 'mission commander' : event.userRole}</span>
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
		background: linear-gradient(135deg, #2D1B69 0%, #553C9A 50%, #7209B7 100%);
		color: white;
		padding: 3rem 2rem;
		border-radius: 16px;
		margin-bottom: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 8px 32px 0 rgba(114, 9, 183, 0.37);
		backdrop-filter: blur(10px);
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
		position: relative;
		display: inline-block;
		margin-bottom: 1rem;
	}

	.loading-spinner::before {
		content: '🚀';
		font-size: 24px;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		animation: rocket-bounce 1.5s ease-in-out infinite;
	}

	.loading-spinner::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 60px;
		height: 60px;
		border: 2px solid transparent;
		border-top: 2px solid #00D4FF;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		animation: rocket-orbit 2s linear infinite;
	}

	@keyframes rocket-bounce {
		0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
		50% { transform: translate(-50%, -50%) translateY(-10px); }
	}

	@keyframes rocket-orbit {
		0% { transform: translate(-50%, -50%) rotate(0deg); }
		100% { transform: translate(-50%, -50%) rotate(360deg); }
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
		background: linear-gradient(135deg, #00D4FF 0%, #7209B7 100%);
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
		color: white;
		box-shadow: 0 8px 32px 0 rgba(0, 212, 255, 0.37);
	}

	.empty-icon i {
		width: 40px;
		height: 40px;
	}

	.empty-state h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #F8F9FF;
	}

	.empty-state p {
		color: #E1E5F2;
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
		color: #F8F9FF;
		margin: 0;
	}

	.section-header p {
		color: #E1E5F2;
		margin: 0;
	}

	.events-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.event-card {
		background: rgba(248, 249, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 12px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
		backdrop-filter: blur(10px);
		position: relative;
		overflow: hidden;
	}

	/* Orbital ring effect */
	.event-card::before {
		content: '';
		position: absolute;
		top: -2px;
		left: -2px;
		right: -2px;
		bottom: -2px;
		background: conic-gradient(
			from 0deg,
			transparent 0deg,
			rgba(0, 212, 255, 0.3) 45deg,
			transparent 90deg,
			rgba(255, 107, 157, 0.3) 135deg,
			transparent 180deg,
			rgba(0, 212, 255, 0.3) 225deg,
			transparent 270deg,
			rgba(255, 107, 157, 0.3) 315deg,
			transparent 360deg
		);
		border-radius: 14px;
		animation: orbital-rotation 20s linear infinite;
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: -1;
	}

	.event-card:hover::before {
		opacity: 1;
	}

	@keyframes orbital-rotation {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.event-card:hover {
		box-shadow: 0 10px 25px -3px rgba(0, 212, 255, 0.3);
		transform: translateY(-2px);
		border-color: rgba(0, 212, 255, 0.5);
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
		color: #F8F9FF;
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
		color: #E1E5F2;
		font-size: 0.875rem;
	}

	.event-detail i {
		width: 16px;
		height: 16px;
		color: #00D4FF;
	}

	.event-description {
		color: #E1E5F2;
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
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	.event-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.event-type {
		font-size: 0.75rem;
		font-weight: 500;
		color: #00D4FF;
		text-transform: capitalize;
	}

	.event-created {
		font-size: 0.75rem;
		color: #E1E5F2;
		opacity: 0.7;
	}

	.event-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-icon {
		background: rgba(248, 249, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.5rem;
		border-radius: 6px;
		color: #E1E5F2;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(10px);
	}

	.btn-icon:hover {
		background: rgba(0, 212, 255, 0.2);
		color: #00D4FF;
		border-color: rgba(0, 212, 255, 0.5);
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
		background: linear-gradient(135deg, #00D4FF 0%, #7209B7 100%);
		color: white;
		box-shadow: 0 4px 14px 0 rgba(0, 212, 255, 0.39);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px 0 rgba(0, 212, 255, 0.6);
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
		background-color: rgba(0, 212, 255, 0.2);
		color: #00D4FF;
		border: 1px solid rgba(0, 212, 255, 0.3);
	}

	.badge-success {
		background-color: rgba(57, 255, 20, 0.2);
		color: #39FF14;
		border: 1px solid rgba(57, 255, 20, 0.3);
	}

	.badge-warning {
		background-color: rgba(255, 206, 84, 0.2);
		color: #FFCE54;
		border: 1px solid rgba(255, 206, 84, 0.3);
	}

	.badge-secondary {
		background-color: rgba(225, 229, 242, 0.2);
		color: #E1E5F2;
		border: 1px solid rgba(225, 229, 242, 0.3);
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