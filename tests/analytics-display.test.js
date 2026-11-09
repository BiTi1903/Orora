import test from 'node:test';
import assert from 'node:assert/strict';
import { chartDisplaySeries } from '../src/lib/analytics-demo.js';
test('chart-only historical points leave source reports and real zero counts unchanged',()=>{
  const rows=[
    {day:'2026-11-03',pageViews:null,visitors:null,productClicks:null,paidOrders:0,paidAmount:0},
    {day:'2026-11-04',pageViews:0,visitors:0,productClicks:0,paidOrders:0,paidAmount:0},
    {day:'2026-11-05',pageViews:null,paidOrders:1,paidAmount:123000},
    {day:'2026-11-09',pageViews:null,paidOrders:0,paidAmount:0},
  ];
  const original=structuredClone(rows),display=chartDisplaySeries(rows);
  assert.equal(display[0].pageViews,38);
  assert.equal(display[0].paidAmount,409000);
  assert.deepEqual(display[1],rows[1]);
  assert.equal(display[2].paidAmount,123000);
  assert.deepEqual(display[3],rows[3]);
  assert.deepEqual(rows,original);
  assert.equal(rows.reduce((sum,day)=>sum+day.paidAmount,0),123000);
});
