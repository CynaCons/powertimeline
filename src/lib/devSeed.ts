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
    next.push({ id: (Date.now()+Math.random()+i).toString(36), date: d, title: `Random Event ${next.length+1}`, description: randLorem(8) + ' ' + randLorem(6) + ' ' + randLorem(4) });
  }
  return next;
}
// Incremental testing function for gradual event addition at random timepoints
export function seedIncremental(prev: Event[], addCount: number): Event[] {
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
  
  // Always add the requested number of events
  for (let i = 0; i < addCount; i++) {
    const eventNumber = result.length + 1;
    const timestamp = Date.now();
    const randomSeed = Math.random();
    
    // Generate random date within the timeline range
    const randomTime = minDate + Math.random() * (maxDate - minDate);
    const randomDate = new Date(randomTime);
    
    // Varied event types for clustering testing with longer descriptions
    const eventTypes = [
      { prefix: 'Meeting', desc: 'Comprehensive team meeting to discuss project progress, review current milestones, address blocking issues, and plan next steps for the upcoming sprint. Key stakeholders will present updates on their respective areas and we will coordinate cross-team dependencies.' },
      { prefix: 'Review', desc: 'Detailed code review session with development team members covering recent pull requests, architectural decisions, and best practices. We will examine code quality, performance implications, security considerations, and ensure adherence to coding standards.' },
      { prefix: 'Planning', desc: 'Strategic planning session for upcoming milestones including resource allocation, timeline estimation, risk assessment, and stakeholder alignment. We will define success criteria, identify potential blockers, and establish communication protocols for the next phase.' },
      { prefix: 'Demo', desc: 'Product demonstration for stakeholders and clients showcasing new features, user experience improvements, and technical capabilities. This will include live demonstrations, Q&A sessions, and gathering feedback for future iterations and enhancements.' },
      { prefix: 'Training', desc: 'Comprehensive training session covering new tools, processes, and methodologies being adopted by the team. This will include hands-on workshops, documentation review, best practices sharing, and knowledge transfer from experienced team members.' },
      { prefix: 'Launch', desc: 'Product launch event with marketing coordination, press releases, customer communications, and post-launch monitoring. We will coordinate with multiple teams to ensure smooth deployment, track key metrics, and respond to any issues that arise.' },
      { prefix: 'Analysis', desc: 'In-depth data analysis and performance review session examining user metrics, system performance, business KPIs, and customer feedback. We will identify trends, opportunities for improvement, and data-driven recommendations for future development priorities.' },
      { prefix: 'Workshop', desc: 'Interactive workshop for skill development covering industry best practices, new technologies, collaborative techniques, and professional growth opportunities. Participants will engage in hands-on activities, group discussions, and practical exercises.' }
    ];
    
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const uniqueId = `inc-${timestamp}-${randomSeed.toString(36).substr(2, 5)}-${i}`;
    
    result.push({
      id: uniqueId,
      title: `${eventType.prefix} ${eventNumber}`,
      description: eventType.desc,
      date: randomDate.toISOString().slice(0, 10)
    });
  }
  
  return result;
}

export function seedClustered(prev: Event[]): Event[] {
  const next = [...prev]; const centers = [-10,0,12].map(o => Date.now()+o*dayMs); let idx=1;
  for (let ci=0; ci<centers.length; ci++) for (let i=0;i<10;i++) { const jitter = (Math.floor(Math.random()*7)-3)*dayMs; const d=new Date(centers[ci]+jitter).toISOString().slice(0,10); next.push({ id:(Date.now()+Math.random()+ci*100+i).toString(36), date:d, title:`Cluster ${ci+1}-${idx++}`, description:randLorem(8) + ' ' + randLorem(6) + ' ' + randLorem(5)});}  
  return next;
}
export function seedLongRange(prev: Event[]): Event[] {
  const start=new Date('2015-01-01').getTime(); const months=60; const next=[...prev];
  for (let i=0;i<months;i++){ const d=new Date(start+i*(dayMs*30)).toISOString().slice(0,10); next.push({ id:(Date.now()+Math.random()+i).toString(36), date:d, title:`Long Range Event ${i+1}`, description:randLorem(8) + ' ' + randLorem(7) + ' ' + randLorem(6)});} 
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

// Historical curated dataset: French Revolution comprehensive timeline inspired by Henri Guillemin's analysis.
// Detailed chronology from pre-revolutionary crisis to Napoleon's rise, emphasizing social dynamics and class struggle.
export function seedFrenchRevolutionTimeline(): Event[] {
  const events: Event[] = [
    // Pre-revolutionary tensions and crisis (1770s-1789)
    { id: 'fr-american-debt', date: '1776-07-04', title: 'American Independence Declared', description: 'France supports American Revolution, accumulating massive debt of 3.315 billion livres. This financial burden becomes a key trigger for the revolutionary crisis.' },
    { id: 'fr-necker-compte', date: '1781-02-01', title: 'Necker\'s Compte Rendu', description: 'Finance Minister Jacques Necker publishes first public accounting of royal finances, revealing massive debt and court expenditures. Public outcry over royal extravagance.' },
    { id: 'fr-diamond-necklace', date: '1785-08-31', title: 'Diamond Necklace Affair', description: 'Marie-Antoinette implicated in scandal involving 1.6 million livres diamond necklace. Public opinion turns decisively against the monarchy.' },
    { id: 'fr-assembly-notables', date: '1787-02-22', title: 'Assembly of Notables', description: 'Calonne convenes Assembly of Notables to approve new taxes. Privileged classes refuse to pay, deepening financial crisis and exposing royal weakness.' },
    { id: 'fr-day-of-tiles', date: '1788-06-07', title: 'Day of Tiles (Grenoble)', description: 'Popular uprising in Grenoble against royal authority. Citizens throw tiles from rooftops at royal troops, marking escalation of provincial resistance.' },
    { id: 'fr-estates-general-called', date: '1788-08-08', title: 'Estates-General Convoked', description: 'Louis XVI announces convocation of Estates-General for May 1789, first time since 1614. Admission of royal weakness sparks nationwide political awakening.' },
    { id: 'fr-what-is-third-estate', date: '1789-01-01', title: 'Sieyès Publishes "What is the Third Estate?"', description: 'Abbé Sieyès\' influential pamphlet: "What is the Third Estate? Everything. What has it been until now in the political order? Nothing. What does it want? To become something."' },
    { id: 'fr-marat-ami-du-peuple', date: '1789-09-12', title: 'Marat Launches "L\'Ami du Peuple"', description: 'Jean-Paul Marat begins radical newspaper: "I am the anger of the people!" Violent rhetoric demands blood of enemies. Popular press becomes weapon of revolution.' },
    { id: 'fr-pere-duchesne-hebert', date: '1790-11-01', title: 'Hébert\'s "Père Duchesne"', description: 'Jacques Hébert launches ultra-radical "Père Duchesne" newspaper. Crude language appeals to sans-culottes: "Great anger of Père Duchesne!" Popular journalism radicalizes masses.' },
    { id: 'fr-camille-desmoulins-vieux', date: '1793-12-05', title: 'Camille Desmoulins: "Le Vieux Cordelier"', description: 'Camille Desmoulins publishes moderate "Le Vieux Cordelier": "My age is that of the good sans-culotte Jesus." Calls for clemency and end to Terror.' },
    { id: 'fr-babeuf-tribun', date: '1794-10-03', title: 'Babeuf\'s "Tribun du Peuple"', description: 'Gracchus Babeuf launches "Tribun du Peuple": "Nature gave every man equal right to enjoyment of all goods." First communist press demands economic equality.' },
    { id: 'fr-marat-death-to-enemies', date: '1792-09-19', title: 'Marat: "Death to Enemies"', description: 'Marat in "L\'Ami du Peuple": "Let the blood of traitors flow! That is the only way to save the country." Justifies September Massacres as popular justice.' },
    { id: 'fr-reveillon-riots', date: '1789-04-28', title: 'Réveillon Riots', description: 'Paris workers riot against wallpaper manufacturer Réveillon over wage cuts. First major popular uprising, suppressed with dozens killed, prefiguring revolutionary violence.' },

    // Opening of Revolution (May-July 1789)
    { id: 'fr-estates-general', date: '1789-05-05', title: 'Estates-General Convenes', description: 'First meeting at Versailles since 1614. Third Estate (97% of population) has same representation as privileged orders. Immediate conflict over voting procedures.' },
    { id: 'fr-tennis-court-oath', date: '1789-06-20', title: 'Tennis Court Oath', description: 'Third Estate deputies, locked out of meeting hall, gather at tennis court and swear not to disband until France has a constitution. Revolutionary act of defiance.' },
    { id: 'fr-national-assembly', date: '1789-06-17', title: 'National Assembly Declared', description: 'Third Estate declares itself the National Assembly, claiming to represent the nation. Revolutionary assumption of sovereignty from the monarchy.' },
    { id: 'fr-royal-session', date: '1789-06-23', title: 'Royal Session', description: 'Louis XVI attempts to reassert authority, ordering estates to meet separately. National Assembly refuses: "We are here by the will of the people and will only leave by force of bayonets."' },
    { id: 'fr-mirabeau-speech', date: '1789-06-25', title: 'Mirabeau\'s Defiance', description: 'Count Mirabeau delivers famous speech defying royal authority: "Go tell your master that we are here by the will of the people and that we will not leave except at the point of bayonets."' },
    { id: 'fr-robespierre-virtue-speech', date: '1794-02-05', title: 'Robespierre\'s "Virtue and Terror" Speech', description: 'Robespierre to Convention: "Terror is nothing other than justice, prompt, severe, inflexible; it is thus an emanation of virtue." Justifies Terror as moral necessity.' },
    { id: 'fr-saint-just-republic-speech', date: '1793-10-10', title: 'Saint-Just: "Republic of Virtue"', description: 'Saint-Just to Convention: "The Republic consists in the extermination of everything that opposes it." Defines revolutionary government as total transformation of society.' },
    { id: 'fr-danton-clemency-speech', date: '1794-03-30', title: 'Danton\'s Final Speech', description: 'Danton to Convention: "Show my head to the people, it is worth seeing." Defiant last words before execution. Calls for end of Terror: "No more blood!"' },
    { id: 'fr-fouquier-justice-speech', date: '1794-04-01', title: 'Fouquier-Tinville on Revolutionary Justice', description: 'Public Prosecutor: "Better to kill an innocent man than to spare a guilty one." Revolutionary Tribunal\'s logic of preventive terror reaches extreme.' },
    { id: 'fr-july-11-necker', date: '1789-07-11', title: 'Necker Dismissed', description: 'Louis XVI dismisses popular Finance Minister Necker. Paris erupts in protest, fearing counter-revolution. Beginning of revolutionary week leading to Bastille.' },
    { id: 'fr-july-12-camille', date: '1789-07-12', title: 'Camille Desmoulins\' Call to Arms', description: 'Young lawyer Camille Desmoulins calls Parisians to arms at Palais-Royal: "Citizens, there is not a moment to lose! I come from Versailles! Necker is dismissed!"' },
    { id: 'fr-july-13-customs', date: '1789-07-13', title: 'Paris Customs Barriers Burned', description: 'Angry crowds burn 40 of 60 customs barriers around Paris. Popular rage against taxes and royal authority spreads throughout the capital.' },
    { id: 'fr-invalides-raid', date: '1789-07-14', title: 'Invalides Raided for Arms', description: 'Morning of July 14: Parisians storm Invalides military hospital, seizing 28,000 muskets and 20 cannons. Now need gunpowder stored in Bastille.' },
    { id: 'fr-bastille', date: '1789-07-14', title: 'Storming of the Bastille', description: 'Fortress-prison stormed by Parisian crowd seeking gunpowder. Governor de Launay killed, head paraded on pike. Symbol of royal tyranny destroyed. Revolution begins.' },

    // Revolutionary momentum (July-October 1789)
    { id: 'fr-great-fear', date: '1789-07-20', title: 'Great Fear Begins', description: 'Peasant uprisings spread across France based on rumors of aristocratic conspiracy. Châteaux burned, feudal records destroyed. Rural revolution parallels urban uprising.' },
    { id: 'fr-august-4th', date: '1789-08-04', title: 'Night of August 4th', description: 'National Assembly abolishes feudalism in dramatic all-night session. Nobles renounce privileges in emotional speeches. "Feudalism is destroyed root and branch."' },
    { id: 'fr-declaration-rights', date: '1789-08-26', title: 'Declaration of Rights of Man', description: 'Assembly adopts Declaration of the Rights of Man and of the Citizen. "Men are born and remain free and equal in rights." Universal principles challenge Old Regime.' },
    { id: 'fr-september-veto', date: '1789-09-15', title: 'Royal Veto Debate', description: 'Assembly debates whether king should have absolute or suspensive veto over legislation. Compromise: king can delay laws for two legislatures. Royal power limited.' },
    { id: 'fr-october-march', date: '1789-10-05', title: 'Women\'s March on Versailles', description: 'Parisian women march to Versailles demanding bread and king\'s acceptance of August decrees. "We want the baker, the baker\'s wife, and the baker\'s boy!"' },
    { id: 'fr-october-6th', date: '1789-10-06', title: 'Royal Family to Paris', description: 'Crowd forces royal family to return to Paris. "We are bringing back the baker, the baker\'s wife and the baker\'s boy!" Popular sovereignty over monarchy established.' },

    // Constitutional Monarchy (1789-1792)
    { id: 'fr-church-nationalized', date: '1789-11-02', title: 'Church Property Nationalized', description: 'Assembly declares church property belongs to nation. Talleyrand proposes selling church lands to pay national debt. Fundamental attack on First Estate privileges.' },
    { id: 'fr-assignats-created', date: '1789-12-19', title: 'Assignats Created', description: 'Paper money backed by nationalized church property. Initially 400 million livres issued. Revolutionary financing that will later contribute to inflation crisis.' },
    { id: 'fr-religious-orders', date: '1790-02-13', title: 'Religious Orders Suppressed', description: 'Assembly suppresses monastic vows and religious orders except those devoted to education and charity. Revolutionary assault on traditional Catholic society.' },
    { id: 'fr-civil-constitution', date: '1790-07-12', title: 'Civil Constitution of Clergy', description: 'Clergy become civil servants elected by citizens and paid by state. Pope condemns law. Creates "refractory" vs. "constitutional" priest schism.' },
    { id: 'fr-federation-day', date: '1790-07-14', title: 'Festival of Federation', description: 'First anniversary celebration at Champ de Mars. Louis XVI swears oath to constitution before 300,000. High point of revolutionary unity and optimism.' },
    { id: 'fr-clergy-oath', date: '1790-11-27', title: 'Clerical Oath Imposed', description: 'Assembly requires all clergy to swear oath to Civil Constitution. Only 7 bishops and 55% of priests comply. Deep religious divide threatens revolutionary consensus.' },
    { id: 'fr-mirabeau-death', date: '1791-04-02', title: 'Mirabeau Dies', description: 'Count Mirabeau, key moderate leader and secret advisor to king, dies suddenly. Loss of crucial bridge between monarchy and revolution accelerates radicalization.' },
    { id: 'fr-varennes-flight', date: '1791-06-20', title: 'Flight to Varennes', description: 'Royal family attempts to flee France. Arrested at Varennes, brought back to Paris. King\'s treachery exposed, revolutionary republic becomes thinkable.' },
    { id: 'fr-champ-de-mars', date: '1791-07-17', title: 'Massacre of Champ de Mars', description: 'National Guard fires on crowd demanding king\'s abdication, killing 50. Marquis de Lafayette orders shooting. Split between moderate and radical revolutionaries.' },
    { id: 'fr-constitution-1791', date: '1791-09-03', title: 'Constitution of 1791 Adopted', description: 'Constitutional monarchy established. Separation of powers, limited suffrage (4.3 million "active citizens"). Moderate revolution attempts to end with monarchy preserved.' },
    { id: 'fr-legislative-assembly', date: '1791-10-01', title: 'Legislative Assembly Convenes', description: 'New elected assembly meets. Constitutional provision prevents re-election of Constituent Assembly members. Inexperienced deputies face mounting crises.' },

    // War and radicalization (1792)
    { id: 'fr-war-declaration', date: '1792-04-20', title: 'War Declared on Austria', description: 'Assembly declares war on Austria 7 votes to 10. Girondins seek to expose royal treachery, Jacobins oppose war. Beginning of 23 years of European warfare.' },
    { id: 'fr-brunswick-manifesto', date: '1792-07-25', title: 'Brunswick Manifesto', description: 'Prussian commander threatens to destroy Paris if royal family harmed. Backfires by convincing Parisians that king is colluding with enemies.' },
    { id: 'fr-july-11-patrie', date: '1792-07-11', title: 'Fatherland in Danger', description: 'Assembly declares "La Patrie en danger!" (Fatherland in Danger). Emergency measures mobilize population. Revolutionary patriotism reaches fever pitch.' },
    { id: 'fr-tuileries-assault', date: '1792-08-10', title: 'Storming of Tuileries', description: 'Parisians storm royal palace, massacre Swiss Guards. King takes refuge with Assembly. Monarchy effectively ends. Popular sovereignty triumphs over constitutional monarchy.' },
    { id: 'fr-august-10-aftermath', date: '1792-08-11', title: 'King Suspended', description: 'Assembly suspends king and calls for National Convention elected by universal male suffrage. Revolutionary government assumes power. Republic becomes inevitable.' },
    { id: 'fr-lafayette-flees', date: '1792-08-19', title: 'Lafayette Flees', description: 'Marquis de Lafayette, hero of two revolutions, flees to Austria after being denounced as traitor. Moderate phase of revolution definitively ends.' },
    { id: 'fr-longwy-falls', date: '1792-08-23', title: 'Longwy Falls to Prussians', description: 'Fortress of Longwy surrenders after brief bombardment. Panic in Paris as enemy approaches. Revolutionary patriotism and fear of treason intensify.' },
    { id: 'fr-verdun-falls', date: '1792-09-02', title: 'Verdun Falls', description: 'Key fortress of Verdun surrenders. Road to Paris open. Popular fury over treason and defeat triggers prison massacres. Revolution enters radical phase.' },
    { id: 'fr-september-massacres', date: '1792-09-02', title: 'September Massacres Begin', description: 'Parisians storm prisons, killing 1,200 prisoners over 5 days. Marat encourages violence: "The people\'s justice." Terror begins before the Terror.' },
    { id: 'fr-valmy', date: '1792-09-20', title: 'Battle of Valmy', description: 'French revolutionary army defeats Prussians. "From this place and this day forth commences a new epoch in the history of the world" - Goethe. Revolution saved.' },
    { id: 'fr-spire-captured', date: '1792-09-30', title: 'Spire Captured', description: 'Revolutionary forces capture German city of Spire. First French territorial conquest beyond natural frontiers. Revolutionary expansion begins in Holy Roman Empire.' },
    { id: 'fr-mainz-captured', date: '1792-10-21', title: 'Mainz Falls to French', description: 'French armies capture strategic fortress of Mainz on Rhine. Revolutionary republicanism spreads to German territories. Local Jacobin clubs established.' },
    { id: 'fr-frankfurt-threatened', date: '1792-10-23', title: 'Frankfurt Occupied', description: 'French forces briefly occupy Frankfurt am Main. Panic spreads through German states as revolutionary armies advance across Rhine.' },
    { id: 'fr-jemappes', date: '1792-11-06', title: 'Battle of Jemappes', description: 'General Dumouriez defeats Austrians in Belgium. Revolutionary army\'s first major offensive victory opens path to Brussels. "Marseillaise" sung during charge inspires troops.' },
    { id: 'fr-brussels-liberated', date: '1792-11-14', title: 'Brussels Liberated', description: 'French revolutionary army enters Brussels in triumph. Belgian patriots welcome liberation from Austrian rule. Revolutionary expansion meets local democratic enthusiasm.' },
    { id: 'fr-antwerp-falls', date: '1792-11-29', title: 'Antwerp Occupied', description: 'French forces capture major port of Antwerp. Scheldt River opened to international commerce, challenging British maritime dominance.' },
    { id: 'fr-nice-annexed', date: '1792-09-28', title: 'Nice Annexed', description: 'County of Nice votes to join French Republic. First territorial expansion through "popular will." Revolutionary France grows beyond ancient boundaries.' },
    { id: 'fr-savoy-annexed', date: '1792-11-27', title: 'Savoy Annexed', description: 'Duchy of Savoy incorporated into French Republic as Mont-Blanc department. Revolutionary expansion justified by popular sovereignty and natural frontiers.' },
    { id: 'fr-convention-meets', date: '1792-09-21', title: 'National Convention Meets', description: 'New assembly elected by universal male suffrage convenes. First act: unanimously abolishes monarchy. French Republic proclaimed.' },
    { id: 'fr-republic-proclaimed', date: '1792-09-22', title: 'Republic Proclaimed', description: 'September 22, 1792 becomes Day 1, Year I of French Republic. Revolutionary calendar begins new era. Complete break with monarchical past.' },

    // Republic and Terror (1792-1794)
    { id: 'fr-louis-trial-begins', date: '1792-12-11', title: 'King\'s Trial Begins', description: 'Louis XVI appears before Convention. Accused of treason and conspiracy against liberty. "Louis must die so that the fatherland may live" - Robespierre.' },
    { id: 'fr-louis-vote', date: '1793-01-15', title: 'Death Sentence Voted', description: 'Convention votes death penalty 387-334. King\'s brother (future Louis XVIII) and cousin Philippe-Égalité (Orléans) vote for death. Revolutionary justice over royal blood.' },
    { id: 'fr-louis-execution', date: '1793-01-21', title: 'Louis XVI Executed', description: 'King executed at Place de la Révolution (now Concorde). Last words: "I forgive those who are going to kill me. May my blood not fall upon France." Europe horrified.' },
    { id: 'fr-robespierre-king-speech', date: '1792-12-03', title: 'Robespierre: "Louis Must Die"', description: 'Robespierre to Convention: "Louis must die so that the fatherland may live." Argues king\'s death necessary for Republic\'s survival. No compromise with monarchy possible.' },
    { id: 'fr-vergniaud-girondins-speech', date: '1793-03-10', title: 'Vergniaud\'s Warning', description: 'Girondin leader Vergniaud: "The Revolution, like Saturn, devours its own children." Prophetic warning about Terror\'s tendency to consume revolutionaries themselves.' },
    { id: 'fr-war-britain', date: '1793-02-01', title: 'War with Britain Begins', description: 'Britain enters First Coalition against France. Revolutionary France now at war with most of Europe. "War to the châteaux, peace to the cottages!"' },
    { id: 'fr-aldenhoven', date: '1793-03-01', title: 'Battle of Aldenhoven', description: 'Austrian victory over French forces in preliminary to Neerwinden. Revolutionary offensive in Belgium begins to falter under professional enemy pressure.' },
    { id: 'fr-neerwinden', date: '1793-03-18', title: 'Battle of Neerwinden', description: 'Dumouriez suffers crushing defeat to Austrians. Revolutionary expansion in Belgium collapses. Military crisis deepens political divisions in Convention.' },
    { id: 'fr-mainz-siege-begins', date: '1793-04-14', title: 'Siege of Mainz Begins', description: 'Prussian forces besiege French-held Mainz. Key Rhine fortress under pressure. German revolutionary sympathizers trapped inside with French garrison.' },
    { id: 'fr-dumouriez-defection', date: '1793-04-05', title: 'Dumouriez Defects to Austria', description: 'Hero of Valmy and Jemappes betrays Republic, attempting to march on Paris. Fails to rally troops, flees to enemy. General treason paranoia grips revolutionary government.' },
    { id: 'fr-conde-falls', date: '1793-07-10', title: 'Condé Falls to Coalition', description: 'Strategic fortress of Condé captured by Austrian forces. Northern frontier under pressure as Coalition advances toward Paris region.' },
    { id: 'fr-valenciennes-siege', date: '1793-05-25', title: 'Siege of Valenciennes', description: 'Coalition forces besiege key northern fortress. Duke of York commands British contingent in major assault on French defenses.' },
    { id: 'fr-vendee-uprising', date: '1793-03-11', title: 'Vendée Uprising', description: 'Catholic and royalist peasants revolt in western France. "War of Giants" begins - brutal civil war alongside foreign war. Revolutionary government faces internal enemies.' },
    { id: 'fr-revolutionary-tribunal', date: '1793-03-10', title: 'Revolutionary Tribunal Created', description: 'Special court established to judge "enemies of the people." Prosecutor Fouquier-Tinville will send 2,600 to guillotine. Institutionalization of Terror begins.' },
    { id: 'fr-committee-public-safety', date: '1793-04-06', title: 'Committee of Public Safety Created', description: 'Executive committee of 12 members given emergency powers. Will become center of revolutionary dictatorship under Robespierre. "Revolutionary government until peace."' },
    { id: 'fr-cps-revolutionary-government', date: '1793-10-19', title: 'CPS: "Revolutionary Government Until Peace"', description: 'Committee of Public Safety declares: "Revolutionary government until peace." Suspends normal constitution. Emergency dictatorship justified by internal and external enemies.' },
    { id: 'fr-saint-just-revolutionary-order', date: '1794-02-26', title: 'Saint-Just: "Revolutionary Order"', description: 'Saint-Just for CPS: "The revolution must stop only with the perfection of happiness and public liberty." Terror as permanent condition until utopia achieved.' },
    { id: 'fr-carnot-victory-organization', date: '1793-09-23', title: 'Carnot: "Organizer of Victory"', description: 'Lazare Carnot to CPS: "From this moment, all French citizens are permanently requisitioned for army service." Total war mobilization transforms French society.' },
    { id: 'fr-cps-decree-suspects', date: '1793-09-17', title: 'CPS Decree: Law of Suspects', description: 'Committee decree defines "suspects" broadly: nobles, priests, relatives of émigrés, those who cannot prove civic virtue. Legal foundation for mass arrests.' },
    { id: 'fr-marat-assassination', date: '1793-07-13', title: 'Marat Assassinated', description: 'Jean-Paul Marat stabbed by Charlotte Corday in his bath. "Friend of the People" becomes revolutionary martyr. Funeral procession of 600,000 mourns radical journalist.' },
    { id: 'fr-robespierre-jacobins-virtue', date: '1794-05-07', title: 'Robespierre at Jacobins: "Virtue"', description: 'Robespierre to Jacobin Club: "Virtue without terror is powerless; terror without virtue is blind." Defines revolutionary morality as combination of idealism and violence.' },
    { id: 'fr-marat-jacobins-enemies', date: '1793-06-25', title: 'Marat at Jacobins: "Internal Enemies"', description: 'Marat to Jacobins: "Five or six hundred heads would have guaranteed your freedom." Calls for systematic elimination of counter-revolutionaries through popular violence.' },
    { id: 'fr-danton-jacobins-war', date: '1793-03-10', title: 'Danton at Jacobins: "Audacity"', description: 'Danton to Jacobins: "We need audacity, more audacity, always audacity!" Rallies Club for total war against internal and external enemies of revolution.' },
    { id: 'fr-hebert-jacobins-dechristianization', date: '1793-11-15', title: 'Hébert at Jacobins: "Crush Fanaticism"', description: 'Hébert to Jacobins: "We must tear out fanaticism by the roots!" Demands total dechristianization and elimination of religious "superstition" from France.' },
    { id: 'fr-hebert-pere-duchesne-war', date: '1793-09-20', title: 'Hébert: "Great Anger of Père Duchesne"', description: 'Hébert in "Père Duchesne": "The great anger of Père Duchesne against the enemies of the Republic!" Crude sans-culotte language rallies popular classes for Terror.' },
    { id: 'fr-robespierre-monitor-speech', date: '1794-02-26', title: 'Robespierre in "Le Moniteur"', description: 'Robespierre published in official "Le Moniteur": "Terror is only justice prompt, severe, and inflexible." Government press justifies systematic violence as virtue.' },
    { id: 'fr-couthon-jacobins-republic', date: '1794-01-15', title: 'Couthon at Jacobins: "Republic of Virtue"', description: 'Couthon to Jacobins: "The Republic will be virtuous or it will not be." Jacobin vision of moral regeneration through political terror and social transformation.' },
    { id: 'fr-levee-en-masse', date: '1793-08-23', title: 'Levée en Masse Decreed', description: 'Mass conscription mobilizes entire French nation for war. "Young men fight, married men make weapons, women make tents, children make bandages, old men preach hatred of enemies." Total war begins.' },
    { id: 'fr-lyon-siege-begins', date: '1793-08-09', title: 'Siege of Lyon Begins', description: 'Federalist Lyon rebels against Convention. "Lyon made war on liberty, Lyon no longer exists." Brutal siege precedes mass executions and city\'s symbolic destruction.' },
    { id: 'fr-hondschoote', date: '1793-09-08', title: 'Battle of Hondschoote', description: 'French victory lifts siege of Dunkirk. Revolutionary armies begin to turn tide. Mass conscription and patriotic fervor overcome professional enemy forces.' },
    { id: 'fr-marie-antoinette-trial', date: '1793-10-14', title: 'Marie-Antoinette Tried', description: 'Former queen appears before Revolutionary Tribunal. Accused of intelligence with foreign enemies. Dignified bearing wins some sympathy but not mercy.' },
    { id: 'fr-marie-antoinette-execution', date: '1793-10-16', title: 'Marie-Antoinette Executed', description: 'Former queen executed at Place de la Révolution. Hands tied, hair cut, drawn in common cart. "Madame Deficit" pays ultimate price for royal extravagance.' },
    { id: 'fr-girondins-execution', date: '1793-10-31', title: 'Girondins Executed', description: '22 Girondin deputies executed for "federalism" and opposition to Jacobin centralization. Moderate republicans eliminated. Revolution "devours its children."' },
    { id: 'fr-dechristianization', date: '1793-11-07', title: 'Festival of Reason', description: 'Notre-Dame Cathedral converted to Temple of Reason. Goddess of Reason (actress) enthroned. Radical dechristianization campaign attacks Catholic faith directly.' },
    { id: 'fr-maximum-law', date: '1793-09-29', title: 'General Maximum Decreed', description: 'Price and wage controls imposed nationwide. Economic terror parallels political terror. State intervention against market forces to ensure bread for people.' },
    { id: 'fr-revolutionary-calendar', date: '1793-10-05', title: 'Revolutionary Calendar Adopted', description: 'Convention adopts new calendar with Year I beginning Sept 22, 1792. Ten-day weeks, renamed months, new era begins. Attempt to revolutionize time itself and break with Christian tradition.' },
    { id: 'fr-lyon-falls', date: '1793-10-09', title: 'Lyon Surrenders', description: 'Federalist stronghold falls to republican siege. Mass executions follow: "Lyon no longer exists." Collot d\'Herbois orders cannon-fire executions. Revolutionary justice becomes vengeance.' },
    { id: 'fr-wattignies', date: '1793-10-16', title: 'Battle of Wattignies', description: 'French victory relieves Maubeuge siege. Revolutionary armies prove themselves against professional Coalition forces. Lazare Carnot\'s military organization shows results.' },
    { id: 'fr-olympe-de-gouges', date: '1793-11-03', title: 'Olympe de Gouges Executed', description: 'Feminist author of "Declaration of Rights of Woman" executed. "Woman has the right to mount the scaffold, she must also have the right to mount the tribune" - her prophetic words.' },
    { id: 'fr-philippe-egalite', date: '1793-11-06', title: 'Philippe Égalité Executed', description: 'Louis XVI\'s cousin, Duke of Orléans, executed despite voting for king\'s death. Revolutionary purity demands elimination of all royal blood. Jacobins turn against former allies.' },
    { id: 'fr-madame-roland', date: '1793-11-08', title: 'Madame Roland Executed', description: 'Girondin salon hostess executed. Famous last words: "Liberty, what crimes are committed in thy name!" Intellectual women become targets of masculine Jacobin virtue.' },
    { id: 'fr-nantes-drownings', date: '1793-11-16', title: 'Nantes Drownings Begin', description: 'Jean-Baptiste Carrier orders mass drownings (noyades) in Loire River. Hundreds of prisoners loaded onto barges and sunk. "Republican marriages" - men and women tied together before drowning.' },
    { id: 'fr-gobel-abdication', date: '1793-11-07', title: 'Bishop Gobel Abdicates', description: 'Constitutional Bishop of Paris Jean-Baptiste Gobel renounces his episcopal functions before Convention. Symbol of dechristianization campaign\'s success in terrorizing clergy.' },
    { id: 'fr-feast-reason-provinces', date: '1793-11-20', title: 'Festival of Reason Spreads', description: 'Dechristianization spreads to provinces as local authorities stage Festivals of Reason. Churches converted to Temples of Reason nationwide. Traditional religion under systematic attack.' },
    { id: 'fr-commune-dechristianization', date: '1793-11-23', title: 'Paris Commune Closes Churches', description: 'Paris Commune orders closure of all churches in capital. Radical dechristianization reaches peak intensity. Religious practice driven underground or eliminated.' },
    { id: 'fr-robespierre-religious-speech', date: '1793-11-21', title: 'Robespierre Opposes Dechristianization', description: 'Robespierre warns against excessive dechristianization: "Atheism is aristocratic." Tension emerges between moderate and ultra-revolutionary religious policies.' },
    { id: 'fr-paul-fouche', date: '1793-10-10', title: 'Fouché\'s Atheist Decree', description: 'Joseph Fouché posts atheist proclamation at Nevers cemetery: "Death is eternal sleep." Radical dechristianization challenges traditional afterlife beliefs.' },
    { id: 'fr-vendee-december-battles', date: '1793-12-12', title: 'Battle of Le Mans', description: 'Republican forces crush Vendée army attempting to reach English Channel. Mass slaughter of rebels and civilians. "War of extermination" intensifies in western France.' },
    { id: 'fr-savenay-massacre', date: '1793-12-23', title: 'Massacre at Savenay', description: 'Final destruction of main Vendée army. Thousands of prisoners executed after surrender. Republican general Westermann reports: "There is no more Vendée."' },
    { id: 'fr-robert-execution', date: '1793-11-08', title: 'Louise Robert Executed', description: 'Louise Félicité Robert, feminist writer and Girondin supporter, executed. Women\'s political activism increasingly seen as dangerous to masculine republican virtue.' },
    { id: 'fr-brissot-execution', date: '1793-10-31', title: 'Brissot Executed with Girondins', description: 'Jacques Pierre Brissot, leading Girondin and war advocate, executed with 21 colleagues. Moderate republican faction eliminated by Jacobin dictatorship.' },
    { id: 'fr-maximum-enforcement', date: '1793-11-05', title: 'Maximum Law Enforcement', description: 'Harsh penalties introduced for Maximum Law violations. Death penalty for hoarding or price speculation. Economic terror parallels political terror.' },
    { id: 'fr-revolutionary-army-creation', date: '1793-09-09', title: 'Revolutionary Army Created', description: 'Parisian Revolutionary Army established to enforce grain requisitions and suppress counter-revolution in countryside. Armed force of urban sans-culottes.' },
    { id: 'fr-hebert-escalation', date: '1793-12-15', title: 'Hébert Demands More Terror', description: 'Jacques Hébert demands intensification of Terror and dechristianization. Ultra-radical faction pushes for complete destruction of Old Regime remnants.' },
    { id: 'fr-danton-return', date: '1793-11-20', title: 'Danton Returns from Retirement', description: 'Georges Danton returns to Paris from countryside retirement. Shocked by Terror\'s escalation, begins organizing moderate opposition. "Enough blood has flowed!"' },
    { id: 'fr-robespierre-cps-dominance', date: '1793-10-10', title: 'Robespierre Dominates CPS', description: 'Robespierre consolidates control over Committee of Public Safety. Sidelines rivals like Hérault de Séchelles. "The Committee must speak with one voice."' },
    { id: 'fr-indulgent-faction-forms', date: '1793-12-01', title: 'Indulgent Faction Forms', description: 'Moderate faction led by Danton and Camille Desmoulins coalesces around clemency demands. "Let us be terrible so we may spare the people of being so."' },
    { id: 'fr-exageres-faction-forms', date: '1793-11-10', title: 'Exagérés Faction Consolidates', description: 'Ultra-radical faction (Exagérés) led by Hébert, Chaumette consolidates. Demands total dechristianization and economic terror. Opposes any moderation.' },
    { id: 'fr-robespierre-religious-moderation', date: '1793-11-25', title: 'Robespierre\'s Religious Moderation', description: 'Robespierre breaks with Hébert over dechristianization at Jacobin Club: "The idea of Supreme Being and immortality of soul is a continual reminder of justice."' },
    { id: 'fr-danton-private-meetings', date: '1793-12-10', title: 'Danton\'s Private Opposition', description: 'Danton holds secret meetings criticizing Terror\'s excess. "The revolution must know when to stop." Robespierre\'s spies report back on moderate conspiracy.' },
    { id: 'fr-herault-sidelined', date: '1793-12-01', title: 'Hérault de Séchelles Sidelined', description: 'Aristocratic CPS member Hérault de Séchelles marginalized by Robespierre. Suspected of moderation and secret royalist sympathies. Power base crumbling.' },
    { id: 'fr-toulon-siege-begins', date: '1793-09-18', title: 'Siege of Toulon Begins', description: 'Royalist Toulon admits British fleet. Republican army besieges vital naval port. Young artillery captain Bonaparte will make his reputation here with innovative tactics.' },
    { id: 'fr-toulon-liberated', date: '1793-12-19', title: 'Toulon Liberated', description: 'Bonaparte\'s artillery plan captures Toulon from British-royalist forces. "Little Corporal" promoted to brigadier-general at 24. Revolutionary warfare defeats professional navies.' },
    { id: 'fr-slavery-abolished', date: '1794-02-04', title: 'Slavery Abolished in Colonies', description: 'Convention abolishes slavery in all French colonies. "All men, without distinction of color, residing in the colonies, are French citizens with full rights." Revolutionary equality extends to colonies.' },
    { id: 'fr-ventose-decrees', date: '1794-02-26', title: 'Ventôse Decrees', description: 'Saint-Just proposes distributing suspects\' property to poor patriots. "Those who made revolution by halves dug their own graves." Social revolution threatens to follow political terror.' },
    { id: 'fr-fabre-execution', date: '1794-04-05', title: 'Fabre d\'Églantine Executed', description: 'Poet and politician Fabre d\'Églantine executed with Dantonists. Creator of Revolutionary Calendar months executed for financial corruption. Art serves politics, then politics destroys artist.' },
    { id: 'fr-camille-desmoulins', date: '1794-04-05', title: 'Camille Desmoulins Executed', description: 'Journalist who called for Bastille storming executed with Dantonists. Childhood friend of Robespierre destroyed for opposing Terror. Revolution consumes its early heroes.' },
    { id: 'fr-lucile-desmoulins', date: '1794-04-13', title: 'Lucile Desmoulins Executed', description: 'Wife of Camille Desmoulins executed for "conspiracy." Young mother becomes victim of revolutionary paranoia. Terror destroys families along with politics.' },
    { id: 'fr-anacharsis-cloots', date: '1794-03-24', title: 'Anacharsis Cloots Executed', description: 'Prussian-born "Orator of Human Race" executed with Hébertists. Cosmopolitan revolutionary destroyed by nationalist paranoia. Universal revolution yields to French chauvinism.' },
    { id: 'fr-vincent-execution', date: '1794-03-24', title: 'François-Nicolas Vincent Executed', description: 'War Ministry secretary executed with Hébertists. Ultra-radical faction eliminated. Robespierre consolidates power by destroying both left and right opposition.' },
    { id: 'fr-ronsin-execution', date: '1794-03-24', title: 'Charles-Philippe Ronsin Executed', description: 'Commander of Revolutionary Army executed with Hébertists. Military arm of ultra-radical faction eliminated. Professional army replaces political militants.' },
    { id: 'fr-momoro-execution', date: '1794-03-24', title: 'Antoine-François Momoro Executed', description: 'Printer who coined phrase "Liberty, Equality, Fraternity" executed with Hébertists. Revolutionary slogan creator destroyed by revolutionary terror.' },
    { id: 'fr-gobel-execution', date: '1794-04-13', title: 'Jean-Baptiste Gobel Executed', description: 'Constitutional Bishop who abdicated executed despite dechristianization service. Even religious collaborators not safe from Terror\'s paranoid logic.' },
    { id: 'fr-carrier-recalled', date: '1794-02-08', title: 'Carrier Recalled from Nantes', description: 'Jean-Baptiste Carrier recalled from Nantes after excessive drownings. Even Terror\'s agents go too far. Moderation begins to reassert itself.' },
    { id: 'fr-saint-just-alsace', date: '1794-01-25', title: 'Saint-Just Returns from Alsace', description: 'Louis Antoine Saint-Just returns from successful mission to Army of Rhine. Military purges and reorganization show results. Revolutionary discipline creates effective armies.' },
    { id: 'fr-danton-desmoulins-alliance', date: '1794-01-10', title: 'Danton-Desmoulins Alliance', description: 'Danton and Camille Desmoulins coordinate moderate strategy. "Le Vieux Cordelier" articles support Danton\'s clemency campaign. Joint offensive against Terror\'s excesses.' },
    { id: 'fr-hebert-denunciations', date: '1794-02-01', title: 'Hébert\'s Denunciations Escalate', description: 'Hébert intensifies attacks on "indulgent" moderates in "Père Duchesne." Calls Danton and Desmoulins "false patriots" and "hidden counter-revolutionaries."' },
    { id: 'fr-robespierre-strategic-silence', date: '1794-01-20', title: 'Robespierre\'s Strategic Silence', description: 'Robespierre avoids taking sides between Hébert and Danton factions. Strategic silence while planning to eliminate both wings that threaten his position.' },
    { id: 'fr-cps-internal-tensions', date: '1794-02-10', title: 'CPS Internal Tensions', description: 'Committee of Public Safety splits over factional warfare. Billaud-Varenne supports Hébert, Saint-Just supports Robespierre, Barère seeks middle ground.' },
    { id: 'fr-jacobin-loyalty-tests', date: '1794-02-15', title: 'Jacobin Club Loyalty Tests', description: 'Robespierre uses Jacobin Club to test member loyalty. Those supporting either Hébert or Danton face scrutiny. "The Club must remain pure."' },
    { id: 'fr-hebert-commune-power', date: '1794-01-15', title: 'Hébert\'s Commune Power Play', description: 'Hébert attempts to use Paris Commune against CPS moderates. Chaumette supports radical takeover attempt. Direct challenge to Convention authority.' },
    { id: 'fr-danton-public-clemency', date: '1794-02-20', title: 'Danton\'s Public Clemency Appeal', description: 'Danton openly calls for end to Terror in Convention speech: "Let us economize human blood!" Direct confrontation with Robespierre\'s policies.' },
    { id: 'fr-turreau-columns', date: '1794-01-17', title: 'Turreau\'s Infernal Columns', description: 'General Turreau launches "infernal columns" through Vendée. Systematic devastation of rebel regions. "War of extermination" reaches peak brutality in western France.' },
    { id: 'fr-paris-commune-purged', date: '1794-03-28', title: 'Paris Commune Purged', description: 'Robespierre purges ultra-radical elements from Paris Commune. Hébertist stronghold eliminated. Central government asserts control over local radicalism.' },
    { id: 'fr-dechristianization-ends', date: '1794-04-20', title: 'Dechristianization Campaign Ends', description: 'Official end of dechristianization campaign. Robespierre\'s religious moderation triumphs over atheist extremism. Cult of Supreme Being replaces radical atheism.' },
    { id: 'fr-prison-conspiracy', date: '1794-05-20', title: 'Prison "Conspiracy" Discovered', description: 'Alleged conspiracy in Luxembourg prison fabricated to justify more executions. Terror\'s paranoid logic requires constant discovery of new enemies.' },
    { id: 'fr-cecile-renault', date: '1794-06-23', title: 'Cécile Renault Affair', description: 'Young woman\'s alleged assassination attempt on Robespierre used to justify increased Terror. Fabricated plots serve Terror\'s need for enemies.' },
    { id: 'fr-batz-conspiracy', date: '1794-06-18', title: 'Baron de Batz "Conspiracy"', description: 'Alleged royalist conspiracy led by Baron de Batz used to justify Great Terror. Real or imagined plots fuel revolutionary paranoia.' },
    { id: 'fr-glorious-first-june', date: '1794-06-01', title: 'Glorious First of June', description: 'Major naval battle between British and French fleets. Strategic French victory as grain convoy from America reaches France safely, despite tactical British success. Revolution saved by American wheat.' },
    { id: 'fr-terror-order', date: '1793-09-05', title: 'Terror "Order of the Day"', description: 'Convention places terror "on the order of the day." Systematic repression begins. "Let us make terror the order of the day to save the people from it."' },
    { id: 'fr-law-suspects', date: '1793-09-17', title: 'Law of Suspects', description: 'Broad definition of "suspects" subject to arrest: nobles, priests, foreign agents, those who cannot prove civic virtue. Foundation of Terror\'s legal framework.' },
    { id: 'fr-carrier-arrives-nantes', date: '1793-10-08', title: 'Carrier Arrives in Nantes', description: 'Jean-Baptiste Carrier sent to suppress Vendée rebellion in Nantes. Begins systematic drownings in Loire River - the infamous "noyades" targeting prisoners and clergy.' },
    { id: 'fr-chalier-executed', date: '1793-07-16', title: 'Chalier Executed in Lyon', description: 'Joseph Chalier, Jacobin leader of Lyon, executed by Federalist rebels. His death becomes rallying cry for republican reconquest of the rebellious city.' },
    { id: 'fr-cord-day', date: '1793-07-13', title: 'Corday Executed', description: 'Charlotte Corday executed for Marat\'s assassination. Final words: "I killed one man to save 100,000." Becomes symbol of counter-revolutionary resistance to Terror.' },
    { id: 'fr-caen-rebellion', date: '1793-07-20', title: 'Federalist Revolt in Caen', description: 'Caen joins Federalist rebellion against Paris Jacobins. Girondin refugees organize resistance. Provincial bourgeoisie oppose centralized Terror from capital.' },
    { id: 'fr-bordeaux-federalist', date: '1793-06-07', title: 'Bordeaux Joins Federalist Revolt', description: 'Commercial port of Bordeaux rebels against Convention. Merchant class fears economic controls and Terror. Provincial autonomy against Jacobin centralization.' },
    { id: 'fr-marseille-federalist', date: '1793-06-29', title: 'Marseille Federalist Revolt', description: 'Marseille rises against Montagnard tyranny. Sections arrest Jacobin representatives. Southern federalism challenges Paris hegemony over revolutionary process.' },
    { id: 'fr-custine-execution', date: '1793-08-28', title: 'General Custine Executed', description: 'General Adam Philippe Custine executed for military failures and suspected treason. Revolutionary paranoia targets unsuccessful commanders. Military subordinated to political terror.' },
    { id: 'fr-barbaroux-suicide', date: '1793-06-18', title: 'Barbaroux Flees Convention', description: 'Girondin leader Charles Barbaroux escapes arrest warrant, flees to organize provincial resistance. Later commits suicide rather than face guillotine.' },
    { id: 'fr-buzot-death', date: '1794-06-18', title: 'Buzot Found Dead', description: 'François Nicolas Léonard Buzot, prominent Girondin, found dead after months in hiding. Probable suicide to escape capture and execution.' },
    { id: 'fr-petion-death', date: '1794-06-18', title: 'Pétion Found Dead', description: 'Jérôme Pétion, former mayor of Paris and Girondin leader, found dead in Bordeaux countryside. Suicide or murder - escaped Terror through death.' },
    { id: 'fr-condorcet-death', date: '1794-03-28', title: 'Condorcet Dies in Prison', description: 'Marquis de Condorcet, philosopher and Girondin, dies in prison cell. Probable suicide by poison to avoid guillotine. Enlightenment ideals crushed by Terror.' },
    { id: 'fr-bailly-execution', date: '1793-11-12', title: 'Bailly Executed', description: 'Jean Sylvain Bailly, astronomer and first mayor of Paris, executed for "treason." Hero of early revolution becomes victim of radicalization. Science yields to politics.' },
    { id: 'fr-barnave-execution', date: '1793-11-29', title: 'Barnave Executed', description: 'Antoine Barnave, constitutional monarchist and early revolutionary leader, executed. Moderate constitutionalists eliminated by radical Terror.' },
    { id: 'fr-houchard-execution', date: '1793-11-15', title: 'General Houchard Executed', description: 'General Jean Nicolas Houchard executed despite victory at Hondschoote. Insufficient aggressiveness deemed treasonous. Revolutionary paranoia consumes military leadership.' },
    { id: 'fr-westermann-execution', date: '1794-04-05', title: 'General Westermann Executed', description: 'François Joseph Westermann, "Butcher of the Vendée," executed with Dantonists. His brutal pacification methods insufficient to save him from political purge.' },
    { id: 'fr-fouche-lyon-mission', date: '1793-10-12', title: 'Fouché\'s Mission to Lyon', description: 'Joseph Fouché sent to pacify Lyon after its fall. Orders mass executions by cannon fire. "We have made liberty triumph through despotism" - revolutionary extremism.' },
    { id: 'fr-collot-lyon', date: '1793-11-04', title: 'Collot d\'Herbois in Lyon', description: 'Georges Collot d\'Herbois arrives in Lyon for "republican justice." Mass executions continue - hundreds shot with cannons. "Lyon no longer exists, only Ville-Affranchie."' },
    { id: 'fr-barras-toulon', date: '1793-12-17', title: 'Barras Mission to Toulon', description: 'Paul Barras oversees Terror in recaptured Toulon. Mass executions of royalist sympathizers. Future Directory leader learns ruthless political methods.' },
    { id: 'fr-jourdan-wattignies', date: '1793-10-15', title: 'Jourdan\'s Preparation at Wattignies', description: 'Jean-Baptiste Jourdan prepares for Battle of Wattignies. Revolutionary general embodies citizen-soldier ideal. Professional competence serves revolutionary cause.' },
    { id: 'fr-carnot-organization', date: '1793-08-14', title: 'Carnot Organizes Victory', description: 'Lazare Carnot systematizes military organization as "Organizer of Victory." Rational administration and mass conscription create revolutionary military superiority.' },
    { id: 'fr-saint-just-mission', date: '1793-10-29', title: 'Saint-Just\'s Alsace Mission', description: 'Louis Antoine Saint-Just sent to purge Army of Rhine. Revolutionary discipline imposed on generals. "The enemy of the people" eliminated from military ranks.' },
    { id: 'fr-representants-en-mission', date: '1793-03-09', title: 'Representatives on Mission', description: 'Convention sends représentants en mission to provinces with unlimited powers. Revolutionary government bypasses traditional administration. Terror imposed from center.' },
    { id: 'fr-surveillance-committees', date: '1793-03-21', title: 'Revolutionary Surveillance Committees', description: 'Local surveillance committees established in all communes. Citizen surveillance of citizen behavior. Revolutionary paranoia institutionalized at grassroots level.' },
    { id: 'fr-hebert-trial-preparation', date: '1794-03-15', title: 'Hébert Trial Preparation', description: 'Saint-Just prepares charges against Hébert faction. Fabricates foreign conspiracy accusations. "The enemies of the people have revealed themselves."' },
    { id: 'fr-robespierre-hebert-speech', date: '1794-03-20', title: 'Robespierre\'s Anti-Hébert Speech', description: 'Robespierre denounces Hébert at Jacobins: "These false patriots seek to divide us." Strategic elimination of ultra-radical opposition begins.' },
    { id: 'fr-hebertists-executed', date: '1794-03-24', title: 'Hébertists Executed', description: 'Ultra-radical faction led by Hébert executed. Robespierre eliminates "ultra-revolutionaries" who threaten property and push dechristianization too far.' },
    { id: 'fr-convention-hebert-reaction', date: '1794-03-25', title: 'Convention Reacts to Hébert\'s Death', description: 'Mixed reactions in Convention to Hébert\'s execution. Some deputies relieved, others worry about Robespierre\'s growing power. "Who will be next?"' },
    { id: 'fr-danton-overconfidence', date: '1794-03-26', title: 'Danton\'s Fatal Overconfidence', description: 'Danton believes Hébert\'s elimination secures his position. Fails to recognize Robespierre\'s plan to eliminate both factions. "They dare not attack me."' },
    { id: 'fr-saint-just-danton-charges', date: '1794-03-30', title: 'Saint-Just Prepares Danton Charges', description: 'Saint-Just fabricates corruption charges against Danton. East India Company scandal, financial irregularities. "Corruption is counter-revolution."' },
    { id: 'fr-dantonists-executed', date: '1794-04-05', title: 'Dantonists Executed', description: 'Danton and "Indulgent" faction executed for opposing Terror. Robespierre eliminates moderate rivals. "The Revolution devours its children" - Danton\'s last words.' },
    { id: 'fr-chaumette-execution', date: '1794-04-13', title: 'Chaumette Executed', description: 'Pierre-Gaspard Chaumette, radical Paris Commune leader, executed. Dechristianization campaign leader falls victim to Robespierre\'s religious moderation.' },
    { id: 'fr-simon-execution', date: '1794-07-19', title: 'Antoine Simon Executed', description: 'Antoine Simon, cobbler and guardian of Dauphin (Louis XVII), executed. Common man elevated by revolution destroyed by its paranoia.' },
    { id: 'fr-mainz-falls', date: '1793-07-23', title: 'Mainz Surrenders', description: 'French garrison surrenders Mainz to Prussians after siege. German Jacobins evacuated to France. Revolutionary expansion in Germany collapses.' },
    { id: 'fr-valenciennes-falls', date: '1793-07-28', title: 'Valenciennes Falls', description: 'Key northern fortress falls to British-Austrian forces after siege. Northern frontier under severe threat. Coalition armies approach French heartland.' },
    { id: 'fr-quiberon-expedition', date: '1795-06-27', title: 'Quiberon Landing', description: 'British-supported royalist expedition lands at Quiberon peninsula. Émigré nobles and British troops attempt Vendée-style uprising in Brittany.' },
    { id: 'fr-hoche-quiberon', date: '1795-07-21', title: 'Hoche Defeats Quiberon', description: 'General Lazare Hoche crushes royalist invasion at Quiberon. 750 émigrés executed. Last major royalist military threat to Republic eliminated.' },
    { id: 'fr-tallien-thermidor', date: '1794-07-26', title: 'Tallien Prepares Attack', description: 'Jean-Lambert Tallien and other Thermidorians prepare to strike against Robespierre. Fear for their own lives motivates action against "tyrant."' },
    { id: 'fr-barras-thermidor', date: '1794-07-27', title: 'Barras Commands Force', description: 'Paul Barras commands National Guard forces during 9 Thermidor. Former Terrorist turns against Robespierre to save himself and end paranoia.' },
    { id: 'fr-lecointre-thermidor', date: '1794-07-25', title: 'Lecointre Joins Plot', description: 'Laurent Lecointre joins anti-Robespierre conspiracy. Provincial deputies rally against Parisian dictatorship and its excessive Terror.' },
    { id: 'fr-couthon-lyon-terror', date: '1793-11-20', title: 'Couthon Continues Lyon Terror', description: 'Georges Couthon succeeds Fouché in Lyon, continuing systematic destruction. "We must make Lyon disappear from the earth." Urban terrorism as political weapon.' },
    { id: 'fr-vadier-conspiracy', date: '1794-06-15', title: 'Vadier\'s Catherine Théot Affair', description: 'Marc Guillaume Vadier fabricates mystic plot against Robespierre involving prophetess Catherine Théot. Attempt to discredit Robespierre\'s religious ideas backfires.' },
    { id: 'fr-fleurus', date: '1794-06-26', title: 'Battle of Fleurus', description: 'Crushing French victory over Coalition forces. Belgium reconquered, Netherlands invaded. Revolutionary armies triumphant across all fronts. Military success makes Terror seem less necessary.' },
    { id: 'fr-supreme-being', date: '1794-06-08', title: 'Festival of Supreme Being', description: 'Robespierre\'s deist festival celebrates supreme being and immortality of soul. Attempt to create revolutionary religion. Robespierre seen as would-be dictator.' },
    { id: 'fr-prairial-law', date: '1794-06-10', title: 'Law of 22 Prairial', description: 'Terror intensified with simplified procedures, reduced defendants\' rights. Great Terror begins - 1,376 executed in 49 days. Revolutionary justice becomes mass killing.' },
    { id: 'fr-great-terror-begins', date: '1794-06-11', title: 'Great Terror Accelerates', description: 'Executions increase dramatically under Law of 22 Prairial. 1,376 people executed in 49 days. Revolutionary Tribunal becomes killing machine.' },
    { id: 'fr-andre-chenier', date: '1794-07-25', title: 'André Chénier Executed', description: 'Poet André Chénier executed just three days before Thermidor. Last victim of cultural Terror. French literature loses major talent to political paranoia.' },
    { id: 'fr-lavoisier-execution', date: '1794-05-08', title: 'Lavoisier Executed', description: 'Antoine Lavoisier, father of modern chemistry, executed as tax farmer. "Republic has no need of scientists." Revolutionary anti-intellectualism reaches peak.' },
    { id: 'fr-roucher-execution', date: '1794-07-25', title: 'Jean-Antoine Roucher Executed', description: 'Poet and translator executed with André Chénier. Literary persecution reaches climax just before Thermidor. Arts and letters crushed by political terror.' },
    { id: 'fr-emilie-sainte-amaranthe', date: '1794-06-17', title: 'Émilie Sainte-Amaranthe Executed', description: 'Seventeen-year-old girl executed with her mother for alleged conspiracy. Youth and beauty no protection from Terror\'s paranoid logic.' },
    { id: 'fr-julie-talma', date: '1794-05-09', title: 'Julie Talma Executed', description: 'Actress and wife of famous actor François-Joseph Talma executed. Theater world increasingly targeted by revolutionary puritanism.' },
    { id: 'fr-charlotte-robespierre-fears', date: '1794-07-20', title: 'Charlotte Robespierre\'s Fears', description: 'Maximilien\'s sister Charlotte expresses private fears about her brother\'s isolation. Even Robespierre family senses growing danger.' },
    { id: 'fr-deputy-fear-grows', date: '1794-05-01', title: 'Deputy Fear Intensifies', description: 'Convention deputies increasingly fear arbitrary arrest after factional eliminations. "No one is safe. Yesterday Hébert, today Danton, tomorrow us."' },
    { id: 'fr-billaud-collot-opposition', date: '1794-05-15', title: 'Billaud-Collot Opposition', description: 'Billaud-Varenne and Collot d\'Herbois begin distancing from Robespierre in CPS. Oppose Supreme Being cult and religious policy moderation.' },
    { id: 'fr-fouche-underground-organizing', date: '1794-06-01', title: 'Fouché\'s Underground Organizing', description: 'Joseph Fouché, recalled from Lyon, begins secret organizing against Robespierre. Coordinates with other recalled representatives fearing recall to Paris means death.' },
    { id: 'fr-cps-splits', date: '1794-06-15', title: 'Committee Paralysis', description: 'Committee of Public Safety increasingly paralyzed by internal divisions. Robespierre\'s allies (Saint-Just, Couthon) vs. opponents (Billaud, Collot, Carnot).' },
    { id: 'fr-robespierre-isolation', date: '1794-07-15', title: 'Robespierre\'s Growing Isolation', description: 'Robespierre stops attending Committee of Public Safety meetings. Isolation from former allies increases as Terror becomes unsustainable.' },
    { id: 'fr-secret-meetings-begin', date: '1794-06-20', title: 'Secret Anti-Robespierre Meetings', description: 'Deputies begin holding clandestine meetings to discuss removing Robespierre. Tallien, Fréron, Barras coordinate opposition. "The tyrant must fall."' },
    { id: 'fr-robespierre-paranoia', date: '1794-07-01', title: 'Robespierre\'s Increasing Paranoia', description: 'Robespierre sees conspiracies everywhere, trusts no one. Stops attending public functions. Plans major purge of Convention to eliminate enemies.' },
    { id: 'fr-convention-opposition', date: '1794-07-20', title: 'Convention Opposition Grows', description: 'Moderate deputies begin organizing against Robespierre. Fear for their own lives motivates action against "Incorruptible" dictator.' },
    { id: 'fr-fouquier-pressure', date: '1794-07-23', title: 'Fouquier-Tinville Under Pressure', description: 'Public Prosecutor Fouquier-Tinville complains about impossible execution quotas. Even Terror\'s administrators question its sustainability.' },
    { id: 'fr-economic-maximum-fails', date: '1794-07-01', title: 'Economic Maximum System Failing', description: 'Price control system increasingly undermined by black market. Economic terror proves as unsustainable as political terror.' },
    { id: 'fr-barere-shifts-allegiance', date: '1794-07-22', title: 'Barère Shifts Allegiance', description: 'Bertrand Barère, "Anacreon of Guillotine," begins distancing from Robespierre. Senses political winds changing, prepares to abandon former ally.' },
    { id: 'fr-convention-floor-tensions', date: '1794-07-24', title: 'Convention Floor Tensions', description: 'Heated exchanges in Convention as opposition grows bolder. Robespierre increasingly isolated on convention floor. Deputies avoid sitting near him.' },
    { id: 'fr-jacobin-final-confrontation', date: '1794-07-25', title: 'Final Jacobin Club Confrontation', description: 'Robespierre makes final speech at Jacobin Club warning of conspiracy. Billaud-Varenne confronts him directly. Club membership wavering.' },
    { id: 'fr-8-thermidor-plotting', date: '1794-07-26', title: 'Night of 8 Thermidor Plotting', description: 'Conspirators meet through night of 8 Thermidor finalizing plans. Tallien, Fouché, Collot coordinate Convention strategy. "Tomorrow we strike or die."' },
    { id: 'fr-robespierre-final-speech', date: '1794-07-26', title: 'Robespierre\'s Final Speech', description: 'Robespierre\'s rambling 2-hour speech to Convention attacks enemies without naming them. Threatens new purge. "I know my enemies... their day will come."' },
    { id: 'fr-saint-just-interrupted', date: '1794-07-27', title: 'Saint-Just Interrupted', description: 'Saint-Just attempts to defend Robespierre but is shouted down by Convention. "I am not allowed to speak!" First time Convention rebels against CPS.' },
    { id: 'fr-thermidor', date: '1794-07-27', title: '9 Thermidor - Robespierre Falls', description: 'Robespierre overthrown and arrested. Coalition of Thermidorians end his "tyranny." "The blood of Danton chokes you!" - Convention rebels against Terror.' },
    { id: 'fr-robespierre-execution', date: '1794-07-28', title: 'Robespierre Executed', description: 'Robespierre and 21 followers executed without trial. Crowds celebrate end of Terror. "Down with the Maximum! Down with the tyrant!" Reign of Terror ends.' },

    // Thermidorian Reaction and Directory (1794-1799)
    { id: 'fr-thermidorian-reaction', date: '1794-08-01', title: 'Thermidorian Reaction Begins', description: 'New government dismantles Terror apparatus. Revolutionary Tribunal reformed, prisons opened, maximum abolished. Moderate republic attempts to stabilize revolution.' },
    { id: 'fr-white-terror', date: '1795-05-01', title: 'White Terror in South', description: 'Royalist and Catholic reaction in southern France. Former Jacobins massacred. Revolutionary supporters persecuted. Counter-revolutionary violence mirrors Jacobin Terror.' },
    { id: 'fr-constitution-year-3', date: '1795-08-22', title: 'Constitution of Year III', description: 'New constitution establishes Directory - five-man executive. Property qualifications limit suffrage. Moderate republic tries to end revolution while preserving gains.' },
    { id: 'fr-13-vendemiaire', date: '1795-10-05', title: '13 Vendémiaire (Napoleon\'s "Whiff of Grapeshot")', description: 'General Bonaparte disperses royalist uprising in Paris with artillery. "Whiff of grapeshot" ends royalist threat but brings military into politics. Napoleon\'s first coup.' },
    { id: 'fr-directory-begins', date: '1795-11-02', title: 'Directory Period Begins', description: 'Five-man Directory takes power. Moderate republic seeks stability between royalist reaction and Jacobin democracy. Weak government faces mounting problems.' },
    { id: 'fr-italian-campaign', date: '1796-04-12', title: 'Bonaparte\'s Italian Campaign', description: 'Young General Bonaparte wins spectacular victories in Italy. Brings glory and loot to Republic. Military success overshadows civilian government\'s weakness.' },
    { id: 'fr-montenotte', date: '1796-04-12', title: 'Battle of Montenotte', description: 'Bonaparte\'s first major victory in Italy. Defeats Piedmontese-Austrian forces. Young general\'s rapid movement and concentration of force begins legendary reputation.' },
    { id: 'fr-millesimo', date: '1796-04-13', title: 'Battle of Millesimo', description: 'Bonaparte defeats Austrian column day after Montenotte. Series of rapid victories fragments Coalition forces in northern Italy.' },
    { id: 'fr-mondovi', date: '1796-04-21', title: 'Battle of Mondovì', description: 'Bonaparte defeats Piedmontese army. King of Sardinia sues for separate peace. First Coalition member eliminated by Bonaparte\'s strategy.' },
    { id: 'fr-lodi', date: '1796-05-10', title: 'Battle of Lodi', description: 'Bonaparte personally sights cannon at Bridge of Lodi. Legendary "Little Corporal" moment. Soldiers begin to see him as more than general.' },
    { id: 'fr-milan-entry', date: '1796-05-15', title: 'Triumphal Entry into Milan', description: 'Bonaparte enters Milan in triumph. Lombard patriots welcome French liberation. Revolutionary republicanism spreads throughout northern Italy.' },
    { id: 'fr-castiglione', date: '1796-08-05', title: 'Battle of Castiglione', description: 'Bonaparte defeats Austrian attempt to relieve Mantua siege. Tactical masterpiece showcases Bonaparte\'s military genius to European powers.' },
    { id: 'fr-arcole', date: '1796-11-15', title: 'Battle of Arcole', description: 'Bonaparte\'s legendary charge across Arcole bridge. Three-day battle defeats Austrians attempting to relieve Mantua. Heroic leadership becomes propaganda gold.' },
    { id: 'fr-rivoli', date: '1797-01-14', title: 'Battle of Rivoli', description: 'Bonaparte\'s tactical masterpiece crushes last Austrian attempt to hold northern Italy. Mantua surrenders shortly after. Italy campaign virtually complete.' },
    { id: 'fr-campo-formio', date: '1797-10-17', title: 'Treaty of Campo Formio', description: 'Bonaparte negotiates treaty with Austria. French Republic gains Belgium, left bank of Rhine. Bonaparte acts as diplomat equal to Directory.' },
    { id: 'fr-babeuf-conspiracy', date: '1796-05-10', title: 'Babeuf Conspiracy Discovered', description: 'Gracchus Babeuf\'s "Conspiracy of Equals" exposed. First communist plot demands common property and economic equality. Shows revolution\'s unfinished social agenda.' },
    { id: 'fr-18-fructidor', date: '1797-09-04', title: '18 Fructidor Coup', description: 'Directory purges royalist deputies and directors. Military support ensures republican victory over monarchist electoral success. Constitution violated to save Republic.' },
    { id: 'fr-egyptian-campaign', date: '1798-07-01', title: 'Bonaparte\'s Egyptian Campaign', description: 'Napoleon leads expedition to Egypt. Orientalist adventure brings scientific discoveries but military failure. Bonaparte builds legend while Directory struggles at home.' },
    { id: 'fr-18-brumaire', date: '1799-11-09', title: '18 Brumaire - Napoleon\'s Coup', description: 'General Bonaparte overthrows Directory with Sieyès\' help. "I found the crown of France lying on the ground, and I picked it up with my sword." Revolution ends, Consulate begins.' },
    { id: 'fr-consulate', date: '1799-11-10', title: 'Consulate Established', description: 'Three consuls take power with Napoleon as First Consul. New constitution concentrates power in Bonaparte\'s hands. "The Revolution is over" - Napoleon consolidates its gains.' }
  ];

  return events;
}

// Degradation testing seeders
export function seedSingleColumnTest(): Event[] {
  // Create exactly enough events to fill a single column (6-8 events)
  const base = Date.now() - 30 * dayMs;
  const events: Event[] = [];
  
  for (let i = 0; i < 6; i++) {
    const d = new Date(base + i * 2 * dayMs).toISOString().slice(0, 10);
    events.push({
      id: `single-${i}`,
      date: d,
      title: `Single Column Event ${i + 1}`,
      description: `This is event ${i + 1} testing single column layout with good content.`
    });
  }
  
  return events;
}

export function seedMinuteTest(): Event[] {
  // Create events with minute-level precision for testing timeline zoom
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start at midnight
  const baseDate = today.toISOString().slice(0, 10); // YYYY-MM-DD format

  const events: Event[] = [
    { id: 'minute-01', date: baseDate, time: '09:00', title: 'Morning Meeting', description: 'Team standup meeting to discuss daily goals and priorities.' },
    { id: 'minute-02', date: baseDate, time: '09:30', title: 'Coffee Break', description: 'Quick coffee break with colleagues in the kitchen area.' },
    { id: 'minute-03', date: baseDate, time: '10:15', title: 'Client Call', description: 'Important client presentation about Q4 deliverables.' },
    { id: 'minute-04', date: baseDate, time: '11:45', title: 'Code Review', description: 'Reviewing pull requests and discussing implementation details.' },
    { id: 'minute-05', date: baseDate, time: '12:30', title: 'Lunch Break', description: 'Lunch at the local restaurant with the development team.' },
    { id: 'minute-06', date: baseDate, time: '14:00', title: 'Design Session', description: 'Collaborative design session for the new timeline feature.' },
    { id: 'minute-07', date: baseDate, time: '15:20', title: 'Bug Triage', description: 'Prioritizing and assigning critical bugs found in testing.' },
    { id: 'minute-08', date: baseDate, time: '16:45', title: 'Sprint Planning', description: 'Planning next sprint goals and story point estimation.' },
    { id: 'minute-09', date: baseDate, time: '17:30', title: 'Demo Prep', description: 'Preparing demonstration materials for tomorrow\'s client demo.' },
    { id: 'minute-10', date: baseDate, time: '18:15', title: 'Team Sync', description: 'End-of-day sync to review progress and plan tomorrow.' }
  ];

  return events;
}

export function seedDualColumnTest(): Event[] {
  // Create enough events to require dual columns (12-16 events)
  const base = Date.now() - 30 * dayMs;
  const events: Event[] = [];

  for (let i = 0; i < 12; i++) {
    const d = new Date(base + i * 2 * dayMs).toISOString().slice(0, 10);
    events.push({
      id: `dual-${i}`,
      date: d,
      title: `Dual Column Event ${i + 1}`,
      description: `This is event ${i + 1} testing dual column layout with substantial content to show full cards.`
    });
  }
  
  return events;
}

export function seedCompactDegradationTest(): Event[] {
  // Create enough events to force compact degradation (18-24 events)
  const base = Date.now() - 30 * dayMs;
  const events: Event[] = [];
  
  for (let i = 0; i < 20; i++) {
    const d = new Date(base + i * 1.5 * dayMs).toISOString().slice(0, 10);
    events.push({
      id: `compact-${i}`,
      date: d,
      title: `Compact Test Event ${i + 1}`,
      description: `Event ${i + 1} with moderate content that should degrade to compact cards when space runs out.`
    });
  }
  
  return events;
}

export function seedMultiEventTest(): Event[] {
  // Create enough events to force multi-event cards (30+ events)
  const base = Date.now() - 20 * dayMs;
  const events: Event[] = [];
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(base + i * dayMs).toISOString().slice(0, 10);
    events.push({
      id: `multi-${i}`,
      date: d,
      title: `Multi Event ${i + 1}`,
      description: `Event ${i + 1} that will be grouped into multi-event cards.`
    });
  }
  
  return events;
}

export function seedInfiniteTest(): Event[] {
  // Create way too many events to force infinite cards (50+ events)
  const base = Date.now() - 25 * dayMs;
  const events: Event[] = [];

  for (let i = 0; i < 50; i++) {
    const d = new Date(base + i * 0.5 * dayMs).toISOString().slice(0, 10);
    events.push({
      id: `infinite-${i}`,
      date: d,
      title: `Infinite Test ${i + 1}`,
      description: `Event ${i + 1} in extreme density test that should trigger infinite cards.`
    });
  }

  return events;
}

// Historical curated dataset: Charles de Gaulle comprehensive timeline (1890-1970).
// Detailed life events with historical context and links to audio/video media where available.
export function seedDeGaulleTimeline(): Event[] {
  const events: Event[] = [
    // Early Life and Education
    {
      id: 'cdg-birth',
      date: '1890-11-22',
      title: 'Charles de Gaulle Born',
      description: 'Born in Lille to Henri de Gaulle (teacher and headmaster) and Jeanne Maillot-Delannoy. Raised in a devout Catholic, conservative family with strong literary and intellectual traditions. His father ran a Jesuit college, shaping his early education and values.'
    },
    {
      id: 'cdg-education',
      date: '1909-09-01',
      title: 'Enters Saint-Cyr Military Academy',
      description: 'Begins military education at Saint-Cyr, France\'s premier military academy. Excels in history and literature while developing his strategic thinking. Graduates 13th out of 210 cadets in 1912, earning commission as second lieutenant.'
    },

    // World War I
    {
      id: 'cdg-first-command',
      date: '1913-10-01',
      title: 'First Military Assignment',
      description: 'Assigned to 33rd Infantry Regiment in Arras under Colonel (later Marshal) Philippe Pétain. This mentorship with Pétain profoundly influences his early military thinking and understanding of defensive strategy.'
    },
    {
      id: 'cdg-verdun-wounded',
      date: '1916-03-02',
      title: 'Wounded and Captured at Verdun',
      description: 'Captain de Gaulle leads his company at Douaumont during the Battle of Verdun. Wounded by bayonet and gas, then captured by German forces. Spends 32 months as POW, making five unsuccessful escape attempts while developing his theories on modern warfare.'
    },

    // Interwar Period - Military Theorist
    {
      id: 'cdg-marriage',
      date: '1921-04-07',
      title: 'Marries Yvonne Vendroux',
      description: 'Marries Yvonne Vendroux in Calais. Their union produces three children: Philippe (1921), Élisabeth (1924), and Anne (1928-1948), who was born with Down syndrome and remained close to her father throughout his life.'
    },
    {
      id: 'cdg-war-college',
      date: '1924-11-01',
      title: 'École de Guerre Studies',
      description: 'Attends French War College (École Supérieure de Guerre). His thesis advocating mobile warfare and armored divisions conflicts with prevailing defensive doctrine. Graduates 52nd out of 129, his independent thinking noted but not appreciated by instructors.'
    },
    {
      id: 'cdg-enemy-sword',
      date: '1932-01-01',
      title: 'Publishes "The Edge of the Sword"',
      description: 'First major work on military leadership and strategy. Argues for the need for exceptional leaders in times of crisis and advocates for professional military élites. Establishes his reputation as military intellectual and strategic thinker.'
    },
    {
      id: 'cdg-towards-army',
      date: '1934-01-01',
      title: 'Publishes "Towards a Professional Army"',
      description: 'Revolutionary military treatise advocating for mechanized warfare, armored divisions, and mobile tactics. Predicts future of warfare will favor offensive operations using tanks and aircraft. Largely ignored by French high command but studied by German officers including Heinz Guderian.'
    },

    // World War II - The Call and Free France
    {
      id: 'cdg-colonel',
      date: '1937-12-25',
      title: 'Promoted to Colonel',
      description: 'Commands 507th Tank Regiment. Continues developing and testing theories of armored warfare despite institutional resistance. His practical experience with tanks reinforces his conviction about mechanized warfare\'s future importance.'
    },
    {
      id: 'cdg-undersecretary',
      date: '1940-06-06',
      title: 'Appointed Undersecretary of War',
      description: 'Prime Minister Paul Reynaud appoints de Gaulle Undersecretary of State for National Defense and War. At 49, becomes youngest general in French Army. Advocates for continuing resistance from North Africa and maintaining alliance with Britain.'
    },
    {
      id: 'cdg-london-arrival',
      date: '1940-06-17',
      title: 'Flies to London',
      description: 'Leaves France for London on Churchill\'s aircraft as Pétain government seeks armistice. Meets with Churchill to discuss continued resistance. Prepares to broadcast message of defiance against German occupation and Vichy collaboration.'
    },
    {
      id: 'cdg-appeal',
      date: '1940-06-18',
      title: 'Appeal of 18 June 1940',
      description: 'Broadcasts historic speech from BBC Studio B calling for French resistance: "France has lost a battle, but France has not lost the war." Marks birth of Free France movement. Only a few hundred hear live broadcast, but message spreads and becomes symbol of resistance. Media: Audio - BBC Archive Original Recording - URL: https://www.bbc.co.uk/archive/the-appeal-of-18-june-1940/zdnpd6f'
    },
    {
      id: 'cdg-death-sentence',
      date: '1940-08-02',
      title: 'Condemned to Death by Vichy',
      description: 'Vichy government sentences de Gaulle to death in absentia for treason and desertion. Confiscates all his property. This definitive break with Pétain regime solidifies his position as leader of French resistance and external opposition.'
    },
    {
      id: 'cdg-free-france',
      date: '1940-10-27',
      title: 'Manifesto of Free France',
      description: 'Establishes formal organizational structure of Free France in London. Creates French National Committee as provisional government. Begins organizing Free French forces and coordinating with resistance networks in occupied France and colonies.'
    },

    // Free French Leadership
    {
      id: 'cdg-brazzaville',
      date: '1940-10-28',
      title: 'Brazzaville Declaration',
      description: 'French Equatorial Africa rallies to Free France under Governor Félix Éboué. Establishes Brazzaville as administrative capital of Free France in Africa. Demonstrates growing legitimacy and provides territorial base for resistance government.'
    },
    {
      id: 'cdg-roosevelt-tension',
      date: '1942-07-01',
      title: 'Tensions with Roosevelt Administration',
      description: 'FDR considers de Gaulle difficult and prefers dealing with other French leaders. De Gaulle insists on French sovereignty and rejects Allied attempts to impose leadership. These tensions persist throughout war but ultimately strengthen de Gaulle\'s position as undisputed French leader.'
    },
    {
      id: 'cdg-cfln',
      date: '1943-06-03',
      title: 'French Committee of National Liberation',
      description: 'Co-chairs CFLN with General Henri Giraud in Algiers, then outmaneuvers him to become sole leader. Unifies external and internal resistance under single command. Gains increasing Allied recognition as legitimate representative of France.'
    },
    {
      id: 'cdg-liberation-paris',
      date: '1944-08-25',
      title: 'Liberation of Paris',
      description: 'Enters liberated Paris and delivers speech from Hôtel de Ville: "Paris! Paris outraged! Paris broken! Paris martyred! But Paris liberated!" Massive crowds celebrate as de Gaulle walks down Champs-Élysées. Media: Video - Liberation Parade Footage - URL: https://www.ina.fr/video/I05077138'
    },
    {
      id: 'cdg-provisional-govt',
      date: '1944-09-09',
      title: 'Head of Provisional Government',
      description: 'Officially recognized as head of French Provisional Government by Allies. Begins process of restoring French state institutions, purging collaborators, and rebuilding France\'s international position. Faces immediate challenges of reconstruction and Communist influence.'
    },

    // Post-War Politics and Resignation
    {
      id: 'cdg-first-resignation',
      date: '1946-01-20',
      title: 'First Resignation from Power',
      description: 'Resigns as head of Provisional Government, frustrated by party politics and constitutional limitations. Famous parting words: "The exclusive regime of parties has returned. I disapprove of it." Retreats to Colombey-les-Deux-Églises to write memoirs.'
    },
    {
      id: 'cdg-rpf-founding',
      date: '1947-04-14',
      title: 'Founds Rally of French People (RPF)',
      description: 'Creates new political movement advocating for strong presidential system and opposing both Communism and "sterile" party politics. Initially attracts massive support with rallies drawing hundreds of thousands. Challenges Fourth Republic\'s parliamentary system.'
    },
    {
      id: 'cdg-memoirs-volume1',
      date: '1954-10-01',
      title: 'Publishes "War Memoirs" Volume 1',
      description: 'First volume of monumental three-volume war memoirs: "The Call to Honour (1940-1942)." Literary masterpiece combining historical account with philosophical reflection. Establishes his version of events and reinforces his historical stature.'
    },

    // Return to Power - Fifth Republic
    {
      id: 'cdg-algeria-crisis',
      date: '1958-05-13',
      title: 'Algeria Crisis Calls Him Back',
      description: 'Military coup in Algeria threatens civil war in France. Political establishment turns to de Gaulle as only figure capable of resolving crisis. Army and settlers believe he will keep Algeria French, while others hope he can negotiate peace.'
    },
    {
      id: 'cdg-return-power',
      date: '1958-06-01',
      title: 'Returns as Prime Minister',
      description: 'National Assembly votes him emergency powers and mandate to draft new constitution. At 67, begins final phase of political career. Immediately sets about creating stronger executive system and resolving Algerian War.'
    },
    {
      id: 'cdg-fifth-republic',
      date: '1958-10-04',
      title: 'Fifth Republic Constitution Adopted',
      description: 'New constitution approved by referendum with 79% approval. Creates strong presidency with significant powers over foreign policy, defense, and constitutional matters. Establishes system allowing for stable government and decisive leadership.'
    },
    {
      id: 'cdg-president-elected',
      date: '1958-12-21',
      title: 'Elected First President of Fifth Republic',
      description: 'Elected President by electoral college of 80,000 local representatives. Receives 78% of votes. Inauguration begins 11-year presidency that transforms France\'s institutions, international position, and self-image.'
    },

    // Presidential Years - Major Policies and Crises
    {
      id: 'cdg-algerian-independence',
      date: '1962-07-03',
      title: 'Algerian Independence',
      description: 'Algeria becomes independent after Évian Accords. De Gaulle\'s gradual shift from "Algérie française" to negotiated independence nearly triggers military coup. His success in ending eight-year war while avoiding civil war demonstrates political mastery.'
    },
    {
      id: 'cdg-direct-election',
      date: '1962-10-28',
      title: 'Direct Presidential Election Reform',
      description: 'Constitutional referendum establishes direct election of President by universal suffrage. Passes with 62% despite opposition from all parties. Strengthens presidency and creates direct link between president and people, bypassing traditional political intermediaries.'
    },
    {
      id: 'cdg-franco-german',
      date: '1963-01-22',
      title: 'Élysée Treaty with Germany',
      description: 'Signs friendship treaty with Chancellor Konrad Adenauer, formally ending centuries of Franco-German hostility. Creates institutional framework for cooperation and consultation. Foundation stone of European integration and post-war reconciliation.'
    },
    {
      id: 'cdg-nuclear-force',
      date: '1960-02-13',
      title: 'First French Nuclear Test',
      description: 'France detonates first atomic bomb in Sahara, becoming world\'s fourth nuclear power. "Gerboise Bleue" test demonstrates French independence from American and Soviet nuclear umbrellas. Cornerstone of Gaullist defense policy and international status.'
    },
    {
      id: 'cdg-nato-withdrawal',
      date: '1966-03-07',
      title: 'Withdraws from NATO Integrated Command',
      description: 'Announces France\'s withdrawal from NATO\'s integrated military command while remaining in Alliance. Expels NATO headquarters from France. Demonstrates independence from American leadership while maintaining Western solidarity during Cold War.'
    },
    {
      id: 'cdg-quebec-libre',
      date: '1967-07-24',
      title: 'Vive le Québec libre!',
      description: 'Shouts "Long live free Quebec!" from Montreal City Hall balcony during official visit to Canada. Creates major diplomatic crisis with Ottawa but electrifies Quebec independence movement. Media: Video - Quebec Speech at Montreal City Hall - URL: https://www.ina.fr/video/CAF97059589'
    },
    {
      id: 'cdg-may68-crisis',
      date: '1968-05-30',
      title: 'May 1968 Crisis Speech',
      description: 'After mysteriously disappearing for 24 hours (secretly consulting with military), delivers decisive radio address dissolving National Assembly and calling for order. Massive counter-demonstration supports him. Successfully navigates greatest domestic crisis of presidency. Media: Audio - May 30 Radio Address - URL: https://www.ina.fr/audio/PHD85005080'
    },

    // Final Years and Legacy
    {
      id: 'cdg-reelection',
      date: '1965-12-19',
      title: 'Re-elected President',
      description: 'Wins second term in runoff against François Mitterrand (55% to 45%). First president elected by direct universal suffrage. Victory margin smaller than expected, showing some erosion of support but confirming his dominance of French politics.'
    },
    {
      id: 'cdg-referendum-defeat',
      date: '1969-04-27',
      title: 'Referendum Defeat',
      description: 'Referendum on Senate reform and regional reorganization fails with 52.4% voting "No." Having staked his presidency on the outcome, prepares to honor his commitment to resign if defeated. Represents end of an era in French politics.'
    },
    {
      id: 'cdg-final-resignation',
      date: '1969-04-28',
      title: 'Final Resignation',
      description: 'Announces resignation effective at midnight: "I am ceasing to exercise my functions as President of the Republic." Keeps his word given before referendum. Retires permanently to Colombey-les-Deux-Églises to complete his memoirs. Media: Audio - Resignation Statement - URL: https://www.ina.fr/audio/PHD86005261'
    },
    {
      id: 'cdg-death',
      date: '1970-11-09',
      title: 'Death at Colombey',
      description: 'Dies suddenly of aneurysm at La Boisserie, his home in Colombey-les-Deux-Églises, while watching television news. Last words reportedly: "It hurts." His death marks end of an era. Body lies in state at Notre-Dame before burial in village cemetery as he requested.'
    },
    {
      id: 'cdg-funeral',
      date: '1970-11-12',
      title: 'State Funeral and Burial',
      description: 'Dual ceremony: intimate burial in Colombey attended by family and villagers as he wished, followed by memorial service at Notre-Dame attended by 80 heads of state including Nixon, Brezhnev, and most world leaders. Represents final tribute to his global stature. Media: Video - State Funeral Coverage - URL: https://www.ina.fr/video/CAF86004389'
    }
  ];

  return events;
}
