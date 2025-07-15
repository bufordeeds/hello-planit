<script>
	import { isAuthenticated } from '$lib/stores/auth.js';
	import { goto } from '$app/navigation';
	import LoginModal from '$lib/components/auth/LoginModal.svelte';
	
	let showLoginModal = false;
	
	function handleGetStarted() {
		if ($isAuthenticated) {
			goto('/dashboard');
		} else {
			showLoginModal = true;
		}
	}
	
	function handleLoginSuccess() {
		showLoginModal = false;
		goto('/dashboard');
	}
	
	const features = [
		{
			icon: 'calendar',
			title: 'Event Planning',
			description: 'Create and organize events with customizable templates for birthdays, vacations, business meetings, and more.'
		},
		{
			icon: 'users',
			title: 'Real-time Collaboration',
			description: 'Invite friends and family to plan together. See changes instantly as everyone contributes to the plan.'
		},
		{
			icon: 'utensils',
			title: 'Meal Planning',
			description: 'Plan meals for your event, assign who\'s cooking what, and share recipes with the group.'
		},
		{
			icon: 'dollar-sign',
			title: 'Expense Tracking',
			description: 'Track shared expenses, split costs automatically, and get settlement recommendations with Venmo integration.'
		},
		{
			icon: 'shield-check',
			title: 'Secure & Private',
			description: 'Your events are private by default. Control who can view and edit with role-based permissions.'
		},
		{
			icon: 'smartphone',
			title: 'Mobile Friendly',
			description: 'Plan on the go with our responsive design that works perfectly on all devices.'
		}
	];
</script>

<svelte:head>
	<title>Planit - Collaborative Event Planning Made Easy</title>
	<meta name="description" content="Plan events with friends and family in real-time. Coordinate meals, track expenses, and organize activities together with Planit." />
</svelte:head>

<div class="home">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<h1 class="hero-title">
				Plan Events Together,<br />
				<span class="gradient-text">Effortlessly</span>
			</h1>
			<p class="hero-description">
				Coordinate meals, track expenses, and organize activities with friends and family. 
				Real-time collaboration makes event planning fun and stress-free.
			</p>
			<div class="hero-actions">
				<button class="btn btn-primary btn-lg" on:click={handleGetStarted}>
					<i data-lucide="calendar-plus"></i>
					{$isAuthenticated ? 'Go to Dashboard' : 'Start Planning Free'}
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
					<h3>Bailey's Birthday Beach Weekend</h3>
					<span class="badge badge-success">Active</span>
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
						<span>10 people planning</span>
					</div>
				</div>
				<div class="card-tabs">
					<div class="tab active">Meals</div>
					<div class="tab">Expenses</div>
					<div class="tab">Itinerary</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="features" id="features">
		<div class="section-header">
			<h2>Everything You Need to Plan Together</h2>
			<p>Powerful features designed to make collaborative event planning simple and enjoyable.</p>
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
			<h2>Ready to Start Planning?</h2>
			<p>Join thousands of people who make event planning fun with Planit.</p>
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.39);
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px 0 rgba(102, 126, 234, 0.5);
	}

	.btn-outline {
		background: transparent;
		color: #374151;
		border: 2px solid #e5e7eb;
	}

	.btn-outline:hover {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	/* Hero Visual */
	.hero-visual {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.hero-card {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		border: 1px solid #e5e7eb;
		max-width: 350px;
		width: 100%;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.card-header h3 {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;
	}

	.card-content {
		margin-bottom: 1.5rem;
	}

	.event-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		color: #6b7280;
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
		background: #f3f4f6;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tab.active {
		background: #3b82f6;
		color: white;
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
		background: white;
		border: 1px solid #e5e7eb;
		transition: all 0.2s ease;
	}

	.feature-card:hover {
		box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
		transform: translateY(-4px);
	}

	.feature-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.feature-icon i {
		width: 32px;
		height: 32px;
	}

	.feature-card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.feature-card p {
		color: #6b7280;
		line-height: 1.6;
		margin: 0;
	}

	/* CTA Section */
	.cta {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		text-align: center;
		padding: 4rem 2rem;
		border-radius: 16px;
		margin-bottom: 4rem;
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
		background: white;
		color: #667eea;
		box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.1);
	}

	.cta .btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.15);
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