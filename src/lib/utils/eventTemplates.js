// Event templates with pre-configured settings
export const EVENT_TEMPLATES = {
	general: {
		name: 'General Mission',
		description: 'A flexible template for any type of adventure',
		icon: '🌌',
		defaultSettings: {
			privacy: 'private',
			allowEditing: true,
			requireApproval: false,
			features: {
				meals: true,
				expenses: true,
				itinerary: true,
				chat: false,
			},
		},
		defaultDays: ['day-1', 'day-2'],
		defaultMealSlots: ['breakfast', 'lunch', 'dinner'],
		sampleData: {
			itinerary: {
				notes: 'Mission briefing: Add special notes, crew dietary restrictions, or important mission intel here.',
			},
		},
	},

	birthday: {
		name: 'Cosmic Birthday Mission',
		description: 'Launch an epic birthday celebration among the stars',
		icon: '🎂',
		defaultSettings: {
			privacy: 'invite-only',
			allowEditing: true,
			requireApproval: false,
			features: {
				meals: true,
				expenses: true,
				itinerary: true,
				chat: true,
			},
		},
		defaultDays: ['party-day'],
		defaultMealSlots: ['brunch', 'dinner', 'cake'],
		sampleData: {
			itinerary: {
				notes: 'Cosmic birthday mission! Please transmit any dietary restrictions or allergies to mission control.',
			},
			meals: [
				{
					name: 'Birthday Cake',
					slot: 'cake',
					description: 'Special birthday cake for the celebration',
				},
			],
		},
	},

	vacation: {
		name: 'Exploration Expedition',
		description: 'Multi-day adventure planning with base camps and discoveries',
		icon: '🌍',
		defaultSettings: {
			privacy: 'private',
			allowEditing: true,
			requireApproval: false,
			features: {
				meals: true,
				expenses: true,
				itinerary: true,
				chat: true,
			},
		},
		defaultDays: ['day-1', 'day-2', 'day-3'],
		defaultMealSlots: ['breakfast', 'lunch', 'dinner'],
		sampleData: {
			itinerary: {
				notes: 'Exploration expedition briefing! Don\'t forget to pack your adventure gear and comfortable exploration boots.',
			},
			expenses: [
				{
					name: 'Accommodation',
					category: 'accommodation',
					description: 'Hotel or rental property',
				},
				{
					name: 'Transportation',
					category: 'transport',
					description: 'Flights, car rental, or gas',
				},
			],
		},
	},

	business: {
		name: 'Command Summit',
		description: 'Strategic gatherings, conferences, and crew briefings',
		icon: '🛰️',
		defaultSettings: {
			privacy: 'invite-only',
			allowEditing: false,
			requireApproval: true,
			features: {
				meals: true,
				expenses: true,
				itinerary: true,
				chat: false,
			},
		},
		defaultDays: ['day-1'],
		defaultMealSlots: ['breakfast', 'lunch'],
		sampleData: {
			itinerary: {
				notes: 'Command summit briefing. Please arrive 15 minutes early and bring your mission credentials.',
			},
			meals: [
				{
					name: 'Continental Breakfast',
					slot: 'breakfast',
					description: 'Light breakfast before the meeting',
				},
				{
					name: 'Working Lunch',
					slot: 'lunch',
					description: 'Catered lunch during the event',
				},
			],
		},
	},

	wedding: {
		name: 'Unity Celebration',
		description: 'Celestial union ceremony with cosmic reception',
		icon: '💫',
		defaultSettings: {
			privacy: 'invite-only',
			allowEditing: true,
			requireApproval: true,
			features: {
				meals: true,
				expenses: true,
				itinerary: true,
				chat: true,
			},
		},
		defaultDays: ['wedding-day'],
		defaultMealSlots: ['brunch', 'cocktail', 'dinner'],
		sampleData: {
			itinerary: {
				notes: 'Unity celebration among the stars! Please confirm attendance with meal preferences and dietary restrictions.',
			},
			meals: [
				{
					name: 'Cocktail Hour',
					slot: 'cocktail',
					description: 'Drinks and appetizers before dinner',
				},
				{
					name: 'Wedding Dinner',
					slot: 'dinner',
					description: 'Main reception dinner',
				},
			],
		},
	},

	party: {
		name: 'Cosmic Gathering',
		description: 'Stellar parties and intergalactic social events',
		icon: '🎆',
		defaultSettings: {
			privacy: 'private',
			allowEditing: true,
			requireApproval: false,
			features: {
				meals: true,
				expenses: true,
				itinerary: false,
				chat: true,
			},
		},
		defaultDays: ['party-day'],
		defaultMealSlots: ['appetizers', 'main', 'dessert'],
		sampleData: {
			itinerary: {
				notes: 'Cosmic gathering initiated! Bring your dancing boots and appetite for intergalactic fun.',
			},
			meals: [
				{
					name: 'Appetizers & Snacks',
					slot: 'appetizers',
					description: 'Light bites and finger foods',
				},
			],
		},
	},

	weekend: {
		name: 'Orbital Escape',
		description: 'Short-range missions and quick getaway adventures',
		icon: '🚀',
		defaultSettings: {
			privacy: 'private',
			allowEditing: true,
			requireApproval: false,
			features: {
				meals: true,
				expenses: true,
				itinerary: true,
				chat: true,
			},
		},
		defaultDays: ['friday', 'saturday', 'sunday'],
		defaultMealSlots: ['breakfast', 'lunch', 'dinner'],
		sampleData: {
			itinerary: {
				notes: 'Orbital escape mission! Pack light and prepare for stellar adventures.',
			},
		},
	},
};

// Get template by key
export const getTemplate = (templateKey) => {
	return EVENT_TEMPLATES[templateKey] || EVENT_TEMPLATES.general;
};

// Get all template keys
export const getTemplateKeys = () => {
	return Object.keys(EVENT_TEMPLATES);
};

// Get template options for dropdown
export const getTemplateOptions = () => {
	return Object.entries(EVENT_TEMPLATES).map(([key, template]) => ({
		value: key,
		label: template.name,
		description: template.description,
		icon: template.icon,
	}));
};