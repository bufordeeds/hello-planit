<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user, isAuthenticated, loading } from '$lib/stores/auth.js';
	import LoginModal from '$lib/components/auth/LoginModal.svelte';
	import UserMenu from '$lib/components/auth/UserMenu.svelte';
	import '$lib/styles/global.css';

	let showLoginModal = false;

	// Initialize Lucide icons when component mounts
	onMount(() => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
	});

	function handleShowLogin() {
		showLoginModal = true;
	}

	function handleLoginSuccess() {
		showLoginModal = false;
	}

	function handleProfile() {
		// Navigate to profile - will implement later
		console.log('Navigate to profile');
	}

	function handleDashboard() {
		// Navigate to dashboard
		window.location.href = '/dashboard';
	}
</script>

<div class="app">
	<!-- Global loading indicator -->
	{#if $loading}
		<div class="loading-overlay">
			<div class="loading-spinner"></div>
		</div>
	{/if}

	<!-- Header -->
	<header class="header">
		<div class="header-content">
			<div class="brand">
				<a href="/" class="brand-link">
					<h1>Planit</h1>
					<span class="brand-tagline">Collaborative Event Planning</span>
				</a>
			</div>

			<div class="header-actions">
				{#if $isAuthenticated}
					<UserMenu
						on:profile={handleProfile}
						on:dashboard={handleDashboard}
					/>
				{:else}
					<div class="auth-buttons">
						<button class="btn btn-outline" on:click={handleShowLogin}>
							Sign In
						</button>
						<button class="btn btn-primary" on:click={handleShowLogin}>
							Get Started
						</button>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="main">
		<slot />
	</main>

	<!-- Footer -->
	<footer class="footer">
		<div class="footer-content">
			<p>&copy; 2025 Planit. Built for seamless event collaboration.</p>
			<div class="footer-links">
				<a href="/privacy">Privacy</a>
				<a href="/terms">Terms</a>
				<a href="mailto:support@hello-planit.com">Support</a>
			</div>
		</div>
	</footer>

	<!-- Login Modal -->
	<LoginModal
		bind:isOpen={showLoginModal}
		on:success={handleLoginSuccess}
	/>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 1rem 0;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand-link {
		color: inherit;
		text-decoration: none;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.brand h1 {
		margin: 0;
		font-size: 2rem;
		font-weight: 700;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.brand-tagline {
		font-size: 0.875rem;
		opacity: 0.9;
		margin-top: -0.25rem;
	}

	.auth-buttons {
		display: flex;
		gap: 0.75rem;
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
		background: transparent;
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.btn-outline:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.main {
		flex: 1;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
		width: 100%;
	}

	.footer {
		background: #f9fafb;
		border-top: 1px solid #e5e7eb;
		padding: 2rem 0;
		margin-top: auto;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.footer-content p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.footer-links {
		display: flex;
		gap: 1.5rem;
	}

	.footer-links a {
		color: #6b7280;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s ease;
	}

	.footer-links a:hover {
		color: #374151;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.brand h1 {
			font-size: 1.5rem;
		}

		.auth-buttons {
			width: 100%;
			justify-content: center;
		}

		.main {
			padding: 1rem;
		}

		.footer-content {
			flex-direction: column;
			text-align: center;
		}
	}
</style>