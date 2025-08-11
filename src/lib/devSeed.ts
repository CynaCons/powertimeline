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
