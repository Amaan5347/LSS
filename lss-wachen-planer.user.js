// ==UserScript==
// @name         LSS Wachen-Planer
// @namespace    lss-planer
// @version      3.2.1
// @description  Wachen-Planung mit Erweiterungen-Tab (v3.2.1: Cache-Reset, Reload-Fix, ohne Namensschema)
// @author       Du
// @match        https://www.leitstellenspiel.de/*
// @match        https://polizei.leitstellenspiel.de/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
'use strict';

/* ══════════════════════════════════════════════════════════════════
   1. Konstanten
   ══════════════════════════════════════════════════════════════════ */

const VERSION = '3.2.1';

const GEBAEUDE_NAMEN = {
  0:'Feuerwache', 1:'Feuerwehrschule', 2:'Rettungswache', 3:'Rettungsschule',
  4:'Krankenhaus', 5:'Rettungshubschrauber', 6:'Polizeiwache', 7:'Leitstelle',
  8:'Polizeischule', 9:'THW', 10:'THW-Bundesschule', 11:'Bereitschaftspolizei',
  12:'SEG', 13:'Polizeihubschrauber', 15:'Wasserrettung',
  17:'Polizei-Sondereinheiten', 18:'SEG Bergwacht', 20:'Bergrettungswache',
  21:'Rettungshundestaffel', 24:'Wasserrettung Seenot', 25:'Bergrettungswache',
  26:'Seenotrettungswache', 27:'Seenotrettungs-Hubschrauber',
  28:'Seenotrettungs-Hubschrauber', 29:'Autobahnpolizei'
};

const VN = {
  0:'LF 20', 1:'LF 10', 2:'DLK 23', 3:'ELW 1', 4:'RW', 5:'GW-A', 6:'LF 8/6',
  7:'LF 20/16', 8:'LF 10/6', 9:'LF 16-TS', 10:'GW-Öl', 11:'GW-L2-Wasser',
  12:'GW-Messtechnik', 13:'SW 1000', 14:'SW 2000', 15:'SW 2000-Tr', 16:'SW Kats',
  17:'TLF 2000', 18:'TLF 3000', 19:'TLF 8/8', 20:'TLF 8/18', 21:'TLF 16/24-Tr',
  22:'TLF 16/25', 23:'TLF 16/45', 24:'TLF 20/40', 25:'TLF 20/40-SL', 26:'TLF 16',
  27:'GW-Gefahrgut', 28:'RTW', 29:'NEF', 30:'HLF 20', 31:'RTH', 32:'FuStW',
  33:'GW-Höhenrettung', 34:'ELW 2', 35:'leBefKw', 36:'MTW', 37:'TSF-W',
  38:'KTW', 39:'GKW', 40:'MTW-TZ', 41:'MzGW (FGr N)', 42:'LKW K 9',
  43:'BRmG R', 44:'Anh DLE', 45:'MLW 5', 46:'WLF', 47:'AB-Rüst',
  48:'AB-Atemschutz', 49:'AB-Öl', 50:'GruKw', 51:'FüKW (Polizei)', 52:'GefKw',
  53:'Dekon-P', 54:'AB-Dekon-P', 55:'KdoW-LNA', 56:'KdoW-OrgL', 57:'FwK',
  58:'KTW Typ B', 59:'ELW 1 (SEG)', 60:'GW-San', 61:'Polizeihubschrauber',
  62:'AB-Schlauch', 63:'GW-Taucher', 64:'GW-Wasserrettung',
  65:'LKW 7 Lkr 19 tm', 66:'Anh MzB', 67:'Anh SchlB', 68:'Anh MzAB',
  69:'Tauchkraftwagen', 70:'MZB', 71:'AB-MZB', 72:'WaWe 10', 73:'GRTW',
  74:'NAW', 75:'FLF', 76:'Rettungstreppe', 77:'AB-Gefahrgut',
  78:'AB-Einsatzleitung', 79:'SEK - ZF', 80:'SEK - MTF', 81:'MEK - ZF',
  82:'MEK - MTF', 83:'GW-Werkfeuerwehr', 84:'ULF mit Löscharm', 85:'TM 50',
  86:'Turbolöscher', 87:'TLF 4000', 88:'KLF', 89:'MLF', 90:'HLF 10',
  91:'Rettungshundefahrzeug', 92:'Anh Hund', 93:'MTW-O', 94:'DHuFüKW',
  95:'Polizeimotorrad', 96:'Außenlastbehälter', 97:'ITW',
  98:'Zivilstreifenwagen', 100:'MLW 4', 101:'Anh SwPu', 102:'Anh 7',
  103:'FuStW (DGL)', 104:'GW-L1', 105:'GW-L2', 106:'MTF-L', 107:'LF-L',
  108:'AB-L', 109:'MzGW SB', 110:'NEA50', 111:'NEA50', 112:'NEA200',
  113:'NEA200', 114:'GW-Lüfter', 115:'Anh Lüfter', 116:'AB-Lüfter',
  117:'AB-Tank', 118:'Kleintankwagen', 119:'AB-Lösch', 120:'Tankwagen',
  121:'GTLF', 122:'LKW 7 Lbw (FGr E)', 123:'LKW 7 Lbw (FGr WP)', 124:'MTW-OV',
  125:'MTW-Tr UL', 126:'MTF Drohne', 127:'GW UAS', 128:'ELW Drohne',
  129:'ELW2 Drohne', 130:'GW-Bt', 131:'Bt-Kombi', 132:'FKH', 133:'Bt LKW',
  134:'Pferdetransporter kl.', 135:'Pferdetransporter gr.',
  136:'Anh Pferdetransport', 137:'Zugfzg Pferdetransport',
  138:'GW-Verpflegung', 139:'GW-Küche', 140:'MTW-Verpflegung', 141:'FKH',
  142:'AB-Küche', 143:'Anh Schlauch', 144:'FüKW (THW)', 145:'FüKomKW',
  146:'Anh FüLa', 147:'FmKW', 148:'MTW-FGr K', 149:'GW-Bergrettung (NEF)',
  150:'GW-Bergrettung', 151:'ELW Bergrettung', 152:'ATV',
  153:'Hundestaffel Bergrettung', 154:'Schneefahrzeug',
  155:'Anh Höhenrettung Bergr.', 156:'PolHubschrauber m. Winde',
  157:'RTH Winde', 158:'GW-Höhenrettung Bergr.', 159:'Seenotrettungskreuzer',
  160:'Seenotrettungsboot', 161:'Hubschrauber Seenotrettung', 162:'RW-Schiene',
  163:'HLF Schiene', 164:'AB-Schiene', 165:'LauKw', 166:'PTLF 4000', 167:'SLF',
  168:'Anh Sonderlöschmittel', 169:'AB-Sonderlöschmittel',
  170:'AB-Wasser/Schaum', 171:'GW TeSi', 172:'LKW Technik Notstrom',
  173:'MTW TeSi', 174:'Anh TeSi', 175:'NEA50', 176:'LKW 7 Lbw (FGr Log-V)',
  177:'MTW-FGr Log-V', 178:'Anh 12 Lbw Log-V', 179:'AB-NEA50',
  180:'AB-NEA200', 181:'MzGW (FGr BrB)', 182:'Mobilkran',
  183:'Anh Plattform BrB', 184:'FuStW (AP)', 185:'GW-Tierrettung',
  186:'Anh Tierrettung', 187:'TLF 3000 W', 188:'TLF 5000 W',
  189:'GTLF 10000 W', 190:'GW-Waldbrand', 191:'Anh Waldbrand', 192:'AB-Waldbrand'
};

const KURSE = {
  highway_police: "Autobahnpolizei", railway_fire: "Bahnrettung",
  coastal_rescue: "Seenotretter",
  coastal_helicopter: "Hubschrauberpilot (Seenotrettung)",
  coastal_helicopter_lift: "Windenoperator",
  emergency_paramedic_water_rescue: "Wasserrettungsausbildung für Notfallsanitäter",
  care_service: "Betreuungsdienst", police_firefighting: "Brandbekämpfung",
  dekon_p: "Dekon-P Lehrgang", police_service_group_leader: "Dienstgruppenleitung",
  fire_drone: "Drohnen-Schulung", seg_drone: "Drohnenoperator",
  mountain_command: "Einsatzleiter Bergrettung", elw2: "ELW 2 Lehrgang",
  thw_bridge_construction: "Fachgruppe Brückenbau",
  thw_energy_supply: "Fachgruppe Elektroversorgung",
  thw_rescue_dogs: "Fachgruppe Rettungshundeführer",
  thw_raumen: "Fachgruppe Räumen",
  heavy_rescue: "Fachgruppe Schwere Bergung",
  water_damage_pump: "Fachgruppe Wasserschaden/Pumpen",
  thw_command: "Fachzug Führung und Kommunikation",
  fire_care_service: "Feuerwehr-Verpflegungseinheit",
  fwk: "Feuerwehrkran Lehrgang",
  arff: "Flugfeldlöschfahrzeug-Ausbildung",
  gw_gefahrgut: "GW-Gefahrgut Lehrgang",
  gw_messtechnik: "GW-Messtechnik Lehrgang",
  gw_taucher: "GW-Taucher Lehrgang",
  gw_wasserrettung: "GW-Wasserrettung Lehrgang",
  k9: "Hundeführer (Schutzhund)",
  police_fukw: "Hundertschaftsführer (FüKW)",
  mountain_height_rescue: "Höhenretter",
  gw_hoehenrettung: "Höhenrettung Lehrgang",
  intensive_care: "Intensivpflege",
  thw_bridge_construction_crane: "Kranführer",
  criminal_investigation: "Kriminalpolizei",
  police_speaker_operator: "Lautsprecheroperator",
  lna: "LNA-Ausbildung", thw_care_service: "Logistik-Verpflegung",
  police_mek: "MEK", police_motorcycle: "Motorradstaffel",
  energy_supply: "NEA200 Fortbildung",
  notarzt: "Notarzt-Ausbildung", orgl: "OrgL-Ausbildung",
  polizeihubschrauber: "Polizeihubschrauber",
  police_horse: "Reiterstaffel", seg_rescue_dogs: "Rettungshundeführer",
  rettungstreppe: "Rettungstreppen-Ausbildung",
  seg_elw: "SEG - Einsatzleitung", seg_gw_san: "SEG - GW-San",
  police_sek: "SEK", disaster_response_technology: "Technik und Sicherheit",
  thw_drone: "Trupp Unbemannte Luftfahrtsysteme",
  care_service_equipment: "Verpflegungshelfer",
  police_wasserwerfer: "Wasserwerfer",
  wechsellader: "Wechsellader Lehrgang",
  werkfeuerwehr: "Werkfeuerwehr-Ausbildung",
  wildfire: "Wald- und Vegetationsbrandbekämpfung",
  police_helicopter_lift: "Windenoperator",
  rescue_helicopter_lift: "Windenoperator",
  police_einsatzleiter: "Zugführer (leBefKw)", thw_zugtrupp: "Zugtrupp"
};
const kursName = key => KURSE[key] || key;

const PB_KURSE = {
  12: [['gw_messtechnik','alle']], 27: [['gw_gefahrgut','alle']],
  29: [['notarzt','alle']], 33: [['gw_hoehenrettung','alle']],
  34: [['elw2','alle']], 35: [['police_einsatzleiter','alle']],
  40: [['thw_zugtrupp','alle']], 42: [['thw_raumen','alle']],
  45: [['thw_raumen','alle']], 46: [['wechsellader','alle']],
  51: [['police_fukw','alle']], 53: [['dekon_p','min',1]],
  54: [['dekon_p','alle']], 55: [['lna','alle']], 56: [['orgl','alle']],
  57: [['fwk','alle']], 59: [['seg_elw','alle']], 60: [['seg_gw_san','alle']],
  61: [['polizeihubschrauber','alle']], 63: [['gw_taucher','alle']],
  64: [['gw_wasserrettung','alle']], 66: [['gw_wasserrettung','alle']],
  67: [['gw_wasserrettung','alle']], 68: [['gw_wasserrettung','alle']],
  69: [['gw_taucher','alle']], 70: [['gw_wasserrettung','alle']],
  71: [['gw_wasserrettung','alle']], 72: [['police_wasserwerfer','alle']],
  73: [['notarzt','min',1]], 74: [['notarzt','min',1]],
  75: [['arff','alle']], 76: [['rettungstreppe','alle']],
  77: [['gw_gefahrgut','alle']], 78: [['elw2','alle']],
  79: [['police_sek','alle']], 80: [['police_sek','alle']],
  81: [['police_mek','alle']], 82: [['police_mek','alle']],
  83: [['werkfeuerwehr','alle']], 84: [['werkfeuerwehr','alle']],
  85: [['werkfeuerwehr','alle']], 86: [['werkfeuerwehr','alle']],
  91: [['seg_rescue_dogs','alle']], 92: [['thw_rescue_dogs','alle']],
  94: [['k9','alle']], 95: [['police_motorcycle','alle']],
  96: [['police_firefighting','alle']],
  97: [['intensive_care','min',2],['notarzt','min',1]],
  98: [['criminal_investigation','alle']],
  100: [['water_damage_pump','alle']],
  101: [['water_damage_pump','min',1]],
  102: [['water_damage_pump','min',1]],
  103: [['police_service_group_leader','min',1]],
  109: [['heavy_rescue','alle']],
  112: [['thw_energy_supply','min',1]],
  113: [['energy_supply','min',1]],
  125: [['thw_drone','alle']], 126: [['fire_drone','min',4]],
  127: [['seg_drone','alle']], 128: [['fire_drone','alle']],
  129: [['fire_drone','alle'],['elw2','alle']],
  130: [['care_service','min',1],['care_service_equipment','min',2]],
  131: [['care_service','alle']],
  133: [['care_service','min',1],['care_service_equipment','min',2]],
  134: [['police_horse','min',2]], 135: [['police_horse','min',2]],
  136: [['police_horse','min',2]],
  138: [['fire_care_service','min',1],['care_service_equipment','min',2]],
  139: [['fire_care_service','min',1],['care_service_equipment','min',2]],
  140: [['fire_care_service','alle']],
  144: [['thw_command','alle']], 145: [['thw_command','alle']],
  147: [['thw_command','alle']], 148: [['thw_command','alle']],
  149: [['notarzt','min',1]], 151: [['mountain_command','alle']],
  153: [['seg_rescue_dogs','alle']],
  155: [['mountain_height_rescue','min',4]],
  156: [['polizeihubschrauber','min',1],['police_helicopter_lift','min',1]],
  157: [['rescue_helicopter_lift','min',1],['notarzt','min',1]],
  158: [['mountain_height_rescue','alle']],
  159: [['coastal_rescue','alle']],
  161: [['coastal_helicopter','min',1],['coastal_helicopter_lift','min',1],['emergency_paramedic_water_rescue','min',1]],
  162: [['railway_fire','alle']], 163: [['railway_fire','alle']],
  165: [['police_speaker_operator','alle']],
  171: [['disaster_response_technology','alle']],
  172: [['disaster_response_technology','min',1]],
  173: [['disaster_response_technology','min',1]],
  174: [['disaster_response_technology','min',2]],
  175: [['disaster_response_technology','min',2]],
  176: [['thw_care_service','min',1],['care_service_equipment','min',2]],
  177: [['thw_care_service','alle']],
  181: [['thw_bridge_construction','alle']],
  182: [['thw_bridge_construction_crane','alle']],
  183: [['thw_bridge_construction','min',6]],
  184: [['highway_police','alle']],
  187: [['wildfire','alle']], 188: [['wildfire','alle']],
  189: [['wildfire','alle']], 190: [['wildfire','alle']],
  191: [['wildfire','min',1]], 192: [['wildfire','alle']]
};
const kurseFuer = typId => PB_KURSE[Number(typId)] || [];
const brauchtKurs = typId => kurseFuer(typId).length > 0;

const MODELL_STANDARD = {
  '0': { vehicles: {2:1,5:1,10:1,11:1,12:1,27:1,30:1,33:1,34:1,46:1,48:1,49:1,53:1,57:1,77:1,108:1,111:1,114:1,115:1,116:1,129:1,138:1,139:1,141:1,142:1,143:1,163:1,164:1,167:1,185:1,186:1} },
  '2': { vehicles: {28:1,38:1,29:1,74:1,55:1,56:1} },
  '5': { vehicles: {31:1,157:1} },
  '6': { vehicles: {32:1,98:1,94:1,103:1,95:1,184:1} },
  '9': { vehicles: {39:1,41:1,110:1,40:1,124:1,93:1,92:1,45:1,42:1,43:1,44:1,65:1,66:1,67:1,68:1,69:1,100:1,123:1,101:1,102:1,109:1,122:1,112:1,125:1,144:1,145:1,146:1,147:1,148:1,176:1,177:1,178:1,181:1,182:1,183:1} },
  '11': { vehicles: {50:1,35:1,51:1,72:1,52:1,80:1,79:1,82:1,81:1,94:1,135:1,137:1,165:1} },
  '12': { vehicles: {59:1,60:1,28:1,58:1,64:1,63:1,70:1,91:1,127:1,133:1,132:1,130:1,131:1,171:1,173:1,174:1} },
  '13': { vehicles: {61:1,96:1} },
  '15': { vehicles: {64:1,63:1,70:1} },
  '17': { vehicles: {51:1,79:1,80:1,81:1,82:1,94:1} },
  '21': { vehicles: {91:1} },
  '25': { vehicles: {150:1,149:1,151:1,152:1,154:1,158:1,155:1,153:1} },
  '26': { vehicles: {159:1,160:1} },
  '28': { vehicles: {161:1} },
  '29': { vehicles: {184:1} }
};

const LAYOUTS = {
  0:  { basis: 'level+1', bonus: { 'Großwache':10, 'Abrollbehälter-Stellplatz':1, 'Anhänger-Stellplatz':1, 'Drohneneinheit':1, 'Verpflegungsdienst':2, 'Bahnrettung':1, 'Tierrettung':1, 'Netzersatzanlage 200':2, 'Wald- und Vegetationsbrandbekämpfung':4 } },
  2:  { basis: 'level+1', bonus: { 'Großwache':10 } },
  5:  { basis: 'level+1', bonus: {} },
  6:  { basis: 'level+1', bonus: { 'Großwache':10, 'Diensthundestaffel':1, 'Dienstgruppenleitung':1, 'Motorradstaffel':2, 'Autobahnpolizei':2, 'Großgewahrsam':1 } },
  9:  { basis: 'fix:1', bonus: {
        '1. Technischer Zug: Fachgruppe Notversorgung/Notinstandsetzung':2,
        '1. Technischer Zug: Zugtrupp':1,
        '2. Technischer Zug - Bergungsgruppe':1,
        '2. Technischer Zug: Fachgruppe Notversorgung/Notinstandsetzung':2,
        '2. Technischer Zug: Zugtrupp':1,
        'Fachgruppe Räumen':4, 'Fachgruppe Wassergefahren':5,
        'Fachgruppe Ortung':4, 'Fachgruppe Wasserschaden/Pumpen':4,
        'Fachgruppe Schwere Bergung':1, 'Fachgruppe Elektroversorgung':2,
        'Ortsverbands-Mannschaftstransportwagen':2,
        'Trupp Unbemannte Luftfahrtsysteme':1,
        'Fachzug Führung und Kommunikation':5,
        'Fachgruppe Logistik-Verpflegung':3, 'Fachgruppe Brückenbau':3
      } },
  11: { basis: 'fix:4', bonus: {
        '2. Zug der 1. Hundertschaft':4, '3. Zug der 1. Hundertschaft':5,
        'Sonderfahrzeug: Gefangenenkraftwagen':1, 'Technischer Zug: Wasserwerfer':4,
        'SEK: 1. Zug':5, 'SEK: 2. Zug':5, 'MEK: 1. Zug':5, 'MEK: 2. Zug':5,
        'Diensthundestaffel':3, 'Reiterstaffel':6,
        'Sonderfahrzeug: Lautsprecherkraftwagen':1
      } },
  12: { basis: 'fix:1', bonus: {
        'Führung':1, 'Sanitätsdienst':4, 'Wasserrettung':3,
        'Rettungshundestaffel':2, 'SEG Drohne':1,
        'Betreuungs- und Verpflegungsdienst':10, 'Technik und Sicherheit':6
      } },
  17: { basis: 'fix:0', bonus: { 'SEK: 1. Zug':5, 'SEK: 2. Zug':5, 'MEK: 1. Zug':5, 'MEK: 2. Zug':5, 'Diensthundestaffel':3 } },
  25: { basis: 'level+1', bonus: { 'Höhenrettung':2, 'Rettungshundestaffel':2 } },
  28: { basis: 'fix:1', bonus: {} }
};

function stufenKosten(vonStufe, zuStufe) {
  let summe = 0;
  for (let i = Math.max(1, vonStufe); i < zuStufe; i++) {
    if (i === 1) summe += 10000;
    else if (i === 2) summe += 50000;
    else summe += 100000;
  }
  return summe;
}

const vehName = id => VN[id] || `Typ ${id}`;
const btName  = t  => GEBAEUDE_NAMEN[t] || `Gebäudetyp ${t}`;
const NICHT_PLANEN = new Set([1, 3, 4, 7, 8, 10]);

const TYP_KONFIG = {
  0:  { farbe: '#e8a5a5', icon: '🚒', kurz: 'Feuerwehr' },
  2:  { farbe: '#f0c9a0', icon: '🚑', kurz: 'Rettung' },
  5:  { farbe: '#f5d9b3', icon: '🚁', kurz: 'RTH' },
  6:  { farbe: '#a5bde0', icon: '🚓', kurz: 'Polizei' },
  9:  { farbe: '#a5c4cc', icon: '⛑',  kurz: 'THW' },
  11: { farbe: '#a8c9a5', icon: '🛡', kurz: 'BePol' },
  12: { farbe: '#c4a5cc', icon: '🩺', kurz: 'SEG' },
  13: { farbe: '#a5bde0', icon: '🚁', kurz: 'PolHubschr.' },
  15: { farbe: '#a5ccd4', icon: '🚤', kurz: 'Wasserrettung' },
  17: { farbe: '#c4a5cc', icon: '🎯', kurz: 'PolSondereinh.' },
  21: { farbe: '#b0c9a5', icon: '🐕', kurz: 'Rettungshunde' },
  25: { farbe: '#b0c9a5', icon: '🏔', kurz: 'Bergrettung' },
  26: { farbe: '#a5ccd4', icon: '⛵', kurz: 'Seenotrettung' },
  28: { farbe: '#a5ccd4', icon: '🚁', kurz: 'Seenot-Hubschr.' },
  29: { farbe: '#9ab8d8', icon: '🛣', kurz: 'Autobahnpolizei' }
};
const typKonfig = t => TYP_KONFIG[Number(t)] || { farbe: '#8b9aa9', icon: '🏢', kurz: btName(t) };

const PB_MIN = { 0:1,1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,10:1,11:1,13:1,14:1,15:1,16:1,
  17:1,18:1,19:1,20:1,21:1,22:1,23:1,24:1,25:1,26:1,27:1,28:1,29:1,30:1,31:1,32:1,33:1,
  34:1,35:1,36:1,37:1,38:1,39:1,40:1,41:1,42:1,45:1,46:1,50:1,51:1,52:1,53:1,55:1,56:1,
  57:1,58:1,59:1,60:6,61:1,63:2,64:1,65:1,69:1,72:5,73:6,74:3,75:2,76:2,79:3,80:9,81:3,
  82:9,83:1,84:1,85:1,86:1,87:1,88:1,89:1,90:1,91:4,93:4,94:1,95:1,97:3,98:1,100:1,103:1,
  104:1,105:1,106:1,107:1,109:1,114:1,118:1,120:1,121:1,122:1,123:1,124:1,125:4,126:4,
  127:4,128:4,129:4,130:3,131:1,133:3,134:2,135:2,137:1,138:3,139:3,140:6,144:1,145:1,
  147:1,148:4,149:3,150:3,151:1,152:1,153:4,154:1,156:1,157:1,158:4,159:4,160:1,161:3,
  162:1,163:1,165:5,166:1,167:1,171:1,172:2,173:1,176:3,177:5,181:6,182:1,184:2,185:2,
  187:1,188:1,189:1,190:1 };

const PB_MAX = { 0:9,1:9,2:3,3:3,4:3,5:3,6:9,7:9,8:9,9:9,10:3,11:3,12:3,13:3,14:6,15:3,
  16:3,17:3,18:3,19:3,20:3,21:3,22:6,23:3,24:3,25:3,26:3,27:3,28:2,29:2,30:9,31:2,32:2,
  33:9,34:6,35:3,36:9,37:6,38:2,39:9,40:4,41:9,42:3,45:6,46:3,50:9,51:3,52:2,53:6,55:1,
  56:1,57:2,58:2,59:2,60:6,61:3,63:2,64:6,65:2,69:2,72:5,73:6,74:3,75:3,76:2,79:4,80:9,
  81:4,82:9,83:9,84:3,85:3,86:3,87:3,88:6,89:6,90:9,91:5,93:5,94:2,95:1,97:3,98:2,100:7,
  103:2,104:6,105:6,106:6,107:9,109:9,114:2,118:3,120:3,121:3,122:3,123:3,124:7,125:4,
  126:5,127:4,128:5,129:6,130:3,131:9,133:3,134:4,135:2,137:6,138:6,139:3,140:6,144:4,
  145:7,147:7,148:4,149:6,150:6,151:3,152:1,153:5,154:1,156:3,157:2,158:4,159:9,160:2,
  161:4,162:3,163:9,165:5,166:2,167:2,171:5,172:6,173:7,176:3,177:5,181:9,182:1,184:2,
  185:6,187:3,188:3,189:3,190:3 };

const minSitze = id => PB_MIN[id] || 0;
const maxSitze = id => PB_MAX[id] || 0;

const ZUGFAHRZEUG = {
  43:[42], 44:[39,40,41,45], 47:[46], 48:[46], 49:[46], 54:[46], 62:[46],
  66:[65], 67:[65], 68:[65], 70:[63,64], 71:[46], 77:[46], 78:[46],
  92:[93], 96:[61,156], 101:[100,123], 102:[100,123], 108:[46], 110:[41],
  111:[90,4,27,53,104,105,6,8,9,15,16,18,21,22,1,83,46], 112:[122],
  113:[90,4,27,53,104,105,6,8,9,15,16,18,21,22], 115:[90,4,27,53,104,105,6,8,9,15,16,18,21,22,83,5],
  116:[46], 117:[46], 119:[46], 136:[134,135,137], 141:[138], 142:[46],
  143:[90,4,27,53,104,105,6,8,9,15,16,18,21,22,36], 146:[145], 155:[149,150],
  164:[46], 168:[90,4,27,53,104,105,6,8,9,15,16,18,21,22,36], 169:[46],
  170:[46], 174:[171,173], 175:[172], 178:[176], 179:[46], 180:[46],
  183:[181], 186:[90,4,27,53,104,105,1,5,6,8,9,15,16,18,21,22,36,37,88,89,185],
  191:[190,104,105,107,106,11], 192:[46]
};

const KEY_PLAN   = 'lss-planer-plan';
const KEY_CACHE  = 'lss-planer-cache';
const KEY_PREISE = 'lss-planer-preise';
const KEY_KUERZEL= 'lss-planer-stadtkuerzel';
const KEY_PROFILE= 'lss-planer-profile';

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
};

function ladeZuordnung() {
  const roh = store.get(KEY_PROFILE + '-zuord', {});
  const aus = {};
  for (const [k, v] of Object.entries(roh)) {
    if (Array.isArray(v)) aus[k] = v.filter(Boolean);
    else if (typeof v === 'string' && v) aus[k] = [v];
  }
  return aus;
}

const S = {
  plan: store.get(KEY_PLAN, {}),
  profile: store.get(KEY_PROFILE, {}),
  zuordnung: ladeZuordnung(),
  preise: store.get(KEY_PREISE, {}),
  ausbauPreise: {},
  kuerzel: store.get(KEY_KUERZEL, {}),
  buildings: [], vehicles: [],
  byBuilding: new Map(),
  ausbauCache: new Map(),
  personalCache: new Map(),
  ausbauOffen: new Set(),
  personalOffen: new Set(),
  ausbauLaeuft: new Set(),
  personalLaeuft: new Set(),
  loaded: false, loading: false, stamp: null, error: null,
  aktiverTab: 'alle', aktiveWache: null,
  aktiverErwTab: 'ausbauten',
  suche: '', sortierung: 'offen'
};

store.set(KEY_PROFILE + '-zuord', S.zuordnung);

const READ_DELAY = 150;
const WRITE_DELAY = 350;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let chain = Promise.resolve();

function queued(fn, delay) {
  const task = chain.catch(() => {}).then(async () => {
    try { return await fn(); } finally { await sleep(delay); }
  });
  chain = task.catch(() => {});
  return task;
}

async function apiGet(path) {
  return queued(async () => {
    const r = await fetch(path, { credentials: 'same-origin' });
    if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
    return r.json();
  });
}
async function apiText(path) {
  return queued(async () => {
    const r = await fetch(path, { credentials: 'same-origin' });
    if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
    return r.text();
  });
}
async function postForm(path, fields = {}) {
  return queued(async () => {
    const body = new URLSearchParams({ authenticity_token: csrf(), ...fields });
    const r = await fetch(path, {
      method: 'POST', credentials: 'same-origin', body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
    return r.text();
  }, WRITE_DELAY);
}
async function getAction(path) {
  return queued(async () => {
    const r = await fetch(path, { credentials: 'same-origin' });
    if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
    return r.text();
  }, WRITE_DELAY);
}
const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

/* ══════════════════════════════════════════════════════════════════
   2. Daten laden
   ══════════════════════════════════════════════════════════════════ */

async function loadAll() {
  S.loading = true; S.error = null; render();
  try {
    const rawB = await apiGet('/api/buildings');
    S.buildings = rawB.map(b => ({
      id: b.id, caption: b.caption, building_type: b.building_type,
      level: b.level, personal_count: b.personal_count, enabled: b.enabled,
      leitstelle_building_id: b.leitstelle_building_id,
      extensions: (b.extensions || []).map(e => ({
        type_id: e.type_id, caption: e.caption,
        available: e.available, enabled: e.enabled,
        available_at: e.available_at || null
      }))
    }));
    const alle = [];
    let url = '/api/v2/vehicles?limit=1000';
    for (let i = 0; i < 12 && url; i++) {
      const r = await apiGet(url);
      for (const v of (r.result || r)) {
        alle.push({
          id: v.id, building_id: v.building_id,
          vehicle_type: v.vehicle_type, caption: v.caption,
          fms_real: v.fms_real,
          zugfahrzeug: v.tractive_vehicle_id ?? null,
          zufallszug: v.tractive_random === true,
          besatzung: v.assigned_personnel_count ?? null,
          sitze: v.custom_personal_max ?? null
        });
      }
      url = r.paging?.next_page || null;
    }
    S.vehicles = alle; S.stamp = Date.now();
    S.byBuilding = new Map();
    for (const v of S.vehicles) {
      if (!S.byBuilding.has(v.building_id)) S.byBuilding.set(v.building_id, []);
      S.byBuilding.get(v.building_id).push(v);
    }
    S.loaded = true;
    store.set(KEY_CACHE, { v: VERSION, stamp: S.stamp, buildings: S.buildings, vehicles: S.vehicles });
    await ladePreise();
    S.ausbauCache.clear();
    S.personalCache.clear();
    analyseInvalidieren();
  } catch (e) { S.error = e.message; }
  finally { S.loading = false; render(); }
}

async function ladePreise() {
  const bereits = new Set(Object.keys(S.preise));
  const typen = [...new Set(S.buildings.map(b => String(b.building_type)))];
  for (const t of typen) {
    if (bereits.has(t)) continue;
    const wache = S.buildings.find(b => String(b.building_type) === t);
    if (!wache) continue;
    try {
      const html = await apiText(`/buildings/${wache.id}/vehicles/new`);
      const preise = {};
      const re = /\/vehicle\/\d+\/(\d+)\/credits[^>]*>([^<]*Credits)/g;
      let m;
      while ((m = re.exec(html))) {
        const c = (m[2].match(/([\d.']+)\s*Credits/) || [])[1];
        if (c) preise[m[1]] = Number(c.replace(/[.']/g, ''));
      }
      if (Object.keys(preise).length) S.preise[t] = preise;
    } catch { /* egal */ }
  }
  store.set(KEY_PREISE, S.preise);
}

async function ladeAusbauten(b, force = false) {
  if (!force && S.ausbauCache.has(b.id)) return S.ausbauCache.get(b.id);
  try {
    const html = await apiText(`/buildings/${b.id}`);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const liste = [];
    const zeilen = doc.querySelectorAll('tr');
    for (const tr of zeilen) {
      const cap = tr.querySelector('b')?.textContent.trim();
      if (!cap) continue;
      const links = [...tr.querySelectorAll('a[href*="/extension"]')];
      if (!links.length && !tr.querySelector('.timer, [data-time], .countdown')) continue;

      let extId = null, linkGebaut = false, linkKaufbar = false;
      for (const a of links) {
        const href = a.getAttribute('href');
        let m = href.match(/\/extension\/credits\/(\d+)/);
        if (m) { extId = Number(m[1]); linkKaufbar = true; }
        m = href.match(/\/extension_ready\/(\d+)/);
        if (m) { extId = Number(m[1]); linkGebaut = true; }
      }
      const timerEl = tr.querySelector('.timer, [data-time], .countdown');
      let restSekunden = null;
      if (timerEl) {
        const t = Number(timerEl.dataset?.time || timerEl.getAttribute('data-time'));
        if (Number.isFinite(t) && t > 0) restSekunden = t;
      }
      const apiEintrag = (b.extensions || []).find(e => e.caption === cap);
      const apiGebaut = !!apiEintrag;
      const apiImBau = !!(apiEintrag?.available_at);
      const apiAktiv = apiEintrag ? apiEintrag.enabled !== false : true;
      const istImBau = apiImBau || (restSekunden != null && restSekunden > 0 && !linkGebaut);
      const istGebaut = apiGebaut || linkGebaut;
      const istVerfuegbar = !istGebaut && !istImBau && (linkKaufbar || !!extId);
      if (extId == null && !istGebaut && !istImBau) continue;
      const text = tr.textContent;
      const preisM = text.match(/([\d.']+)\s*Credits/);
      const preis = preisM ? Number(preisM[1].replace(/[.']/g, '')) : null;
      liste.push({
        extId, caption: cap,
        gebaut: istGebaut, aktiv: apiAktiv,
        imBau: istImBau, verfuegbar: istVerfuegbar,
        preis, restSekunden
      });
      if (preis != null) {
        const typK = String(b.building_type);
        S.ausbauPreise[typK] ||= {};
        S.ausbauPreise[typK][cap] = preis;
      }
    }
    S.ausbauCache.set(b.id, liste);
    return liste;
  } catch (e) {
    S.ausbauCache.set(b.id, []);
    return [];
  }
}

async function ladePersonal(b, force = false) {
  if (!force && S.personalCache.has(b.id)) return S.personalCache.get(b.id);
  try {
    const fahrzeuge = S.byBuilding.get(b.id) || [];
    const erstes = fahrzeuge.find(v => !istPlatzhalter(v));
    if (!erstes) {
      const leer = { total: 0, ohne: 0, mit: 0, auf: 0, proLehrgang: {}, proAuf: {}, personen: [] };
      S.personalCache.set(b.id, leer);
      return leer;
    }
    const html = await apiText(`/vehicles/${erstes.id}/zuweisung`);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const proLehrgang = {};
    const proAuf = {};
    const personen = [];
    let total = 0, mitAusbildung = 0;

    const rows = doc.querySelectorAll('#personal_table tbody tr[id^="personal_"]');
    for (const tr of rows) {
      total++;
      let quals = [];
      try { quals = JSON.parse(tr.dataset.filterableBy || '[]'); }
      catch { quals = []; }
      let hat = false;
      for (const q of quals) {
        proLehrgang[q] = (proLehrgang[q] || 0) + 1;
        hat = true;
      }
      if (hat) mitAusbildung++;
      const statusZelle = tr.children[2];
      const inAus = statusZelle
        ? [...statusZelle.querySelectorAll('[data-education-key]')]
            .map(e => e.getAttribute('data-education-key')).filter(Boolean)
        : [];
      for (const k of inAus) {
        proAuf[k] = (proAuf[k] || 0) + 1;
        personen.push({ name: tr.querySelector('td')?.textContent.trim() || '?', kurs: k });
      }
    }
    const aufTotal = Object.values(proAuf).reduce((s, n) => s + n, 0);
    const daten = { total, ohne: total - mitAusbildung, mit: mitAusbildung, auf: aufTotal, proLehrgang, proAuf, personen };
    S.personalCache.set(b.id, daten);
    return daten;
  } catch (e) {
    S.personalCache.set(b.id, null);
    return null;
  }
}

function loadFromCache() {
  const c = store.get(KEY_CACHE, null);
  if (!c || !Array.isArray(c.buildings) || !Array.isArray(c.vehicles)) return false;
  /* Alten Cache verwerfen, wenn er von einer älteren Skript-Version stammt */
  if (c.v !== VERSION) return false;
  S.buildings = c.buildings; S.vehicles = c.vehicles; S.stamp = c.stamp;
  S.byBuilding = new Map();
  for (const v of S.vehicles) {
    if (!S.byBuilding.has(v.building_id)) S.byBuilding.set(v.building_id, []);
    S.byBuilding.get(v.building_id).push(v);
  }
  S.loaded = true;
  return true;
}

/* ══════════════════════════════════════════════════════════════════
   3. Auswertung
   ══════════════════════════════════════════════════════════════════ */

const planbareWachen = () => S.buildings.filter(b => !NICHT_PLANEN.has(Number(b.building_type)));
const istPlatzhalter = v => !!v?.platzhalter || Number(v?.id) < 0;

let _analyseCache = new Map();
let _analyseGen = 0;
function analyseInvalidieren() {
  _analyseGen++;
  _analyseCache.clear();
}

function profileFuerWache(b) {
  const typ = String(b.building_type);
  const profile = S.profile[typ] || {};
  let namen = Array.isArray(S.zuordnung[b.id]) ? S.zuordnung[b.id].filter(n => profile[n]) : [];
  if (!namen.length && profile['Standard']) namen = ['Standard'];
  const vehicles = {};
  const extensions = {};
  for (const n of namen) {
    const p = profile[n] || {};
    for (const [k, v] of Object.entries(p.vehicles || {})) {
      vehicles[k] = (vehicles[k] || 0) + Number(v);
    }
    for (const [k, v] of Object.entries(p.extensions || {})) {
      extensions[k] = (extensions[k] || 0) + Number(v);
    }
  }
  const anzeigeName = namen.length ? namen.join(' + ') : null;
  return { namen, name: anzeigeName, data: { vehicles, extensions } };
}

function stellplaetzeVon(b) {
  const layout = LAYOUTS[b.building_type] || { basis: 'level+1', bonus: {} };
  let basis;
  if (typeof layout.basis === 'string' && layout.basis.startsWith('fix:')) {
    basis = Number(layout.basis.slice(4));
  } else {
    basis = (b.level || 0) + 1;
  }
  let bonus = 0;
  for (const e of (b.extensions || [])) {
    if (!e) continue;
    if (e.available_at) continue;
    if (e.available === false) continue;
    const b2 = layout.bonus[e.caption];
    if (b2) bonus += b2;
  }
  return basis + bonus;
}

function analyse(b) {
  const key = b.id + '|' + _analyseGen;
  if (_analyseCache.has(key)) return _analyseCache.get(key);
  const v = analyseIntern(b);
  _analyseCache.set(key, v);
  return v;
}

function analyseIntern(b) {
  const profil = profileFuerWache(b);
  const ziel = profil.data.vehicles || {};
  const fahrzeuge = S.byBuilding.get(b.id) || [];
  const ist = {};
  for (const v of fahrzeuge) {
    const t = String(v.vehicle_type);
    ist[t] = (ist[t] || 0) + 1;
  }
  const fehlend = [], ueberzaehlig = [];
  for (const [t, soll] of Object.entries(ziel)) {
    const sollN = Number(soll) || 0;
    const istN = ist[t] || 0;
    if (istN < sollN) fehlend.push({ typ: t, name: vehName(t), n: sollN - istN, soll: sollN, ist: istN });
  }
  for (const [t, istN] of Object.entries(ist)) {
    const sollN = Number(ziel[t]) || 0;
    if (istN > sollN) ueberzaehlig.push({ typ: t, name: vehName(t), n: istN - sollN, soll: sollN, ist: istN });
  }

  const gesamt = stellplaetzeVon(b);
  const belegt = fahrzeuge.length;
  const stellplaetze = { belegt, gesamt: Math.max(gesamt, belegt), frei: Math.max(0, gesamt - belegt) };

  const hatPlan = Object.keys(ziel).length > 0;
  let personalBedarf = 0;
  if (hatPlan) {
    for (const [t, soll] of Object.entries(ziel)) personalBedarf += minSitze(t) * (Number(soll) || 0);
  }
  const personal = { bedarf: personalBedarf, ist: b.personal_count || 0, hatPlan };

  let fortschritt = 0;
  let erfuellt = false;
  if (hatPlan) {
    const sollGesamt = Object.values(ziel).reduce((s, x) => s + Number(x), 0);
    const pfehlt = fehlend.reduce((s, x) => s + x.n, 0);
    fortschritt = sollGesamt === 0 ? 100 : Math.max(0, Math.round((1 - pfehlt / sollGesamt) * 100));
    erfuellt = !fehlend.length;
  }

  let fzKosten = 0, fzUnbekannt = 0;
  const preise = S.preise[String(b.building_type)] || {};
  for (const f of fehlend) {
    const p = preise[f.typ];
    if (p == null) fzUnbekannt += f.n;
    else fzKosten += p * f.n;
  }

  let ausbauKosten = 0, ausbauUnbekannt = 0;
  const zielExt = profil.data.extensions || {};
  if (Object.keys(zielExt).length) {
    const gebautExt = {};
    for (const e of (b.extensions || [])) {
      if (e.available_at) continue;
      if (e.available === false) continue;
      gebautExt[e.caption] = (gebautExt[e.caption] || 0) + 1;
    }
    const preiseExt = S.ausbauPreise[String(b.building_type)] || {};
    for (const [cap, soll] of Object.entries(zielExt)) {
      const istN = gebautExt[cap] || 0;
      const fehltN = (Number(soll) || 0) - istN;
      if (fehltN > 0) {
        const p = preiseExt[cap];
        if (p == null) ausbauUnbekannt += fehltN;
        else ausbauKosten += p * fehltN;
      }
    }
  }

  let stufenKosten2 = 0;
  const nachKauf = belegt + fehlend.reduce((s, x) => s + x.n, 0);
  const layout = LAYOUTS[b.building_type];
  if (nachKauf > gesamt && layout?.basis === 'level+1') {
    const zielLevel = b.level + (nachKauf - gesamt);
    stufenKosten2 = stufenKosten(b.level, zielLevel);
  }

  const kosten = fzKosten + ausbauKosten + stufenKosten2;
  const kostenBekannt = fzUnbekannt === 0 && ausbauUnbekannt === 0;

  const blockiert = [];
  if (fehlend.length && stellplaetze.frei <= 0) {
    if (layout?.basis === 'level+1') {
      blockiert.push(`Stellplätze voll (${gesamt}). Eine weitere Stufe kostet ${fmtCr(stufenKosten(b.level, b.level + 1))}.`);
    } else {
      blockiert.push(`Stellplätze voll (${gesamt}). Erst einen Ausbau bauen.`);
    }
  }
  const hinweise = [];
  if (ueberzaehlig.length) hinweise.push('Zusätzliche Fahrzeuge vorhanden — kein Problem, aber im Plan nicht vorgesehen.');

  const warnungen = [];
  if (fahrzeuge.length === 0 && hatPlan) warnungen.push('Wache hat 0 Fahrzeuge.');
  if (b.enabled === false) warnungen.push('Wache ist abgeschaltet.');

  return {
    fehlend, ueberzaehlig, ist, ziel, stellplaetze, personal, profilName: profil.name,
    fortschritt, erfuellt, kosten, kostenBekannt, blockiert, hinweise, warnungen, hatPlan,
    stufenKosten: stufenKosten2,
    ausbauKosten, ausbauUnbekannt,
    fzKosten, fzUnbekannt
  };
}

function lehrgangsLuecken(b) {
  const personal = S.personalCache.get(b.id);
  if (!personal) return null;
  const fahrzeuge = S.byBuilding.get(b.id) || [];
  const luecken = new Map();
  for (const v of fahrzeuge) {
    const kurse = kurseFuer(v.vehicle_type);
    if (!kurse.length) continue;
    for (const [key, art, anzahl] of kurse) {
      const vorhanden = (personal.proLehrgang[key] || 0) + (personal.proAuf[key] || 0);
      const eintrag = luecken.get(key) || { brauche: 0, habe: vorhanden };
      if (art === 'min') eintrag.brauche += (anzahl || 1);
      else eintrag.brauche += maxSitze(v.vehicle_type) || 1;
      luecken.set(key, eintrag);
    }
  }
  const result = [];
  for (const [key, e] of luecken) {
    if (e.habe < e.brauche) result.push({ kurs: key, brauche: e.brauche, habe: e.habe, fehlt: e.brauche - e.habe });
  }
  return result;
}

function fahrzeugeOhnePersonal() {
  const result = [];
  for (const b of planbareWachen()) {
    const fahrzeuge = S.byBuilding.get(b.id) || [];
    for (const v of fahrzeuge) {
      if (istPlatzhalter(v)) continue;
      if (!brauchtKurs(v.vehicle_type)) continue;
      const min = minSitze(v.vehicle_type);
      if (min === 0) continue;
      const besatzung = v.besatzung;
      if (besatzung === null || besatzung === undefined) {
        result.push({ b, v, grund: 'Besatzung unbekannt' });
        continue;
      }
      if (besatzung < min) {
        result.push({ b, v, grund: `${besatzung} von ${min} Personen` });
      }
    }
  }
  return result;
}

function ausbildungsUebersicht() {
  const proKurs = new Map();
  for (const b of planbareWachen()) {
    const p = S.personalCache.get(b.id);
    if (!p) continue;
    for (const [kurs, n] of Object.entries(p.proAuf)) {
      if (!proKurs.has(kurs)) proKurs.set(kurs, { wachen: new Map(), gesamt: 0 });
      const e = proKurs.get(kurs);
      const personen = p.personen.filter(x => x.kurs === kurs).map(x => x.name);
      e.wachen.set(b.id, { b, anzahl: n, personen });
      e.gesamt += n;
    }
  }
  return proKurs;
}

function radarListe() {
  const result = [];
  for (const b of planbareWachen()) {
    const l = lehrgangsLuecken(b);
    if (!l || !l.length) continue;
    l.sort((x, y) => y.fehlt - x.fehlt);
    const top = l[0];
    const fzBetroffen = (S.byBuilding.get(b.id) || []).filter(v =>
      kurseFuer(v.vehicle_type).some(k => k[0] === top.kurs)).length;
    const ampel = top.habe === 0 ? 'rot' : top.habe < top.brauche / 2 ? 'gelb' : 'gruen';
    result.push({ b, kurs: top.kurs, fehlt: top.fehlt, habe: top.habe, brauche: top.brauche, fzBetroffen, ampel });
  }
  result.sort((x, y) => {
    const r = { rot: 0, gelb: 1, gruen: 2 };
    return r[x.ampel] - r[y.ampel] || y.fzBetroffen - x.fzBetroffen;
  });
  return result;
}

function dashboard() {
  let fehlt = 0, fertig = 0, kosten = 0, kostenUnbekannt = false;
  let personalFehlt = 0;
  const wachen = planbareWachen();
  for (const b of wachen) {
    const a = analyse(b);
    fehlt += a.fehlend.reduce((s, x) => s + x.n, 0);
    if (a.erfuellt) fertig++;
    if (!a.kostenBekannt) kostenUnbekannt = true;
    kosten += a.kosten;
    if (a.personal.hatPlan) personalFehlt += Math.max(0, a.personal.bedarf - a.personal.ist);
  }
  return { fehlt, fertig, gesamt: wachen.length, kosten, kostenUnbekannt, personalFehlt };
}

function kostenAufschluesselung() {
  const result = [];
  for (const b of planbareWachen()) {
    const a = analyse(b);
    if (a.kosten <= 0 && a.fzUnbekannt === 0 && a.ausbauUnbekannt === 0) continue;
    result.push({
      b, fzKosten: a.fzKosten, fzUnbekannt: a.fzUnbekannt,
      ausbauKosten: a.ausbauKosten, ausbauUnbekannt: a.ausbauUnbekannt,
      stufenKosten: a.stufenKosten,
      summe: a.kosten,
      fehlend: a.fehlend
    });
  }
  result.sort((x, y) => y.summe - x.summe);
  return result;
}

/* ══════════════════════════════════════════════════════════════════
   4. Hilfsfunktionen
   ══════════════════════════════════════════════════════════════════ */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const escA = esc;
const since = ts => {
  if (!ts) return 'unbekannt';
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `vor ${h} h` : `vor ${Math.round(h / 24)} Tagen`;
};
const fmtCr = n => n.toLocaleString('de-DE') + ' Cr.';
const hexZuRgba = (hex, a) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.substr(0,2),16)},${parseInt(h.substr(2,2),16)},${parseInt(h.substr(4,2),16)},${a})`;
};
const wachenNummer = caption => {
  const m = String(caption || '').match(/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
};
const restzeit = sekunden => {
  if (sekunden == null) return '';
  if (sekunden < 60) return `${Math.round(sekunden)}s`;
  if (sekunden < 3600) return `${Math.floor(sekunden / 60)} min`;
  if (sekunden < 86400) return `${Math.floor(sekunden / 3600)} h`;
  return `${Math.floor(sekunden / 86400)} d`;
};

/* ══════════════════════════════════════════════════════════════════
   5. Aktionen
   ══════════════════════════════════════════════════════════════════ */

function fahrzeugDazu(bId, typId, caption) {
  const id = -Date.now() - Math.floor(Math.random() * 1000);
  const v = {
    id, building_id: bId, vehicle_type: Number(typId),
    caption: caption + ' (neu)', fms_real: 2, platzhalter: true,
    zugfahrzeug: null, zufallszug: false, besatzung: 0, sitze: null
  };
  S.vehicles.push(v);
  if (!S.byBuilding.has(bId)) S.byBuilding.set(bId, []);
  S.byBuilding.get(bId).push(v);
  analyseInvalidieren();
}

function ausbauDazu(b, caption, extId) {
  b.extensions = b.extensions || [];
  b.extensions.push({ type_id: extId, caption, available: true, enabled: true, available_at: null });
  S.ausbauCache.delete(b.id);
  analyseInvalidieren();
}

async function kaufeFahrzeuge(b, liste, log) {
  let n = 0;
  const preise = S.preise[String(b.building_type)] || {};
  for (const f of liste) {
    for (let i = 0; i < f.n; i++) {
      const p = preise[f.typ];
      log(`Kaufe ${f.name} (${p != null ? fmtCr(p) : 'Preis unbekannt'})`);
      try {
        await getAction(`/buildings/${b.id}/vehicle/${b.id}/${f.typ}/credits?building=${b.id}`);
        fahrzeugDazu(b.id, f.typ, f.name);
        n++;
      } catch (e) { log(`Fehler bei ${f.name}: ${e.message}`, 'err'); }
    }
  }
  return n;
}

async function baueAusbauten(b, liste, log) {
  let n = 0;
  for (const e of liste) {
    for (let i = 0; i < e.n; i++) {
      log(`Baue ${e.caption} (Bauplatz ${e.extId})${e.preis ? ' — ' + fmtCr(e.preis) : ''}`);
      try {
        await postForm(`/buildings/${b.id}/extension/credits/${e.extId}?redirect_building_id=${b.id}`);
        ausbauDazu(b, e.caption, e.extId);
        n++;
      } catch (err) { log(`Fehler bei ${e.caption}: ${err.message}`, 'err'); break; }
    }
  }
  return n;
}

async function werbePersonal(b, log) {
  log(`Werbe 3 Tage Personal für ${b.caption}`);
  await getAction(`/buildings/${b.id}/hire_do/3`);
  return 1;
}

async function benenneWacheUm(b, neuerName, log) {
  log(`Benenne um: ${b.caption} → ${neuerName}`);
  let feld = 'building[name]';
  let methode = null;
  try {
    const html = await apiText(`/buildings/${b.id}/edit`);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const f = doc.querySelector('#building_name, input[name="building[name]"], input[name$="[caption]"]');
    if (f) {
      feld = f.getAttribute('name');
      const form = f.closest('form');
      methode = form?.querySelector('input[name="_method"]')?.value || null;
    }
  } catch { /* Standard */ }
  const felder = { [feld]: neuerName };
  if (methode) felder._method = methode;
  await postForm(`/buildings/${b.id}`, felder);
  b.caption = neuerName;
  return 1;
}

async function fahrzeugEditieren(v, log, { neuerName, zugId, zufall } = {}) {
  const html = await apiText(`/vehicles/${v.id}/edit`);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const felder = { _method: 'patch' };
  doc.querySelectorAll('form input[name^="vehicle["], form select[name^="vehicle["], form textarea[name^="vehicle["]').forEach(el => {
    const n = el.getAttribute('name');
    if (!n) return;
    if (el.type === 'checkbox' || el.type === 'radio') {
      if (el.checked) felder[n] = el.value || '1';
      return;
    }
    const wert = el.tagName === 'SELECT'
      ? (el.querySelector('option[selected]')?.value ?? el.value ?? '')
      : (el.getAttribute('value') ?? el.value ?? '');
    if (wert !== '') felder[n] = wert;
  });
  if (neuerName !== undefined) felder['vehicle[caption]'] = neuerName;
  if (zugId !== undefined) felder['vehicle[tractive_vehicle_id]'] = String(zugId);
  if (zufall !== undefined) felder['vehicle[tractive_random]'] = zufall ? '1' : '0';
  await postForm(`/vehicles/${v.id}`, felder);
  if (neuerName !== undefined) v.caption = neuerName;
  if (zugId !== undefined) v.zugfahrzeug = Number(zugId);
  if (zufall !== undefined) v.zufallszug = !!zufall;
  return 1;
}

async function nummeriereFahrzeuge(b, kuerzel, wachenNr, log) {
  const fahrzeuge = (S.byBuilding.get(b.id) || []).filter(v => !istPlatzhalter(v));
  const sortiert = [...fahrzeuge].sort((a, c) => Number(a.id) - Number(c.id));
  let n = 0;
  for (let i = 0; i < sortiert.length; i++) {
    const v = sortiert[i];
    const neuerName = `${kuerzel} ${vehName(v.vehicle_type)} ${wachenNr}/${i + 1}`;
    if (v.caption === neuerName) continue;
    log(`  ${v.caption} → ${neuerName}`);
    try { await fahrzeugEditieren(v, log, { neuerName }); n++; }
    catch (e) { log(`Fehler: ${e.message}`, 'err'); }
  }
  return n;
}

async function schalteAusbau(b, extTypeId, sollAktiv, log) {
  const html = await apiText(`/buildings/${b.id}`);
  const treffer = [...html.matchAll(/href="(\/buildings\/\d+\/extension_ready\/(\d+)\/\d+)"/g)]
    .find(m => Number(m[2]) === Number(extTypeId));
  if (!treffer) throw new Error('Umschalter nicht gefunden');
  await postForm(treffer[1]);
  const e = (b.extensions || []).find(x => Number(x.type_id) === Number(extTypeId));
  if (e) e.enabled = sollAktiv;
  S.ausbauCache.delete(b.id);
  analyseInvalidieren();
  return 1;
}

async function toggleWacheAktiv(b, log) {
  const ziel = !b.enabled;
  log(`${ziel ? 'Aktiviere' : 'Deaktiviere'} ${b.caption}`);
  await getAction(`/buildings/${b.id}/active`);
  b.enabled = ziel;
  analyseInvalidieren();
  return 1;
}

async function koppeleAnhaenger(v, zielId, log) {
  log(`Koppele ${v.caption} → Fahrzeug ${zielId}`);
  return await fahrzeugEditieren(v, log, { zugId: zielId, zufall: false });
}

/* ══════════════════════════════════════════════════════════════════
   6. Dialog-System
   ══════════════════════════════════════════════════════════════════ */

async function frage(text) {
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'lssp-dialog-overlay';
    ov.innerHTML = `
      <div class="lssp-dialog" style="width:440px">
        <div class="lssp-dialog-kopf"><b>Bestätigen</b></div>
        <div class="lssp-dialog-body"><div style="white-space:pre-wrap">${esc(text)}</div></div>
        <div class="lssp-dialog-fuss">
          <button class="lssp-btn primary" data-ok>Fortfahren</button>
          <button class="lssp-btn" data-ab>Abbrechen</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('[data-ok]').onclick = () => { ov.remove(); resolve(true); };
    ov.querySelector('[data-ab]').onclick = () => { ov.remove(); resolve(false); };
    ov.onclick = e => { if (e.target === ov) { ov.remove(); resolve(false); } };
  });
}

async function zeigeAusfuehrungsDialog(runner, logZeilen, titel) {
  const overlay = document.createElement('div');
  overlay.className = 'lssp-dialog-overlay';
  overlay.innerHTML = `
    <div class="lssp-dialog" style="width:600px">
      <div class="lssp-dialog-kopf"><b>${esc(titel)}</b></div>
      <div class="lssp-dialog-body"><div class="lssp-log" id="dlg-log"></div></div>
      <div class="lssp-dialog-fuss">
        <span id="dlg-status" style="flex:1;color:#8b9aa9;font-size:12px"></span>
        <button class="lssp-btn" id="dlg-ok" disabled>Fertig</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const logEl = overlay.querySelector('#dlg-log');
  const statusEl = overlay.querySelector('#dlg-status');
  const okBtn = overlay.querySelector('#dlg-ok');
  const zeichne = () => {
    logEl.innerHTML = logZeilen.map(l => `<div class="${l.art}">${esc(l.msg)}</div>`).join('');
    logEl.scrollTop = logEl.scrollHeight;
  };
  zeichne();
  const timer = setInterval(zeichne, 150);
  try {
    statusEl.textContent = 'Läuft …';
    const n = await runner();
    statusEl.textContent = `Fertig: ${n} Aktion(en).`;
    logZeilen.push({ msg: `Fertig: ${n} Aktion(en).`, art: 'good' });
    zeichne();
  } catch (e) {
    statusEl.textContent = `Fehler: ${e.message}`;
    logZeilen.push({ msg: `Fehler: ${e.message}`, art: 'err' });
    zeichne();
  } finally {
    clearInterval(timer);
    okBtn.disabled = false;
    okBtn.onclick = () => { overlay.remove(); analyseInvalidieren(); render(); };
  }
}

function zeigeKostenDialog() {
  const liste = kostenAufschluesselung();
  if (!liste.length) { alert('Keine offenen Kosten.'); return; }
  const gesamt = liste.reduce((s, e) => s + e.summe, 0);
  const ov = document.createElement('div');
  ov.className = 'lssp-dialog-overlay';
  ov.innerHTML = `
    <div class="lssp-dialog" style="width:900px;max-width:94vw;max-height:88vh">
      <div class="lssp-dialog-kopf">
        <b>💰 Kosten bis Soll — ${liste.length} Wachen</b>
        <span style="flex:1"></span>
        <span style="color:#e0a33c;font:700 14px/1 monospace">${fmtCr(gesamt)}</span>
      </div>
      <div class="lssp-dialog-body">
        <table class="lssp-dialog-tabelle" style="width:100%">
          <thead><tr>
            <th>Wache</th>
            <th style="text-align:right">Fahrzeuge</th>
            <th style="text-align:right">Ausbauten</th>
            <th style="text-align:right">Stufen</th>
            <th style="text-align:right">Summe</th>
            <th style="text-align:right">Aktion</th>
          </tr></thead>
          <tbody>
          ${liste.map(e => {
            const k = typKonfig(e.b.building_type);
            return `<tr>
              <td><span style="color:${k.farbe}">${k.icon}</span> ${esc(e.b.caption)}</td>
              <td style="text-align:right;font:600 11px/1 monospace;color:${e.fzUnbekannt ? '#e0a33c' : '#e6ebf0'}">
                ${e.fzKosten ? fmtCr(e.fzKosten) : '—'}${e.fzUnbekannt ? ` (+${e.fzUnbekannt}?)` : ''}
              </td>
              <td style="text-align:right;font:600 11px/1 monospace;color:${e.ausbauUnbekannt ? '#e0a33c' : '#e6ebf0'}">
                ${e.ausbauKosten ? fmtCr(e.ausbauKosten) : '—'}${e.ausbauUnbekannt ? ` (+${e.ausbauUnbekannt}?)` : ''}
              </td>
              <td style="text-align:right;font:600 11px/1 monospace;color:${e.stufenKosten ? '#e6ebf0' : '#5d6c7b'}">
                ${e.stufenKosten ? fmtCr(e.stufenKosten) : '—'}
              </td>
              <td style="text-align:right;font:700 12px/1 monospace;color:#e0a33c">${fmtCr(e.summe)}</td>
              <td style="text-align:right">
                <button class="lssp-btn mini primary kosten-kaufen" data-wache="${e.b.id}">Öffnen</button>
              </td>
            </tr>`;
          }).join('')}
          </tbody>
          <tfoot><tr>
            <td colspan="4" style="text-align:right;color:#8b9aa9;font-weight:600">Gesamt:</td>
            <td style="text-align:right;font:700 13px/1 monospace;color:#e0a33c">${fmtCr(gesamt)}</td>
            <td></td>
          </tr></tfoot>
        </table>
        <p style="color:#8b9aa9;font-size:11px;margin-top:12px">
          „Öffnen" springt zur Wache im Planer. Dort findest du im Bereich Aktionen den Kaufen- bzw. Bauen-Knopf.
          Positionen mit <b style="color:#e0a33c">(?)</b> haben unbekannte Preise — öffne bei diesen Wachen einmal den Ausbauten-Bereich.
        </p>
      </div>
      <div class="lssp-dialog-fuss">
        <button class="lssp-btn" id="kosten-schliessen">Schließen</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelector('#kosten-schliessen').onclick = () => ov.remove();
  ov.querySelectorAll('.kosten-kaufen').forEach(btn => btn.onclick = () => {
    const id = Number(btn.dataset.wache);
    const w = S.buildings.find(x => x.id === id);
    if (!w) return;
    S.aktiverTab = String(w.building_type);
    S.aktiveWache = id;
    _letzterScrollKontext = '';
    ov.remove();
    render();
  });
}

/* ══════════════════════════════════════════════════════════════════
   7. CSS
   ══════════════════════════════════════════════════════════════════ */

const CSS = `
.lssp-panel {
  position: fixed; right: 20px; bottom: 20px;
  width: 1040px; max-width: 96vw; height: 80vh;
  background: #1b232c; color: #e6ebf0;
  border: 1px solid #2e3a47; border-radius: 6px;
  font: 13px/1.5 system-ui, sans-serif;
  box-shadow: 0 12px 40px rgba(0,0,0,.6);
  display: none; flex-direction: column;
  z-index: 99999; overflow: hidden;
  will-change: transform;
}
.lssp-panel.on { display: flex; }
.lssp-panel.drag { user-select: none; cursor: grabbing; }

.lssp-header {
  padding: 10px 14px; border-bottom: 1px solid #2e3a47;
  display: flex; align-items: center; gap: 10px;
  cursor: grab; background: #232d38; touch-action: none;
}
.lssp-panel.drag .lssp-header { cursor: grabbing; }
.lssp-header b { font-size: 14px; letter-spacing: .03em; }
.lssp-header .lssp-ver { color: #5d6c7b; font-size: 11px; }

.lssp-icon {
  background: none; border: 0; color: #8b9aa9;
  font: 600 15px/1 system-ui, sans-serif;
  cursor: pointer; padding: 6px 12px; border-radius: 3px;
}
.lssp-icon:hover { background: #2e3a47; color: #e6ebf0; }
.lssp-icon.close { font-size: 26px; padding: 0 12px; line-height: 1; font-weight: 400; }
.lssp-icon.close:hover { background: #d8674f; color: #fff; }

.lssp-tabs {
  display: flex; gap: 2px; padding: 4px 10px;
  background: #141a21; border-bottom: 1px solid #2e3a47;
  flex-wrap: wrap;
  max-height: 78px; overflow-y: auto;
}
.lssp-tabs::-webkit-scrollbar { height: 4px; width: 4px; }
.lssp-tabs::-webkit-scrollbar-thumb { background: #2e3a47; }
.lssp-tab {
  background: transparent; border: 0;
  color: #8b9aa9; cursor: pointer;
  padding: 6px 10px; font: 600 11px/1 system-ui, sans-serif;
  border-bottom: 3px solid transparent;
  white-space: nowrap; display: flex; align-items: center; gap: 5px;
  border-radius: 3px 3px 0 0;
}
.lssp-tab:hover { color: #e6ebf0; }
.lssp-tab.on { color: #181206; }
.lssp-tab .anzahl {
  background: rgba(0,0,0,.15); padding: 0 5px;
  border-radius: 8px; font-size: 10px;
}

.lssp-dash {
  display: grid; grid-template-columns: repeat(6, 1fr);
  gap: 1px; background: #2e3a47;
  border-bottom: 1px solid #2e3a47;
}
.lssp-dash > div { background: #1b232c; padding: 10px 8px; text-align: center; }
.lssp-dash > div.klickbar { cursor: pointer; }
.lssp-dash > div.klickbar:hover { background: #232d38; }
.lssp-dash .z { display: block; font: 700 18px/1 system-ui, sans-serif; }
.lssp-dash .l { display: block; color: #8b9aa9; font: 10px/1 system-ui, sans-serif; margin-top: 4px; letter-spacing: .05em; text-transform: uppercase; }
.lssp-dash .l-hint { display: block; color: #5d6c7b; font: 9px/1 system-ui, sans-serif; margin-top: 2px; }

.lssp-main {
  flex: 1; display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 0; overflow: hidden;
}

.lssp-aside {
  border-right: 1px solid #2e3a47;
  display: flex; flex-direction: column;
  min-height: 0; background: #171f27;
}
.lssp-aside-top { padding: 10px 12px; border-bottom: 1px solid #2e3a47; }
.lssp-search, .lssp-sort {
  width: 100%; box-sizing: border-box;
  background: #141a21 !important; color: #e6ebf0 !important;
  border: 1px solid #2e3a47; border-radius: 3px;
  padding: 6px 9px; font: 12px/1.2 system-ui, sans-serif;
  margin-bottom: 6px;
}
.lssp-search::placeholder { color: #5d6c7b; }
.lssp-search:focus, .lssp-sort:focus { outline: 0; border-color: #6f8fb5; }

.lssp-panel select { background-color: #141a21 !important; color: #e6ebf0 !important; }
.lssp-panel select option {
  background-color: #141a21 !important;
  color: #e6ebf0 !important;
}

.lssp-liste { flex: 1; overflow-y: auto; padding: 4px 0; }
.lssp-liste::-webkit-scrollbar { width: 6px; }
.lssp-liste::-webkit-scrollbar-thumb { background: #2e3a47; border-radius: 3px; }

.lssp-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px 8px 10px;
  cursor: pointer; border-left: 4px solid transparent;
}
.lssp-item:hover { background: #1f2933; }
.lssp-item.on { background: #232d38; }
.lssp-item.fertig { background: rgba(79,183,155,.06); }
.lssp-item.fertig.on { background: rgba(79,183,155,.14); }
.lssp-item.fertig .name::before { content: '✓ '; color: #4fb79b; font-weight: 700; }
.lssp-item .info { flex: 1; min-width: 0; }
.lssp-item .name {
  display: block; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.lssp-item .meta { display: block; color: #8b9aa9; font-size: 11px; margin-top: 2px; }
.lssp-item .prozent { font: 600 11px/1 monospace; color: #8b9aa9; }

.lssp-bar { height: 3px; background: #2e3a47; border-radius: 2px; overflow: hidden; margin-top: 4px; }
.lssp-bar > div { height: 100%; background: currentColor; }

.lssp-detail { overflow-y: auto; background: #1b232c; }
.lssp-detail::-webkit-scrollbar { width: 8px; }
.lssp-detail::-webkit-scrollbar-thumb { background: #2e3a47; border-radius: 4px; }

.lssp-detail-kopf {
  padding: 14px 18px; border-bottom: 1px solid #2e3a47;
  border-left: 5px solid transparent;
}
.lssp-detail-kopf h2 {
  margin: 0 0 4px; font-size: 17px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
}
.lssp-detail-kopf .unter { color: #8b9aa9; font-size: 12px; }
.lssp-detail-kopf .fortschritt { margin-top: 10px; display: flex; align-items: center; gap: 10px; }
.lssp-detail-kopf .fortschritt .lssp-bar { flex: 1; height: 6px; }
.lssp-detail-kopf .fortschritt .zahl { font: 600 13px/1 monospace; }

.lssp-sektion { padding: 14px 18px; border-bottom: 1px solid #2e3a47; }
.lssp-sektion h3 {
  margin: 0 0 10px; font-size: 13px; font-weight: 600;
  color: #8b9aa9; text-transform: uppercase; letter-spacing: .05em;
  display: flex; align-items: center; gap: 8px;
}
.lssp-sektion h3 .lssp-badge {
  background: #2e3a47; color: #e6ebf0;
  padding: 1px 7px; border-radius: 8px;
  font-size: 10px; font-weight: 500;
  text-transform: none; letter-spacing: 0;
}
.lssp-sektion h3 .lssp-rechts { margin-left: auto; }

.lssp-zeile {
  display: grid; grid-template-columns: 1fr auto auto auto;
  gap: 10px; align-items: center;
  padding: 5px 0; font-size: 12px;
  border-bottom: 1px solid rgba(46,58,71,.4);
}
.lssp-zeile:last-child { border-bottom: 0; }
.lssp-zeile .bezeichnung { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lssp-zeile .zahl { font: 600 12px/1 monospace; }
.lssp-zeile .zahl.gut { color: #4fb79b; }
.lssp-zeile .zahl.schlecht { color: #e74c3c; }
.lssp-zeile .zahl.warnung { color: #e0a33c; }
.lssp-zeile .zahl.neutral { color: #8b9aa9; }
.lssp-zeile .typ { color: #5d6c7b; font-size: 11px; margin-left: 4px; }

.lssp-zeile .akt {
  background: #2a3542; color: #e6ebf0;
  border: 1px solid #3a4653; border-radius: 3px;
  padding: 3px 9px; cursor: pointer;
  font: 600 11px/1 system-ui, sans-serif;
}
.lssp-zeile .akt:hover { border-color: #6f8fb5; }
.lssp-zeile .akt.primary { background: #e0a33c; color: #181206; border-color: #e0a33c; }
.lssp-zeile .akt.danger  { border-color: #d8674f; color: #d8674f; }

.lssp-warnbox {
  background: rgba(224,163,60,.1);
  border-left: 3px solid #e0a33c;
  padding: 8px 12px; margin: 14px 18px 0;
  border-radius: 3px; font-size: 12px; color: #f0d9b3;
}
.lssp-warnbox > div { padding: 2px 0; }
.lssp-warnbox.err { background: rgba(216,103,79,.1); border-left-color: #d8674f; color: #ffb3a3; }

.lssp-tip { position: relative; }
.lssp-tip:hover::after {
  content: attr(data-tip);
  position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
  background: #0e1319; color: #e6ebf0;
  padding: 6px 10px; border-radius: 4px;
  font: 11px/1.4 system-ui, sans-serif;
  white-space: pre; z-index: 100000;
  margin-bottom: 4px; border: 1px solid #2e3a47;
  pointer-events: none;
}

.lssp-aktionen { display: flex; flex-wrap: wrap; gap: 8px; }
.lssp-btn {
  background: #2a3542; color: #e6ebf0;
  border: 1px solid #3a4653; border-radius: 3px;
  padding: 7px 14px; cursor: pointer;
  font: 600 12px/1 system-ui, sans-serif;
  display: inline-flex; align-items: center; gap: 6px;
}
.lssp-btn:hover:not(:disabled) { border-color: #6f8fb5; }
.lssp-btn:disabled { opacity: .45; cursor: not-allowed; }
.lssp-btn.primary { background: #e0a33c; color: #181206; border-color: #e0a33c; }
.lssp-btn.primary:hover:not(:disabled) { background: #edb656; }
.lssp-btn.danger  { border-color: #d8674f; color: #d8674f; }
.lssp-btn.mini { padding: 3px 9px; font-size: 11px; }

.lssp-leer { text-align: center; padding: 60px 20px; color: #8b9aa9; font-size: 13px; }

.lssp-fuss {
  padding: 8px 14px; border-top: 1px solid #2e3a47;
  background: #141a21; color: #8b9aa9;
  font: 11px/1.4 monospace;
  display: flex; align-items: center; gap: 12px;
}
.lssp-fuss .sp { flex: 1; }

.lssp-plan-edit { padding: 18px 22px; }
.lssp-plan-edit h2 {
  margin: 0 0 4px; font-size: 17px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
}
.lssp-plan-edit p.hinweis {
  color: #8b9aa9; font-size: 12px; margin: 0 0 16px;
  padding: 8px 12px; background: rgba(139,154,169,.08);
  border-radius: 3px;
}
.lssp-plan-edit .gruppe {
  background: #171f27; border: 1px solid #2e3a47;
  border-radius: 4px; margin-bottom: 8px; overflow: hidden;
}
.lssp-plan-edit .gruppe-kopf {
  padding: 9px 14px; background: #232d38;
  display: flex; align-items: center; gap: 10px;
  font-size: 12px;
}
.lssp-plan-edit .gruppe-kopf .name { font-weight: 600; color: #8b9aa9; flex: 1; }
.lssp-plan-edit .fz-zeile {
  display: grid; grid-template-columns: 1fr auto auto auto;
  gap: 8px; align-items: center;
  padding: 7px 14px;
  border-top: 1px solid rgba(46,58,71,.4);
  font-size: 12px;
}
.lssp-plan-edit .fz-zeile:hover { background: #1f2933; }
.lssp-plan-edit .fz-zeile .zahl-feld {
  width: 46px; text-align: center;
  background: #141a21 !important; color: #e6ebf0 !important;
  border: 1px solid #2e3a47; border-radius: 3px;
  padding: 3px 4px; font: 600 12px/1 monospace;
}
.lssp-plan-edit .fz-zeile .stepper { display: inline-flex; gap: 2px; }
.lssp-plan-edit .fz-zeile .stepper button {
  background: #2a3542; color: #e6ebf0;
  border: 1px solid #3a4653; border-radius: 3px;
  width: 24px; height: 24px; cursor: pointer;
  font: 700 13px/1 system-ui, sans-serif;
  padding: 0;
}
.lssp-plan-edit .fz-zeile .stepper button:hover { border-color: #6f8fb5; }
.lssp-plan-edit .add-zeile {
  padding: 8px 14px; background: #141a21;
  border-top: 1px solid #2e3a47;
  display: flex; gap: 8px;
}

.lssp-prof-bar {
  display: flex; gap: 6px; flex-wrap: wrap;
  padding: 10px 14px; background: #141a21;
  border-bottom: 1px solid #2e3a47;
  align-items: center;
  margin-bottom: 8px;
}
.lssp-prof-chip {
  background: #232d38; color: #e6ebf0;
  border: 1px solid #2e3a47; border-radius: 3px;
  padding: 5px 12px; cursor: pointer;
  font: 600 11px/1 system-ui, sans-serif;
}
.lssp-prof-chip:hover { border-color: #6f8fb5; }
.lssp-prof-chip.on { background: #e0a33c; color: #181206; border-color: #e0a33c; }
.lssp-prof-chip .zahl { color: #8b9aa9; margin-left: 4px; font-weight: 400; }
.lssp-prof-chip.on .zahl { color: rgba(24,18,6,.6); }
.lssp-prof-chip.neu { border-style: dashed; }

.lssp-wache-zuord-zeile {
  display: flex; gap: 8px; align-items: center;
  padding: 6px 9px; border-bottom: 1px solid rgba(46,58,71,.5);
  font-size: 12px;
}
.lssp-wache-zuord-zeile .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lssp-prof-toggle {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 3px;
  background: #232d38; color: #8b9aa9;
  cursor: pointer; font-size: 11px; font-weight: 600;
  border: 1px solid #2e3a47;
}
.lssp-prof-toggle:hover { border-color: #6f8fb5; }
.lssp-prof-toggle.on { background: #4fb79b; color: #fff; border-color: #4fb79b; }
.lssp-prof-toggle input { display: none; }

.lssp-erw-karte {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px; cursor: pointer;
  border-bottom: 1px solid rgba(46,58,71,.4);
  border-left: 4px solid transparent;
}
.lssp-erw-karte:hover { background: #1f2933; }
.lssp-erw-karte.on { background: #232d38; border-left-color: #e0a33c; }
.lssp-erw-karte .icon { font-size: 20px; flex-shrink: 0; }
.lssp-erw-karte .titel { display: block; font-weight: 600; font-size: 13px; }
.lssp-erw-karte .beschreibung { display: block; color: #8b9aa9; font-size: 11px; margin-top: 3px; line-height: 1.4; }
.lssp-erw-karte .zahl {
  display: inline-block;
  background: #2e3a47; color: #e6ebf0;
  padding: 1px 7px; border-radius: 8px;
  font-size: 10px; margin-left: 4px;
}

.lssp-ausb-karte {
  background: #171f27; border: 1px solid #2e3a47;
  border-radius: 4px; margin-bottom: 8px;
  overflow: hidden;
}
.lssp-ausb-kopf {
  padding: 10px 14px; cursor: pointer;
  display: flex; align-items: center; gap: 10px;
  background: #232d38;
}
.lssp-ausb-kopf:hover { background: #2a3542; }
.lssp-ausb-kopf .name { flex: 1; font-weight: 600; }
.lssp-ausb-kopf .zahl { color: #e0a33c; font: 700 14px/1 monospace; }
.lssp-ausb-kopf .pfeil { color: #5d6c7b; }
.lssp-ausb-karte.offen .pfeil { color: #e0a33c; }
.lssp-ausb-innen { padding: 10px 14px; border-top: 1px solid #2e3a47; }
.lssp-ausb-wache {
  padding: 8px 0; border-bottom: 1px solid rgba(46,58,71,.3);
}
.lssp-ausb-wache:last-child { border-bottom: 0; }
.lssp-ausb-wache .wache-name {
  font-weight: 600; font-size: 12px; color: #e6ebf0;
  display: flex; align-items: center; gap: 6px;
}
.lssp-ausb-wache .personen {
  color: #8b9aa9; font-size: 11px;
  margin-top: 3px; padding-left: 20px;
}

.lssp-radar-rot { border-left: 4px solid #d8674f; }
.lssp-radar-gelb { border-left: 4px solid #e0a33c; }
.lssp-radar-gruen { border-left: 4px solid #4fb79b; }
.lssp-radar-zeile {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; cursor: pointer;
  background: #171f27; border-bottom: 1px solid rgba(46,58,71,.4);
}
.lssp-radar-zeile:hover { background: #1f2933; }
.lssp-radar-zeile .info { flex: 1; min-width: 0; }
.lssp-radar-zeile .wache { display: block; font-weight: 500; font-size: 12px; }
.lssp-radar-zeile .detail { display: block; color: #8b9aa9; font-size: 11px; margin-top: 2px; }
.lssp-radar-zeile .zahl { font: 700 14px/1 monospace; }
.lssp-radar-rot .zahl { color: #d8674f; }
.lssp-radar-gelb .zahl { color: #e0a33c; }
.lssp-radar-gruen .zahl { color: #4fb79b; }

.lssp-kat-kopf:hover { background: #1f2933; }

.lssp-diag-tabelle tr:hover td { background: #1f2933; }

.lssp-dialog-overlay {
  position: fixed; inset: 0; z-index: 100001;
  background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center;
  font: 13px/1.5 system-ui, sans-serif;
}
.lssp-dialog {
  background: #1b232c; color: #e6ebf0;
  border: 1px solid #2e3a47; border-radius: 6px;
  width: 520px; max-width: 92vw; max-height: 88vh;
  display: flex; flex-direction: column;
  box-shadow: 0 16px 40px rgba(0,0,0,.7);
}
.lssp-dialog-kopf {
  padding: 12px 16px; border-bottom: 1px solid #2e3a47;
  display: flex; align-items: center; gap: 10px;
  background: #232d38; border-radius: 6px 6px 0 0;
}
.lssp-dialog-kopf b { flex: 1; font-size: 14px; }
.lssp-dialog-body { padding: 16px; overflow-y: auto; flex: 1; }
.lssp-dialog-body input[type="text"],
.lssp-dialog-body input[type="number"],
.lssp-dialog-body select {
  background: #141a21 !important; color: #e6ebf0 !important;
  border: 1px solid #2e3a47; border-radius: 3px;
  padding: 6px 9px; font: 12px/1.2 system-ui, sans-serif;
  width: 100%; box-sizing: border-box;
}
.lssp-dialog-body select option {
  background: #141a21 !important; color: #e6ebf0 !important;
}
.lssp-dialog-body label { display: block; margin-bottom: 10px; }
.lssp-dialog-body label > span { display: block; color: #8b9aa9; font-size: 12px; margin-bottom: 4px; }
.lssp-dialog-fuss {
  padding: 10px 16px; border-top: 1px solid #2e3a47;
  display: flex; justify-content: flex-end; gap: 8px;
  background: #141a21; border-radius: 0 0 6px 6px;
}
.lssp-dialog-tabelle { width: 100%; border-collapse: collapse; font-size: 12px; }
.lssp-dialog-tabelle th {
  text-align: left; color: #8b9aa9; font-weight: 600;
  padding: 5px 6px; border-bottom: 1px solid #2e3a47;
  font-size: 11px; text-transform: uppercase; letter-spacing: .05em;
}
.lssp-dialog-tabelle td { padding: 5px 6px; border-bottom: 1px solid rgba(46,58,71,.3); }
.lssp-dialog-tabelle tr:last-child td { border-bottom: 0; }
.lssp-dialog-vorschau {
  background: #141a21; border: 1px solid #2e3a47;
  border-radius: 3px; padding: 8px 10px; max-height: 220px;
  overflow-y: auto; font: 11px/1.6 monospace;
}

.lssp-log {
  background: #0e1319; border: 1px solid #2e3a47; border-radius: 3px;
  padding: 8px 10px;
  font: 11px/1.6 monospace; color: #c3d0dc;
  max-height: 260px; overflow-y: auto; white-space: pre-wrap;
}
.lssp-log .err { color: #d8674f; }
.lssp-log .warn { color: #e0a33c; }
.lssp-log .good { color: #4fb79b; }

.lssp-pers-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 6px; margin-bottom: 12px;
}
.lssp-pers-karte {
  background: #171f27; border: 1px solid #2e3a47;
  border-radius: 4px; padding: 8px 10px; text-align: center;
}
.lssp-pers-karte .z { display: block; font: 700 18px/1 system-ui, sans-serif; }
.lssp-pers-karte .l { display: block; color: #8b9aa9; font: 10px/1 system-ui, sans-serif; margin-top: 4px; letter-spacing: .05em; text-transform: uppercase; }
`;

/* ══════════════════════════════════════════════════════════════════
   8. Rendering
   ══════════════════════════════════════════════════════════════════ */

let panel, bodyEl;
let offeneKataloge = new Set();
let offeneAusbKarten = new Set();
let _letzterScrollKontext = '';
let _profileEdit = {};

function render() {
  if (!bodyEl) return;
  const kontext = `${S.aktiverTab}|${S.aktiveWache}|${S.suche}|${S.sortierung}|${S.aktiverErwTab}`;
  const detailAlt = bodyEl.querySelector('.lssp-detail');
  const listeAlt = bodyEl.querySelector('.lssp-liste');
  const detailScroll = (_letzterScrollKontext === kontext) ? (detailAlt?.scrollTop || 0) : 0;
  const listeScroll = (_letzterScrollKontext === kontext) ? (listeAlt?.scrollTop || 0) : 0;

  const alt = S.stamp ? `Stand ${esc(since(S.stamp))}` : '';
  panel.querySelector('#lssp-header-status').textContent = alt;

  if (S.loading) { bodyEl.innerHTML = '<div class="lssp-leer">⏳ Lade …</div>'; _letzterScrollKontext = kontext; return; }
  if (S.error) {
    bodyEl.innerHTML = `<div class="lssp-leer">
      <div style="color:#e74c3c;margin-bottom:12px">❌ ${esc(S.error)}</div>
      <button class="lssp-btn primary" id="lssp-laden">Bestand jetzt laden</button>
    </div>`;
    bodyEl.querySelector('#lssp-laden').onclick = () => loadAll();
    _letzterScrollKontext = kontext; return;
  }
  if (!S.loaded) {
    bodyEl.innerHTML = `<div class="lssp-leer">
      <div style="margin-bottom:16px">Lade deine Wachen und Fahrzeuge aus dem Spiel.</div>
      <button class="lssp-btn primary" id="lssp-laden">Bestand jetzt laden</button>
    </div>`;
    bodyEl.querySelector('#lssp-laden').onclick = () => loadAll();
    _letzterScrollKontext = kontext; return;
  }

  const wachen = planbareWachen();
  const vorhandeneTypen = [...new Set(wachen.map(b => String(b.building_type)))]
    .sort((a, b) => btName(a).localeCompare(btName(b), 'de'));

  bodyEl.innerHTML = `
    ${tabsHtml(vorhandeneTypen, wachen.length)}
    ${S.aktiverTab === 'erweiterungen' ? '' : dashHtml()}
    <div class="lssp-main">
      ${S.aktiverTab === 'erweiterungen' ? erweiterungenAsideHtml() : asideHtml(wachen)}
      <div class="lssp-detail" id="lssp-detail">
        ${S.aktiverTab === 'erweiterungen' ? erweiterungenDetailHtml() : detailHtml(wachen)}
      </div>
    </div>
    ${fussHtml()}
  `;

  bindeEvents();

  const detailNeu = bodyEl.querySelector('.lssp-detail');
  if (detailNeu && detailScroll > 0) detailNeu.scrollTop = detailScroll;
  const listeNeu = bodyEl.querySelector('.lssp-liste');
  if (listeNeu && listeScroll > 0) listeNeu.scrollTop = listeScroll;
  _letzterScrollKontext = kontext;
}

function bindeEvents() {
  bodyEl.querySelectorAll('.lssp-tab').forEach(t => t.onclick = () => {
    S.aktiverTab = t.dataset.tab;
    S.aktiveWache = null;
    _letzterScrollKontext = '';
    render();
  });

  bodyEl.querySelectorAll('.lssp-erw-karte').forEach(k => k.onclick = () => {
    S.aktiverErwTab = k.dataset.erw;
    render();
  });

  bodyEl.querySelectorAll('.lssp-ausb-kopf').forEach(k => k.onclick = () => {
    const kurs = k.dataset.kurs;
    if (offeneAusbKarten.has(kurs)) offeneAusbKarten.delete(kurs);
    else offeneAusbKarten.add(kurs);
    render();
  });

  bodyEl.querySelectorAll('.lssp-radar-zeile').forEach(r => r.onclick = () => {
    const id = Number(r.dataset.wache);
    const w = S.buildings.find(x => x.id === id);
    if (!w) return;
    S.aktiverTab = String(w.building_type);
    S.aktiveWache = id;
    _letzterScrollKontext = '';
    render();
  });

  bodyEl.querySelector('#dash-kosten')?.addEventListener('click', zeigeKostenDialog);

  const such = bodyEl.querySelector('#lssp-search');
  if (such) {
    such.value = S.suche;
    let suchTimer = null;
    such.oninput = () => {
      S.suche = such.value;
      clearTimeout(suchTimer);
      suchTimer = setTimeout(() => {
        const pos = such.selectionStart;
        _letzterScrollKontext = '';
        render();
        const neu = bodyEl.querySelector('#lssp-search');
        if (neu) { neu.focus(); neu.setSelectionRange(pos, pos); }
      }, 200);
    };
  }
  const sort = bodyEl.querySelector('#lssp-sort');
  if (sort) {
    sort.value = S.sortierung;
    sort.onchange = () => { S.sortierung = sort.value; _letzterScrollKontext = ''; render(); };
  }
  bodyEl.querySelectorAll('.lssp-item').forEach(it => it.onclick = () => {
    S.aktiveWache = Number(it.dataset.id);
    S.ausbauOffen.delete(S.aktiveWache);
    S.personalOffen.delete(S.aktiveWache);
    _letzterScrollKontext = '';
    render();
  });

  bodyEl.querySelectorAll('.lssp-prof-chip').forEach(c => c.onclick = () => {
    const typ = c.dataset.typ, name = c.dataset.profil;
    if (name === '__neu__') { profilNeuDialog(typ); return; }
    if (name === '__umbenennen__') { profilUmbenennenDialog(typ, _profileEdit[typ]); return; }
    if (name === '__loeschen__') { profilLoeschenDialog(typ, _profileEdit[typ]); return; }
    _profileEdit[typ] = name;
    render();
  });

  bodyEl.querySelectorAll('.plan-plus').forEach(b => b.onclick = () => {
    const t = b.dataset.bt, v = b.dataset.vt, p = b.dataset.prof;
    S.profile[t][p].vehicles[v] = (Number(S.profile[t][p].vehicles[v]) || 0) + 1;
    store.set(KEY_PROFILE, S.profile); analyseInvalidieren(); render();
  });
  bodyEl.querySelectorAll('.plan-minus').forEach(b => b.onclick = () => {
    const t = b.dataset.bt, v = b.dataset.vt, p = b.dataset.prof;
    const neu = (Number(S.profile[t][p].vehicles[v]) || 0) - 1;
    if (neu <= 0) delete S.profile[t][p].vehicles[v];
    else S.profile[t][p].vehicles[v] = neu;
    store.set(KEY_PROFILE, S.profile); analyseInvalidieren(); render();
  });
  bodyEl.querySelectorAll('.plan-zahl').forEach(inp => inp.onchange = () => {
    const t = inp.dataset.bt, v = inp.dataset.vt, p = inp.dataset.prof;
    const n = Math.max(0, Math.min(99, parseInt(inp.value, 10) || 0));
    if (n === 0) delete S.profile[t][p].vehicles[v];
    else S.profile[t][p].vehicles[v] = n;
    store.set(KEY_PROFILE, S.profile); analyseInvalidieren(); render();
  });
  bodyEl.querySelectorAll('.plan-add').forEach(sel => sel.onchange = () => {
    if (!sel.value) return;
    const t = sel.dataset.bt, p = sel.dataset.prof;
    S.profile[t][p].vehicles[sel.value] = 1;
    store.set(KEY_PROFILE, S.profile); analyseInvalidieren(); render();
  });

  bodyEl.querySelectorAll('.lssp-prof-toggle').forEach(lab => {
    lab.onclick = ev => {
      ev.preventDefault();
      const bid = Number(lab.dataset.wache);
      const prof = lab.dataset.prof;
      const arr = Array.isArray(S.zuordnung[bid]) ? [...S.zuordnung[bid]] : [];
      const idx = arr.indexOf(prof);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(prof);
      if (arr.length === 0) delete S.zuordnung[bid];
      else S.zuordnung[bid] = arr;
      store.set(KEY_PROFILE + '-zuord', S.zuordnung);
      analyseInvalidieren();
      render();
    };
  });
  bodyEl.querySelector('#plan-alle-aus')?.addEventListener('click', async () => {
    const t = S.aktiverTab;
    const wachen = S.buildings.filter(b => String(b.building_type) === t);
    if (!await frage(`Alle Zuordnungen für ${btName(t)} löschen?\n\n${wachen.length} Wachen betroffen.`)) return;
    for (const b of wachen) delete S.zuordnung[b.id];
    store.set(KEY_PROFILE + '-zuord', S.zuordnung);
    analyseInvalidieren();
    render();
  });

  /* Reload-Button verdrahten (war vorher nicht gebunden) */
  bodyEl.querySelector('#lssp-reload')?.addEventListener('click', () => loadAll());

  bindeAktionen();
  bindeErweiterungenEvents();
}

function bindeErweiterungenEvents() {
  bodyEl.querySelectorAll('.lssp-kat-kopf').forEach(k => k.onclick = () => {
    const name = k.dataset.name;
    if (offeneKataloge.has(name)) offeneKataloge.delete(name);
    else offeneKataloge.add(name);
    render();
  });
  bodyEl.querySelectorAll('.lssp-diag-tabelle tr[data-wache]').forEach(tr => tr.onclick = () => {
    const id = Number(tr.dataset.wache);
    const w = S.buildings.find(x => x.id === id);
    if (!w) return;
    S.aktiverTab = String(w.building_type);
    S.aktiveWache = id;
    _letzterScrollKontext = '';
    render();
  });
  bodyEl.querySelectorAll('.lssp-diag-oeffnen').forEach(btn => btn.onclick = ev => {
    ev.stopPropagation();
    const id = Number(btn.dataset.wache);
    const w = S.buildings.find(x => x.id === id);
    if (!w) return;
    S.aktiverTab = String(w.building_type);
    S.aktiveWache = id;
    _letzterScrollKontext = '';
    render();
  });
}

/* ══════════════════════════════════════════════════════════════════
   9. Profil-Dialoge
   ══════════════════════════════════════════════════════════════════ */

function profilNeuDialog(typ) {
  const ov = document.createElement('div');
  ov.className = 'lssp-dialog-overlay';
  ov.innerHTML = `
    <div class="lssp-dialog" style="width:420px">
      <div class="lssp-dialog-kopf"><b>Neues Profil für ${esc(btName(typ))}</b></div>
      <div class="lssp-dialog-body">
        <label><span>Name des Profils</span>
          <input type="text" id="prof-neu-name" placeholder="z. B. Klein, Groß, Standard"></label>
        <div style="color:#8b9aa9;font-size:11px;margin-top:6px">
          Das Profil startet leer. Eine Wache kann mehreren Profilen gleichzeitig zugeordnet sein —
          die Soll-Werte werden dann addiert.
        </div>
      </div>
      <div class="lssp-dialog-fuss">
        <button class="lssp-btn primary" id="prof-neu-ok">Anlegen</button>
        <button class="lssp-btn" id="prof-neu-ab">Abbrechen</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const input = ov.querySelector('#prof-neu-name');
  input.focus();
  ov.querySelector('#prof-neu-ab').onclick = () => ov.remove();
  ov.querySelector('#prof-neu-ok').onclick = () => {
    const neu = input.value.trim();
    if (!neu) return;
    if (S.profile[typ][neu]) { alert('Name existiert bereits'); return; }
    S.profile[typ][neu] = { vehicles: {}, extensions: {} };
    store.set(KEY_PROFILE, S.profile);
    _profileEdit[typ] = neu;
    ov.remove();
    analyseInvalidieren();
    render();
  };
  input.onkeydown = ev => { if (ev.key === 'Enter') ov.querySelector('#prof-neu-ok').click(); };
}

function profilUmbenennenDialog(typ, alt) {
  if (!alt) return;
  const ov = document.createElement('div');
  ov.className = 'lssp-dialog-overlay';
  ov.innerHTML = `
    <div class="lssp-dialog" style="width:420px">
      <div class="lssp-dialog-kopf"><b>Profil umbenennen</b></div>
      <div class="lssp-dialog-body">
        <label><span>Neuer Name</span>
          <input type="text" id="prof-umb-name" value="${escA(alt)}"></label>
      </div>
      <div class="lssp-dialog-fuss">
        <button class="lssp-btn primary" id="prof-umb-ok">Umbenennen</button>
        <button class="lssp-btn" id="prof-umb-ab">Abbrechen</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const input = ov.querySelector('#prof-umb-name');
  input.focus(); input.select();
  ov.querySelector('#prof-umb-ab').onclick = () => ov.remove();
  ov.querySelector('#prof-umb-ok').onclick = () => {
    const neu = input.value.trim();
    if (!neu || neu === alt) { ov.remove(); return; }
    if (S.profile[typ][neu]) { alert('Name existiert bereits'); return; }
    S.profile[typ][neu] = S.profile[typ][alt];
    delete S.profile[typ][alt];
    for (const [bid, arr] of Object.entries(S.zuordnung)) {
      if (Array.isArray(arr)) {
        const i = arr.indexOf(alt);
        if (i >= 0) arr[i] = neu;
      }
    }
    store.set(KEY_PROFILE, S.profile);
    store.set(KEY_PROFILE + '-zuord', S.zuordnung);
    _profileEdit[typ] = neu;
    ov.remove();
    analyseInvalidieren();
    render();
  };
  input.onkeydown = ev => { if (ev.key === 'Enter') ov.querySelector('#prof-umb-ok').click(); };
}

async function profilLoeschenDialog(typ, name) {
  if (!name) return;
  const anzahl = Object.values(S.zuordnung).filter(a => Array.isArray(a) && a.includes(name)).length;
  if (!await frage(`Profil „${name}" für ${btName(typ)} löschen?`
    + (anzahl ? `\n\n${anzahl} Wachen sind dem Profil zugeordnet.` : ''))) return;
  delete S.profile[typ][name];
  for (const [bid, arr] of Object.entries(S.zuordnung)) {
    if (Array.isArray(arr)) {
      const i = arr.indexOf(name);
      if (i >= 0) arr.splice(i, 1);
      if (!arr.length) delete S.zuordnung[bid];
    }
  }
  store.set(KEY_PROFILE, S.profile);
  store.set(KEY_PROFILE + '-zuord', S.zuordnung);
  _profileEdit[typ] = Object.keys(S.profile[typ])[0] || null;
  analyseInvalidieren();
  render();
}

/* ══════════════════════════════════════════════════════════════════
   10. Render-Bausteine
   ══════════════════════════════════════════════════════════════════ */

function tabsHtml(typen, gesamt) {
  const items = [
    { id: 'alle', farbe: '#8b9aa9', icon: '📋', kurz: 'Alle', anzahl: gesamt },
    ...typen.map(t => ({
      id: t, ...typKonfig(t),
      anzahl: S.buildings.filter(b => String(b.building_type) === t && !NICHT_PLANEN.has(Number(b.building_type))).length
    })),
    { id: 'erweiterungen', farbe: '#e0a33c', icon: '🧩', kurz: 'Erweiterungen', anzahl: null }
  ];
  return `<div class="lssp-tabs">
    ${items.map(x => {
      const on = S.aktiverTab === x.id;
      return `<button class="lssp-tab${on ? ' on' : ''}"
        data-tab="${escA(x.id)}"
        style="background:${on ? x.farbe : 'transparent'};border-bottom-color:${on ? x.farbe : 'transparent'}">
        <span>${x.icon}</span><span>${esc(x.kurz)}</span>
        ${x.anzahl !== null ? `<span class="anzahl" style="background:${on ? 'rgba(0,0,0,.15)' : 'rgba(46,58,71,.8)'}">${x.anzahl}</span>` : ''}
      </button>`;
    }).join('')}
  </div>`;
}

function dashHtml() {
  const d = dashboard();
  const k = d.kostenUnbekannt ? '?' : fmtCr(d.kosten);
  return `<div class="lssp-dash">
    <div><span class="z" style="color:${d.fehlt ? '#e74c3c' : '#4fb79b'}">${d.fehlt}</span><span class="l">fehlt</span></div>
    <div><span class="z" style="color:#4fb79b">${d.fertig}</span><span class="l">Wachen fertig</span></div>
    <div><span class="z">${d.gesamt}</span><span class="l">im Plan</span></div>
    <div><span class="z" style="color:${d.personalFehlt ? '#e0a33c' : '#4fb79b'};font-size:15px">${d.personalFehlt}</span><span class="l">Personal fehlt</span></div>
    <div class="klickbar" id="dash-kosten" title="Klicken für Aufschlüsselung pro Wache">
      <span class="z" style="color:#e0a33c;font-size:14px">${esc(k)}</span>
      <span class="l">bis Soll</span>
      <span class="l-hint">klicken →</span>
    </div>
    <div><span class="z" style="color:#5d6c7b;font-size:14px">${S.vehicles.length}</span><span class="l">Fahrzeuge</span></div>
  </div>`;
}

function asideHtml(wachen) {
  let gefiltert = S.aktiverTab === 'alle' ? wachen : wachen.filter(b => String(b.building_type) === S.aktiverTab);
  if (S.suche.trim()) {
    const w = S.suche.trim().toLowerCase();
    gefiltert = gefiltert.filter(b => (b.caption || '').toLowerCase().includes(w));
  }
  const sortiert = [...gefiltert];
  sortiert.sort((a, b) => {
    const aa = analyse(a), ab = analyse(b);
    if (S.sortierung === 'offen') {
      const fa = aa.fehlend.reduce((s, x) => s + x.n, 0);
      const fb = ab.fehlend.reduce((s, x) => s + x.n, 0);
      return fb - fa || (a.caption || '').localeCompare(b.caption || '', 'de');
    }
    if (S.sortierung === 'name') return (a.caption || '').localeCompare(b.caption || '', 'de');
    if (S.sortierung === 'stufe') return (b.level || 0) - (a.level || 0);
    return 0;
  });

  const items = sortiert.map(b => {
    const a = analyse(b);
    const k = typKonfig(b.building_type);
    const on = S.aktiveWache === b.id;
    const prozent = a.fortschritt;
    let farbe, meta;
    if (!a.hatPlan) { farbe = '#5d6c7b'; meta = 'kein Ziel gesetzt'; }
    else if (a.erfuellt) { farbe = '#4fb79b'; meta = '✓ vollständig'; }
    else { farbe = prozent >= 50 ? '#e0a33c' : '#e74c3c'; meta = `${a.fehlend.reduce((s, x) => s + x.n, 0)} fehlt`; }
    const randFarbe = a.erfuellt ? '#4fb79b' : k.farbe;
    return `<div class="lssp-item${on ? ' on' : ''}${a.erfuellt ? ' fertig' : ''}" data-id="${b.id}"
      style="border-left-color:${randFarbe};${on ? `background:${hexZuRgba(randFarbe, .14)}` : ''}">
      <div class="info">
        <span class="name">${esc(b.caption)}</span>
        <span class="meta">${esc(k.kurz)} · Stufe ${b.level || 0} · ${esc(meta)}</span>
        <div class="lssp-bar" style="color:${farbe}"><div style="width:${prozent}%"></div></div>
      </div>
      <span class="prozent" style="color:${farbe}">${a.hatPlan ? prozent + '%' : '—'}</span>
    </div>`;
  }).join('');

  return `<aside class="lssp-aside">
    <div class="lssp-aside-top">
      <input type="text" class="lssp-search" id="lssp-search" placeholder="🔍 Wache suchen …">
      <select class="lssp-sort" id="lssp-sort">
        <option value="offen">Offenste zuerst</option>
        <option value="name">Nach Name</option>
        <option value="stufe">Nach Stufe (hoch→niedrig)</option>
      </select>
    </div>
    <div class="lssp-liste">
      ${items || '<div class="lssp-leer" style="padding:20px;font-size:12px">Keine Wachen gefunden.</div>'}
    </div>
  </aside>`;
}

function erweiterungenAsideHtml() {
  const karten = [
    { id: 'ausbauten', icon: '🏗️', titel: 'Ausbau-Katalog',
      beschreibung: 'Welche Ausbauten wo stehen', zahl: null },
    { id: 'diagnose', icon: '🔍', titel: 'Diagnose',
      beschreibung: 'Fahrzeuge mit Lehrgangspflicht ohne Personal', zahl: fahrzeugeOhnePersonal().length },
    { id: 'ausbildung', icon: '🎓', titel: 'Ausbildung',
      beschreibung: 'Wer wird wo ausgebildet', zahl: ausbildungsUebersicht().size },
    { id: 'radar', icon: '📡', titel: 'Bedarf-Radar',
      beschreibung: 'Welcher Lehrgang fehlt am dringendsten', zahl: radarListe().length }
  ];
  return `<aside class="lssp-aside">
    <div class="lssp-aside-top">
      <div style="color:#8b9aa9;font-size:11px;text-transform:uppercase;letter-spacing:.05em">
        Erweiterungen
      </div>
    </div>
    <div class="lssp-liste">
      ${karten.map(k => `
        <div class="lssp-erw-karte${S.aktiverErwTab === k.id ? ' on' : ''}" data-erw="${k.id}">
          <span class="icon">${k.icon}</span>
          <div style="flex:1;min-width:0">
            <span class="titel">${esc(k.titel)}${k.zahl !== null ? ` <span class="zahl">${k.zahl}</span>` : ''}</span>
            <span class="beschreibung">${esc(k.beschreibung)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </aside>`;
}

function erweiterungenDetailHtml() {
  switch (S.aktiverErwTab) {
    case 'ausbauten':    return ausbautenErwHtml();
    case 'diagnose':     return diagnoseErwHtml();
    case 'ausbildung':   return ausbildungErwHtml();
    case 'radar':        return radarErwHtml();
    default:             return ausbautenErwHtml();
  }
}

function ausbautenErwHtml() {
  const wachen = planbareWachen();
  const alleAusbauten = new Map();
  for (const b of wachen) {
    for (const e of (b.extensions || [])) {
      if (e.available_at) continue;
      if (e.available === false) continue;
      const cap = e.caption || `Ausbau ${e.type_id}`;
      const key = `${cap}|${b.building_type}`;
      if (!alleAusbauten.has(key)) alleAusbauten.set(key, { cap, btyp: b.building_type, wachen: [] });
      alleAusbauten.get(key).wachen.push(b);
    }
  }
  const sortiert = [...alleAusbauten.values()].sort((a, b) =>
    b.wachen.length - a.wachen.length || a.cap.localeCompare(b.cap, 'de'));

  return `<div style="padding:18px 22px">
    <h2 style="margin:0 0 4px;font-size:17px;font-weight:600">🏗️ Ausbau-Katalog</h2>
    <p style="color:#8b9aa9;font-size:12px;margin:0 0 16px">
      ${sortiert.length} Kombinationen aus Ausbau + Wachentyp. Klicke einen Eintrag, um zu sehen, wo er steht.</p>
    ${sortiert.map(({ cap, btyp, wachen: list }) => {
      const key = `${cap}|${btyp}`;
      const offen = offeneKataloge.has(key);
      const k = typKonfig(btyp);
      return `<div style="background:#171f27;border:1px solid #2e3a47;border-radius:4px;margin-bottom:6px;overflow:hidden">
        <div class="lssp-kat-kopf" data-name="${escA(key)}"
             style="display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;padding:10px 14px;cursor:pointer">
          <span style="font-weight:500">${esc(cap)} <span style="color:${k.farbe}">(${esc(k.kurz)})</span></span>
          <span style="color:#8b9aa9;font:600 12px/1 monospace">${list.length} Wachen</span>
          <span style="color:${offen ? '#e0a33c' : '#5d6c7b'}">${offen ? '▼' : '▶'}</span>
        </div>
        ${offen ? `<div style="padding:8px 14px 12px;border-top:1px solid #2e3a47">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px;font-size:11px">
            ${list.map(b => `<div style="background:#141a21;padding:4px 8px;border-radius:3px;
              border-left:3px solid ${k.farbe};overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
              >${esc(b.caption)}</div>`).join('')}
          </div>
        </div>` : ''}
      </div>`;
    }).join('') || '<p style="color:#8b9aa9">Noch keine Ausbauten im Bestand.</p>'}
  </div>`;
}

function diagnoseErwHtml() {
  const liste = fahrzeugeOhnePersonal();
  if (!liste.length) {
    return `<div style="padding:22px">
      <h2 style="margin:0 0 4px;font-size:17px;font-weight:600">🔍 Diagnose</h2>
      <p style="color:#8b9aa9;font-size:12px;margin:0 0 16px">Fahrzeuge mit Ausbildungspflicht, aber ohne ausreichend Personal.</p>
      <p style="color:#4fb79b;margin-top:20px">✓ Alle Fahrzeuge mit Lehrgangspflicht haben Personal.</p>
    </div>`;
  }
  const proWache = new Map();
  for (const e of liste) {
    if (!proWache.has(e.b.id)) proWache.set(e.b.id, { b: e.b, eintraege: [] });
    proWache.get(e.b.id).eintraege.push(e);
  }
  const sortiert = [...proWache.values()].sort((a, b) => b.eintraege.length - a.eintraege.length);

  return `<div style="padding:22px">
    <h2 style="margin:0 0 4px;font-size:17px;font-weight:600">🔍 Diagnose</h2>
    <p style="color:#8b9aa9;font-size:12px;margin:0 0 16px">
      ${liste.length} Fahrzeuge auf ${sortiert.length} Wachen. Klick auf „Wache öffnen" springt direkt hin.</p>
    <table class="lssp-diag-tabelle" style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr>
        <th style="text-align:left;color:#8b9aa9;font-weight:600;padding:6px 8px;border-bottom:1px solid #2e3a47;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Wache</th>
        <th style="text-align:left;color:#8b9aa9;font-weight:600;padding:6px 8px;border-bottom:1px solid #2e3a47;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Fahrzeuge</th>
        <th style="text-align:right;color:#8b9aa9;font-weight:600;padding:6px 8px;border-bottom:1px solid #2e3a47;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Anz.</th>
        <th style="text-align:right;color:#8b9aa9;font-weight:600;padding:6px 8px;border-bottom:1px solid #2e3a47;font-size:11px"></th>
      </tr></thead>
      <tbody>
      ${sortiert.map(({ b, eintraege }) => {
        const namen = eintraege.slice(0, 3).map(e => esc(e.v.caption)).join(', ');
        const rest = eintraege.length > 3 ? ` +${eintraege.length - 3}` : '';
        return `<tr data-wache="${b.id}" style="cursor:pointer">
          <td style="padding:5px 8px;border-bottom:1px solid rgba(46,58,71,.3)">${esc(b.caption)}</td>
          <td style="padding:5px 8px;border-bottom:1px solid rgba(46,58,71,.3);color:#8b9aa9;font-size:11px">${namen}${rest}</td>
          <td style="padding:5px 8px;border-bottom:1px solid rgba(46,58,71,.3);text-align:right;font:600 12px/1 monospace;color:#e74c3c">${eintraege.length}</td>
          <td style="padding:5px 8px;border-bottom:1px solid rgba(46,58,71,.3);text-align:right">
            <button class="lssp-btn mini primary lssp-diag-oeffnen" data-wache="${b.id}">Wache öffnen →</button>
          </td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>
  </div>`;
}

function ausbildungErwHtml() {
  const uebersicht = ausbildungsUebersicht();
  if (!uebersicht.size) {
    return `<div style="padding:22px">
      <h2 style="margin:0 0 4px;font-size:17px;font-weight:600">🎓 Ausbildung</h2>
      <p style="color:#8b9aa9;font-size:12px;margin:0 0 16px">Wer wird wo ausgebildet.</p>
      <p style="color:#8b9aa9;margin-top:20px">Noch keine Ausbildungsdaten geladen.</p>
      <button class="lssp-btn" id="ausb-alle-laden">Alle Wachen durchgehen</button>
    </div>`;
  }
  const sortiert = [...uebersicht.entries()].sort((a, b) => b[1].gesamt - a[1].gesamt);
  return `<div style="padding:22px">
    <h2 style="margin:0 0 4px;font-size:17px;font-weight:600">🎓 Ausbildung</h2>
    <p style="color:#8b9aa9;font-size:12px;margin:0 0 16px">
      ${uebersicht.size} Lehrgänge, ${[...uebersicht.values()].reduce((s, e) => s + e.gesamt, 0)} Personen in Ausbildung.</p>
    ${sortiert.map(([kurs, daten]) => {
      const offen = offeneAusbKarten.has(kurs);
      return `<div class="lssp-ausb-karte${offen ? ' offen' : ''}">
        <div class="lssp-ausb-kopf" data-kurs="${escA(kurs)}">
          <span class="name">🎓 ${esc(kursName(kurs))}</span>
          <span class="zahl">${daten.gesamt}</span>
          <span style="color:#8b9aa9;font-size:11px">auf ${daten.wachen.size} Wachen</span>
          <span class="pfeil">${offen ? '▼' : '▶'}</span>
        </div>
        ${offen ? `<div class="lssp-ausb-innen">
          ${[...daten.wachen.values()].map(({ b, anzahl, personen }) => {
            const k = typKonfig(b.building_type);
            return `<div class="lssp-ausb-wache">
              <div class="wache-name">
                <span style="color:${k.farbe}">${k.icon}</span>
                ${esc(b.caption)}
                <span style="color:#8b9aa9;font-weight:400">(${anzahl} Person${anzahl === 1 ? '' : 'en'})</span>
              </div>
              <div class="personen">${personen.map(esc).join(', ')}</div>
            </div>`;
          }).join('')}
        </div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

function radarErwHtml() {
  const liste = radarListe();
  if (!liste.length) {
    return `<div style="padding:22px">
      <h2 style="margin:0 0 4px;font-size:17px;font-weight:600">📡 Bedarf-Radar</h2>
      <p style="color:#8b9aa9;font-size:12px;margin:0 0 16px">Welcher Lehrgang fehlt wo am dringendsten.</p>
      <p style="color:#4fb79b;margin-top:20px">✓ Keine kritischen Lehrgangslücken gefunden.</p>
    </div>`;
  }
  return `<div style="padding:22px">
    <h2 style="margin:0 0 4px;font-size:17px;font-weight:600">📡 Bedarf-Radar</h2>
    <p style="color:#8b9aa9;font-size:12px;margin:0 0 16px">
      Pro Wache der dringendste fehlende Lehrgang. Klick öffnet die Wache.</p>
    <div style="border:1px solid #2e3a47;border-radius:4px;overflow:hidden">
    ${liste.map(({ b, kurs, fehlt, habe, brauche, fzBetroffen, ampel }) => {
      const k = typKonfig(b.building_type);
      return `<div class="lssp-radar-zeile lssp-radar-${ampel}" data-wache="${b.id}">
        <span style="font-size:16px;color:${k.farbe}">${k.icon}</span>
        <div class="info">
          <span class="wache">${esc(b.caption)}</span>
          <span class="detail">braucht <b>${esc(kursName(kurs))}</b> · ${habe} von ${brauche} vorhanden · ${fzBetroffen} Fahrzeug${fzBetroffen === 1 ? '' : 'e'} betroffen</span>
        </div>
        <span class="zahl">${fehlt} fehlt</span>
      </div>`;
    }).join('')}
    </div>
  </div>`;
}

function detailHtml() {
  if (!S.aktiveWache) {
    if (S.aktiverTab === 'alle') {
      return `<div class="lssp-leer">
        <div style="font-size:15px;color:#e6ebf0;margin-bottom:8px">Willkommen im Planer</div>
        <div style="max-width:420px;margin:0 auto;line-height:1.6">
          Wähle oben einen Wachentyp, um Ziele zu setzen.<br>
          Oder klicke links eine Wache an.<br><br>
          <span style="color:#8b9aa9;font-size:12px">
          <b>🧩 Erweiterungen</b> zeigt Ausbau-Katalog, Diagnose, Ausbildung und Bedarf-Radar.</span>
        </div>
      </div>`;
    }
    return planEditorHtml(S.aktiverTab);
  }
  const b = S.buildings.find(x => x.id === S.aktiveWache);
  if (!b) return '<div class="lssp-leer">Wache nicht gefunden.</div>';
  const a = analyse(b);
  const k = typKonfig(b.building_type);
  const farbe = !a.hatPlan ? '#5d6c7b'
              : a.erfuellt ? '#4fb79b'
              : (a.fortschritt >= 50 ? '#e0a33c' : '#e74c3c');
  const luecken = lehrgangsLuecken(b);

  return `
    <div class="lssp-detail-kopf" style="border-left-color:${a.erfuellt ? '#4fb79b' : k.farbe}">
      <h2>${k.icon} ${esc(b.caption)}
        ${a.erfuellt ? '<span style="color:#4fb79b;font-size:14px">✓ vollständig</span>' : ''}
        ${b.enabled === false ? '<span style="color:#e74c3c;font-size:12px">(abgeschaltet)</span>' : ''}</h2>
      <div class="unter">${esc(k.kurz)} · Stufe ${b.level || 0} · ${b.personal_count || 0} Personal · ID ${b.id} · Profil: ${esc(a.profilName || '—')}</div>
      ${a.hatPlan ? `<div class="fortschritt">
        <span style="color:#8b9aa9;font-size:11px">Soll erfüllt:</span>
        <div class="lssp-bar" style="color:${farbe}"><div style="width:${a.fortschritt}%"></div></div>
        <span class="zahl" style="color:${farbe}">${a.fortschritt}%</span>
      </div>` : `<div class="fortschritt" style="color:#8b9aa9;font-size:12px">
        Kein Profil zugeordnet. Wechsle in den Tab „${esc(k.kurz)}" ohne Wache.
      </div>`}
    </div>
    ${a.warnungen.length ? `<div class="lssp-warnbox">
      ${a.warnungen.map(w => `<div>⚠️ ${esc(w)}</div>`).join('')}
    </div>` : ''}
    ${luecken && luecken.length ? `<div class="lssp-warnbox err">
      <div><b>⚠️ Lehrgangs-Lücken:</b></div>
      ${luecken.map(l => `<div>• ${esc(kursName(l.kurs))}: ${l.habe} von ${l.brauche} (${l.fehlt} fehlen)</div>`).join('')}
    </div>` : ''}
    ${sektionFahrzeuge(a, b)}
    ${sektionAusbauten(b)}
    ${sektionAnhaenger(b)}
    ${sektionPersonal(b, a)}
    ${sektionStellplaetze(b, a)}
    ${sektionBlockade(a)}
    ${sektionAktionen(a, b)}
  `;
}

function planEditorHtml(typ) {
  const k = typKonfig(typ);
  S.profile[typ] ||= {};
  if (!Object.keys(S.profile[typ]).length) {
    S.profile[typ]['Standard'] = { vehicles: {}, extensions: {} };
    store.set(KEY_PROFILE, S.profile);
  }
  const profile = S.profile[typ];
  if (!_profileEdit[typ] || !profile[_profileEdit[typ]]) {
    _profileEdit[typ] = Object.keys(profile)[0];
  }
  const aktivesProfil = _profileEdit[typ];
  const daten = profile[aktivesProfil];
  const ziel = daten.vehicles || {};
  const wachenDesTyps = S.buildings.filter(b => String(b.building_type) === typ);

  const typenSet = new Set();
  for (const p of Object.values(profile)) for (const t of Object.keys(p.vehicles || {})) typenSet.add(String(t));
  const std = MODELL_STANDARD[String(typ)];
  if (std) for (const t of Object.keys(std.vehicles)) typenSet.add(String(t));
  for (const b of wachenDesTyps) for (const v of (S.byBuilding.get(b.id) || [])) typenSet.add(String(v.vehicle_type));

  const alleTypen = [...typenSet].sort((a, b) => vehName(a).localeCompare(vehName(b), 'de'));
  const imZiel = Object.keys(ziel).filter(t => Number(ziel[t]) > 0)
    .sort((a, b) => vehName(a).localeCompare(vehName(b), 'de'));
  const weitere = alleTypen.filter(t => !(t in ziel));

  let personalBedarf = 0;
  for (const [t, n] of Object.entries(ziel)) personalBedarf += minSitze(t) * (Number(n) || 0);

  const profileBar = `
    <div class="lssp-prof-bar">
      ${Object.keys(profile).map(p => {
        const anzahl = Object.values(S.zuordnung).filter(a => Array.isArray(a) && a.includes(p)).length;
        return `<button class="lssp-prof-chip${p === aktivesProfil ? ' on' : ''}"
          data-typ="${escA(typ)}" data-profil="${escA(p)}">
          ${esc(p)}${anzahl ? `<span class="zahl">${anzahl}</span>` : ''}
        </button>`;
      }).join('')}
      <button class="lssp-prof-chip neu" data-typ="${escA(typ)}" data-profil="__neu__">+ Neues Profil</button>
      <span style="flex:1"></span>
      ${aktivesProfil && aktivesProfil !== 'Standard' ? `
        <button class="lssp-prof-chip" data-typ="${escA(typ)}" data-profil="__umbenennen__">✏️ umbenennen</button>
        <button class="lssp-prof-chip" data-typ="${escA(typ)}" data-profil="__loeschen__" style="color:#d8674f">🗑 löschen</button>
      ` : ''}
    </div>`;

  const wachenListe = wachenDesTyps.map(b => {
    const aktuelle = Array.isArray(S.zuordnung[b.id]) ? S.zuordnung[b.id] : [];
    const zugeordneteProfile = aktuelle.filter(p => profile[p]);
    const toggles = Object.keys(profile).map(p => {
      const an = p === 'Standard'
        ? (zugeordneteProfile.length === 0 || zugeordneteProfile.includes('Standard'))
        : zugeordneteProfile.includes(p);
      return `<label class="lssp-prof-toggle${an ? ' on' : ''}"
        data-wache="${b.id}" data-prof="${escA(p)}"
        title="${an ? 'Klick zum Entfernen' : 'Klick zum Hinzufügen'}">
        ${esc(p)}
      </label>`;
    }).join(' ');
    const keinProfil = zugeordneteProfile.length === 0;
    return `<div class="lssp-wache-zuord-zeile">
      <input type="checkbox" class="lssp-bsel" value="${b.id}">
      <span class="name">${esc(b.caption)}</span>
      ${keinProfil ? '<span style="color:#5d6c7b;font-size:10px">kein Profil</span>' : ''}
      <span style="display:flex;gap:4px;flex-wrap:wrap">${toggles}</span>
    </div>`;
  }).join('');

  return `<div class="lssp-plan-edit">
    <h2>${k.icon} Profile für ${esc(btName(typ))}</h2>
    <p class="hinweis">
      Lege verschiedene Profile an und weise sie Wachen zu.
      <b>Eine Wache kann mehreren Profilen angehören</b> — die Soll-Werte werden dann addiert.
      Klick auf einen Profil-Namen bei einer Wache schaltet die Zuordnung an/aus.
      ${imZiel.length ? `<br><br>Personalbedarf des aktiven Profils: <b>${personalBedarf} Personen</b>.` : ''}
    </p>
    ${profileBar}

    <div class="gruppe">
      <div class="gruppe-kopf">
        <span class="name">Ziel-Fahrzeuge (Profil: ${esc(aktivesProfil)})</span>
      </div>
      ${imZiel.length ? imZiel.map(t => {
        const n = ziel[t] || 0;
        const tip = `${minSitze(t)}–${maxSitze(t)} Personen zum Ausrücken`;
        return `<div class="fz-zeile">
          <span class="lssp-tip" data-tip="${escA(tip)}">${esc(vehName(t))}${brauchtKurs(t) ? ' 🎓' : ''}</span>
          <span class="stepper">
            <button class="plan-minus" data-bt="${escA(typ)}" data-vt="${escA(t)}" data-prof="${escA(aktivesProfil)}">−</button>
            <input type="number" class="zahl-feld plan-zahl"
              data-bt="${escA(typ)}" data-vt="${escA(t)}" data-prof="${escA(aktivesProfil)}"
              value="${n}" min="0" max="99">
            <button class="plan-plus" data-bt="${escA(typ)}" data-vt="${escA(t)}" data-prof="${escA(aktivesProfil)}">+</button>
          </span>
          <span></span><span></span>
        </div>`;
      }).join('') : '<div style="padding:14px;color:#8b9aa9;font-size:12px">Noch kein Fahrzeug im Ziel — wähle unten einen Typ aus.</div>'}
      ${weitere.length ? `<div class="add-zeile">
        <select class="lssp-sort plan-add" data-bt="${escA(typ)}" data-prof="${escA(aktivesProfil)}" style="flex:1;margin:0">
          <option value="">Fahrzeugtyp hinzufügen (${weitere.length} passend) …</option>
          ${weitere.map(t => `<option value="${escA(t)}">${esc(vehName(t))}${brauchtKurs(t) ? ' 🎓' : ''}</option>`).join('')}
        </select>
      </div>` : ''}
    </div>

    <div class="gruppe">
      <div class="gruppe-kopf">
        <span class="name">Wachen-Zuordnung</span>
        <button class="lssp-btn mini danger" id="plan-alle-aus">Alle Zuordnungen dieses Typs löschen</button>
      </div>
      <div style="max-height:320px;overflow-y:auto">
        ${wachenListe || '<div style="padding:14px;color:#8b9aa9;font-size:12px">Keine Wachen dieses Typs.</div>'}
      </div>
    </div>
  </div>`;
}

function sektionFahrzeuge(a, b) {
  const fahrzeuge = S.byBuilding.get(b.id) || [];
  const zeilen = [];
  const gezeigt = new Set();
  if (a.hatPlan) {
    for (const [t, soll] of Object.entries(a.ziel)) {
      const ist = a.ist[t] || 0;
      const diff = ist - soll;
      const cls = diff === 0 ? 'gut' : diff < 0 ? 'schlecht' : 'neutral';
      const kurse = kurseFuer(t).map(k2 => kursName(k2[0])).join(', ');
      const tip = (maxSitze(t) ? `${minSitze(t)}–${maxSitze(t)} Personen` : 'kein Personenbedarf')
        + (kurse ? `\nLehrgänge: ${kurse}` : '');
      zeilen.push(`<div class="lssp-zeile lssp-tip" data-tip="${escA(tip)}">
        <span class="bezeichnung">${esc(vehName(t))}${brauchtKurs(t) ? ' 🎓' : ''}</span>
        <span class="zahl">${ist} / ${soll}</span>
        <span class="zahl ${cls}">${diff === 0 ? '✓' : (diff > 0 ? '✓ (+' + diff + ')' : diff)}</span>
        <span></span>
      </div>`);
      gezeigt.add(t);
    }
  }
  for (const [t, n] of Object.entries(a.ist)) {
    if (gezeigt.has(t)) continue;
    zeilen.push(`<div class="lssp-zeile">
      <span class="bezeichnung">${esc(vehName(t))}${brauchtKurs(t) ? ' 🎓' : ''}</span>
      <span class="zahl">${n}</span>
      <span class="zahl neutral">—</span>
      <span></span>
    </div>`);
  }
  const einzel = fahrzeuge.filter(v => !istPlatzhalter(v)).map(v => {
    const max = maxSitze(v.vehicle_type);
    const min = minSitze(v.vehicle_type);
    const bes = v.besatzung ?? '?';
    const kurs = kurseFuer(v.vehicle_type).map(k2 => kursName(k2[0])).join(', ');
    let cls = 'neutral';
    if (max > 0 && typeof bes === 'number') {
      if (bes >= max) cls = 'gut';
      else if (bes >= min) cls = 'warnung';
      else cls = 'schlecht';
    }
    return `<div class="lssp-zeile">
      <span class="bezeichnung">${esc(v.caption)}<span class="typ">(${esc(vehName(v.vehicle_type))}${kurs ? ' 🎓' : ''})</span></span>
      <span class="zahl ${cls}">${bes} / ${max || '—'}</span>
      <span></span><span></span>
    </div>`;
  }).join('');

  return `<div class="lssp-sektion">
    <h3>🚒 Fahrzeug-Übersicht <span class="lssp-badge">${a.hatPlan ? zeilen.length + ' Positionen' : 'ohne Ziel'}</span></h3>
    ${zeilen.length ? zeilen.join('') : '<div style="color:#8b9aa9;font-size:12px">Keine Fahrzeuge auf dieser Wache.</div>'}
    ${fahrzeuge.filter(v => !istPlatzhalter(v)).length ? `<div style="color:#8b9aa9;font-size:11px;margin-top:12px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Fahrzeuge einzeln (Besatzung / max Sitze)</div>${einzel}` : ''}
  </div>`;
}

function ausbauAggregieren(liste) {
  const map = new Map();
  for (const e of liste) {
    const key = e.caption;
    const m = map.get(key) || {
      caption: key, gesamt: 0, gebaut: 0, imBau: 0, verfuegbar: 0,
      extIds: [], preise: [], restSekunden: null, aktiv: true, gebautExtIds: []
    };
    m.gesamt++;
    if (e.gebaut) { m.gebaut++; m.gebautExtIds.push(e.extId); m.aktiv = m.aktiv && e.aktiv; }
    if (e.imBau) m.imBau++;
    if (e.verfuegbar) { m.verfuegbar++; m.extIds.push(e.extId); }
    if (e.preis != null) m.preise.push(e.preis);
    if (e.restSekunden != null) m.restSekunden = Math.max(m.restSekunden || 0, e.restSekunden);
    map.set(key, m);
  }
  return [...map.values()];
}

function sektionAusbauten(b) {
  const offen = S.ausbauOffen.has(b.id);
  const laeuft = S.ausbauLaeuft.has(b.id);
  const ausbauten = S.ausbauCache.get(b.id);

  if (!offen && !ausbauten) {
    return `<div class="lssp-sektion">
      <h3>🏗️ Ausbauten</h3>
      <div style="color:#8b9aa9;font-size:12px;margin-bottom:10px">Klicke „anzeigen" um Bauplätze zu sehen.</div>
      <button class="lssp-btn" id="akt-ausbau-toggle">🏗️ Ausbauten anzeigen</button>
    </div>`;
  }
  if (laeuft && !ausbauten) {
    return `<div class="lssp-sektion"><h3>🏗️ Ausbauten</h3><div style="color:#8b9aa9;font-size:12px">Lade …</div></div>`;
  }
  if (!offen && ausbauten) {
    const gebautN = ausbauten.filter(e => e.gebaut).length;
    const imBauN = ausbauten.filter(e => e.imBau).length;
    return `<div class="lssp-sektion">
      <h3>🏗️ Ausbauten <span class="lssp-badge">${gebautN} gebaut${imBauN ? `, ${imBauN} im Bau` : ''}</span></h3>
      <button class="lssp-btn" id="akt-ausbau-toggle">🏗️ Ausbauten anzeigen</button>
    </div>`;
  }
  const agg = ausbauAggregieren(ausbauten);
  const gebaut = agg.filter(e => e.gebaut > 0);
  const imBau = agg.filter(e => e.imBau > 0);
  const verfuegbar = agg.filter(e => e.verfuegbar > 0);

  return `<div class="lssp-sektion">
    <h3>🏗️ Ausbauten <span class="lssp-badge">${gebaut.length} gebaut${imBau.length ? `, ${imBau.length} im Bau` : ''}${verfuegbar.length ? `, ${verfuegbar.length} verfügbar` : ''}</span>
      <button class="lssp-btn mini lssp-rechts" id="akt-ausbau-neu" ${laeuft ? 'disabled' : ''}>${laeuft ? '↻ lädt…' : '↻ neu laden'}</button>
      <button class="lssp-btn mini" id="akt-ausbau-toggle">verbergen</button>
    </h3>
    ${gebaut.map(e => {
      const nameMitZahl = e.gebaut > 1 ? `${esc(e.caption)} <span class="typ">(${e.gebaut}x)</span>` : esc(e.caption);
      return `<div class="lssp-zeile">
        <span class="bezeichnung">${nameMitZahl}</span>
        <span class="zahl ${e.aktiv !== false ? 'gut' : 'warnung'}">${e.aktiv !== false ? 'aktiv' : 'inaktiv'}</span>
        <span></span>
        <button class="akt akt-ausbau-toggle-einzeln" data-ext="${e.gebautExtIds[0]}" data-soll="${e.aktiv !== false ? '0' : '1'}" data-caption="${escA(e.caption)}">
          ${e.aktiv !== false ? 'deaktivieren' : 'aktivieren'}
        </button>
      </div>`;
    }).join('')}
    ${imBau.length ? `<div style="color:#8b9aa9;font-size:11px;margin-top:10px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Im Bau</div>
      ${imBau.map(e => `<div class="lssp-zeile">
        <span class="bezeichnung">${e.imBau > 1 ? `${esc(e.caption)} <span class="typ">(${e.imBau}x)</span>` : esc(e.caption)}</span>
        <span class="zahl warnung">${e.restSekunden != null ? restzeit(e.restSekunden) : 'im Bau'}</span>
        <span></span><span></span>
      </div>`).join('')}` : ''}
    ${verfuegbar.length ? `<div style="color:#8b9aa9;font-size:11px;margin-top:10px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Noch verfügbar</div>
      ${verfuegbar.map(e => {
        const preis = e.preise.length ? Math.min(...e.preise) : null;
        const nameMitZahl = e.verfuegbar > 1 ? `${esc(e.caption)} <span class="typ">(${e.verfuegbar}x)</span>` : esc(e.caption);
        return `<div class="lssp-zeile">
          <span class="bezeichnung">${nameMitZahl}</span>
          <span class="zahl neutral">${preis != null ? fmtCr(preis) : '—'}</span>
          <span></span>
          <button class="akt primary akt-ausbau-bauen" data-ext="${e.extIds[0]}" data-caption="${escA(e.caption)}" data-preis="${preis || 0}">bauen</button>
        </div>`;
      }).join('')}` : ''}
  </div>`;
}

function sektionAnhaenger(b) {
  const fahrzeuge = (S.byBuilding.get(b.id) || []).filter(v => !istPlatzhalter(v));
  const anhaenger = fahrzeuge.filter(v => maxSitze(v.vehicle_type) === 0);
  if (!anhaenger.length) return '';
  return `<div class="lssp-sektion">
    <h3>🔗 Anhänger <span class="lssp-badge">${anhaenger.length}</span></h3>
    ${anhaenger.map(v => {
      const ziel = v.zugfahrzeug ? fahrzeuge.find(x => String(x.id) === String(v.zugfahrzeug)) : null;
      const zugText = ziel ? ziel.caption : (v.zufallszug ? 'zufälliges Zugfahrzeug' : 'nicht gekoppelt');
      const cls = ziel ? 'gut' : (v.zufallszug ? 'warnung' : 'schlecht');
      return `<div class="lssp-zeile">
        <span class="bezeichnung">${esc(v.caption)}<span class="typ">(${esc(vehName(v.vehicle_type))})</span></span>
        <span class="zahl ${cls}" style="grid-column:span 2;text-align:right;font-weight:400">${esc(zugText)}</span>
        <button class="akt akt-koppeln" data-vid="${v.id}">${ziel ? 'ändern' : 'koppeln'}</button>
      </div>`;
    }).join('')}
  </div>`;
}

function sektionPersonal(b, a) {
  const p = a.personal;
  const offen = S.personalOffen.has(b.id);
  const laeuft = S.personalLaeuft.has(b.id);
  const personal = S.personalCache.get(b.id);

  if (!offen && !personal) {
    return `<div class="lssp-sektion">
      <h3>👥 Personal <span class="lssp-badge">${p.ist} vorhanden</span></h3>
      ${p.hatPlan ? `<div class="lssp-zeile">
        <span class="bezeichnung">Bedarf laut Ziel</span>
        <span class="zahl">${p.ist} / ${p.bedarf}</span>
        <span class="zahl ${p.ist >= p.bedarf ? 'gut' : 'schlecht'}">${p.ist - p.bedarf >= 0 ? '✓' : (p.ist - p.bedarf)}</span>
        <span></span>
      </div>` : ''}
      <div style="color:#8b9aa9;font-size:12px;margin:10px 0">Klicke „anzeigen" für Lehrgänge.</div>
      <button class="lssp-btn" id="akt-personal-toggle">👥 Personal anzeigen</button>
    </div>`;
  }
  if (laeuft && !personal) {
    return `<div class="lssp-sektion"><h3>👥 Personal</h3><div style="color:#8b9aa9;font-size:12px">Lade …</div></div>`;
  }
  if (!offen && personal) {
    return `<div class="lssp-sektion">
      <h3>👥 Personal <span class="lssp-badge">${personal.total} Personen</span></h3>
      <button class="lssp-btn" id="akt-personal-toggle">👥 Personal anzeigen</button>
    </div>`;
  }
  const lehrgaenge = Object.entries(personal.proLehrgang).sort((x, y) => y[1] - x[1]);
  const auf = Object.entries(personal.proAuf).sort((x, y) => y[1] - x[1]);

  return `<div class="lssp-sektion">
    <h3>👥 Personal <span class="lssp-badge">${personal.total} Personen</span>
      <button class="lssp-btn mini lssp-rechts" id="akt-personal-neu" ${laeuft ? 'disabled' : ''}>${laeuft ? '↻ lädt…' : '↻ neu laden'}</button>
      <button class="lssp-btn mini" id="akt-personal-toggle">verbergen</button>
    </h3>
    <div class="lssp-pers-grid">
      <div class="lssp-pers-karte">
        <span class="z" style="color:${personal.ohne ? '#e0a33c' : '#4fb79b'}">${personal.ohne}</span>
        <span class="l">Ohne Ausbildung</span>
      </div>
      <div class="lssp-pers-karte">
        <span class="z" style="color:#4fb79b">${personal.mit}</span>
        <span class="l">Mit Ausbildung</span>
      </div>
      <div class="lssp-pers-karte">
        <span class="z" style="color:${personal.auf ? '#a5bde0' : '#5d6c7b'}">${personal.auf}</span>
        <span class="l">Auf Ausbildung</span>
      </div>
    </div>
    ${auf.length ? `<div style="color:#8b9aa9;font-size:11px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Laufende Ausbildungen</div>
      ${auf.map(([key, n]) => `<div class="lssp-zeile">
        <span class="bezeichnung">${esc(kursName(key))}</span>
        <span class="zahl" style="color:#a5bde0">${n}×</span>
        <span></span><span></span>
      </div>`).join('')}` : ''}
    ${lehrgaenge.length ? `<div style="color:#8b9aa9;font-size:11px;margin-top:12px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Abgeschlossene Lehrgänge</div>
      ${lehrgaenge.map(([key, n]) => `<div class="lssp-zeile">
        <span class="bezeichnung">${esc(kursName(key))}</span>
        <span class="zahl">${n}×</span>
        <span></span><span></span>
      </div>`).join('')}` : '<div style="color:#8b9aa9;font-size:12px">Keine Lehrgänge vorhanden.</div>'}
  </div>`;
}

function sektionStellplaetze(b, a) {
  const s = a.stellplaetze;
  const cls = s.frei > 0 ? 'gut' : (s.belegt <= s.gesamt ? 'warnung' : 'schlecht');
  const layout = LAYOUTS[b.building_type];
  const basisWert = (b.level || 0) + 1;
  const basisText = layout?.basis === 'level+1' ? `Stufe ${b.level} + 1 = ${basisWert}` :
                    layout?.basis ? `Start ${layout.basis.replace('fix:', '')}` : 'Standard';
  const bonusSumme = s.gesamt - basisWert;
  const nextPreis = layout?.basis === 'level+1' ? stufenKosten(b.level, b.level + 1) : null;
  const status = s.belegt > s.gesamt
    ? `<span style="color:#e74c3c">Überbelegt! (${s.belegt - s.gesamt} über Kapazität)</span>`
    : s.frei === 0 ? '<span style="color:#e0a33c">Alle Plätze belegt</span>' : '';
  return `<div class="lssp-sektion">
    <h3>🅿️ Stellplätze <span class="lssp-badge">${s.belegt} / ${s.gesamt}</span></h3>
    <div class="lssp-zeile">
      <span class="bezeichnung">Belegt / Gesamt</span>
      <span class="zahl">${s.belegt} / ${s.gesamt}</span>
      <span class="zahl ${cls}">${s.frei > 0 ? s.frei + ' frei' : '—'}</span>
      <span></span>
    </div>
    <div style="color:#8b9aa9;font-size:11px;margin-top:6px">
      ${basisText}${bonusSumme > 0 ? ` + ${bonusSumme} aus Ausbauten` : ''}
      ${nextPreis ? ` · nächste Stufe: ${fmtCr(nextPreis)}` : ''}
      ${status ? ` · ${status}` : ''}
    </div>
  </div>`;
}

function sektionBlockade(a) {
  const teile = [];
  if (a.blockiert.length || a.hinweise.length) {
    teile.push(`<div class="lssp-sektion">
      <h3>🚧 Hinweise</h3>
      ${a.blockiert.map(g => `<div style="color:#e0a33c;font-size:12px;padding:3px 0">• ${esc(g)}</div>`).join('')}
      ${a.hinweise.map(g => `<div style="color:#8b9aa9;font-size:12px;padding:3px 0">• ${esc(g)}</div>`).join('')}
    </div>`);
  }
  if (a.fzKosten > 0 || a.ausbauKosten > 0 || a.stufenKosten > 0 || a.fzUnbekannt > 0 || a.ausbauUnbekannt > 0) {
    teile.push(`<div class="lssp-sektion">
      <h3>💰 Kosten bis Soll</h3>
      ${a.fzKosten > 0 ? `<div class="lssp-zeile">
        <span class="bezeichnung">Fahrzeuge</span>
        <span class="zahl" style="color:#e0a33c">${fmtCr(a.fzKosten)}</span>
        <span></span><span></span>
      </div>` : ''}
      ${a.ausbauKosten > 0 ? `<div class="lssp-zeile">
        <span class="bezeichnung">Ausbauten</span>
        <span class="zahl" style="color:#e0a33c">${fmtCr(a.ausbauKosten)}</span>
        <span></span><span></span>
      </div>` : ''}
      ${a.stufenKosten > 0 ? `<div class="lssp-zeile">
        <span class="bezeichnung">Stufen-Ausbauten</span>
        <span class="zahl" style="color:#e0a33c">${fmtCr(a.stufenKosten)}</span>
        <span></span><span></span>
      </div>` : ''}
      ${(a.fzUnbekannt || a.ausbauUnbekannt) ? `<div style="color:#8b9aa9;font-size:11px;padding:4px 0">
        ${a.fzUnbekannt ? `• ${a.fzUnbekannt} Fahrzeuge ohne bekannten Preis. ` : ''}
        ${a.ausbauUnbekannt ? `• ${a.ausbauUnbekannt} Ausbauten ohne bekannten Preis (Ausbauten-Bereich öffnen).` : ''}
      </div>` : ''}
      ${a.kosten > 0 ? `<div class="lssp-zeile" style="border-top:1px solid #2e3a47;margin-top:6px;padding-top:8px">
        <span class="bezeichnung" style="font-weight:600">Gesamt</span>
        <span class="zahl" style="color:#e0a33c;font-size:14px">${fmtCr(a.kosten)}</span>
        <span></span><span></span>
      </div>` : ''}
    </div>`);
  }
  return teile.join('');
}

function sektionAktionen(a, b) {
  return `<div class="lssp-sektion">
    <h3>⚡ Aktionen</h3>
    <div class="lssp-aktionen">
      <button class="lssp-btn primary" id="akt-kaufen" ${a.fehlend.length ? '' : 'disabled'}>
        🚗 Fahrzeuge kaufen${a.fehlend.length ? ` (${a.fehlend.reduce((s, x) => s + x.n, 0)})` : ''}
      </button>
      <button class="lssp-btn" id="akt-werben" ${a.personal.hatPlan && a.personal.ist < a.personal.bedarf ? '' : 'disabled'}>
        👤 Personal werben
      </button>
      <button class="lssp-btn" id="akt-umbenennen">✏️ Wache umbenennen</button>
      <button class="lssp-btn" id="akt-nummerieren">🔢 Fahrzeuge nummerieren</button>
      <button class="lssp-btn ${b.enabled ? 'danger' : 'primary'}" id="akt-wache-toggle">
        ${b.enabled ? '⏸ Wache deaktivieren' : '▶ Wache aktivieren'}
      </button>
    </div>
  </div>`;
}

function fussHtml() {
  return `<div class="lssp-fuss">
    <span>${S.loaded ? 'Bestand geladen' : 'Noch nicht geladen'}</span>
    <span class="sp"></span>
    <button class="lssp-btn" id="lssp-reload" style="padding:4px 10px;font-size:11px">↻ Neu laden</button>
  </div>`;
}

/* ══════════════════════════════════════════════════════════════════
   11. Aktions-Verdrahtung
   ══════════════════════════════════════════════════════════════════ */

function bindeAktionen() {
  bodyEl.querySelector('#akt-ausbau-toggle')?.addEventListener('click', async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    if (S.ausbauOffen.has(b.id)) { S.ausbauOffen.delete(b.id); render(); return; }
    S.ausbauOffen.add(b.id);
    if (!S.ausbauCache.has(b.id)) {
      S.ausbauLaeuft.add(b.id); render();
      await ladeAusbauten(b, true);
      S.ausbauLaeuft.delete(b.id);
    }
    render();
  });
  bodyEl.querySelector('#akt-ausbau-neu')?.addEventListener('click', async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    S.ausbauLaeuft.add(b.id); render();
    await ladeAusbauten(b, true);
    S.ausbauLaeuft.delete(b.id); render();
  });
  bodyEl.querySelector('#akt-personal-toggle')?.addEventListener('click', async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    if (S.personalOffen.has(b.id)) { S.personalOffen.delete(b.id); render(); return; }
    S.personalOffen.add(b.id);
    if (!S.personalCache.has(b.id)) {
      S.personalLaeuft.add(b.id); render();
      await ladePersonal(b, true);
      S.personalLaeuft.delete(b.id);
    }
    render();
  });
  bodyEl.querySelector('#akt-personal-neu')?.addEventListener('click', async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    S.personalLaeuft.add(b.id); render();
    await ladePersonal(b, true);
    S.personalLaeuft.delete(b.id); render();
  });
  bodyEl.querySelector('#akt-wache-toggle')?.addEventListener('click', async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    if (!await frage(`Wache ${!b.enabled ? 'AKTIVIEREN' : 'DEAKTIVIEREN'}?\n\n${b.caption}`)) return;
    const logZeilen = []; const log = (msg, art = '') => logZeilen.push({ msg, art });
    await zeigeAusfuehrungsDialog(async () => await toggleWacheAktiv(b, log), logZeilen, 'Wache aktiv/inaktiv');
  });
  bodyEl.querySelector('#akt-kaufen')?.addEventListener('click', async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    const a = analyse(b);
    if (!a.fehlend.length) return;
    const preise = S.preise[String(b.building_type)] || {};
    const gesamt = a.fehlend.reduce((s, x) => s + (preise[x.typ] || 0) * x.n, 0);
    const unbekannt = a.fehlend.some(x => preise[x.typ] == null);
    const stufenZusatz = a.stufenKosten > 0
      ? `<p style="margin:12px 0 0;color:#e0a33c">Zusätzlich ${fmtCr(a.stufenKosten)} für Stufen-Ausbauten.</p>` : '';
    const inhalt = `
      <p style="margin:0 0 12px;color:#8b9aa9">Diese Fahrzeuge werden gekauft:</p>
      <table class="lssp-dialog-tabelle">
        <thead><tr><th>Fahrzeug</th><th style="text-align:right">Anz.</th><th style="text-align:right">Stück</th><th style="text-align:right">Summe</th></tr></thead>
        <tbody>${a.fehlend.map(f => {
          const p = preise[f.typ];
          return `<tr><td>${esc(f.name)}</td>
            <td style="text-align:right">${f.n}</td>
            <td style="text-align:right">${p != null ? fmtCr(p) : '?'}</td>
            <td style="text-align:right;font-weight:600">${p != null ? fmtCr(p * f.n) : '?'}</td></tr>`;
        }).join('')}</tbody>
        <tfoot><tr><td colspan="3" style="text-align:right;color:#8b9aa9">Fahrzeuge:</td>
          <td style="text-align:right;font-weight:600">${unbekannt ? 'mind. ' : ''}${fmtCr(gesamt)}</td></tr></tfoot>
      </table>${stufenZusatz}`;
    if (!await new Promise(resolve => {
      const ov = document.createElement('div');
      ov.className = 'lssp-dialog-overlay';
      ov.innerHTML = `
        <div class="lssp-dialog" style="width:620px">
          <div class="lssp-dialog-kopf"><b>Fahrzeuge kaufen für ${esc(b.caption)}</b></div>
          <div class="lssp-dialog-body">${inhalt}</div>
          <div class="lssp-dialog-fuss">
            <button class="lssp-btn primary" data-ok>Jetzt kaufen</button>
            <button class="lssp-btn" data-ab>Abbrechen</button>
          </div>
        </div>`;
      document.body.appendChild(ov);
      ov.querySelector('[data-ok]').onclick = () => { ov.remove(); resolve(true); };
      ov.querySelector('[data-ab]').onclick = () => { ov.remove(); resolve(false); };
      ov.onclick = e => { if (e.target === ov) { ov.remove(); resolve(false); } };
    })) return;
    const logZeilen = []; const log = (msg, art = '') => logZeilen.push({ msg, art });
    await zeigeAusfuehrungsDialog(async () => await kaufeFahrzeuge(b, a.fehlend, log), logZeilen, 'Kaufe Fahrzeuge');
  });
  bodyEl.querySelectorAll('.akt-ausbau-bauen').forEach(btn => btn.onclick = async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    const extId = Number(btn.dataset.ext), caption = btn.dataset.caption;
    const preis = Number(btn.dataset.preis) || null;
    if (!await frage(`${caption} bauen?\n\n${preis ? fmtCr(preis) : ''}`)) return;
    const logZeilen = []; const log = (msg, art = '') => logZeilen.push({ msg, art });
    await zeigeAusfuehrungsDialog(async () => await baueAusbauten(b, [{ extId, caption, n: 1, preis }], log), logZeilen, 'Baue Ausbau');
  });
  bodyEl.querySelector('#akt-werben')?.addEventListener('click', async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    const a = analyse(b);
    if (!a.personal.hatPlan || a.personal.ist >= a.personal.bedarf) return;
    if (!await frage(`3 Tage Personal für ${b.caption} werben?`)) return;
    const logZeilen = []; const log = (msg, art = '') => logZeilen.push({ msg, art });
    await zeigeAusfuehrungsDialog(async () => await werbePersonal(b, log), logZeilen, 'Werbe Personal');
  });
  bodyEl.querySelector('#akt-umbenennen')?.addEventListener('click', () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    const ov = document.createElement('div');
    ov.className = 'lssp-dialog-overlay';
    ov.innerHTML = `
      <div class="lssp-dialog">
        <div class="lssp-dialog-kopf"><b>Wache umbenennen</b></div>
        <div class="lssp-dialog-body">
          <label><span>Neuer Name</span>
            <input type="text" id="dlg-name" value="${escA(b.caption)}"></label>
        </div>
        <div class="lssp-dialog-fuss">
          <button class="lssp-btn primary" id="dlg-ok">Umbenennen</button>
          <button class="lssp-btn" id="dlg-ab">Abbrechen</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const input = ov.querySelector('#dlg-name');
    input.focus(); input.select();
    ov.querySelector('#dlg-ab').onclick = () => ov.remove();
    ov.querySelector('#dlg-ok').onclick = async () => {
      const eingabe = input.value.trim();
      ov.remove();
      if (!eingabe || eingabe === b.caption) return;
      const logZeilen = []; const log = (msg, art = '') => logZeilen.push({ msg, art });
      await zeigeAusfuehrungsDialog(async () => await benenneWacheUm(b, eingabe, log), logZeilen, 'Benenne um');
    };
    input.onkeydown = ev => { if (ev.key === 'Enter') ov.querySelector('#dlg-ok').click(); };
  });
  bodyEl.querySelector('#akt-nummerieren')?.addEventListener('click', () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    const fahrzeuge = (S.byBuilding.get(b.id) || []).filter(v => !istPlatzhalter(v));
    if (!fahrzeuge.length) return;
    const wNrAuto = wachenNummer(b.caption);
    const kuerzelAuto = S.kuerzel[String(b.id)] || '';
    const ov = document.createElement('div');
    ov.className = 'lssp-dialog-overlay';
    ov.innerHTML = `
      <div class="lssp-dialog" style="width:640px">
        <div class="lssp-dialog-kopf"><b>Fahrzeuge nummerieren — ${esc(b.caption)}</b></div>
        <div class="lssp-dialog-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
            <label><span>Stadtkürzel</span>
              <input type="text" id="dlg-kuerzel" value="${escA(kuerzelAuto)}" maxlength="6" placeholder="z. B. DD"></label>
            <label><span>Wachennummer</span>
              <input type="number" id="dlg-wnr" value="${wNrAuto != null ? wNrAuto : ''}" min="0" max="999"></label>
          </div>
          <div style="color:#8b9aa9;font-size:12px;margin-bottom:6px">Vorschau:</div>
          <div class="lssp-dialog-vorschau" id="dlg-vorschau"></div>
        </div>
        <div class="lssp-dialog-fuss">
          <button class="lssp-btn primary" id="dlg-ok">Alle umbenennen</button>
          <button class="lssp-btn" id="dlg-ab">Abbrechen</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const inpK = ov.querySelector('#dlg-kuerzel');
    const inpW = ov.querySelector('#dlg-wnr');
    const vorschau = ov.querySelector('#dlg-vorschau');
    const sortiert = [...fahrzeuge].sort((a, c) => Number(a.id) - Number(c.id));
    const zeichne = () => {
      const k = (inpK.value.trim() || '??').toUpperCase();
      const w = inpW.value.trim() || '?';
      vorschau.innerHTML = sortiert.map((v, i) => {
        const neu = `${k} ${vehName(v.vehicle_type)} ${w}/${i + 1}`;
        return `<div><span style="color:#8b9aa9">${esc(v.caption)}</span> → <span style="color:#e0a33c">${esc(neu)}</span></div>`;
      }).join('');
    };
    inpK.oninput = zeichne; inpW.oninput = zeichne;
    inpK.focus(); zeichne();
    ov.querySelector('#dlg-ab').onclick = () => ov.remove();
    ov.querySelector('#dlg-ok').onclick = async () => {
      const k = inpK.value.trim().toUpperCase();
      const w = Number(inpW.value);
      if (!k || !Number.isFinite(w)) return;
      S.kuerzel[String(b.id)] = k;
      store.set(KEY_KUERZEL, S.kuerzel);
      ov.remove();
      const logZeilen = []; const log = (msg, art = '') => logZeilen.push({ msg, art });
      await zeigeAusfuehrungsDialog(async () => await nummeriereFahrzeuge(b, k, w, log), logZeilen, 'Nummeriere Fahrzeuge');
    };
  });
  bodyEl.querySelectorAll('.akt-ausbau-toggle-einzeln').forEach(btn => btn.onclick = async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    const extId = Number(btn.dataset.ext);
    const sollAktiv = btn.dataset.soll === '1';
    const caption = btn.dataset.caption;
    const logZeilen = []; const log = (msg, art = '') => logZeilen.push({ msg, art });
    await zeigeAusfuehrungsDialog(async () => {
      log(`Schalte ${caption} → ${sollAktiv ? 'aktiv' : 'inaktiv'}`);
      return await schalteAusbau(b, extId, sollAktiv, log);
    }, logZeilen, 'Schalte Ausbau');
  });
  bodyEl.querySelectorAll('.akt-koppeln').forEach(btn => btn.onclick = () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    const v = (S.byBuilding.get(b.id) || []).find(x => String(x.id) === btn.dataset.vid);
    if (!v) return;
    const zug = ZUGFAHRZEUG[v.vehicle_type] || null;
    const kandidaten = (S.byBuilding.get(b.id) || [])
      .filter(x => !istPlatzhalter(x) && maxSitze(x.vehicle_type) > 0)
      .filter(x => !zug || zug.includes(x.vehicle_type))
      .sort((a, c) => (maxSitze(c.vehicle_type) || 0) - (maxSitze(a.vehicle_type) || 0));
    if (!kandidaten.length) { alert('Kein passendes Zugfahrzeug.'); return; }
    const ov = document.createElement('div');
    ov.className = 'lssp-dialog-overlay';
    ov.innerHTML = `
      <div class="lssp-dialog">
        <div class="lssp-dialog-kopf"><b>Anhänger koppeln</b></div>
        <div class="lssp-dialog-body">
          <p style="margin:0 0 12px">${esc(v.caption)} an …</p>
          <select id="dlg-ziel">
            <option value="">— bitte wählen —</option>
            ${kandidaten.map(k => `<option value="${k.id}" ${String(v.zugfahrzeug) === String(k.id) ? 'selected' : ''}>
              ${esc(k.caption)} (${esc(vehName(k.vehicle_type))}, max ${maxSitze(k.vehicle_type)} P.)
            </option>`).join('')}
          </select>
        </div>
        <div class="lssp-dialog-fuss">
          <button class="lssp-btn primary" id="dlg-ok">Koppeln</button>
          <button class="lssp-btn" id="dlg-ab">Abbrechen</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    const sel = ov.querySelector('#dlg-ziel');
    ov.querySelector('#dlg-ab').onclick = () => ov.remove();
    ov.querySelector('#dlg-ok').onclick = async () => {
      const ziel = sel.value;
      if (!ziel) return;
      ov.remove();
      const logZeilen = []; const log = (msg, art = '') => logZeilen.push({ msg, art });
      await zeigeAusfuehrungsDialog(async () => await koppeleAnhaenger(v, ziel, log), logZeilen, 'Koppele Anhänger');
    };
  });
  bodyEl.querySelector('#ausb-alle-laden')?.addEventListener('click', async () => {
    const overlay = document.createElement('div');
    overlay.className = 'lssp-dialog-overlay';
    overlay.innerHTML = `
      <div class="lssp-dialog" style="width:520px">
        <div class="lssp-dialog-kopf"><b>Lade Ausbildungsdaten …</b></div>
        <div class="lssp-dialog-body"><div class="lssp-log" id="alle-log"></div></div>
        <div class="lssp-dialog-fuss"><button class="lssp-btn" id="alle-ab">Abbrechen</button></div>
      </div>`;
    document.body.appendChild(overlay);
    const logEl = overlay.querySelector('#alle-log');
    let abbruch = false;
    overlay.querySelector('#alle-ab').onclick = () => { abbruch = true; overlay.remove(); };
    const alle = planbareWachen();
    for (let i = 0; i < alle.length; i++) {
      if (abbruch) break;
      const b = alle[i];
      logEl.innerHTML += `<div>${i + 1}/${alle.length} — ${esc(b.caption)}</div>`;
      logEl.scrollTop = logEl.scrollHeight;
      try { await ladePersonal(b, true); } catch { /* egal */ }
    }
    overlay.remove();
    render();
  });
}

/* ══════════════════════════════════════════════════════════════════
   12. Fenster
   ══════════════════════════════════════════════════════════════════ */

function baueFenster() {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  panel = document.createElement('div');
  panel.className = 'lssp-panel';
  panel.innerHTML = `
    <div class="lssp-header" id="lssp-drag">
      <b>📋 Wachen-Planer</b>
      <span class="lssp-ver">v${VERSION}</span>
      <span style="flex:1"></span>
      <span id="lssp-header-status" style="color:#5d6c7b;font-size:11px"></span>
      <button class="lssp-icon close" id="lssp-close" title="Schließen">×</button>
    </div>
    <div id="lssp-body" style="display:contents"></div>
  `;
  document.body.appendChild(panel);
  bodyEl = panel.querySelector('#lssp-body');

  const griff = panel.querySelector('#lssp-drag');
  let drag = null;
  const bewegen = e => {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    panel.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  };
  const los = e => {
    if (!drag) return;
    const dx = e ? e.clientX - drag.startX : 0;
    const dy = e ? e.clientY - drag.startY : 0;
    const nl = Math.min(Math.max(-300, drag.startLeft + dx), innerWidth - 100);
    const nt = Math.min(Math.max(0, drag.startTop + dy), innerHeight - 60);
    panel.style.right = 'auto'; panel.style.bottom = 'auto';
    panel.style.left = nl + 'px'; panel.style.top = nt + 'px';
    panel.style.transform = '';
    drag = null; panel.classList.remove('drag');
    removeEventListener('pointermove', bewegen);
    removeEventListener('pointerup', los);
    removeEventListener('pointercancel', los);
  };
  griff.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const r = panel.getBoundingClientRect();
    drag = { startX: e.clientX, startY: e.clientY, startLeft: r.left, startTop: r.top };
    panel.style.right = 'auto'; panel.style.bottom = 'auto';
    panel.style.left = r.left + 'px'; panel.style.top = r.top + 'px';
    panel.classList.add('drag');
    griff.setPointerCapture?.(e.pointerId);
    addEventListener('pointermove', bewegen);
    addEventListener('pointerup', los);
    addEventListener('pointercancel', los);
    e.preventDefault();
  });
  panel.querySelector('#lssp-close').onclick = () => panel.classList.remove('on');
}

const NAV_SELEKTOREN = [
  '#menu_profile', '#navigation_top',
  '.navbar-nav.navbar-right', 'ul.nav.navbar-nav',
  '#navbar-main .navbar-nav', '#navbar-main'
];
function findeNav() {
  for (const s of NAV_SELEKTOREN) {
    const el = document.querySelector(s);
    if (el) return el;
  }
  return null;
}
function baueKnopf() {
  if (document.getElementById('lssp-nav-btn')) return true;
  const nav = findeNav();
  if (!nav) return false;
  const li = document.createElement('li');
  li.id = 'lssp-nav-li';
  const a = document.createElement('a');
  a.id = 'lssp-nav-btn';
  a.href = '#';
  a.innerHTML = '📋 <b>Planer</b>';
  a.onclick = e => {
    e.preventDefault();
    panel.classList.toggle('on');
    if (panel.classList.contains('on')) {
      if (!S.loaded) { if (!loadFromCache()) loadAll(); }
      render();
    }
  };
  li.appendChild(a);
  const istListe = nav.tagName === 'UL' || nav.tagName === 'NAV' || nav.classList.contains('navbar-nav');
  if (istListe) nav.appendChild(li);
  else {
    const elternLi = nav.closest('li');
    if (elternLi?.parentNode) elternLi.parentNode.insertBefore(li, elternLi.nextSibling);
    else nav.parentNode?.insertBefore(li, nav.nextSibling);
  }
  return true;
}
function warteAufNav() {
  if (baueKnopf()) return;
  const b = new MutationObserver(() => { if (baueKnopf()) b.disconnect(); });
  b.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => b.disconnect(), 15000);
}

/* ══════════════════════════════════════════════════════════════════
   13. Start
   ══════════════════════════════════════════════════════════════════ */

baueFenster();
warteAufNav();
if (loadFromCache()) render();

})();