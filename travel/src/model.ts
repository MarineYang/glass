import LZString from 'lz-string';
export type Point = { lat: number; lng: number };
export type Stop = Point & { name: string; note: string };
export type Trip = { v: 1; id: string; title: string; author: string; description: string; category: string; stops: Stop[] };
export type Visit = { stop: number; at: string; method: 'gps' | 'manual' };
export const categories = ['동네 산책', '숲과 공원', '여행', '맛있는 길'];
export function isPoint(p: unknown): p is Point { const q=p as Point; return !!q && Number.isFinite(q.lat) && Math.abs(q.lat)<=85 && Number.isFinite(q.lng) && Math.abs(q.lng)<=180; }
const clean=(v:unknown,n:number)=>typeof v==='string'?v.trim().slice(0,n):'';
export function normalize(input: unknown): Trip | null {
 const t=input as Trip;if(!t||t.v!==1||!Array.isArray(t.stops)||t.stops.length!==3)return null;
 const stops=t.stops.map(s=>isPoint(s)?{lat:Math.round(s.lat*1e6)/1e6,lng:Math.round(s.lng*1e6)/1e6,name:clean(s.name,40),note:clean(s.note,280)}:null);
 if(stops.some(s=>!s||!s.name))return null;
 const data={v:1 as const,title:clean(t.title,48),author:clean(t.author,20),description:clean(t.description,140),category:categories.includes(t.category)?t.category:categories[0],stops:stops as Stop[]};
 if(!data.title||!data.author)return null;
 let hash=2166136261;for(const c of JSON.stringify(data)){hash=Math.imul(hash^c.charCodeAt(0),16777619);}
 return {...data,id:'trip-'+(hash>>>0).toString(36)};
}
export function encodeTrip(t:Trip) { const n=normalize(t);if(!n)throw new Error('코스 정보가 올바르지 않아요.');return LZString.compressToEncodedURIComponent(JSON.stringify(n)); }
export function decodeTrip(value:string):Trip|null {try{if(!value||value.length>12000)return null;const json=LZString.decompressFromEncodedURIComponent(value);if(!json||json.length>7000)return null;return normalize(JSON.parse(json));}catch{return null;}}
export function distance(a:Point,b:Point){const r=Math.PI/180,h=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lng-a.lng)*r/2)**2;return 6371000*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))));}
export function length(t:Trip){return distance(t.stops[0],t.stops[1])+distance(t.stops[1],t.stops[2]);}
export function readableDistance(d:number){return d>=1000?`${(d/1000).toFixed(1)}km`:`${Math.round(d)}m`;}
export function eligible(location:Point&{accuracy:number;timestamp:number},target:Point,now=Date.now()){return isPoint(location)&&location.accuracy>=0&&location.accuracy<=80&&now-location.timestamp>=0&&now-location.timestamp<30000&&distance(location,target)<=80;}
export function parseTrips(raw:string|null):Trip[]{try{const v=JSON.parse(raw||'[]');if(!Array.isArray(v))return [];return v.slice(0,100).map(normalize).filter((t):t is Trip=>!!t);}catch{return [];}}
export function parseVisits(raw:string|null):Record<string,Visit[]>{try{const v=JSON.parse(raw||'{}');const out:Record<string,Visit[]>={};if(!v||typeof v!=='object'||Array.isArray(v))return out;for(const [id,items] of Object.entries(v)){if(!/^trip-[a-z0-9]+$/.test(id)||!Array.isArray(items))continue;const seen=new Set<number>();out[id]=items.filter((a):a is Visit=>{if(!a||!Number.isInteger(a.stop)||a.stop<0||a.stop>2||seen.has(a.stop)||!['manual','gps'].includes(a.method)||typeof a.at!=='string'||!Number.isFinite(Date.parse(a.at)))return false;seen.add(a.stop);return true;});}return out;}catch{return {};}}
export const samples: Trip[] = [normalize({v:1,title:'숲에서 잠깐, 쉬어가요',author:'한걸음 에디터',description:'서두르지 않는 오후. 초록을 보고, 벤치에 앉고, 오늘을 기억하는 세 번의 멈춤.',category:'숲과 공원',stops:[{lat:37.5445,lng:127.0375,name:'서울숲 입구 주변',note:'휴대폰을 잠깐 내려놓고 초록을 바라봐요. 오늘 가장 먼저 눈에 들어온 색은 무엇인가요?'},{lat:37.5451,lng:127.0401,name:'서울숲 산책길 주변',note:'안전하게 앉을 수 있는 자리를 찾아보세요. 바람 소리를 잠깐 듣는 것만으로도 좋은 여행이에요.'},{lat:37.5437,lng:127.042,name:'서울숲 동쪽 산책길 주변',note:'오늘 발견한 작은 장면을 기억해요. 다음에는 누구와 이 길을 걷고 싶나요?'}]})!,normalize({v:1,title:'물길 따라, 도심 한 바퀴',author:'한걸음 에디터',description:'익숙한 서울의 다른 표정. 물소리와 다리 사이에서 만나는 작은 이야기.',category:'동네 산책',stops:[{lat:37.5691,lng:126.9785,name:'청계광장 주변',note:'바쁜 길에서 잠시 속도를 줄여봐요. 오늘은 목적지보다 그 사이의 풍경을 만나러 왔어요.'},{lat:37.5687,lng:126.983,name:'광통교 주변',note:'다리 가까운 안전한 보행 공간에서 물길을 바라봐요. 위쪽 도시와 아래쪽 산책길은 어떤 점이 다른가요?'},{lat:37.5685,lng:126.9872,name:'장통교 주변',note:'여기까지 함께 걸어줘서 고마워요. 마음에 든 장소가 있다면 나만의 코스로 다시 만들어보세요.'}]})!];
