import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';
test('admin and buyer render the same bank transfer QR locally',async({page})=>{
 const external=[];
 page.on('request',req=>{if(req.url().includes('vietqr.io'))external.push(req.url());});
 await mount(page,`import {OrderSuccessContent} from '/src/components/OrderSuccessView.jsx';
 const props={order:{code:'OR-001',paymentMethod:'bank_transfer',subtotal:400001,shippingFee:0,totalAmount:400001,recipient:{},items:[]},home:{},appearance:{bankCode:'970403',bankName:'Sacombank',bankAccountNumber:'0123456789'}};
 ${render("R.createElement(R.Fragment,null,R.createElement(OrderSuccessContent,props),R.createElement(OrderSuccessContent,{...props,preview:true}))")}`);
 const imgs=page.getByRole('img',{name:'Mã QR chuyển khoản VietQR'});
 await expect(imgs).toHaveCount(2);
 const urls=await imgs.evaluateAll(nodes=>nodes.map(node=>node.src));
 expect(urls[0]).toMatch(/^data:image\/png;base64,/);expect(urls[1]).toBe(urls[0]);expect(external).toEqual([]);
});
