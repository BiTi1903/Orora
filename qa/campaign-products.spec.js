import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';

test('campaign editor inserts, edits and reorders linked product cards',async({page})=>{
  await mount(page,`import Editor from '/src/admin/CampaignProducts.jsx';import {renderBrandedEmailHtml} from '/src/lib/mail-html.js';
    function Fixture(){const [products,set]=R.useState([]);return R.createElement(R.Fragment,null,R.createElement(Editor,{cards:products,onChange:set}),R.createElement('iframe',{title:'Thư mẫu',srcDoc:renderBrandedEmailHtml({design:{products}})}));}
    ${render('R.createElement(Fixture)')}`,{
    'hooks/useProducts.js':"export default function(){return {products:[{id:'s',name:'Serum',image:'/s.jpg',price:99000},{id:'k',name:'Kem',image:'/k.jpg',price:50000}]}}"
  });
  for(const name of ['Serum','Kem']){
    await page.getByRole('button',{name:'Chèn sản phẩm'}).click();
    await page.getByLabel('Tìm sản phẩm').fill(name);
    await page.getByRole('button',{name,exact:true}).click();
  }
  await page.getByText('2. Kem',{exact:true}).click();
  await page.getByLabel('Hiện giá').last().uncheck();
  await page.getByLabel('Mô tả ngắn').last().fill('Dưỡng ẩm');
  await page.getByRole('button',{name:'Lên',exact:true}).click();
  const preview=page.frameLocator('iframe');
  await expect(preview.getByRole('heading',{level:2}).first()).toHaveText('Kem');
  await expect(preview.getByText('Dưỡng ẩm')).toBeVisible();
  await expect(preview.getByText('50.000 đ')).toHaveCount(0);
  await expect(preview.getByRole('link',{name:'Xem sản phẩm'}).first()).toHaveAttribute('href',/https:\/\/ororavn.com\/product\//);
});
