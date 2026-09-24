/**
 * Step-by-step guides for the two enterprises.
 *
 * Written against what the app actually does — field names, codes and the
 * statutes the Regulations page cites — so a farmer following it does not hit
 * a screen that disagrees with the instruction. When a flow changes, this
 * changes with it.
 *
 * `to` makes the "where" clickable; `note` is context; `warn` is the thing
 * that costs money or breaks compliance if ignored.
 */

export const GUIDES = {
  livestock: {
    key: 'livestock',
    label: 'Livestock',
    emoji: '🐄',
    blurb: 'Cattle, sheep, goats, pigs, poultry and bees — from first animal to a report you can hand over.',
    intro:
      'Livestock in isibaya hangs off one thing: the animal, identified by its tag. ' +
      'Health records, feed, tracking and reports all point back at that tag, so getting ' +
      'tags right first makes everything after it easier.',
    steps: [
      {
        title: 'Switch Livestock on',
        to: '/profile',
        where: 'Profile → What you farm',
        body:
          'Tick Livestock and save. That is what puts Livestock, Health & Vet, Apiary, ' +
          'Feed and Animal Tracking in the menu. You can tick Crops as well — a farm can ' +
          'run both, and nothing is hidden permanently.',
        note: 'Turning an enterprise off later only hides the menu. Every record you made stays.',
      },
      {
        title: 'Map your farm (optional, but do it early)',
        to: '/farm-plan',
        where: 'Farm Plan',
        body:
          'Draw your boundary and add zones — camps, kraals, paddocks, the dairy. Zone names ' +
          'then appear as suggestions everywhere you type a location, so your records spell ' +
          'the same camp the same way every time.',
      },
      {
        title: 'Add your animals',
        to: '/livestock',
        where: 'Livestock → Add animal',
        body:
          'Tag is the only thing that must be unique on your farm — it is how every other ' +
          'record finds the animal. Then species, breed, date of birth, sex, weight, location ' +
          'and status. Breed lists are South African first: Nguni, Bonsmara and Drakensberger ' +
          'for cattle, Dorper and Dohne Merino for sheep, Boer and Kalahari Red for goats, ' +
          'Kolbroek for pigs, Potchefstroom Koekoek and Boschveld for poultry.',
        note: 'Recording a weight now gives the reports something to work with later. It is the one field people skip and then wish they had.',
      },
      {
        title: 'Hives are animals too',
        to: '/apiary',
        where: 'Livestock → Add animal, species "Bee" · then Apiary',
        body:
          'A hive is added like any other animal, with the hive number as its tag. Pick the ' +
          'colony breed — African (A. m. scutellata), Cape (A. m. capensis), or the hybrid — ' +
          'and record strength, queen status and the year and colour she was marked. The ' +
          'Apiary page then gives you inspections, harvests and colony events for that hive.',
        note: 'Only the indigenous subspecies are listed. Honey bees are controlled goods under the Agricultural Pests Act 36 of 1983, so imported races are not farmed here.',
      },
      {
        title: 'Inspect and harvest (beekeepers)',
        to: '/apiary',
        where: 'Apiary → Inspections · Harvests · Colony events',
        body:
          'Log what you saw: brood pattern, stores, temperament, queen sighted, varroa count ' +
          'and any pests. Record harvests by product — honey, beeswax, propolis, pollen, ' +
          'royal jelly — and use colony events for swarms, splits, requeening, absconding ' +
          'and losses.',
        warn:
          'American foulbrood (AFB) is notifiable. If you suspect it, you are required to ' +
          'report it — see Regulations → Beekeeping & Apiaries for what that involves.',
      },
      {
        title: 'Record every health event',
        to: '/health',
        where: 'Health & Vet → Add record',
        body:
          'Date, animal tag, and the type: checkup, vaccination, treatment, deworming, ' +
          'farrier, surgery or other. Add the vet, the cost and whether it is completed, ' +
          'ongoing or scheduled. Scheduled records are how you keep a dosing or vaccination ' +
          'round from slipping.',
        warn:
          'Treatments with a withdrawal period are a food-safety matter. Put the withdrawal ' +
          'and the date it ends in the notes — milk or meat leaving the farm inside it is ' +
          'the problem an inspection finds.',
      },
      {
        title: 'Plan feed',
        to: '/feed',
        where: 'Feed & Nutrition',
        body:
          'Set daily intake per head per species and the stock you hold. isibaya works out ' +
          'days of cover from the animals you have actually recorded, so the number moves as ' +
          'your herd does.',
      },
      {
        title: 'Connect sensors, if you have them',
        to: '/sensors',
        where: 'Sensors → Device Setup → Register Device',
        body:
          'Water level, cold-store temperature, hive weight. Register the device, copy the ' +
          'snippet it gives you onto an ESP32, Raspberry Pi or anything with an internet ' +
          'path, and the page waits for the first real reading before calling it connected. ' +
          'You can also log readings by hand — a manual entry outranks the device until you ' +
          'clear it.',
      },
      {
        title: 'Check what you owe the law',
        to: '/regulations',
        where: 'Regulations',
        body:
          'Animal identification, health and biosecurity, welfare, traceability and worker ' +
          'safety, each citing the Act it comes from. Worth reading once properly rather ' +
          'than when somebody asks.',
        warn:
          'Guidance, not legal advice. Check the current Act before acting on anything with ' +
          'a penalty attached.',
      },
      {
        title: 'Pull the numbers together',
        to: '/reports',
        where: 'Reports',
        body:
          'Herd by species, average weights, vet spend, honey harvested. Everything is built ' +
          'from your own records — a section only appears once there is something real behind ' +
          'it, so an empty chart never stands in for data you have not captured.',
      },
    ],
  },

  crops: {
    key: 'crops',
    label: 'Fruit, veg & grain',
    emoji: '🌱',
    blurb: 'From what is in the ground to what came off it — with the spray records a buyer will ask for.',
    intro:
      'Crops hang off the planting: one crop, in one place, for one season, with a code like ' +
      'PL-2026-001. Sprays and harvests point back at that code. The part worth doing properly ' +
      'is the withholding period — it is the difference between a consignment that passes and ' +
      'one that gets rejected.',
    steps: [
      {
        title: 'Switch Crops on',
        to: '/profile',
        where: 'Profile → What you farm',
        body:
          'Tick Crops and save. Livestock can stay ticked — plenty of farms run both, and the ' +
          'menu simply shows more.',
      },
      {
        title: 'Add a planting',
        to: '/crops',
        where: 'Crops → Plantings → Add planting',
        body:
          'Pick the category — Grain, Vegetable or Fruit — then the crop and cultivar. Give it ' +
          'a field, an area in hectares, the planting date and an expected harvest date. The ' +
          'code fills itself in as PL-2026-001; change it if you already number blocks your ' +
          'own way.',
        note:
          'Annual or perennial matters. Orchards and vines default to perennial and stay put ' +
          'season after season; maize and potatoes run plant → harvest → done.',
      },
      {
        title: 'Record what you put on it',
        to: '/crops',
        where: 'Crops → Field operations → Record operation',
        body:
          'Sprays, fertiliser, irrigation, cultivation, pruning and scouting. For anything ' +
          'other than a spray, the date, the block and what you did is enough.',
      },
      {
        title: 'Spray records: do these properly',
        to: '/crops',
        where: 'Crops → Field operations → Record operation → Spray',
        body:
          'Product name, active ingredient, the L-number off the label, the target pest or ' +
          'disease, the rate, the area, who applied it and with what. Then the two numbers ' +
          'that matter: days before harvest, and hours before workers may go back in. Both ' +
          'come off the label.',
        warn:
          'isibaya never guesses a withholding period, and you should not either. It varies ' +
          'by product, crop and dose, and labels get revised. Read it off the tin every time.',
        note:
          'This is the record a packhouse, export agent or GLOBALG.A.P. auditor asks to see. ' +
          'Agricultural remedies are registered under Act 36 of 1947 and the L-number is how ' +
          'yours is identified.',
      },
      {
        title: 'Watch the withholding warnings',
        to: '/crops',
        where: 'Crops — red banner and the Plantings table',
        body:
          'The moment a spray would push past a planned harvest date, the block turns red and ' +
          'says how many days short you are. You see it while you are still typing the ' +
          'withholding period, not after the sprayer is empty. Where several sprays overlap, ' +
          'the longest one governs.',
        warn:
          'Harvesting inside that window risks residues above the Maximum Residue Limit — ' +
          'which is how a load gets turned away at the packhouse or the border.',
      },
      {
        title: 'Record the harvest',
        to: '/crops',
        where: 'Crops → Harvests → Record harvest',
        body:
          'How much came off, in what unit, the grade, where it went and the price. The lot ' +
          'code fills in as LOT-2026-001 and is what follows the produce to the buyer. Yield ' +
          'per hectare and value are worked out for you.',
        note:
          'Grades follow the Agricultural Product Standards Act 119 of 1990 — Class 1, 2 and 3 ' +
          '— plus Processing, Reject and Ungraded. Ungraded is a real answer, not a gap.',
      },
      {
        title: 'If a harvest falls inside a withholding period',
        to: '/crops',
        where: 'Crops → Harvests',
        body:
          'isibaya will not quietly allow it and will not hard-block you either. It shows what ' +
          'is holding the block and asks you to confirm. Confirming is recorded against the ' +
          'harvest and flagged on the Crops page and in Reports.',
        warn:
          'Before you confirm, check the interval was not simply mistyped. That is the common ' +
          'cause, and it is a two-second fix versus a rejected consignment.',
      },
      {
        title: 'Read the season back',
        to: '/reports',
        where: 'Reports',
        body:
          'Harvested by crop, yield per block against its hectares, and the value of what you ' +
          'priced. Anything harvested inside a withholding period gets its own section, so it ' +
          'is in front of you before the report leaves the farm.',
        note:
          'Mixed units are never added together. Crates and kilograms stay on separate lines ' +
          'rather than becoming one confident, meaningless number.',
      },
      {
        title: 'Know the rules for produce',
        to: '/regulations',
        where: 'Regulations',
        body:
          'Crop protection and remedies, produce standards and market access, plant material ' +
          'and varieties, records and traceability, land and water. Each cites its Act.',
        warn:
          'Guidance, not legal advice. Check the current Act before acting on anything with ' +
          'a penalty attached.',
      },
    ],
  },
};

export const GUIDE_ORDER = ['livestock', 'crops'];
