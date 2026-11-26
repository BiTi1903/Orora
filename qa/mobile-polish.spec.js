import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('newsletter has separate usable fields, no fixed star, and editable consent in preview',async({page})=>{
 await mount(page,`import {Newsletter} from '/src/components/Extras.jsx';${render(`R.createElement(Newsletter,{preview:true,previewData:{newsletterTitle:'Nhận ưu đãi',newsletterPlaceholder:'Nhập email',newsletterButton:'Đăng ký',newsletterConsent:'Đồng ý nhận tin thử nghiệm',newsletterStyles:{consent:{color:'#123456'}}}})`)}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}'});
 const section=page.locator('.newsletter');
 expect(await section.evaluate(node=>getComputedStyle(node,'::before').content)).toBe('none');
 await expect(page.getByText('Đồng ý nhận tin thử nghiệm')).toBeVisible();
 await expect(page.locator('.newsletter-consent')).toHaveCSS('color','rgb(18, 52, 86)');
 const input=await page.getByRole('textbox').boundingBox(),button=await page.getByRole('button',{name:'Đăng ký'}).boundingBox();
 expect(input.height).toBeGreaterThanOrEqual(48);expect(button.height).toBeGreaterThanOrEqual(48);
 if(page.viewportSize().width<=720)expect(button.y).toBeGreaterThan(input.y+input.height);
 if(page.viewportSize().width===390)await page.screenshot({path:'/tmp/orora-mobile-polish.png'});
 await fit(page);
});
test('chat hint follows its button when scrolling and moving without overlapping',async({page})=>{
 await mount(page,`import ChatHint from '/src/components/ChatHint.jsx';import '/src/styles/chat-button.css';function Fixture(){const anchor=R.useRef(null);return R.createElement(R.Fragment,null,R.createElement('div',{style:{height:'2400px'}}),R.createElement('div',{id:'launcher',className:'orora-chat-launcher'},R.createElement('button',{ref:anchor,id:'anchor',style:{position:'relative',width:52,height:52}},'Chat'),R.createElement(ChatHint,{open:false,dismissed:false,anchor,settings:{hintDelay:0,hintText:'Bạn cần tư vấn sản phẩm?'}})))};${render('R.createElement(Fixture)')}`);
 const hint=page.getByRole('status');await expect(hint).toBeVisible();
 for(const bottom of [112,210,56]){
  await page.evaluate(value=>{document.getElementById('launcher').style.bottom=value+'px';window.scrollTo(0,value*3)},bottom);
  await expect.poll(async()=>{const a=await page.locator('#anchor').boundingBox(),h=await hint.boundingBox();return h.y+h.height<=a.y-12||h.y>=a.y+a.height+12}).toBe(true);
 }
 await fit(page);
});
test('chat hint repeats after hiding or dismissal and resumes when chat closes',async({page})=>{
 await page.clock.install();
 await page.clock.pauseAt(new Date(Date.now()+60000));
 await mount(page,`import ChatButton from '/src/components/ChatButton.jsx';${render('R.createElement(ChatButton)')}`,{
  'hooks/useHomeContent.js':`export default function home(){return {loading:false,footerPhone:"0900000000",chatSettings:{hintDelay:1,hintDuration:1,hintRepeatDelay:2,hintText:'Bạn cần tư vấn?'}}}`,
  'hooks/useChatConversation.js':'export default function conversation(){return {metadata:{}}}',
 });
 // The launcher measures its fixed dock on its first animation frame.
 await page.clock.runFor(20);
 await expect(page.locator('.chat-button')).toBeVisible();
 const hint=page.locator('.orora-chat-hint');
 await expect(hint).toHaveCount(0);await page.clock.runFor(1000);await expect(hint).toBeVisible();
 await page.clock.runFor(1000);await expect(hint).toHaveCount(0);await page.clock.runFor(2000);await expect(hint).toBeVisible();
 await page.getByRole('button',{name:'Đóng lời nhắc chat',exact:true}).click();await expect(hint).toHaveCount(0);
 await page.clock.runFor(2000);await expect(hint).toBeVisible();
 await page.getByRole('button',{name:'Bạn cần tư vấn?',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
 await page.clock.runFor(5000);await expect(hint).toHaveCount(0);
 await page.getByRole('button',{name:'Đóng lựa chọn tư vấn',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.clock.runFor(1000);await expect(hint).toBeVisible();
});

test('default hint timing is 5 seconds before first display, 3 visible and 10 hidden',async({page})=>{
 await page.clock.install();
 await page.clock.pauseAt(new Date(Date.now()+60000));
 await mount(page,`import ChatButton from '/src/components/ChatButton.jsx';${render('R.createElement(ChatButton)')}`,{'hooks/useHomeContent.js':`export default function home(){return {loading:false}}`,'hooks/useChatConversation.js':'export default function conversation(){return {metadata:{}}}'});
 // The launcher measures its fixed dock on its first animation frame.
 await page.clock.runFor(20);
 await expect(page.locator('.chat-button')).toBeVisible();
 const hint=page.locator('.orora-chat-hint');
 await page.clock.runFor(4900);await expect(hint).toHaveCount(0);
 await page.clock.runFor(100);await expect(hint).toBeVisible();
 await page.clock.runFor(2900);await expect(hint).toBeVisible();
 await page.clock.runFor(100);await expect(hint).toHaveCount(0);
 await page.clock.runFor(9900);await expect(hint).toHaveCount(0);
 await page.clock.runFor(100);await expect(hint).toBeVisible();
});
