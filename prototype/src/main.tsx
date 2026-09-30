import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { advance, chapters, distance, initial, readLetter, restore } from './game';
import type { Point, Progress } from './game';
import './style.css';
const KEY = 'secret-neighborhood:v1';
function getSaved(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function App() {
  const [game, setGame] = useState<Progress>(() => restore(getSaved(KEY)));
  const [tab, setTab] = useState<'case' | 'book' | 'collection'>('case');
  const [feedback, setFeedback] = useState('');
  const [correct, setCorrect] = useState(false);
  const [hint, setHint] = useState(false);
  const [gps, setGps] = useState<Point | null>(null);
  const [gpsMessage, setGpsMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [note, setNote] = useState(() => getSaved(KEY + ':note') || '');
  const [noteSaved, setNoteSaved] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [received, setReceived] = useState(() => readLetter(location.hash));
  const [showRestart, setShowRestart] = useState(false);
  const [glass, setGlass] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [manual, setManual] = useState(false);
  const gpsRequest = useRef(0);
  const title = useRef<HTMLHeadingElement>(null);
  const chapter = chapters[game.step];
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(game)); } catch { setStorageError(true); } }, [game]);
  useEffect(() => { setFeedback(''); setCorrect(false); setHint(false); setGps(null); setGpsMessage(''); setBusy(false); gpsRequest.current++; setManual(false); stopAudio(); title.current?.focus(); }, [game.step, game.phase, game.started]);
  useEffect(() => {
    const onHash = () => setReceived(readLetter(location.hash));
    const onHide = () => { if (document.hidden) { stopAudio(); gpsRequest.current++; setBusy(false); } };
    window.addEventListener('hashchange', onHash); document.addEventListener('visibilitychange', onHide);
    return () => { window.removeEventListener('hashchange', onHash); document.removeEventListener('visibilitychange', onHide); window.speechSynthesis?.cancel(); };
  }, []);
  useEffect(() => { stopAudio(); }, [tab]);
  function stopAudio() { window.speechSynthesis?.cancel(); setSpeaking(false); }
  function narrate() {
    if (speaking) { stopAudio(); return; }
    if (!('speechSynthesis' in window)) { setFeedback('이 브라우저에서는 읽어주기를 지원하지 않습니다.'); return; }
    const u = new SpeechSynthesisUtterance(chapter.clue); u.lang = 'ko-KR'; u.rate = .92;
    u.onend = u.onerror = () => setSpeaking(false); setSpeaking(true); speechSynthesis.speak(u);
  }
  function start(mode: 'demo' | 'walk') { setGame({ ...initial(), started: true, mode }); setTab('case'); }
  function locate() {
    if (!window.isSecureContext || !navigator.geolocation) { setGpsMessage('휴대폰 GPS는 HTTPS 주소에서 사용할 수 있어요. 지금은 아래 버튼으로 장소를 직접 확인하고 계속할 수 있습니다.'); return; }
    setBusy(true); setGpsMessage('현재 위치를 확인하고 있어요…'); const id = ++gpsRequest.current;
    navigator.geolocation.getCurrentPosition(p => {
      if (gpsRequest.current !== id) return;
      const point = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
      setGps(point); setBusy(false); setGpsMessage(`위치를 찾았어요 · 오차 약 ${Math.round(point.accuracy)}m${point.accuracy > 80 ? ' · 정확도가 낮습니다. 주변을 직접 확인해주세요.' : ''}`);
    }, e => { if (gpsRequest.current !== id) return; setBusy(false); setGps(null); setGpsMessage(e.code === 1 ? '위치 사용이 허용되지 않았어요. 직접 도착 확인으로 계속할 수 있습니다.' : '위치를 찾지 못했어요. 다시 시도하거나 직접 도착을 확인해주세요.'); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  }
  function arrive() { const places = [...game.places]; places[game.step] = game.mode === 'walk' ? gps : null; setGame({ ...game, phase: 'clue', places }); }
  function answer(i: number) { if (i === chapter.answer) { setCorrect(true); setFeedback(chapter.explanation); } else { setFeedback('아직 증거와 맞지 않아요. 기록을 다시 읽어보세요. 횟수 제한은 없습니다.'); } }
  function saveNote() { try { localStorage.setItem(KEY + ':note', note); setNoteSaved(true); } catch { setStorageError(true); } }
  async function share() {
    const url = new URL(location.href); url.hash = 'letter=' + encodeURIComponent(note.trim());
    const data = { title: '비밀동네에서 온 편지', text: '당신에게 남긴 작은 편지가 있어요.', url: url.href };
    try { if (navigator.share) { await navigator.share(data); setShareMessage('공유 창을 열었습니다.'); } else if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(url.href); setShareMessage('편지 링크를 복사했어요. 같은 Wi-Fi에서 접속할 수 있는 친구에게 보내주세요.'); } else { setShareMessage(url.href); } } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setShareMessage('공유하지 못했어요. 편지는 이 기기에 저장할 수 있습니다.'); }
  }
  const unlocked = game.phase === 'solved' ? 3 : game.step + (game.phase === 'clue' ? 1 : 0);
  const last = game.places[game.step - 1];
  return <div className={`shell ${glass ? 'glass' : ''}`}>
    <header className="top"><a href="#" onClick={e => { e.preventDefault(); setTab('case'); }} className="brand"><span className="brandmark">✧</span> 비밀동네 <small>FIELD NOTES</small></a><button className="icon-button" onClick={() => setGlass(!glass)} aria-pressed={glass}>{glass ? '휴대폰 보기' : '간결하게'}</button></header>
    {storageError && <p role="alert" className="notice">저장 공간을 사용할 수 없어 진행이 보존되지 않을 수 있어요.</p>}
    {received !== null ? <main><section className="hero"><span className="eyebrow">A LETTER FOR YOU</span><h1>누군가 이곳에<br/>마음을 남겼어요.</h1><article className="paper"><span className="stamp">✉</span><p className="letter-body">{received}</p></article><p className="muted">초대 링크에 담긴 편지입니다. 링크를 가진 사람은 장소에 상관없이 읽을 수 있어요.</p><button className="primary" onClick={() => { history.replaceState(null, '', location.pathname + location.search); setReceived(null); }}>나도 사건 시작하기 →</button></section></main>
    : !game.started ? <main className="landing"><section className="hero"><div className="eyebrow"><span className="live-dot"/> 오늘, 익숙한 길 너머로</div><h1>우리 동네에는<br/><em>아직 못 읽은</em><br/>이야기가 있다.</h1><p className="intro">작은 단서를 따라 걷고,<br/>마지막에는 당신의 이야기를 남겨보세요.</p><RouteMap step={0} unlocked={0} landing/><div className="case-preview"><div><span className="eyebrow">CASE 001 · 따뜻한 미스터리</span><h2>아직 도착하지 않은 편지</h2><p>20년을 기다린 편지.<br/>주소 대신 그려진 세 개의 표시.</p></div><div className="postage">✧<small>2006<br/>2026</small></div></div><div className="tags"><span>◷ 체험 5분 / 산책 15분</span><span>◇ 단서 3개</span><span>혼자서도 좋아요</span></div><button className="primary" onClick={() => start('demo')}>지금 여기서 체험하기 <span>→</span></button><a className="secondary ar-entry" href="/ar.html">✧ 1인칭 AR 콘셉트 체험하기 ↗</a><button className="secondary" onClick={() => start('walk')}>직접 걸으며 시작하기 ↗</button><p className="fine">실제 인물·사건과 무관한 창작 이야기입니다.<br/>앱 설치나 회원가입 없이 시작할 수 있어요.</p></section></main>
    : <><main>
      <div className="case-top"><span className="eyebrow">CASE 001 / {game.mode === 'demo' ? '가상 산책' : '자유 산책'}</span><button className="text-button" onClick={() => setShowRestart(true)}>다시 시작</button></div>
      {showRestart && <section className="notice" role="alert"><p>사건 진행을 처음으로 되돌릴까요? 저장한 편지는 남습니다.</p><div className="row"><button onClick={() => { setGame(initial()); setShowRestart(false); }}>처음으로</button><button onClick={() => setShowRestart(false)}>취소</button></div></section>}
      {tab === 'case' && (game.phase === 'solved' ? <section className="ending"><span className="eyebrow">CASE CLOSED</span><div className="award">✧<small>THE PROMISE</small></div><h1 ref={title} tabIndex={-1}>편지는 결국,<br/>나에게 돌아왔다.</h1><p>윤서는 미래의 자신에게 편지를 보냈습니다.<br/>잊고 지낸 나를 다시 만나기 위해서요.</p><blockquote>“처음 좋아했던 것들을<br/>잊지 말자.”</blockquote><div className="reward-row"><span>✧ 별 우표 획득</span><span>조사 기록 3 / 3</span></div><section className="note-card"><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>다음에 이곳에 올 당신에게</h2><label htmlFor="note">오늘 기억하고 싶은 말을 남겨보세요.</label><textarea id="note" maxLength={400} placeholder="오늘 나는 새로운 길을 걸었다…" value={note} onChange={e => { setNote(e.target.value); setNoteSaved(false); setShareMessage(''); }}/><div className="fine align-right">{note.length} / 400</div><button className="primary" disabled={!note.trim()} onClick={saveNote}>{noteSaved ? '이 기기에 저장했어요 ✓' : '편지 간직하기'}</button><button className="secondary" disabled={!note.trim()} onClick={share}>친구에게 편지 링크 보내기 ↗</button><p className="fine">편지는 이 브라우저에 저장됩니다. 공유 링크에는 편지 내용이 포함되며, 링크를 가진 사람은 어디서든 읽을 수 있어요. 현재 버전은 장소 잠금·서버 보관을 제공하지 않습니다.</p>{shareMessage && <p className="share-result" role="status">{shareMessage}</p>}</section></section>
      : <section><div className="chapter-head"><span className="chapter-no">0{game.step + 1}<small>/ 03</small></span><div><span className="eyebrow">{game.phase === 'travel' ? '다음 이야기를 찾아서' : '발견한 단서'}</span><h1 ref={title} tabIndex={-1}>{chapter.name}</h1></div></div><div className="progress" aria-label={`세 장소 중 ${unlocked}곳 조사`}><i style={{width: `${unlocked / 3 * 100}%`}}/></div>
        {game.phase === 'travel' ? <><RouteMap step={game.step} unlocked={unlocked}/><div className="travel-copy"><span className="eyebrow">{chapter.place}</span><h2>{game.step === 0 ? '당신의 첫 조사 장소는?' : '조금 걷고, 잠깐 멈추세요.'}</h2><p>{chapter.prompt}</p></div>{game.mode === 'demo' ? <><p className="notice subtle">가상 산책 모드 · 실제 이동 없이 다음 장소로 이동합니다.</p><button className="primary" onClick={arrive}>이 장소에 도착하기 <span>→</span></button></> : <div className="walk-panel"><p>공공장소의 안전한 쉼터를 직접 골라주세요. 길 안내와 정해진 목적지는 없어요. 장소에 도착해 멈춘 뒤 기록합니다.</p><button className="secondary" onClick={locate} disabled={busy}>{busy ? '위치 확인 중…' : '현재 위치로 조사 장소 등록'}</button><p role="status" className="fine">{gpsMessage || '위치는 등록 버튼을 누를 때만 확인하며, 서버로 보내지 않습니다.'}</p>{gps && <><p className="coordinates">{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}</p>{last && <p className="fine">이전 쉼터에서 직선거리 약 {Math.round(distance(last, gps))}m · 이동 경로가 아닙니다.</p>}<button className="primary" onClick={arrive}>여기서 단서 열기 →</button></>}<button className="text-button manual" onClick={() => setManual(!manual)}>GPS 없이 직접 도착 확인</button>{manual && <div className="notice"><p>위치 기록 없이 진행합니다. 안전하게 멈추셨나요?</p><button className="primary" onClick={() => { setGps(null); const places = [...game.places]; places[game.step] = null; setGame({ ...game, phase: 'clue', places }); }}>네, 여기서 조사할게요</button></div>}</div>}</>
        : <><article className="paper"><div className="paper-top"><span>증거 0{game.step + 1}</span><span>{chapter.date}</span></div><h2>{chapter.subtitle}</h2><p className="letter-body">{chapter.clue}</p><div className="seal">{chapter.symbol}</div></article><button className="text-button audio" onClick={narrate}>{speaking ? '■ 읽어주기 멈춤' : '▷ 단서 읽어주기'}</button><section className="question"><span className="eyebrow">YOUR DEDUCTION</span><h2>{chapter.question}</h2><div className="options">{chapter.options.map((option, i) => <button key={option} className={correct && i === chapter.answer ? 'option selected' : 'option'} disabled={correct} onClick={() => answer(i)}><span>{String.fromCharCode(65+i)}</span>{option}{correct && i === chapter.answer && <b>✓</b>}</button>)}</div>{feedback && <p role="status" className={`feedback ${correct ? 'success' : ''}`}>{feedback}</p>}{correct ? <button className="primary" onClick={() => setGame(advance(game, chapter.answer))}>{game.step === 2 ? '편지의 진상 확인하기' : '다음 이야기로'} →</button> : <><button className="text-button" onClick={() => setHint(!hint)}>{hint ? '힌트 접기' : '작은 힌트가 필요해요'}</button>{hint && <p className="notice">{chapter.hint}</p>}</>}</section></>}
      </section>)}
      {tab === 'book' && <section className="journal"><span className="eyebrow">EVIDENCE BOOK</span><h1>수첩을 펼치다.</h1><p className="muted">지금까지 발견한 기록 {unlocked} / 3</p>{chapters.map((c, i) => <article key={c.name} className={`evidence ${i >= unlocked ? 'locked' : ''}`}><span className="evidence-symbol">{i < unlocked ? c.symbol : '·'}</span><h2>{i < unlocked ? c.subtitle : '아직 발견하지 못한 기록'}</h2>{i < unlocked ? <><p className="letter-body">{c.clue}</p><p className="fine">{game.places[i] ? '이 기기에 조사 위치 저장됨' : '위치 없는 체험 기록'}</p></> : <p>사건을 진행하면 열립니다.</p>}</article>)}</section>}
      {tab === 'collection' && <section className="journal"><span className="eyebrow">PLACES & MEMORIES</span><h1>나만 아는 동네.</h1><RouteMap step={game.step} unlocked={unlocked}/><div className="stats"><div><strong>{unlocked}</strong><span>발견한 장소</span></div><div><strong>{game.phase === 'solved' ? 1 : 0}</strong><span>해결한 사건</span></div><div><strong>{game.phase === 'solved' ? 1 : 0}</strong><span>수집한 우표</span></div></div>{game.phase === 'solved' ? <article className="stamp-card"><span>✧</span><div><h2>별 우표</h2><p>과거의 나와 지금의 내가 만나는 약속.</p><small>CASE 001 · 사건 해결 기념</small></div></article> : <p className="notice">사건을 해결하면 첫 번째 우표가 이곳에 도착합니다.</p>}{getSaved(KEY + ':note') && <article className="paper"><span className="eyebrow">내가 남긴 편지</span><p className="letter-body">{getSaved(KEY + ':note')}</p></article>}</section>}
    </main><nav className="bottom" aria-label="주요 메뉴">{([['case','◇','사건'],['book','▤','증거 수첩'],['collection','✧','내 동네']] as const).map(([id, icon, name]) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}><span>{icon}</span>{name}</button>)}</nav></>}
    <footer>비밀동네 <span>·</span> 첫 번째 현장 노트 <span>·</span> PROTOTYPE 01</footer>
  </div>;
}
function RouteMap({ step, unlocked, landing = false }: {step: number; unlocked: number; landing?: boolean}) {
  return <div className={`map ${landing ? 'map-landing' : ''}`}><div className="map-label">STORY MAP <span>가상 동네 · 실제 지도가 아닙니다</span></div><svg viewBox="0 0 420 245" role="img" aria-label={`가상 동네의 세 조사 장소, ${unlocked}곳 발견`}><defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#ffffff" strokeOpacity=".035"/></pattern></defs><rect width="420" height="245" fill="url(#grid)"/><path d="M-20 200 Q100 60 190 155 T450 145" stroke="#32544e" strokeWidth="30" fill="none"/><g fill="#20322d" stroke="#3c5144" strokeWidth="1"><rect x="24" y="34" width="75" height="60" rx="14" transform="rotate(-8 24 34)"/><rect x="147" y="26" width="72" height="48" rx="8"/><rect x="289" y="163" width="90" height="45" rx="9"/><circle cx="332" cy="66" r="40"/></g><g fill="none" stroke="#607163" strokeWidth="9" strokeOpacity=".35"><path d="M-10 115L430 95M110 -10L145 260M260 -10L241 260"/></g><path d="M74 142 Q90 64 178 108 T335 91" fill="none" stroke="#d5b97b" strokeWidth="2" strokeDasharray="5 7"/>{[[74,142],[195,113],[335,91]].map(([x,y], i) => <g key={i} transform={`translate(${x},${y})`}><circle r={i === step ? 23 : 18} fill={i < unlocked ? '#d5b97b' : '#14241f'} stroke={i === step || i < unlocked ? '#d5b97b' : '#617466'} strokeWidth="2"/>{i === step && <circle r="29" fill="none" stroke="#d5b97b" strokeOpacity=".25"/>}<text textAnchor="middle" dy="6" fill={i < unlocked ? '#14241f' : '#e5d6b5'} fontSize="19">{i < unlocked ? '✓' : ['❧','≈','✧'][i]}</text><text textAnchor="middle" y="49" fill="#c1c8b9" fontSize="12">{['나뭇잎','파도','별'][i]}</text></g>)}<text x="25" y="224" fill="#8eaa9b" fontSize="10" letterSpacing="3">SECRET NEIGHBORHOOD</text><text x="387" y="38" fill="#d5b97b" fontSize="18">↑</text><text x="389" y="53" fill="#8eaa9b" fontSize="9">N</text></svg></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
