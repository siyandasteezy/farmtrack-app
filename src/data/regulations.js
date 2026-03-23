export const REGULATIONS = [
  {
    category: 'Animal Welfare', icon: '🐾',
    items: [
      { title:'Five Freedoms Standard', body:'All livestock must have freedom from hunger, discomfort, pain, fear, and freedom to express natural behaviour. Applies to all farmed animals under the Animal Welfare Act.', tag:'Mandatory', severity:'red' },
      { title:'Minimum Space Requirements', body:'Cattle ≥2.2 m², pigs ≥0.65 m² (grow-out), poultry ≤19 kg/m² (broiler); outdoor access required for free-range classification.', tag:'Mandatory', severity:'red' },
      { title:'Humane Slaughter', body:'Animals must be stunned before slaughter. All operators require an Animal Welfare Certificate. Halal/Kosher exemptions may apply with religious endorsement.', tag:'Mandatory', severity:'red' },
      { title:'Castration & Dehorning', body:'Must be performed before specified ages; anaesthesia required when performed on older animals. Tail docking banned in cattle, restricted in sheep.', tag:'Mandatory', severity:'amber' },
    ]
  },
  {
    category: 'Health & Biosecurity', icon: '🦠',
    items: [
      { title:'Notifiable Disease Reporting', body:'FMD, Anthrax, Brucellosis, BSE, Avian Influenza, and Newcastle Disease must be reported to the relevant authority within 24 hours of suspicion.', tag:'Mandatory', severity:'red' },
      { title:'Quarantine Protocols', body:'Newly acquired animals must be isolated for 14–28 days. Movement permits required between farms. Keep movement records for minimum 3 years.', tag:'Mandatory', severity:'red' },
      { title:'Vaccination Schedules', body:'FMD vaccination required in endemic areas (bi-annual). Brucellosis vaccination for cattle calves. Poultry — Newcastle Disease, Marek\'s. Maintain vaccination records.', tag:'Mandatory', severity:'amber' },
      { title:'Veterinary Prescriptions', body:'Prescription-only medicines require a Vet-Client-Patient relationship. Maintain medicine records for 5 years. Observe withholding periods before slaughter.', tag:'Mandatory', severity:'amber' },
    ]
  },
  {
    category: 'Environmental', icon: '🌿',
    items: [
      { title:'Manure & Slurry Management', body:'Manure stores must be at least 10 m from watercourses. Closed season spreading restrictions apply November–January. Nutrient Management Plans required for larger farms.', tag:'Mandatory', severity:'amber' },
      { title:'Water Abstraction Licences', body:'Abstracting more than 20 m³/day requires a licence. Borehole registration required. Water quality testing required twice annually.', tag:'Mandatory', severity:'amber' },
      { title:'Greenhouse Gas Reporting', body:'Farms over 250 livestock units must participate in national GHG reporting schemes. Methane reduction plans encouraged with subsidy incentives.', tag:'Recommended', severity:'blue' },
      { title:'Hedgerow & Buffer Zone', body:'Minimum 2 m buffer strip alongside watercourses. No chemical application within 6 m of waterways. Hedgerow removal requires notification.', tag:'Mandatory', severity:'amber' },
    ]
  },
  {
    category: 'Traceability & Record-Keeping', icon: '📋',
    items: [
      { title:'Ear Tagging & Identification', body:'Cattle — two approved ear tags within 20 days of birth. Sheep/goats — tagged before leaving holding. Pigs — slap mark or ear tag before movement. Must be registered in national database.', tag:'Mandatory', severity:'red' },
      { title:'Movement Records', body:'All animal movements on/off-farm must be recorded within 3 days. Online cattle tracing mandatory for cattle. Holding numbers required for all species.', tag:'Mandatory', severity:'red' },
      { title:'Medicine & Treatment Log', body:'Date, product, dose, route, batch number, withdrawal period, and operator must be recorded for every treatment. Kept for minimum 5 years.', tag:'Mandatory', severity:'red' },
      { title:'Feed Records', body:'Compound feed labels must be kept. Home-mix records required. Medicated feed prescriptions stored. Annual feed audit recommended for certified farms.', tag:'Mandatory', severity:'amber' },
    ]
  },
  {
    category: 'Organic & Certification', icon: '✅',
    items: [
      { title:'Organic Conversion Period', body:'Minimum 12 months for livestock products, 24 months for beef cattle. Animals must be sourced from certified organic farms where possible.', tag:'Certification', severity:'green' },
      { title:'Antibiotic-Free Standards', body:'No preventive antibiotic use under organic certification. Treated animals lose organic status and must be sold conventionally during withholding period.', tag:'Certification', severity:'green' },
      { title:'Free-Range Welfare Mark', body:'Minimum 4 m² outdoor access per bird. Year-round access required. Stocking density ≤13 birds/m² indoors. Annual inspections by certifying body.', tag:'Certification', severity:'green' },
    ]
  },
  {
    category: 'Worker Safety', icon: '🦺',
    items: [
      { title:'Zoonotic Disease Protection', body:'PPE required when handling sick animals or birthing. Leptospirosis, Campylobacter, Cryptosporidium protocols mandatory. Hepatitis E vaccination recommended for pig workers.', tag:'Mandatory', severity:'red' },
      { title:'Manual Handling & Crush Safety', body:'Risk assessments for animal handling operations. ROPS-compliant tractors required. Crush and race structures must be inspected annually.', tag:'Mandatory', severity:'amber' },
      { title:'Slurry & Confined Space', body:'Never enter slurry pits alone. Gas monitors required in confined spaces. Emergency rescue plan posted at all confined space entries.', tag:'Mandatory', severity:'red' },
    ]
  },
];
