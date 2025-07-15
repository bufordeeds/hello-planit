// Event templates with pre-configured settings
export const EVENT_TEMPLATES = {
	general: {
		name: 'General Event',
		description: 'A flexible template for any type of gathering',
		icon: '📅',
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
				notes: 'Add special notes, dietary restrictions, or important information here.',
			},
		},
	},

	birthday: {
		name: 'Birthday Celebration',
		description: 'Perfect for birthday parties and celebrations',
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
				notes: 'Birthday celebration! Please let us know about any dietary restrictions or allergies.',
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
		name: 'Vacation Trip',
		description: 'Multi-day trip planning with accommodation and activities',
		icon: '🏖️',
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
				notes: 'Vacation planning! Don\'t forget to pack sunscreen and comfortable shoes.',
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
		name: 'Business Event',
		description: 'Corporate events, conferences, and team meetings',
		icon: '💼',
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
				notes: 'Professional event. Please arrive 15 minutes early and bring business cards.',
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
		name: 'Wedding Celebration',
		description: 'Wedding planning with ceremony and reception',
		icon: '💒',
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
				notes: 'Wedding celebration! Please RSVP with meal preferences and any dietary restrictions.',
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
		name: 'Party/Social Event',
		description: 'Casual parties and social gatherings',
		icon: '🎉',
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
				notes: 'Let\'s party! Bring your dancing shoes and appetite for fun.',
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
		name: 'Weekend Getaway',
		description: 'Short weekend trips and getaways',
		icon: '🌟',
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
				notes: 'Weekend getaway! Pack light and be ready for adventure.',
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