export const SPECIES_META = {
  Cattle:  { emoji: '🐄', breeds: ['Angus','Holstein','Hereford','Jersey','Limousin','Simmental','Charolais','Brahman','Shorthorn','Highland'] },
  Sheep:   { emoji: '🐑', breeds: ['Merino','Suffolk','Dorper','Texel','Romney','Corriedale','Damara','Hampshire','Ile-de-France'] },
  Goat:    { emoji: '🐐', breeds: ['Boer','Saanen','Nubian','Kiko','Angora','Alpine','Toggenburg','LaMancha','Pygmy'] },
  Pig:     { emoji: '🐷', breeds: ['Large White','Landrace','Duroc','Berkshire','Pietrain','Hampshire','Tamworth','Saddleback','Mangalitsa'] },
  Horse:   { emoji: '🐴', breeds: ['Thoroughbred','Clydesdale','Quarter Horse','Arabian','Shire','Friesian','Warmblood','Appaloosa','Standardbred'] },
  Poultry: { emoji: '🐔', breeds: ['Broiler','Leghorn','Rhode Island Red','Sussex','Plymouth Rock','Cornish Cross','ISA Brown','Orpington'] },
  Rabbit:  { emoji: '🐇', breeds: ['New Zealand White','California','Rex','Flemish Giant','Dutch','Angora','Mini Lop','Chinchilla'] },
  Alpaca:  { emoji: '🦙', breeds: ['Huacaya','Suri'] },
  Duck:    { emoji: '🦆', breeds: ['Pekin','Khaki Campbell','Muscovy','Indian Runner','Rouen','Aylesbury','Cayuga'] },
  Deer:    { emoji: '🦌', breeds: ['Red Deer','Fallow Deer','White-tailed','Roe Deer','Sika','Wapiti'] },
  Bee:     { emoji: '🐝', breeds: ['Italian','Carniolan','Buckfast','Russian','Caucasian'] },
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

export function queenColourForYear(year) {
  const digit = Number(String(year).slice(-1));
  if (Number.isNaN(digit)) return 'Unmarked';
  return ['Blue', 'White', 'Yellow', 'Red', 'Green'][digit % 5];
}
