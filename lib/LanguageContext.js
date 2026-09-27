"use client";

import { createContext, useContext, useState, useEffect } from "react";

const translations = {
  en: {
    // Nav
    brandName: "Vajra",
    citizenPortal: "Citizen Portal",
    hotspotsMap: "Hotspots Map",
    statusTracker: "Status Tracker",
    municipalPlanner: "Municipal Planner",
    trackReport: "Track Report",
    submitReport: "Submit Report",

    // Hero
    heroTag: "DIGITAL PUBLIC INFRASTRUCTURE CONSOLE",
    heroHeadline1: "Citizen Voice to",
    heroHeadline2: "Municipal Action.",
    heroLead: "Vajra is India's precision AI infrastructure platform. We turn fragmented citizen complaints into geospatially clustered hotspots, verify photo evidence with Gemini Vision, and rank municipal spending using transparent greedy budget optimization.",
    reportIssueBtn: "Report an Issue",
    exploreHotspotsBtn: "Explore Hotspots Map →",
    plannerBtn: "Municipal Planner →",

    // Citizen Form
    formTitle: "Citizen Infrastructure Complaint",
    formSubtitle: "Recorded to municipal public ledger & analyzed with Gemini embeddings.",
    sectorLabel: "1. Infrastructure Sector",
    descLabel: "2. Detailed Description",
    descPlaceholder: "Describe the defect, location landmarks, severity, and impact...",
    gpsLabel: "3. Geolocation Verification",
    detectGps: "Detect GPS",
    gpsAcquiring: "Acquiring...",
    photoLabel: "4. Photo Proof (Gemini Vision Verification)",
    uploadPhoto: "Upload Evidence",
    changePhoto: "Change Photo",
    removePhoto: "Remove",
    submitBtn: "Submit to Public Ledger →",
    submittingBtn: "Analyzing & Vectorizing...",
    reportSuccess: "Report Logged & Dispatched to AI Engine!",
    trackingIdNotice: "Your tracking ID has been generated:",
    trackStatusBtn: "Track Neighborhood Status →",

    // Categories
    cat_roads: "Roads & Potholes",
    cat_water_supply: "Water Supply",
    cat_sanitation: "Sanitation",
    cat_streetlights: "Streetlights",
    cat_drainage: "Drainage",
    cat_health_facility: "Health Facility",
    cat_public_transport: "Public Transit",
    cat_solid_waste: "Solid Waste",
    cat_other: "Other Issues",

    // Status
    statusTitle: "Track Infrastructure Complaint",
    statusSubtitle: "Follow your report from Gemini AI vectorization to neighborhood clustering and municipal funding.",
    searchPlaceholder: "Enter 20-character Tracking ID",
    trackStatusSearchBtn: "Track Status →",
    status_received: "Received",
    status_verified: "Verified",
    status_funded: "Funded",
    status_queued: "Queued",
    badgeFunded: "✓ FUNDED FOR TENDER",
    badgeQueued: "⏳ QUEUED FOR BUDGET",
    badgeReceived: "📩 RECEIVED",
    step1Title: "1. Complaint Logged to Public Ledger",
    step1Desc: "Recorded on public ledger.",
    step2Title: "2. Gemini Vectorization & Vision Verification",
    step2Desc: "Complaint vectorized with Gemini Embedding 001.",
    step3Title: "3. Neighborhood Hotspot Clustering",
    step3Desc: "Corroborated with citizen reports within 2km radius.",
    step4Title: "4. Municipal Budget Allocation",
    step4Funded: "✓ High priority score cleared the municipal budget cutoff! Civic tender is approved and funded.",
    step4Queued: "⏳ Hotspot is verified on the municipal priority board. Currently queued for funding in next round.",

    // Planner
    plannerTitle: "Priority Ranking & Budget Allocation",
    plannerSubtitle: "Dynamic greedy knapsack optimization: category_weight × corroboration × recency.",
    noiseReductionTitle: "AI DEMAND AGGREGATION & NOISE REDUCTION",
    noiseReductionSub: "Gemini vector embeddings deduplicated fragmented citizen complaints into verified, actionable municipal action plans.",
    rawReportsLabel: "raw reports",
    verifiedHotspotsLabel: "verified hotspots",
    noiseFilteredLabel: "Redundancy Filtered",
    noiseEliminated: "Noise eliminated",
    budgetSliderTitle: "Live Municipal Budget Allocation",
    budgetSliderSub: "Drag to simulate capital allocation thresholds. Watch projects automatically transition between funded and queued.",
    commitBudgetBtn: "Commit Decision to Ledger →",
    fundedHotspotsStat: "Funded Hotspots",
    queuedHotspotsStat: "Queued Hotspots",
    totalHotspotsStat: "Total Verified Hotspots",
    budgetUtilizationStat: "Budget Utilization",
  },

  te: {
    // Nav
    brandName: "వజ్ర",
    citizenPortal: "పౌర వేదిక",
    hotspotsMap: "హాట్‌స్పాట్ మ్యాప్",
    statusTracker: "స్థితి ట్రాకర్",
    municipalPlanner: "మునిసిపల్ ప్లానర్",
    trackReport: "ఫిర్యాదు ట్రాక్ చేయండి",
    submitReport: "ఫిర్యాదు ఇవ్వండి",

    // Hero
    heroTag: "డిజిటల్ పబ్లిక్ ఇన్‌ఫ్రాస్ట్రక్చర్ కన్సోల్",
    heroHeadline1: "పౌరుల స్వరం నుండి",
    heroHeadline2: "మునిసిపల్ కార్యాచరణ.",
    heroLead: "వజ్ర భారతదేశపు అత్యున్నత AI మౌలిక సదుపాయాల వేదిక. పౌరుల సమస్యలను జియోస్పేషియల్ హాట్‌స్పాట్‌లుగా క్లస్టర్ చేసి, జెమిని విజన్‌తో ధృవీకరించి, పారదర్శక బడ్జెట్ ద్వారా నిధులను కేటాయిస్తుంది.",
    reportIssueBtn: "సమస్యను నివేదించండి",
    exploreHotspotsBtn: "హాట్‌స్పాట్ మ్యాప్ చూడండి →",
    plannerBtn: "మునిసిపల్ ప్లానర్ →",

    // Citizen Form
    formTitle: "పౌర మౌలిక సదుపాయాల ఫిర్యాదు",
    formSubtitle: "మునిసిపల్ ప్రజా రికార్డులో నమోదు చేయబడి జెమిని ఎంబెడ్డింగ్స్‌తో విశ్లేషించబడుతుంది.",
    sectorLabel: "1. సమస్య విభాగం",
    descLabel: "2. సమగ్ర వివరాలు",
    descPlaceholder: "సమస్య, స్థానిక ప్రదేశం, తీవ్రత మరియు ప్రజలపై ప్రభావం వివరించండి...",
    gpsLabel: "3. భౌగోళిక స్థానం (GPS)",
    detectGps: "జీపీఎస్ గుర్తించండి",
    gpsAcquiring: "గుర్తిస్తోంది...",
    photoLabel: "4. ఫోటో సాక్ష్యం (జెమిని విజన్ ధృవీకరణ)",
    uploadPhoto: "ఫోటో అప్‌లోడ్",
    changePhoto: "ఫోటో మార్చండి",
    removePhoto: "తొలగించు",
    submitBtn: "ప్రజా రికార్డులో నమోదు చేయండి →",
    submittingBtn: "విశ్లేషిస్తోంది...",
    reportSuccess: "ఫిర్యాదు నమోదు చేయబడింది & ఏఐ ఇంజిన్‌కు పంపబడింది!",
    trackingIdNotice: "మీ ట్రాకింగ్ ఐడీ సిద్ధంగా ఉంది:",
    trackStatusBtn: "పరిసరాల స్థితిని గమనించండి →",

    // Categories
    cat_roads: "రహదారులు & గుంతలు",
    cat_water_supply: "నీటి సరఫరా",
    cat_sanitation: "పారిశుధ్యం & డ్రైనేజీ",
    cat_streetlights: "వీధి దీపాలు",
    cat_drainage: "కాలువలు & వరదలు",
    cat_health_facility: "ఆరోగ్య కేంద్రం",
    cat_public_transport: "రవాణా సౌకర్యాలు",
    cat_solid_waste: "చెత్త నిర్వహణ",
    cat_other: "ఇతర సమస్యలు",

    // Status
    statusTitle: "ఫిర్యాదు స్థితిని ట్రాక్ చేయండి",
    statusSubtitle: "జెమిని ఏఐ వెక్టరైజేషన్ నుండి క్లస్టరింగ్ మరియు మునిసిపల్ నిధుల మంజూరు వరకు ప్రత్యక్ష స్థితిని గమనించండి.",
    searchPlaceholder: "20-అక్షరాల ట్రాకింగ్ ఐడీ నమోదు చేయండి",
    trackStatusSearchBtn: "స్థితిని చూడండి →",
    status_received: "స్వీకరించబడింది",
    status_verified: "ధృవీకరించబడింది",
    status_funded: "నిధులు మంజూరయ్యాయి",
    status_queued: "జాబితాలో వేచి ఉంది",
    badgeFunded: "✓ నిధులు మంజూరయ్యాయి",
    badgeQueued: "⏳ బడ్జెట్ కోసం వేచి ఉంది",
    badgeReceived: "📩 ఫిర్యాదు అందింది",
    step1Title: "1. ఫిర్యాదు ప్రజా రికార్డులో నమోదు చేయబడింది",
    step1Desc: "ప్రజా రికార్డులో సురక్షితంగా నమోదు చేయబడింది.",
    step2Title: "2. జెమిని ఏఐ వెక్టరైజేషన్ & ఫోటో ధృవీకరణ",
    step2Desc: "జెమిని ఎంబెడ్డింగ్ 001 తో ఫిర్యాదు విశ్లేషించబడింది.",
    step3Title: "3. పరిసర ప్రాంతాల హాట్‌స్పాట్ క్లస్టరింగ్",
    step3Desc: "2 కి.మీ పరిధిలోని ఇతర పౌరుల ఫిర్యాదులతో సరిపోల్చబడింది.",
    step4Title: "4. మునిసిపల్ బడ్జెట్ కేటాయింపు",
    step4Funded: "✓ అత్యున్నత ప్రాధాన్యతతో మునిసిపల్ బడ్జెట్ ఆమోదించబడింది! మరమ్మతు పనులు ప్రారంభించబడతాయి.",
    step4Queued: "⏳ సమస్య ధృవీకరించబడింది. తదుపరి బడ్జెట్ కేటాయింపు రౌండ్ కోసం వేచి ఉంది.",

    // Planner
    plannerTitle: "ప్రాధాన్యత ర్యాంకింగ్ & బడ్జెట్ కేటాయింపు",
    plannerSubtitle: "అల్గారిథమిక్ ఆప్టిమైజేషన్: సమస్య ప్రాధాన్యత × ప్రజా మద్దతు × సమయం.",
    noiseReductionTitle: "ఏఐ ఆధారిత డిమాండ్ ఏకీకరణ & సమస్యల శుద్ధి",
    noiseReductionSub: "జెమిని వెక్టర్స్ పౌరుల వ్యక్తిగత ఫిర్యాదులను ఏకీకృతం చేసి సమగ్ర మునిసిపల్ కార్యాచరణగా మార్చాయి.",
    rawReportsLabel: "వ్యక్తిగత ఫిర్యాదులు",
    verifiedHotspotsLabel: "ధృవీకరించిన హాట్‌స్పాట్‌లు",
    noiseFilteredLabel: "శుద్ధి చేసిన శాతం",
    noiseEliminated: "పునరావృత సమస్యలు తొలగించబడ్డాయి",
    budgetSliderTitle: "ప్రత్యక్ష మునిసిపల్ బడ్జెట్ కేటాయింపు స్లైడర్",
    budgetSliderSub: "బడ్జెట్ పరిమితులను మార్చడానికి స్లైడర్‌ను జరపండి. నిధులు మంజూరైన పనులను గమనించండి.",
    commitBudgetBtn: "నిర్ణయాన్ని ఖరారు చేయండి →",
    fundedHotspotsStat: "నిధులు పొందిన హాట్‌స్పాట్‌లు",
    queuedHotspotsStat: "వేచి ఉన్న హాట్‌స్పాట్‌లు",
    totalHotspotsStat: "మొత్తం హాట్‌స్పాట్‌లు",
    budgetUtilizationStat: "బడ్జెట్ వినియోగం",
  },

  hi: {
    // Nav
    brandName: "वज्र",
    citizenPortal: "नागरिक पोर्टल",
    hotspotsMap: "हॉटस्पॉट मैप",
    statusTracker: "स्थिति ट्रैकर",
    municipalPlanner: "नगरपालिका योजनाकार",
    trackReport: "स्थिति जांचें",
    submitReport: "शिकायत दर्ज करें",

    // Hero
    heroTag: "डिजिटल पब्लिक इंफ्रास्ट्रक्चर कंसोल",
    heroHeadline1: "नागरिकों की आवाज से",
    heroHeadline2: "नगरपालिका समाधान तक।",
    heroLead: "वज्र भारत का सटीक एआई सार्वजनिक अवसंरचना मंच है। हम नागरिक शिकायतों को एआई क्लस्टरिंग द्वारा सत्यापित करते हैं और पारदर्शी नगरपालिका बजट आवंटन से जोड़ते हैं।",
    reportIssueBtn: "शिकायत दर्ज करें",
    exploreHotspotsBtn: "हॉटस्पॉट मैप देखें →",
    plannerBtn: "नगरपालिका योजनाकार →",

    // Citizen Form
    formTitle: "नागरिक अवसंरचना शिकायत",
    formSubtitle: "सार्वजनिक लेजर में दर्ज और जेमिनी एआई वेक्टर द्वारा विश्लेषित।",
    sectorLabel: "1. अवसंरचना क्षेत्र",
    descLabel: "2. विस्तृत विवरण",
    descPlaceholder: "समस्या, स्थान, गंभीरता और जनजीवन पर प्रभाव का विवरण दें...",
    gpsLabel: "3. भौगोलिक स्थान (GPS)",
    detectGps: "जीपीएस पता करें",
    gpsAcquiring: "स्थान खोज रहा है...",
    photoLabel: "4. फोटो प्रमाण (जेमिनी विज़न सत्यापन)",
    uploadPhoto: "फोटो अपलोड करें",
    changePhoto: "फोटो बदलें",
    removePhoto: "हटाएं",
    submitBtn: "सार्वजनिक लेजर में दर्ज करें →",
    submittingBtn: "विश्लेषण जारी है...",
    reportSuccess: "शिकायत दर्ज हुई और एआई इंजन को भेजी गई!",
    trackingIdNotice: "आपकी ट्रैकिंग आईडी तैयार है:",
    trackStatusBtn: "मोहल्ले की स्थिति ट्रैक करें →",

    // Categories
    cat_roads: "सड़कें एवं गड्ढे",
    cat_water_supply: "जल आपूर्ति",
    cat_sanitation: "सफाई एवं सीवरेज",
    cat_streetlights: "स्ट्रीट लाइट",
    cat_drainage: "नाली एवं जलभराव",
    cat_health_facility: "स्वास्थ्य केंद्र",
    cat_public_transport: "सार्वजनिक परिवहन",
    cat_solid_waste: "कचरा प्रबंधन",
    cat_other: "अन्य समस्याएं",

    // Status
    statusTitle: "अवसंरचना शिकायत स्थिति जांचें",
    statusSubtitle: "जेमिनी एआई विश्लेषण से लेकर मोहल्ला क्लस्टरिंग और बजट आवंटन तक स्थिति देखें।",
    searchPlaceholder: "20-अंकों का ट्रैकिंग आईडी दर्ज करें",
    trackStatusSearchBtn: "स्थिति जांचें →",
    status_received: "प्राप्त हुआ",
    status_verified: "सत्यापित",
    status_funded: "स्वीकृत एवं वित्तपोषित",
    status_queued: "प्रतीक्षारत (कतार में)",
    badgeFunded: "✓ कार्य स्वीकृत एवं वित्तपोषित",
    badgeQueued: "⏳ बजट हेतु कतार में",
    badgeReceived: "📩 शिकायत दर्ज",
    step1Title: "1. शिकायत सार्वजनिक बहीखाते में दर्ज",
    step1Desc: "सार्वजनिक लेजर में सफलतापूर्वक दर्ज किया गया।",
    step2Title: "2. जेमिनी एआई वेक्टर एवं फोटो सत्यापन",
    step2Desc: "जेमिनी एम्बेडिंग 001 के साथ शिकायत का विश्लेषण किया गया।",
    step3Title: "3. मोहल्ला हॉटस्पॉट क्लस्टरिंग",
    step3Desc: "2 किमी के दायरे में अन्य नागरिकों की शिकायतों के साथ सत्यापित।",
    step4Title: "4. नगरपालिका बजट आवंटन",
    step4Funded: "✓ उच्च प्राथमिकता के आधार पर नगरपालिका बजट स्वीकृत! नागरिक कार्य स्वीकृत हो गया है।",
    step4Queued: "⏳ हॉटस्पॉट सत्यापित है। अगले बजट आवंटन दौर के लिए प्रतीक्षारत है।",

    // Planner
    plannerTitle: "प्राथमिकता रैंकिंग एवं बजट आवंटन",
    plannerSubtitle: "एल्गोरिदम आधारित आवंटन: समस्या भार × जन समर्थन × समय।",
    noiseReductionTitle: "एआई मांग एकत्रीकरण एवं गुणवत्ता सुधार",
    noiseReductionSub: "जेमिनी वेक्टर ने बिखरी हुई शिकायतों को सत्यापित मोहल्ला हॉटस्पॉट में बदल दिया।",
    rawReportsLabel: "प्राथमिक नागरिक शिकायतें",
    verifiedHotspotsLabel: "सत्यापित हॉटस्पॉट",
    noiseFilteredLabel: "शोर निस्पंदन",
    noiseEliminated: "अनावश्यक दोहराव समाप्त",
    budgetSliderTitle: "नगरपालिका बजट आवंटन स्लाइडर",
    budgetSliderSub: "बजट सीमा बदलने के लिए स्लाइडर चलाएं। देखें कौन से कार्य वित्तपोषित होते हैं।",
    commitBudgetBtn: "निर्णय को लेजर में दर्ज करें →",
    fundedHotspotsStat: "स्वीकृत हॉटस्पॉट",
    queuedHotspotsStat: "प्रतीक्षारत हॉटस्पॉट",
    totalHotspotsStat: "कुल हॉटस्पॉट",
    budgetUtilizationStat: "बजट उपयोग",
  },
};

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("en");

  useEffect(() => {
    const saved = localStorage.getItem("vajra_lang");
    if (saved && (saved === "en" || saved === "te" || saved === "hi")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("vajra_lang", lang);
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
