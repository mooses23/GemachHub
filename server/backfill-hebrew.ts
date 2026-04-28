import { db } from "./db";
import { regions, cityCategories, locations } from "../shared/schema.js";
import { eq, sql } from "drizzle-orm";

const FORCE = process.argv.includes("--force");

const REGION_HE: Record<string, string> = {
  "united-states": "ארצות הברית",
  "canada": "קנדה",
  "united-kingdom": "בריטניה",
  "europe": "אירופה",
  "australia": "אוסטרליה",
  "israel": "ישראל",
};

const CITY_HE: Record<string, string> = {
  "los-angeles": "לוס אנג'לס",
  "brooklyn": "ברוקלין",
  "monsey": "מונסי",
  "new-square": "ניו סקוור",
  "queens": "קווינס",
  "five-towns-far-rockaway": "חמש העיירות / פאר רוקאוויי",
  "staten-island": "סטטן איילנד",
  "west-hempstead": "ווסט המפסטד",
  "highland-park-edison": "היילנד פארק / אדיסון",
  "jackson": "ג'קסון",
  "lakewood": "לייקווד",
  "passaic": "פסאיק",
  "toms-river": "טומס ריבר",
  "teaneck": "טינק",
  "miami": "מיאמי",
  "chicago": "שיקגו",
  "baltimore": "בולטימור",
  "detroit": "דטרויט",
  "cleveland": "קליבלנד",
  "philadelphia": "פילדלפיה",
  "toronto": "טורונטו",
  "montreal": "מונטריאול",
  "london": "לונדון",
  "manchester": "מנצ'סטר",
  "antwerp": "אנטוורפן",
  "paris": "פריז",
  "amsterdam": "אמסטרדם",
  "melbourne": "מלבורן",
  "sydney": "סידני",
  "jerusalem": "ירושלים",
  "bnei-brak": "בני ברק",
  "beit-shemesh": "בית שמש",
  "modiin-illit": "מודיעין עילית",
  "beitar-illit": "ביתר עילית",
  "lod": "לוד",
  "afula": "עפולה",
  "elad": "אלעד",
  "givat-zeev": "גבעת זאב",
  "haifa": "חיפה",
  "kiryat-tivon": "קריית טבעון",
  "kochav-hashachar": "כוכב השחר",
  "maaleh-adumim": "מעלה אדומים",
  "neriya": "נריה",
  "telzstone-kiryat-yearim": "טלזסטון / קריית יערים",
  "rechovot": "רחובות",
  "ashdod": "אשדוד",
  "bnei-reem": "בני ראם",
  "kfar-chabad": "כפר חב\"ד",
  "tel-aviv": "תל אביב",
  "petach-tikvah": "פתח תקווה",
  "moshav-yesodot": "מושב יסודות",
  "shomron": "שומרון",
};

const CITY_NAME_TO_HE: Record<string, string> = {
  "Los Angeles": "לוס אנג'לס",
  "Miami Beach": "מיאמי ביץ'",
  "Miami": "מיאמי",
  "Chicago": "שיקגו",
  "Baltimore": "בולטימור",
  "Detroit": "דטרויט",
  "University Heights": "יוניברסיטי הייטס",
  "Philadelphia": "פילדלפיה",
  "Bala Cynwyd Philadelphia": "בלא קינווד פילדלפיה",
  "Brooklyn": "ברוקלין",
  "Monsey": "מונסי",
  "New Square": "ניו סקוור",
  "Queens": "קווינס",
  "Five Towns & Far Rockaway": "חמש העיירות ופאר רוקאוויי",
  "Five Towns": "חמש העיירות",
  "Staten Island": "סטטן איילנד",
  "West Hempstead": "ווסט המפסטד",
  "Highland Park / Edison": "היילנד פארק / אדיסון",
  "Jackson": "ג'קסון",
  "Lakewood": "לייקווד",
  "Passaic": "פסאיק",
  "Toms River": "טומס ריבר",
  "Jerusalem": "ירושלים",
  "Lod": "לוד",
  "Afula": "עפולה",
  "Beitar Illit": "ביתר עילית",
  "Beit Shemesh": "בית שמש",
  "Bnei Brak": "בני ברק",
  "Bnei Re'em": "בני ראם",
  "Elad": "אלעד",
  "Givat Zeev": "גבעת זאב",
  "Haifa": "חיפה",
  "Kiryat Tivon": "קריית טבעון",
  "Kochav HaShachar": "כוכב השחר",
  "Maaleh Adumim": "מעלה אדומים",
  "Modiin Illit": "מודיעין עילית",
  "Neriya": "נריה",
  "Telzstone/Kiryat Yearim": "טלזסטון / קריית יערים",
  "Rechovot": "רחובות",
  "Ashdod": "אשדוד",
  "Kfar Chabad": "כפר חב\"ד",
  "Tel Aviv": "תל אביב",
  "Moshav Yesodot": "מושב יסודות",
  "Petach Tikvah": "פתח תקווה",
  "Shomron": "שומרון",
  "Toronto": "טורונטו",
  "Montreal": "מונטריאול",
  "London": "לונדון",
  "Manchester": "מנצ'סטר",
  "Antwerp": "אנטוורפן",
  "Melbourne": "מלבורן",
  "Sydney": "סידני",
};

const NEIGHBORHOOD_HE: Record<string, string> = {
  // LA
  "Pico": "פיקו",
  "Pico Area": "אזור פיקו",
  "La Brea": "לה בראה",
  "La Brea Area": "אזור לה בראה",
  "Valley Village": "ואלי וילג'",
  // Baltimore
  "Shellydale Drive": "שלידייל דרייב",
  "Western Run Drive": "ווסטרן ראן דרייב",
  // Philly
  "Bala Cynwyd": "בלא קינווד",
  "Bala Cynwyd Area": "אזור בלא קינווד",
  // Brooklyn
  "Boro Park (12th Ave & 45th St)": "בורו פארק (שדרה 12 ורחוב 45)",
  "Boro Park (14th Ave & 40th St)": "בורו פארק (שדרה 14 ורחוב 40)",
  "Boro Park (16th Ave & 42nd St)": "בורו פארק (שדרה 16 ורחוב 42)",
  "Crown Heights": "קראון הייטס",
  "Flatbush (East 35th & Ave L)": "פלטבוש (מזרח 35 ושדרה L)",
  "Flatbush (East 9th & Ave M)": "פלטבוש (מזרח 9 ושדרה M)",
  "Flatbush (East 24th & Ave P)": "פלטבוש (מזרח 24 ושדרה P)",
  "Kensington (Avenue F)": "קנסינגטון (שדרה F)",
  "Kensington (East 8th & Ave C)": "קנסינגטון (מזרח 8 ושדרה C)",
  // Brooklyn address tokens
  "12th Ave & 45th Street": "שדרה 12 ורחוב 45",
  "14th Ave & 40th Street": "שדרה 14 ורחוב 40",
  "16th Ave & 42nd Street": "שדרה 16 ורחוב 42",
  "East 35th & Avenue L": "מזרח 35 ושדרה L",
  "East 9th & Avenue M": "מזרח 9 ושדרה M",
  "East 24th & Avenue P": "מזרח 24 ושדרה P",
  "Avenue F": "שדרה F",
  "Kensington": "קנסינגטון",
  "East 8th & Avenue C": "מזרח 8 ושדרה C",
  // Monsey
  "Airmont Regina Road": "איירמונט רחוב רג'ינה",
  "Airmont": "איירמונט",
  "Regina Road": "רחוב רג'ינה",
  "Butterfield Drive": "באטרפילד דרייב",
  "Haverstraw": "האברסטרו",
  "Homestead Lane": "הומסטד ליין",
  "Homestead Lane off Rt. 306": "הומסטד ליין ליד כביש 306",
  "Scotland Hill": "סקוטלנד היל",
  "Wesley Hills": "ווסלי הילס",
  // Queens
  "Kew Gardens": "קיו גרדנס",
  // Five Towns
  "Lawrence": "לורנס",
  "Cedarhurst": "סידרהרסט",
  "Cedarhurst (Second Location)": "סידרהרסט (סניף שני)",
  "North Woodmere": "צפון וודמיר",
  "Woodmere": "וודמיר",
  // Lakewood
  "Near Beis Feiga": "ליד בית פייגא",
  "East County Line": "איסט קאונטי ליין",
  "West County Line": "ווסט קאונטי ליין",
  "Pine Street": "פיין סטריט",
  "Prospect Area": "אזור פרוספקט",
  "Sunset & James": "סאנסט וג'יימס",
  "Vine Ave": "ויין אבניו",
  "Westgate": "ווסטגייט",
  // Passaic
  "Amsterdam Avenue": "שדרת אמסטרדם",
  "Boulevard": "שדרה",
  "Passaic Avenue": "שדרת פסאיק",
  // Jerusalem neighborhoods
  "Arzei HaBira": "ארזי הבירה",
  "Baka": "בקעה",
  "Bayit Vegan": "בית וגן",
  "Eli HaKohen": "עלי הכהן",
  "French Hill": "גבעה הצרפתית",
  "Ganei Geula": "גני גאולה",
  "Givat Mordechai": "גבעת מרדכי",
  "Givat Shaul (Pinchas Kehati)": "גבעת שאול (פנחס קהתי)",
  "Givat Shaul": "גבעת שאול",
  "Pinchas Kehati 1": "פנחס קהתי 1",
  "Har Nof": "הר נוף",
  "Katamon": "קטמון",
  "Maalot Dafna": "מעלות דפנה",
  "Mem Gimmel": "מם גימ\"ל",
  "Neve Yaakov": "נווה יעקב",
  "Pisgat Zeev (Neve HaPisga)": "פסגת זאב (נווה הפסגה)",
  "Pisgat Zeev": "פסגת זאב",
  "Neve HaPisga": "נווה הפסגה",
  "Ramat Eshkol": "רמת אשכול",
  "Ramat Eshkol (Second Location)": "רמת אשכול (סניף שני)",
  "Ramat Shlomo (Rafael Baruch Toledano)": "רמת שלמה (רפאל ברוך טולדנו)",
  "Ramat Shlomo (Chazon Ish)": "רמת שלמה (חזון איש)",
  "Ramat Shlomo": "רמת שלמה",
  "15 Rafael Baruch Toledano": "רפאל ברוך טולדנו 15",
  "Chazon Ish 1/1": "חזון איש 1/1",
  "Ramot": "רמות",
  "Ramot Daled (Rechov Valenstein)": "רמות ד' (רחוב ולנשטיין)",
  "Rechov Valenstein": "רחוב ולנשטיין",
  "Ramot Daled": "רמות ד'",
  "Rechavia-Nachlaot (Mordechai Narkis)": "רחביה-נחלאות (מרדכי נרקיס)",
  "Rechavia-Nachlaot": "רחביה-נחלאות",
  "Rechov Mordechai Narkis": "רחוב מרדכי נרקיס",
  "Romema": "רוממה",
  "Rova Hayehudi": "רובע היהודי",
  "Sanhedria Murchevet": "סנהדריה המורחבת",
  "Sanz/Belz": "צאנז/בעלז",
  "Sarei Yisroel": "שרי ישראל",
  "Kiryat HaYovel": "קריית היובל",
  // Lod
  "Ganei Ayalon (Achisomoch)": "גני אילון (אחיסומך)",
  "Ganei Ayalon - Achisomoch": "גני אילון - אחיסומך",
  "Shechunat Chabad": "שכונת חב\"ד",
  // Beit Shemesh
  "Ramat Beit Shemesh": "רמת בית שמש",
  "Ramat Beit Shemesh Aleph": "רמת בית שמש א'",
  // Bnei Brak
  "Shechunat Or HaChaim": "שכונת אור החיים",
  "Shichun Hey": "שיכון ה'",
  "Zichron Meir": "זכרון מאיר",
  "Rechov Sokolov": "רחוב סוקולוב",
  "Rechov HaBanim": "רחוב הבנים",
  "Pardes Katz": "פרדס כץ",
  "Rechov Amram Gaon 7 (Shikun Vav)": "רחוב עמרם גאון 7 (שיכון ו')",
  "Rechov Amram Gaon 7": "רחוב עמרם גאון 7",
  "Rechov Menachem 6": "רחוב מנחם 6",
  "Ramat Elchanan": "רמת אלחנן",
  // Givat Zeev
  "33 Ha'yalot": "החיילות 33",
  "59 Ha'yalot": "החיילות 59",
  // Haifa
  "Shechunat Hadar": "שכונת הדר",
  // Modiin Illit
  "Netivot Hamishpat": "נתיבות המשפט",
  "Brachfeld": "ברכפלד",
  "Gan HaDasim": "גן ההדסים",
  // Telzstone
  "Ma'alot Kedushei Telz": "מעלות קדושי טלז",
  "Ma'alot Kedushei Telz 7/1": "מעלות קדושי טלז 7/1",
  "HaRif 16": "הריף 16",
  // Ashdod
  "Rova Gimmel": "רובע ג'",
  // Tel Aviv area
  "Ramat Gan": "רמת גן",
  // Petach Tikvah
  "Kfar Ganim Gimmel": "כפר גנים ג'",
  // Shomron
  "Revava": "רבבה",
  // Toronto
  "Bathurst & Lawrence": "באת'רסט ולורנס",
  "Forest Hill": "פורסט היל",
  "York Mills": "יורק מילס",
  // Montreal
  "Cote St-Luc": "קוט סן-לוק",
  "Hampstead": "האמפסטד",
  // London
  "Golders Green": "גולדרס גרין",
  "Hendon": "הנדון",
  "Stamford Hill": "סטמפורד היל",
  // Manchester
  "Prestwich": "פרסטוויץ'",
  "Whitefield": "ווייטפילד",
  // Antwerp
  "Borgerhout": "בורגרהאוט",
  "Berchem": "ברכם",
  // Melbourne / Sydney
  "Caulfield": "קולפילד",
  "St Kilda": "סנט קילדה",
  "Bondi": "בונדיי",
};

const STATE_COUNTRY_HE: Record<string, string> = {
  "CA": "קליפורניה",
  "NY": "ניו יורק",
  "NJ": "ניו ג'רזי",
  "FL": "פלורידה",
  "IL": "אילינוי",
  "MD": "מרילנד",
  "MI": "מישיגן",
  "OH": "אוהיו",
  "PA": "פנסילבניה",
  "ON": "אונטריו",
  "QC": "קוויבק",
  "UK": "בריטניה",
  "VIC": "ויקטוריה",
  "NSW": "ניו סאות' ויילס",
  "Israel": "ישראל",
  "Belgium": "בלגיה",
};

const misses: string[] = [];

function translateToken(token: string, context: string): string {
  const trimmed = token.trim();
  if (NEIGHBORHOOD_HE[trimmed]) return NEIGHBORHOOD_HE[trimmed];
  if (CITY_NAME_TO_HE[trimmed]) return CITY_NAME_TO_HE[trimmed];
  if (STATE_COUNTRY_HE[trimmed]) return STATE_COUNTRY_HE[trimmed];
  // Postal-like tokens, leave as-is
  if (/^[A-Z0-9 ]{4,}$/.test(trimmed)) return trimmed;
  misses.push(`[${context}] "${trimmed}"`);
  return trimmed;
}

function translateLocationName(name: string): string {
  // Pattern: "City - Suffix" or "City - Suffix (detail)"
  const dashIdx = name.indexOf(" - ");
  if (dashIdx === -1) {
    return CITY_NAME_TO_HE[name.trim()] ?? (misses.push(`[name] "${name}"`), name);
  }
  const cityPart = name.slice(0, dashIdx).trim();
  const suffix = name.slice(dashIdx + 3).trim();
  const cityHe = CITY_NAME_TO_HE[cityPart];
  if (!cityHe) misses.push(`[name city] "${cityPart}" in "${name}"`);
  const suffixHe = NEIGHBORHOOD_HE[suffix];
  if (!suffixHe) misses.push(`[name suffix] "${suffix}" in "${name}"`);
  return `${cityHe ?? cityPart} - ${suffixHe ?? suffix}`;
}

function translateAddress(addr: string): string {
  return addr
    .split(",")
    .map((t) => translateToken(t, `addr "${addr}"`))
    .join(", ");
}

async function main() {
  console.log(`Backfill starting (force=${FORCE})\n`);

  // Regions
  const allRegions = await db.select().from(regions);
  for (const r of allRegions) {
    if (!FORCE && r.nameHe && r.nameHe.trim()) continue;
    const he = REGION_HE[r.slug];
    if (!he) {
      misses.push(`[region] "${r.slug}"`);
      continue;
    }
    await db.update(regions).set({ nameHe: he }).where(eq(regions.id, r.id));
  }
  console.log(`Regions updated: ${allRegions.length}`);

  // Cities
  const allCities = await db.select().from(cityCategories);
  for (const c of allCities) {
    if (FORCE || !c.nameHe || !c.nameHe.trim()) {
      const he = CITY_HE[c.slug] ?? CITY_NAME_TO_HE[c.name];
      if (!he) {
        misses.push(`[city] slug=${c.slug} name="${c.name}"`);
      } else {
        await db.update(cityCategories).set({ nameHe: he }).where(eq(cityCategories.id, c.id));
      }
    }
  }
  console.log(`Cities updated: ${allCities.length}`);

  // Locations
  const allLocations = await db.select().from(locations);
  for (const loc of allLocations) {
    const updates: Record<string, string> = {};
    if (FORCE || !loc.nameHe || !loc.nameHe.trim()) {
      updates.nameHe = translateLocationName(loc.name);
    }
    if (FORCE || !loc.addressHe || !loc.addressHe.trim()) {
      updates.addressHe = translateAddress(loc.address);
    }
    if (FORCE || !loc.contactPersonHe || !loc.contactPersonHe.trim()) {
      updates.contactPersonHe =
        loc.contactPerson === "Location Coordinator" ? "רכז הסניף" : loc.contactPerson;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(locations).set(updates).where(eq(locations.id, loc.id));
    }
  }
  console.log(`Locations updated: ${allLocations.length}`);

  if (misses.length > 0) {
    console.log(`\n${misses.length} untranslated tokens (please curate manually):`);
    const unique = Array.from(new Set(misses));
    for (const m of unique) console.log(`  - ${m}`);
  } else {
    console.log("\nAll tokens translated.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
