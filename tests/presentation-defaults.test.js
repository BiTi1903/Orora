import test from 'node:test';
import assert from 'node:assert/strict';
import {contrastRatio} from '../src/lib/color-contrast.js';
import {footerCopy} from '../src/lib/footer-copy.js';
test('contrast calculation handles opaque and translucent colors and unknown syntax',()=>{
 assert.equal(contrastRatio('#000','#fff'),21);
 assert.equal(contrastRatio('#fff','#fff'),1);
 assert.ok(contrastRatio('#852447','rgba(255,250,252,.96)')>=4.5);
 assert.ok(contrastRatio('#fbb','#fff')<4.5);
 assert.equal(contrastRatio('var(--custom)','#fff'),null);
 assert.equal(contrastRatio('rgb(300,0,0)','#fff'),null);
});
test('footer applies defaults only for unset fields and preserves explicit English or custom labels',()=>{
 const saved={footerInfoTitle:'INFORMATION',footerContactTitle:'Contact',footerAboutText:'Về đội ngũ chúng tôi',footerShopText:'',footerTermsText:'Terms & Conditions',footerPhone:'custom',footerCopyright:'© 2026 ORORA. All rights reserved.',future:{kept:true}};
 const original=structuredClone(saved),display=footerCopy(saved);
 assert.equal(display.footerInfoTitle,'INFORMATION');assert.equal(display.footerContactTitle,'Contact');assert.equal(display.footerTermsText,'Terms & Conditions');assert.equal(display.footerPrivacyText,'Chính sách bảo mật');assert.equal(display.footerSocialTitle,'Kết nối với ORORA');assert.equal(display.footerAboutText,saved.footerAboutText);assert.equal(display.footerShopText,'');assert.equal(display.footerPhone,'custom');assert.equal(display.footerCopyright,'© 2026 ORORA. All rights reserved.');assert.equal(display.future,saved.future);assert.deepEqual(saved,original);
});
