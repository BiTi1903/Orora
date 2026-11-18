import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
const hero={loading:false,heroTitle:'ORORA',heroRotatorPrefix:'Làn da',heroRotatorSuffix:'mỗi ngày',heroRotator:['dịu nhẹ','được làm sạch'],heroButtonText:'Khám phá',shopButtonText:'Xem sản phẩm'};
const mock={'hooks/useHomeContent.js':`export default function home(){return ${JSON.stringify(hero)}}`};
test('cold and warm font loads keep the same hero geometry and real italic weight',async({page})=>{
 let requested=0;await page.route('**/*.woff2*',async route=>{requested++;await new Promise(resolve=>setTimeout(resolve,350));await route.continue();});
 await mount(page,`import Hero from '/src/components/Hero.jsx';${render('R.createElement(Hero)')}`,mock);
 await expect(page.locator('.hero')).toHaveAttribute('data-font-state','ready');
 expect(requested).toBeGreaterThan(0);
 const measure=()=>page.evaluate(()=>{const hero=document.querySelector('.hero'),rotator=document.querySelector('.hero-rotator'),word=document.querySelector('.rotator-box em');return {height:hero.getBoundingClientRect().height,rotatorTop:rotator.getBoundingClientRect().top,weight:getComputedStyle(word).fontWeight,width:document.querySelector('.rotator-box').getBoundingClientRect().width};});
 const first=await measure();expect(first.weight).toBe('500');
 const shopButton=page.locator('.hero-actions').getByRole('link',{name:'Xem sản phẩm'});
 await expect(shopButton).toBeInViewport({ ratio:1 });
 await expect(page.locator('.rotator-box em')).toHaveText('được làm sạch');const rotated=await measure();
 expect(rotated.height).toBeCloseTo(first.height,0);expect(rotated.rotatorTop).toBeCloseTo(first.rotatorTop,0);expect(rotated.width).toBeCloseTo(first.width,0);
 await page.reload();await expect(page.locator('.hero')).toHaveAttribute('data-font-state','ready');const warm=await measure();
 expect(warm).toEqual(first);await fit(page);
});
test('failed fonts reveal a stable fallback instead of leaving hero copy hidden',async({page})=>{
 await page.route('**/*.woff2*',route=>route.abort());
 await mount(page,`import Hero from '/src/components/Hero.jsx';${render('R.createElement(Hero)')}`,mock);
 await expect(page.locator('.hero')).toHaveAttribute('data-font-state','fallback');
 await expect(page.locator('.hero-content')).toBeVisible();await fit(page);
});
