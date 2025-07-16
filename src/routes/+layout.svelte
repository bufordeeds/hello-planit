<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { user, isAuthenticated, loading } from '$lib/stores/auth.js';
	import LoginModal from '$lib/components/auth/LoginModal.svelte';
	import UserMenu from '$lib/components/auth/UserMenu.svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import '$lib/styles/global.css';

	// Inject Vercel Analytics
	injectAnalytics();

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
					<h1>🚀 Planit</h1>
					<span class="brand-tagline">Mission Control for Life's Adventures</span>
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
							Join Crew
						</button>
						<button class="btn btn-primary" on:click={handleShowLogin}>
							Launch Mission
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
			<p>&copy; 2025 Planit. Mission Control for Life's Greatest Adventures.</p>
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
		background: rgba(11, 20, 38, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		backdrop-filter: blur(5px);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		position: relative;
		display: inline-block;
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

	.header {
		background: linear-gradient(135deg, #0B1426 0%, #2D1B69 50%, #553C9A 100%);
		color: white;
		padding: 1rem 0;
		box-shadow: 0 4px 6px -1px rgba(0, 212, 255, 0.2);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
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
		background: linear-gradient(135deg, #00D4FF 0%, #7209B7 100%);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-primary:hover {
		box-shadow: 0 4px 14px 0 rgba(0, 212, 255, 0.5);
		transform: translateY(-1px);
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
		background: rgba(11, 20, 38, 0.9);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding: 2rem 0;
		margin-top: auto;
		backdrop-filter: blur(10px);
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
		color: #E1E5F2;
		font-size: 0.875rem;
	}

	.footer-links {
		display: flex;
		gap: 1.5rem;
	}

	.footer-links a {
		color: #E1E5F2;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s ease;
	}

	.footer-links a:hover {
		color: #00D4FF;
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