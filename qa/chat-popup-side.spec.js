import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';
test('compact AI chat follows its launcher and fits a short viewport',async({page})=>{
 await mount(page,`import Chat from '/src/components/ChatButton.jsx';${render("R.createElement(Chat)")}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false,chatSettings:{hintEnabled:false}}}','hooks/useChatConversation.js':'export default function chat(){return {metadata:{},messages:[],sending:false,error:null,send:()=>true,retry:()=>{},reset:()=>{}}}'});
 const launcher=page.getByRole('button',{name:'Chat với ORORA',exact:true});
 await expect(launcher).toHaveClass(/is-positioned/);
 for(const side of ['left','right']){
  if(side==='right'){const b=await launcher.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+100,b.y+b.height/2,{steps:8});await page.mouse.up();}
  await launcher.click();
  const chooser=page.locator('.orora-chat-channel-chooser');await expect(chooser).toHaveAttribute('data-dock-side',side);
  await chooser.getByRole('button',{name:/Trợ lý AI/}).click();
  const panel=page.locator('.orora-chat-panel');await expect(panel).toBeVisible();await expect(panel).toHaveAttribute('data-dock-side',side);
  const b=await panel.boundingBox();expect(b.width).toBeLessThanOrEqual(341);expect(b.height).toBeLessThanOrEqual(521);expect(side==='left'?b.x:page.viewportSize().width-b.x-b.width).toBeCloseTo(12,0);
  await page.keyboard.press('Escape');
 }
 await launcher.click();await page.getByRole('button',{name:/Trợ lý AI/}).click();await page.setViewportSize({width:page.viewportSize().width,height:450});
 await expect.poll(async()=>{const b=await page.locator('.orora-chat-panel').boundingBox();return b.y+b.height}).toBeLessThanOrEqual(439);
 const b=await page.locator('.orora-chat-panel').boundingBox();expect(b.y).toBeGreaterThanOrEqual(11);
});
