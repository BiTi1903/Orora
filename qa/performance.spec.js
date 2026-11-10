import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
const errorsByPage=new WeakMap();
test.beforeEach(({page})=>{const errors=[];errorsByPage.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(({page})=>expect(errorsByPage.get(page)).toEqual([]));
test('HTML discovers the correct hero image before the app bundle finishes loading',async({page})=>{
 let releaseMain;
 await page.route('**/src/main.jsx',async route=>{await new Promise(resolve=>releaseMain=resolve);await route.fulfill({contentType:'application/javascript',body:'window.__mainReady=true;'});});
 await page.route('**/fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
 await page.route('**/api/storefront-shell',route=>route.fulfill({json:{content:{heroTitle:'ORORA'},images:{desktop:'/hero-desktop.svg',mobile:'/hero-mobile.svg'}}}));
 await page.route('**/hero-*.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="100%" height="100%" fill="pink"/></svg>'}));
 const expected=page.viewportSize().width<=600?'hero-mobile.svg':'hero-desktop.svg';
 const request=page.waitForRequest(req=>req.url().endsWith(expected));
 await page.goto('/',{waitUntil:'commit'});await request;
 expect(await page.evaluate(()=>window.__mainReady)).toBeUndefined();
 await expect.poll(()=>typeof releaseMain).toBe('function');releaseMain();await page.waitForFunction(()=>window.__mainReady===true);
});
test('first-screen copy is visible from the early shell and mobile uses the smaller fallback image',async({page})=>{
 await page.route('**/res.cloudinary.com/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"/>'}));
 await mount(page,`import Hero from '/src/components/Hero.jsx';${render('R.createElement(Hero)')}`,{'hooks/useHomeContent.js':`export default function home(){return {loading:true,shellReady:true,heroTitle:'ORORA',heroDescription:'Chăm sóc cơ thể mỗi ngày',heroImage:'https://res.cloudinary.com/demo/image/upload/v1/hero.jpg',heroButtonText:'Khám phá',shopButtonText:'Sản phẩm'}}`});
 await expect(page.getByRole('heading',{name:'ORORA',exact:true})).toBeVisible();
 expect(await page.locator('.hero-letter').first().evaluate(node=>getComputedStyle(node).opacity)).toBe('1');
 expect(await page.locator('.description').evaluate(node=>getComputedStyle(node).animationName)).toBe('none');
 expect(await page.locator('.hero').evaluate(node=>getComputedStyle(node).backgroundImage)).toContain(page.viewportSize().width<=600?'w_900':'w_1920');await fit(page);
});
test('carousel controls are exposed to assistive tools and offscreen slides are inert',async({page})=>{
 const products=Array.from({length:5},(_,i)=>({id:String(i+1),number:String(i+1),name:`SP ${i+1}`,slug:`sp-${i+1}`,price:'100000',image:''}));
 await mount(page,`import Collection from '/src/components/Collection.jsx';${render('R.createElement(Collection)')}`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false,collectionTitle:"Sản phẩm"}}',
  'hooks/useCategories.js':'export default function cats(){return {categories:[]}}',
  'hooks/useProducts.js':`export default function products(){return {products:${JSON.stringify(products)},loading:false}}`,
 });
 const perView=page.viewportSize().width<=1000?2:3;
 await expect(page.locator('.gallery-slide:not([inert])')).toHaveCount(perView);
 await expect(page.locator('[aria-hidden="true"] button')).toHaveCount(0);
 const controls=page.getByRole('group',{name:'Chọn sản phẩm',exact:true});await expect(controls.getByRole('button')).toHaveCount(5);
 await controls.getByRole('button',{name:'Xem SP 5',exact:true}).click();await expect(controls.getByRole('button',{name:'Xem SP 5',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.gallery-slide:not([inert])')).toHaveCount(perView);await fit(page);
});

test('real app paints the cached public hero while realtime data is still pending, then accepts fresh CMS content',async({page})=>{
 const content={heroTitle:'ORORA',heroDescription:'Nội dung đầu trang sớm',heroImage:'/early-hero.svg',navLogo:'ORORA',marqueeWords:['Chăm sóc toàn diện','Lành tính'],heroButtonText:'Khám phá',shopButtonText:'Sản phẩm',sectionVisibility:{about:false,collection:false,productneeds:false,philosophy:false,features:false,reviews:false,newsletter:false,footer:false,ticker:true}};
 await page.route('**/api/storefront-shell',route=>route.fulfill({json:{content,images:{desktop:'/early-hero.svg',mobile:'/early-hero.svg'}}}));
 await page.route('**/api/analytics',route=>route.fulfill({status:204,body:''}));
 await page.route('**/early-hero.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="100%" height="100%" fill="pink"/></svg>'}));
 await page.route('**/fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
 await page.route('**/src/lib/live-home-client.js*',route=>route.fulfill({contentType:'application/javascript',body:'export function listenHome(next){window.__publishHome=next;return()=>{}};export function listenCategories(next){next([]);return()=>{}}'}));
 await page.goto('/');await expect(page.getByRole('heading',{name:'ORORA',exact:true})).toBeVisible();await expect(page.getByText('Nội dung đầu trang sớm',{exact:true})).toBeVisible();
 await expect(page.locator('.marquee')).toBeVisible();
 const firstHeight=await page.locator('.home-first-screen').evaluate(node=>node.getBoundingClientRect().height);
 await page.waitForFunction(()=>typeof window.__publishHome==='function');await page.evaluate(value=>window.__publishHome({...value,heroDescription:'Nội dung mới từ CMS'}),content);
 await expect(page.getByText('Nội dung mới từ CMS',{exact:true})).toBeVisible();
 expect(Math.abs(await page.locator('.home-first-screen').evaluate(node=>node.getBoundingClientRect().height)-firstHeight)).toBeLessThan(2);await fit(page);
});

 test('story keeps one entrance layer and mobile does not install scrubbed page animations',async({page})=>{
 await mount(page,`import {startHomeAnimations} from '/src/lib/home-animations.js';document.getElementById('root').innerHTML='<div id="scene"><div style="height:1800px"></div><section class="about"><div class="about-content"><div class="reveal">Story</div></div></section><div class="gallery-item">Product</div></div>';window.stopAnimations=startHomeAnimations(document.getElementById('scene'));`);
 expect(await page.locator('.about-content').evaluate(node=>node.style.transform)).toBe('');
 if(page.viewportSize().width<=768)expect(await page.locator('.gallery-item').evaluate(node=>node.style.transform)).toBe('');
 await page.evaluate(()=>window.stopAnimations());
 });
