<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth.js';
	import { guestService } from '$lib/services/guestService.js';
	
	let pendingInvitations = [];
	let loading = false;
	let error = null;
	
	onMount(async () => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
		
		if ($user) {
			await loadPendingInvitations();
		}
	});
	
	async function loadPendingInvitations() {
		if (!$user?.email) return;
		
		try {
			loading = true;
			error = null;
			pendingInvitations = await guestService.getUserPendingInvitations($user.email);
		} catch (err) {
			console.error('Error loading pending invitations:', err);
			error = err.message || 'Failed to load invitations';
		} finally {
			loading = false;
		}
	}
	
	function handleJoinEvent(eventId) {
		goto(`/join/${eventId}`);
	}
	
	function formatDate(timestamp) {
		return new Date(timestamp).toLocaleDateString();
	}
	
	function getRoleColor(role) {
		const colors = {
			owner: 'bg-purple-100 text-purple-800',
			admin: 'bg-red-100 text-red-800',
			editor: 'bg-blue-100 text-blue-800',
			member: 'bg-green-100 text-green-800',
			viewer: 'bg-gray-100 text-gray-800'
		};
		return colors[role] || colors.viewer;
	}
</script>

{#if loading}
	<div class="loading-invitations">
		<div class="loading-spinner"></div>
		<span>Checking for invitations...</span>
	</div>
{:else if error}
	<div class="error-invitations">
		<i data-lucide="alert-circle"></i>
		<span>Failed to load invitations: {error}</span>
	</div>
{:else if pendingInvitations.length > 0}
	<div class="pending-invitations">
		<div class="invitations-header">
			<h2>Pending Invitations</h2>
			<p>You have {pendingInvitations.length} invitation{pendingInvitations.length !== 1 ? 's' : ''} waiting</p>
		</div>
		
		<div class="invitations-list">
			{#each pendingInvitations as invitation}
				<div class="invitation-card">
					<div class="invitation-content">
						<div class="invitation-header">
							<h3>{invitation.eventName}</h3>
							<span class="role-badge {getRoleColor(invitation.role)}">{invitation.role}</span>
						</div>
						
						<div class="invitation-details">
							{#if invitation.eventDates}
								<div class="detail-item">
									<i data-lucide="calendar"></i>
									<span>{invitation.eventDates}</span>
								</div>
							{/if}
							{#if invitation.eventLocation}
								<div class="detail-item">
									<i data-lucide="map-pin"></i>
									<span>{invitation.eventLocation}</span>
								</div>
							{/if}
							<div class="detail-item">
								<i data-lucide="mail"></i>
								<span>Invited {formatDate(invitation.invitedAt)}</span>
							</div>
						</div>
					</div>
					
					<div class="invitation-actions">
						<button 
							class="btn btn-primary"
							on:click={() => handleJoinEvent(invitation.eventId)}
						>
							<i data-lucide="check"></i>
							Join Event
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.loading-invitations {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		color: #6b7280;
		font-size: 0.875rem;
	}
	
	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.error-invitations {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		border-radius: 6px;
		font-size: 0.875rem;
	}
	
	.error-invitations i {
		width: 16px;
		height: 16px;
	}
	
	.pending-invitations {
		margin-bottom: 2rem;
	}
	
	.invitations-header {
		margin-bottom: 1rem;
	}
	
	.invitations-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.25rem 0;
	}
	
	.invitations-header p {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}
	
	.invitations-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.invitation-card {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border: 1px solid #f59e0b;
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.invitation-content {
		flex: 1;
	}
	
	.invitation-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		gap: 1rem;
	}
	
	.invitation-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
	}
	
	.role-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
		white-space: nowrap;
	}
	
	.invitation-details {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
	
	.detail-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: #6b7280;
	}
	
	.detail-item i {
		width: 14px;
		height: 14px;
	}
	
	.invitation-actions {
		flex-shrink: 0;
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
	
	.btn-primary:hover {
		background: #2563eb;
	}
	
	.btn i {
		width: 16px;
		height: 16px;
	}
	
	/* Mobile responsive */
	@media (max-width: 768px) {
		.invitation-card {
			flex-direction: column;
			align-items: stretch;
		}
		
		.invitation-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		
		.invitation-details {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.invitation-actions {
			align-self: stretch;
		}
		
		.btn {
			width: 100%;
			justify-content: center;
		}
	}
</style>