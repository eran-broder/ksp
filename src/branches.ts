/** A KSP physical store branch. */
export interface Branch {
  readonly key: string;
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly region: Region;
}

export type Region = "eilat" | "south" | "center" | "tel-aviv" | "sharon" | "haifa" | "north" | "jerusalem";

export type BranchKey = keyof typeof branchData;

const branchData = {
  // ── Eilat ──
  eilat2:          { id: "51", name: "אילת הטיילת",               city: "אילת",       region: "eilat" },
  eilatLaguna:     { id: "63", name: "אילת לגונה",                city: "אילת",       region: "eilat" },
  eilatQueen:      { id: "97", name: "אילת מלכת שבא",             city: "אילת",       region: "eilat" },
  eilatMerkaz:     { id: "78", name: "אילת מרכז התיירות",          city: "אילת",       region: "eilat" },
  eilatNorth:      { id: "87", name: "אילת צפון",                 city: "אילת",       region: "eilat" },
  eilat:           { id: "17", name: "אילת תרשיש",               city: "אילת",       region: "eilat" },
  // ── South ──
  AshdodCity:      { id: "69", name: "אשדוד מרכז",               city: "אשדוד",      region: "south" },
  ashdod1:         { id: "19", name: "אשדוד עד הלום",             city: "אשדוד",      region: "south" },
  ashkelon:        { id: "20", name: "אשקלון",                   city: "אשקלון",     region: "south" },
  AshkelonBarnea:  { id: "94", name: "אשקלון ברנע",              city: "אשקלון",     region: "south" },
  beershevaGrand:  { id: "98", name: "באר שבע גרנד",             city: "באר שבע",    region: "south" },
  beershevaEast:   { id: "64", name: "באר שבע מזרח",              city: "באר שבע",    region: "south" },
  beersheva:       { id: "21", name: "באר שבע רמות",              city: "באר שבע",    region: "south" },
  Netivot:         { id: "76", name: "נתיבות",                   city: "נתיבות",     region: "south" },
  KiryatGat:       { id: "80", name: "קרית גת",                  city: "קרית גת",    region: "south" },
  // ── Center ──
  kspbilu:         { id: "40", name: "בילו ק.עקרון",             city: "קרית עקרון",  region: "center" },
  beitshemesh:     { id: "52", name: "בית שמש",                  city: "בית שמש",    region: "center" },
  BneiBrak:        { id: "83", name: "בני ברק",                  city: "בני ברק",    region: "center" },
  BatYam:          { id: "86", name: "בת ים",                    city: "בת ים",      region: "center" },
  HolonMizrach:    { id: "88", name: "חולון מזרח",               city: "חולון",      region: "center" },
  holon:           { id: "23", name: "חולון קוגל",               city: "חולון",      region: "center" },
  yavne:           { id: "75", name: "יבנה",                     city: "יבנה",       region: "center" },
  Modiin:          { id: "71", name: "מודיעין",                  city: "מודיעין",    region: "center" },
  NessZiona:       { id: "84", name: "נס ציונה",                 city: "נס ציונה",   region: "center" },
  PetahTikva:      { id: "61", name: "פתח תקווה ד.רבין",          city: "פתח תקווה",  region: "center" },
  ksppetahtikva:   { id: "35", name: "פתח תקווה סגולה",           city: "פתח תקווה",  region: "center" },
  kiryatono:       { id: "37", name: "קרית אונו",                city: "קרית אונו",  region: "center" },
  RoshHaayin:      { id: "82", name: "ראש העין",                 city: "ראש העין",   region: "center" },
  RishonCenter:    { id: "66", name: "ראשון לציון מרכז",           city: "ראשון לציון", region: "center" },
  ksprishonlezion: { id: "43", name: "ראשון לציון משה לוי",        city: "ראשון לציון", region: "center" },
  Rothschild:      { id: "92", name: "ראשון לציון רוטשילד",        city: "ראשון לציון", region: "center" },
  rehovot:         { id: "65", name: "רחובות",                   city: "רחובות",     region: "center" },
  Ramle:           { id: "74", name: "רמלה",                     city: "רמלה",       region: "center" },
  kspramatgan:     { id: "45", name: "רמת גן",                   city: "רמת גן",    region: "center" },
  // ── Tel Aviv ──
  ramataviv:       { id: "39", name: "תל אביב - טאגור רמת אביב",  city: "תל אביב",   region: "tel-aviv" },
  CityGarden:      { id: "99", name: "תל אביב גן העיר",           city: "תל אביב",   region: "tel-aviv" },
  dizingof:        { id: "47", name: "תל אביב דיזינגוף",          city: "תל אביב",   region: "tel-aviv" },
  hashmonaim:      { id: "56", name: "תל אביב החשמונאים",         city: "תל אביב",   region: "tel-aviv" },
  ksptelaviv:      { id: "46", name: "תל אביב המסגר",             city: "תל אביב",   region: "tel-aviv" },
  Carlebach:       { id: "93", name: "תל אביב צקלג (אזור קרליבך)", city: "תל אביב",   region: "tel-aviv" },
  ramatahyal:      { id: "59", name: "תל אביב רמת החייל",          city: "תל אביב",   region: "tel-aviv" },
  TelBaruch:       { id: "81", name: "תל אביב תל ברוך (מרכז מיקדו)", city: "תל אביב", region: "tel-aviv" },
  // ── Sharon ──
  HodHasharon:     { id: "85", name: "הוד השרון",                city: "הוד השרון",   region: "sharon" },
  HerzliyaCenter:  { id: "73", name: "הרצליה מרכז",              city: "הרצליה",     region: "sharon" },
  herzliya:        { id: "58", name: "הרצליה פיתוח",             city: "הרצליה",     region: "sharon" },
  ksphadera:       { id: "22", name: "חדרה",                     city: "חדרה",       region: "sharon" },
  HaderaMizrach:   { id: "95", name: "חדרה מזרח - מתחם מיקס",     city: "חדרה",       region: "sharon" },
  KfarSabaGreen:   { id: "72", name: "כפר סבא הירוקה",           city: "כפר סבא",    region: "sharon" },
  kfarsaba:        { id: "29", name: "כפר סבא התעש",             city: "כפר סבא",    region: "sharon" },
  kspnatania:      { id: "33", name: 'נתניה אזה"ת פולג',         city: "נתניה",      region: "sharon" },
  NetanyaCenter:   { id: "79", name: "נתניה קניון השרון",         city: "נתניה",      region: "sharon" },
  NetKirSharon:    { id: "67", name: "נתניה שכונת קריית שרון",     city: "נתניה",      region: "sharon" },
  PardesHanna:     { id: "89", name: "פרדס חנה",                 city: "פרדס חנה",   region: "sharon" },
  ramathasharon:   { id: "42", name: "רמת השרון",                city: "רמת השרון",  region: "sharon" },
  KSPGahash:       { id: "44", name: "רעננה",                    city: "רעננה",      region: "sharon" },
  // ── Haifa ──
  kspbiyalik:      { id: "70", name: "חוצות המפרץ",              city: "קרית ביאליק", region: "haifa" },
  matam:           { id: "55", name: 'חיפה מת"מ',                city: "חיפה",       region: "haifa" },
  StellaMaris:     { id: "62", name: "חיפה סטלה מאריס",           city: "חיפה",       region: "haifa" },
  KSP03:           { id: "24", name: "חיפה רוממה",               city: "חיפה",       region: "haifa" },
  nesher:          { id: "31", name: "נשר (צק פוסט)",             city: "נשר",        region: "haifa" },
  keryon:          { id: "60", name: "קריון ק.ביאליק",            city: "קרית ביאליק", region: "haifa" },
  ShaarHazafon:    { id: "96", name: "קרית אתא - שער הצפון",      city: "קרית אתא",   region: "haifa" },
  khaim:           { id: "38", name: "קרית חיים",                city: "קרית חיים",  region: "haifa" },
  // ── North ──
  tverya:          { id: "25", name: "טבריה",                    city: "טבריה",      region: "north" },
  karmiel:         { id: "41", name: "כרמיאל",                   city: "כרמיאל",     region: "north" },
  kspnaharia:      { id: "30", name: "נהריה קניון הצפון",         city: "נהריה",      region: "north" },
  kspnazarta:      { id: "32", name: "נוף הגליל (נצרת עילית)",    city: "נוף הגליל",  region: "north" },
  afula:           { id: "34", name: "עפולה",                    city: "עפולה",      region: "north" },
  // ── Jerusalem ──
  kspjerusalems:   { id: "27", name: "ירושלים הר חוצבים",         city: "ירושלים",    region: "jerusalem" },
  jeruscenter:     { id: "57", name: "ירושלים קינג ג'ורג'",       city: "ירושלים",    region: "jerusalem" },
  talpiot:         { id: "68", name: "ירושלים תלפיות",            city: "ירושלים",    region: "jerusalem" },
  Mevaseret:       { id: "91", name: "מבשרת",                    city: "מבשרת ציון", region: "jerusalem" },
} as const satisfies Record<string, Omit<Branch, "key">>;

/** All KSP branches as an array. */
export const branches: readonly Branch[] = Object.entries(branchData).map(
  ([key, data]) => ({ key, ...data })
);

/** All KSP branches keyed by their API key. */
export const branchesByKey: Record<BranchKey, Branch> = Object.fromEntries(
  branches.map((b) => [b.key, b])
) as Record<BranchKey, Branch>;

/** Get branches filtered by region. */
export const branchesByRegion = (region: Region): Branch[] =>
  branches.filter((b) => b.region === region);

/** Get branches filtered by city name. */
export const branchesByCity = (city: string): Branch[] =>
  branches.filter((b) => b.city === city);

/** All region values. */
export const regions: readonly Region[] = ["eilat", "south", "center", "tel-aviv", "sharon", "haifa", "north", "jerusalem"];
