export const EQUIPMENT_TYPES = [
  'Tractor', 'Harvester', 'Irrigation System', 'Water Pump', 'Feed Mixer',
  'Milking Equipment', 'Fencing', 'Vehicle / Trailer', 'Generator',
  'Ventilation', 'Lighting', 'Security System', 'Storage / Silo', 'Other',
];

export const EQUIPMENT_STATUSES = ['Active', 'Maintenance', 'Retired'];

export const TICKET_CATEGORIES = {
  Livestock: {
    icon: '🐄',
    sub: ['Cattle', 'Sheep', 'Goat', 'Pig', 'Horse', 'Poultry', 'Rabbit', 'Alpaca', 'Duck', 'Deer', 'Bee'],
  },
  'Health & Vet': {
    icon: '❤️',
    sub: ['Checkup', 'Vaccination', 'Treatment', 'Deworming', 'Farrier', 'Surgery', 'Other'],
  },
  Sensors: {
    icon: '📡',
    sub: ['Environment', 'Air Quality', 'Water', 'Field', 'Feed', 'Animal Health', 'Production', 'Weather', 'Security'],
  },
  'Feed & Nutrition': {
    icon: '🌾',
    sub: ['Cattle Feed', 'Sheep Feed', 'Pig Feed', 'Poultry Feed', 'Horse Feed', 'Goat Feed', 'Rabbit Feed', 'Duck Feed'],
  },
  Equipment: {
    icon: '🔧',
    sub: [],
  },
  Facilities: {
    icon: '🏠',
    sub: ['Barn 1', 'Hen House 1', 'Pig Pen 1', 'Dairy Unit', 'Feed Shed', 'Field B', 'Field C', 'Stable 1', 'Orchard', 'Farm HQ', 'Other'],
  },
  Regulations: {
    icon: '📋',
    sub: ['Animal Welfare', 'Biosecurity', 'Environmental', 'Traceability & Records', 'Feed Standards', 'Other'],
  },
};

export const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const TICKET_STATUSES   = ['Open', 'In Progress', 'Resolved', 'Closed'];
