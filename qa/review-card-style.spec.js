import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('review card rounding updates in the CMS preview',async({page})=>{
 await mount(page,`import Settings from '/src/admin/builder/ReviewCardSettings.jsx';import {Testimonials} from '/src/components/Extras.jsx';function Fixture(){const [card,setCard]=R.useState({});return R.createElement(R.Fragment,null,R.createElement(Settings,{value:card,onChange:p=>setCard(v=>({...v,...p}))}),R.createElement(Testimonials,{preview:true,previewData:{testimonialsTitle:'Cảm nhận',reviews:[{name:'Khách hàng',text:'Nội dung đánh giá'}],testimonialsStyles:{card}}}))};${render('R.createElement(Fixture)')}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}'});
 await expect(page.locator('.review')).toHaveCSS('border-radius','26px');await page.getByLabel('Bo góc (px)',{exact:true}).fill('32');await expect(page.locator('.review')).toHaveCSS('border-radius','32px');await fit(page);
});
