<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	const dispatch = createEventDispatcher();
	
	export let isOpen = false;
	export let event = null;
	
	let shareUrl = '';
	let copied = false;
	
	$: if (isOpen && event && browser) {
		shareUrl = `${window.location.origin}/events/${event.id}`;
	}
	
	onMount(() => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
	});
	
	function handleClose() {
		dispatch('close');
	}
	
	function handleOverlayClick(event) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
	
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
	
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			// Fallback for browsers that don't support clipboard API
			const textArea = document.createElement('textarea');
			textArea.value = shareUrl;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}
	
	function shareViaEmail() {
		const subject = encodeURIComponent(`Join me at ${event.metadata?.name}`);
		const body = encodeURIComponent(`Hi! I'd like to invite you to join my event "${event.metadata?.name}". 

Event Details:
- Name: ${event.metadata?.name}
- Date: ${event.metadata?.dates}
${event.metadata?.location ? `- Location: ${event.metadata?.location}` : ''}
${event.metadata?.description ? `- Description: ${event.metadata?.description}` : ''}

Click here to view and join the event: ${shareUrl}

Thanks!`);
		
		window.open(`mailto:?subject=${subject}&body=${body}`);
	}
	
	function shareViaWhatsApp() {
		const text = encodeURIComponent(`Join me at ${event.metadata?.name}! ${shareUrl}`);
		window.open(`https://wa.me/?text=${text}`);
	}
	
	function shareViaTwitter() {
		const text = encodeURIComponent(`Join me at ${event.metadata?.name}!`);
		window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`);
	}
	
	function shareViaFacebook() {
		window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="share-modal" on:click={handleOverlayClick} role="dialog" aria-modal="true">
		<div class="share-modal-content">
			<button 
				class="share-modal-close" 
				on:click={handleClose}
				aria-label="Close"
			>
				<i data-lucide="x"></i>
			</button>
			
			<div class="share-modal-header">
				<div class="share-icon">
					<i data-lucide="share-2"></i>
				</div>
				<h2>Share Event</h2>
				<p>Invite others to join "{event?.metadata?.name}"</p>
			</div>

			<div class="share-content">
				<!-- Copy Link Section -->
				<div class="share-section">
					<h3>Share Link</h3>
					<div class="share-url">
						<input 
							type="text" 
							value={shareUrl} 
							readonly 
							class="url-input"
						/>
						<button 
							class="copy-btn" 
							on:click={copyToClipboard}
							class:copied
						>
							{#if copied}
								<i data-lucide="check"></i>
								Copied!
							{:else}
								<i data-lucide="copy"></i>
								Copy
							{/if}
						</button>
					</div>
				</div>
				
				<!-- Social Share Section -->
				<div class="share-section">
					<h3>Share via</h3>
					<div class="share-buttons">
						<button class="share-btn email" on:click={shareViaEmail}>
							<i data-lucide="mail"></i>
							<span>Email</span>
						</button>
						
						<button class="share-btn whatsapp" on:click={shareViaWhatsApp}>
							<i data-lucide="message-circle"></i>
							<span>WhatsApp</span>
						</button>
						
						<button class="share-btn twitter" on:click={shareViaTwitter}>
							<i data-lucide="twitter"></i>
							<span>Twitter</span>
						</button>
						
						<button class="share-btn facebook" on:click={shareViaFacebook}>
							<i data-lucide="facebook"></i>
							<span>Facebook</span>
						</button>
					</div>
				</div>
				
				<!-- Event Info Section -->
				<div class="share-section">
					<h3>Event Information</h3>
					<div class="event-preview">
						<div class="event-preview-header">
							<h4>{event?.metadata?.name}</h4>
							<span class="event-type">{event?.metadata?.type || 'general'}</span>
						</div>
						
						<div class="event-preview-details">
							{#if event?.metadata?.dates}
								<div class="event-detail">
									<i data-lucide="calendar"></i>
									<span>{event.metadata.dates}</span>
								</div>
							{/if}
							
							{#if event?.metadata?.location}
								<div class="event-detail">
									<i data-lucide="map-pin"></i>
									<span>{event.metadata.location}</span>
								</div>
							{/if}
							
							<div class="event-detail">
								<i data-lucide="users"></i>
								<span>{Object.keys(event?.members || {}).length} member{Object.keys(event?.members || {}).length !== 1 ? 's' : ''}</span>
							</div>
							
							<div class="event-detail">
								<i data-lucide="lock"></i>
								<span>{event?.settings?.privacy || 'private'} event</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.share-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.share-modal-content {
		position: relative;
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
	}

	.share-modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		color: #6b7280;
		transition: all 0.2s ease;
		z-index: 10;
	}

	.share-modal-close:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.share-modal-header {
		padding: 2rem;
		border-bottom: 1px solid #e5e7eb;
		text-align: center;
	}

	.share-icon {
		width: 60px;
		height: 60px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1rem;
		color: white;
	}

	.share-icon i {
		width: 24px;
		height: 24px;
	}

	.share-modal-header h2 {
		margin: 0 0 0.5rem 0;
		color: #111827;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.share-modal-header p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.share-content {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.share-section h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
	}

	.share-url {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.url-input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		background: #f9fafb;
		color: #6b7280;
	}

	.copy-btn {
		padding: 0.75rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		background: white;
		color: #374151;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.copy-btn:hover {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.copy-btn.copied {
		background: #d1fae5;
		border-color: #10b981;
		color: #065f46;
	}

	.copy-btn i {
		width: 16px;
		height: 16px;
	}

	.share-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.share-btn {
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
	}

	.share-btn:hover {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	.share-btn i {
		width: 20px;
		height: 20px;
	}

	.share-btn span {
		font-weight: 500;
		color: #374151;
	}

	.share-btn.email {
		color: #dc2626;
	}

	.share-btn.whatsapp {
		color: #10b981;
	}

	.share-btn.twitter {
		color: #1d9bf0;
	}

	.share-btn.facebook {
		color: #1877f2;
	}

	.event-preview {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
	}

	.event-preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.event-preview-header h4 {
		margin: 0;
		color: #111827;
		font-size: 1rem;
		font-weight: 600;
	}

	.event-type {
		background: #3b82f6;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.event-preview-details {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.event-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.event-detail i {
		width: 16px;
		height: 16px;
		color: #9ca3af;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.share-modal {
			padding: 0.5rem;
		}
		
		.share-modal-content {
			max-height: 95vh;
		}
		
		.share-modal-header,
		.share-content {
			padding: 1.5rem 1rem;
		}
		
		.share-buttons {
			grid-template-columns: 1fr;
		}
		
		.share-url {
			flex-direction: column;
			align-items: stretch;
		}
		
		.event-preview-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>