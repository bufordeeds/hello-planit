<script>
	import { createEventDispatcher } from 'svelte';
	import { authService, error as authError, loading } from '$lib/stores/auth.js';
	
	const dispatch = createEventDispatcher();
	
	export let isOpen = false;
	export let mode = 'signin'; // 'signin' or 'signup'
	
	let formData = {
		name: '',
		email: '',
		password: '',
		confirmPassword: ''
	};
	let validationErrors = {};
	let showPassword = false;
	
	// Clear form when modal opens/closes
	$: if (isOpen) {
		formData = { name: '', email: '', password: '', confirmPassword: '' };
		validationErrors = {};
		authService.clearError();
	}
	
	function toggleMode() {
		mode = mode === 'signin' ? 'signup' : 'signin';
		validationErrors = {};
		authService.clearError();
	}
	
	function validateForm() {
		validationErrors = {};
		
		if (!formData.email) {
			validationErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			validationErrors.email = 'Email is invalid';
		}
		
		if (!formData.password) {
			validationErrors.password = 'Password is required';
		} else if (formData.password.length < 6) {
			validationErrors.password = 'Password must be at least 6 characters';
		}
		
		if (mode === 'signup') {
			if (!formData.name || formData.name.trim().length < 2) {
				validationErrors.name = 'Name must be at least 2 characters';
			}
			
			if (formData.password !== formData.confirmPassword) {
				validationErrors.confirmPassword = 'Passwords do not match';
			}
		}
		
		return Object.keys(validationErrors).length === 0;
	}
	
	async function handleSubmit() {
		if (!validateForm()) return;
		
		try {
			let result;
			if (mode === 'signup') {
				result = await authService.signUpWithEmail(
					formData.email, 
					formData.password, 
					formData.name.trim()
				);
			} else {
				result = await authService.signInWithEmail(formData.email, formData.password);
			}
			
			if (result.user) {
				isOpen = false;
				dispatch('success', result.user);
			}
		} catch (err) {
			console.error('Auth error:', err);
		}
	}
	
	async function handleGoogleSignIn() {
		try {
			const result = await authService.signInWithGoogle();
			if (result.user) {
				isOpen = false;
				dispatch('success', result.user);
			}
		} catch (err) {
			console.error('Google sign in error:', err);
		}
	}
	
	async function handleForgotPassword() {
		if (!formData.email) {
			validationErrors.email = 'Please enter your email address';
			return;
		}
		
		const result = await authService.sendPasswordReset(formData.email);
		if (!result.error) {
			alert('Password reset email sent! Check your inbox.');
		}
	}
	
	function handleOverlayClick(event) {
		if (event.target === event.currentTarget) {
			isOpen = false;
		}
	}
	
	function handleKeydown(event) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="auth-modal" on:click={handleOverlayClick} role="dialog" aria-modal="true">
		<div class="auth-modal-content">
			<button 
				class="auth-modal-close" 
				on:click={() => isOpen = false}
				aria-label="Close"
			>
				<i data-lucide="x"></i>
			</button>
			
			<div class="auth-modal-header">
				<h2>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
				<p>{mode === 'signup' ? 'Sign up to start planning events' : 'Sign in to your account'}</p>
			</div>

			<form class="auth-form" on:submit|preventDefault={handleSubmit}>
				{#if $authError}
					<div class="auth-error">{$authError}</div>
				{/if}
				
				{#if mode === 'signup'}
					<div class="form-group">
						<label for="authName">Name *</label>
						<input 
							type="text" 
							id="authName" 
							bind:value={formData.name}
							placeholder="Enter your name"
							class:error={validationErrors.name}
							required 
						/>
						{#if validationErrors.name}
							<span class="field-error">{validationErrors.name}</span>
						{/if}
					</div>
				{/if}
				
				<div class="form-group">
					<label for="authEmail">Email *</label>
					<input 
						type="email" 
						id="authEmail" 
						bind:value={formData.email}
						placeholder="Enter your email"
						class:error={validationErrors.email}
						required 
					/>
					{#if validationErrors.email}
						<span class="field-error">{validationErrors.email}</span>
					{/if}
				</div>
				
				<div class="form-group">
					<label for="authPassword">Password *</label>
					<div class="password-input">
						<input 
							type={showPassword ? 'text' : 'password'}
							id="authPassword" 
							bind:value={formData.password}
							placeholder="Enter your password"
							class:error={validationErrors.password}
							minlength="6"
							required 
						/>
						<button 
							type="button"
							class="password-toggle"
							on:click={() => showPassword = !showPassword}
						>
							<i data-lucide={showPassword ? 'eye-off' : 'eye'}></i>
						</button>
					</div>
					{#if validationErrors.password}
						<span class="field-error">{validationErrors.password}</span>
					{/if}
				</div>

				{#if mode === 'signup'}
					<div class="form-group">
						<label for="authConfirmPassword">Confirm Password *</label>
						<input 
							type="password" 
							id="authConfirmPassword" 
							bind:value={formData.confirmPassword}
							placeholder="Confirm your password"
							class:error={validationErrors.confirmPassword}
							required 
						/>
						{#if validationErrors.confirmPassword}
							<span class="field-error">{validationErrors.confirmPassword}</span>
						{/if}
					</div>
				{/if}

				{#if mode === 'signin'}
					<button 
						type="button" 
						class="auth-link forgot-password"
						on:click={handleForgotPassword}
					>
						Forgot password?
					</button>
				{/if}

				<button 
					type="submit" 
					class="btn btn-primary auth-submit"
					disabled={$loading}
				>
					{#if $loading}
						Loading...
					{:else}
						{mode === 'signup' ? 'Create Account' : 'Sign In'}
					{/if}
				</button>
			</form>

			<div class="auth-divider">
				<span>or</span>
			</div>

			<button 
				class="btn btn-google" 
				on:click={handleGoogleSignIn}
				disabled={$loading}
			>
				<svg viewBox="0 0 24 24" width="20" height="20">
					<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
					<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
					<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
					<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
				</svg>
				Continue with Google
			</button>

			<div class="auth-switch">
				{#if mode === 'signin'}
					Don't have an account? 
					<button class="auth-link" on:click={toggleMode}>Sign up</button>
				{:else}
					Already have an account? 
					<button class="auth-link" on:click={toggleMode}>Sign in</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.auth-modal {
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
	}

	.auth-modal-content {
		position: relative;
		background: white;
		border-radius: 12px;
		padding: 2rem;
		width: 90%;
		max-width: 400px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.auth-modal-close {
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
	}

	.auth-modal-close:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.auth-modal-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.auth-modal-header h2 {
		margin: 0 0 0.5rem 0;
		color: #111827;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.auth-modal-header p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.form-group input {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group input.error {
		border-color: #dc2626;
	}

	.password-input {
		position: relative;
	}

	.password-toggle {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 0.25rem;
	}

	.field-error {
		color: #dc2626;
		font-size: 0.75rem;
	}

	.auth-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.auth-submit {
		margin-top: 0.5rem;
	}

	.auth-link {
		background: none;
		border: none;
		color: #3b82f6;
		font-size: 0.875rem;
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
		text-align: left;
	}

	.auth-link:hover {
		color: #2563eb;
	}

	.forgot-password {
		align-self: flex-end;
		margin-bottom: 0.5rem;
	}

	.auth-divider {
		position: relative;
		text-align: center;
		margin: 1.5rem 0;
	}

	.auth-divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: #e5e7eb;
	}

	.auth-divider span {
		background: white;
		color: #6b7280;
		padding: 0 1rem;
		font-size: 0.875rem;
	}

	.btn {
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-google {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-google:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	.auth-switch {
		text-align: center;
		margin-top: 1.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.auth-modal-content {
			width: 95%;
			margin: 1rem;
		}
	}
</style>