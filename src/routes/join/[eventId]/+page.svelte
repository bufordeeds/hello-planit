<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { user, isAuthenticated, loading as authLoading } from '$lib/stores/auth.js';
	import { eventService } from '$lib/stores/events.js';
	import { guestService } from '$lib/services/guestService.js';
	
	let eventId = '';
	let event = null;
	let invitation = null;
	let loading = true;
	let error = null;
	let joinLoading = false;
	
	// Get event ID from URL params
	$: eventId = $page.params.eventId;
	
	onMount(async () => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
		
		// Wait for authentication to load
		if ($authLoading) {
			const unsubscribe = authLoading.subscribe(isLoading => {
				if (!isLoading) {
					unsubscribe();
					loadEventAndInvitation();
				}
			});
		} else {
			loadEventAndInvitation();
		}
	});
	
	async function loadEventAndInvitation() {
		if (!eventId) {
			error = 'Invalid event link';
			loading = false;
			return;
		}
		
		try {
			loading = true;
			error = null;
			
			// Load event details
			event = await eventService.getEvent(eventId);
			
			if (!event) {
				error = 'Event not found';
				loading = false;
				return;
			}
			
			// If user is authenticated, check for invitation
			if ($isAuthenticated && $user) {
				// Check if user is already a member
				if (event.members && event.members[$user.uid]) {
					// User is already a member, redirect to event
					goto(`/events/${eventId}`);
					return;
				}
				
				// Look for invitation
				invitation = await guestService.findInvitationByEmail(eventId, $user.email);
				
				if (!invitation) {
					error = 'You do not have an invitation to this event';
				}
			}
		} catch (err) {
			console.error('Error loading event:', err);
			error = err.message || 'Failed to load event';
		} finally {
			loading = false;
		}
	}
	
	async function joinEvent() {
		if (!invitation || !$user) {
			error = 'Cannot join event without a valid invitation';
			return;
		}
		
		try {
			joinLoading = true;
			error = null;
			
			await guestService.acceptInvitation(eventId, invitation.id, $user);
			
			// Redirect to the event page
			goto(`/events/${eventId}`);
		} catch (err) {
			console.error('Error joining event:', err);
			error = err.message || 'Failed to join event';
		} finally {
			joinLoading = false;
		}
	}
	
	function handleSignIn() {
		// Store the current URL so we can redirect back after authentication
		sessionStorage.setItem('redirectAfterAuth', window.location.pathname);
		goto('/?message=sign-in-required');
	}
	
	function getRoleDescription(role) {
		const descriptions = {
			viewer: 'View event details only',
			member: 'View and edit event details',
			editor: 'View, edit, and manage event content',
			admin: 'View, edit, and invite others'
		};
		return descriptions[role] || descriptions.member;
	}
</script>

<svelte:head>
	<title>Join Event - Planit</title>
	<meta name="description" content="Join an event on Planit" />
</svelte:head>

<div class="join-page">
	{#if loading || $authLoading}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<p>Loading event details...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<div class="error-icon">
				<i data-lucide="alert-circle"></i>
			</div>
			<h2>Unable to Join Event</h2>
			<p>{error}</p>
			<div class="error-actions">
				<button class="btn btn-primary" on:click={() => goto('/dashboard')}>
					<i data-lucide="arrow-left"></i>
					Go to Dashboard
				</button>
				{#if !$isAuthenticated}
					<button class="btn btn-secondary" on:click={handleSignIn}>
						<i data-lucide="log-in"></i>
						Sign In
					</button>
				{/if}
			</div>
		</div>
	{:else if event}
		<div class="join-content">
			<!-- Event Header -->
			<div class="event-preview">
				<div class="event-badge">
					<span class="badge badge-primary">{event.metadata.type || 'general'}</span>
				</div>
				<h1>{event.metadata.name}</h1>
				{#if event.metadata.dates}
					<div class="event-meta">
						<i data-lucide="calendar"></i>
						<span>{event.metadata.dates}</span>
					</div>
				{/if}
				{#if event.metadata.location}
					<div class="event-meta">
						<i data-lucide="map-pin"></i>
						<span>{event.metadata.location}</span>
					</div>
				{/if}
				{#if event.metadata.description}
					<p class="event-description">{event.metadata.description}</p>
				{/if}
			</div>
			
			{#if !$isAuthenticated}
				<!-- Sign in required -->
				<div class="auth-required">
					<div class="auth-icon">
						<i data-lucide="key"></i>
					</div>
					<h2>Sign In Required</h2>
					<p>You need to sign in with your account to join this event.</p>
					<button class="btn btn-primary" on:click={handleSignIn}>
						<i data-lucide="log-in"></i>
						Sign In to Join
					</button>
				</div>
			{:else if invitation}
				<!-- Join event -->
				<div class="join-invitation">
					<div class="invitation-icon">
						<i data-lucide="mail"></i>
					</div>
					<h2>You're Invited!</h2>
					<p>You've been invited to join this event as a <strong>{invitation.role}</strong>.</p>
					<div class="role-description">
						<i data-lucide="info"></i>
						<span>{getRoleDescription(invitation.role)}</span>
					</div>
					
					<div class="join-actions">
						<button 
							class="btn btn-primary" 
							on:click={joinEvent}
							disabled={joinLoading}
						>
							{#if joinLoading}
								<i data-lucide="loader-2" class="animate-spin"></i>
								Joining...
							{:else}
								<i data-lucide="check"></i>
								Accept & Join Event
							{/if}
						</button>
						<button class="btn btn-secondary" on:click={() => goto('/dashboard')}>
							<i data-lucide="x"></i>
							Decline
						</button>
					</div>
				</div>
			{:else}
				<!-- No invitation found -->
				<div class="no-invitation">
					<div class="invitation-icon">
						<i data-lucide="mail-x"></i>
					</div>
					<h2>No Invitation Found</h2>
					<p>We couldn't find a valid invitation for your email address.</p>
					<p class="help-text">
						Make sure you're signed in with the same email address that received the invitation,
						or contact the event organizer for a new invitation.
					</p>
					<button class="btn btn-primary" on:click={() => goto('/dashboard')}>
						<i data-lucide="arrow-left"></i>
						Go to Dashboard
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.join-page {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
		min-height: calc(100vh - 80px);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 3rem 2rem;
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
	
	.error-icon,
	.auth-icon,
	.invitation-icon {
		width: 80px;
		height: 80px;
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 2rem;
		color: white;
	}
	
	.error-icon {
		background: #dc2626;
	}
	
	.auth-icon {
		background: #3b82f6;
	}
	
	.invitation-icon {
		background: #059669;
	}
	
	.error-icon i,
	.auth-icon i,
	.invitation-icon i {
		width: 40px;
		height: 40px;
	}
	
	.join-content {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.event-preview {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		border-radius: 16px;
		text-align: center;
	}
	
	.event-badge {
		margin-bottom: 1rem;
	}
	
	.event-preview h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
	}
	
	.event-meta {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 1rem 0.5rem 0;
		font-size: 0.875rem;
		opacity: 0.9;
	}
	
	.event-meta i {
		width: 16px;
		height: 16px;
	}
	
	.event-description {
		margin-top: 1rem;
		opacity: 0.9;
		line-height: 1.6;
	}
	
	.auth-required,
	.join-invitation,
	.no-invitation {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
	}
	
	.auth-required h2,
	.join-invitation h2,
	.no-invitation h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
	}
	
	.auth-required p,
	.join-invitation p,
	.no-invitation p {
		color: #6b7280;
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}
	
	.help-text {
		font-size: 0.875rem;
		color: #9ca3af;
		margin-bottom: 2rem !important;
	}
	
	.role-description {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		color: #1e40af;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
		margin-bottom: 2rem;
	}
	
	.role-description i {
		width: 16px;
		height: 16px;
	}
	
	.join-actions,
	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	
	.btn {
		padding: 0.75rem 1.5rem;
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
	
	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}
	
	.btn-secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}
	
	.btn-secondary:hover:not(:disabled) {
		background: #e5e7eb;
	}
	
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn i {
		width: 16px;
		height: 16px;
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
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
		.join-page {
			padding: 1rem;
		}
		
		.event-preview {
			padding: 1.5rem;
		}
		
		.event-preview h1 {
			font-size: 1.5rem;
		}
		
		.auth-required,
		.join-invitation,
		.no-invitation {
			padding: 1.5rem;
		}
		
		.join-actions,
		.error-actions {
			flex-direction: column;
		}
		
		.btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>