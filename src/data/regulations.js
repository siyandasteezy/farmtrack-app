/**
 * Compliance reference.
 *
 * `jurisdiction` says how far a category can be trusted:
 *   'ZA'      — written against named South African legislation, cited in `ref`.
 *   'general' — inherited generic international guidance, NOT verified against
 *               South African law. Several items in these categories describe
 *               UK/EU rules (closed-season slurry spreading, a 20 m³/day
 *               abstraction threshold) that do not apply here. They are kept
 *               because the underlying topics are real, and labelled so nobody
 *               mistakes them for South African requirements.
 *
 * `only` limits a category to farms running that enterprise, the same way the
 * sidebar does. Categories without it are shown to everyone.
 */

export const REGULATIONS = [
  {
    category: 'Animal Welfare', jurisdiction: 'general', only: 'livestock', icon: '🐾',
    items: [
      { title:'Five Freedoms Standard', body:'All livestock must have freedom from hunger, discomfort, pain, fear, and freedom to express natural behaviour. Applies to all farmed animals under the Animal Welfare Act.', tag:'Mandatory', severity:'red' },
      { title:'Minimum Space Requirements', body:'Cattle ≥2.2 m², pigs ≥0.65 m² (grow-out), poultry ≤19 kg/m² (broiler); outdoor access required for free-range classification.', tag:'Mandatory', severity:'red' },
      { title:'Humane Slaughter', body:'Animals must be stunned before slaughter. All operators require an Animal Welfare Certificate. Halal/Kosher exemptions may apply with religious endorsement.', tag:'Mandatory', severity:'red' },
      { title:'Castration & Dehorning', body:'Must be performed before specified ages; anaesthesia required when performed on older animals. Tail docking banned in cattle, restricted in sheep.', tag:'Mandatory', severity:'amber' },
    ]
  },
  {
    category: 'Health & Biosecurity', jurisdiction: 'general', only: 'livestock', icon: '🦠',
    items: [
      { title:'Notifiable Disease Reporting', body:'FMD, Anthrax, Brucellosis, BSE, Avian Influenza, and Newcastle Disease must be reported to the relevant authority within 24 hours of suspicion.', tag:'Mandatory', severity:'red' },
      { title:'Quarantine Protocols', body:'Newly acquired animals must be isolated for 14–28 days. Movement permits required between farms. Keep movement records for minimum 3 years.', tag:'Mandatory', severity:'red' },
      { title:'Vaccination Schedules', body:'FMD vaccination required in endemic areas (bi-annual). Brucellosis vaccination for cattle calves. Poultry — Newcastle Disease, Marek\'s. Maintain vaccination records.', tag:'Mandatory', severity:'amber' },
      { title:'Veterinary Prescriptions', body:'Prescription-only medicines require a Vet-Client-Patient relationship. Maintain medicine records for 5 years. Observe withholding periods before slaughter.', tag:'Mandatory', severity:'amber' },
    ]
  },
  {
    /* South Africa: Control Measures relating to Honey-bees, G.N. R.858 of
       15 November 2013, made under the Agricultural Pests Act 36 of 1983. */
    category: 'Beekeeping & Apiaries', only: 'livestock', jurisdiction: 'ZA', icon: '🐝',
    items: [
      { title:'Beekeeper Registration (every 24 months)', body:'Anyone who keeps, owns or is in charge of a honey-bee colony — commercial, hobbyist or bee-removal operator — must register with DALRRD and renew every 24 months. Control Measures relating to Honey-bees (R.858 of 2013), Agricultural Pests Act 36 of 1983.', tag:'Mandatory', severity:'red' },
      { title:'Beehive Marking', body:'Every beehive must be marked clearly and legibly with the registration number allocated to the beekeeper. Unmarked hives are non-compliant.', tag:'Mandatory', severity:'red' },
      { title:'American Foulbrood — Notifiable', body:'American foulbrood (AFB) is a declared notifiable disease. Beekeepers are obliged to manage or eradicate it, report findings to DALRRD, and may be required to destroy infected colonies. Infected colonies and their equipment may not be moved.', tag:'Mandatory', severity:'red' },
      { title:'Cape Bee (capensis) Control', body:'Removal and movement of capensis-infected colonies is prohibited, and infected colonies are subject to destruction. Moving Cape bees (A. m. capensis) into A. m. scutellata areas triggers laying-worker social parasitism that can collapse host colonies.', tag:'Mandatory', severity:'red' },
      { title:'Colony Inspection & Record-Keeping', body:'Beekeepers must inspect every colony in their beehives and keep records as prescribed under the Control Measures — inspection dates, disease findings and actions taken.', tag:'Mandatory', severity:'amber' },
      { title:'Import of Bees, Honey & Used Equipment', body:'Honey, beeswax and used apiary equipment are controlled goods. A DALRRD import permit is required under section 3(1) of the Agricultural Pests Act 36 of 1983 before importing any of them.', tag:'Mandatory', severity:'amber' },
    ]
  },
  /* ── Crops ────────────────────────────────────────────────────────────
     Written against named South African legislation. Where a threshold
     depends on the product, the cultivar or the buyer, the item says so
     rather than inventing a number — a wrong figure on a compliance page is
     worse than no figure. */
  {
    category: 'Crop Protection & Remedies', jurisdiction: 'ZA', only: 'crops', icon: '🧪',
    items: [
      { title:'Use Only Registered Remedies', body:'Every agricultural remedy sold or used in South Africa must be registered, and carries its registration (L) number on the label. Using an unregistered product — or a registered one contrary to its label, meaning the wrong crop, dose, or interval — is an offence. The label is the legal instruction, not a guideline.', tag:'Mandatory', severity:'red', ref:'Act 36 of 1947 (Fertilizers, Farm Feeds, Agricultural Remedies and Stock Remedies Act)' },
      { title:'Withholding Periods Before Harvest', body:'Each label states the minimum number of days between application and harvest. Harvesting inside that window risks residues above the Maximum Residue Limit, which is how a consignment is rejected at a packhouse or a border. Record the interval against every spray; isibaya warns when a planned or actual harvest falls inside one.', tag:'Mandatory', severity:'red', ref:'Act 36 of 1947 — label conditions' },
      { title:'Re-entry Intervals', body:'Labels also state how long workers must stay out of a treated block. Where no interval is given, keep people out until sprays have dried and dusts have settled.', tag:'Mandatory', severity:'amber', ref:'Act 36 of 1947 — label conditions' },
      { title:'Spray Records', body:'Record every application: date, product, L-number, active ingredient, crop and block, rate, area treated, operator and equipment. Required to show a buyer, an export agent or an assurance scheme that label conditions were met — and the first thing asked for when a residue query arises.', tag:'Mandatory', severity:'amber', ref:'Buyer, export and assurance-scheme requirement' },
      { title:'Operator Protection', body:'Anyone mixing or applying pesticides must be trained, supplied with the protective equipment the label specifies, and protected from exposure. Applies to seasonal and contract workers as much as permanent staff.', tag:'Mandatory', severity:'red', ref:'Occupational Health and Safety Act 85 of 1993 and its hazardous chemical agents regulations' },
      { title:'Container Disposal', body:'Empty remedy containers are hazardous. Triple-rinse into the spray tank, puncture so they cannot be reused, and dispose of them as the label directs. Reusing a remedy container for water or feed is a recurring cause of poisoning on farms.', tag:'Mandatory', severity:'amber', ref:'Act 36 of 1947 — label conditions' },
    ]
  },
  {
    category: 'Produce Standards & Market Access', jurisdiction: 'ZA', only: 'crops', icon: '📦',
    items: [
      { title:'Grading and Container Marking', body:'Regulated products sold or exported must meet prescribed quality standards and carry the prescribed marks on the container — product name, class or grade, net mass, and the identity of the producer, packer or exporter. Standards differ per product, so check the regulation for the crop you pack.', tag:'Mandatory', severity:'red', ref:'Agricultural Product Standards Act 119 of 1990' },
      { title:'Export Inspection and Cold Chain', body:'Perishable products for export are inspected and certified by the PPECB, which also sets the cold-chain protocol a consignment must be handled under from packhouse to vessel.', tag:'Mandatory', severity:'red', ref:'PPECB Act 9 of 1983; Agricultural Product Standards Act 119 of 1990' },
      { title:'Phytosanitary Certificates', body:'Plants and plant products leaving the country need a phytosanitary certificate issued by DALRRD, confirming the consignment meets the importing country\'s plant-health requirements. Requirements are country-specific and change; confirm them before the season, not at the port.', tag:'Mandatory', severity:'red', ref:'Agricultural Pests Act 36 of 1983' },
      { title:'Packhouse Hygiene', body:'Premises where produce is washed, sorted or packed are food-handling premises and must meet the general hygiene requirements — structure, water quality, staff facilities and pest control.', tag:'Mandatory', severity:'amber', ref:'Foodstuffs, Cosmetics and Disinfectants Act 54 of 1972 (general hygiene requirements, R.638)' },
      { title:'Wine Grapes — Registration and Records', body:'Producers delivering wine grapes register with SAWIS and submit the prescribed production and harvest records. Claims of origin, vintage and cultivar on a label are certified under the Wine of Origin scheme and must be supported by those records.', tag:'Mandatory', severity:'amber', ref:'Liquor Products Act 60 of 1989' },
      { title:'Assurance Schemes', body:'GLOBALG.A.P., LocalG.A.P. and SIZA are not law, but for most South African fruit and vegetable exports they are a condition of sale. They audit exactly what is recorded here — spray records, withholding periods, worker protection and traceability — so keeping the records properly is most of the preparation.', tag:'Certification', severity:'green', ref:'Private standards — buyer requirement' },
    ]
  },
  {
    category: 'Plant Material & Varieties', jurisdiction: 'ZA', only: 'crops', icon: '🌱',
    items: [
      { title:'Certified Propagating Material', body:'The sale of seed, seedlings, trees and vines is regulated, and suppliers must be registered. Buy from registered suppliers and keep the invoice and any certificate — it is the start of the traceability chain and the only proof of what was actually planted.', tag:'Mandatory', severity:'amber', ref:'Plant Improvement Act 11 of 2018' },
      { title:'Plant Breeders’ Rights', body:'Many fruit, vine and grain cultivars are protected varieties. Propagating them — grafting, taking cuttings, or retaining seed — without a licence from the rights holder infringes those rights, and royalties are payable. Check the status of a cultivar before you multiply it.', tag:'Mandatory', severity:'red', ref:'Plant Breeders’ Rights Act 12 of 2018' },
      { title:'Genetically Modified Crops', body:'GM maize, soya and cotton are grown in South Africa under permit. The technology provider holds the permits, but conditions pass to the grower through the seed agreement — most importantly refuge planting for Bt crops, which slows pest resistance. Keep seed bag labels and planting records.', tag:'Mandatory', severity:'amber', ref:'Genetically Modified Organisms Act 15 of 1997' },
      { title:'Importing Plant Material', body:'Plants, plant products, seed and soil may not be brought into the country without a DALRRD import permit. This is the route most new pests and diseases take onto a farm.', tag:'Mandatory', severity:'red', ref:'Agricultural Pests Act 36 of 1983, section 3(1)' },
    ]
  },
  {
    category: 'Land, Water & Conservation', jurisdiction: 'ZA', only: 'crops', icon: '💧',
    items: [
      { title:'Water Use Authorisation', body:'Taking water for irrigation, or storing it, requires authorisation — as a Schedule 1 use, under a General Authorisation, as an existing lawful use, or under a water use licence. Water use must also be registered. Which route applies depends on volume, catchment and history, so confirm your position rather than assuming.', tag:'Mandatory', severity:'red', ref:'National Water Act 36 of 1998' },
      { title:'Cultivation of Virgin Soil, Slopes and Wetlands', body:'Breaking virgin land, cultivating steep slopes, and cultivating wetlands or land alongside a watercourse are restricted and may require authorisation. Soil conservation works already on the farm — contours, waterways, banks — must be maintained.', tag:'Mandatory', severity:'amber', ref:'Conservation of Agricultural Resources Act 43 of 1983' },
      { title:'Declared Invasive Species', body:'Landowners have a duty to control listed alien and invasive plants. Category 1a and 1b species must be removed and destroyed; others are restricted or may only be kept under conditions. The duty runs with the land, so it transfers on sale.', tag:'Mandatory', severity:'amber', ref:'National Environmental Management: Biodiversity Act 10 of 2004 — Alien and Invasive Species Regulations' },
      { title:'Spray Drift onto Neighbouring Land', body:'Drift onto a neighbour’s crop, a watercourse or a dwelling can cause residue failures on produce that was never sprayed, and creates liability. Record wind conditions at application, respect buffer strips along water, and do not spray in unsuitable weather.', tag:'Mandatory', severity:'amber', ref:'Act 36 of 1947 — label conditions; common-law liability' },
    ]
  },
  {
    category: 'Crop Records & Traceability', jurisdiction: 'ZA', only: 'crops', icon: '🧾',
    items: [
      { title:'Lot Identification', body:'Give every consignment a lot or batch code that ties it back to the block it came off, the date it was picked and the treatments applied to it. That code is what a recall, a buyer query or a residue investigation is traced by — without it, a problem on one pallet implicates the whole season.', tag:'Mandatory', severity:'amber', ref:'Buyer, export and assurance-scheme requirement' },
      { title:'Record Retention', body:'Keep planting, spray, harvest and dispatch records for at least as long as your buyer or certification scheme requires — commonly two years, and longer for export programmes. Records are worth keeping past the minimum: they are the only defence if a consignment is queried after the fact.', tag:'Mandatory', severity:'amber', ref:'Buyer, export and assurance-scheme requirement' },
      { title:'Traceability Both Ways', body:'You should be able to work forward from a block to every consignment that left it, and backward from a delivery note to the block, the sprays and the propagating material. Both directions get tested in an audit.', tag:'Mandatory', severity:'amber', ref:'Assurance-scheme requirement' },
    ]
  },
  {
    category: 'Environmental', jurisdiction: 'general', icon: '🌿',
    items: [
      { title:'Manure & Slurry Management', body:'Manure stores must be at least 10 m from watercourses. Closed season spreading restrictions apply November–January. Nutrient Management Plans required for larger farms.', tag:'Mandatory', severity:'amber' },
      { title:'Water Abstraction Licences', body:'Abstracting more than 20 m³/day requires a licence. Borehole registration required. Water quality testing required twice annually.', tag:'Mandatory', severity:'amber' },
      { title:'Greenhouse Gas Reporting', body:'Farms over 250 livestock units must participate in national GHG reporting schemes. Methane reduction plans encouraged with subsidy incentives.', tag:'Recommended', severity:'blue' },
      { title:'Hedgerow & Buffer Zone', body:'Minimum 2 m buffer strip alongside watercourses. No chemical application within 6 m of waterways. Hedgerow removal requires notification.', tag:'Mandatory', severity:'amber' },
    ]
  },
  {
    category: 'Traceability & Record-Keeping', jurisdiction: 'general', only: 'livestock', icon: '📋',
    items: [
      { title:'Ear Tagging & Identification', body:'Cattle — two approved ear tags within 20 days of birth. Sheep/goats — tagged before leaving holding. Pigs — slap mark or ear tag before movement. Must be registered in national database.', tag:'Mandatory', severity:'red' },
      { title:'Movement Records', body:'All animal movements on/off-farm must be recorded within 3 days. Online cattle tracing mandatory for cattle. Holding numbers required for all species.', tag:'Mandatory', severity:'red' },
      { title:'Medicine & Treatment Log', body:'Date, product, dose, route, batch number, withdrawal period, and operator must be recorded for every treatment. Kept for minimum 5 years.', tag:'Mandatory', severity:'red' },
      { title:'Feed Records', body:'Compound feed labels must be kept. Home-mix records required. Medicated feed prescriptions stored. Annual feed audit recommended for certified farms.', tag:'Mandatory', severity:'amber' },
    ]
  },
  {
    category: 'Organic & Certification', jurisdiction: 'general', only: 'livestock', icon: '✅',
    items: [
      { title:'Organic Conversion Period', body:'Minimum 12 months for livestock products, 24 months for beef cattle. Animals must be sourced from certified organic farms where possible.', tag:'Certification', severity:'green' },
      { title:'Antibiotic-Free Standards', body:'No preventive antibiotic use under organic certification. Treated animals lose organic status and must be sold conventionally during withholding period.', tag:'Certification', severity:'green' },
      { title:'Free-Range Welfare Mark', body:'Minimum 4 m² outdoor access per bird. Year-round access required. Stocking density ≤13 birds/m² indoors. Annual inspections by certifying body.', tag:'Certification', severity:'green' },
    ]
  },
  {
    category: 'Worker Safety', jurisdiction: 'general', icon: '🦺',
    items: [
      { title:'Zoonotic Disease Protection', body:'PPE required when handling sick animals or birthing. Leptospirosis, Campylobacter, Cryptosporidium protocols mandatory. Hepatitis E vaccination recommended for pig workers.', tag:'Mandatory', severity:'red' },
      { title:'Manual Handling & Crush Safety', body:'Risk assessments for animal handling operations. ROPS-compliant tractors required. Crush and race structures must be inspected annually.', tag:'Mandatory', severity:'amber' },
      { title:'Slurry & Confined Space', body:'Never enter slurry pits alone. Gas monitors required in confined spaces. Emergency rescue plan posted at all confined space entries.', tag:'Mandatory', severity:'red' },
    ]
  },
];
