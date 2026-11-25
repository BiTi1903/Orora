import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('compact product details and slogan are editable on mobile while desktop keeps its sizes',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await mount(page,`import Detail from '/src/components/ProductDetail.jsx';import Settings from '/src/admin/builder/MobileDetailSettings.jsx';function Fixture(){const [mobileLayout,setMobile]=R.useState({});return R.createElement(R.Fragment,null,R.createElement(Settings,{value:mobileLayout,onChange:patch=>setMobile(value=>({...value,...patch}))}),R.createElement('main',null,R.createElement(Detail,{preview:true,previewStyles:{mobileLayout,name:{fontSize:48},price:{fontSize:32},description:{fontSize:24},informationTabs:{captionStyle:{fontSize:22}},sloganBody:{fontSize:20},sloganTitle:{fontSize:18}},previewProduct:{id:'test',name:'White Gel - Bodyplex',price:'409000',description:'Gel dưỡng sáng chuyên biệt cho vùng da nhạy cảm, giúp chăm sóc da dịu nhẹ mỗi ngày',detailSections:[{id:'d1',group:'description',enabled:true,showText:true,title:'Mô tả',content:'Sản phẩm chăm sóc da dịu nhẹ.\\nNội dung chi tiết và hướng dẫn được giữ nguyên.'},{id:'s1',group:'specifications',enabled:true,showText:true,title:'Thành phần',content:'Thành phần hoạt tính: Tranexamic Acid, Dipotassium Glycyrrhizate.'},{id:'s2',group:'specifications',enabled:true,showText:true,title:'Dung tích',content:'150 ml'}]},previewProducts:[]})))};${render('R.createElement(Fixture)')}`,{
  'hooks/useHomeContent.js':`export default function home(){return {loading:false,productFaq:{enabled:true,title:'Câu hỏi thường gặp',heading:{fontSize:26},itemHeading:{fontSize:18},itemBody:{fontSize:18},items:[{id:'usage',title:'Sử dụng như thế nào?',text:'Đọc hướng dẫn trên bao bì trước khi dùng.',productIds:['test']}]},productPolicies:[{id:'ship',kind:'shipping',title:'FREESHIP',content:'Giao hàng miễn phí cho đơn từ 499k'}],productSlogan:{title:'ORORA',text:'CHĂM SÓC CƠ THỂ CHÚNG TA\\nMỖI NGÀY'}}}`,
  'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
  'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
 });
 const mobile=page.viewportSize().width<=768;
 await expect.poll(async()=>parseFloat(await page.locator('.product-detail-info h1').evaluate(el=>getComputedStyle(el).fontSize))).toBeCloseTo(mobile?26:48,0);
 await expect(page.locator('.product-detail-description')).toHaveCSS('font-size',mobile?'14px':'24px');
 await expect(page.locator('.product-slogan-card p')).toHaveCSS('font-size',mobile?'13px':'20px');
 await expect(page.locator('.product-assurance h3')).toHaveCSS('font-size',mobile?'13px':'14px');
 await expect(page.locator('.product-assurance p')).toHaveCSS('font-size',mobile?'12px':'13px');
 await expect(page.locator('.product-care-guide h2')).toHaveCSS('font-size',mobile?'22px':'32px');
 await expect(page.locator('.product-care-item h3').first()).toHaveCSS('font-size',mobile?'18px':'23px');
 await expect(page.locator('.product-faq h2')).toHaveCSS('font-size',mobile?'22px':'26px');
 await expect(page.locator('.product-faq summary')).toHaveCSS('font-size',mobile?'13px':'18px');
 await page.locator('.product-faq summary').click();
 await expect(page.locator('.product-faq details p')).toHaveCSS('font-size',mobile?'13px':'18px');
 const body=page.locator('.product-section-content').first();await expect(body).toHaveCSS('font-size',mobile?'14px':'22px');
 await page.getByText('Cỡ chữ và khoảng cách gọn hơn',{exact:true}).click();await page.getByLabel('Nội dung chi tiết (px)',{exact:true}).fill('16');
 await expect(body).toHaveCSS('font-size',mobile?'16px':'22px');
 await page.getByText('Khung cam kết',{exact:true}).click();
 await page.getByLabel('Nội dung cam kết (px)',{exact:true}).fill('14');
 await page.getByText('Hướng dẫn chăm sóc',{exact:true}).click();
 await page.getByLabel('Tiêu đề hướng dẫn chăm sóc (px)',{exact:true}).fill('24');
 await expect(page.locator('.product-assurance p')).toHaveCSS('font-size',mobile?'14px':'13px');
 await expect(page.locator('.product-care-guide h2')).toHaveCSS('font-size',mobile?'24px':'32px');
 await page.locator('.builder-setting-group').getByText('Câu hỏi thường gặp',{exact:true}).click();
 await page.getByLabel('Chữ câu trả lời (px)',{exact:true}).fill('15');
 await expect(page.locator('.product-faq details p')).toHaveCSS('font-size',mobile?'15px':'18px');
 if(mobile){await expect(page.locator('.product-detail-info')).toHaveCSS('padding-top','16px');await expect(page.locator('.product-slogan-card')).toHaveCSS('padding-top','14px');}
 await expect(body).toContainText('Nội dung chi tiết và hướng dẫn được giữ nguyên.');
 if(page.viewportSize().width===390)await page.locator('.product-detail').screenshot({path:'/tmp/orora-compact-product-detail.png'});
 await fit(page);expect(errors).toEqual([]);
});
