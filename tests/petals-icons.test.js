import test from 'node:test';
import assert from 'node:assert/strict';
import {petalSettings} from '../src/lib/petals.js';
import {BUTTON_ICON_TARGETS,BUTTON_ICON_DEFAULTS} from '../src/lib/button-icons.js';
test('petal settings keep existing defaults and bound resource usage for untrusted saved values',()=>{
 assert.equal(petalSettings().count,10);assert.equal(petalSettings().mobileCount,10);assert.equal(petalSettings().speed,1);assert.equal(petalSettings({enabled:false}).enabled,false);
 const s=petalSettings({count:1e9,mobileCount:-3,speed:0,size:999,opacity:999,color:'url(bad)'});assert.equal(s.count,40);assert.equal(s.mobileCount,0);assert.equal(s.speed,.25);assert.equal(s.size,24);assert.equal(s.opacity,100);assert.equal(s.color,'#f7b8d0');assert.equal(petalSettings({count:0}).count,0);assert.equal(petalSettings(null).enabled,true);
});
test('each editable icon has one original fallback, including the brand marks',()=>{
 const names=BUTTON_ICON_TARGETS.map(([key])=>key);assert.equal(new Set(names).size,names.length);
 for(const name of names)assert.ok(BUTTON_ICON_DEFAULTS[name],name);
 assert.equal(BUTTON_ICON_DEFAULTS.facebook.props.fill,'currentColor');assert.equal(BUTTON_ICON_DEFAULTS.tiktok.props.fill,'currentColor');
});
