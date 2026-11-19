import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';

for(const reducedMotion of ['no-preference','reduce'])test(`slideshow loads images progressively with ${reducedMotion} motion`,async({page})=>{
 await page.emulateMedia({reducedMotion});
 const requests=[];
 await page.route('**/efficiency-slide-*.svg',route=>{
  requests.push(new URL(route.request().url()).pathname);
  return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="260" height="320"><rect width="260" height="320" fill="pink"/></svg>'});
 });
 await mount(page,`import Slides from '/src/components/ProductSlideshow.jsx';${render("R.createElement('div',{style:{height:320,width:260,position:'relative'}},R.createElement(Slides,{images:Array.from({length:6},(_,i)=>'/efficiency-slide-'+i+'.svg'),interval:30000}))")}`);
 const images=page.locator('.product-slideshow img');
 await expect(images.nth(0)).toHaveAttribute('src','/efficiency-slide-0.svg');
 if(reducedMotion==='no-preference')await expect(images.nth(1)).toHaveAttribute('src','/efficiency-slide-1.svg');
 else await expect(images.nth(1)).not.toHaveAttribute('src',/./);
 for(const index of [2,3,4,5])await expect(images.nth(index)).not.toHaveAttribute('src',/./);
 await expect.poll(()=>requests.length).toBe(reducedMotion==='reduce'?1:2);
 await page.getByRole('button',{name:'Ảnh 4',exact:true}).click();
 await expect(images.nth(3)).toHaveClass('is-active');
 await expect(images.nth(3)).toHaveAttribute('src','/efficiency-slide-3.svg');
 await expect(images.nth(0)).toHaveAttribute('src','/efficiency-slide-0.svg');
 if(reducedMotion==='no-preference')await expect(images.nth(4)).toHaveAttribute('src','/efficiency-slide-4.svg');
 await expect(images.nth(5)).not.toHaveAttribute('src',/./);
 await expect.poll(()=>requests.length).toBe(reducedMotion==='reduce'?2:4);
});

test('scroll text does no offscreen layout work and previews remain fully readable',async({page})=>{
 const content={philosophyBody:'Chăm sóc mỗi ngày cho bạn tự tin hơn',philosophyLabel:'ORORA'};
 await mount(page,`import Text from '/src/components/ScrollText.jsx';${render("R.createElement('main',null,R.createElement('div',{style:{height:2400}}),R.createElement(Text),R.createElement('div',{style:{height:2400}}))")}`,{'hooks/useHomeContent.js':`export default function home(){return ${JSON.stringify(content)}}`});
 await expect(page.locator('.st-word')).toHaveCount(9);
 const reads=await page.evaluate(async()=>{
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  const section=document.querySelector('.scroll-text'),original=section.getBoundingClientRect.bind(section);
  let reads=0;section.getBoundingClientRect=()=>{reads++;return original();};
  for(const y of [50,100,150]){
   window.scrollTo(0,y);window.dispatchEvent(new Event('scroll'));
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  }
  return reads;
 });
 expect(reads).toBe(0);
 await page.locator('.scroll-text').scrollIntoViewIfNeeded();
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.st-word.on')).toHaveCount(9);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await mount(page,`import Text from '/src/components/ScrollText.jsx';${render(`R.createElement(Text,{preview:true,previewData:${JSON.stringify(content)}})`)}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}'});
 await expect(page.locator('.st-word.on')).toHaveCount(9);
});
