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
 expect(await page.locator('.hero-media img').evaluate(node=>node.currentSrc)).toContain(page.viewportSize().width<=600?'w_480':page.viewportSize().width<=960?'w_960':'w_1440');await fit(page);
});
test('carousel controls are exposed to assistive tools and offscreen slides are inert',async({page})=>{
 const products=Array.from({length:5},(_,i)=>({id:String(i+1),number:String(i+1),name:`SP ${i+1}`,slug:`sp-${i+1}`,price:'100000',image:'',description:i===1?'Mô tả dài để kiểm tra các nút được căn cùng một hàng dù nội dung sản phẩm có nhiều dòng hơn sản phẩm khác.':''}));
 await mount(page,`import Collection from '/src/components/Collection.jsx';${render('R.createElement(Collection)')}`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false,collectionTitle:"Sản phẩm"}}',
  'hooks/useCategories.js':'export default function cats(){return {categories:[]}}',
  'hooks/useProducts.js':`export default function products(){return {products:${JSON.stringify(products)},loading:false}}`,
 });
 const perView=page.viewportSize().width<=1000?2:3;
 await expect(page.locator('.gallery-slide:not([inert])')).toHaveCount(perView);
 await expect(page.locator('[aria-hidden="true"] button')).toHaveCount(0);
 const positions=await page.locator('.gallery-slide:not([inert]) .buy-button').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().bottom));
 expect(Math.max(...positions)-Math.min(...positions)).toBeLessThan(2);
 const card=await page.locator('.gallery-slide:not([inert]) .gallery-image').first().boundingBox();
 const arrow=await page.getByRole('button',{name:'Sản phẩm sau',exact:true}).boundingBox();
 expect(Math.abs(arrow.y+arrow.height/2-card.y-card.height/2)).toBeLessThan(2);

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

test('detail image is eager, high priority and appropriately sized for the viewport',async({page})=>{
 await page.route('**/res.cloudinary.com/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"/>'}));
 await mount(page,`import Detail from '/src/components/ProductDetail.jsx';${render(`R.createElement(Detail,{preview:true,previewProduct:{id:'1',name:'Kiểm tra ảnh',image:'https://res.cloudinary.com/demo/image/upload/v1/product.jpg',price:'409000'}})`)}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}'});
 const image=page.locator('.product-detail-main-img');await expect(image).toBeVisible();
 await expect(image).toHaveAttribute('loading','eager');await expect(image).toHaveAttribute('fetchpriority','high');
 const width=page.viewportSize().width;await expect(image).toHaveAttribute('src',new RegExp(`w_${width<=600?800:width<=1200?1200:1800}`));
});

test('slideshow waits until it is visible before loading extra images or autoplaying',async({page})=>{
 await mount(page,`import Slides from '/src/components/ProductSlideshow.jsx';${render(`R.createElement('div',null,R.createElement('div',{style:{height:'2400px'}}),R.createElement('div',{style:{height:320,width:260,position:'relative'}},R.createElement(Slides,{images:['/preview/product.svg?one','/preview/product.svg?two','/preview/product.svg?three'],interval:200})))`)}`);
 const images=page.locator('.product-slideshow img');await expect(images).toHaveCount(3);
 await expect(images.nth(1)).not.toHaveAttribute('src',/./);await expect(images.nth(2)).not.toHaveAttribute('src',/./);
 await page.locator('.product-slideshow').scrollIntoViewIfNeeded();
 await expect(images.nth(1)).toHaveAttribute('src',/two/);await expect(images.nth(2)).toHaveAttribute('src',/three/);
 await expect(page.locator('.product-slideshow-dots button[aria-pressed="true"]')).not.toHaveAttribute('aria-label','Ảnh 1');
});

test('mobile preload and responsive hero share one correctly sized image request',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1.75,baseURL:'http://127.0.0.1:5173'});
 const page=await context.newPage();
 const {publicHomeShell}=await import('../src/lib/home-shell.js');
 const payload=publicHomeShell({heroTitle:'ORORA',heroImage:'https://res.cloudinary.com/demo/image/upload/v1/hero.jpg',sectionVisibility:{about:false,collection:false,productneeds:false,philosophy:false,features:false,reviews:false,newsletter:false,footer:false,ticker:false}});
 const images=[];
 await page.route('**/api/storefront-shell',route=>route.fulfill({json:payload}));
 await page.route('**/api/analytics',route=>route.fulfill({status:204,body:''}));
 await page.route('**/src/lib/live-home-client.js*',route=>route.fulfill({contentType:'application/javascript',body:'export function listenHome(){return()=>{}};export function listenCategories(next){next([]);return()=>{}}'}));
 await page.route('**/res.cloudinary.com/**',route=>{images.push(route.request().url());return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"/>'});});
 await page.goto('/');await expect(page.locator('.hero-media')).toHaveClass(/is-ready/);
 expect(await page.locator('.hero-media img').evaluate(node=>node.currentSrc)).toContain('w_800');
 expect(images).toHaveLength(1);expect(images[0]).toContain('w_800');
 await context.close();
});

test('below-fold scroll runtime is not requested before the visitor scrolls',async({page})=>{
 let requests=0;
 await page.route('**/src/lib/home-animations*',route=>{requests++;return route.fulfill({contentType:'application/javascript',body:'export function startHomeAnimations(){window.__effectsStarted=true;return()=>{}}'});});
 await page.route('**/api/analytics',route=>route.fulfill({status:204,body:''}));
 await mount(page,`import App from '/src/App.jsx';${render('R.createElement(App)')}`,{
  'hooks/useHomeContent.js':`export default function home(){return {loading:false,heroTitle:'ORORA',chatSettings:{enabled:false},sectionVisibility:{navbar:false,about:false,collection:false,productneeds:false,philosophy:false,features:false,reviews:false,newsletter:false,footer:false,ticker:false}}}`,
 });
 await expect(page.locator('.hero')).toBeVisible();expect(requests).toBe(0);
 await page.evaluate(()=>{const spacer=document.createElement('div');spacer.style.height='2400px';document.body.append(spacer);window.scrollTo(0,300);});
 if(page.viewportSize().width>768)await expect.poll(()=>requests).toBe(1);
 else expect(requests).toBe(0);
});
