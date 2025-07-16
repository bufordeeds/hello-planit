<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { isAuthenticated } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import LoginModal from '$lib/components/auth/LoginModal.svelte';
	
	let showLoginModal = false;
	let showEventMessage = false;
	
	// Check for sign-in required message
	$: if ($page.url.searchParams.get('message') === 'sign-in-required') {
		showEventMessage = true;
		showLoginModal = true;
	}
	
	function handleGetStarted() {
		if ($isAuthenticated) {
			goto('/dashboard');
		} else {
			showLoginModal = true;
		}
	}
	
	function handleLoginSuccess() {
		showLoginModal = false;
		// If there's a redirect URL, the auth store will handle it
		// Otherwise, go to dashboard
		if (!sessionStorage.getItem('redirectAfterAuth')) {
			goto('/dashboard');
		}
	}
	
	const features = [
		{
			icon: 'rocket',
			title: 'Mission Planning',
			description: 'Launch epic adventures with customizable mission templates for birthdays, expeditions, gatherings, and more.'
		},
		{
			icon: 'users',
			title: 'Crew Coordination',
			description: 'Assemble your crew and plan together. See updates instantly as everyone contributes to the mission.'
		},
		{
			icon: 'utensils',
			title: 'Fuel Management',
			description: 'Plan sustenance for your mission, assign crew cooking duties, and share recipes with your team.'
		},
		{
			icon: 'coins',
			title: 'Resource Allocation',
			description: 'Track mission resources, split costs automatically, and get settlement recommendations with integrated payments.'
		},
		{
			icon: 'shield-check',
			title: 'Secure Communications',
			description: 'Your missions are encrypted by default. Control crew access and permissions with military-grade security.'
		},
		{
			icon: 'satellite',
			title: 'Mobile Command Center',
			description: 'Command your missions anywhere with our responsive interface that works perfectly on all devices.'
		}
	];
</script>

<svelte:head>
	<title>Planit - Mission Control for Your Life's Greatest Adventures</title>
	<meta name="description" content="Launch epic adventures with your crew. Coordinate missions, track resources, and explore new frontiers together with Planit Mission Control." />
</svelte:head>

<div class="home">
	<!-- Event Access Message -->
	{#if showEventMessage}
		<div class="event-access-message">
			<div class="message-content">
				<div class="message-icon">
					<i data-lucide="lock"></i>
				</div>
				<div class="message-text">
					<h3>Sign in required</h3>
					<p>You need to join the crew or sign in to access this mission. It's quick and free!</p>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<h1 class="hero-title">
				Launch Adventures Together,<br />
				<span class="gradient-text">Effortlessly</span>
			</h1>
			<p class="hero-description">
				Coordinate missions, track resources, and organize epic adventures with your crew. 
				Real-time collaboration makes planning your next adventure fun and stress-free.
			</p>
			<div class="hero-actions">
				<button class="btn btn-primary btn-lg" on:click={handleGetStarted}>
					<i data-lucide="rocket"></i>
					{$isAuthenticated ? 'Launch Mission Control' : 'Begin Your Mission'}
				</button>
				<button class="btn btn-outline btn-lg" on:click={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
					<i data-lucide="info"></i>
					Learn More
				</button>
			</div>
		</div>
		<div class="hero-visual">
			<div class="hero-card">
				<div class="card-header">
					<h3>Bailey's Cosmic Beach Mission</h3>
					<span class="badge badge-success">Active Mission</span>
				</div>
				<div class="card-content">
					<div class="event-detail">
						<i data-lucide="calendar"></i>
						<span>July 25-27, 2024</span>
					</div>
					<div class="event-detail">
						<i data-lucide="map-pin"></i>
						<span>Palmilla Beach Resort</span>
					</div>
					<div class="event-detail">
						<i data-lucide="users"></i>
						<span>10 crew members</span>
					</div>
				</div>
				<div class="card-tabs">
					<div class="tab active">Fuel</div>
					<div class="tab">Resources</div>
					<div class="tab">Timeline</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="features" id="features">
		<div class="section-header">
			<h2>Everything You Need for Epic Adventures</h2>
			<p>Mission-critical features designed to make collaborative adventure planning simple and enjoyable.</p>
		</div>
		
		<div class="features-grid">
			{#each features as feature}
				<div class="feature-card">
					<div class="feature-icon">
						<i data-lucide={feature.icon}></i>
					</div>
					<h3>{feature.title}</h3>
					<p>{feature.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- CTA Section -->
	<section class="cta">
		<div class="cta-content">
			<h2>Ready to Launch Your First Mission?</h2>
			<p>Join thousands of adventurers who make mission planning epic with Planit.</p>
			<button class="btn btn-primary btn-lg" on:click={handleGetStarted}>
				<i data-lucide="rocket"></i>
				Get Started Free
			</button>
		</div>
	</section>
</div>

<!-- Login Modal -->
<LoginModal 
	bind:isOpen={showLoginModal}
	on:success={handleLoginSuccess}
/>

<style>
	.home {
		width: 100%;
	}

	/* Event Access Message */
	.event-access-message {
		background: #dbeafe;
		border: 1px solid #3b82f6;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.message-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.message-icon {
		width: 40px;
		height: 40px;
		background: #3b82f6;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.message-icon i {
		width: 20px;
		height: 20px;
	}

	.message-text h3 {
		color: #1e40af;
		margin: 0 0 0.25rem 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.message-text p {
		color: #1e40af;
		margin: 0;
		font-size: 0.875rem;
	}

	/* Hero Section */
	.hero {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
		min-height: 600px;
		margin-bottom: 6rem;
	}

	.hero-content {
		max-width: 500px;
	}

	.hero-title {
		font-size: 3rem;
		font-weight: 700;
		line-height: 1.1;
		margin-bottom: 1.5rem;
	}

	.gradient-text {
		background: linear-gradient(135deg, #00D4FF 0%, #FF6B9D 50%, #7209B7 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-description {
		font-size: 1.125rem;
		color: #6b7280;
		margin-bottom: 2rem;
		line-height: 1.7;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
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

	.btn-outline {
		background: rgba(248, 249, 255, 0.1);
		color: #E1E5F2;
		border: 2px solid rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(10px);
	}

	.btn-outline:hover {
		border-color: #00D4FF;
		background: rgba(0, 212, 255, 0.1);
	}

	/* Hero Visual */
	.hero-visual {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.hero-card {
		background: rgba(248, 249, 255, 0.1);
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 212, 255, 0.25);
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.18);
		max-width: 350px;
		width: 100%;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	.card-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
		color: #F8F9FF;
	}

	.card-content {
		margin-bottom: 1.5rem;
	}

	.event-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		color: #E1E5F2;
		font-size: 0.875rem;
	}

	.event-detail i {
		width: 16px;
		height: 16px;
	}

	.card-tabs {
		display: flex;
		gap: 0.5rem;
	}

	.tab {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		background: rgba(45, 27, 105, 0.4);
		color: #E1E5F2;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tab.active {
		background: linear-gradient(135deg, #00D4FF 0%, #7209B7 100%);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	/* Features Section */
	.features {
		margin-bottom: 6rem;
	}

	.section-header {
		text-align: center;
		margin-bottom: 4rem;
	}

	.section-header h2 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.section-header p {
		font-size: 1.125rem;
		color: #6b7280;
		max-width: 600px;
		margin: 0 auto;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.feature-card {
		text-align: center;
		padding: 2rem;
		border-radius: 12px;
		background: rgba(248, 249, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.18);
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
	}

	.feature-card:hover {
		box-shadow: 0 10px 25px -3px rgba(0, 212, 255, 0.3);
		transform: translateY(-4px);
		border-color: rgba(0, 212, 255, 0.5);
	}

	.feature-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 1.5rem;
		background: linear-gradient(135deg, #00D4FF 0%, #7209B7 100%);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		box-shadow: 0 8px 32px 0 rgba(0, 212, 255, 0.37);
	}

	.feature-icon i {
		width: 32px;
		height: 32px;
	}

	.feature-card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #F8F9FF;
	}

	.feature-card p {
		color: #E1E5F2;
		line-height: 1.6;
		margin: 0;
	}

	/* CTA Section */
	.cta {
		background: linear-gradient(135deg, #2D1B69 0%, #553C9A 50%, #7209B7 100%);
		color: white;
		text-align: center;
		padding: 4rem 2rem;
		border-radius: 16px;
		margin-bottom: 4rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 8px 32px 0 rgba(114, 9, 183, 0.37);
	}

	.cta-content h2 {
		color: white;
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.cta-content p {
		font-size: 1.125rem;
		opacity: 0.9;
		margin-bottom: 2rem;
		max-width: 500px;
		margin-left: auto;
		margin-right: auto;
	}

	.cta .btn-primary {
		background: rgba(248, 249, 255, 0.95);
		color: #7209B7;
		box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(114, 9, 183, 0.3);
	}

	.cta .btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px 0 rgba(114, 9, 183, 0.4);
		color: #553C9A;
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

	.badge-success {
		background-color: #d1fae5;
		color: #065f46;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.hero {
			grid-template-columns: 1fr;
			gap: 2rem;
			text-align: center;
			min-height: auto;
		}

		.hero-title {
			font-size: 2.5rem;
		}

		.hero-actions {
			justify-content: center;
		}

		.hero-visual {
			order: -1;
		}

		.section-header h2 {
			font-size: 2rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}

		.cta-content h2 {
			font-size: 2rem;
		}

		.cta {
			padding: 3rem 1rem;
		}
	}
</style>