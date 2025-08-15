import type { Event } from '../types';
import { dayMs } from './time';

const LOREM = [
  'Lorem ipsum dolor sit amet', 'consectetur adipiscing elit', 'sed do eiusmod tempor',
  'incididunt ut labore et dolore', 'magna aliqua', 'Ut enim ad minim veniam',
  'quis nostrud exercitation ullamco', 'laboris nisi ut aliquip ex ea commodo consequat',
  'Duis aute irure dolor in reprehenderit', 'in voluptate velit esse cillum dolore eu fugiat nulla pariatur'
];
function randLorem(n = 2) { return Array.from({ length: n }, () => LOREM[Math.floor(Math.random()*LOREM.length)]).join(' · '); }

export function seedRandom(prev: Event[], count: number): Event[] {
  const base = Date.now() - 180 * dayMs; const next = [...prev];
  for (let i=0;i<count;i++) {
    const d = new Date(base + Math.floor(Math.random()*360)*dayMs).toISOString().slice(0,10);
    next.push({ id: (Date.now()+Math.random()+i).toString(36), date: d, title: `Rand ${next.length+1}`, description: randLorem(2) });
  }
  return next;
}
// Incremental testing function for gradual event addition at random timepoints
export function seedIncremental(prev: Event[], targetCount: number): Event[] {
  const result = [...prev];
  
  // Calculate current timeline date range or use default
  let minDate = new Date('2025-01-01').getTime();
  let maxDate = new Date('2025-12-31').getTime();
  
  if (prev.length > 0) {
    const existingDates = prev.map(e => new Date(e.date).getTime());
    minDate = Math.min(...existingDates);
    maxDate = Math.max(...existingDates);
    
    // Expand range slightly for new events
    const range = maxDate - minDate;
    const expansion = Math.max(range * 0.1, 30 * dayMs); // At least 30 days expansion
    minDate -= expansion;
    maxDate += expansion;
  }
  
  // Add events until we reach target count
  while (result.length < targetCount) {
    const eventNumber = result.length + 1;
    
    // Generate random date within the timeline range
    const randomTime = minDate + Math.random() * (maxDate - minDate);
    const randomDate = new Date(randomTime);
    
    result.push({
      id: `inc-${eventNumber}-${Date.now()}-${Math.floor(Math.random()*1000)}`, // Unique ID
      date: randomDate.toISOString().slice(0, 10),
      title: `Event ${eventNumber}`,
      description: `Incremental test event ${eventNumber} - added at random timepoint`
    });
  }
  
  return result;
}

export function seedClustered(prev: Event[]): Event[] {
  const next = [...prev]; const centers = [-10,0,12].map(o => Date.now()+o*dayMs); let idx=1;
  for (let ci=0; ci<centers.length; ci++) for (let i=0;i<10;i++) { const jitter = (Math.floor(Math.random()*7)-3)*dayMs; const d=new Date(centers[ci]+jitter).toISOString().slice(0,10); next.push({ id:(Date.now()+Math.random()+ci*100+i).toString(36), date:d, title:`Cluster ${ci+1}-${idx++}`, description:randLorem(3)});}  
  return next;
}
export function seedLongRange(prev: Event[]): Event[] {
  const start=new Date('2015-01-01').getTime(); const months=60; const next=[...prev];
  for (let i=0;i<months;i++){ const d=new Date(start+i*(dayMs*30)).toISOString().slice(0,10); next.push({ id:(Date.now()+Math.random()+i).toString(36), date:d, title:`Long ${i+1}`, description:randLorem(2)});} 
  return next;
}

// Historical curated dataset: Robert F. Kennedy 1968 presidential campaign & assassination timeline.
// Dates use ISO (YYYY-MM-DD). Content is concise, neutral factual summaries.
export function seedRFKTimeline(): Event[] {
  const events: Event[] = [
    { date: '1968-03-16', title: 'Announces Candidacy', description: 'RFK declares run for Democratic nomination challenging LBJ & McCarthy.' , id: 'rfk-announce' },
    { date: '1968-03-31', title: 'LBJ Withdraws', description: 'President Johnson announces he will not seek re-election; alters race dynamics.', id: 'rfk-lbj' },
    { date: '1968-04-04', title: 'MLK Jr. Assassinated', description: 'Nationwide unrest; RFK delivers extemporaneous Indianapolis speech on unity.', id: 'rfk-mlk' },
    { date: '1968-04-23', title: 'Columbia Protests', description: 'Campus unrest highlights turbulent context of campaign season.', id: 'rfk-columbia' },
    { date: '1968-05-07', title: 'Indiana Primary Win', description: 'Secures important early victory demonstrating broad coalition potential.', id: 'rfk-indiana' },
    { date: '1968-05-28', title: 'Oregon Primary Loss', description: 'Loses to Eugene McCarthy—first Kennedy family primary defeat.', id: 'rfk-oregon' },
    { date: '1968-06-04', title: 'California Primary', description: 'Wins key delegate-rich state, revives path to nomination.', id: 'rfk-california' },
    { date: '1968-06-05', title: 'Assassinated in LA', description: 'Shot at Ambassador Hotel after victory speech; mortally wounded.', id: 'rfk-shooting' },
    { date: '1968-06-06', title: 'Death Announced', description: 'RFK dies of wounds; campaign ends; profound national mourning.', id: 'rfk-death' },
    { date: '1968-06-08', title: 'Funeral & Burial', description: 'Funeral Mass St. Patrick’s Cathedral; burial at Arlington.', id: 'rfk-funeral' }
  ];
  // Ensure chronological sort order by date (already sorted) and stable ids.
  return events;
}

// Historical curated dataset: John F. Kennedy presidency key events & assassination timeline.
export function seedJFKTimeline(): Event[] {
  const events: Event[] = [
    { id: 'jfk-inaug', date: '1961-01-20', title: 'Inauguration', description: 'JFK sworn in as 35th U.S. President; "Ask not" inaugural address.' },
    { id: 'jfk-peacecorps', date: '1961-03-01', title: 'Peace Corps Established', description: 'Executive Order creating Peace Corps to promote service abroad.' },
    { id: 'jfk-bay', date: '1961-04-17', title: 'Bay of Pigs', description: 'Failed invasion of Cuba increases Cold War tensions.' },
    { id: 'jfk-moon', date: '1961-05-25', title: 'Moon Goal', description: 'Sets national goal of landing a man on the Moon before decade end.' },
    { id: 'jfk-alliance', date: '1961-08-17', title: 'Alliance for Progress', description: 'Latin America development initiative announced earlier; momentum events through 1961.' },
    { id: 'jfk-cubanmissiles', date: '1962-10-22', title: 'Cuban Missile Crisis Address', description: 'Televised speech announcing naval "quarantine" of Cuba.' },
    { id: 'jfk-blockadeend', date: '1962-11-20', title: 'Missile Crisis Ends', description: 'Blockade lifted after verified Soviet withdrawal of missiles.' },
    { id: 'jfk-civilrights', date: '1963-06-11', title: 'Civil Rights Address', description: 'Televised address framing civil rights as a moral issue.' },
    { id: 'jfk-berlin', date: '1963-06-26', title: 'Ich bin ein Berliner', description: 'West Berlin speech affirming support amid Cold War division.' },
    { id: 'jfk-testban', date: '1963-08-05', title: 'Test Ban Treaty', description: 'Partial Nuclear Test Ban Treaty signed (US/UK/USSR).' },
    { id: 'jfk-limitsell', date: '1963-09-20', title: 'UN Cooperation Speech', description: 'Proposes joint lunar exploration with USSR at UN General Assembly.' },
    { id: 'jfk-dallas', date: '1963-11-22', title: 'Assassination', description: 'JFK shot during motorcade in Dallas, Texas.' },
    { id: 'jfk-johnsonsworn', date: '1963-11-22', title: 'LBJ Sworn In', description: 'Vice President Johnson takes oath aboard Air Force One.' },
    { id: 'jfk-burial', date: '1963-11-25', title: 'Funeral & Burial', description: 'State funeral; eternal flame lit at Arlington National Cemetery.' },
    { id: 'jfk-warren', date: '1963-11-29', title: 'Warren Commission Formed', description: 'Johnson establishes commission to investigate assassination.' },
    { id: 'jfk-warrenreport', date: '1964-09-24', title: 'Warren Report Delivered', description: 'Commission report concludes lone gunman; controversy persists.' }
  ];
  return events;
}

// Historical curated dataset: Napoleon Bonaparte timeline from Henri Guillemin biography.
// Comprehensive life timeline including family context and key political/military events.
export function seedNapoleonTimeline(): Event[] {
  const events: Event[] = [
    // Parents and early family context
    { id: 'nap-charles-birth', date: '1746-03-27', title: 'Charles Buonaparte Born', description: 'Napoleon\'s father born in Ajaccio, Corsica; future law student and politician.' },
    { id: 'nap-letizia-birth', date: '1750-08-24', title: 'Letizia Ramolino Born', description: 'Napoleon\'s mother born in Ajaccio; strong matriarch of Bonaparte clan.' },
    { id: 'nap-parents-marry', date: '1764-06-02', title: 'Parents\' Marriage', description: 'Charles Buonaparte marries Letizia Ramolino in Ajaccio cathedral.' },
    { id: 'nap-corsica-france', date: '1768-05-15', title: 'Corsica Becomes French', description: 'Genoa cedes Corsica to France; Bonaparte family now French subjects.' },
    
    // Napoleon's birth and childhood
    { id: 'nap-birth', date: '1769-08-15', title: 'Napoleon Born', description: 'Napoleone Buonaparte born in Ajaccio, Corsica; second surviving child.' },
    { id: 'nap-joseph-birth', date: '1768-01-07', title: 'Joseph Bonaparte Born', description: 'Napoleon\'s elder brother born; future King of Spain.' },
    { id: 'nap-lucien-birth', date: '1775-05-21', title: 'Lucien Bonaparte Born', description: 'Napoleon\'s brother born; future politician and diplomat.' },
    { id: 'nap-elisa-birth', date: '1777-01-03', title: 'Elisa Bonaparte Born', description: 'Napoleon\'s sister born; future Princess of Lucca and Piombino.' },
    { id: 'nap-louis-birth', date: '1778-09-02', title: 'Louis Bonaparte Born', description: 'Napoleon\'s brother born; future King of Holland.' },
    { id: 'nap-pauline-birth', date: '1780-10-20', title: 'Pauline Bonaparte Born', description: 'Napoleon\'s sister born; future Princess Borghese.' },
    { id: 'nap-caroline-birth', date: '1782-03-25', title: 'Caroline Bonaparte Born', description: 'Napoleon\'s sister born; future Queen of Naples.' },
    { id: 'nap-jerome-birth', date: '1784-11-15', title: 'Jerome Bonaparte Born', description: 'Napoleon\'s youngest brother born; future King of Westphalia.' },
    
    // Education and military beginnings
    { id: 'nap-autun', date: '1779-01-01', title: 'School at Autun', description: 'Napoleon begins French schooling at Autun; learns French language.' },
    { id: 'nap-brienne', date: '1779-05-15', title: 'Military School Brienne', description: 'Enters military school at Brienne-le-Château; studies mathematics and geography.' },
    { id: 'nap-father-death', date: '1785-02-24', title: 'Father Dies', description: 'Charles Buonaparte dies of stomach cancer; Napoleon becomes family head at 15.' },
    { id: 'nap-ecole-militaire', date: '1784-10-30', title: 'École Militaire Paris', description: 'Admitted to École Militaire in Paris; graduates as artillery officer.' },
    { id: 'nap-lieutenant', date: '1785-09-01', title: 'Artillery Lieutenant', description: 'Commissioned as second lieutenant in artillery regiment at Valence.' },
    
    // Revolutionary period
    { id: 'nap-revolution', date: '1789-07-14', title: 'French Revolution Begins', description: 'Storming of Bastille; Napoleon supports revolutionary ideals initially.' },
    { id: 'nap-corsica-return', date: '1791-09-01', title: 'Returns to Corsica', description: 'Takes leave to return to Corsica; involves in local politics.' },
    { id: 'nap-captain', date: '1792-02-06', title: 'Promoted to Captain', description: 'Military promotion; reputation growing in revolutionary army.' },
    { id: 'nap-paoli-break', date: '1793-06-11', title: 'Breaks with Paoli', description: 'Conflicts with Corsican independence leader; family flees to mainland France.' },
    { id: 'nap-toulon', date: '1793-12-19', title: 'Siege of Toulon Victory', description: 'Brilliant artillery tactics recapture Toulon from royalists and British.' },
    { id: 'nap-brigadier', date: '1793-12-22', title: 'Promoted to Brigadier', description: 'Youngest general in French army at 24; nicknamed "Little Corporal".' },
    
    // Rise to power
    { id: 'nap-thermidor', date: '1794-07-27', title: 'Robespierre Falls', description: 'Thermidorian Reaction ends Terror; Napoleon briefly imprisoned then released.' },
    { id: 'nap-13-vendemiaire', date: '1795-10-05', title: '13 Vendémiaire', description: 'Suppresses royalist uprising in Paris with "whiff of grapeshot".' },
    { id: 'nap-josephine-meet', date: '1795-10-15', title: 'Meets Josephine', description: 'Meets Joséphine de Beauharnais at salon; begins passionate courtship.' },
    { id: 'nap-italy-command', date: '1796-03-02', title: 'Army of Italy Command', description: 'Given command of Army of Italy; begins brilliant Italian campaigns.' },
    { id: 'nap-josephine-marry', date: '1796-03-09', title: 'Marries Josephine', description: 'Civil marriage to Joséphine de Beauharnais in Paris.' },
    { id: 'nap-lodi', date: '1796-05-10', title: 'Battle of Lodi', description: 'Victory establishes reputation; soldiers nickname him "Le Petit Caporal".' },
    { id: 'nap-arcole', date: '1796-11-17', title: 'Battle of Arcole', description: 'Famous victory where he reportedly seized battle flag on bridge.' },
    { id: 'nap-rivoli', date: '1797-01-14', title: 'Battle of Rivoli', description: 'Decisive victory over Austrians in Italian campaign.' },
    { id: 'nap-campo-formio', date: '1797-10-17', title: 'Treaty of Campo Formio', description: 'Napoleon negotiates peace with Austria; gains European recognition.' },
    
    // Egyptian campaign and coup
    { id: 'nap-egypt-campaign', date: '1798-05-19', title: 'Egyptian Campaign', description: 'Departs for Egypt with expedition; seeks to strike at British trade.' },
    { id: 'nap-pyramids', date: '1798-07-21', title: 'Battle of the Pyramids', description: '"Soldiers, forty centuries look down upon you!" Victory over Mamluks.' },
    { id: 'nap-nile', date: '1798-08-01', title: 'Battle of the Nile', description: 'Nelson destroys French fleet; Napoleon\'s army stranded in Egypt.' },
    { id: 'nap-syria', date: '1799-02-10', title: 'Syrian Campaign', description: 'Attempts to conquer Syria; siege of Acre fails against British support.' },
    { id: 'nap-egypt-return', date: '1799-10-09', title: 'Returns from Egypt', description: 'Abandons army and returns secretly to France; warmly received.' },
    { id: 'nap-18-brumaire', date: '1799-11-09', title: '18 Brumaire Coup', description: 'Overthrows Directory with Sieyès and others; becomes First Consul.' },
    
    // Consulate period
    { id: 'nap-constitution', date: '1799-12-13', title: 'Constitution of Year VIII', description: 'New constitution makes Napoleon First Consul with executive power.' },
    { id: 'nap-marengo', date: '1800-06-14', title: 'Battle of Marengo', description: 'Victory over Austrians secures his political position; "I make my own luck".' },
    { id: 'nap-concordat', date: '1801-07-15', title: 'Concordat with Pope', description: 'Agreement with Pope Pius VII restores Catholic Church in France.' },
    { id: 'nap-consul-life', date: '1802-08-02', title: 'Consul for Life', description: 'Senate makes him Consul for Life; further centralizes power.' },
    { id: 'nap-civil-code', date: '1804-03-21', title: 'Civil Code (Code Napoléon)', description: 'Revolutionary legal code exported worldwide; greatest civilian achievement.' },
    
    // Empire and family arrangements
    { id: 'nap-emperor', date: '1804-05-18', title: 'Proclaimed Emperor', description: 'Senate proclaims him Emperor of the French; establishes new dynasty.' },
    { id: 'nap-coronation', date: '1804-12-02', title: 'Coronation', description: 'Crowns himself Emperor at Notre-Dame; Pope Pius VII attends ceremony.' },
    { id: 'nap-austerlitz', date: '1805-12-02', title: 'Battle of Austerlitz', description: '"Battle of Three Emperors"; masterpiece defeat of Austria and Russia.' },
    { id: 'nap-jerome-king', date: '1807-07-07', title: 'Jerome Made King', description: 'Brother Jerome becomes King of Westphalia; family dynasty expands.' },
    { id: 'nap-louis-king', date: '1806-06-05', title: 'Louis Made King', description: 'Brother Louis becomes King of Holland; resists Napoleon\'s policies.' },
    { id: 'nap-joseph-king', date: '1808-06-06', title: 'Joseph Made King', description: 'Brother Joseph becomes King of Spain; unpopular Spanish appointment.' },
    
    // Children and succession
    { id: 'nap-divorce', date: '1809-12-15', title: 'Divorces Josephine', description: 'Divorces Joséphine for lack of heir; seeks Austrian marriage alliance.' },
    { id: 'nap-marie-louise', date: '1810-04-01', title: 'Marries Marie-Louise', description: 'Marries Archduchess Marie-Louise of Austria; seeking Habsburg legitimacy.' },
    { id: 'nap-son-birth', date: '1811-03-20', title: 'Napoleon II Born', description: 'Son born to Marie-Louise; titled King of Rome; ensures succession.' },
    
    // Downfall
    { id: 'nap-russia', date: '1812-06-24', title: 'Invades Russia', description: 'Grande Armée crosses Niemen; begins disastrous Russian campaign.' },
    { id: 'nap-moscow', date: '1812-09-14', title: 'Occupies Moscow', description: 'Enters empty, burning Moscow; Tsar refuses to negotiate.' },
    { id: 'nap-retreat', date: '1812-10-19', title: 'Retreat from Moscow', description: 'Begins catastrophic winter retreat; most of army perishes.' },
    { id: 'nap-leipzig', date: '1813-10-19', title: 'Battle of Leipzig', description: '"Battle of Nations"; decisive defeat by coalition forces.' },
    { id: 'nap-abdication', date: '1814-04-06', title: 'First Abdication', description: 'Abdicates unconditionally; exiled to Elba with small sovereignty.' },
    { id: 'nap-hundred-days', date: '1815-03-01', title: 'Hundred Days Begin', description: 'Escapes Elba and returns to France; Louis XVIII flees.' },
    { id: 'nap-waterloo', date: '1815-06-18', title: 'Battle of Waterloo', description: 'Final defeat by Wellington and Blücher; end of military career.' },
    { id: 'nap-second-abdication', date: '1815-06-22', title: 'Second Abdication', description: 'Abdicates again after Waterloo; hopes to go to America.' },
    
    // St. Helena and death
    { id: 'nap-st-helena', date: '1815-10-17', title: 'Exiled to St. Helena', description: 'British exile him to remote South Atlantic island; begins memoirs.' },
    { id: 'nap-death', date: '1821-05-05', title: 'Napoleon Dies', description: 'Dies at age 51 on St. Helena; probable stomach cancer like father.' },
    
    // Significant children's later fates
    { id: 'nap-son-death', date: '1832-07-22', title: 'Napoleon II Dies', description: 'Son dies of tuberculosis at 21 in Vienna; dynasty hopes end.' }
  ];
  return events;
}
