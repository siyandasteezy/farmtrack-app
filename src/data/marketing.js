/**
 * Content for the public "how it works" pages.
 *
 * Deliberately specific. Every farm platform claims to track animals and
 * crops; what is worth a page is the detail — that a spray record carries an
 * L-number, that a withholding period is never guessed, that a hive needs two
 * reference weights before its stores mean anything. Those are the things a
 * farmer can check against how they actually work.
 *
 * Nothing here describes behaviour the app does not have. If a claim on this
 * page stops being true, the page is wrong and should change with the code.
 */

/** Where the primary call-to-action leads, given who is signed in. */
export const primaryCta = (user) => ({
  to: user ? (user.plan === 'unpaid' ? '/payment' : '/dashboard') : '/register',
  label: user ? 'Go to dashboard' : 'Start free trial',
});

/* License-free photography — Unsplash (https://unsplash.com/license) */
export const MARKETING_IMG = {
  livestock: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1400&q=80',
  crops:     'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80',
  vineyard:  'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1100&q=80',
  apiary:    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1100&q=80',
};

export const HOW_IT_WORKS = {
  livestock: {
    key: 'livestock',
    eyebrow: 'Livestock, dairy and bees',
    title: 'Every animal accounted for, from tag to report',
    lede:
      'Cattle, sheep, goats, pigs, poultry, horses and hives — recorded once, and then feeding ' +
      'every health record, feed plan, report and compliance check that follows.',
    image: 'livestock',
    imageAlt: 'Nguni cattle grazing on open veld',
    other: 'crops',

    steps: [
      {
        n: 'Tag it once',
        body:
          'Each animal gets a tag that is unique on your farm, then breed, age, sex, weight and ' +
          'where it stands. Breed lists are South African first — Nguni, Bonsmara and ' +
          'Drakensberger for cattle, Dorper and Dohne Merino for sheep, Boer and Kalahari Red ' +
          'for goats, Kolbroek for pigs, Potchefstroom Koekoek and Boschveld for poultry.',
      },
      {
        n: 'Everything points back at that tag',
        body:
          'Vaccinations, treatments, dosing, farrier visits and vet costs attach to the animal ' +
          'rather than to a page in a notebook. Scheduled records are how a dosing round stops ' +
          'slipping, and the whole timeline is there when the vet asks what you gave and when.',
      },
      {
        n: 'Feed that follows your actual herd',
        body:
          'Set intake per head per species and the stock you hold, and days of cover are worked ' +
          'out from the animals you have recorded — so the number moves when the herd does ' +
          'rather than when you remember to update a spreadsheet.',
      },
      {
        n: 'Reports built only from what you captured',
        body:
          'Herd by species, average weights, vet spend, honey harvested. A section only appears ' +
          'once there is something real behind it. No chart stands in for data you have not ' +
          'recorded, and no figure is invented to fill a gap.',
      },
    ],

    deepDives: [
      {
        title: 'Bees get treated as the livestock they are',
        body:
          'A hive is recorded like any other animal, with the hive number as its tag and the ' +
          'colony breed alongside it. Only the indigenous subspecies are listed — African ' +
          '(A. m. scutellata), Cape (A. m. capensis) and their hybrid — because honey bees are ' +
          'controlled goods under the Agricultural Pests Act 36 of 1983 and imported races are ' +
          'not farmed here.',
        points: [
          'Inspections capture brood pattern, stores, temperament, queen sighting and varroa counts',
          'Harvests by product — honey, beeswax, propolis, pollen, royal jelly',
          'Colony events for swarms, splits, requeening, absconding and losses',
          'American foulbrood flagged as notifiable, because it is',
        ],
        image: 'apiary',
        imageAlt: 'Beekeeper inspecting a frame from a hive',
      },
      {
        title: 'A scale under a hive, read properly',
        body:
          'Weight is the one thing that tells you what a colony is doing without opening it, and ' +
          'opening it sets the colony back. isibaya asks for two reference weights — the empty ' +
          'hive, and the hive with its colony established — because weight above an empty box is ' +
          'not honey. Bees, brood and drawn comb are most of it.',
        points: [
          'Stores measured from the established colony, never from bare woodware',
          'Trends read from daily averages, since a hive is lighter at midday with the foragers out',
          'A sharp overnight loss flagged separately — a swarm, robbing, or a hive gone over',
          'No default starvation threshold, because what a colony needs depends on your region',
        ],
      },
      {
        title: 'Compliance you can cite',
        body:
          'Sixty-five items across animal identification, health and biosecurity, welfare, ' +
          'traceability, environment and worker safety — each naming the Act it comes from, so ' +
          'you can check it rather than take our word for it.',
        points: [
          'Animal Identification Act 6 of 2002 and its branding requirements',
          'Animal Diseases Act 35 of 1984 — controlled and notifiable diseases',
          'Meat Safety Act 40 of 2000 for anything leaving for an abattoir',
          'Guidance, not legal advice — and it says so',
        ],
      },
    ],
  },

  crops: {
    key: 'crops',
    eyebrow: 'Fruit, vegetables and grain',
    title: 'From what is in the ground to what came off it',
    lede:
      'Plantings, spray records and harvests, with the withholding-period arithmetic that keeps ' +
      'a consignment from being turned away at the packhouse.',
    image: 'crops',
    imageAlt: 'Rows of crops on a South African farm at sunrise',
    other: 'livestock',

    steps: [
      {
        n: 'Start with the planting',
        body:
          'One crop, in one place, for one season, with a code like PL-2026-001. Grain, ' +
          'vegetables or fruit; annuals that run plant to harvest, or orchards and vines that ' +
          'stay put season after season. Field, hectares, planting date and expected harvest.',
      },
      {
        n: 'Record what goes on it',
        body:
          'Sprays, fertiliser, irrigation, cultivation, pruning and scouting — each against the ' +
          'block it was applied to, with who did it, what with, and in what conditions. Wind ' +
          'speed is kept as a number, because drift is mostly a wind problem.',
      },
      {
        n: 'Harvest with a lot code',
        body:
          'How much came off, in what unit, graded Class 1, 2 or 3 under the Agricultural Product ' +
          'Standards Act 119 of 1990, where it went and at what price. Yield per hectare and ' +
          'value follow from the numbers rather than being typed twice and disagreeing.',
      },
      {
        n: 'Read the season back',
        body:
          'Harvested by crop, yield per block against its hectares, and the value of what you ' +
          'priced. Mixed units are never added together — crates and kilograms stay on separate ' +
          'lines rather than becoming one confident, meaningless total.',
      },
    ],

    deepDives: [
      {
        title: 'Spray records that survive an audit',
        body:
          'Agricultural remedies are registered under Act 36 of 1947, and every label carries an ' +
          'L-number. A packhouse, an export agent or a GLOBALG.A.P. auditor can ask to see the ' +
          'record behind any consignment, so the fields follow what those records have to show.',
        points: [
          'Product, active ingredient and L-number off the label',
          'Target pest or disease, rate as written, area treated and total used',
          'Operator and equipment, so the record names who applied it',
          'Re-entry interval, rounded up to whole days rather than invented to the hour',
        ],
        image: 'vineyard',
        imageAlt: 'Vineyard rows in the Cape Winelands',
      },
      {
        title: 'The withholding period, done honestly',
        body:
          'This is the number that decides whether a load passes or is rejected on residues. ' +
          'isibaya does not ship a table of withholding periods and never guesses one — it ' +
          'varies by product, crop and dose, labels get revised, and a number wrong in the ' +
          'farmer’s favour reads as permission to harvest early. The label is the authority. ' +
          'What the app does is the arithmetic, and it does it out loud.',
        points: [
          'A planned harvest inside a withholding period is flagged in red, with how many days short',
          'The warning appears while you are still typing the period, not after the sprayer is empty',
          'Where sprays overlap, the longest interval governs — not the most recent',
          'Harvesting inside the window is not silently allowed, and not hard-blocked either: it asks, and records that you confirmed',
        ],
      },
      {
        title: 'Rules for produce, with the Act named',
        body:
          'Crop protection and remedies, produce standards and market access, plant material and ' +
          'varieties, records and traceability, land and water — each item citing its source so ' +
          'you can check the current wording yourself.',
        points: [
          'Act 36 of 1947 for agricultural remedies and their registration',
          'Act 119 of 1990 for grading and product standards',
          'Plant Breeders’ Rights and Plant Improvement Acts for propagation material',
          'National Water Act 36 of 1998 where abstraction needs authorising',
        ],
      },
    ],
  },
};
