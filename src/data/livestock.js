/* Breed lists lead with South African / indigenous breeds, followed by the
   international breeds also farmed here. */
export const SPECIES_META = {
  Cattle:  { emoji: '🐄', breeds: ['Nguni','Bonsmara','Afrikaner','Drakensberger','Brahman','Angus','Hereford','Simmental','Charolais','Limousin','Holstein','Jersey','Shorthorn'] },
  Sheep:   { emoji: '🐑', breeds: ['Dorper','Meatmaster','Dohne Merino','Van Rooy','Blackhead Persian','Afrino','Damara','Karakul','Merino','Suffolk','Texel','Ile-de-France'] },
  Goat:    { emoji: '🐐', breeds: ['Boer','Kalahari Red','Savanna','Indigenous Veld Goat','Angora','Saanen','Nubian','Toggenburg','Alpine'] },
  Pig:     { emoji: '🐷', breeds: ['Kolbroek','Large White','Landrace','Duroc','Berkshire','Pietrain','Hampshire','Tamworth'] },
  Horse:   { emoji: '🐴', breeds: ['SA Boerperd','Nooitgedacht','Basuto Pony','Thoroughbred','Arabian','Friesian','Quarter Horse','Warmblood','Clydesdale'] },
  Poultry: { emoji: '🐔', breeds: ['Potchefstroom Koekoek','Boschveld','Venda','Ovambo','Naked Neck','Broiler','Leghorn','Rhode Island Red','Sussex','Orpington'] },
  Rabbit:  { emoji: '🐇', breeds: ['New Zealand White','California','Rex','Flemish Giant','Dutch','Angora','Chinchilla'] },
  Alpaca:  { emoji: '🦙', breeds: ['Huacaya','Suri'] },
  Duck:    { emoji: '🦆', breeds: ['Pekin','Muscovy','Khaki Campbell','Indian Runner','Rouen','Aylesbury'] },
  /* Kept as true deer (Cervidae) — both are farmed in SA. SA game species
     (springbok, blesbok, kudu, impala) are antelope, so they belong in a
     separate "Game" species rather than mislabelled here. */
  Deer:    { emoji: '🦌', breeds: ['Red Deer','Fallow Deer','White-tailed','Sika','Wapiti'] },
  /* Only the two indigenous subspecies (and their hybrid) are kept in SA —
     honey bees are controlled goods under the Agricultural Pests Act 36/1983,
     so European races such as Italian or Carniolan are not farmed here. */
  Bee:     { emoji: '🐝', breeds: ['African (A. m. scutellata)','Cape (A. m. capensis)','Scutellata × Capensis hybrid','Unknown / mixed'] },
};

/* ── Bees ──────────────────────────────────────────────────────────────
   A bee record represents a HIVE (colony), not an individual insect —
   a single colony holds 10,000–60,000 bees. Hives are grouped by apiary
   (the yard), which maps to the Location / Farm Plan zone.
   ------------------------------------------------------------------- */

export const COLONY_STRENGTH = ['Nucleus', 'Weak', 'Moderate', 'Strong', 'Very strong'];

export const QUEEN_STATUSES = ['Queenright', 'Virgin queen', 'Requeening', 'Queenless'];

/* International queen-marking colour code, keyed by the last digit of the
   year the queen was raised. Mnemonic: "Will You Rear Good Bees". */
export const QUEEN_COLOURS = ['Unmarked', 'White', 'Yellow', 'Red', 'Green', 'Blue'];

/* Hive inspection vocabulary */
export const BROOD_PATTERNS = ['Good / solid', 'Spotty', 'Drone-heavy', 'No brood'];
export const STORES_LEVELS  = ['Ample', 'Adequate', 'Low', 'None — feed now'];
export const TEMPERAMENTS   = ['Calm', 'Normal', 'Defensive', 'Very defensive'];

/* Pests & diseases seen in South African apiaries. AFB is a notifiable
   disease here under the Control Measures relating to Honey-bees
   (R.858 of 2013), and capensis laying workers are an SA-specific problem. */
export const HIVE_PESTS = [
  'None seen',
  'Varroa',
  'Small hive beetle',
  'Wax moth',
  'Chalkbrood',
  'Nosema',
  'Capensis laying workers',
  'American foulbrood (AFB)',
  'European foulbrood (EFB)',
];

/* Diseases that must be reported to DALRRD when found. */
export const NOTIFIABLE_PESTS = ['American foulbrood (AFB)'];

export const HIVE_PRODUCTS = ['Honey', 'Beeswax', 'Propolis', 'Pollen', 'Royal jelly'];

export function queenColourForYear(year) {
  const digit = Number(String(year).slice(-1));
  if (Number.isNaN(digit)) return 'Unmarked';
  return ['Blue', 'White', 'Yellow', 'Red', 'Green'][digit % 5];
}
