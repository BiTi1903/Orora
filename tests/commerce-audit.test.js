import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBank,transferPayload} from '../src/lib/vietqr.js';
import {shippingFeeFor} from '../src/lib/shipping.js';

test('VietQR uses the selected bank BIN and rejects ambiguous banks and unknown amounts',()=>{
 for(const [name,bin] of [['MB Bank','970422'],['Sacombank','970403'],['Eximbank','970431'],['PVcomBank','970412']]){
  const bank=resolveBank(name);
  assert.equal(bank?.bin,bin);
  const body=transferPayload(bank,'0123456789',499000,'OR123');
  assert.ok(body.includes('0006'+bin));
  assert.match(body,/5406499000/);
  assert.match(body,/6304[0-9A-F]{4}$/);
  assert.equal(transferPayload(bank,'0123456789',null,'OR123'),'');
 }
 assert.equal(resolveBank('unknown mb branch'),undefined);
});

test('free delivery threshold uses priced items only in supported regions',()=>{
 const settings={enabled:true,freeAbove:400000,provinces:{'01':{fee:25000}}};
 for(const [subtotal,fee] of [[null,25000],[400000,25000],[400001,0],[500000,0]])assert.equal(shippingFeeFor(settings,'01','1',subtotal).fee,fee);
 assert.equal(shippingFeeFor(settings,'02','1',999000).fee,null);
});
