<script>
	import { onMount } from 'svelte';
	import { database } from '$lib/config/firebase.js';
	import { ref, set, get } from 'firebase/database';
	
	let status = 'Checking Firebase...';
	let databaseUrl = '';
	let error = null;
	let testResult = null;
	
	onMount(async () => {
		try {
			// Check if database is initialized
			if (!database) {
				status = 'Database not initialized';
				return;
			}
			
			status = 'Database initialized';
			
			// Try to read from root
			const rootRef = ref(database);
			const snapshot = await get(rootRef);
			
			if (snapshot.exists()) {
				status = 'Successfully connected to database';
				testResult = 'Database has data';
			} else {
				status = 'Connected but database is empty';
				testResult = 'No data found';
			}
			
			// Get database URL from config
			const config = database._repoInternal?.repoInfo_;
			if (config) {
				databaseUrl = `https://${config.host}`;
			}
			
		} catch (err) {
			status = 'Failed to connect';
			error = err.message;
			console.error('Database error:', err);
		}
	});
</script>

<svelte:head>
	<title>Firebase Debug - Planit</title>
</svelte:head>

<div class="debug-page">
	<h1>Firebase Debug Page</h1>
	
	<div class="debug-info">
		<div class="info-item">
			<strong>Status:</strong>
			<span class:success={status.includes('Success')} class:error={status.includes('Failed')}>
				{status}
			</span>
		</div>
		
		{#if databaseUrl}
			<div class="info-item">
				<strong>Database URL:</strong>
				<code>{databaseUrl}</code>
			</div>
		{/if}
		
		{#if testResult}
			<div class="info-item">
				<strong>Test Result:</strong>
				<span>{testResult}</span>
			</div>
		{/if}
		
		{#if error}
			<div class="error-box">
				<strong>Error:</strong>
				<pre>{error}</pre>
			</div>
		{/if}
	</div>
	
	<div class="debug-actions">
		<button on:click={() => window.location.reload()}>Refresh</button>
		<a href="/dashboard" class="btn">Back to Dashboard</a>
	</div>
</div>

<style>
	.debug-page {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
	}
	
	h1 {
		color: #111827;
		margin-bottom: 2rem;
	}
	
	.debug-info {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}
	
	.info-item {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
		align-items: flex-start;
	}
	
	.info-item:last-child {
		margin-bottom: 0;
	}
	
	.info-item strong {
		min-width: 120px;
		color: #374151;
	}
	
	.info-item code {
		background: #e5e7eb;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
	}
	
	.success {
		color: #059669;
		font-weight: 600;
	}
	
	.error {
		color: #dc2626;
		font-weight: 600;
	}
	
	.error-box {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 1rem;
		margin-top: 1rem;
	}
	
	.error-box pre {
		margin: 0.5rem 0 0 0;
		white-space: pre-wrap;
		word-break: break-word;
		font-size: 0.875rem;
		color: #991b1b;
	}
	
	.debug-actions {
		display: flex;
		gap: 1rem;
	}
	
	button, .btn {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
		text-decoration: none;
		display: inline-block;
		transition: all 0.2s;
	}
	
	button:hover, .btn:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}
</style>