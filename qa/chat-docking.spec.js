import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';
test('chat docks to either edge and stays above back-to-top after dragging down',async({page})=>{
 await mount(page,`import Chat from '/src/components/ChatButton.jsx';import Top from '/src/components/BackToTop.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:2500}},R.createElement(Top)),R.createElement(Chat))")}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false,chatSettings:{hintEnabled:false}}}','hooks/useChatConversation.js':'export default function chat(){return {metadata:{}}}'});
 const chat=page.getByRole('button',{name:'Chat với ORORA',exact:true});await expect(chat).toBeVisible();
 for(const side of ['left','right']){const start=await chat.boundingBox();await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();await page.mouse.move(side==='left'?2:page.viewportSize().width-2,998,{steps:10});await page.mouse.up();await expect.poll(async()=>{const b=await chat.boundingBox();return Math.abs(side==='left'?b.x-12:page.viewportSize().width-b.x-b.width-12)}).toBeLessThan(2);await expect.poll(async()=>{const b=await chat.boundingBox(),top=await page.locator('.back-to-top').boundingBox();return top.y-b.y-b.height}).toBeGreaterThanOrEqual(10);}
});
