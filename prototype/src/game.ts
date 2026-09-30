export type Point = { lat: number; lng: number; accuracy: number };
export type Progress = { version: 1; started: boolean; mode: 'demo' | 'walk'; step: number; phase: 'travel' | 'clue' | 'solved'; places: (Point | null)[] };
export const initial = (): Progress => ({ version: 1, started: false, mode: 'demo', step: 0, phase: 'travel', places: [] });
export function restore(raw: string | null): Progress {
  try {
    const v = JSON.parse(raw || 'null');
    if (!v || v.version !== 1 || typeof v.started !== 'boolean' || !['demo', 'walk'].includes(v.mode) || !Number.isInteger(v.step) || v.step < 0 || v.step > 2 || !['travel', 'clue', 'solved'].includes(v.phase) || (v.phase === 'solved' && v.step !== 2) || !Array.isArray(v.places)) return initial();
    return { version: 1, started: v.started, mode: v.mode, step: v.step, phase: v.phase, places: v.places.slice(0, 3).map((p: Point) => validPoint(p) ? p : null) };
  } catch { return initial(); }
}
export function validPoint(p: Point | null): p is Point { return !!p && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180 && Number.isFinite(p.accuracy) && p.accuracy >= 0; }
export function distance(a: Point, b: Point) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.lat-a.lat)*rad/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lng-a.lng)*rad/2)**2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
export const chapters = [
  { symbol: '❧', name: '나뭇잎의 기록', place: '첫 번째 쉼터', prompt: '주변을 둘러보고, 잠시 멈출 수 있는 편안한 곳을 골라주세요.', subtitle: '접힌 일기 한 장', date: '2006년 10월 14일', clue: '“나뭇잎은 우리가 처음 만난 곳. 파도는 헤어진 곳. 별은 다시 만나기로 한 곳.”\n\n일기 아래, 세 그림이 순서대로 그려져 있다.\n나뭇잎 → 파도 → 별', question: '편지의 마지막 그림 ‘별’은 무엇을 뜻할까요?', options: ['처음 만난 장소', '다시 만나기로 한 장소', '편지를 잃어버린 장소'], answer: 1, hint: '일기의 마지막 문장을 다시 읽어보세요. 별은 이별 뒤의 약속입니다.', explanation: '별은 다시 만나기로 약속한 곳. 이 편지는 누군가를 그 약속으로 이끌고 있습니다.' },
  { symbol: '≈', name: '파도의 엽서', place: '두 번째 쉼터', prompt: '익숙한 길을 조금 걸어보세요. 다음 단서는 스스로 고른 두 번째 쉼터에서 열립니다.', subtitle: '20년 간격의 두 소인', date: '우편 보관 기록', clue: '원본 접수: 2006년 10월 14일\n예약 배달: 2026년 10월 14일\n\n보관 메모: “발신인의 요청으로 20년간 보관. 분실이나 반송 기록 없음.”\n\n봉투에는 ‘늦은 게 아니야. 약속한 날에 열어줘.’라고 적혀 있다.', question: '이 편지가 20년 뒤에 도착하는 이유는?', options: ['우체국에서 잃어버렸기 때문에', '주소가 계속 바뀌었기 때문에', '보낸 사람이 배달 날짜를 정했기 때문에'], answer: 2, hint: '보관 메모에는 누가 20년간 보관하도록 요청했는지 적혀 있습니다.', explanation: '늦어진 편지가 아니라 기다린 편지였어요. 누군가 20년 뒤의 만남을 미리 준비했습니다.' },
  { symbol: '✧', name: '별의 약속', place: '마지막 쉼터', prompt: '마지막은 오늘 기억하고 싶은 장소로 골라보세요. 이야기가 당신에게 돌아옵니다.', subtitle: '봉투 안쪽의 수신인', date: '마지막 증거', clue: '발신인: 2006년의 윤서\n수신인: 2026년의 윤서\n\n“스무 해 뒤의 나에게.\n이 동네를 떠나도 처음 좋아했던 것들을 잊지 말자.\n별을 만나면 잠깐 멈춰.\n우리가 다시 만나는 날이니까.”', question: '윤서가 이 편지를 보낸 상대는 누구일까요?', options: ['미래의 자신', '연락이 끊긴 친구', '처음 만날 누군가'], answer: 0, hint: '발신인과 수신인의 이름은 같습니다. 다른 것은 연도뿐이에요.', explanation: '2006년의 윤서가 2026년의 자신에게 보낸 편지. 별은 과거의 나와 지금의 내가 만나는 약속이었습니다.' }
];
export function advance(p: Progress, answer: number): Progress {
  if (p.phase !== 'clue' || answer !== chapters[p.step].answer) return p;
  return p.step === 2 ? { ...p, phase: 'solved' } : { ...p, step: p.step + 1, phase: 'travel' };
}
export function readLetter(hash: string): string | null {
  try { if (!hash.startsWith('#letter=')) return null; const s = decodeURIComponent(hash.slice(8)); return s.length > 0 && s.length <= 400 ? s : null; } catch { return null; }
}
