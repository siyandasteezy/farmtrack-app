export const EQUIPMENT_TYPES = [
  'Tractor', 'Harvester', 'Irrigation System', 'Water Pump', 'Feed Mixer',
  'Milking Equipment', 'Fencing', 'Vehicle / Trailer', 'Generator',
  'Ventilation', 'Lighting', 'Security System', 'Storage / Silo', 'Other',
];

export const EQUIPMENT_STATUSES = ['Active', 'Maintenance', 'Retired'];

export const INITIAL_EQUIPMENT = [
  {
    id: 'eq-1',
    name: 'John Deere 5075E',
    type: 'Tractor',
    serial: 'JD5075E-2021-001',
    location: 'Main Barn',
    status: 'Active',
    purchaseDate: '2021-03-15',
    lastService: '2024-01-10',
    notes: 'Primary tractor for field work and feed distribution.',
  },
  {
    id: 'eq-2',
    name: 'Irrigation Pump A',
    type: 'Water Pump',
    serial: 'IP-A-2020-004',
    location: 'Field B',
    status: 'Active',
    purchaseDate: '2020-06-01',
    lastService: '2024-02-20',
    notes: 'Serves Field B and Field C irrigation lines.',
  },
  {
    id: 'eq-3',
    name: 'Milking Unit #1',
    type: 'Milking Equipment',
    serial: 'MU-001-2022',
    location: 'Dairy Unit',
    status: 'Maintenance',
    purchaseDate: '2022-01-20',
    lastService: '2024-03-01',
    notes: 'Pump seal replacement in progress.',
  },
  {
    id: 'eq-4',
    name: 'Feed Mixer Pro',
    type: 'Feed Mixer',
    serial: 'FM-002-2019',
    location: 'Feed Shed',
    status: 'Active',
    purchaseDate: '2019-11-10',
    lastService: '2023-12-15',
    notes: '',
  },
  {
    id: 'eq-5',
    name: 'Water Tank B',
    type: 'Storage / Silo',
    serial: 'WTB-2018-007',
    location: 'Tank B',
    status: 'Active',
    purchaseDate: '2018-05-22',
    lastService: '2024-01-30',
    notes: 'Requires level sensor calibration.',
  },
  {
    id: 'eq-6',
    name: 'Farm Pickup Truck',
    type: 'Vehicle / Trailer',
    serial: 'VIN-FT-2022-XC40',
    location: 'Farm HQ',
    status: 'Active',
    purchaseDate: '2022-07-11',
    lastService: '2024-02-05',
    notes: '',
  },
];

// ── Ticket categories linked to existing farm sections ───────────────────────
// Subcategories reference real data groups already present in the app.
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
    sub: [], // populated dynamically from equipment list
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

export const INITIAL_TICKETS = [
  {
    id: 'tk-1',
    title: 'Milking Unit #1 pump seal leaking',
    description: 'The pump seal on Milking Unit #1 is leaking during operation. Needs immediate replacement before next milking session.',
    priority: 'High',
    status: 'In Progress',
    category: 'Equipment',
    subCategory: 'Milking Unit #1',
    assignedTo: 'Mike Thompson',
    createdAt: '2024-03-10',
    updatedAt: '2024-03-12',
  },
  {
    id: 'tk-2',
    title: 'Water Level at Tank B critically low',
    description: 'Tank B water level dropped to 18%, well below the 20% minimum threshold. Sensor confirmed. Check supply line.',
    priority: 'Critical',
    status: 'Open',
    category: 'Sensors',
    subCategory: 'Water',
    assignedTo: 'John Doe',
    createdAt: '2024-03-14',
    updatedAt: '2024-03-14',
  },
  {
    id: 'tk-3',
    title: 'Fluffy (SH-003) requires follow-up treatment',
    description: 'Sheep SH-003 was treated for foot rot. Vet has recommended a follow-up antibiotic course in 7 days.',
    priority: 'Medium',
    status: 'Open',
    category: 'Health & Vet',
    subCategory: 'Treatment',
    assignedTo: 'Dr. Williams',
    createdAt: '2024-03-11',
    updatedAt: '2024-03-11',
  },
  {
    id: 'tk-4',
    title: 'Feed Silo 2 critically low — reorder required',
    description: 'Poultry Layer Mash at Silo 2 is at 8% capacity (only 890 kg remaining). Reorder needed within 5 days.',
    priority: 'High',
    status: 'Open',
    category: 'Feed & Nutrition',
    subCategory: 'Poultry Feed',
    assignedTo: 'John Doe',
    createdAt: '2024-03-13',
    updatedAt: '2024-03-13',
  },
  {
    id: 'tk-5',
    title: 'Annual FMD vaccination overdue for Cattle herd',
    description: 'Foot-and-mouth disease booster vaccinations are due for the full cattle herd by end of month.',
    priority: 'Medium',
    status: 'Resolved',
    category: 'Livestock',
    subCategory: 'Cattle',
    assignedTo: 'Dr. Patel',
    createdAt: '2024-02-28',
    updatedAt: '2024-03-05',
  },
];
