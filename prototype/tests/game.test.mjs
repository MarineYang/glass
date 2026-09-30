import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initial, restore, advance, distance, readLetter, chapters } from '../src/game.ts';
test('bad or incompatible stored progress starts safely', () => {
  for (const raw of ['{', '{}', 'null', JSON.stringify({...initial(), step: 99}), JSON.stringify({...initial(), phase:'solved'}), JSON.stringify({...initial(), mode:'bad'})]) assert.deepEqual(restore(raw), initial());
});
test('a wrong answer and travel screen cannot advance; all three clues finish', () => {
  let state = {...initial(), started:true};
  assert.deepEqual(advance(state, chapters[0].answer), state);
  for (let i=0;i<3;i++) {
    state = {...state, phase:'clue'};
    assert.equal(state.step,i);
    assert.deepEqual(advance(state,(chapters[i].answer+1)%3),state);
    state = advance(state,chapters[i].answer);
    state = restore(JSON.stringify(state));
  }
  assert.equal(state.phase,'solved'); assert.equal(state.step,2);
  assert.deepEqual(advance(state,0),state);
});
test('coordinates are validated, distance behaves at same point and across date line', () => {
  const point = {lat:37.5,lng:127,accuracy:10};
  assert.equal(distance(point,point),0);
  assert.ok(distance(point,{...point,lat:37.501})>110);
  assert.ok(distance({lat:0,lng:179.999,accuracy:1},{lat:0,lng:-179.999,accuracy:1})<225);
  assert.deepEqual(restore(JSON.stringify({...initial(),places:[point,{lat:400,lng:0,accuracy:0}]})).places,[point,null]);
});
test('shared Korean letters decode safely with malformed and oversized input rejected', () => {
  const text='오늘의 나에게 ✧\n좋은 하루!';
  assert.equal(readLetter('#letter='+encodeURIComponent(text)),text);
  assert.equal(readLetter('#letter=%ZZ'),null);
  assert.equal(readLetter('#letter='+ 'a'.repeat(401)),null);
  assert.equal(readLetter('#other=hello'),null);
});
