import test from 'node:test';
import assert from 'node:assert/strict';
import {trackingCopy,trackingTemplate,trackingTheme,trackingStyle,ORDER_TRACKING_FIELDS} from '../src/lib/order-tracking-copy.js';
test('tracking copy retains existing overrides and provides editable search guidance and result templates',()=>{
 const copy=trackingCopy({title:'Đơn hàng ORORA',phoneTab:'Tra bằng số điện thoại',intro:''});
 assert.equal(copy.title,'Đơn hàng ORORA');assert.equal(copy.phoneTab,'Tra bằng số điện thoại');assert.ok(copy.intro);
 assert.equal(trackingTemplate(copy.resultSummary,{count:7}),'Đã tìm thấy 7 đơn hàng. Chọn tình trạng để xem nhanh.');
 assert.equal(trackingTemplate(copy.pageLabel,{page:2,pages:4}),'Trang 2/4');
 assert.equal(new Set(ORDER_TRACKING_FIELDS.map(([key])=>key)).size,ORDER_TRACKING_FIELDS.length);
});
test('tracking appearance provides safe bounded corner sizes and separate desktop/mobile typography',()=>{
 assert.deepEqual(trackingTheme({radius:'',accent:'#123456'}),{'--tracking-accent':'#123456'});
 assert.equal(trackingTheme({radius:80})['--tracking-radius'],'40px');
 const style=trackingStyle({text:{title:{fontSize:22,mobileFontSize:18,fontWeight:700}}},'title');
 assert.equal(style.fontSize,'22px');assert.equal(style['--mobile-font-size'],'18px');assert.equal(style.fontWeight,700);
});
