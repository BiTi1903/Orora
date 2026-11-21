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

import {translatePhrase,localizeHomeContent,localizeProduct} from '../src/lib/i18n.js';

test('i18n translates storefront phrases and respects admin translation overrides for English and Japanese',()=>{
 assert.equal(translatePhrase('Mua ngay','en'),'Buy Now');
 assert.equal(translatePhrase('Mua ngay','ja'),'今すぐ購入');
 assert.equal(translatePhrase('Mua ngay','vi'),'Mua ngay');

 const home={
  heroLine1:'Làn da',
  heroLine2:'mỗi ngày',
  heroWords:['dịu nhẹ','rạng rỡ'],
  heroBtn1:'Khám phá',
  navLinks:[{text:'Về Chúng Tôi',href:'#about'},{text:'Sản phẩm',href:'#shop'}],
  translations:{
   en:{heroLine1:'Custom Radiant Skin',navLinks:[{text:'Our Heritage'}]},
   ja:{heroBtn1:'コレクションへ'},
  },
 };

 const enHome=localizeHomeContent(home,'en');
 assert.equal(enHome.heroLine1,'Custom Radiant Skin');
 assert.equal(enHome.heroLine2,'every day');
 assert.deepEqual(enHome.heroWords,['gentle','radiant']);
 assert.equal(enHome.navLinks[0].text,'Our Heritage');
 assert.equal(enHome.navLinks[1].text,'Products');

 const jaHome=localizeHomeContent(home,'ja');
 assert.equal(jaHome.heroLine1,'毎日、素肌を');
 assert.equal(jaHome.heroBtn1,'コレクションへ');
 assert.equal(jaHome.navLinks[0].text,'ブランド紹介');

 const product={id:'p1',name:'Sữa tắm hương hoa hồng ORORA',category:'Chăm sóc cơ thể',description:'Làm sạch dịu nhẹ và lưu hương thanh thoát suốt ngày dài.'};
 const enProduct=localizeProduct(product,'en');
 assert.equal(enProduct.name,'ORORA Rose Petal Body Wash');
 assert.equal(enProduct.category,'Body Care');
 const jaProduct=localizeProduct(product,'ja');
 assert.equal(jaProduct.name,'ORORA ローズペタル ボディウォッシュ');
 assert.equal(jaProduct.category,'ボディケア');
});

