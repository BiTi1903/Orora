import {test,expect} from '@playwright/test';
import {mount,render,reveal} from './fixtures';
async function chat(page,settings={}) {
 await mount(page,`import Feedback from '/src/components/ButtonPressFeedback.jsx';import Chat from '/src/components/ChatButton.jsx';import Glass from '/src/components/MobileGlass.jsx';${render(`R.createElement(R.Fragment,null,R.createElement(Glass),R.createElement(Feedback,{settings:${JSON.stringify(settings)}}),R.createElement(Chat))`)}`,{
  'hooks/useHomeContent.js':`export default function home(){return {loading:false,footerPhone:"0900000000",chatSettings:{hintEnabled:false,...${JSON.stringify(settings)}}}}`,
  'hooks/useChatConversation.js':'export default function conversation(){return {metadata:{},messages:[],sending:false,error:null,send:()=>false,retry(){},reset(){}}}',
 });
 const button=page.getByRole('button',{name:'Chat với ORORA',exact:true});await expect(button).toBeVisible();return page.locator('.chat-button');
}
const animations=button=>button.evaluate(node=>node.getAnimations().filter(a=>a.id==='orora-chat-press').length);
test('chat taps and keyboard activation bounce once without changing the drag transform',async({page})=>{
 const button=await chat(page);
 await button.evaluate(node => document.addEventListener('click', () => node.getAnimations().find(a => a.id === 'orora-chat-press')?.pause(), {once:true}));
 await button.click();await expect(page.getByRole('dialog')).toBeVisible();
 const sample=await button.evaluate(node=>{const a=node.getAnimations().find(a=>a.id==='orora-chat-press');if(!a)return null;a.pause();a.currentTime=a.effect.getTiming().duration*.65;return {count:node.getAnimations().filter(a=>a.id==='orora-chat-press').length,scale:parseFloat(getComputedStyle(node).scale),frames:a.effect.getKeyframes().map(f=>Object.keys(f))};});
 expect(sample.count).toBe(1);expect(sample.scale).toBeGreaterThan(1);expect(sample.frames.flat()).not.toContain('transform');
 await button.evaluate(node=>{
   document.addEventListener('click',()=>{
     node.getAnimations().find(animation=>animation.id==='orora-chat-press')?.pause();
   },{once:true});
 });
 await button.focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toHaveCount(0);expect(await animations(button)).toBe(1);
 await button.evaluate(node=>node.getAnimations().filter(a=>a.id==='orora-chat-press').forEach(a=>a.finish()));expect(await animations(button)).toBe(0);await expect(button).toHaveCSS('scale','none');
});
test('disabled feedback and reduced motion keep chat functional without a press animation',async({page})=>{
 const button=await chat(page,{pressFeedback:false});const rect=await button.boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await expect(button).toHaveCSS('scale','none');await page.mouse.up();expect(await animations(button)).toBe(0);await expect(page.getByRole('dialog')).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});await chat(page);const active=page.locator('.chat-button');await active.click();expect(await animations(active)).toBe(0);await expect(page.getByRole('dialog')).toBeVisible();
});
test('dragging the launcher never opens chat or starts a tap bounce',async({page})=>{
 const button=await chat(page);const rect=await button.boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+100,rect.y-60,{steps:8});await page.mouse.up();await expect(page.getByRole('dialog')).toHaveCount(0);expect(await animations(button)).toBe(0);
});
test('admin previews and saves global feedback without changing unrelated settings',async({page})=>{
 await mount(page,`import Builder from '/src/admin/builder/VisualBuilder.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
  'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
  'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
  'lib/api.js':`export const getHomeContent=async()=>({navStyles:{surfaces:{blur:18}}});export const getProduct=async()=>null;export const saveHomeContent=async patch=>window.__saved=patch;`,
 });
 await page.locator('.builder-sections').getByRole('button',{name:/Navbar/}).click();await page.getByRole('tab',{name:'Thiết lập mục',exact:true}).click();
 await page.getByText('Hiệu ứng, cánh hoa và icon nút',{exact:true}).click();
 const duration=page.getByLabel('Thời gian phản hồi nút (ms)',{exact:true});await reveal(duration);await duration.fill('400');
 const preview=page.getByRole('button',{name:'Nhấn thử hiệu ứng',exact:true});await preview.click();expect(await preview.evaluate(node=>node.getAnimations().find(a=>a.id==='orora-button-press')?.effect.getTiming().duration)).toBe(400);
 await page.getByRole('switch',{name:'Hiệu ứng nhấn cho toàn bộ nút',exact:true}).uncheck();await preview.click();expect(await preview.evaluate(node=>node.getAnimations().filter(a=>a.id==='orora-button-press').length)).toBe(0);
 const popupDuration=page.getByLabel('Thời gian mở form chat (ms)',{exact:true});await reveal(popupDuration);await popupDuration.fill('600');await page.getByRole('button',{name:'Xem thử mở form chat',exact:true}).click();const popup=page.locator('.orora-chat-channel-chooser.is-preview');await expect(popup).toBeVisible();expect(await popup.evaluate(node=>node.getAnimations().find(a=>a.id==='orora-chat-entrance')?.effect.getTiming().duration)).toBe(600);await popup.getByRole('button',{name:'Đóng lựa chọn tư vấn',exact:true}).click();await page.getByRole('switch',{name:'Mở form chat từ nút chat',exact:true}).uncheck();await page.getByRole('button',{name:'Xem thử mở form chat',exact:true}).click();expect(await popup.evaluate(node=>node.getAnimations().filter(a=>a.id==='orora-chat-entrance').length)).toBe(0);
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({navStyles:{surfaces:{pressFeedback:false,pressDuration:400,chatPopupAnimation:false,chatPopupDuration:600}}});
});

test('shared feedback covers website and admin buttons, SVG targets and keyboard without replacing transforms',async({page})=>{
 await mount(page,`import Feedback from '/src/components/ButtonPressFeedback.jsx';${render("R.createElement(R.Fragment,null,R.createElement(Feedback),R.createElement('button',{id:'site',onClick:event=>event.stopPropagation(),style:{transform:'translateX(10px)'}},R.createElement('svg',{width:20,height:20},R.createElement('path',{d:'M0 0h20v20H0Z'}))),R.createElement('section',{className:'admin-main'},R.createElement('button',{className:'admin-btn',id:'admin'},'Lưu thử'),R.createElement('button',{disabled:true},'Không dùng'))) ")}`);
 const button=page.locator('#site');await button.locator('svg').click();expect(await button.evaluate(node=>node.getAnimations().filter(a=>a.id==='orora-button-press').length)).toBe(1);await expect(button).toHaveCSS('transform','matrix(1, 0, 0, 1, 10, 0)');
 await button.evaluate(node=>node.getAnimations().filter(a=>a.id==='orora-button-press').forEach(a=>{a.pause();a.currentTime=100;}));await button.locator('svg').click();expect(await button.evaluate(node=>node.getAnimations().filter(a=>a.id==='orora-button-press').length)).toBe(1);
 const admin=page.locator('#admin');await admin.focus();await page.keyboard.press('Space');expect(await admin.evaluate(node=>node.getAnimations().filter(a=>a.id==='orora-button-press').length)).toBe(1);
});

test('chat forms grow continuously from the launcher, including the AI panel, and cancel when closed early',async({page})=>{
 const button=await chat(page);
 await page.evaluate(() => {
   // Inspect the real keyframes before a slow test runner can miss the transition.
   new MutationObserver(() => {
     document.getAnimations().filter(a => a.id === 'orora-chat-entrance').forEach(a => {
       if (a.playState === 'running') a.pause();
     });
   }).observe(document.body, { childList: true, subtree: true });
 });
 await button.click();const chooser=page.locator('.orora-chat-channel-chooser');await expect(chooser).toBeVisible();
 const sample=await chooser.evaluate(async node=>{const a=node.getAnimations().find(a=>a.id==='orora-chat-entrance');if(!a)return null;a.pause();await a.ready;a.currentTime=0;const start=node.getBoundingClientRect();a.currentTime=a.effect.getTiming().duration/2;const mid=node.getBoundingClientRect();return {count:node.getAnimations().filter(a=>a.id==='orora-chat-entrance').length,startWidth:start.width,startHeight:start.height,startX:start.x+start.width/2,startY:start.y+start.height/2,midWidth:mid.width,finalWidth:node.offsetWidth,duration:a.effect.getTiming().duration};});
 const anchor=await button.boundingBox();expect(sample.count).toBe(1);expect(sample.duration).toBe(420);expect(sample.startWidth).toBeLessThan(sample.midWidth);expect(sample.midWidth).toBeLessThanOrEqual(sample.finalWidth+1);expect(Math.abs(sample.startX-anchor.x-anchor.width/2)).toBeLessThan(2);expect(Math.abs(sample.startY-anchor.y-anchor.height/2)).toBeLessThan(2);
 await chooser.evaluate(node=>node.getAnimations().filter(a=>a.id==='orora-chat-entrance').forEach(a=>a.finish()));await chooser.locator('.orora-chat-channel-options button').click();const panel=page.locator('.orora-chat-panel');await expect(panel).toBeVisible();expect(await panel.evaluate(node=>node.getAnimations().filter(a=>a.id==='orora-chat-entrance').length)).toBe(1);
 await button.focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toHaveCount(0);expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='orora-chat-entrance').length)).toBe(0);
});
test('chat entrance respects reduced motion and an explicit disabled setting',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});let button=await chat(page);await button.click();await expect(page.getByRole('dialog')).toBeVisible();expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='orora-chat-entrance').length)).toBe(0);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await mount(page,`import Chat from '/src/components/ChatButton.jsx';${render('R.createElement(Chat)')}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false,footerPhone:"0900000000",navStyles:{surfaces:{chatPopupAnimation:false}},chatSettings:{hintEnabled:false}}}','hooks/useChatConversation.js':'export default function conversation(){return {metadata:{}}}'});
 button=page.locator('.chat-button');await expect(button).toBeVisible();await button.click();await expect(page.getByRole('dialog')).toBeVisible();expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.id==='orora-chat-entrance').length)).toBe(0);
});

test('closing AI chat plays the exit and restores launcher focus',async({page})=>{
 const button=await chat(page);
 await button.click();
 await page.locator('.orora-chat-channel-options button').click();
 const panel=page.locator('.orora-chat-panel');
 await expect(panel).toBeVisible();
 const exitStarted=await panel.evaluate(node=>{
  node.querySelector('[aria-label="Đóng chat"]').click();
  const exit=node.getAnimations().find(animation=>animation.id==='orora-chat-exit');
  return Boolean(exit)&&node.inert;
 });
 expect(exitStarted).toBe(true);
 await expect(panel).toHaveCount(0);
 await expect(button).toBeFocused();
});
