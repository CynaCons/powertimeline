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
