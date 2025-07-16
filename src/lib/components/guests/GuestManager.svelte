<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { user } from '$lib/stores/auth.js';
	import { guestService } from '$lib/services/guestService.js';
	
	const dispatch = createEventDispatcher();
	
	export let eventId;
	export let members = {};
	export let canInvite = false;
	
	let error = null;
	let loading = false;
	let invitations = [];
	let unsubscribe = null;
	
	// Invitation form state
	let showInviteForm = false;
	let inviteEmail = '';
	let inviteRole = 'member';
	let inviteLoading = false;
	
	const roles = [
		{ value: 'viewer', label: 'Viewer', description: 'Can view event details only' },
		{ value: 'member', label: 'Member', description: 'Can view and edit event details' },
		{ value: 'editor', label: 'Editor', description: 'Can view, edit, and manage event content' },
		{ value: 'admin', label: 'Admin', description: 'Can view, edit, and invite others' }
	];
	
	onMount(async () => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
		
		// Subscribe to invitation updates
		if (eventId) {
			unsubscribe = guestService.subscribeToInvitations(eventId, (invitationList) => {
				invitations = invitationList;
			});
		}
	});
	
	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
	
	async function sendInvitation() {
		if (!inviteEmail.trim()) {
			error = 'Email address is required';
			return;
		}
		
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(inviteEmail.trim())) {
			error = 'Please enter a valid email address';
			return;
		}
		
		// Check if user is already a member
		const memberEmails = Object.values(members).map(m => m.email.toLowerCase());
		if (memberEmails.includes(inviteEmail.toLowerCase().trim())) {
			error = 'This person is already a member of the event';
			return;
		}
		
		// Check if there's already a pending invitation
		const existingInvitation = invitations.find(inv => 
			inv.email.toLowerCase() === inviteEmail.toLowerCase().trim() && 
			inv.status === 'pending'
		);
		if (existingInvitation) {
			error = 'An invitation has already been sent to this email address';
			return;
		}
		
		try {
			inviteLoading = true;
			error = null;
			
			await guestService.inviteGuest(eventId, inviteEmail.trim(), inviteRole, $user.uid);
			
			// Reset form
			inviteEmail = '';
			inviteRole = 'member';
			showInviteForm = false;
			
			dispatch('guestInvited');
		} catch (err) {
			console.error('Error sending invitation:', err);
			error = err.message || 'Failed to send invitation';
		} finally {
			inviteLoading = false;
		}
	}
	
	async function cancelInvitation(invitationId) {
		if (!confirm('Are you sure you want to cancel this invitation?')) {
			return;
		}
		
		try {
			loading = true;
			await guestService.cancelInvitation(eventId, invitationId);
			dispatch('invitationCanceled');
		} catch (err) {
			console.error('Error canceling invitation:', err);
			error = err.message || 'Failed to cancel invitation';
		} finally {
			loading = false;
		}
	}
	
	async function removeGuest(memberId, memberName) {
		if (!confirm(`Are you sure you want to remove ${memberName} from this event?`)) {
			return;
		}
		
		try {
			loading = true;
			await guestService.removeGuest(eventId, memberId);
			dispatch('guestRemoved');
		} catch (err) {
			console.error('Error removing guest:', err);
			error = err.message || 'Failed to remove guest';
		} finally {
			loading = false;
		}
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
	
	function getInvitationStatusColor(status) {
		const colors = {
			pending: 'bg-yellow-100 text-yellow-800',
			accepted: 'bg-green-100 text-green-800',
			declined: 'bg-red-100 text-red-800'
		};
		return colors[status] || colors.pending;
	}
	
	function formatDate(timestamp) {
		return new Date(timestamp).toLocaleDateString();
	}
	
	function canRemoveMember(memberRole, memberId) {
		// Can't remove yourself or the owner
		if (memberId === $user?.uid) return false;
		if (memberRole === 'owner') return false;
		return canInvite; // Same permission as inviting
	}
</script>

<div class="guest-manager">
	<div class="guest-header">
		<div class="header-content">
			<div class="header-info">
				<h2>Guests</h2>
				<p class="header-description">Manage event members and invitations</p>
			</div>
			{#if canInvite}
				<button 
					class="btn btn-primary" 
					on:click={() => showInviteForm = !showInviteForm}
					disabled={loading}
				>
					<i data-lucide="user-plus"></i>
					Invite Guest
				</button>
			{/if}
		</div>
		
		{#if error}
			<div class="error-message">
				<i data-lucide="alert-circle"></i>
				{error}
			</div>
		{/if}
	</div>
	
	<!-- Invitation Form -->
	{#if showInviteForm}
		<div class="invite-form-section">
			<div class="invite-form">
				<h3>Invite a Guest</h3>
				<form on:submit|preventDefault={sendInvitation}>
					<div class="form-group">
						<label for="inviteEmail">Email Address</label>
						<input 
							type="email" 
							id="inviteEmail"
							class="form-input"
							placeholder="guest@example.com"
							bind:value={inviteEmail}
							required
						/>
					</div>
					
					<div class="form-group">
						<label for="inviteRole">Role</label>
						<select id="inviteRole" class="form-select" bind:value={inviteRole}>
							{#each roles as role}
								<option value={role.value}>{role.label} - {role.description}</option>
							{/each}
						</select>
					</div>
					
					<div class="form-actions">
						<button type="button" class="btn btn-secondary" on:click={() => showInviteForm = false}>
							Cancel
						</button>
						<button type="submit" class="btn btn-primary" disabled={inviteLoading}>
							{#if inviteLoading}
								<i data-lucide="loader-2" class="animate-spin"></i>
								Sending...
							{:else}
								<i data-lucide="send"></i>
								Send Invitation
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
	
	<!-- Current Members -->
	<div class="members-section">
		<h3>Current Members ({Object.keys(members).length})</h3>
		{#if Object.keys(members).length > 0}
			<div class="members-list">
				{#each Object.entries(members) as [memberId, member]}
					<div class="member-item">
						<div class="member-info">
							<div class="member-avatar">
								{member.name ? member.name.charAt(0).toUpperCase() : '?'}
							</div>
							<div class="member-details">
								<div class="member-name">{member.name || member.email}</div>
								<div class="member-email">{member.email}</div>
								{#if member.joinedAt}
									<div class="member-joined">Joined {formatDate(member.joinedAt)}</div>
								{/if}
							</div>
						</div>
						<div class="member-actions">
							<span class="role-badge {getRoleColor(member.role)}">{member.role}</span>
							{#if canRemoveMember(member.role, memberId)}
								<button 
									class="btn-remove" 
									on:click={() => removeGuest(memberId, member.name)}
									disabled={loading}
									title="Remove member"
								>
									<i data-lucide="user-x"></i>
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-members">
				<i data-lucide="users"></i>
				<p>No members yet</p>
			</div>
		{/if}
	</div>
	
	<!-- Pending Invitations -->
	{#if invitations.length > 0}
		<div class="invitations-section">
			<h3>Pending Invitations ({invitations.length})</h3>
			<div class="invitations-list">
				{#each invitations as invitation}
					<div class="invitation-item">
						<div class="invitation-info">
							<div class="invitation-email">{invitation.email}</div>
							<div class="invitation-details">
								<span class="role-badge {getRoleColor(invitation.role)}">{invitation.role}</span>
								<span class="invitation-date">Sent {formatDate(invitation.invitedAt)}</span>
							</div>
						</div>
						<div class="invitation-actions">
							<span class="status-badge {getInvitationStatusColor(invitation.status)}">
								{invitation.status}
							</span>
							{#if canInvite && invitation.status === 'pending'}
								<button 
									class="btn-cancel" 
									on:click={() => cancelInvitation(invitation.id)}
									disabled={loading}
									title="Cancel invitation"
								>
									<i data-lucide="x"></i>
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	
	{#if !canInvite}
		<div class="permission-notice">
			<i data-lucide="info"></i>
			<span>You don't have permission to invite guests to this event</span>
		</div>
	{/if}
</div>

<style>
	.guest-manager {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.guest-header {
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
	
	.invite-form-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
	}
	
	.invite-form h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1.5rem 0;
	}
	
	.form-group {
		margin-bottom: 1rem;
	}
	
	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}
	
	.form-input, .form-select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: border-color 0.3s ease;
	}
	
	.form-input:focus, .form-select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	
	.members-section, .invitations-section {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 1.5rem;
	}
	
	.members-section h3, .invitations-section h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
	}
	
	.members-list, .invitations-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.member-item, .invitation-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
	}
	
	.member-info, .invitation-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}
	
	.member-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1rem;
	}
	
	.member-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.member-name {
		font-weight: 500;
		color: #111827;
	}
	
	.member-email {
		font-size: 0.875rem;
		color: #6b7280;
	}
	
	.member-joined {
		font-size: 0.75rem;
		color: #9ca3af;
	}
	
	.member-actions, .invitation-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.role-badge, .status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}
	
	.invitation-email {
		font-weight: 500;
		color: #111827;
		margin-bottom: 0.25rem;
	}
	
	.invitation-details {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.invitation-date {
		font-size: 0.75rem;
		color: #6b7280;
	}
	
	.btn {
		padding: 0.5rem 1rem;
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
	}
	
	.btn-secondary:hover:not(:disabled) {
		background: #e5e7eb;
	}
	
	.btn-remove, .btn-cancel {
		padding: 0.375rem;
		background: #fee2e2;
		color: #dc2626;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s ease;
	}
	
	.btn-remove:hover:not(:disabled), .btn-cancel:hover:not(:disabled) {
		background: #fecaca;
	}
	
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn i {
		width: 16px;
		height: 16px;
	}
	
	.btn-remove i, .btn-cancel i {
		width: 14px;
		height: 14px;
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	
	.empty-members {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}
	
	.empty-members i {
		width: 48px;
		height: 48px;
		margin: 0 auto 1rem;
		color: #d1d5db;
	}
	
	.empty-members p {
		margin: 0;
	}
	
	.permission-notice {
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
	
	.permission-notice i {
		width: 16px;
		height: 16px;
	}
	
	/* Mobile responsive */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			align-items: stretch;
		}
		
		.member-item, .invitation-item {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}
		
		.member-actions, .invitation-actions {
			justify-content: flex-end;
		}
		
		.form-actions {
			flex-direction: column;
		}
	}
</style>