<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { sanitizeInput } from '$lib/utils/validation.js';
	
	const dispatch = createEventDispatcher();
	
	export let isOpen = false;
	export let editingExpense = null;
	export let categories = [];
	export let members = {};
	export let loading = false;
	
	let formData = {
		name: '',
		description: '',
		amount: '',
		category: 'other',
		paidBy: '',
		date: '',
		receipt: null,
	};
	
	let error = null;
	let fileInput;
	
	// Reset form when modal opens or editing expense changes
	$: if (isOpen) {
		resetForm();
	}
	
	onMount(() => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
		
		// Set default date to today
		const today = new Date().toISOString().split('T')[0];
		formData.date = today;
		
		// Set default payer to first member if available
		const memberIds = Object.keys(members);
		if (memberIds.length > 0) {
			formData.paidBy = memberIds[0];
		}
	});
	
	function resetForm() {
		if (editingExpense) {
			formData = {
				name: editingExpense.name || '',
				description: editingExpense.description || '',
				amount: editingExpense.amount || '',
				category: editingExpense.category || 'other',
				paidBy: editingExpense.paidBy || '',
				date: editingExpense.date ? editingExpense.date.split('T')[0] : '',
				receipt: null,
			};
		} else {
			const today = new Date().toISOString().split('T')[0];
			const memberIds = Object.keys(members);
			
			formData = {
				name: '',
				description: '',
				amount: '',
				category: 'other',
				paidBy: memberIds.length > 0 ? memberIds[0] : '',
				date: today,
				receipt: null,
			};
		}
		error = null;
		
		// Reset file input
		if (fileInput) {
			fileInput.value = '';
		}
	}
	
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
	
	function validateForm() {
		error = null;
		
		if (!formData.name || formData.name.trim().length < 2) {
			error = 'Expense name must be at least 2 characters long';
			return false;
		}
		
		if (formData.name.length > 100) {
			error = 'Expense name cannot exceed 100 characters';
			return false;
		}
		
		if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
			error = 'Amount must be a positive number';
			return false;
		}
		
		if (parseFloat(formData.amount) > 999999.99) {
			error = 'Amount cannot exceed $999,999.99';
			return false;
		}
		
		if (formData.description && formData.description.length > 500) {
			error = 'Description cannot exceed 500 characters';
			return false;
		}
		
		if (!formData.category) {
			error = 'Please select a category';
			return false;
		}
		
		if (!formData.paidBy) {
			error = 'Please select who paid for this expense';
			return false;
		}
		
		if (!formData.date) {
			error = 'Please select a date';
			return false;
		}
		
		return true;
	}
	
	function handleFileChange(event) {
		const file = event.target.files[0];
		if (file) {
			// Validate file type
			const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
			if (!allowedTypes.includes(file.type)) {
				error = 'Please upload a valid image (JPEG, PNG, GIF) or PDF file';
				event.target.value = '';
				return;
			}
			
			// Validate file size (5MB max)
			if (file.size > 5 * 1024 * 1024) {
				error = 'File size cannot exceed 5MB';
				event.target.value = '';
				return;
			}
			
			formData.receipt = file;
			error = null;
		}
	}
	
	function removeReceipt() {
		formData.receipt = null;
		if (fileInput) {
			fileInput.value = '';
		}
	}
	
	function handleSubmit() {
		if (!validateForm()) {
			return;
		}
		
		const sanitizedData = {
			name: sanitizeInput(formData.name, 100),
			description: sanitizeInput(formData.description, 500),
			amount: parseFloat(formData.amount),
			category: formData.category,
			paidBy: formData.paidBy,
			date: formData.date,
			receipt: formData.receipt,
		};
		
		dispatch('submit', sanitizedData);
	}
	
	function getCategoryIcon(categoryValue) {
		const category = categories.find(cat => cat.value === categoryValue);
		return category ? category.icon : 'more-horizontal';
	}
	
	function getMemberName(memberId) {
		if (!memberId || !members[memberId]) return 'Unknown';
		return members[memberId].name || members[memberId].email || 'Unknown';
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<div class="expense-form-modal" on:click={handleOverlayClick} role="dialog" aria-modal="true">
		<div class="expense-form-content">
			<button 
				class="expense-form-close" 
				on:click={handleClose}
				aria-label="Close"
			>
				<i data-lucide="x"></i>
			</button>
			
			<div class="expense-form-header">
				<h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
				<p>Track and manage your event expenses</p>
			</div>

			<form class="expense-form" on:submit|preventDefault={handleSubmit}>
				{#if error}
					<div class="form-error">{error}</div>
				{/if}
				
				<!-- Basic Information -->
				<div class="form-section">
					<h3>Basic Information</h3>
					
					<div class="form-group">
						<label for="expenseName">Expense Name *</label>
						<input 
							type="text" 
							id="expenseName" 
							bind:value={formData.name}
							placeholder="Enter expense name"
							required 
							maxlength="100"
						/>
					</div>
					
					<div class="form-group">
						<label for="expenseAmount">Amount *</label>
						<div class="input-with-prefix">
							<span class="input-prefix">$</span>
							<input 
								type="number" 
								id="expenseAmount" 
								bind:value={formData.amount}
								placeholder="0.00"
								required
								min="0.01"
								max="999999.99"
								step="0.01"
							/>
						</div>
					</div>
					
					<div class="form-group">
						<label for="expenseDescription">Description</label>
						<textarea 
							id="expenseDescription" 
							bind:value={formData.description}
							placeholder="Add details about this expense (optional)" 
							rows="3"
							maxlength="500"
						></textarea>
						<small>{formData.description.length}/500 characters</small>
					</div>
				</div>
				
				<!-- Category & Details -->
				<div class="form-section">
					<h3>Category & Details</h3>
					
					<div class="form-group">
						<label for="expenseCategory">Category *</label>
						<div class="category-select">
							{#each categories as category}
								<label class="category-option" class:selected={formData.category === category.value}>
									<input 
										type="radio" 
										bind:group={formData.category} 
										value={category.value}
									/>
									<div class="category-content">
										<i data-lucide={category.icon}></i>
										<span>{category.label}</span>
									</div>
								</label>
							{/each}
						</div>
					</div>
					
					<div class="form-row">
						<div class="form-group">
							<label for="expensePaidBy">Paid By *</label>
							<select id="expensePaidBy" bind:value={formData.paidBy} required>
								<option value="">Select member</option>
								{#each Object.entries(members) as [memberId, member]}
									<option value={memberId}>{getMemberName(memberId)}</option>
								{/each}
							</select>
						</div>
						
						<div class="form-group">
							<label for="expenseDate">Date *</label>
							<input 
								type="date" 
								id="expenseDate" 
								bind:value={formData.date}
								required
							/>
						</div>
					</div>
				</div>
				
				<!-- Receipt Upload -->
				<div class="form-section">
					<h3>Receipt (Optional)</h3>
					
					<div class="form-group">
						<label for="expenseReceipt">Upload Receipt</label>
						<div class="file-upload">
							{#if formData.receipt}
								<div class="file-preview">
									<div class="file-info">
										<i data-lucide="file"></i>
										<span class="file-name">{formData.receipt.name}</span>
										<span class="file-size">({(formData.receipt.size / 1024 / 1024).toFixed(1)} MB)</span>
									</div>
									<button 
										type="button" 
										class="btn-remove" 
										on:click={removeReceipt}
										title="Remove receipt"
									>
										<i data-lucide="x"></i>
									</button>
								</div>
							{:else}
								<div class="file-input-wrapper">
									<input 
										type="file" 
										id="expenseReceipt"
										bind:this={fileInput}
										on:change={handleFileChange}
										accept="image/jpeg,image/png,image/gif,application/pdf"
									/>
									<label for="expenseReceipt" class="file-input-label">
										<i data-lucide="upload"></i>
										<span>Choose file or drag and drop</span>
										<small>Images (JPEG, PNG, GIF) or PDF, max 5MB</small>
									</label>
								</div>
							{/if}
						</div>
					</div>
				</div>
				
				<div class="form-actions">
					<button 
						type="button" 
						class="btn btn-outline" 
						on:click={handleClose}
						disabled={loading}
					>
						Cancel
					</button>
					
					<button 
						type="submit" 
						class="btn btn-primary" 
						disabled={loading}
					>
						{#if loading}
							{editingExpense ? 'Updating...' : 'Adding...'}
						{:else}
							{editingExpense ? 'Update Expense' : 'Add Expense'}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.expense-form-modal {
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

	.expense-form-content {
		position: relative;
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
	}

	.expense-form-close {
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

	.expense-form-close:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.expense-form-header {
		padding: 2rem 2rem 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.expense-form-header h2 {
		margin: 0 0 0.5rem 0;
		color: #111827;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.expense-form-header p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.expense-form {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.form-error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-section h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #f3f4f6;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
		background: white;
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-group small {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.input-with-prefix {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-prefix {
		position: absolute;
		left: 0.75rem;
		color: #6b7280;
		font-size: 0.875rem;
		z-index: 1;
		pointer-events: none;
	}

	.input-with-prefix input {
		padding-left: 2rem;
	}

	.category-select {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 0.75rem;
	}

	.category-option {
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: center;
	}

	.category-option:hover {
		border-color: #d1d5db;
		background: #f9fafb;
	}

	.category-option.selected {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.category-option input[type="radio"] {
		display: none;
	}

	.category-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.category-content i {
		width: 24px;
		height: 24px;
		color: #6b7280;
	}

	.category-option.selected .category-content i {
		color: #3b82f6;
	}

	.category-content span {
		font-size: 0.75rem;
		font-weight: 500;
		color: #374151;
	}

	.file-upload {
		border: 2px dashed #d1d5db;
		border-radius: 8px;
		overflow: hidden;
		transition: border-color 0.2s ease;
	}

	.file-upload:hover {
		border-color: #9ca3af;
	}

	.file-input-wrapper {
		position: relative;
	}

	.file-input-wrapper input[type="file"] {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}

	.file-input-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.file-input-label:hover {
		background: #f9fafb;
	}

	.file-input-label i {
		width: 32px;
		height: 32px;
		color: #6b7280;
		margin-bottom: 0.5rem;
	}

	.file-input-label span {
		color: #374151;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	.file-input-label small {
		color: #6b7280;
		font-size: 0.75rem;
	}

	.file-preview {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: #f9fafb;
		border: none;
	}

	.file-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.file-info i {
		width: 20px;
		height: 20px;
		color: #6b7280;
	}

	.file-name {
		font-weight: 500;
		color: #374151;
	}

	.file-size {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.btn-remove {
		background: none;
		border: none;
		padding: 0.25rem;
		border-radius: 4px;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-remove:hover {
		background: #e5e7eb;
		color: #dc2626;
	}

	.btn-remove i {
		width: 16px;
		height: 16px;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
		margin-top: auto;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
		min-width: 100px;
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

	.btn-outline {
		background: transparent;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-outline:hover:not(:disabled) {
		background: #f9fafb;
		border-color: #9ca3af;
	}

	/* Mobile responsive */
	@media (max-width: 768px) {
		.expense-form-modal {
			padding: 0.5rem;
		}
		
		.expense-form-content {
			max-height: 95vh;
		}
		
		.expense-form-header,
		.expense-form {
			padding: 1.5rem 1rem;
		}
		
		.form-row {
			grid-template-columns: 1fr;
		}
		
		.category-select {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.form-actions {
			flex-direction: column-reverse;
		}
		
		.btn {
			width: 100%;
		}
	}
</style>