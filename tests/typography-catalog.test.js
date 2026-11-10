import test from 'node:test';
import assert from 'node:assert/strict';
import {FONT_OPTIONS,FONT_NAMES,toBareFontFamily,toFullFontFamily} from '../src/lib/typography.js';
import {FONT_OPTIONS as builderFonts,toBareFontFamily as builderBare,toFullFontFamily as builderFull} from '../src/admin/builder/options.js';
import {chatSettings} from '../src/lib/chat.js';

test('builder, forms and chat share all supported font families including legacy choices',()=>{
 assert.deepEqual(builderFonts,["",...FONT_NAMES]);
 assert.equal(new Set(FONT_OPTIONS.map(font=>font.value)).size,FONT_OPTIONS.length);
 for(const name of ['Jost','Times New Roman','Arial','Georgia'])assert.ok(builderFonts.includes(name));
 for(const font of FONT_OPTIONS){
  assert.equal(toFullFontFamily(font.value),font.value,'existing saved CSS stack must remain unchanged');
  assert.equal(builderBare(font.value),toBareFontFamily(font.value));
  if(font.value){assert.equal(builderFull(toBareFontFamily(font.value)),font.value);assert.equal(chatSettings({fontFamily:font.value}).fontFamily,font.value);}
 }
 assert.equal(toBareFontFamily(''),'');assert.equal(toFullFontFamily(''),'');
});
test('font conversions retain saved custom stacks and recognize single quoted families',()=>{
 const stored='"Custom Body", Arial, sans-serif';
 assert.equal(toFullFontFamily(stored),stored);
 assert.equal(toBareFontFamily("'Noto Serif', serif"),'Noto Serif');
 assert.equal(toFullFontFamily('var(--font-body)'),'var(--font-body)');
});
