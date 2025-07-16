<script>
	import { onMount } from 'svelte';
	import { formatCurrency } from '$lib/utils/formatters.js';
	
	export let totalAmount = 0;
	export let categoryTotals = {};
	export let memberBalances = {};
	export let categories = [];
	export let settlements = [];
	export let members = {};
	
	let activeTab = 'overview';
	
	onMount(() => {
		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
	});
	
	function getCategoryIcon(categoryValue) {
		const category = categories.find(cat => cat.value === categoryValue);
		return category ? category.icon : 'more-horizontal';
	}
	
	function getCategoryLabel(categoryValue) {
		const category = categories.find(cat => cat.value === categoryValue);
		return category ? category.label : categoryValue;
	}
	
	function getTopCategories() {
		return Object.entries(categoryTotals)
			.filter(([_, amount]) => amount > 0)
			.sort(([,a], [,b]) => b - a)
			.slice(0, 3);
	}
	
	function getMemberBalancesList() {
		return Object.entries(memberBalances)
			.sort(([,a], [,b]) => b.balance - a.balance);
	}
	
	function getBalanceClass(balance) {
		if (balance > 0) return 'positive';
		if (balance < 0) return 'negative';
		return 'neutral';
	}
	
	function getBalanceIcon(balance) {
		if (balance > 0) return 'trending-up';
		if (balance < 0) return 'trending-down';
		return 'minus';
	}
</script>

<div class="expense-summary">
	<!-- Summary Tabs -->
	<div class="summary-tabs">
		<button 
			class="summary-tab" 
			class:active={activeTab === 'overview'}
			on:click={() => activeTab = 'overview'}
		>
			<i data-lucide="pie-chart"></i>
			Overview
		</button>
		<button 
			class="summary-tab" 
			class:active={activeTab === 'categories'}
			on:click={() => activeTab = 'categories'}
		>
			<i data-lucide="tag"></i>
			Categories
		</button>
		<button 
			class="summary-tab" 
			class:active={activeTab === 'balances'}
			on:click={() => activeTab = 'balances'}
		>
			<i data-lucide="users"></i>
			Balances
		</button>
		<button 
			class="summary-tab" 
			class:active={activeTab === 'settlements'}
			on:click={() => activeTab = 'settlements'}
		>
			<i data-lucide="arrow-right-left"></i>
			Settlements
		</button>
	</div>
	
	<!-- Tab Content -->
	<div class="summary-content">
		{#if activeTab === 'overview'}
			<div class="overview-cards">
				<div class="summary-card total-card">
					<div class="card-icon">
						<i data-lucide="dollar-sign"></i>
					</div>
					<div class="card-content">
						<h3>Total Expenses</h3>
						<div class="card-value">{formatCurrency(totalAmount)}</div>
					</div>
				</div>
				
				<div class="summary-card average-card">
					<div class="card-icon">
						<i data-lucide="divide"></i>
					</div>
					<div class="card-content">
						<h3>Per Person</h3>
						<div class="card-value">
							{formatCurrency(Object.keys(memberBalances).length > 0 ? totalAmount / Object.keys(memberBalances).length : 0)}
						</div>
					</div>
				</div>
				
				<div class="summary-card categories-card">
					<div class="card-icon">
						<i data-lucide="tag"></i>
					</div>
					<div class="card-content">
						<h3>Categories</h3>
						<div class="card-value">
							{Object.values(categoryTotals).filter(amount => amount > 0).length}
						</div>
					</div>
				</div>
			</div>
			
			{#if getTopCategories().length > 0}
				<div class="top-categories">
					<h4>Top Spending Categories</h4>
					<div class="category-list">
						{#each getTopCategories() as [category, amount]}
							<div class="category-item">
								<div class="category-info">
									<i data-lucide={getCategoryIcon(category)}></i>
									<span class="category-name">{getCategoryLabel(category)}</span>
								</div>
								<div class="category-amount">{formatCurrency(amount)}</div>
								<div class="category-percentage">
									{((amount / totalAmount) * 100).toFixed(1)}%
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
		
		{#if activeTab === 'categories'}
			<div class="categories-breakdown">
				<h4>Spending by Category</h4>
				{#if Object.values(categoryTotals).some(amount => amount > 0)}
					<div class="category-grid">
						{#each categories as category}
							{@const amount = categoryTotals[category.value] || 0}
							{#if amount > 0}
								<div class="category-card">
									<div class="category-header">
										<i data-lucide={category.icon}></i>
										<span class="category-title">{category.label}</span>
									</div>
									<div class="category-stats">
										<div class="category-amount">{formatCurrency(amount)}</div>
										<div class="category-bar">
											<div 
												class="category-bar-fill" 
												style="width: {totalAmount > 0 ? (amount / totalAmount) * 100 : 0}%"
											></div>
										</div>
										<div class="category-percentage">
											{totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : 0}%
										</div>
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					<div class="empty-categories">
						<i data-lucide="tag"></i>
						<p>No expenses in any category yet</p>
					</div>
				{/if}
			</div>
		{/if}
		
		{#if activeTab === 'balances'}
			<div class="balances-breakdown">
				<h4>Member Balances</h4>
				{#if Object.keys(memberBalances).length > 0}
					<div class="balance-list">
						{#each getMemberBalancesList() as [memberId, balance]}
							<div class="balance-item">
								<div class="member-info">
									<div class="member-avatar">
										{balance.name ? balance.name.charAt(0).toUpperCase() : '?'}
									</div>
									<div class="member-details">
										<span class="member-name">{balance.name}</span>
										<span class="member-stats">
											Paid {formatCurrency(balance.paid)} • Owes {formatCurrency(balance.owes)}
										</span>
									</div>
								</div>
								<div class="balance-amount {getBalanceClass(balance.balance)}">
									<i data-lucide={getBalanceIcon(balance.balance)}></i>
									<span>
										{#if balance.balance > 0}
											+{formatCurrency(balance.balance)}
										{:else if balance.balance < 0}
											{formatCurrency(balance.balance)}
										{:else}
											{formatCurrency(0)}
										{/if}
									</span>
								</div>
							</div>
						{/each}
					</div>
					
					<div class="balance-legend">
						<div class="legend-item positive">
							<i data-lucide="trending-up"></i>
							<span>Overpaid (owed money)</span>
						</div>
						<div class="legend-item negative">
							<i data-lucide="trending-down"></i>
							<span>Underpaid (owes money)</span>
						</div>
						<div class="legend-item neutral">
							<i data-lucide="minus"></i>
							<span>Even (no balance)</span>
						</div>
					</div>
				{:else}
					<div class="empty-balances">
						<i data-lucide="users"></i>
						<p>No member balances to show</p>
					</div>
				{/if}
			</div>
		{/if}
		
		{#if activeTab === 'settlements'}
			<div class="settlements-breakdown">
				<h4>Who Owes Who</h4>
				{#if settlements && settlements.length > 0}
					<div class="settlements-list">
						{#each settlements as settlement}
							<div class="settlement-item">
								<div class="settlement-flow">
									<div class="settlement-from">
										<div class="member-avatar">
											{settlement.fromName.charAt(0).toUpperCase()}
										</div>
										<span class="member-name">{settlement.fromName}</span>
									</div>
									<div class="settlement-arrow">
										<i data-lucide="arrow-right"></i>
										<span class="settlement-amount">{formatCurrency(settlement.amount)}</span>
									</div>
									<div class="settlement-to">
										<div class="member-avatar">
											{settlement.toName.charAt(0).toUpperCase()}
										</div>
										<span class="member-name">{settlement.toName}</span>
									</div>
								</div>
								
								<!-- Venmo payment option if available -->
								{#if members[settlement.to]?.venmoUsername}
									<div class="settlement-action">
										<a 
											href="https://account.venmo.com/u/{members[settlement.to].venmoUsername}?txn=pay&amount={settlement.amount}&note=Event%20expenses"
											target="_blank"
											class="venmo-link"
										>
											<i data-lucide="dollar-sign"></i>
											Pay on Venmo
										</a>
									</div>
								{/if}
							</div>
						{/each}
					</div>
					
					<div class="settlements-note">
						<i data-lucide="info"></i>
						<p>These are the minimum transactions needed to settle all balances.</p>
					</div>
				{:else}
					<div class="empty-settlements">
						<i data-lucide="check-circle"></i>
						<p>All expenses are settled! No transactions needed.</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.expense-summary {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		overflow: hidden;
	}
	
	.summary-tabs {
		display: flex;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}
	
	.summary-tab {
		flex: 1;
		background: none;
		border: none;
		padding: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
	}
	
	.summary-tab:hover {
		color: #374151;
		background: #f3f4f6;
	}
	
	.summary-tab.active {
		color: #3b82f6;
		background: white;
		border-bottom-color: #3b82f6;
	}
	
	.summary-tab i {
		width: 16px;
		height: 16px;
	}
	
	.summary-content {
		padding: 1.5rem;
	}
	
	.overview-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}
	
	.summary-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.card-icon {
		width: 48px;
		height: 48px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}
	
	.total-card .card-icon {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.average-card .card-icon {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}
	
	.categories-card .card-icon {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}
	
	.card-icon i {
		width: 24px;
		height: 24px;
	}
	
	.card-content {
		flex: 1;
	}
	
	.card-content h3 {
		font-size: 0.875rem;
		font-weight: 500;
		color: #6b7280;
		margin: 0 0 0.25rem 0;
	}
	
	.card-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
	}
	
	.top-categories h4,
	.categories-breakdown h4,
	.balances-breakdown h4 {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1rem 0;
	}
	
	.category-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.category-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 6px;
	}
	
	.category-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}
	
	.category-info i {
		width: 16px;
		height: 16px;
		color: #6b7280;
	}
	
	.category-name {
		font-weight: 500;
		color: #374151;
	}
	
	.category-amount {
		font-weight: 600;
		color: #111827;
	}
	
	.category-percentage {
		font-size: 0.875rem;
		color: #6b7280;
		min-width: 50px;
		text-align: right;
	}
	
	.category-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
	}
	
	.category-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1rem;
	}
	
	.category-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	
	.category-header i {
		width: 18px;
		height: 18px;
		color: #6b7280;
	}
	
	.category-title {
		font-weight: 500;
		color: #374151;
	}
	
	.category-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.category-bar {
		height: 6px;
		background: #e5e7eb;
		border-radius: 3px;
		overflow: hidden;
	}
	
	.category-bar-fill {
		height: 100%;
		background: #3b82f6;
		transition: width 0.3s ease;
	}
	
	.balance-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.balance-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 8px;
	}
	
	.member-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}
	
	.member-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
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
	
	.member-stats {
		font-size: 0.75rem;
		color: #6b7280;
	}
	
	.balance-amount {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-weight: 600;
		font-size: 0.875rem;
	}
	
	.balance-amount i {
		width: 14px;
		height: 14px;
	}
	
	.balance-amount.positive {
		color: #059669;
	}
	
	.balance-amount.negative {
		color: #dc2626;
	}
	
	.balance-amount.neutral {
		color: #6b7280;
	}
	
	.balance-legend {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}
	
	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: #6b7280;
	}
	
	.legend-item i {
		width: 12px;
		height: 12px;
	}
	
	.legend-item.positive i {
		color: #059669;
	}
	
	.legend-item.negative i {
		color: #dc2626;
	}
	
	.legend-item.neutral i {
		color: #6b7280;
	}
	
	.empty-categories,
	.empty-balances {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}
	
	.empty-categories i,
	.empty-balances i {
		width: 48px;
		height: 48px;
		margin: 0 auto 1rem;
		color: #d1d5db;
	}
	
	.empty-categories p,
	.empty-balances p {
		margin: 0;
	}

	/* Settlements Styles */
	.settlements-breakdown h4 {
		margin: 0 0 1rem 0;
		color: #111827;
		font-weight: 600;
	}

	.settlements-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.settlement-item {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
	}

	.settlement-flow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.settlement-from,
	.settlement-to {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.settlement-arrow {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		color: #3b82f6;
		font-weight: 600;
	}

	.settlement-amount {
		font-size: 0.875rem;
		color: #3b82f6;
		font-weight: 600;
	}

	.settlement-action {
		margin-top: 0.75rem;
		text-align: center;
	}

	.venmo-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		background: #3b82f6;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background-color 0.2s ease;
	}

	.venmo-link:hover {
		background: #2563eb;
	}

	.venmo-link i {
		width: 14px;
		height: 14px;
	}

	.settlements-note {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.75rem;
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 6px;
		font-size: 0.875rem;
		color: #1e40af;
	}

	.settlements-note i {
		width: 16px;
		height: 16px;
		color: #3b82f6;
	}

	.settlements-note p {
		margin: 0;
	}

	.empty-settlements {
		text-align: center;
		padding: 2rem;
		color: #059669;
	}

	.empty-settlements i {
		width: 48px;
		height: 48px;
		margin: 0 auto 1rem;
		color: #059669;
	}

	.empty-settlements p {
		margin: 0;
		font-weight: 500;
	}
	
	/* Mobile responsive */
	@media (max-width: 768px) {
		.summary-tabs {
			flex-direction: column;
		}
		
		.summary-tab {
			justify-content: flex-start;
			padding: 0.75rem 1rem;
		}
		
		.overview-cards {
			grid-template-columns: 1fr;
		}
		
		.category-grid {
			grid-template-columns: 1fr;
		}
		
		.balance-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
		
		.balance-amount {
			align-self: flex-end;
		}
		
		.balance-legend {
			flex-direction: column;
			gap: 0.75rem;
			align-items: center;
		}
		
		.settlement-flow {
			flex-direction: column;
			gap: 0.75rem;
		}
		
		.settlement-from,
		.settlement-to {
			width: 100%;
			justify-content: center;
		}
		
		.settlement-arrow {
			transform: rotate(90deg);
		}
	}
</style>