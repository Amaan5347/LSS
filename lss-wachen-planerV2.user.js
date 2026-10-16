// ==UserScript==
// @name         LSS Wachen-Planer
// @namespace    lss-wachenplaner
// @version      1.0.0
// @description  Wachen-Planung mit Profilen, Erweiterungen, Dashboard und Aktionen
// @author       Du
// @match        https://www.leitstellenspiel.de/*
// @match        https://polizei.leitstellenspiel.de/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
'use strict';

// Läuft nur im Hauptfenster, nicht in Iframes (Lightbox etc.)
if (window.top !== window.self) return;

/* ══════════════════════════════════════════════════════════════════
   1. KONSTANTEN
   ══════════════════════════════════════════════════════════════════ */

const VERSION = '1.0.0';

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
const NICHT_PLANEN = new Set([1, 3, 4, 7, 8, 10]);

const VN = {
  0:'LF 20',1:'LF 10',2:'DLK 23',3:'ELW 1',4:'RW',5:'GW-A',6:'LF 8/6',7:'LF 20/16',
  8:'LF 10/6',9:'LF 16-TS',10:'GW-Öl',11:'GW-L2-Wasser',12:'GW-Messtechnik',13:'SW 1000',
  14:'SW 2000',15:'SW 2000-Tr',16:'SW Kats',17:'TLF 2000',18:'TLF 3000',19:'TLF 8/8',
  20:'TLF 8/18',21:'TLF 16/24-Tr',22:'TLF 16/25',23:'TLF 16/45',24:'TLF 20/40',
  25:'TLF 20/40-SL',26:'TLF 16',27:'GW-Gefahrgut',28:'RTW',29:'NEF',30:'HLF 20',
  31:'RTH',32:'FuStW',33:'GW-Höhenrettung',34:'ELW 2',35:'leBefKw',36:'MTW',37:'TSF-W',
  38:'KTW',39:'GKW',40:'MTW-TZ',41:'MzGW (FGr N)',42:'LKW K 9',43:'BRmG R',44:'Anh DLE',
  45:'MLW 5',46:'WLF',47:'AB-Rüst',48:'AB-Atemschutz',49:'AB-Öl',50:'GruKw',
  51:'FüKW (Polizei)',52:'GefKw',53:'Dekon-P',54:'AB-Dekon-P',55:'KdoW-LNA',
  56:'KdoW-OrgL',57:'FwK',58:'KTW Typ B',59:'ELW 1 (SEG)',60:'GW-San',
  61:'Polizeihubschrauber',62:'AB-Schlauch',63:'GW-Taucher',64:'GW-Wasserrettung',
  65:'LKW 7 Lkr 19 tm',66:'Anh MzB',67:'Anh SchlB',68:'Anh MzAB',69:'Tauchkraftwagen',
  70:'MZB',71:'AB-MZB',72:'WaWe 10',73:'GRTW',74:'NAW',75:'FLF',76:'Rettungstreppe',
  77:'AB-Gefahrgut',78:'AB-Einsatzleitung',79:'SEK - ZF',80:'SEK - MTF',
  81:'MEK - ZF',82:'MEK - MTF',83:'GW-Werkfeuerwehr',84:'ULF mit Löscharm',85:'TM 50',
  86:'Turbolöscher',87:'TLF 4000',88:'KLF',89:'MLF',90:'HLF 10',91:'Rettungshundefahrzeug',
  92:'Anh Hund',93:'MTW-O',94:'DHuFüKW',95:'Polizeimotorrad',96:'Außenlastbehälter',
  97:'ITW',98:'Zivilstreifenwagen',100:'MLW 4',101:'Anh SwPu',102:'Anh 7',
  103:'FuStW (DGL)',104:'GW-L1',105:'GW-L2',106:'MTF-L',107:'LF-L',108:'AB-L',
  109:'MzGW SB',110:'NEA50',111:'NEA50',112:'NEA200',113:'NEA200',114:'GW-Lüfter',
  115:'Anh Lüfter',116:'AB-Lüfter',117:'AB-Tank',118:'Kleintankwagen',119:'AB-Lösch',
  120:'Tankwagen',121:'GTLF',122:'LKW 7 Lbw (FGr E)',123:'LKW 7 Lbw (FGr WP)',
  124:'MTW-OV',125:'MTW-Tr UL',126:'MTF Drohne',127:'GW UAS',128:'ELW Drohne',
  129:'ELW2 Drohne',130:'GW-Bt',131:'Bt-Kombi',132:'FKH',133:'Bt LKW',
  134:'Pferdetransporter kl.',135:'Pferdetransporter gr.',136:'Anh Pferdetransport',
  137:'Zugfzg Pferdetransport',138:'GW-Verpflegung',139:'GW-Küche',140:'MTW-Verpflegung',
  141:'FKH',142:'AB-Küche',143:'Anh Schlauch',144:'FüKW (THW)',145:'FüKomKW',
  146:'Anh FüLa',147:'FmKW',148:'MTW-FGr K',149:'GW-Bergrettung (NEF)',150:'GW-Bergrettung',
  151:'ELW Bergrettung',152:'ATV',153:'Hundestaffel Bergrettung',154:'Schneefahrzeug',
  155:'Anh Höhenrettung Bergr.',156:'PolHubschrauber m. Winde',157:'RTH Winde',
  158:'GW-Höhenrettung Bergr.',159:'Seenotrettungskreuzer',160:'Seenotrettungsboot',
  161:'Hubschrauber Seenotrettung',162:'RW-Schiene',163:'HLF Schiene',164:'AB-Schiene',
  165:'LauKw',166:'PTLF 4000',167:'SLF',168:'Anh Sonderlöschmittel',
  169:'AB-Sonderlöschmittel',170:'AB-Wasser/Schaum',171:'GW TeSi',172:'LKW Technik Notstrom',
  173:'MTW TeSi',174:'Anh TeSi',175:'NEA50',176:'LKW 7 Lbw (FGr Log-V)',
  177:'MTW-FGr Log-V',178:'Anh 12 Lbw Log-V',179:'AB-NEA50',180:'AB-NEA200',
  181:'MzGW (FGr BrB)',182:'Mobilkran',183:'Anh Plattform BrB',184:'FuStW (AP)',
  185:'GW-Tierrettung',186:'Anh Tierrettung',187:'TLF 3000 W',188:'TLF 5000 W',
  189:'GTLF 10000 W',190:'GW-Waldbrand',191:'Anh Waldbrand',192:'AB-Waldbrand'
};

const KURSE = {
  highway_police:"Autobahnpolizei", railway_fire:"Bahnrettung", coastal_rescue:"Seenotretter",
  coastal_helicopter:"Hubschrauberpilot (Seenotrettung)", coastal_helicopter_lift:"Windenoperator",
  emergency_paramedic_water_rescue:"Wasserrettungsausbildung für Notfallsanitäter",
  care_service:"Betreuungsdienst", police_firefighting:"Brandbekämpfung",
  dekon_p:"Dekon-P", police_service_group_leader:"Dienstgruppenleitung",
  fire_drone:"Drohnen-Schulung", seg_drone:"Drohnenoperator",
  mountain_command:"Einsatzleiter Bergrettung", elw2:"ELW 2",
  thw_bridge_construction:"Fachgruppe Brückenbau",
  thw_energy_supply:"Fachgruppe Elektroversorgung",
  thw_rescue_dogs:"Fachgruppe Rettungshundeführer",
  thw_raumen:"Fachgruppe Räumen", heavy_rescue:"Fachgruppe Schwere Bergung",
  water_damage_pump:"Fachgruppe Wasserschaden/Pumpen",
  thw_command:"Fachzug Führung und Kommunikation",
  fire_care_service:"Feuerwehr-Verpflegungseinheit", fwk:"Feuerwehrkran",
  arff:"Flugfeldlöschfahrzeug-Ausbildung", gw_gefahrgut:"GW-Gefahrgut",
  gw_messtechnik:"GW-Messtechnik", gw_taucher:"GW-Taucher",
  gw_wasserrettung:"GW-Wasserrettung", k9:"Hundeführer (Schutzhund)",
  police_fukw:"Hundertschaftsführer (FüKW)", mountain_height_rescue:"Höhenretter",
  gw_hoehenrettung:"Höhenrettung", intensive_care:"Intensivpflege",
  thw_bridge_construction_crane:"Kranführer", criminal_investigation:"Kriminalpolizei",
  police_speaker_operator:"Lautsprecheroperator", lna:"LNA-Ausbildung",
  thw_care_service:"Logistik-Verpflegung", police_mek:"MEK",
  police_motorcycle:"Motorradstaffel", energy_supply:"NEA200 Fortbildung",
  notarzt:"Notarzt-Ausbildung", orgl:"OrgL-Ausbildung",
  polizeihubschrauber:"Polizeihubschrauber", police_horse:"Reiterstaffel",
  seg_rescue_dogs:"Rettungshundeführer", rettungstreppe:"Rettungstreppen-Ausbildung",
  seg_elw:"SEG - Einsatzleitung", seg_gw_san:"SEG - GW-San", police_sek:"SEK",
  disaster_response_technology:"Technik und Sicherheit",
  thw_drone:"Trupp Unbemannte Luftfahrtsysteme",
  care_service_equipment:"Verpflegungshelfer", police_wasserwerfer:"Wasserwerfer",
  wechsellader:"Wechsellader", werkfeuerwehr:"Werkfeuerwehr-Ausbildung",
  wildfire:"Wald- und Vegetationsbrandbekämpfung",
  police_helicopter_lift:"Windenoperator", rescue_helicopter_lift:"Windenoperator",
  police_einsatzleiter:"Zugführer (leBefKw)", thw_zugtrupp:"Zugtrupp"
};
const kursName = k => KURSE[k] || k;

const PB_KURSE = {
  12:[['gw_messtechnik','alle']], 27:[['gw_gefahrgut','alle']], 29:[['notarzt','alle']],
  33:[['gw_hoehenrettung','alle']], 34:[['elw2','alle']], 35:[['police_einsatzleiter','alle']],
  40:[['thw_zugtrupp','alle']], 42:[['thw_raumen','alle']], 45:[['thw_raumen','alle']],
  46:[['wechsellader','alle']], 51:[['police_fukw','alle']], 53:[['dekon_p','min',1]],
  54:[['dekon_p','alle']], 55:[['lna','alle']], 56:[['orgl','alle']], 57:[['fwk','alle']],
  59:[['seg_elw','alle']], 60:[['seg_gw_san','alle']], 61:[['polizeihubschrauber','alle']],
  63:[['gw_taucher','alle']], 64:[['gw_wasserrettung','alle']], 66:[['gw_wasserrettung','alle']],
  67:[['gw_wasserrettung','alle']], 68:[['gw_wasserrettung','alle']], 69:[['gw_taucher','alle']],
  70:[['gw_wasserrettung','alle']], 71:[['gw_wasserrettung','alle']],
  72:[['police_wasserwerfer','alle']], 73:[['notarzt','min',1]], 74:[['notarzt','min',1]],
  75:[['arff','alle']], 76:[['rettungstreppe','alle']], 77:[['gw_gefahrgut','alle']],
  78:[['elw2','alle']], 79:[['police_sek','alle']], 80:[['police_sek','alle']],
  81:[['police_mek','alle']], 82:[['police_mek','alle']], 83:[['werkfeuerwehr','alle']],
  84:[['werkfeuerwehr','alle']], 85:[['werkfeuerwehr','alle']], 86:[['werkfeuerwehr','alle']],
  91:[['seg_rescue_dogs','alle']], 92:[['thw_rescue_dogs','alle']], 94:[['k9','alle']],
  95:[['police_motorcycle','alle']], 96:[['police_firefighting','alle']],
  97:[['intensive_care','min',2],['notarzt','min',1]],
  98:[['criminal_investigation','alle']], 100:[['water_damage_pump','alle']],
  101:[['water_damage_pump','min',1]], 102:[['water_damage_pump','min',1]],
  103:[['police_service_group_leader','min',1]], 109:[['heavy_rescue','alle']],
  112:[['thw_energy_supply','min',1]], 113:[['energy_supply','min',1]],
  125:[['thw_drone','alle']], 126:[['fire_drone','min',4]], 127:[['seg_drone','alle']],
  128:[['fire_drone','alle']], 129:[['fire_drone','alle'],['elw2','alle']],
  130:[['care_service','min',1],['care_service_equipment','min',2]],
  131:[['care_service','alle']],
  133:[['care_service','min',1],['care_service_equipment','min',2]],
  134:[['police_horse','min',2]], 135:[['police_horse','min',2]], 136:[['police_horse','min',2]],
  138:[['fire_care_service','min',1],['care_service_equipment','min',2]],
  139:[['fire_care_service','min',1],['care_service_equipment','min',2]],
  140:[['fire_care_service','alle']], 144:[['thw_command','alle']],
  145:[['thw_command','alle']], 147:[['thw_command','alle']], 148:[['thw_command','alle']],
  149:[['notarzt','min',1]], 151:[['mountain_command','alle']],
  153:[['seg_rescue_dogs','alle']], 155:[['mountain_height_rescue','min',4]],
  156:[['polizeihubschrauber','min',1],['police_helicopter_lift','min',1]],
  157:[['rescue_helicopter_lift','min',1],['notarzt','min',1]],
  158:[['mountain_height_rescue','alle']], 159:[['coastal_rescue','alle']],
  161:[['coastal_helicopter','min',1],['coastal_helicopter_lift','min',1],
       ['emergency_paramedic_water_rescue','min',1]],
  162:[['railway_fire','alle']], 163:[['railway_fire','alle']],
  165:[['police_speaker_operator','alle']], 171:[['disaster_response_technology','alle']],
  172:[['disaster_response_technology','min',1]],
  173:[['disaster_response_technology','min',1]],
  174:[['disaster_response_technology','min',2]],
  175:[['disaster_response_technology','min',2]],
  176:[['thw_care_service','min',1],['care_service_equipment','min',2]],
  177:[['thw_care_service','alle']], 181:[['thw_bridge_construction','alle']],
  182:[['thw_bridge_construction_crane','alle']],
  183:[['thw_bridge_construction','min',6]], 184:[['highway_police','alle']],
  187:[['wildfire','alle']], 188:[['wildfire','alle']], 189:[['wildfire','alle']],
  190:[['wildfire','alle']], 191:[['wildfire','min',1]], 192:[['wildfire','alle']]
};
const kurseFuer = id => PB_KURSE[Number(id)] || [];
const brauchtKurs = id => kurseFuer(id).length > 0;

const PB_MIN = {
  0:1,1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,10:1,11:1,13:1,14:1,15:1,16:1,
  17:1,18:1,19:1,20:1,21:1,22:1,23:1,24:1,25:1,26:1,27:1,28:1,29:1,30:1,
  31:1,32:1,33:1,34:1,35:1,36:1,37:1,38:1,39:1,40:1,41:1,42:1,45:1,46:1,
  50:1,51:1,52:1,53:1,55:1,56:1,57:1,58:1,59:1,60:6,61:1,63:2,64:1,65:1,69:1,
  72:5,73:6,74:3,75:2,76:2,79:3,80:9,81:3,82:9,83:1,84:1,85:1,86:1,87:1,88:1,
  89:1,90:1,91:4,93:4,94:1,95:1,97:3,98:1,100:1,103:1,104:1,105:1,106:1,107:1,
  109:1,114:1,118:1,120:1,121:1,122:1,123:1,124:1,125:4,126:4,127:4,128:4,129:4,
  130:3,131:1,133:3,134:2,135:2,137:1,138:3,139:3,140:6,144:1,145:1,147:1,148:4,
  149:3,150:3,151:1,152:1,153:4,154:1,156:1,157:1,158:4,159:4,160:1,161:3,162:1,
  163:1,165:5,166:1,167:1,171:1,172:2,173:1,176:3,177:5,181:6,182:1,184:2,185:2,
  187:1,188:1,189:1,190:1
};

const PB_MAX = {
  0:9,1:9,2:3,3:3,4:3,5:3,6:9,7:9,8:9,9:9,10:3,11:3,12:3,13:3,14:6,15:3,
  16:3,17:3,18:3,19:3,20:3,21:3,22:6,23:3,24:3,25:3,26:3,27:3,28:2,29:2,
  30:9,31:2,32:2,33:9,34:6,35:3,36:9,37:6,38:2,39:9,40:4,41:9,42:3,45:6,
  46:3,50:9,51:3,52:2,53:6,55:1,56:1,57:2,58:2,59:2,60:6,61:3,63:2,64:6,
  65:2,69:2,72:5,73:6,74:3,75:3,76:2,79:4,80:9,81:4,82:9,83:9,84:3,85:3,
  86:3,87:3,88:6,89:6,90:9,91:5,93:5,94:2,95:1,97:3,98:2,100:7,103:2,
  104:6,105:6,106:6,107:9,109:9,114:2,118:3,120:3,121:3,122:3,123:3,124:7,
  125:4,126:5,127:4,128:5,129:6,130:3,131:9,133:3,134:4,135:2,137:6,
  138:6,139:3,140:6,144:4,145:7,147:7,148:4,149:6,150:6,151:3,152:1,153:5,
  154:1,156:3,157:2,158:4,159:9,160:2,161:4,162:3,163:9,165:5,166:2,167:2,
  171:5,172:6,173:7,176:3,177:5,181:9,182:1,184:2,185:6,187:3,188:3,189:3,190:3
};
const minSitze = id => PB_MIN[id] || 0;
const maxSitze = id => PB_MAX[id] || 0;

const LAYOUTS = {
  0:{basis:'level+1',bonus:{'Großwache':10,'Abrollbehälter-Stellplatz':1,'Anhänger-Stellplatz':1,
     'Drohneneinheit':1,'Verpflegungsdienst':2,'Bahnrettung':1,'Tierrettung':1,
     'Netzersatzanlage 200':2,'Wald- und Vegetationsbrandbekämpfung':4}},
  2:{basis:'level+1',bonus:{'Großwache':10}},
  5:{basis:'level+1',bonus:{}},
  6:{basis:'level+1',bonus:{'Großwache':10,'Diensthundestaffel':1,'Dienstgruppenleitung':1,
     'Motorradstaffel':2,'Autobahnpolizei':2,'Großgewahrsam':1}},
  9:{basis:'fix:1',bonus:{
     '1. Technischer Zug: Fachgruppe Notversorgung/Notinstandsetzung':2,
     '1. Technischer Zug: Zugtrupp':1,'2. Technischer Zug - Bergungsgruppe':1,
     '2. Technischer Zug: Fachgruppe Notversorgung/Notinstandsetzung':2,
     '2. Technischer Zug: Zugtrupp':1,'Fachgruppe Räumen':4,'Fachgruppe Wassergefahren':5,
     'Fachgruppe Ortung':4,'Fachgruppe Wasserschaden/Pumpen':4,'Fachgruppe Schwere Bergung':1,
     'Fachgruppe Elektroversorgung':2,'Ortsverbands-Mannschaftstransportwagen':2,
     'Trupp Unbemannte Luftfahrtsysteme':1,'Fachzug Führung und Kommunikation':5,
     'Fachgruppe Logistik-Verpflegung':3,'Fachgruppe Brückenbau':3}},
  11:{basis:'fix:4',bonus:{'2. Zug der 1. Hundertschaft':4,'3. Zug der 1. Hundertschaft':5,
     'Sonderfahrzeug: Gefangenenkraftwagen':1,'Technischer Zug: Wasserwerfer':4,
     'SEK: 1. Zug':5,'SEK: 2. Zug':5,'MEK: 1. Zug':5,'MEK: 2. Zug':5,
     'Diensthundestaffel':3,'Reiterstaffel':6,'Sonderfahrzeug: Lautsprecherkraftwagen':1}},
  12:{basis:'fix:1',bonus:{'Führung':1,'Sanitätsdienst':4,'Wasserrettung':3,
     'Rettungshundestaffel':2,'SEG Drohne':1,'Betreuungs- und Verpflegungsdienst':10,
     'Technik und Sicherheit':6}},
  17:{basis:'fix:0',bonus:{'SEK: 1. Zug':5,'SEK: 2. Zug':5,'MEK: 1. Zug':5,
     'MEK: 2. Zug':5,'Diensthundestaffel':3}},
  25:{basis:'level+1',bonus:{'Höhenrettung':2,'Rettungshundestaffel':2}},
  28:{basis:'fix:1',bonus:{}}
};

const ZUGFAHRZEUG = {
  43:[42],44:[39,40,41,45],47:[46],48:[46],49:[46],54:[46],62:[46],66:[65],67:[65],
  68:[65],70:[63,64],71:[46],77:[46],78:[46],92:[93],96:[61,156],101:[100,123],
  102:[100,123],108:[46],110:[41],
  111:[90,4,27,53,104,105,6,8,9,15,16,18,21,22,1,83,46],112:[122],
  113:[90,4,27,53,104,105,6,8,9,15,16,18,21,22],
  115:[90,4,27,53,104,105,6,8,9,15,16,18,21,22,83,5],
  116:[46],117:[46],119:[46],136:[134,135,137],141:[138],142:[46],
  143:[90,4,27,53,104,105,6,8,9,15,16,18,21,22,36],146:[145],155:[149,150],
  164:[46],168:[90,4,27,53,104,105,6,8,9,15,16,18,21,22,36],169:[46],170:[46],
  174:[171,173],175:[172],178:[176],179:[46],180:[46],183:[181],
  186:[90,4,27,53,104,105,1,5,6,8,9,15,16,18,21,22,36,37,88,89,185],
  191:[190,104,105,107,106,11],192:[46]
};

const TYP_KONFIG = {
  0:{farbe:'#e8a5a5',icon:'🚒',kurz:'Feuerwehr'},
  2:{farbe:'#f0c9a0',icon:'🚑',kurz:'Rettung'},
  5:{farbe:'#f5d9b3',icon:'🚁',kurz:'RTH'},
  6:{farbe:'#a5bde0',icon:'🚓',kurz:'Polizei'},
  9:{farbe:'#a5c4cc',icon:'⛑',kurz:'THW'},
  11:{farbe:'#a8c9a5',icon:'🛡',kurz:'BePol'},
  12:{farbe:'#c4a5cc',icon:'🩺',kurz:'SEG'},
  13:{farbe:'#a5bde0',icon:'🚁',kurz:'PolHubschr.'},
  15:{farbe:'#a5ccd4',icon:'🚤',kurz:'Wasserrettung'},
  17:{farbe:'#c4a5cc',icon:'🎯',kurz:'PolSondereinh.'},
  21:{farbe:'#b0c9a5',icon:'🐕',kurz:'Rettungshunde'},
  25:{farbe:'#b0c9a5',icon:'🏔',kurz:'Bergrettung'},
  26:{farbe:'#a5ccd4',icon:'⛵',kurz:'Seenotrettung'},
  28:{farbe:'#a5ccd4',icon:'🚁',kurz:'Seenot-Hubschr.'},
  29:{farbe:'#9ab8d8',icon:'🛣',kurz:'Autobahnpolizei'}
};
const typKonfig = t => TYP_KONFIG[Number(t)] || { farbe:'#8b9aa9', icon:'🏢', kurz: GEBAEUDE_NAMEN[t] || `Typ ${t}` };

const vehName = id => VN[id] || `Typ ${id}`;
const btName  = t  => GEBAEUDE_NAMEN[t] || `Typ ${t}`;

function stufenKosten(von, zu) {
  let s = 0;
  for (let i = Math.max(1, von); i < zu; i++) {
    if (i === 1) s += 10000;
    else if (i === 2) s += 50000;
    else s += 100000;
  }
  return s;
}

/* ══════════════════════════════════════════════════════════════════
   2. STORAGE
   ══════════════════════════════════════════════════════════════════ */

const K = {
  PROFILES:  'lssPlaner.profiles',
  ZUORD:     'lssPlaner.zuordnung',
  KUERZEL:   'lssPlaner.kuerzel',
  SETTINGS:  'lssPlaner.settings',
  CACHE:     'lssPlaner.cache',
  LOG:       'lssPlaner.log'
};

const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k)    { try { localStorage.removeItem(k); } catch {} }
};

/* ══════════════════════════════════════════════════════════════════
   3. STATE
   ══════════════════════════════════════════════════════════════════ */

const S = {
  buildings: [], vehicles: [],
  byBuilding: new Map(),
  personalCache: new Map(),
  ausbauCache: new Map(),
  preise: {},
  ausbauPreise: {},
  profiles:  store.get(K.PROFILES, {}),
  zuordnung: store.get(K.ZUORD, {}),
  kuerzel:   store.get(K.KUERZEL, {}),
  settings:  store.get(K.SETTINGS, { sortierung: 'id', bestaetigungen: true }),
  log:       [],
  loaded: false, loading: false, error: null, stamp: null,
  aktiverTab: 'wachen',
  aktiveArt: 'alle',
  aktiveWache: null,
  aktiverDetailTab: 'uebersicht',
  aktiverErwTab: 'katalog',
  aktiverProfilTyp: '0',
  aktiverProfilName: null,
  suche: '',
  dashboardFilter: 'alle',
  erwFilter: 'alle',
  panelPos: null,
  ausbauOffen: new Set(),
  personalOffen: new Set(),
  ausbauLaeuft: new Set(),
  personalLaeuft: new Set(),
  offeneKataloge: new Set(),
  offeneAusbKarten: new Set(),
  offeneGruppen: new Set()
};

/* ══════════════════════════════════════════════════════════════════
   4. QUEUE / API
   ══════════════════════════════════════════════════════════════════ */

const READ_DELAY  = 150;
const WRITE_DELAY = 350;
const TIMEOUT     = 10000;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let chain = Promise.resolve();

function queued(fn, delay) {
  const task = chain.catch(() => {}).then(async () => {
    try { return await fn(); } finally { await sleep(delay); }
  });
  chain = task.catch(() => {});
  return task;
}

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

async function fetchMitTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    return await fetch(url, { credentials: 'same-origin', signal: ctrl.signal, ...opts });
  } finally { clearTimeout(t); }
}

async function retry(fn) {
  try { return await fn(); }
  catch (e) { await sleep(400); return await fn(); }
}

function apiGet(path) {
  return queued(async () => {
    const r = await retry(() => fetchMitTimeout(path));
    if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
    return r.json();
  }, READ_DELAY);
}

function apiText(path) {
  return queued(async () => {
    const r = await retry(() => fetchMitTimeout(path));
    if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
    return r.text();
  }, READ_DELAY);
}

function postForm(path, fields = {}) {
  return queued(async () => {
    const body = new URLSearchParams({ authenticity_token: csrf(), ...fields });
    const r = await retry(() => fetchMitTimeout(path, {
      method: 'POST', body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }));
    if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
    return r.text();
  }, WRITE_DELAY);
}

function getAction(path) {
  return queued(async () => {
    const r = await retry(() => fetchMitTimeout(path));
    if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
    return r.text();
  }, WRITE_DELAY);
}

/* ══════════════════════════════════════════════════════════════════
   5. LOG
   ══════════════════════════════════════════════════════════════════ */

function logAdd(msg, art = 'info') {
  S.log.unshift({ msg, art, ts: Date.now() });
  if (S.log.length > 200) S.log.length = 200;
  if (art === 'err' || art === 'warn') console.warn('[Planer]', msg);
}

/* ══════════════════════════════════════════════════════════════════
   6. DATEN LADEN
   ══════════════════════════════════════════════════════════════════ */

async function loadAll() {
  S.loading = true; S.error = null; render();
  try {
    const rawB = await apiGet('/api/buildings');
    S.buildings = rawB.map(b => ({
      id: b.id, caption: b.caption, building_type: b.building_type,
      level: b.level || 0, personal_count: b.personal_count || 0,
      enabled: b.enabled !== false,
      leitstelle_building_id: b.leitstelle_building_id,
      extensions: (b.extensions || []).map(e => ({
        type_id: e.type_id, caption: e.caption,
        available: e.available, enabled: e.enabled !== false,
        available_at: e.available_at || null
      }))
    }));

    const alle = [];
    let url = '/api/v2/vehicles?limit=1000';
    for (let i = 0; i < 20 && url; i++) {
      const r = await apiGet(url);
      const arr = r.result || r;
      for (const v of arr) {
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
    S.vehicles = alle;
    S.stamp = Date.now();
    S.byBuilding = new Map();
    for (const v of S.vehicles) {
      if (!S.byBuilding.has(v.building_id)) S.byBuilding.set(v.building_id, []);
      S.byBuilding.get(v.building_id).push(v);
    }
    S.loaded = true;

    // Cache aktualisieren — nur die Wachen/Fahrzeuge
    store.set(K.CACHE, {
      v: VERSION, stamp: S.stamp,
      buildings: S.buildings, vehicles: S.vehicles
    });

    // Standardprofile für jeden vorkommenden Wachentyp sicherstellen
    const typen = [...new Set(planbareWachen().map(b => String(b.building_type)))];
    for (const t of typen) {
      if (!S.profiles[t] || !Object.keys(S.profiles[t]).length) {
        S.profiles[t] = { 'Standard': { vehicles: {}, extensions: {} } };
      }
    }
    store.set(K.PROFILES, S.profiles);

    await ladePreise();
    analyseInvalidieren();
    logAdd(`Bestand geladen: ${S.buildings.length} Wachen, ${S.vehicles.length} Fahrzeuge.`);
  } catch (e) {
    S.error = e.message;
    logAdd(`Laden fehlgeschlagen: ${e.message}`, 'err');
  } finally {
    S.loading = false;
    render();
  }
}

async function ladePreise() {
  const typen = [...new Set(S.buildings.map(b => String(b.building_type)))];
  for (const t of typen) {
    if (S.preise[t]) continue;
    const w = S.buildings.find(b => String(b.building_type) === t);
    if (!w) continue;
    try {
      const html = await apiText(`/buildings/${w.id}/vehicles/new`);
      const p = {};
      const re = /\/vehicle\/\d+\/(\d+)\/credits[^>]*>([^<]*Credits)/g;
      let m;
      while ((m = re.exec(html))) {
        const n = (m[2].match(/([\d.']+)\s*Credits/) || [])[1];
        if (n) p[m[1]] = Number(n.replace(/[.']/g, ''));
      }
      if (Object.keys(p).length) S.preise[t] = p;
    } catch (e) {
      logAdd(`Preise für Typ ${t} konnten nicht geladen werden.`, 'warn');
    }
  }
}

async function ladeAusbauten(b, force = false) {
  if (!force && S.ausbauCache.has(b.id)) return S.ausbauCache.get(b.id);
  try {
    const html = await apiText(`/buildings/${b.id}`);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const liste = [];
    for (const tr of doc.querySelectorAll('tr')) {
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
      let rest = null;
      if (timerEl) {
        const t = Number(timerEl.dataset?.time || timerEl.getAttribute('data-time'));
        if (Number.isFinite(t) && t > 0) rest = t;
      }
      const apiE = (b.extensions || []).find(e => e.caption === cap);
      const istGebaut = !!apiE || linkGebaut;
      const imBau = !!(apiE?.available_at) || (rest != null && rest > 0 && !linkGebaut);
      const verfuegbar = !istGebaut && !imBau && (linkKaufbar || extId != null);
      const txt = tr.textContent;
      const pm = txt.match(/([\d.']+)\s*Credits/);
      const preis = pm ? Number(pm[1].replace(/[.']/g, '')) : null;
      liste.push({
        extId, caption: cap, gebaut: istGebaut,
        aktiv: apiE ? apiE.enabled !== false : true,
        imBau, verfuegbar, preis, restSekunden: rest
      });
      if (preis != null) {
        const tk = String(b.building_type);
        S.ausbauPreise[tk] ||= {};
        S.ausbauPreise[tk][cap] = preis;
      }
    }
    S.ausbauCache.set(b.id, liste);
    return liste;
  } catch (e) {
    logAdd(`Ausbauten für ${b.caption} konnten nicht geladen werden.`, 'warn');
    S.ausbauCache.set(b.id, []);
    return [];
  }
}

async function ladePersonal(b, force = false) {
  if (!force && S.personalCache.has(b.id)) return S.personalCache.get(b.id);
  try {
    const fz = (S.byBuilding.get(b.id) || []).filter(v => v.id > 0);
    if (!fz.length) {
      const leer = { total: 0, ohne: 0, mit: 0, auf: 0, proLehrgang: {}, proAuf: {} };
      S.personalCache.set(b.id, leer);
      return leer;
    }
    const html = await apiText(`/vehicles/${fz[0].id}/zuweisung`);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const proLehrgang = {}, proAuf = {};
    let total = 0, mit = 0;
    const rows = doc.querySelectorAll('#personal_table tbody tr[id^="personal_"]');
    for (const tr of rows) {
      total++;
      let quals = [];
      try { quals = JSON.parse(tr.dataset.filterableBy || '[]'); } catch { quals = []; }
      let hat = false;
      for (const q of quals) { proLehrgang[q] = (proLehrgang[q] || 0) + 1; hat = true; }
      if (hat) mit++;
      const zelle = tr.children[2];
      if (zelle) {
        for (const e of zelle.querySelectorAll('[data-education-key]')) {
          const k = e.getAttribute('data-education-key');
          if (k) proAuf[k] = (proAuf[k] || 0) + 1;
        }
      }
    }
    const auf = Object.values(proAuf).reduce((s, n) => s + n, 0);
    const daten = { total, ohne: total - mit, mit, auf, proLehrgang, proAuf };
    S.personalCache.set(b.id, daten);
    return daten;
  } catch (e) {
    logAdd(`Personal für ${b.caption} konnte nicht geladen werden.`, 'warn');
    S.personalCache.set(b.id, null);
    return null;
  }
}

function loadFromCache() {
  const c = store.get(K.CACHE, null);
  if (!c || c.v !== VERSION) return false;
  S.buildings = c.buildings || [];
  S.vehicles = c.vehicles || [];
  S.stamp = c.stamp;
  S.byBuilding = new Map();
  for (const v of S.vehicles) {
    if (!S.byBuilding.has(v.building_id)) S.byBuilding.set(v.building_id, []);
    S.byBuilding.get(v.building_id).push(v);
  }
  S.loaded = true;
  return true;
}

/* ══════════════════════════════════════════════════════════════════
   7. AUSWERTUNG
   ══════════════════════════════════════════════════════════════════ */

const planbareWachen = () => S.buildings.filter(b => !NICHT_PLANEN.has(Number(b.building_type)));

let _analyseCache = new Map();
let _analyseGen = 0;
function analyseInvalidieren() { _analyseGen++; _analyseCache.clear(); }

function profileFuerWache(b) {
  const typ = String(b.building_type);
  const p = S.profiles[typ] || {};
  let namen = Array.isArray(S.zuordnung[b.id]) ? S.zuordnung[b.id].filter(n => p[n]) : [];
  if (!namen.length) namen = p['Standard'] ? ['Standard'] : [];
  const vehicles = {}, extensions = {};
  for (const n of namen) {
    const prof = p[n]; if (!prof) continue;
    for (const [k, v] of Object.entries(prof.vehicles || {})) {
      vehicles[k] = (vehicles[k] || 0) + Number(v);
    }
    for (const [k, v] of Object.entries(prof.extensions || {})) {
      extensions[k] = (extensions[k] || 0) + Number(v);
    }
  }
  return { namen, data: { vehicles, extensions } };
}

function stellplaetzeVon(b) {
  const layout = LAYOUTS[b.building_type] || { basis: 'level+1', bonus: {} };
  let basis;
  if (layout.basis.startsWith('fix:')) basis = Number(layout.basis.slice(4));
  else basis = (b.level || 0) + 1;
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
  const fz = S.byBuilding.get(b.id) || [];
  const ist = {};
  for (const v of fz) {
    const t = String(v.vehicle_type);
    ist[t] = (ist[t] || 0) + 1;
  }
  const fehlend = [], ueberzaehlig = [];
  for (const [t, soll] of Object.entries(ziel)) {
    const sn = Number(soll) || 0;
    const in_ = ist[t] || 0;
    if (in_ < sn) fehlend.push({ typ: t, name: vehName(t), n: sn - in_, soll: sn, ist: in_ });
  }
  for (const [t, in_] of Object.entries(ist)) {
    const sn = Number(ziel[t]) || 0;
    if (in_ > sn) ueberzaehlig.push({ typ: t, name: vehName(t), n: in_ - sn, soll: sn, ist: in_ });
  }
  const gesamt = stellplaetzeVon(b);
  const belegt = fz.length;
  const frei = Math.max(0, gesamt - belegt);
  const hatPlan = Object.keys(ziel).length > 0;

  let personalBedarf = 0;
  for (const [t, soll] of Object.entries(ziel)) personalBedarf += minSitze(t) * (Number(soll) || 0);
  const personal = { bedarf: personalBedarf, ist: b.personal_count || 0, hatPlan };

  let fortschritt = 0, erfuellt = false;
  if (hatPlan) {
    const sollGesamt = Object.values(ziel).reduce((s, x) => s + Number(x), 0);
    const pfehlt = fehlend.reduce((s, x) => s + x.n, 0);
    fortschritt = sollGesamt === 0 ? 100 : Math.max(0, Math.round((1 - pfehlt / sollGesamt) * 100));
    erfuellt = !fehlend.length;
  }

  // Warnungen
  const warnungen = [];
  if (b.enabled === false) warnungen.push({ prio: 'rot', text: 'Wache ist deaktiviert' });
  if (fehlend.length && frei <= 0) warnungen.push({ prio: 'rot', text: `Stellplätze voll (${gesamt})` });
  // Anhänger ungekoppelt
  const anh = fz.filter(v => maxSitze(v.vehicle_type) === 0 && v.id > 0);
  const nichtGekoppelt = anh.filter(v => !v.zugfahrzeug && !v.zufallszug).length;
  if (nichtGekoppelt) warnungen.push({ prio: 'gelb', text: `${nichtGekoppelt} Anhänger nicht gekoppelt` });
  // Nicht voll besetzt
  const unterbesetzt = fz.filter(v => {
    if (v.id < 0) return false;
    if (!brauchtKurs(v.vehicle_type)) return false;
    const max = v.sitze ?? maxSitze(v.vehicle_type);
    return max > 0 && (v.besatzung ?? 0) < max;
  }).length;
  if (unterbesetzt) warnungen.push({ prio: 'gelb', text: `${unterbesetzt} Fahrzeuge nicht voll besetzt` });
  // Personal unter Bedarf
  if (personal.hatPlan && personal.ist < personal.bedarf) {
    warnungen.push({ prio: 'gelb', text: `Personal unter Bedarf (${personal.ist}/${personal.bedarf})` });
  }

  // Kosten
  let fzKosten = 0, fzUnbekannt = 0;
  const preise = S.preise[String(b.building_type)] || {};
  for (const f of fehlend) {
    const p = preise[f.typ];
    if (p == null) fzUnbekannt += f.n;
    else fzKosten += p * f.n;
  }
  let ausbauKosten = 0, ausbauUnbekannt = 0;
  const zExt = profil.data.extensions || {};
  if (Object.keys(zExt).length) {
    const gebaut = {};
    for (const e of (b.extensions || [])) {
      if (e.available_at) continue;
      if (e.available === false) continue;
      gebaut[e.caption] = (gebaut[e.caption] || 0) + 1;
    }
    const preiseExt = S.ausbauPreise[String(b.building_type)] || {};
    for (const [cap, soll] of Object.entries(zExt)) {
      const fehlt = (Number(soll) || 0) - (gebaut[cap] || 0);
      if (fehlt > 0) {
        const p = preiseExt[cap];
        if (p == null) ausbauUnbekannt += fehlt;
        else ausbauKosten += p * fehlt;
      }
    }
  }
  let stufenK = 0;
  const nachKauf = belegt + fehlend.reduce((s, x) => s + x.n, 0);
  const layout = LAYOUTS[b.building_type];
  if (nachKauf > gesamt && layout?.basis === 'level+1') {
    const zl = b.level + (nachKauf - gesamt);
    stufenK = stufenKosten(b.level, zl);
  }
  const kosten = fzKosten + ausbauKosten + stufenK;
  const kostenBekannt = fzUnbekannt === 0 && ausbauUnbekannt === 0;

  return {
    fehlend, ueberzaehlig, ist, ziel, stellplaetze: { belegt, gesamt: Math.max(gesamt, belegt), frei },
    personal, fortschritt, erfuellt, kosten, kostenBekannt, warnungen,
    stufenKosten: stufenK, ausbauKosten, ausbauUnbekannt, fzKosten, fzUnbekannt,
    profilName: profil.namen.join(' + ') || null, hatPlan
  };
}

/* ══════════════════════════════════════════════════════════════════
   8. HILFSFUNKTIONEN
   ══════════════════════════════════════════════════════════════════ */

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const escA = esc;
const since = ts => {
  if (!ts) return '';
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `vor ${h} h` : `vor ${Math.round(h / 24)} Tagen`;
};
const fmtCr = n => n.toLocaleString('de-DE') + ' Cr.';
const hexA = (hex, a) => {
  const h = hex.replace('#','');
  return `rgba(${parseInt(h.substr(0,2),16)},${parseInt(h.substr(2,2),16)},${parseInt(h.substr(4,2),16)},${a})`;
};
const wachenNr = caption => {
  const m = String(caption || '').match(/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
};
const restzeit = s => {
  if (s == null) return '';
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.floor(s/60)} min`;
  if (s < 86400) return `${Math.floor(s/3600)} h`;
  return `${Math.floor(s/86400)} d`;
};
const istAnhaenger = v => maxSitze(v.vehicle_type) === 0;

/* ══════════════════════════════════════════════════════════════════
   9. CSS
   ══════════════════════════════════════════════════════════════════ */

const CSS = `
#lssPlanerRoot * { box-sizing: border-box; }
#lssPlanerRoot {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 12px; line-height: 1.45; color: #e6e6e6;
}
#lssPlanerRoot .lp-panel {
  position: fixed; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: min(85vw, 1200px); height: min(80vh, 800px);
  background: #111111; color: #e6e6e6;
  border: 1px solid #2a2a2a; border-radius: 8px;
  display: none; flex-direction: column;
  z-index: 99999; overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,.7);
  will-change: left, top;
}
#lssPlanerRoot .lp-panel.on { display: flex; }
#lssPlanerRoot .lp-panel.dragging { user-select: none; }

#lssPlanerRoot .lp-header {
  padding: 8px 12px; background: #161616;
  border-bottom: 1px solid #2a2a2a;
  display: flex; align-items: center; gap: 10px;
  cursor: grab; touch-action: none;
}
#lssPlanerRoot .lp-panel.dragging .lp-header { cursor: grabbing; }
#lssPlanerRoot .lp-header b { font-size: 13px; font-weight: 600; }
#lssPlanerRoot .lp-ver { color: #555; font-size: 10px; }
#lssPlanerRoot .lp-header-status { color: #555; font-size: 10px; margin-left: auto; margin-right: 8px; }

#lssPlanerRoot .lp-iconbtn {
  background: none; border: 0; color: #888;
  padding: 4px 10px; border-radius: 4px; cursor: pointer;
  font: 500 14px/1 inherit;
}
#lssPlanerRoot .lp-iconbtn:hover { background: #222; color: #eee; }
#lssPlanerRoot .lp-close { font-size: 22px; padding: 0 10px; line-height: 1; }
#lssPlanerRoot .lp-close:hover { background: #b94a3a; color: #fff; }

#lssPlanerRoot .lp-tabs {
  display: flex; gap: 2px; padding: 4px 10px 0;
  background: #0d0d0d; border-bottom: 1px solid #2a2a2a;
  flex-wrap: wrap;
}
#lssPlanerRoot .lp-tab {
  background: none; border: 0; color: #888;
  padding: 8px 14px; cursor: pointer; font: 500 12px/1 inherit;
  border-bottom: 2px solid transparent; border-radius: 4px 4px 0 0;
}
#lssPlanerRoot .lp-tab:hover { color: #e6e6e6; }
#lssPlanerRoot .lp-tab.on { color: #111; background: #a5bde0; border-bottom-color: #a5bde0; }

#lssPlanerRoot .lp-body { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }

#lssPlanerRoot .lp-subtabs {
  display: flex; gap: 2px; padding: 6px 12px 0;
  background: #131313; border-bottom: 1px solid #2a2a2a;
}
#lssPlanerRoot .lp-subtab {
  background: none; border: 0; color: #888;
  padding: 6px 12px; cursor: pointer; font: 500 11px/1 inherit;
  border-bottom: 2px solid transparent;
}
#lssPlanerRoot .lp-subtab:hover { color: #e6e6e6; }
#lssPlanerRoot .lp-subtab.on { color: #e6e6e6; border-bottom-color: #a5bde0; }

#lssPlanerRoot .lp-art-tabs {
  display: flex; gap: 2px; padding: 6px 12px;
  background: #0d0d0d; border-bottom: 1px solid #2a2a2a;
  flex-wrap: wrap; max-height: 76px; overflow-y: auto;
}
#lssPlanerRoot .lp-art-tab {
  background: transparent; border: 1px solid #222;
  color: #888; cursor: pointer;
  padding: 4px 10px; border-radius: 12px;
  font: 500 10px/1 inherit;
  display: flex; align-items: center; gap: 4px;
}
#lssPlanerRoot .lp-art-tab:hover { color: #e6e6e6; border-color: #444; }
#lssPlanerRoot .lp-art-tab.on { color: #111; }
#lssPlanerRoot .lp-art-tab .cnt { opacity: .7; font-size: 9px; }

#lssPlanerRoot .lp-main {
  flex: 1; display: grid; grid-template-columns: 300px 1fr;
  min-height: 0; overflow: hidden;
}
#lssPlanerRoot .lp-side {
  border-right: 1px solid #2a2a2a; background: #0d0d0d;
  display: flex; flex-direction: column; min-height: 0;
}
#lssPlanerRoot .lp-side-top { padding: 8px 10px; border-bottom: 1px solid #2a2a2a; }
#lssPlanerRoot .lp-input, #lssPlanerRoot select {
  width: 100%; background: #1a1a1a; color: #e6e6e6;
  border: 1px solid #2a2a2a; border-radius: 4px;
  padding: 6px 9px; font: 11px/1.2 inherit; margin-bottom: 6px;
}
#lssPlanerRoot select option { background: #1a1a1a; color: #e6e6e6; }
#lssPlanerRoot .lp-input:focus, #lssPlanerRoot select:focus { outline: 0; border-color: #a5bde0; }

#lssPlanerRoot .lp-list { flex: 1; overflow-y: auto; padding: 4px 0; }
#lssPlanerRoot .lp-list::-webkit-scrollbar,
#lssPlanerRoot .lp-detail::-webkit-scrollbar,
#lssPlanerRoot .lp-logbox::-webkit-scrollbar { width: 6px; }
#lssPlanerRoot .lp-list::-webkit-scrollbar-thumb,
#lssPlanerRoot .lp-detail::-webkit-scrollbar-thumb,
#lssPlanerRoot .lp-logbox::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }

#lssPlanerRoot .lp-grp-head {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; background: #131313; cursor: pointer;
  border-top: 1px solid #1c1c1c;
  font: 600 11px/1 inherit; color: #aaa;
}
#lssPlanerRoot .lp-grp-head:hover { background: #191919; color: #e6e6e6; }
#lssPlanerRoot .lp-grp-head .arr { color: #555; font-size: 10px; }

#lssPlanerRoot .lp-card {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px 7px 16px;
  cursor: pointer; border-left: 3px solid transparent;
  border-bottom: 1px solid #181818;
}
#lssPlanerRoot .lp-card:hover { background: #181818; }
#lssPlanerRoot .lp-card.on { background: #1e1e1e; }
#lssPlanerRoot .lp-card.fertig .lp-card-name::before { content: '✓ '; color: #4fb79b; font-weight: 700; }
#lssPlanerRoot .lp-card-info { flex: 1; min-width: 0; }
#lssPlanerRoot .lp-card-name {
  display: block; font-weight: 500; font-size: 12px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
#lssPlanerRoot .lp-card-meta { display: block; color: #666; font-size: 10px; margin-top: 2px; }
#lssPlanerRoot .lp-card-pct { font: 600 11px/1 monospace; color: #888; }

#lssPlanerRoot .lp-bar { height: 3px; background: #2a2a2a; border-radius: 2px; overflow: hidden; margin-top: 4px; }
#lssPlanerRoot .lp-bar > div { height: 100%; background: currentColor; }

#lssPlanerRoot .lp-detail { flex: 1; overflow-y: auto; background: #111; min-width: 0; }

#lssPlanerRoot .lp-detail-head {
  padding: 14px 18px; border-bottom: 1px solid #2a2a2a;
  border-left: 4px solid transparent;
}
#lssPlanerRoot .lp-detail-head h2 {
  margin: 0 0 4px; font-size: 16px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
}
#lssPlanerRoot .lp-detail-head .sub { color: #888; font-size: 11px; }
#lssPlanerRoot .lp-detail-head .prog { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
#lssPlanerRoot .lp-detail-head .prog .lp-bar { flex: 1; height: 5px; }
#lssPlanerRoot .lp-detail-head .prog .num { font: 600 12px/1 monospace; }

#lssPlanerRoot .lp-sec { padding: 14px 18px; border-bottom: 1px solid #1c1c1c; }
#lssPlanerRoot .lp-sec h3 {
  margin: 0 0 10px; font-size: 11px; font-weight: 600;
  color: #888; text-transform: uppercase; letter-spacing: .06em;
  display: flex; align-items: center; gap: 8px;
}
#lssPlanerRoot .lp-badge {
  background: #222; color: #ccc; padding: 1px 7px;
  border-radius: 8px; font: 500 10px/1 inherit;
  text-transform: none; letter-spacing: 0;
}

#lssPlanerRoot .lp-row {
  display: grid; grid-template-columns: 1fr auto auto auto;
  gap: 10px; align-items: center;
  padding: 5px 0; font-size: 11px;
  border-bottom: 1px solid rgba(42,42,42,.4);
}
#lssPlanerRoot .lp-row:last-child { border-bottom: 0; }
#lssPlanerRoot .lp-row .lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#lssPlanerRoot .lp-row .num { font: 600 11px/1 monospace; }
#lssPlanerRoot .lp-row .num.gut { color: #4fb79b; }
#lssPlanerRoot .lp-row .num.bad { color: #e74c3c; }
#lssPlanerRoot .lp-row .num.warn { color: #e0a33c; }
#lssPlanerRoot .lp-row .num.neu { color: #888; }

#lssPlanerRoot .lp-btn {
  background: #1e1e1e; color: #e6e6e6;
  border: 1px solid #2a2a2a; border-radius: 4px;
  padding: 6px 12px; cursor: pointer;
  font: 600 11px/1 inherit;
  display: inline-flex; align-items: center; gap: 6px;
}
#lssPlanerRoot .lp-btn:hover:not(:disabled) { border-color: #a5bde0; }
#lssPlanerRoot .lp-btn:disabled { opacity: .4; cursor: not-allowed; }
#lssPlanerRoot .lp-btn.primary { background: #a5bde0; color: #111; border-color: #a5bde0; }
#lssPlanerRoot .lp-btn.primary:hover:not(:disabled) { background: #b8cde9; }
#lssPlanerRoot .lp-btn.danger { border-color: #b94a3a; color: #e57373; }
#lssPlanerRoot .lp-btn.mini { padding: 3px 8px; font-size: 10px; }

#lssPlanerRoot .lp-acts { display: flex; flex-wrap: wrap; gap: 6px; }

#lssPlanerRoot .lp-warnbox {
  background: rgba(224,163,60,.08); border-left: 3px solid #e0a33c;
  padding: 8px 12px; margin: 12px 18px 0; border-radius: 3px;
  font-size: 11px;
}
#lssPlanerRoot .lp-warnbox.rot { background: rgba(231,76,60,.08); border-left-color: #e74c3c; }
#lssPlanerRoot .lp-warnbox > div { padding: 2px 0; }

#lssPlanerRoot .lp-empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 100%; color: #666;
}
#lssPlanerRoot .lp-empty .logo { font-size: 64px; margin-bottom: 12px; }
#lssPlanerRoot .lp-empty .title { font-size: 20px; font-weight: 600; color: #aaa; }

#lssPlanerRoot .lp-dash {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: #2a2a2a; border-bottom: 1px solid #2a2a2a;
}
#lssPlanerRoot .lp-dash > div { background: #131313; padding: 14px; text-align: center; }
#lssPlanerRoot .lp-dash .z { display: block; font: 700 20px/1 inherit; }
#lssPlanerRoot .lp-dash .l { display: block; color: #666; font: 10px/1 inherit; margin-top: 4px; letter-spacing: .06em; text-transform: uppercase; }
#lssPlanerRoot .lp-dash > div.klick:hover { background: #191919; cursor: pointer; }

#lssPlanerRoot .lp-kost {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  padding: 10px 18px;
}
#lssPlanerRoot .lp-kost > div {
  background: #131313; border: 1px solid #1c1c1c;
  border-radius: 4px; padding: 8px 10px;
}
#lssPlanerRoot .lp-kost .l { color: #888; font-size: 10px; }
#lssPlanerRoot .lp-kost .z { display: block; font: 600 14px/1.2 monospace; margin-top: 2px; }

#lssPlanerRoot .lp-prof-chips {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 4px 0;
}
#lssPlanerRoot .lp-chip {
  background: #1a1a1a; color: #aaa;
  border: 1px solid #2a2a2a; border-radius: 12px;
  padding: 4px 12px; cursor: pointer;
  font: 600 10px/1 inherit;
}
#lssPlanerRoot .lp-chip:hover { border-color: #444; color: #e6e6e6; }
#lssPlanerRoot .lp-chip.on { background: #a5bde0; color: #111; border-color: #a5bde0; }
#lssPlanerRoot .lp-chip.dashed { border-style: dashed; }

#lssPlanerRoot .lp-ausb {
  background: #131313; border: 1px solid #1c1c1c;
  border-radius: 4px; margin-bottom: 6px; overflow: hidden;
}
#lssPlanerRoot .lp-ausb-head {
  padding: 8px 12px; cursor: pointer;
  display: flex; align-items: center; gap: 10px;
  background: #181818;
}
#lssPlanerRoot .lp-ausb-head:hover { background: #1f1f1f; }
#lssPlanerRoot .lp-ausb-head .name { flex: 1; font-weight: 500; font-size: 11px; }
#lssPlanerRoot .lp-ausb-head .num { color: #a5bde0; font: 700 13px/1 monospace; }
#lssPlanerRoot .lp-ausb-head .arr { color: #555; }
#lssPlanerRoot .lp-ausb-body { padding: 8px 12px; border-top: 1px solid #1c1c1c; }
#lssPlanerRoot .lp-ausb-w {
  padding: 6px 0; border-bottom: 1px solid rgba(42,42,42,.3); font-size: 11px;
}
#lssPlanerRoot .lp-ausb-w:last-child { border-bottom: 0; }
#lssPlanerRoot .lp-ausb-w .wname { font-weight: 500; color: #e6e6e6; }
#lssPlanerRoot .lp-ausb-w .pers { color: #666; font-size: 10px; margin-top: 2px; padding-left: 18px; }

#lssPlanerRoot .lp-dash-filter {
  padding: 8px 12px; background: #131313; border-bottom: 1px solid #2a2a2a;
  display: flex; align-items: center; gap: 10px;
}
#lssPlanerRoot .lp-dash-filter select { margin: 0; width: auto; min-width: 160px; }

#lssPlanerRoot .lp-logbox {
  background: #0a0a0a; border: 1px solid #1c1c1c; border-radius: 4px;
  padding: 8px 10px; font: 11px/1.6 monospace;
  max-height: 320px; overflow-y: auto;
}
#lssPlanerRoot .lp-logbox .entry { padding: 2px 0; }
#lssPlanerRoot .lp-logbox .entry.err { color: #e74c3c; }
#lssPlanerRoot .lp-logbox .entry.warn { color: #e0a33c; }
#lssPlanerRoot .lp-logbox .entry.info { color: #888; }

#lssPlanerRoot .lp-foot {
  padding: 6px 12px; background: #0a0a0a;
  border-top: 1px solid #2a2a2a;
  display: flex; align-items: center; gap: 10px;
  font: 10px/1.4 monospace; color: #555;
}

#lssPlanerRoot .lp-dlg-overlay {
  position: fixed; inset: 0; z-index: 100001;
  background: rgba(0,0,0,.65);
  display: flex; align-items: center; justify-content: center;
}
#lssPlanerRoot .lp-dlg {
  background: #111; color: #e6e6e6;
  border: 1px solid #2a2a2a; border-radius: 6px;
  width: 480px; max-width: 92vw; max-height: 88vh;
  display: flex; flex-direction: column;
  box-shadow: 0 12px 40px rgba(0,0,0,.7);
  font-size: 12px;
}
#lssPlanerRoot .lp-dlg-head {
  padding: 12px 16px; border-bottom: 1px solid #2a2a2a;
  background: #161616; border-radius: 6px 6px 0 0;
  display: flex; align-items: center; gap: 10px;
}
#lssPlanerRoot .lp-dlg-head b { flex: 1; font-size: 13px; }
#lssPlanerRoot .lp-dlg-body { padding: 16px; overflow-y: auto; flex: 1; }
#lssPlanerRoot .lp-dlg-foot {
  padding: 10px 16px; border-top: 1px solid #2a2a2a;
  display: flex; justify-content: flex-end; gap: 8px;
  background: #0d0d0d; border-radius: 0 0 6px 6px;
}
#lssPlanerRoot .lp-dlg-body input, #lssPlanerRoot .lp-dlg-body select {
  background: #1a1a1a; color: #e6e6e6;
  border: 1px solid #2a2a2a; border-radius: 4px;
  padding: 6px 9px; font: 11px/1.2 inherit; width: 100%;
  margin-bottom: 8px;
}
#lssPlanerRoot .lp-dlg-body label > span { display: block; color: #888; font-size: 11px; margin-bottom: 4px; }
#lssPlanerRoot .lp-dlg-table { width: 100%; border-collapse: collapse; font-size: 11px; }
#lssPlanerRoot .lp-dlg-table th {
  text-align: left; color: #888; font-weight: 600;
  padding: 6px; border-bottom: 1px solid #2a2a2a; font-size: 10px;
  text-transform: uppercase; letter-spacing: .05em;
}
#lssPlanerRoot .lp-dlg-table td { padding: 5px 6px; border-bottom: 1px solid rgba(42,42,42,.3); }

#lssPlanerRoot .lp-tip { position: relative; }
#lssPlanerRoot .lp-tip:hover::after {
  content: attr(data-tip);
  position: absolute; bottom: 100%; left: 0;
  background: #0a0a0a; color: #e6e6e6;
  padding: 6px 10px; border-radius: 4px;
  font: 11px/1.4 inherit; white-space: pre; z-index: 100002;
  border: 1px solid #2a2a2a; margin-bottom: 4px; pointer-events: none;
}

#lssPlanerRoot .lp-spread { flex: 1; }

#lssPlanerRoot .lp-menu {
  position: absolute; background: #1a1a1a;
  border: 1px solid #2a2a2a; border-radius: 4px;
  min-width: 180px; z-index: 100003;
  box-shadow: 0 6px 20px rgba(0,0,0,.5);
  padding: 4px;
}
#lssPlanerRoot .lp-menu button {
  display: block; width: 100%; text-align: left;
  background: none; border: 0; color: #e6e6e6;
  padding: 6px 10px; cursor: pointer; font: 11px/1 inherit;
  border-radius: 3px;
}
#lssPlanerRoot .lp-menu button:hover { background: #2a2a2a; }
#lssPlanerRoot .lp-menu button:disabled { opacity: .4; cursor: not-allowed; }
#lssPlanerRoot .lp-menu .sep { height: 1px; background: #2a2a2a; margin: 4px 0; }

#lssPlanerRoot .lp-plan-edit { padding: 16px 20px; }
#lssPlanerRoot .lp-plan-edit h2 { margin: 0 0 6px; font-size: 15px; font-weight: 600; }
#lssPlanerRoot .lp-plan-edit p.hint { color: #888; font-size: 11px; margin: 0 0 14px; }
#lssPlanerRoot .lp-proflist .gp {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; cursor: pointer;
  border-bottom: 1px solid #181818;
}
#lssPlanerRoot .lp-proflist .gp:hover { background: #181818; }
#lssPlanerRoot .lp-proflist .gp.on { background: #1e1e1e; }
#lssPlanerRoot .lp-proflist .pname {
  padding: 6px 12px 6px 28px; cursor: pointer;
  font-size: 11px; color: #aaa; border-bottom: 1px solid #131313;
}
#lssPlanerRoot .lp-proflist .pname:hover { background: #181818; color: #e6e6e6; }
#lssPlanerRoot .lp-proflist .pname.on { color: #a5bde0; font-weight: 600; }

#lssPlanerRoot .lp-aktion-row { display: flex; gap: 6px; align-items: center; padding: 4px 0; font-size: 11px; }
#lssPlanerRoot .lp-aktion-row .lbl { flex: 1; }
#lssPlanerRoot .lp-check-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 11px; }
#lssPlanerRoot .lp-check-row input[type=checkbox] { width: auto; margin: 0; }

#lssPlanerRoot .lp-navbtn {
  display: inline-flex; align-items: center; gap: 6px;
  color: inherit !important; cursor: pointer;
}
`;

/* ══════════════════════════════════════════════════════════════════
   10. DIALOG-SYSTEM
   ══════════════════════════════════════════════════════════════════ */

function dlgOpen(html, opts = {}) {
  const ov = document.createElement('div');
  ov.className = 'lp-dlg-overlay';
  ov.innerHTML = `<div class="lp-dlg" style="width:${opts.width || 480}px">${html}</div>`;
  root.appendChild(ov);
  return ov;
}

function frage(text) {
  return new Promise(resolve => {
    const ov = dlgOpen(`
      <div class="lp-dlg-head"><b>Bestätigen</b></div>
      <div class="lp-dlg-body" style="white-space:pre-wrap">${esc(text)}</div>
      <div class="lp-dlg-foot">
        <button class="lp-btn primary" data-ok>Fortfahren</button>
        <button class="lp-btn" data-ab>Abbrechen</button>
      </div>`);
    ov.querySelector('[data-ok]').onclick = () => { ov.remove(); resolve(true); };
    ov.querySelector('[data-ab]').onclick = () => { ov.remove(); resolve(false); };
  });
}

function zeigeLogDialog(titel, runner) {
  const ov = dlgOpen(`
    <div class="lp-dlg-head"><b>${esc(titel)}</b></div>
    <div class="lp-dlg-body"><div class="lp-logbox" id="runlog"></div></div>
    <div class="lp-dlg-foot">
      <span style="flex:1;color:#888;font-size:10px" id="runstat">Läuft …</span>
      <button class="lp-btn" id="runok" disabled>Fertig</button>
    </div>`, { width: 560 });
  const logEl = ov.querySelector('#runlog');
  const stat = ov.querySelector('#runstat');
  const ok = ov.querySelector('#runok');
  const zeichne = () => { logEl.scrollTop = logEl.scrollHeight; };
  const add = (msg, art = 'info') => {
    const d = document.createElement('div');
    d.className = 'entry ' + art;
    d.textContent = msg;
    logEl.appendChild(d); zeichne();
  };
  runner(add).then(n => {
    stat.textContent = `Fertig: ${n} Aktion(en).`;
    ok.disabled = false;
  }).catch(e => {
    add(`Fehler: ${e.message}`, 'err');
    stat.textContent = 'Fehler.';
    ok.disabled = false;
  });
  ok.onclick = () => { ov.remove(); analyseInvalidieren(); render(); };
}

/* ══════════════════════════════════════════════════════════════════
   11. RENDER — Grundgerüst
   ══════════════════════════════════════════════════════════════════ */

let root, panel, bodyEl, aktivesMenu = null;
let _lastScrollCtx = '';

function closeMenu() {
  if (aktivesMenu) { aktivesMenu.remove(); aktivesMenu = null; }
}

function render() {
  if (!bodyEl) return;
  closeMenu();

  const ctx = [S.aktiverTab, S.aktiveArt, S.aktiveWache, S.aktiverDetailTab,
               S.aktiverErwTab, S.aktiverProfilTyp, S.aktiverProfilName,
               S.suche, S.settings.sortierung, S.dashboardFilter].join('|');
  const detailAlt = bodyEl.querySelector('.lp-detail');
  const listAlt = bodyEl.querySelector('.lp-list');
  const detailScroll = (_lastScrollCtx === ctx) ? (detailAlt?.scrollTop || 0) : 0;
  const listScroll = (_lastScrollCtx === ctx) ? (listAlt?.scrollTop || 0) : 0;

  panel.querySelector('.lp-header-status').textContent = S.stamp ? `Stand ${since(S.stamp)}` : '';

  bodyEl.innerHTML = buildBody();

  bindeEvents();

  const d = bodyEl.querySelector('.lp-detail');
  if (d && detailScroll) d.scrollTop = detailScroll;
  const l = bodyEl.querySelector('.lp-list');
  if (l && listScroll) l.scrollTop = listScroll;
  _lastScrollCtx = ctx;
}

function buildBody() {
  const tabs = [
    { id:'wachen', name:'Wachen' },
    { id:'profiles', name:'Profile' },
    { id:'erweiterungen', name:'Erweiterungen' },
    { id:'dashboard', name:'Dashboard' },
    { id:'einstellungen', name:'Einstellungen' }
  ];
  return `
    <div class="lp-tabs">
      ${tabs.map(t => `<button class="lp-tab${S.aktiverTab===t.id?' on':''}" data-tab="${t.id}">${esc(t.name)}</button>`).join('')}
    </div>
    <div class="lp-body">
      ${buildTabContent()}
    </div>
    <div class="lp-foot">
      <span>${S.loaded ? `${S.buildings.length} Wachen, ${S.vehicles.length} Fahrzeuge` : 'Noch nicht geladen'}</span>
      <span class="lp-spread"></span>
      ${S.loaded ? `<span>Stand: ${esc(since(S.stamp))}</span>` : ''}
    </div>
  `;
}

function buildTabContent() {
  if (!S.loaded && S.aktiverTab !== 'einstellungen' && S.aktiverTab !== 'profiles') {
    if (S.loading) return `<div class="lp-empty"><div class="logo">⏳</div><div class="title">Lade …</div></div>`;
    if (S.error) return `<div class="lp-empty">
      <div class="logo">⚠️</div>
      <div class="title" style="color:#e74c3c;font-size:14px">${esc(S.error)}</div>
      <button class="lp-btn primary" style="margin-top:16px" id="lp-init-load">Bestand laden</button>
    </div>`;
    return `<div class="lp-empty">
      <div class="logo">📋</div>
      <div class="title">LSS-Planer</div>
      <div style="color:#888;font-size:12px;margin-top:8px">Lade deine Wachen und Fahrzeuge aus dem Spiel.</div>
      <button class="lp-btn primary" style="margin-top:16px" id="lp-init-load">Bestand laden</button>
    </div>`;
  }
  switch (S.aktiverTab) {
    case 'wachen':        return buildWachenTab();
    case 'profiles':      return buildProfilesTab();
    case 'erweiterungen': return buildErwTab();
    case 'dashboard':     return buildDashboardTab();
    case 'einstellungen': return buildEinstellungenTab();
  }
  return '';
}

/* ══════════════════════════════════════════════════════════════════
   12. RENDER — Wachen-Tab
   ══════════════════════════════════════════════════════════════════ */

function buildWachenTab() {
  const wachen = planbareWachen();
  const typen = [...new Set(wachen.map(b => String(b.building_type)))]
    .sort((a, b) => btName(a).localeCompare(btName(b), 'de'));

  const artTabs = [
    { id:'alle', icon:'📋', kurz:'Alle', cnt:wachen.length, farbe:'#888' },
    ...typen.map(t => {
      const k = typKonfig(t);
      const n = wachen.filter(b => String(b.building_type) === t).length;
      return { id: t, icon: k.icon, kurz: k.kurz, cnt: n, farbe: k.farbe };
    })
  ];
  const artTabsHtml = artTabs.map(a => {
    const on = S.aktiveArt === a.id;
    return `<button class="lp-art-tab${on?' on':''}" data-art="${escA(a.id)}"
      style="${on ? `background:${a.farbe};border-color:${a.farbe};color:#111` : ''}">
      <span>${a.icon}</span><span>${esc(a.kurz)}</span><span class="cnt">${a.cnt}</span>
    </button>`;
  }).join('');

  const detail = S.aktiveWache
    ? buildWachenDetail(S.buildings.find(b => b.id === S.aktiveWache))
    : `<div class="lp-empty"><div class="logo">📋</div><div class="title">LSS-Planer</div></div>`;

  return `
    <div class="lp-art-tabs">${artTabsHtml}</div>
    <div class="lp-main">
      <div class="lp-side">
        <div class="lp-side-top">
          <input type="text" class="lp-input" id="lp-search" placeholder="Suchen …" value="${escA(S.suche)}">
          <select class="lp-input" id="lp-sort">
            <option value="id"${S.settings.sortierung==='id'?' selected':''}>ID (aufsteigend)</option>
            <option value="name"${S.settings.sortierung==='name'?' selected':''}>Name</option>
            <option value="stufe"${S.settings.sortierung==='stufe'?' selected':''}>Stufe</option>
            <option value="fortschritt"${S.settings.sortierung==='fortschritt'?' selected':''}>Fortschritt</option>
          </select>
        </div>
        <div class="lp-list" id="lp-list">${buildWachenListe(wachen)}</div>
      </div>
      <div class="lp-detail" id="lp-detail">${detail}</div>
    </div>
  `;
}

function buildWachenListe(wachen) {
  let gef = S.aktiveArt === 'alle' ? wachen : wachen.filter(b => String(b.building_type) === S.aktiveArt);
  if (S.suche.trim()) {
    const q = S.suche.trim().toLowerCase();
    gef = gef.filter(b => (b.caption||'').toLowerCase().includes(q));
  }

  const sortFn = (a, b) => {
    const sa = S.settings.sortierung;
    if (sa === 'name') return (a.caption||'').localeCompare(b.caption||'', 'de');
    if (sa === 'stufe') return (b.level||0) - (a.level||0);
    if (sa === 'fortschritt') return analyse(a).fortschritt - analyse(b).fortschritt;
    return (wachenNr(a.caption) ?? a.id) - (wachenNr(b.caption) ?? b.id);
  };

  if (S.aktiveArt === 'alle') {
    const gruppen = new Map();
    for (const b of gef) {
      const t = String(b.building_type);
      if (!gruppen.has(t)) gruppen.set(t, []);
      gruppen.get(t).push(b);
    }
    const sortierteTypen = [...gruppen.keys()].sort((a,b) => btName(a).localeCompare(btName(b),'de'));
    return sortierteTypen.map(t => {
      const list = gruppen.get(t).sort(sortFn);
      const k = typKonfig(t);
      const offen = S.offeneGruppen.has(t);
      return `
        <div class="lp-grp-head" data-grp="${t}">
          <span class="arr">${offen ? '▼' : '▶'}</span>
          <span style="color:${k.farbe}">${k.icon}</span>
          <span>${esc(k.kurz)}</span>
          <span class="lp-spread"></span>
          <span style="color:#555">${list.length}</span>
        </div>
        ${offen ? list.map(b => cardHtml(b)).join('') : ''}
      `;
    }).join('');
  }
  return gef.sort(sortFn).map(b => cardHtml(b)).join('');
}

function cardHtml(b) {
  const a = analyse(b);
  const k = typKonfig(b.building_type);
  const on = S.aktiveWache === b.id;
  let farbe = '#666', meta = 'Kein Ziel';
  if (a.hatPlan) {
    if (a.erfuellt) { farbe = '#4fb79b'; meta = '✓ vollständig'; }
    else if (a.fortschritt >= 50) { farbe = '#e0a33c'; meta = `${a.fehlend.reduce((s,x)=>s+x.n,0)} fehlt`; }
    else { farbe = '#e74c3c'; meta = `${a.fehlend.reduce((s,x)=>s+x.n,0)} fehlt`; }
  }
  const rand = a.erfuellt ? '#4fb79b' : k.farbe;
  return `
    <div class="lp-card${on?' on':''}${a.erfuellt?' fertig':''}" data-wache="${b.id}"
         style="border-left-color:${rand}${on?';background:'+hexA(rand,.12):''}">
      <div class="lp-card-info">
        <span class="lp-card-name">${esc(b.caption)}</span>
        <span class="lp-card-meta">${esc(k.kurz)} · Stufe ${b.level||0} · ${esc(meta)}</span>
        <div class="lp-bar" style="color:${farbe}"><div style="width:${a.fortschritt}%"></div></div>
      </div>
      <span class="lp-card-pct" style="color:${farbe}">${a.hatPlan ? a.fortschritt+'%' : '—'}</span>
    </div>
  `;
}

function buildWachenDetail(b) {
  if (!b) return `<div class="lp-empty"><div class="logo">📋</div><div class="title">LSS-Planer</div></div>`;
  const a = analyse(b);
  const k = typKonfig(b.building_type);
  const farbe = !a.hatPlan ? '#666' : a.erfuellt ? '#4fb79b' : (a.fortschritt>=50 ? '#e0a33c' : '#e74c3c');

  const detailTabs = [
    { id:'uebersicht', name:'Übersicht' },
    { id:'fahrzeuge', name:'Fahrzeuge' },
    { id:'personal',  name:'Personal' },
    { id:'ausbauten', name:'Ausbauten' },
    { id:'aktionen',  name:'Aktionen' }
  ];

  const warnHtml = a.warnungen.length ? `
    <div class="lp-warnbox ${a.warnungen.some(w=>w.prio==='rot')?'rot':''}">
      ${a.warnungen.map(w => `<div style="color:${w.prio==='rot'?'#e57373':'#f0c66e'}">• ${esc(w.text)}</div>`).join('')}
    </div>` : '';

  let content = '';
  switch (S.aktiverDetailTab) {
    case 'uebersicht': content = buildDetailUebersicht(b, a); break;
    case 'fahrzeuge':  content = buildDetailFahrzeuge(b, a); break;
    case 'personal':   content = buildDetailPersonal(b, a); break;
    case 'ausbauten':  content = buildDetailAusbauten(b, a); break;
    case 'aktionen':   content = buildDetailAktionen(b, a); break;
  }

  return `
    <div class="lp-detail-head" style="border-left-color:${a.erfuellt?'#4fb79b':k.farbe}">
      <h2>${k.icon} ${esc(b.caption)}
        ${a.erfuellt ? '<span style="color:#4fb79b;font-size:12px">✓ vollständig</span>' : ''}
        ${b.enabled===false ? '<span style="color:#e74c3c;font-size:11px">(deaktiviert)</span>' : ''}</h2>
      <div class="sub">${esc(k.kurz)} · Stufe ${b.level||0} · ${b.personal_count||0} Personal · Profil: ${esc(a.profilName||'Standard')}</div>
      ${a.hatPlan ? `<div class="prog">
        <span style="color:#888;font-size:10px">Soll:</span>
        <div class="lp-bar" style="color:${farbe}"><div style="width:${a.fortschritt}%"></div></div>
        <span class="num" style="color:${farbe}">${a.fortschritt}%</span>
      </div>` : ''}
    </div>
    ${warnHtml}
    <div class="lp-subtabs" style="padding-left:18px">
      ${detailTabs.map(t => `<button class="lp-subtab${S.aktiverDetailTab===t.id?' on':''}" data-dtab="${t.id}">${esc(t.name)}</button>`).join('')}
    </div>
    <div>${content}</div>
  `;
}

/* ── Detail: Übersicht ── */
function buildDetailUebersicht(b, a) {
  const p = a.personal;
  const pCache = S.personalCache.get(b.id);
  const personalTxt = pCache
    ? `${pCache.total} (${pCache.total - pCache.auf})`
    : `${p.ist}`;
  const s = a.stellplaetze;
  const kosten = a.kosten;
  const zeigKosten = a.hatPlan && kosten > 0;

  return `
    <div class="lp-sec">
      <h3>Stellplätze <span class="lp-badge">${s.belegt} / ${s.gesamt}</span></h3>
      <div class="lp-row">
        <span class="lbl">Belegt / Gesamt</span>
        <span class="num">${s.belegt} / ${s.gesamt}</span>
        <span class="num ${s.frei>0?'gut':(s.belegt>s.gesamt?'bad':'warn')}">${s.frei>0?s.frei+' frei':'—'}</span>
        <span></span>
      </div>
    </div>
    <div class="lp-sec">
      <h3>Personal <span class="lp-badge">${p.ist} ${p.hatPlan?`/ ${p.bedarf}`:''}</span></h3>
      <div class="lp-row">
        <span class="lbl">Verfügbar</span>
        <span class="num">${esc(personalTxt)}</span>
        <span></span>
        <span></span>
      </div>
    </div>
    ${zeigKosten ? `<div class="lp-sec">
      <h3>Kosten bis Soll <span class="lp-badge">${a.kostenBekannt ? '' : 'ca.'} ${fmtCr(kosten)}</span></h3>
      ${a.fzKosten>0 ? `<div class="lp-row"><span class="lbl">Fahrzeuge</span><span class="num warn">${fmtCr(a.fzKosten)}</span><span></span><span></span></div>`:''}
      ${a.ausbauKosten>0 ? `<div class="lp-row"><span class="lbl">Ausbauten</span><span class="num warn">${fmtCr(a.ausbauKosten)}</span><span></span><span></span></div>`:''}
      ${a.stufenKosten>0 ? `<div class="lp-row"><span class="lbl">Stufen</span><span class="num warn">${fmtCr(a.stufenKosten)}</span><span></span><span></span></div>`:''}
    </div>` : ''}
    <div class="lp-sec">
      <h3>Aktionen</h3>
      <div class="lp-acts">
        <button class="lp-btn primary" id="lp-akt-kaufen" ${a.fehlend.length?'':'disabled'}>Fehlende kaufen${a.fehlend.length?` (${a.fehlend.reduce((s,x)=>s+x.n,0)})`:''}</button>
        <button class="lp-btn" id="lp-akt-werben" ${a.personal.hatPlan&&a.personal.ist<a.personal.bedarf?'':'disabled'}>Personal werben</button>
      </div>
    </div>
  `;
}

/* ── Detail: Fahrzeuge ── */
function buildDetailFahrzeuge(b, a) {
  const fz = (S.byBuilding.get(b.id) || []).filter(v => v.id > 0);
  const nichtAnh = fz.filter(v => !istAnhaenger(v));
  const anh = fz.filter(v => istAnhaenger(v));

  const sortByTyp = (x, y) => {
    const t = x.vehicle_type - y.vehicle_type;
    if (t !== 0) return t;
    return (wachenNr(x.caption) ?? x.id) - (wachenNr(y.caption) ?? y.id);
  };

  const sollIst = a.hatPlan ? `
    <div class="lp-sec">
      <h3>Soll / Ist</h3>
      ${Object.entries(a.ziel).sort((x,y) => vehName(x[0]).localeCompare(vehName(y[0]),'de')).map(([t, soll]) => {
        const in_ = a.ist[t] || 0;
        const diff = in_ - soll;
        const cls = diff === 0 ? 'gut' : diff < 0 ? 'bad' : 'neu';
        return `<div class="lp-row">
          <span class="lbl">${esc(vehName(t))}${brauchtKurs(t)?' <span style="color:#a5bde0">🎓</span>':''}</span>
          <span class="num">${in_} / ${soll}</span>
          <span class="num ${cls}">${diff===0?'✓':(diff>0?'+'+diff:diff)}</span>
          <span></span>
        </div>`;
      }).join('') || '<div style="color:#888">Kein Ziel gesetzt.</div>'}
    </div>
  ` : '';

  const zeile = v => {
    const max = v.sitze ?? maxSitze(v.vehicle_type);
    const min = minSitze(v.vehicle_type);
    const bes = v.besatzung ?? 0;
    const kurse = kurseFuer(v.vehicle_type).map(k => `🎓 ${kursName(k[0])}`).join(', ');
    let cls = '';
    if (max > 0) {
      if (bes >= max) cls = 'gut';
      else if (bes >= min) cls = 'warn';
      else cls = 'bad';
    }
    return `<div class="lp-row">
      <span class="lbl">${esc(v.caption)} <span style="color:#666">(${esc(vehName(v.vehicle_type))})</span></span>
      ${kurse ? `<span style="color:#a5bde0;font-size:10px">${esc(kurse)}</span>` : '<span></span>'}
      <span class="num ${cls}">${bes} / ${max||'—'}</span>
      <button class="lp-btn mini lp-vmenu" data-vid="${v.id}">⋯</button>
    </div>`;
  };

  return `
    ${sollIst}
    <div class="lp-sec">
      <h3>Fahrzeuge <span class="lp-badge">${nichtAnh.length}</span></h3>
      ${nichtAnh.length ? nichtAnh.sort(sortByTyp).map(zeile).join('') : '<div style="color:#888">Keine Fahrzeuge.</div>'}
    </div>
    <div class="lp-sec">
      <h3>Anhänger <span class="lp-badge">${anh.length}</span></h3>
      ${anh.length ? anh.sort(sortByTyp).map(v => {
        const zug = v.zugfahrzeug ? fz.find(x => String(x.id) === String(v.zugfahrzeug)) : null;
        const zugTxt = zug ? zug.caption : (v.zufallszug ? 'zufällig' : 'nicht gekoppelt');
        const cls = zug ? 'gut' : (v.zufallszug ? 'warn' : 'bad');
        return `<div class="lp-row">
          <span class="lbl">${esc(v.caption)} <span style="color:#666">(${esc(vehName(v.vehicle_type))})</span></span>
          <span class="num ${cls}" style="font-weight:400">${esc(zugTxt)}</span>
          <span></span>
          <button class="lp-btn mini lp-vmenu" data-vid="${v.id}">⋯</button>
        </div>`;
      }).join('') : '<div style="color:#888">Keine Anhänger.</div>'}
    </div>
  `;
}

/* ── Detail: Personal ── */
function buildDetailPersonal(b, a) {
  if (!S.personalOffen.has(b.id)) {
    if (!S.personalLaeuft.has(b.id)) {
      S.personalOffen.add(b.id);
      setTimeout(() => { ladePersonal(b, true).then(() => render()); }, 50);
    }
    return `<div class="lp-sec"><div style="color:#888">Lade Personal …</div></div>`;
  }
  const p = S.personalCache.get(b.id);
  if (!p) return `<div class="lp-sec"><div style="color:#888">Lade Personal …</div></div>`;
  const aufEntries = Object.entries(p.proAuf).sort((x,y)=>y[1]-x[1]);
  const lehrEntries = Object.entries(p.proLehrgang).sort((x,y)=>y[1]-x[1]);

  return `
    <div class="lp-sec">
      <h3>Personal <span class="lp-badge">${p.total} (${p.total - p.auf})</span>
        <button class="lp-btn mini" style="margin-left:auto" id="lp-pers-reload">↻</button>
      </h3>
      ${aufEntries.length ? `
        <div style="color:#888;font-size:10px;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.05em">Aktive Ausbildungen</div>
        ${aufEntries.map(([k, n]) => `<div class="lp-row"><span class="lbl">🎓 ${esc(kursName(k))}</span><span class="num">${n}</span><span></span><span></span></div>`).join('')}
      ` : ''}
      ${lehrEntries.length ? `
        <div style="color:#888;font-size:10px;margin:12px 0 4px;text-transform:uppercase;letter-spacing:.05em">Abgeschlossene Lehrgänge</div>
        ${lehrEntries.map(([k, n]) => `<div class="lp-row"><span class="lbl">🎓 ${esc(kursName(k))}</span><span class="num">${n}</span><span></span><span></span></div>`).join('')}
      ` : ''}
      <div class="lp-row" style="border-top:1px solid #1c1c1c;margin-top:8px;padding-top:8px">
        <span class="lbl">Ohne Ausbildung</span>
        <span class="num neu">${p.ohne}</span>
        <span></span><span></span>
      </div>
    </div>
  `;
}

/* ── Detail: Ausbauten ── */
function buildDetailAusbauten(b, a) {
  if (!S.ausbauOffen.has(b.id)) {
    if (!S.ausbauLaeuft.has(b.id)) {
      S.ausbauOffen.add(b.id);
      setTimeout(() => { ladeAusbauten(b, true).then(() => render()); }, 50);
    }
    return `<div class="lp-sec"><div style="color:#888">Lade Ausbauten …</div></div>`;
  }
  const list = S.ausbauCache.get(b.id);
  if (!list) return `<div class="lp-sec"><div style="color:#888">Lade Ausbauten …</div></div>`;

  const gebaut = list.filter(e => e.gebaut);
  const imBau = list.filter(e => e.imBau);
  const verf = list.filter(e => e.verfuegbar);

  return `
    <div class="lp-sec">
      <h3>Ausbauten <span class="lp-badge">${gebaut.length} gebaut${imBau.length?`, ${imBau.length} im Bau`:''}</span>
        <button class="lp-btn mini" style="margin-left:auto" id="lp-ausb-reload">↻</button>
      </h3>
      ${gebaut.map(e => `<div class="lp-row">
        <span class="lbl">${esc(e.caption)}</span>
        <span class="num ${e.aktiv?'gut':'warn'}">${e.aktiv?'aktiv':'inaktiv'}</span>
        <span></span>
        <button class="lp-btn mini lp-ausb-toggle" data-ext="${e.extId}" data-soll="${e.aktiv?'0':'1'}" data-cap="${escA(e.caption)}">${e.aktiv?'aus':'an'}</button>
      </div>`).join('') || '<div style="color:#888">Keine Ausbauten gebaut.</div>'}
      ${imBau.length ? `
        <div style="color:#888;font-size:10px;margin:12px 0 4px;text-transform:uppercase;letter-spacing:.05em">Im Bau</div>
        ${imBau.map(e => `<div class="lp-row"><span class="lbl">${esc(e.caption)}</span><span class="num warn">${e.restSekunden?restzeit(e.restSekunden):'im Bau'}</span><span></span><span></span></div>`).join('')}
      ` : ''}
      ${verf.length ? `
        <div style="color:#888;font-size:10px;margin:12px 0 4px;text-transform:uppercase;letter-spacing:.05em">Verfügbar</div>
        ${verf.map(e => `<div class="lp-row">
          <span class="lbl">${esc(e.caption)}</span>
          <span class="num neu">${e.preis!=null?fmtCr(e.preis):'—'}</span>
          <span></span>
          <button class="lp-btn mini primary lp-ausb-bauen" data-ext="${e.extId}" data-cap="${escA(e.caption)}" data-preis="${e.preis||0}">bauen</button>
        </div>`).join('')}
      ` : ''}
    </div>
  `;
}

/* ── Detail: Aktionen ── */
function buildDetailAktionen(b, a) {
  const p = a.personal;
  return `
    <div class="lp-sec">
      <h3>Aktionen</h3>
      <div class="lp-acts">
        <button class="lp-btn primary" id="lp-akt-kaufen2" ${a.fehlend.length?'':'disabled'}>Fehlende kaufen${a.fehlend.length?` (${a.fehlend.reduce((s,x)=>s+x.n,0)})`:''}</button>
        <button class="lp-btn" id="lp-akt-werben2" ${p.hatPlan&&p.ist<p.bedarf?'':'disabled'}>Personal werben</button>
        <button class="lp-btn" id="lp-akt-umbenennen">Wache umbenennen</button>
        <button class="lp-btn" id="lp-akt-nummerieren">Fahrzeuge nummerieren</button>
        <button class="lp-btn ${b.enabled?'danger':'primary'}" id="lp-akt-toggle">
          ${b.enabled?'Wache deaktivieren':'Wache aktivieren'}
        </button>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════════════
   13. RENDER — Profile-Tab
   ══════════════════════════════════════════════════════════════════ */

function buildProfilesTab() {
  const wachen = planbareWachen();
  const typen = [...new Set(wachen.map(b => String(b.building_type)))]
    .sort((a, b) => btName(a).localeCompare(btName(b), 'de'));

  if (!typen.length) return `<div class="lp-empty"><div class="logo">🎨</div><div class="title">Keine Wachen vorhanden</div></div>`;
  if (!S.aktiverProfilTyp || !typen.includes(S.aktiverProfilTyp)) S.aktiverProfilTyp = typen[0];

  const profile = S.profiles[S.aktiverProfilTyp] || {};
  const pnames = Object.keys(profile);
  if (!S.aktiverProfilName || !profile[S.aktiverProfilName]) S.aktiverProfilName = pnames[0] || null;

  const listHtml = typen.map(t => {
    const k = typKonfig(t);
    const on = t === S.aktiverProfilTyp;
    const offen = true;
    return `
      <div class="gp${on?' on':''}" data-ptyp="${t}">
        <span style="color:${k.farbe}">${k.icon}</span>
        <span style="flex:1">${esc(k.kurz)}</span>
        <span style="color:#555;font-size:10px">${Object.keys(S.profiles[t]||{}).length}</span>
      </div>
      ${offen ? Object.keys(S.profiles[t]||{}).map(p => `
        <div class="pname${t===S.aktiverProfilTyp&&p===S.aktiverProfilName?' on':''}" data-ptyp="${t}" data-pname="${escA(p)}">
          ${esc(p)}
        </div>
      `).join('') : ''}
    `;
  }).join('');

  return `
    <div class="lp-main">
      <div class="lp-side">
        <div class="lp-side-top">
          <div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Profile</div>
        </div>
        <div class="lp-list lp-proflist">${listHtml}</div>
      </div>
      <div class="lp-detail">${buildProfilEditor()}</div>
    </div>
  `;
}

function buildProfilEditor() {
  const t = S.aktiverProfilTyp;
  const p = S.profiles[t]?.[S.aktiverProfilName];
  if (!p) return `<div class="lp-empty"><div class="logo">🎨</div><div class="title">Kein Profil ausgewählt</div></div>`;

  const k = typKonfig(t);
  const wachenTyp = planbareWachen().filter(b => String(b.building_type) === t);

  // Fahrzeugtypen: alle, die auf Wachen dieses Typs vorkommen + bisherige
  const typenSet = new Set(Object.keys(p.vehicles || {}));
  for (const b of wachenTyp) for (const v of (S.byBuilding.get(b.id) || [])) typenSet.add(String(v.vehicle_type));
  // bekannte Typen aus VN, die zu diesem Typ gehören wären schwer — nehmen wir alle
  // stattdessen: alle Typen, die im Account vorkommen
  for (const v of S.vehicles) typenSet.add(String(v.vehicle_type));

  const ziel = p.vehicles || {};
  const imZiel = Object.keys(ziel).filter(x => Number(ziel[x]) > 0)
    .sort((x,y) => vehName(x).localeCompare(vehName(y), 'de'));
  const weitere = [...typenSet].filter(x => !(x in ziel))
    .sort((x,y) => vehName(x).localeCompare(vehName(y), 'de'));

  // Ausbauten: alle, die auf Wachen des Typs vorkommen
  const ausbSet = new Set(Object.keys(p.extensions || {}));
  for (const b of wachenTyp) {
    for (const e of (b.extensions || [])) {
      if (e.available_at) continue;
      if (e.available === false) continue;
      ausbSet.add(e.caption);
    }
  }
  const zExt = p.extensions || {};
  const imZExt = Object.keys(zExt).sort();
  const weiA = [...ausbSet].filter(x => !(x in zExt)).sort();

  return `
    <div class="lp-plan-edit">
      <h2>${k.icon} ${esc(S.aktiverProfilName)}</h2>
      <p class="hint">
        Fahrzeuge und Ausbauten, die zu diesem Profil gehören.
        ${S.aktiverProfilName !== 'Standard' ? '' : 'Das Standard-Profil ist jeder Wache automatisch zugewiesen, wenn keine anderen Profile gewählt sind.'}
      </p>

      <div class="lp-sec" style="padding:0">
        <h3>Fahrzeuge</h3>
        ${imZiel.map(fid => {
          const n = ziel[fid] || 0;
          return `<div class="lp-row">
            <span class="lbl">${esc(vehName(fid))}${brauchtKurs(fid)?' <span style="color:#a5bde0">🎓</span>':''}</span>
            <span style="display:flex;gap:4px;align-items:center">
              <button class="lp-btn mini lp-profil-fz-minus" data-vid="${fid}">−</button>
              <span class="num" style="min-width:24px;text-align:center">${n}</span>
              <button class="lp-btn mini lp-profil-fz-plus" data-vid="${fid}">+</button>
            </span>
            <span></span>
            <button class="lp-btn mini lp-profil-fz-rm" data-vid="${fid}">×</button>
          </div>`;
        }).join('') || '<div style="color:#888;font-size:11px">Noch keine Fahrzeuge.</div>'}
        ${weitere.length ? `
          <select class="lp-input lp-profil-fz-add" style="margin-top:8px">
            <option value="">Fahrzeugtyp hinzufügen …</option>
            ${weitere.slice(0,200).map(fid => `<option value="${fid}">${esc(vehName(fid))}${brauchtKurs(fid)?' (🎓)':''}</option>`).join('')}
          </select>
        ` : ''}
      </div>

      <div class="lp-sec" style="padding:0;margin-top:16px">
        <h3>Ausbauten</h3>
        ${imZExt.map(cap => {
          const n = zExt[cap] || 0;
          return `<div class="lp-row">
            <span class="lbl">${esc(cap)}</span>
            <span style="display:flex;gap:4px;align-items:center">
              <button class="lp-btn mini lp-profil-ax-minus" data-cap="${escA(cap)}">−</button>
              <span class="num" style="min-width:24px;text-align:center">${n}</span>
              <button class="lp-btn mini lp-profil-ax-plus" data-cap="${escA(cap)}">+</button>
            </span>
            <span></span>
            <button class="lp-btn mini lp-profil-ax-rm" data-cap="${escA(cap)}">×</button>
          </div>`;
        }).join('') || '<div style="color:#888;font-size:11px">Noch keine Ausbauten.</div>'}
        ${weiA.length ? `
          <select class="lp-input lp-profil-ax-add" style="margin-top:8px">
            <option value="">Ausbau hinzufügen …</option>
            ${weiA.map(cap => `<option value="${escA(cap)}">${esc(cap)}</option>`).join('')}
          </select>
        ` : ''}
      </div>

      <div class="lp-sec" style="padding:0;margin-top:16px">
        <h3>Wachen mit diesem Profil</h3>
        <div style="max-height:280px;overflow-y:auto">
          ${wachenTyp.map(b => {
            const zu = Array.isArray(S.zuordnung[b.id]) ? S.zuordnung[b.id] : [];
            const aktiv = zu.includes(S.aktiverProfilName) ||
              (S.aktiverProfilName === 'Standard' && (zu.length === 0 || zu.includes('Standard')));
            return `<div class="lp-check-row">
              <input type="checkbox" class="lp-zuord" data-bid="${b.id}" data-pname="${escA(S.aktiverProfilName)}" ${aktiv?'checked':''}>
              <span>${esc(b.caption)}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="lp-sec" style="padding:0;margin-top:16px">
        <button class="lp-btn" id="lp-profil-neu">+ Neues Profil</button>
        ${S.aktiverProfilName !== 'Standard' ? `
          <button class="lp-btn" id="lp-profil-umb">Umbenennen</button>
          <button class="lp-btn danger" id="lp-profil-del">Löschen</button>
        ` : ''}
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════════════
   14. RENDER — Erweiterungen
   ══════════════════════════════════════════════════════════════════ */

function buildErwTab() {
  const subtabs = [
    { id:'katalog', name:'Ausbau-Katalog' },
    { id:'ausbildung', name:'Ausbildung' },
    { id:'diagnose', name:'Diagnose' }
  ];
  return `
    <div class="lp-subtabs" style="padding:6px 12px 0">
      ${subtabs.map(t => `<button class="lp-subtab${S.aktiverErwTab===t.id?' on':''}" data-etab="${t.id}">${esc(t.name)}</button>`).join('')}
    </div>
    <div class="lp-dash-filter">
      <span style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Filter</span>
      <select id="lp-erw-filter">
        <option value="alle"${S.erwFilter==='alle'?' selected':''}>Alle Wachentypen</option>
        ${[...new Set(planbareWachen().map(b=>String(b.building_type)))].sort((a,b)=>btName(a).localeCompare(btName(b),'de')).map(t => {
          const k = typKonfig(t);
          return `<option value="${t}"${S.erwFilter===t?' selected':''}>${esc(k.kurz)}</option>`;
        }).join('')}
      </select>
    </div>
    <div style="flex:1;overflow-y:auto" class="lp-detail">
      ${S.aktiverErwTab === 'katalog' ? buildKatalog() :
        S.aktiverErwTab === 'ausbildung' ? buildAusbildung() : buildDiagnose()}
    </div>
  `;
}

function buildKatalog() {
  const wachen = planbareWachen().filter(b =>
    S.erwFilter === 'alle' || String(b.building_type) === S.erwFilter);
  const map = new Map();
  for (const b of wachen) {
    for (const e of (b.extensions || [])) {
      if (e.available_at) continue;
      if (e.available === false) continue;
      const key = `${e.caption}|${b.building_type}`;
      if (!map.has(key)) map.set(key, { cap: e.caption, btyp: b.building_type, wachen: [] });
      map.get(key).wachen.push(b);
    }
  }
  const sortiert = [...map.values()].sort((x,y) =>
    y.wachen.length - x.wachen.length || x.cap.localeCompare(y.cap, 'de'));

  if (!sortiert.length) return `<div class="lp-empty"><div class="logo">🏗️</div><div class="title">Keine Ausbauten gefunden</div></div>`;

  return `<div style="padding:16px 20px">
    <p style="color:#888;font-size:11px;margin:0 0 12px">${sortiert.length} Kombinationen.</p>
    ${sortiert.map(({ cap, btyp, wachen: list }) => {
      const key = `${cap}|${btyp}`;
      const offen = S.offeneKataloge.has(key);
      const k = typKonfig(btyp);
      return `<div class="lp-ausb">
        <div class="lp-ausb-head lp-kat-head" data-key="${escA(key)}">
          <span style="color:${k.farbe}">${k.icon}</span>
          <span class="name">${esc(cap)}</span>
          <span class="num">${list.length}</span>
          <span class="arr">${offen?'▼':'▶'}</span>
        </div>
        ${offen ? `<div class="lp-ausb-body">
          ${list.map(b => `<div class="lp-ausb-w"><span class="wname">${esc(b.caption)}</span></div>`).join('')}
        </div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

function buildAusbildung() {
  const wachen = planbareWachen().filter(b =>
    S.erwFilter === 'alle' || String(b.building_type) === S.erwFilter);
  const map = new Map();
  for (const b of wachen) {
    const p = S.personalCache.get(b.id);
    if (!p) continue;
    for (const [kurs, n] of Object.entries(p.proAuf)) {
      if (!map.has(kurs)) map.set(kurs, { total: 0, wachen: [] });
      map.get(kurs).total += n;
      map.get(kurs).wachen.push({ b, n });
    }
  }
  if (!map.size) {
    const nich = wachen.filter(b => !S.personalCache.has(b.id));
    return `<div style="padding:16px 20px">
      <p style="color:#888;font-size:11px">Noch keine Ausbildungsdaten geladen.</p>
      ${nich.length ? `<button class="lp-btn primary" id="lp-ausb-laden">${nich.length} Wachen laden</button>` : ''}
    </div>`;
  }
  const sortiert = [...map.entries()].sort((x,y) => y[1].total - x[1].total);
  return `<div style="padding:16px 20px">
    <p style="color:#888;font-size:11px;margin:0 0 12px">${sortiert.length} Lehrgänge.</p>
    ${sortiert.map(([kurs, d]) => {
      const offen = S.offeneAusbKarten.has(kurs);
      return `<div class="lp-ausb">
        <div class="lp-ausb-head lp-ausb-k-head" data-kurs="${escA(kurs)}">
          <span class="name">🎓 ${esc(kursName(kurs))}</span>
          <span class="num">${d.total}</span>
          <span class="arr">${offen?'▼':'▶'}</span>
        </div>
        ${offen ? `<div class="lp-ausb-body">
          ${d.wachen.sort((x,y) => y.n - x.n).map(({b,n}) => {
            const k = typKonfig(b.building_type);
            return `<div class="lp-ausb-w">
              <div class="wname"><span style="color:${k.farbe}">${k.icon}</span> ${esc(b.caption)} <span style="color:#666">(${n})</span></div>
            </div>`;
          }).join('')}
        </div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

function buildDiagnose() {
  const wachen = planbareWachen().filter(b =>
    S.erwFilter === 'alle' || String(b.building_type) === S.erwFilter);
  const gruppen = new Map();
  for (const b of wachen) {
    const fz = (S.byBuilding.get(b.id) || []).filter(v => v.id > 0);
    for (const v of fz) {
      if (!brauchtKurs(v.vehicle_type)) continue;
      const max = v.sitze ?? maxSitze(v.vehicle_type);
      if (max === 0) continue;
      if ((v.besatzung ?? 0) >= max) continue;
      const t = String(b.building_type);
      if (!gruppen.has(t)) gruppen.set(t, []);
      gruppen.get(t).push({ b, v, max });
    }
  }
  if (!gruppen.size) return `<div class="lp-empty"><div class="logo">✓</div><div class="title" style="color:#4fb79b">Alle Fahrzeuge mit Lehrgangspflicht sind voll besetzt.</div></div>`;

  const total = [...gruppen.values()].reduce((s,g)=>s+g.length,0);
  return `<div style="padding:16px 20px">
    <p style="color:#888;font-size:11px;margin:0 0 12px">${total} Fahrzeuge auf ${gruppen.size} Wachentypen.</p>
    ${[...gruppen.keys()].sort((a,b)=>btName(a).localeCompare(btName(b),'de')).map(t => {
      const k = typKonfig(t);
      const list = gruppen.get(t);
      return `<div class="lp-ausb">
        <div class="lp-ausb-head">
          <span style="color:${k.farbe}">${k.icon}</span>
          <span class="name">${esc(k.kurz)}</span>
          <span class="num" style="color:#e0a33c">${list.length}</span>
        </div>
        <div class="lp-ausb-body">
          ${list.map(({b, v, max}) => {
            const kurse = kurseFuer(v.vehicle_type).map(kk => `🎓 ${kursName(kk[0])}`).join(', ');
            const bes = v.besatzung ?? 0;
            return `<div class="lp-row">
              <span class="lbl">${esc(v.caption)} <span style="color:#666">(${esc(vehName(v.vehicle_type))})</span></span>
              <span style="color:#a5bde0;font-size:10px">${esc(kurse)}</span>
              <span class="num warn">${bes} / ${max}</span>
              <button class="lp-btn mini lp-diag-open" data-wache="${b.id}">→</button>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

/* ══════════════════════════════════════════════════════════════════
   15. RENDER — Dashboard
   ══════════════════════════════════════════════════════════════════ */

function buildDashboardTab() {
  const wachen = planbareWachen().filter(b =>
    S.dashboardFilter === 'alle' || String(b.building_type) === S.dashboardFilter);
  let fertig = 0, offen = 0, fehlt = 0;
  let kFz = 0, kAx = 0, kSt = 0, unbek = false;
  let pIst = 0, pBedarf = 0, pAuf = 0, pTotal = 0;
  for (const b of wachen) {
    const a = analyse(b);
    if (a.erfuellt) fertig++; else offen++;
    fehlt += a.fehlend.reduce((s,x)=>s+x.n,0);
    kFz += a.fzKosten; kAx += a.ausbauKosten; kSt += a.stufenKosten;
    if (!a.kostenBekannt) unbek = true;
    pIst += b.personal_count;
    pBedarf += a.personal.bedarf;
    const pc = S.personalCache.get(b.id);
    if (pc) { pTotal += pc.total; pAuf += pc.auf; }
  }

  return `
    <div class="lp-dash-filter">
      <span style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Filter</span>
      <select id="lp-dash-filter">
        <option value="alle"${S.dashboardFilter==='alle'?' selected':''}>Alle Wachentypen</option>
        ${[...new Set(planbareWachen().map(b=>String(b.building_type)))].sort((a,b)=>btName(a).localeCompare(btName(b),'de')).map(t => {
          const k = typKonfig(t);
          return `<option value="${t}"${S.dashboardFilter===t?' selected':''}>${esc(k.kurz)}</option>`;
        }).join('')}
      </select>
    </div>
    <div style="flex:1;overflow-y:auto" class="lp-detail">
      <div class="lp-dash">
        <div><span class="z" style="color:#e74c3c">${fehlt}</span><span class="l">Fahrzeuge fehlen</span></div>
        <div><span class="z" style="color:#4fb79b">${fertig}</span><span class="l">Fertig</span></div>
        <div><span class="z" style="color:#e0a33c">${offen}</span><span class="l">Offen</span></div>
      </div>
      <div class="lp-sec">
        <h3>Kosten bis Soll ${unbek?'<span class="lp-badge">unvollständig</span>':''}</h3>
        <div class="lp-kost">
          <div><span class="l">Fahrzeuge</span><span class="z" style="color:#e0a33c">${fmtCr(kFz)}</span></div>
          <div><span class="l">Ausbauten</span><span class="z" style="color:#e0a33c">${fmtCr(kAx)}</span></div>
          <div><span class="l">Stufen</span><span class="z" style="color:#e0a33c">${fmtCr(kSt)}</span></div>
          <div><span class="l">Gesamt</span><span class="z" style="color:#e0a33c">${fmtCr(kFz+kAx+kSt)}</span></div>
        </div>
      </div>
      <div class="lp-sec">
        <h3>Personal gesamt</h3>
        <div class="lp-dash">
          <div><span class="z">${pIst}</span><span class="l">Vorhanden</span></div>
          <div><span class="z" style="color:#e0a33c">${pBedarf}</span><span class="l">Bedarf (Soll)</span></div>
          <div><span class="z" style="color:#a5bde0">${pTotal ? (pTotal - pAuf) : '—'}</span><span class="l">Verfügbar</span></div>
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════════════
   16. RENDER — Einstellungen
   ══════════════════════════════════════════════════════════════════ */

function buildEinstellungenTab() {
  const sortierOptions = [
    { v:'id', n:'ID' },
    { v:'name', n:'Name' },
    { v:'stufe', n:'Stufe' },
    { v:'fortschritt', n:'Fortschritt' }
  ];
  return `
    <div style="padding:16px 20px;flex:1;overflow-y:auto" class="lp-detail">
      <div class="lp-sec" style="padding:0 0 14px">
        <h3>Allgemein</h3>
        <label style="display:block;margin-bottom:8px">
          <span style="color:#888;font-size:11px">Standard-Sortierung der Wachenliste</span>
          <select class="lp-input" id="lp-set-sort" style="margin-top:4px">
            ${sortierOptions.map(o => `<option value="${o.v}"${S.settings.sortierung===o.v?' selected':''}>${o.n}</option>`).join('')}
          </select>
        </label>
        <div class="lp-check-row">
          <input type="checkbox" id="lp-set-confirm" ${S.settings.bestaetigungen?'checked':''}>
          <label for="lp-set-confirm">Bestätigungen vor Aktionen anzeigen</label>
        </div>
      </div>
      <div class="lp-sec" style="padding:0 0 14px">
        <h3>Aktionen</h3>
        <button class="lp-btn" id="lp-set-refresh">↻ Jetzt aktualisieren</button>
        <button class="lp-btn danger" id="lp-set-clear">Cache leeren</button>
      </div>
      <div class="lp-sec" style="padding:0">
        <h3>Log <span class="lp-badge">${S.log.length}</span>
          <button class="lp-btn mini" style="margin-left:auto" id="lp-log-clear">Leeren</button>
        </h3>
        <div class="lp-logbox" id="lp-logbox">
          ${S.log.length ? S.log.map(l => `<div class="entry ${l.art}">[${new Date(l.ts).toLocaleTimeString('de-DE')}] ${esc(l.msg)}</div>`).join('') : '<div class="entry info">Keine Meldungen.</div>'}
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════════════
   17. EVENTS
   ══════════════════════════════════════════════════════════════════ */

function bindeEvents() {
  // Tabs
  bodyEl.querySelectorAll('.lp-tab').forEach(t => t.onclick = () => {
    S.aktiverTab = t.dataset.tab;
    S.aktiveWache = null;
    _lastScrollCtx = '';
    render();
  });

  // Init-load
  bodyEl.querySelector('#lp-init-load')?.addEventListener('click', () => loadAll());

  // Erweiterungen Subtabs
  bodyEl.querySelectorAll('.lp-subtab').forEach(t => {
    if (t.dataset.etab) t.onclick = () => { S.aktiverErwTab = t.dataset.etab; render(); };
    else if (t.dataset.dtab) t.onclick = () => { S.aktiverDetailTab = t.dataset.dtab; render(); };
  });

  // Erweiterungen Filter
  bodyEl.querySelector('#lp-erw-filter')?.addEventListener('change', e => {
    S.erwFilter = e.target.value; render();
  });
  bodyEl.querySelector('#lp-dash-filter')?.addEventListener('change', e => {
    S.dashboardFilter = e.target.value; render();
  });

  // Katalog-Klapp
  bodyEl.querySelectorAll('.lp-kat-head').forEach(h => h.onclick = () => {
    const k = h.dataset.key;
    if (S.offeneKataloge.has(k)) S.offeneKataloge.delete(k); else S.offeneKataloge.add(k);
    render();
  });
  bodyEl.querySelectorAll('.lp-ausb-k-head').forEach(h => h.onclick = () => {
    const k = h.dataset.kurs;
    if (S.offeneAusbKarten.has(k)) S.offeneAusbKarten.delete(k); else S.offeneAusbKarten.add(k);
    render();
  });
  bodyEl.querySelectorAll('.lp-diag-open').forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    const w = S.buildings.find(x => x.id === Number(b.dataset.wache));
    if (!w) return;
    S.aktiverTab = 'wachen';
    S.aktiveArt = String(w.building_type);
    S.aktiveWache = w.id;
    S.aktiverDetailTab = 'uebersicht';
    _lastScrollCtx = '';
    render();
  });

  // Ausbildung nachladen
  bodyEl.querySelector('#lp-ausb-laden')?.addEventListener('click', async () => {
    const wachen = planbareWachen().filter(b =>
      S.erwFilter === 'alle' || String(b.building_type) === S.erwFilter);
    for (const b of wachen) {
      if (!S.personalCache.has(b.id)) await ladePersonal(b, true);
    }
    render();
  });

  // Art-Tabs
  bodyEl.querySelectorAll('.lp-art-tab').forEach(t => t.onclick = () => {
    S.aktiveArt = t.dataset.art;
    S.aktiveWache = null;
    _lastScrollCtx = '';
    render();
  });

  // Gruppen
  bodyEl.querySelectorAll('.lp-grp-head').forEach(g => g.onclick = () => {
    const t = g.dataset.grp;
    if (S.offeneGruppen.has(t)) S.offeneGruppen.delete(t); else S.offeneGruppen.add(t);
    render();
  });

  // Wachenkarten
  bodyEl.querySelectorAll('.lp-card').forEach(c => c.onclick = () => {
    S.aktiveWache = Number(c.dataset.wache);
    S.aktiverDetailTab = 'uebersicht';
    _lastScrollCtx = '';
    render();
  });

  // Suche
  const such = bodyEl.querySelector('#lp-search');
  if (such) {
    let t = null;
    such.oninput = () => {
      S.suche = such.value;
      clearTimeout(t);
      t = setTimeout(() => {
        const pos = such.selectionStart;
        _lastScrollCtx = '';
        render();
        const neu = bodyEl.querySelector('#lp-search');
        if (neu) { neu.focus(); neu.setSelectionRange(pos, pos); }
      }, 200);
    };
  }

  // Sortierung
  bodyEl.querySelector('#lp-sort')?.addEventListener('change', e => {
    S.settings.sortierung = e.target.value;
    store.set(K.SETTINGS, S.settings);
    _lastScrollCtx = '';
    render();
  });

  // Detail-Aktionen
  bindeDetailEvents();

  // Profile
  bindeProfileEvents();

  // Einstellungen
  bindeEinstellungenEvents();

  // Fahrzeug-⋯-Menü
  bodyEl.querySelectorAll('.lp-vmenu').forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    const vid = Number(b.dataset.vid);
    zeigeFahrzeugMenu(vid, b);
  });
}

function bindeDetailEvents() {
  bodyEl.querySelector('#lp-akt-kaufen')?.addEventListener('click', kaufeDialog);
  bodyEl.querySelector('#lp-akt-kaufen2')?.addEventListener('click', kaufeDialog);
  bodyEl.querySelector('#lp-akt-werben')?.addEventListener('click', werbenAktion);
  bodyEl.querySelector('#lp-akt-werben2')?.addEventListener('click', werbenAktion);
  bodyEl.querySelector('#lp-akt-umbenennen')?.addEventListener('click', umbenennenDialog);
  bodyEl.querySelector('#lp-akt-nummerieren')?.addEventListener('click', nummerierenDialog);
  bodyEl.querySelector('#lp-akt-toggle')?.addEventListener('click', toggleAktion);

  bodyEl.querySelector('#lp-pers-reload')?.addEventListener('click', async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    S.personalCache.delete(b.id);
    render();
  });

  bodyEl.querySelector('#lp-ausb-reload')?.addEventListener('click', async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    S.ausbauCache.delete(b.id);
    render();
  });

  bodyEl.querySelectorAll('.lp-ausb-toggle').forEach(btn => btn.onclick = async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    const extId = Number(btn.dataset.ext);
    const sollAktiv = btn.dataset.soll === '1';
    const cap = btn.dataset.cap;
    if (S.settings.bestaetigungen && !await frage(`${cap} ${sollAktiv?'aktivieren':'deaktivieren'}?`)) return;
    try {
      const html = await apiText(`/buildings/${b.id}`);
      const m = [...html.matchAll(/href="(\/buildings\/\d+\/extension_ready\/(\d+)\/\d+)"/g)]
        .find(x => Number(x[2]) === extId);
      if (!m) throw new Error('Umschalter nicht gefunden');
      await postForm(m[1]);
      const e = (b.extensions || []).find(x => Number(x.type_id) === extId);
      if (e) e.enabled = sollAktiv;
      S.ausbauCache.delete(b.id);
      analyseInvalidieren();
      logAdd(`${cap} ${sollAktiv?'aktiviert':'deaktiviert'}.`);
      render();
    } catch (err) {
      logAdd(`Umschalten fehlgeschlagen: ${err.message}`, 'err');
      alert(`Fehler: ${err.message}`);
    }
  });

  bodyEl.querySelectorAll('.lp-ausb-bauen').forEach(btn => btn.onclick = async () => {
    const b = S.buildings.find(x => x.id === S.aktiveWache);
    if (!b) return;
    const extId = Number(btn.dataset.ext);
    const cap = btn.dataset.cap;
    const preis = Number(btn.dataset.preis) || null;
    if (S.settings.bestaetigungen && !await frage(`${cap} bauen?\n\n${preis?fmtCr(preis):''}`)) return;
    try {
      await postForm(`/buildings/${b.id}/extension/credits/${extId}?redirect_building_id=${b.id}`);
      b.extensions = b.extensions || [];
      b.extensions.push({ type_id: extId, caption: cap, available: true, enabled: true, available_at: null });
      S.ausbauCache.delete(b.id);
      analyseInvalidieren();
      logAdd(`${cap} gebaut.`);
      render();
    } catch (e) {
      logAdd(`Bauen fehlgeschlagen: ${e.message}`, 'err');
      alert(`Fehler: ${e.message}`);
    }
  });
}

function bindeProfileEvents() {
  bodyEl.querySelectorAll('[data-ptyp]').forEach(el => el.onclick = () => {
    S.aktiverProfilTyp = el.dataset.ptyp;
    if (el.dataset.pname) S.aktiverProfilName = el.dataset.pname;
    render();
  });

  bodyEl.querySelector('#lp-profil-neu')?.addEventListener('click', () => {
    const ov = dlgOpen(`
      <div class="lp-dlg-head"><b>Neues Profil</b></div>
      <div class="lp-dlg-body"><label><span>Name</span><input type="text" id="new-pname" placeholder="z. B. Klein, Groß"></label></div>
      <div class="lp-dlg-foot">
        <button class="lp-btn primary" data-ok>Anlegen</button>
        <button class="lp-btn" data-ab>Abbrechen</button>
      </div>`);
    const inp = ov.querySelector('#new-pname');
    inp.focus();
    ov.querySelector('[data-ab]').onclick = () => ov.remove();
    ov.querySelector('[data-ok]').onclick = () => {
      const n = inp.value.trim();
      if (!n) return;
      const t = S.aktiverProfilTyp;
      S.profiles[t] ||= {};
      if (S.profiles[t][n]) { alert('Name existiert bereits.'); return; }
      S.profiles[t][n] = { vehicles: {}, extensions: {} };
      store.set(K.PROFILES, S.profiles);
      S.aktiverProfilName = n;
      ov.remove(); analyseInvalidieren(); render();
    };
  });

  bodyEl.querySelector('#lp-profil-umb')?.addEventListener('click', () => {
    const t = S.aktiverProfilTyp;
    const old = S.aktiverProfilName;
    const ov = dlgOpen(`
      <div class="lp-dlg-head"><b>Profil umbenennen</b></div>
      <div class="lp-dlg-body"><label><span>Neuer Name</span><input type="text" id="umb-name" value="${escA(old)}"></label></div>
      <div class="lp-dlg-foot">
        <button class="lp-btn primary" data-ok>Umbenennen</button>
        <button class="lp-btn" data-ab>Abbrechen</button>
      </div>`);
    const inp = ov.querySelector('#umb-name');
    inp.focus(); inp.select();
    ov.querySelector('[data-ab]').onclick = () => ov.remove();
    ov.querySelector('[data-ok]').onclick = () => {
      const n = inp.value.trim();
      if (!n || n === old) { ov.remove(); return; }
      if (S.profiles[t][n]) { alert('Name existiert bereits.'); return; }
      S.profiles[t][n] = S.profiles[t][old];
      delete S.profiles[t][old];
      for (const [bid, arr] of Object.entries(S.zuordnung)) {
        if (Array.isArray(arr)) {
          const i = arr.indexOf(old);
          if (i >= 0) arr[i] = n;
        }
      }
      store.set(K.PROFILES, S.profiles);
      store.set(K.ZUORD, S.zuordnung);
      S.aktiverProfilName = n;
      ov.remove(); analyseInvalidieren(); render();
    };
  });

  bodyEl.querySelector('#lp-profil-del')?.addEventListener('click', async () => {
    const t = S.aktiverProfilTyp;
    const n = S.aktiverProfilName;
    if (!await frage(`Profil "${n}" löschen?`)) return;
    delete S.profiles[t][n];
    for (const [bid, arr] of Object.entries(S.zuordnung)) {
      if (Array.isArray(arr)) {
        const i = arr.indexOf(n);
        if (i >= 0) arr.splice(i, 1);
        if (!arr.length) delete S.zuordnung[bid];
      }
    }
    store.set(K.PROFILES, S.profiles);
    store.set(K.ZUORD, S.zuordnung);
    S.aktiverProfilName = Object.keys(S.profiles[t])[0] || null;
    analyseInvalidieren(); render();
  });

  // Fahrzeug +/- im Profil
  bodyEl.querySelectorAll('.lp-profil-fz-plus').forEach(b => b.onclick = () => {
    const p = S.profiles[S.aktiverProfilTyp][S.aktiverProfilName];
    p.vehicles[b.dataset.vid] = (Number(p.vehicles[b.dataset.vid]) || 0) + 1;
    store.set(K.PROFILES, S.profiles); analyseInvalidieren(); render();
  });
  bodyEl.querySelectorAll('.lp-profil-fz-minus').forEach(b => b.onclick = () => {
    const p = S.profiles[S.aktiverProfilTyp][S.aktiverProfilName];
    const n = (Number(p.vehicles[b.dataset.vid]) || 0) - 1;
    if (n <= 0) delete p.vehicles[b.dataset.vid]; else p.vehicles[b.dataset.vid] = n;
    store.set(K.PROFILES, S.profiles); analyseInvalidieren(); render();
  });
  bodyEl.querySelectorAll('.lp-profil-fz-rm').forEach(b => b.onclick = () => {
    const p = S.profiles[S.aktiverProfilTyp][S.aktiverProfilName];
    delete p.vehicles[b.dataset.vid];
    store.set(K.PROFILES, S.profiles); analyseInvalidieren(); render();
  });
  bodyEl.querySelector('.lp-profil-fz-add')?.addEventListener('change', e => {
    if (!e.target.value) return;
    const p = S.profiles[S.aktiverProfilTyp][S.aktiverProfilName];
    p.vehicles[e.target.value] = 1;
    store.set(K.PROFILES, S.profiles); analyseInvalidieren(); render();
  });

  // Ausbauten +/- im Profil
  bodyEl.querySelectorAll('.lp-profil-ax-plus').forEach(b => b.onclick = () => {
    const p = S.profiles[S.aktiverProfilTyp][S.aktiverProfilName];
    p.extensions = p.extensions || {};
    p.extensions[b.dataset.cap] = (Number(p.extensions[b.dataset.cap]) || 0) + 1;
    store.set(K.PROFILES, S.profiles); analyseInvalidieren(); render();
  });
  bodyEl.querySelectorAll('.lp-profil-ax-minus').forEach(b => b.onclick = () => {
    const p = S.profiles[S.aktiverProfilTyp][S.aktiverProfilName];
    p.extensions = p.extensions || {};
    const n = (Number(p.extensions[b.dataset.cap]) || 0) - 1;
    if (n <= 0) delete p.extensions[b.dataset.cap]; else p.extensions[b.dataset.cap] = n;
    store.set(K.PROFILES, S.profiles); analyseInvalidieren(); render();
  });
  bodyEl.querySelectorAll('.lp-profil-ax-rm').forEach(b => b.onclick = () => {
    const p = S.profiles[S.aktiverProfilTyp][S.aktiverProfilName];
    delete p.extensions[b.dataset.cap];
    store.set(K.PROFILES, S.profiles); analyseInvalidieren(); render();
  });
  bodyEl.querySelector('.lp-profil-ax-add')?.addEventListener('change', e => {
    if (!e.target.value) return;
    const p = S.profiles[S.aktiverProfilTyp][S.aktiverProfilName];
    p.extensions = p.extensions || {};
    p.extensions[e.target.value] = 1;
    store.set(K.PROFILES, S.profiles); analyseInvalidieren(); render();
  });

  // Zuordnung Checkboxen
  bodyEl.querySelectorAll('.lp-zuord').forEach(cb => cb.onchange = () => {
    const bid = Number(cb.dataset.bid);
    const pname = cb.dataset.pname;
    const arr = Array.isArray(S.zuordnung[bid]) ? [...S.zuordnung[bid]] : [];
    const i = arr.indexOf(pname);
    if (cb.checked && i < 0) arr.push(pname);
    if (!cb.checked && i >= 0) arr.splice(i, 1);
    if (arr.length === 0) delete S.zuordnung[bid];
    else S.zuordnung[bid] = arr;
    store.set(K.ZUORD, S.zuordnung);
    analyseInvalidieren();
    // Kein Full-Render — nur Zähler aktualisieren wäre schön, aber wir rendern
    // vorsichtig: nur den aktiven State der Karte markieren
  });
}

function bindeEinstellungenEvents() {
  bodyEl.querySelector('#lp-set-sort')?.addEventListener('change', e => {
    S.settings.sortierung = e.target.value;
    store.set(K.SETTINGS, S.settings);
  });
  bodyEl.querySelector('#lp-set-confirm')?.addEventListener('change', e => {
    S.settings.bestaetigungen = e.target.checked;
    store.set(K.SETTINGS, S.settings);
  });
  bodyEl.querySelector('#lp-set-refresh')?.addEventListener('click', () => loadAll());
  bodyEl.querySelector('#lp-set-clear')?.addEventListener('click', async () => {
    if (S.settings.bestaetigungen && !await frage('Cache leeren? (Profile und Zuordnungen bleiben erhalten)')) return;
    store.del(K.CACHE);
    S.buildings = []; S.vehicles = []; S.byBuilding.clear();
    S.personalCache.clear(); S.ausbauCache.clear();
    S.loaded = false;
    logAdd('Cache geleert.');
    render();
  });
  bodyEl.querySelector('#lp-log-clear')?.addEventListener('click', () => {
    S.log = []; render();
  });
}

/* ══════════════════════════════════════════════════════════════════
   18. AKTIONEN
   ══════════════════════════════════════════════════════════════════ */

async function kaufeDialog() {
  const b = S.buildings.find(x => x.id === S.aktiveWache);
  if (!b) return;
  const a = analyse(b);
  if (!a.fehlend.length) return;

  const preise = S.preise[String(b.building_type)] || {};
  const layout = LAYOUTS[b.building_type];
  const stellplaetze = a.stellplaetze;
  const benoetigt = a.fehlend.reduce((s, x) => s + x.n, 0);
  const fehlStell = Math.max(0, benoetigt - stellplaetze.frei);
  let stufenKostenBenoetigt = 0;
  if (fehlStell > 0 && layout?.basis === 'level+1') {
    stufenKostenBenoetigt = stufenKosten(b.level, b.level + fehlStell);
  }

  const html = `
    <div class="lp-dlg-head"><b>Fahrzeuge kaufen — ${esc(b.caption)}</b></div>
    <div class="lp-dlg-body">
      <table class="lp-dlg-table">
        <thead><tr><th></th><th>Fahrzeug</th><th style="text-align:right">Anz.</th><th style="text-align:right">Stück</th><th style="text-align:right">Summe</th></tr></thead>
        <tbody>
        ${a.fehlend.map(f => {
          const p = preise[f.typ];
          return `<tr>
            <td><input type="checkbox" class="lp-buy-cb" data-vid="${f.typ}" data-n="${f.n}" checked></td>
            <td>${esc(f.name)}</td>
            <td style="text-align:right">${f.n}</td>
            <td style="text-align:right">${p!=null?fmtCr(p):'?'}</td>
            <td style="text-align:right">${p!=null?fmtCr(p*f.n):'?'}</td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
      ${fehlStell > 0 ? `<div class="lp-warnbox" style="margin:12px 0 0">
        <div style="color:#e0a33c">${fehlStell} Stellplätze fehlen. Stufen-Ausbau kostet zusätzlich ${fmtCr(stufenKostenBenoetigt)}.</div>
      </div>` : ''}
    </div>
    <div class="lp-dlg-foot">
      <button class="lp-btn primary" data-ok>Kaufen</button>
      <button class="lp-btn" data-ab>Abbrechen</button>
    </div>`;
  const ov = dlgOpen(html, { width: 620 });
  ov.querySelector('[data-ab]').onclick = () => ov.remove();
  ov.querySelector('[data-ok]').onclick = async () => {
    const ausgewählt = [...ov.querySelectorAll('.lp-buy-cb:checked')].map(cb => {
      const typ = cb.dataset.vid;
      const f = a.fehlend.find(x => x.typ === typ);
      return f;
    }).filter(Boolean);
    if (!ausgewählt.length) { ov.remove(); return; }

    if (S.settings.bestaetigungen) {
      const total = ausgewählt.reduce((s, x) => s + (preise[x.typ] || 0) * x.n, 0);
      if (!await frage(`${ausgewählt.reduce((s,x)=>s+x.n,0)} Fahrzeuge kaufen?\n\nGeschätzt: ${fmtCr(total)}`)) return;
    }
    ov.remove();

    zeigeLogDialog(`Kaufe Fahrzeuge für ${b.caption}`, async (log) => {
      let n = 0;
      for (const f of ausgewählt) {
        for (let i = 0; i < f.n; i++) {
          if (S.settings.bestaetigungen) {
            if (!await frage(`Kaufe ${f.name} (${i+1}/${f.n})?`)) {
              log(`Übersprungen: ${f.name}`, 'warn');
              break;
            }
          }
          try {
            await getAction(`/buildings/${b.id}/vehicle/${b.id}/${f.typ}/credits?building=${b.id}`);
            log(`✓ ${f.name} gekauft`, 'info');
            n++;
          } catch (e) {
            log(`✗ ${f.name}: ${e.message}`, 'err');
            break;
          }
        }
      }
      return n;
    });
  };
}

async function werbenAktion() {
  const b = S.buildings.find(x => x.id === S.aktiveWache);
  if (!b) return;
  if (S.settings.bestaetigungen && !await frage(`3 Tage Personal für ${b.caption} werben?`)) return;
  try {
    await getAction(`/buildings/${b.id}/hire_do/3`);
    logAdd(`Personal geworben für ${b.caption}.`);
    alert('Personal geworben.');
  } catch (e) {
    logAdd(`Werben fehlgeschlagen: ${e.message}`, 'err');
    alert(`Fehler: ${e.message}`);
  }
}

function umbenennenDialog() {
  const b = S.buildings.find(x => x.id === S.aktiveWache);
  if (!b) return;
  const ov = dlgOpen(`
    <div class="lp-dlg-head"><b>Wache umbenennen</b></div>
    <div class="lp-dlg-body"><label><span>Neuer Name</span><input type="text" id="umb-w" value="${escA(b.caption)}"></label></div>
    <div class="lp-dlg-foot">
      <button class="lp-btn primary" data-ok>Umbenennen</button>
      <button class="lp-btn" data-ab>Abbrechen</button>
    </div>`);
  const inp = ov.querySelector('#umb-w');
  inp.focus(); inp.select();
  ov.querySelector('[data-ab]').onclick = () => ov.remove();
  ov.querySelector('[data-ok]').onclick = async () => {
    const n = inp.value.trim();
    if (!n || n === b.caption) { ov.remove(); return; }
    if (S.settings.bestaetigungen && !await frage(`Umbenennen in "${n}"?`)) return;
    ov.remove();
    try {
      let feld = 'building[name]', methode = null;
      try {
        const html = await apiText(`/buildings/${b.id}/edit`);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const f = doc.querySelector('#building_name, input[name="building[name]"], input[name$="[caption]"]');
        if (f) {
          feld = f.getAttribute('name');
          methode = f.closest('form')?.querySelector('input[name="_method"]')?.value || null;
        }
      } catch {}
      const fields = { [feld]: n };
      if (methode) fields._method = methode;
      await postForm(`/buildings/${b.id}`, fields);
      b.caption = n;
      logAdd(`Wache umbenannt: ${n}`);
      render();
    } catch (e) {
      logAdd(`Umbenennen fehlgeschlagen: ${e.message}`, 'err');
      alert(`Fehler: ${e.message}`);
    }
  };
}

function nummerierenDialog() {
  const b = S.buildings.find(x => x.id === S.aktiveWache);
  if (!b) return;
  const fz = (S.byBuilding.get(b.id) || []).filter(v => v.id > 0);
  if (!fz.length) return;
  const wnr = wachenNr(b.caption);
  const kzl = S.kuerzel[String(b.id)] || '';
  const ov = dlgOpen(`
    <div class="lp-dlg-head"><b>Fahrzeuge nummerieren — ${esc(b.caption)}</b></div>
    <div class="lp-dlg-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <label><span>Stadtkürzel</span><input type="text" id="nm-k" value="${escA(kzl)}" maxlength="6"></label>
        <label><span>Wachennummer</span><input type="number" id="nm-w" value="${wnr??''}"></label>
      </div>
      <div style="color:#888;font-size:11px;margin-top:8px">Vorschau:</div>
      <div class="lp-logbox" id="nm-v"></div>
    </div>
    <div class="lp-dlg-foot">
      <button class="lp-btn primary" data-ok>Alle umbenennen</button>
      <button class="lp-btn" data-ab>Abbrechen</button>
    </div>`, { width: 640 });

  const sortiert = [...fz].sort((a, c) => (wachenNr(a.caption) ?? a.id) - (wachenNr(c.caption) ?? c.id));
  const inpK = ov.querySelector('#nm-k');
  const inpW = ov.querySelector('#nm-w');
  const v = ov.querySelector('#nm-v');
  const zeichne = () => {
    const k = (inpK.value.trim() || '??').toUpperCase();
    const w = inpW.value.trim() || '?';
    v.innerHTML = sortiert.map((x, i) =>
      `<div><span style="color:#888">${esc(x.caption)}</span> → <span style="color:#a5bde0">${esc(`${k} ${vehName(x.vehicle_type)} ${w}/${i+1}`)}</span></div>`
    ).join('');
  };
  inpK.oninput = zeichne; inpW.oninput = zeichne; zeichne();
  inpK.focus();

  ov.querySelector('[data-ab]').onclick = () => ov.remove();
  ov.querySelector('[data-ok]').onclick = async () => {
    const k = inpK.value.trim().toUpperCase();
    const w = Number(inpW.value);
    if (!k || !Number.isFinite(w)) return;
    if (S.settings.bestaetigungen && !await frage(`${sortiert.length} Fahrzeuge umbenennen?`)) return;
    S.kuerzel[String(b.id)] = k;
    store.set(K.KUERZEL, S.kuerzel);
    ov.remove();
    zeigeLogDialog('Nummeriere Fahrzeuge', async (log) => {
      let n = 0;
      for (let i = 0; i < sortiert.length; i++) {
        const x = sortiert[i];
        const neu = `${k} ${vehName(x.vehicle_type)} ${w}/${i+1}`;
        if (x.caption === neu) continue;
        try {
          const html = await apiText(`/vehicles/${x.id}/edit`);
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const fields = { _method: 'patch' };
          doc.querySelectorAll('form input[name^="vehicle["], form select[name^="vehicle["], form textarea[name^="vehicle["]').forEach(el => {
            const nn = el.getAttribute('name');
            if (!nn) return;
            if (el.type === 'checkbox' || el.type === 'radio') {
              if (el.checked) fields[nn] = el.value || '1';
              return;
            }
            const val = el.tagName === 'SELECT'
              ? (el.querySelector('option[selected]')?.value ?? el.value ?? '')
              : (el.getAttribute('value') ?? el.value ?? '');
            if (val !== '') fields[nn] = val;
          });
          fields['vehicle[caption]'] = neu;
          await postForm(`/vehicles/${x.id}`, fields);
          x.caption = neu;
          n++;
          log(`✓ ${neu}`);
        } catch (e) {
          log(`✗ ${x.caption}: ${e.message}`, 'err');
        }
      }
      return n;
    });
  };
}

async function toggleAktion() {
  const b = S.buildings.find(x => x.id === S.aktiveWache);
  if (!b) return;
  const ziel = !b.enabled;
  if (S.settings.bestaetigungen && !await frage(`Wache ${ziel ? 'aktivieren' : 'deaktivieren'}?\n\n${b.caption}`)) return;
  try {
    await getAction(`/buildings/${b.id}/active`);
    b.enabled = ziel;
    logAdd(`Wache ${ziel ? 'aktiviert' : 'deaktiviert'}: ${b.caption}`);
    analyseInvalidieren();
    render();
  } catch (e) {
    logAdd(`Umschalten fehlgeschlagen: ${e.message}`, 'err');
    alert(`Fehler: ${e.message}`);
  }
}

/* ══════════════════════════════════════════════════════════════════
   19. FAHRZEUG-KONTEXTMENÜ
   ══════════════════════════════════════════════════════════════════ */

function zeigeFahrzeugMenu(vid, btn) {
  closeMenu();
  const b = S.buildings.find(x => x.id === S.aktiveWache);
  if (!b) return;
  const v = (S.byBuilding.get(b.id) || []).find(x => x.id === vid);
  if (!v) return;

  const menu = document.createElement('div');
  menu.className = 'lp-menu';
  const isAnh = istAnhaenger(v);
  const kannFms = v.fms_real === 2;

  menu.innerHTML = `
    <button data-act="umb">Umbenennen</button>
    <div class="sep"></div>
    <button data-act="fms2" ${kannFms?'':'disabled'}>Status 2</button>
    <button data-act="fms6" ${kannFms?'':'disabled'}>Status 6</button>
    ${isAnh ? `<div class="sep"></div><button data-act="kopp">Anhänger koppeln</button>` : ''}
    <div class="sep"></div>
    <button data-act="pers">Personal-Zuweisung öffnen</button>
  `;
  const r = btn.getBoundingClientRect();
  menu.style.left = Math.min(r.left, window.innerWidth - 200) + 'px';
  menu.style.top = (r.bottom + 4) + 'px';
  menu.style.position = 'fixed';
  root.appendChild(menu);
  aktivesMenu = menu;

  setTimeout(() => {
    document.addEventListener('click', function h(e) {
      if (!menu.contains(e.target)) { closeMenu(); document.removeEventListener('click', h); }
    });
  }, 10);

  menu.querySelectorAll('button').forEach(mb => mb.onclick = async () => {
    const act = mb.dataset.act;
    closeMenu();
    if (act === 'umb') {
      const ov = dlgOpen(`
        <div class="lp-dlg-head"><b>Fahrzeug umbenennen</b></div>
        <div class="lp-dlg-body"><label><span>Neuer Name</span><input type="text" id="fz-umb" value="${escA(v.caption)}"></label></div>
        <div class="lp-dlg-foot">
          <button class="lp-btn primary" data-ok>Umbenennen</button>
          <button class="lp-btn" data-ab>Abbrechen</button>
        </div>`);
      const inp = ov.querySelector('#fz-umb');
      inp.focus(); inp.select();
      ov.querySelector('[data-ab]').onclick = () => ov.remove();
      ov.querySelector('[data-ok]').onclick = async () => {
        const nn = inp.value.trim();
        if (!nn || nn === v.caption) { ov.remove(); return; }
        ov.remove();
        try {
          const html = await apiText(`/vehicles/${v.id}/edit`);
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const fields = { _method: 'patch' };
          doc.querySelectorAll('form input[name^="vehicle["], form select[name^="vehicle["], form textarea[name^="vehicle["]').forEach(el => {
            const n = el.getAttribute('name');
            if (!n) return;
            if (el.type === 'checkbox' || el.type === 'radio') {
              if (el.checked) fields[n] = el.value || '1';
              return;
            }
            const val = el.tagName === 'SELECT'
              ? (el.querySelector('option[selected]')?.value ?? el.value ?? '')
              : (el.getAttribute('value') ?? el.value ?? '');
            if (val !== '') fields[n] = val;
          });
          fields['vehicle[caption]'] = nn;
          await postForm(`/vehicles/${v.id}`, fields);
          v.caption = nn;
          logAdd(`Fahrzeug umbenannt: ${nn}`);
          render();
        } catch (e) {
          logAdd(`Umbenennen fehlgeschlagen: ${e.message}`, 'err');
          alert(`Fehler: ${e.message}`);
        }
      };
    } else if (act === 'fms2' || act === 'fms6') {
      const ziel = act === 'fms2' ? 2 : 6;
      try {
        await getAction(`/vehicles/${v.id}/set_fms/${ziel}`);
        v.fms_real = ziel;
        logAdd(`${v.caption} → Status ${ziel}`);
        render();
      } catch (e) {
        logAdd(`FMS setzen fehlgeschlagen: ${e.message}`, 'err');
        alert(`Fehler: ${e.message}`);
      }
    } else if (act === 'kopp') {
      zeigeKoppelnDialog(b, v);
    } else if (act === 'pers') {
      window.open(`/vehicles/${v.id}/zuweisung`, '_blank');
    }
  });
}

function zeigeKoppelnDialog(b, v) {
  const zug = ZUGFAHRZEUG[v.vehicle_type] || null;
  const kandidaten = (S.byBuilding.get(b.id) || [])
    .filter(x => x.id > 0 && !istAnhaenger(x))
    .filter(x => !zug || zug.includes(x.vehicle_type))
    .sort((a, c) => (maxSitze(c.vehicle_type) || 0) - (maxSitze(a.vehicle_type) || 0));
  if (!kandidaten.length) { alert('Kein passendes Zugfahrzeug auf dieser Wache.'); return; }
  const ov = dlgOpen(`
    <div class="lp-dlg-head"><b>Anhänger koppeln</b></div>
    <div class="lp-dlg-body">
      <p style="margin:0 0 10px">${esc(v.caption)} an …</p>
      <select id="kz-ziel">
        <option value="">— bitte wählen —</option>
        ${kandidaten.map(k => `<option value="${k.id}" ${String(v.zugfahrzeug)===String(k.id)?'selected':''}>${esc(k.caption)} (${esc(vehName(k.vehicle_type))})</option>`).join('')}
      </select>
    </div>
    <div class="lp-dlg-foot">
      <button class="lp-btn primary" data-ok>Koppeln</button>
      <button class="lp-btn" data-ab>Abbrechen</button>
    </div>`);
  const sel = ov.querySelector('#kz-ziel');
  ov.querySelector('[data-ab]').onclick = () => ov.remove();
  ov.querySelector('[data-ok]').onclick = async () => {
    const zid = sel.value;
    if (!zid) return;
    ov.remove();
    try {
      const html = await apiText(`/vehicles/${v.id}/edit`);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const fields = { _method: 'patch' };
      doc.querySelectorAll('form input[name^="vehicle["], form select[name^="vehicle["], form textarea[name^="vehicle["]').forEach(el => {
        const n = el.getAttribute('name');
        if (!n) return;
        if (el.type === 'checkbox' || el.type === 'radio') {
          if (el.checked) fields[n] = el.value || '1';
          return;
        }
        const val = el.tagName === 'SELECT'
          ? (el.querySelector('option[selected]')?.value ?? el.value ?? '')
          : (el.getAttribute('value') ?? el.value ?? '');
        if (val !== '') fields[n] = val;
      });
      fields['vehicle[tractive_vehicle_id]'] = zid;
      fields['vehicle[tractive_random]'] = '0';
      await postForm(`/vehicles/${v.id}`, fields);
      v.zugfahrzeug = Number(zid);
      v.zufallszug = false;
      logAdd(`Anhänger gekoppelt: ${v.caption}`);
      render();
    } catch (e) {
      logAdd(`Koppeln fehlgeschlagen: ${e.message}`, 'err');
      alert(`Fehler: ${e.message}`);
    }
  };
}

/* ══════════════════════════════════════════════════════════════════
   20. FENSTER + START
   ══════════════════════════════════════════════════════════════════ */

function baueFenster() {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  root = document.createElement('div');
  root.id = 'lssPlanerRoot';
  document.body.appendChild(root);

  panel = document.createElement('div');
  panel.className = 'lp-panel';
  panel.innerHTML = `
    <div class="lp-header" id="lp-drag">
      <b>LSS-Planer</b>
      <span class="lp-ver">v${VERSION}</span>
      <span class="lp-header-status"></span>
      <button class="lp-iconbtn" id="lp-refresh" title="Jetzt aktualisieren">↻</button>
      <button class="lp-iconbtn lp-close" id="lp-close" title="Schließen">×</button>
    </div>
    <div class="lp-body" id="lp-body"></div>
  `;
  root.appendChild(panel);
  bodyEl = panel.querySelector('#lp-body');

  // Drag
  const griff = panel.querySelector('#lp-drag');
  let drag = null;
  const move = e => {
    if (!drag) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    panel.style.left = (drag.l + dx) + 'px';
    panel.style.top  = (drag.t + dy) + 'px';
  };
  const up = e => {
    if (!drag) return;
    const dx = e ? e.clientX - drag.sx : 0;
    const dy = e ? e.clientY - drag.sy : 0;
    const nl = Math.min(Math.max(0, drag.l + dx), window.innerWidth - 100);
    const nt = Math.min(Math.max(0, drag.t + dy), window.innerHeight - 60);
    panel.style.left = nl + 'px';
    panel.style.top = nt + 'px';
    S.panelPos = { l: nl, t: nt };
    drag = null;
    panel.classList.remove('dragging');
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  };
  griff.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const r = panel.getBoundingClientRect();
    drag = { sx: e.clientX, sy: e.clientY, l: r.left, t: r.top };
    panel.classList.add('dragging');
    panel.style.transform = 'none';
    panel.style.left = r.left + 'px';
    panel.style.top = r.top + 'px';
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    e.preventDefault();
  });

  panel.querySelector('#lp-close').onclick = () => panel.classList.remove('on');
  panel.querySelector('#lp-refresh').onclick = () => loadAll();
}

function oeffnePanel() {
  const war = panel.classList.contains('on');
  if (war) return;
  // Position setzen
  if (S.panelPos) {
    panel.style.transform = 'none';
    panel.style.left = S.panelPos.l + 'px';
    panel.style.top = S.panelPos.t + 'px';
  } else {
    panel.style.transform = 'translate(-50%, -50%)';
    panel.style.left = '50%';
    panel.style.top = '50%';
  }
  panel.classList.add('on');
  if (!S.loaded) {
    if (!loadFromCache()) {
      render(); // zeige Init-Screen
    } else {
      render();
    }
  } else {
    render();
  }
}

const NAV_SEL = ['#menu_profile','#navigation_top','.navbar-nav.navbar-right',
                 'ul.nav.navbar-nav','#navbar-main .navbar-nav','#navbar-main'];

function findNav() {
  for (const s of NAV_SEL) { const el = document.querySelector(s); if (el) return el; }
  return null;
}

function baueNavBtn() {
  if (document.getElementById('lp-nav-btn')) return true;
  const nav = findNav();
  if (!nav) return false;
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.id = 'lp-nav-btn';
  a.href = '#';
  a.className = 'lp-navbtn';
  a.textContent = '📋 Planer';
  a.onclick = e => { e.preventDefault(); oeffnePanel(); };
  li.appendChild(a);
  const istListe = nav.tagName === 'UL' || nav.tagName === 'NAV' || nav.classList.contains('navbar-nav');
  if (istListe) nav.appendChild(li);
  else {
    const par = nav.closest('li');
    if (par?.parentNode) par.parentNode.insertBefore(li, par.nextSibling);
    else nav.parentNode?.insertBefore(li, nav.nextSibling);
  }
  return true;
}

function warteNav() {
  if (baueNavBtn()) return;
  const obs = new MutationObserver(() => { if (baueNavBtn()) obs.disconnect(); });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 15000);
}

// Auto-Refresh
function startAutoRefresh() {
  setInterval(() => {
    if (!panel.classList.contains('on')) return;
    if (aktivesMenu) return; // Menü offen → nicht stören
    if (root.querySelector('.lp-dlg-overlay')) return; // Dialog offen → nicht stören
    if (S.loading) return;
    // Nur Wachen + Fahrzeuge neu laden, nicht Personal/Ausbauten
    loadAll();
  }, 60000);
}

// Init
function init() {
  baueFenster();
  warteNav();
  startAutoRefresh();
  if (loadFromCache()) {
    // nichts weiter — UI wird erst beim Öffnen gerendert
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();