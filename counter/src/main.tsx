import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App, Button, Page } from '@wearables-ui-toolkit/mrbd';
import './style.css';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <App>
      <Page headerText="글래스 카운터">
        <main className="counter">
          <div className="readout">
            <p className="eyebrow">HELLO, GLASSES</p>
            <output aria-live="polite" aria-label="현재 숫자">{count}</output>
            <p className="hint">방향키로 이동 · Enter로 선택</p>
          </div>
          <div className="controls">
            <Button title="+1 더하기" onClick={() => setCount(n => Math.min(999, n + 1))} />
            <Button title="−1 빼기" onClick={() => setCount(n => Math.max(0, n - 1))} />
            <Button title="초기화" onClick={() => setCount(0)} />
          </div>
        </main>
      </Page>
    </App>
  );
}
createRoot(document.getElementById('root')!).render(<Counter />);
