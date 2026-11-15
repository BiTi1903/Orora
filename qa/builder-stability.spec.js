import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';
const mocks={
 'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
 'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
 'lib/api.js':'export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:"ORORA"});export const saveHomeContent=async()=>{};',
};
test('builder settles at rest without repeated frame reloads or size changes',async({page},testInfo)=>{
 test.skip(testInfo.project.name !== 'width-1440', 'Viewport matrix runs once');
 test.setTimeout(120000);
 await page.setViewportSize({width:1440,height:760});
 await mount(page,`import Builder from '/src/admin/builder/VisualBuilder.jsx';${render("R.createElement('div',{className:'admin-shell'},R.createElement('aside',{className:'admin-side'},'ORORA'),R.createElement('main',{className:'admin-main'},R.createElement('div',{className:'admin-workspace-panel'},R.createElement('section',{className:'home-admin'},R.createElement('div',{className:'home-admin-top'},R.createElement('h1',null,'Trang chủ')),R.createElement('div',{className:'home-builder-panel'},R.createElement(Builder))))))")}`,mocks);
 await expect(page.locator('.visual-builder')).toBeVisible();
 await page.addStyleTag({content:'::-webkit-scrollbar{width:17px;height:17px}'});
 for(const section of ['Câu chuyện','Navbar','Chi tiết SP']){
  await page.locator('.builder-sections').getByRole('button',{name:new RegExp(section)}).click();
  for(const [width,height] of [[1920,700],[1600,700],[1440,700],[1366,700],[1280,700],[1100,700],[1000,700],[950,700],[900,700],[768,700]]){
   await page.setViewportSize({width,height});
   const metrics=await page.evaluate(async()=>{
    const host=document.querySelector('.builder-frame-host'),frame=host.querySelector('iframe'),root=document.querySelector('.visual-builder');
    let mutations=0,loads=0;const sizes=[];
    const observer=new MutationObserver(entries=>mutations+=entries.length);observer.observe(root,{attributes:true,subtree:true,attributeFilter:['style','open']});
    const loaded=()=>loads++;frame.addEventListener('load',loaded);
    await new Promise(resolve=>{let count=0;const tick=()=>{sizes.push([host.clientWidth,host.clientHeight,frame.style.transform,root.clientHeight]);if(++count<45)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
    observer.disconnect();frame.removeEventListener('load',loaded);
    return {mutations,loads,lastSizes:[...new Set(sizes.slice(15).map(value=>JSON.stringify(value)))]};
   });
   console.log(JSON.stringify({section,width,height,metrics}));
   expect(metrics.loads).toBe(0);expect(metrics.lastSizes).toHaveLength(1);
  }
 }
});

test('unrelated head updates do not remove and reload preview styles',async({page})=>{
 await mount(page,`import Frame from '/src/admin/builder/PreviewFrame.jsx';${render("R.createElement(Frame,{device:'desktop'},R.createElement('p',{id:'stable-preview-text'},'Preview ổn định'))")}`);
 await page.addStyleTag({content:'#stable-preview-text{color:rgb(18,52,86)}'});
 await expect(page.frameLocator('iframe').locator('#stable-preview-text')).toHaveCSS('color','rgb(18, 52, 86)');
 const result=await page.evaluate(async()=>{
  const doc=document.querySelector('iframe').contentDocument,styles=[...doc.head.querySelectorAll('[data-preview-style]')];
  let removed=0;const observer=new MutationObserver(entries=>{for(const entry of entries)for(const node of entry.removedNodes)if(node.nodeType===1&&node.hasAttribute('data-preview-style'))removed++;});observer.observe(doc.head,{childList:true});
  const title=document.head.querySelector('title')||document.head.appendChild(document.createElement('title'));
  await new Promise(resolve=>{let count=0;const tick=()=>{title.textContent=`Admin ${count++}`;if(count<12)requestAnimationFrame(tick);else requestAnimationFrame(()=>requestAnimationFrame(resolve));};requestAnimationFrame(tick);});
  observer.disconnect();return {removed,retained:styles.every(node=>node.isConnected)};
 });
 expect(result).toEqual({removed:0,retained:true});
});
