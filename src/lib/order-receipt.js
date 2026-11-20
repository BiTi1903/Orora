import {formatVnd,PAYMENT_LABELS} from './commerce.js';
export function receiptLines(order,home={}){
 const created=order.createdAt?new Date(order.createdAt):new Date();
 const dateText=Number.isFinite(created.getTime())?created.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'';
 const contact=home.footerPhone||home.productDetailStyles?.contactActions?.phone||'';
 return [
  ['Mã đơn',order.code],
  ['Ngày đặt',dateText],
  ['Sản phẩm',order.productName],['Dung tích',order.variantLabel],['Số lượng',order.quantity],
  ['Người nhận',order.recipient?.name],['Điện thoại',order.recipient?.phone],['Địa chỉ',order.recipient?.address],
  ['Thanh toán',PAYMENT_LABELS[order.paymentMethod]||order.paymentMethod],
  ['Tình trạng',order.paymentStatus==='paid'?'Đã thanh toán':'Chưa thanh toán'],
  ['Tiền sản phẩm',order.subtotal==null?'Xác nhận sau':formatVnd(order.subtotal)],
  ['Phí giao hàng',order.shippingFee==null?'Xác nhận sau':formatVnd(order.shippingFee)],
  ['Tổng tiền',order.totalAmount==null?'Xác nhận sau':formatVnd(order.totalAmount)],
  ['Liên hệ ORORA',contact],
 ].filter(([,value])=>value!==undefined&&value!==null&&value!=='').map(([label,value])=>`${label}: ${value}`);
}
export function receiptFileName(order){
 return `ORORA-${String(order.code).replace(/[^a-z0-9_-]/gi,'')}.png`;
}
export async function renderOrderReceiptBlob(order,home={}){
 await document.fonts?.ready;
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw new Error('Không tạo được ảnh.');
 ctx.font='24px Arial';const lines=[];
 for(const text of receiptLines(order,home)){let line='';for(const char of text){if(ctx.measureText(line+char).width>656){lines.push(line);line='';}line+=char;}if(line)lines.push(line);lines.push('');}
 const width=760,height=220+lines.length*34;
 const dpr=Math.max(2,Math.min(3,Math.ceil((typeof window!=='undefined'&&window.devicePixelRatio)||2)));
 canvas.width=width*dpr;canvas.height=height*dpr;ctx.scale(dpr,dpr);
 ctx.fillStyle='#fffafb';ctx.fillRect(0,0,width,height);ctx.fillStyle='#3a1526';ctx.font='bold 32px Arial';ctx.fillText('ORORA · Đã nhận đơn hàng',52,66);ctx.font='24px Arial';lines.forEach((line,i)=>ctx.fillText(line,52,122+i*34));ctx.font='20px Arial';ctx.fillText('Đơn chờ xác nhận · Chưa xác nhận thanh toán',52,height-36);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Không tạo được ảnh.');
 return blob;
}
export function canShareOrderReceipt(){
 if(typeof navigator==='undefined'||typeof navigator.share!=='function'||typeof navigator.canShare!=='function'||typeof File!=='function')return false;
 try{return Boolean(navigator.canShare({files:[new File([new Uint8Array([0])],'receipt.png',{type:'image/png'})]}));}catch{return false;}
}
export function shareOrderReceiptBlob(order,blob){
 if(!canShareOrderReceipt())return null;
 const file=new File([blob],receiptFileName(order),{type:'image/png'});
 try{if(!navigator.canShare({files:[file]}))return null;}catch{return null;}
 return navigator.share({files:[file],title:`Đơn hàng ORORA ${order.code}`,text:`Xác nhận đơn hàng ${order.code}`})
  .then(()=>({mode:'shared'}),error=>({mode:error?.name==='AbortError'?'cancelled':'failed'}));
}
export async function downloadOrderReceipt(order,existingBlob){
 const blob=existingBlob||await renderOrderReceiptBlob(order);
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=receiptFileName(order);document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
