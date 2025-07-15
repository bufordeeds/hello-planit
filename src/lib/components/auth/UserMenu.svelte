<script>
	import { createEventDispatcher } from 'svelte';
	import { user, authService } from '$lib/stores/auth.js';
	import { formatUserName, formatUserInitials } from '$lib/utils/formatters.js';
	
	const dispatch = createEventDispatcher();
	
	let isOpen = false;
	
	function toggleDropdown() {
		isOpen = !isOpen;
	}
	
	function closeDropdown() {
		isOpen = false;
	}
	
	function handleProfile() {
		dispatch('profile');
		closeDropdown();
	}
	
	function handleDashboard() {
		dispatch('dashboard');
		closeDropdown();
	}
	
	async function handleSignOut() {
		if (confirm('Are you sure you want to sign out?')) {
			await authService.signOut();
			closeDropdown();
		}
	}
	
	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.user-menu')) {
			isOpen = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="user-menu">
	<button 
		class="user-menu-trigger" 
		on:click={toggleDropdown}
		aria-expanded={isOpen}
		aria-haspopup="true"
	>
		<div class="user-avatar">
			{#if $user?.photoURL}
				<img src={$user.photoURL} alt={formatUserName($user)} />
			{:else}
				<span class="user-initial">{formatUserInitials($user)}</span>
			{/if}
		</div>
		<span class="user-name">{formatUserName($user)}</span>
		<i data-lucide="chevron-down" class="chevron" class:open={isOpen}></i>
	</button>
	
	{#if isOpen}
		<div class="user-dropdown">
			<button class="dropdown-item" on:click={handleProfile}>
				<i data-lucide="user"></i>
				Profile
			</button>
			<button class="dropdown-item" on:click={handleDashboard}>
				<i data-lucide="layout-dashboard"></i>
				Dashboard
			</button>
			<div class="dropdown-divider"></div>
			<button class="dropdown-item" on:click={handleSignOut}>
				<i data-lucide="log-out"></i>
				Sign Out
			</button>
		</div>
	{/if}
</div>

<style>
	.user-menu {
		position: relative;
	}

	.user-menu-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.user-menu-trigger:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.user-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.user-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.user-name {
		font-size: 0.875rem;
		font-weight: 500;
	}

	.chevron {
		width: 16px;
		height: 16px;
		transition: transform 0.2s ease;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.user-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.5rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
		min-width: 180px;
		z-index: 50;
		animation: fadeIn 0.15s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		color: #374151;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
		text-align: left;
	}

	.dropdown-item:hover {
		background: #f9fafb;
	}

	.dropdown-item:first-child {
		border-radius: 6px 6px 0 0;
	}

	.dropdown-item:last-child {
		border-radius: 0 0 6px 6px;
	}

	.dropdown-divider {
		height: 1px;
		background: #e5e7eb;
		margin: 0.25rem 0;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.user-dropdown {
			right: auto;
			left: 0;
		}
		
		.user-name {
			display: none;
		}
	}
</style>