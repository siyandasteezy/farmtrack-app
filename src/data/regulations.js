/**
 * Compliance reference, written against named South African legislation.
 *
 * Every item cites the Act it comes from in `ref`, because on a page like this
 * the citation is the part that can be checked. Where a requirement depends on
 * the species, the province, the catchment or the buyer, the item says so
 * rather than inventing a figure — a confident wrong number here would be
 * acted on.
 *
 * Several items exist to correct a belief rather than state a rule: South
 * African law sets no stocking densities for most livestock and no general
 * quarantine period, and has no organic standard in force. Saying so is more
 * useful than silence, because the numbers in circulation are borrowed from
 * jurisdictions whose rules do not apply here.
 *
 * `jurisdiction` is 'ZA' for all of these. It is kept because the page badges
 * it, and because anything added later that has not been checked against South
 * African law should be marked 'general' and shown as unverified.
 *
 * `only` limits a category to farms running that enterprise, the same way the
 * sidebar does. Categories without it are shown to everyone.
 */

export const REGULATIONS = [
  {
    category: 'Animal Welfare', jurisdiction: 'ZA', only: 'livestock', icon: '🐾',
    items: [
      { title:'Duty of Care', body:'It is a criminal offence to ill-treat, neglect or overwork an animal, or to fail to provide it with sufficient food, water, shelter or veterinary attention. This is the law animal welfare is actually enforced under in South Africa — there is no separate welfare act — and the NSPCA holds powers of inspection and private prosecution.', tag:'Mandatory', severity:'red', ref:'Animals Protection Act 71 of 1962' },
      { title:'Stocking Density and Housing', body:'South African law prescribes no minimum space per animal for most species. That is not permission: overcrowding that causes suffering is prosecutable under the duty of care. Figures come from industry codes (RPO, SAPA, SAPPO) and from buyer schemes, and those are the numbers an audit will measure you against.', tag:'Mandatory', severity:'amber', ref:'Animals Protection Act 71 of 1962; industry codes of practice' },
      { title:'Slaughter at a Registered Abattoir', body:'Animals slaughtered for meat intended for human consumption must be slaughtered at a registered abattoir meeting the essential national standards, which include stunning. Religious slaughter is provided for within those standards. Slaughter for the owner\'s own household is treated differently — confirm the position with your provincial authority rather than assuming.', tag:'Mandatory', severity:'red', ref:'Meat Safety Act 40 of 2000' },
      { title:'Procedures Reserved for Veterinarians', body:'Diagnosis, surgery and a range of other procedures may only be performed by a registered veterinarian or, within their scope, an authorised para-veterinary professional. Performing them without registration is an offence.', tag:'Mandatory', severity:'red', ref:'Veterinary and Para-Veterinary Professions Act 19 of 1982' },
      { title:'Castration, Dehorning and Docking', body:'No ages or methods are fixed in statute. They are governed by the duty not to cause unnecessary suffering, and by industry codes recommending the youngest practical age with pain control. A routine procedure that causes avoidable suffering is still an offence, however common it is.', tag:'Mandatory', severity:'amber', ref:'Animals Protection Act 71 of 1962; industry codes of practice' },
      { title:'Transport', body:'Animals must be transported without unnecessary suffering — fitness to travel, loading density, ventilation and journey time. SANS 1488 is the recognised standard and is increasingly required by abattoirs and buyers even though it is not itself law.', tag:'Mandatory', severity:'amber', ref:'Animals Protection Act 71 of 1962; SANS 1488' },
    ]
  },
  {
    category: 'Health & Biosecurity', jurisdiction: 'ZA', only: 'livestock', icon: '🦠',
    items: [
      { title:'Controlled and Notifiable Diseases', body:'The Act and its regulations schedule controlled animal diseases. An owner or manager who knows or suspects that an animal has one must report it to the state veterinarian without delay. Foot-and-mouth disease, anthrax, rabies, brucellosis, African swine fever and highly pathogenic avian influenza are among them. Reporting is a legal duty, not a courtesy, and concealment is an offence.', tag:'Mandatory', severity:'red', ref:'Animal Diseases Act 35 of 1984 and its regulations' },
      { title:'Duty to Prevent Infection and Spread', body:'Owners must take all reasonable steps to keep their animals free of controlled diseases and to stop them spreading — isolating sick animals, controlling visitors and vehicles, and disposing of carcasses properly. The duty sits with the owner, not the state vet.', tag:'Mandatory', severity:'red', ref:'Animal Diseases Act 35 of 1984' },
      { title:'Movement Control and Permits', body:'Moving animals out of a controlled area — notably the foot-and-mouth disease control zones along the Kruger boundary — requires a state veterinary permit, and may require quarantine and testing first. Moving animals without one is an offence, and it is how outbreaks travel.', tag:'Mandatory', severity:'red', ref:'Animal Diseases Act 35 of 1984' },
      { title:'Bovine Brucellosis', body:'Brucellosis is a controlled disease. Testing, vaccination of heifer calves and the handling of reactors follow the national control measures; positive animals must be reported and dealt with as the state veterinarian directs. It is also a serious human infection, which is why the reporting duty is strict.', tag:'Mandatory', severity:'red', ref:'Animal Diseases Act 35 of 1984 — bovine brucellosis control measures' },
      { title:'Stock Remedies and Veterinary Medicines', body:'Stock remedies are registered under Act 36 of 1947 and carry a G number on the label. Veterinary medicines are registered under Act 101 of 1965, and scheduled medicines require a veterinarian\'s prescription. Use only according to the label — species, dose and route.', tag:'Mandatory', severity:'red', ref:'Act 36 of 1947; Medicines and Related Substances Act 101 of 1965' },
      { title:'Withdrawal Periods', body:'Every label states the withdrawal period for meat, milk or eggs. Selling product from an animal inside that period puts residues into the food chain and is the livestock equivalent of harvesting a sprayed crop too early. Record the treatment date and the withdrawal period so the release date is not left to memory.', tag:'Mandatory', severity:'red', ref:'Act 36 of 1947 / Act 101 of 1965 — label conditions' },
      { title:'New Arrivals and Quarantine', body:'General law prescribes no fixed isolation period for incoming stock — the 14 to 28 days often quoted is industry practice, not a South African legal requirement. Isolating and testing new arrivals before mixing remains the single most effective thing you can do, and quarantine may be imposed as a permit condition.', tag:'Recommended', severity:'blue', ref:'Industry practice; permit conditions under Act 35 of 1984' },
    ]
  },
  {
    /* South Africa: Control Measures relating to Honey-bees, G.N. R.858 of
       15 November 2013, made under the Agricultural Pests Act 36 of 1983. */
    category: 'Beekeeping & Apiaries', only: 'livestock', jurisdiction: 'ZA', icon: '🐝',
    items: [
      { title:'Beekeeper Registration (every 24 months)', body:'Anyone who keeps, owns or is in charge of a honey-bee colony — commercial, hobbyist or bee-removal operator — must register with DALRRD and renew every 24 months.', tag:'Mandatory', severity:'red', ref:'Control Measures relating to Honey-bees (R.858 of 2013), Agricultural Pests Act 36 of 1983' },
      { title:'Beehive Marking', body:'Every beehive must be marked clearly and legibly with the registration number allocated to the beekeeper. Unmarked hives are non-compliant.', tag:'Mandatory', severity:'red', ref:'Control Measures relating to Honey-bees (R.858 of 2013), Agricultural Pests Act 36 of 1983' },
      { title:'American Foulbrood — Notifiable', body:'American foulbrood (AFB) is a declared notifiable disease. Beekeepers are obliged to manage or eradicate it, report findings to DALRRD, and may be required to destroy infected colonies. Infected colonies and their equipment may not be moved.', tag:'Mandatory', severity:'red', ref:'Control Measures relating to Honey-bees (R.858 of 2013), Agricultural Pests Act 36 of 1983' },
      { title:'Cape Bee (capensis) Control', body:'Removal and movement of capensis-infected colonies is prohibited, and infected colonies are subject to destruction. Moving Cape bees (A. m. capensis) into A. m. scutellata areas triggers laying-worker social parasitism that can collapse host colonies.', tag:'Mandatory', severity:'red', ref:'Control Measures relating to Honey-bees (R.858 of 2013), Agricultural Pests Act 36 of 1983' },
      { title:'Colony Inspection & Record-Keeping', body:'Beekeepers must inspect every colony in their beehives and keep records as prescribed under the Control Measures — inspection dates, disease findings and actions taken.', tag:'Mandatory', severity:'amber', ref:'Control Measures relating to Honey-bees (R.858 of 2013), Agricultural Pests Act 36 of 1983' },
      { title:'Import of Bees, Honey & Used Equipment', body:'Honey, beeswax and used apiary equipment are controlled goods. A DALRRD import permit is required before importing any of them.', tag:'Mandatory', severity:'amber', ref:'Agricultural Pests Act 36 of 1983, section 3(1)' },
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
    category: 'Environmental', jurisdiction: 'ZA', icon: '🌿',
    items: [
      { title:'Veld and Grazing Management', body:'Landowners must protect the soil and the vegetation on it — avoiding overgrazing, keeping within carrying capacity and preventing erosion. Directives can be issued requiring corrective measures, and they are enforceable.', tag:'Mandatory', severity:'amber', ref:'Conservation of Agricultural Resources Act 43 of 1983' },
      { title:'Soil Conservation Works', body:'Contours, waterways and banks already established on the farm must be maintained. Breaking virgin soil, cultivating steep slopes, and cultivating wetlands or land alongside a watercourse are restricted.', tag:'Mandatory', severity:'amber', ref:'Conservation of Agricultural Resources Act 43 of 1983' },
      { title:'Declared Weeds and Invader Plants', body:'Landowners must control listed alien and invasive species. Category 1a and 1b plants must be removed and destroyed; others are restricted or may be kept only under conditions. The duty runs with the land and transfers on sale.', tag:'Mandatory', severity:'amber', ref:'NEM:BA 10 of 2004 — Alien and Invasive Species Regulations; CARA 43 of 1983' },
      { title:'Water Use and Registration', body:'Reasonable stock watering from a resource on your own land is generally a permissible use, but abstraction for irrigation, or storage above the permitted thresholds, needs authorisation — a General Authorisation, an existing lawful use, or a licence. Water use must be registered. Which route applies depends on volume and catchment, so confirm your position rather than assuming.', tag:'Mandatory', severity:'red', ref:'National Water Act 36 of 1998 (Schedule 1; water use authorisation)' },
      { title:'Preventing Water Pollution', body:'There is a general duty on anyone who owns or controls land to prevent pollution of a water resource, and to remedy it if it happens. On a livestock farm the usual sources are feedlot runoff, dairy parlour effluent, and badly sited manure or carcass pits. The duty falls on the landowner regardless of who caused it.', tag:'Mandatory', severity:'red', ref:'National Water Act 36 of 1998, section 19' },
      { title:'Intensive Animal Facilities', body:'Establishing or expanding feedlots, piggeries, poultry houses or aquaculture above the listed thresholds is a listed activity requiring environmental authorisation before construction begins. Building first and applying afterwards is an offence and can result in demolition.', tag:'Mandatory', severity:'red', ref:'National Environmental Management Act 107 of 1998 — EIA Regulations' },
      { title:'Carcass Disposal', body:'Carcasses must be disposed of so they cannot spread disease or contaminate water — the method may be directed by the state veterinarian where a controlled disease is involved.', tag:'Mandatory', severity:'amber', ref:'Animal Diseases Act 35 of 1984; National Water Act 36 of 1998' },
    ]
  },
  {
    category: 'Traceability & Record-Keeping', jurisdiction: 'ZA', only: 'livestock', icon: '📋',
    items: [
      { title:'Registered Identification Mark', body:'Owners of the prescribed kinds of animals — cattle, sheep, goats and pigs — must obtain a registered identification mark from the Registrar. The mark is the legal link between an animal and its owner, and it is what makes a stolen animal recoverable.', tag:'Mandatory', severity:'red', ref:'Animal Identification Act 6 of 2002' },
      { title:'Marking Before Sale, Movement or Slaughter', body:'Animals must carry the owner\'s registered mark — tattooed or branded as prescribed for the species — before they are sold, moved off the property or slaughtered. An unmarked animal is hard to claim and easy to lose.', tag:'Mandatory', severity:'red', ref:'Animal Identification Act 6 of 2002' },
      { title:'Proof of Lawful Possession', body:'Anyone moving or selling livestock should carry documentation showing lawful possession — a removal certificate or equivalent. Being found in possession of stock you cannot account for is an offence in itself, and weak paperwork turns an ordinary sale into a stock-theft investigation.', tag:'Mandatory', severity:'red', ref:'Stock Theft Act 57 of 1959' },
      { title:'Treatment Records', body:'Record the date, animal, product and registration number, dose, route, operator and withdrawal period for every treatment. This is what demonstrates that withdrawal periods were observed, and it is the first thing asked for if an abattoir finds a residue.', tag:'Mandatory', severity:'amber', ref:'Act 36 of 1947 / Act 101 of 1965; abattoir and buyer requirement' },
      { title:'Feed Records', body:'Keep labels and invoices for compound feed and records of home mixes, including any medicated feed. Farm feeds are themselves registered products.', tag:'Mandatory', severity:'amber', ref:'Act 36 of 1947' },
      { title:'National Traceability', body:'A national livestock identification and traceability system has been under development for several years. It is not yet a general obligation, but keeping marks, movements and treatments in order now is what will make joining it straightforward rather than a scramble.', tag:'Recommended', severity:'blue', ref:'DALRRD — LITS SA, in development' },
    ]
  },
  {
    category: 'Organic & Certification', jurisdiction: 'ZA', only: 'livestock', icon: '✅',
    items: [
      { title:'No National Organic Standard', body:'South Africa has no promulgated organic regulation. Draft regulations have been in process for years and are not in force, so "organic" sold domestically is not a legally defined or independently policed claim. Anyone certifying here does so against a foreign or private standard.', tag:'Recommended', severity:'blue', ref:'Agricultural Product Standards Act 119 of 1990 — draft organic regulations not in force' },
      { title:'Organic for Export', body:'Selling as organic into the EU, UK or US means certification by an accredited body against that market\'s standard. Conversion periods, permitted treatments and inspection frequency are set by that standard, not by South African law, and they differ between markets.', tag:'Certification', severity:'green', ref:'Importing country standards (EU, UK, USDA NOP)' },
      { title:'Claims Must Not Mislead', body:'"Free-range", "grass-fed", "hormone-free" and "antibiotic-free" have no statutory definition in South Africa. That does not make them safe to use loosely — food labelling law prohibits false or misleading claims, so any claim must be defensible from your own records if challenged.', tag:'Mandatory', severity:'amber', ref:'Foodstuffs, Cosmetics and Disinfectants Act 54 of 1972 — labelling regulations (R.146 of 2010)' },
      { title:'Industry Assurance Schemes', body:'SAPA, SAPPO and the red meat industry bodies run their own audited schemes and certification marks. They are not law, but they are often what a retailer actually requires, and they set the stocking densities and welfare criteria that statute leaves open.', tag:'Certification', severity:'green', ref:'Industry schemes — buyer requirement' },
    ]
  },
  {
    category: 'Worker Safety', jurisdiction: 'ZA', icon: '🦺',
    items: [
      { title:'A Farm Is a Workplace', body:'The Occupational Health and Safety Act applies to farms in full. Employers must provide a safe working environment, assess risks, maintain machinery, and train and supervise workers — seasonal and contract workers included.', tag:'Mandatory', severity:'red', ref:'Occupational Health and Safety Act 85 of 1993' },
      { title:'Compensation Fund Registration', body:'Employers must register with the Compensation Fund, pay assessments, and report occupational injuries and diseases. An employer who has not registered carries the cost of an injury claim personally.', tag:'Mandatory', severity:'red', ref:'Compensation for Occupational Injuries and Diseases Act 130 of 1993' },
      { title:'Dips, Remedies and Chemicals', body:'Anyone handling dips, remedies, disinfectants or medicated feed must be trained, issued the protective equipment the label specifies, and protected from exposure. Organophosphate dips in particular cause real poisonings on farms.', tag:'Mandatory', severity:'red', ref:'OHS Act 85 of 1993 — hazardous chemical agents regulations' },
      { title:'Zoonotic Disease', body:'Brucellosis, rabies, anthrax, Rift Valley fever and Q fever all pass from animals to people, and several are controlled diseases that must also be reported to the state vet. Rabies exposure is a medical emergency, not a wait-and-see. Protective equipment for calving, lambing, post-mortems and carcass handling.', tag:'Mandatory', severity:'red', ref:'OHS Act 85 of 1993; Animal Diseases Act 35 of 1984' },
      { title:'Tractors and Machinery', body:'Tractors and power-take-off driven machinery must be guarded, maintained and operated only by trained people. PTO entanglement and tractor rollovers remain among the most common causes of death on farms.', tag:'Mandatory', severity:'amber', ref:'OHS Act 85 of 1993 — driven machinery regulations' },
      { title:'Handling Livestock', body:'Crushes, races and loading ramps must be sound and properly maintained. Crush injuries and bull attacks are among the most frequent serious injuries in livestock farming, and they happen in facilities people knew were worn out.', tag:'Mandatory', severity:'amber', ref:'Occupational Health and Safety Act 85 of 1993' },
    ]
  },
];
