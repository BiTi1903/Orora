export const IMAGE_VIEWER_TEXT={title:'{product}',openLabel:'Phóng to ảnh',closeLabel:'Đóng ảnh',previousLabel:'Ảnh trước',nextLabel:'Ảnh sau',zoomInLabel:'Phóng to',zoomOutLabel:'Thu nhỏ',resetLabel:'Về kích thước ban đầu',imageLabel:'Xem ảnh',hint:'Vuốt để đổi ảnh · Chạm hai lần hoặc chụm hai ngón để phóng to',loadingLabel:'Đang tải ảnh…',errorLabel:'Chưa tải được ảnh. Bạn có thể thử lại hoặc xem ảnh khác.',retryLabel:'Thử lại'};
export function imageViewerSettings(value={}){
 const settings={...value,enabled:value.enabled!==false,showHint:value.showHint!==false,showThumbnails:value.showThumbnails!==false,maxZoom:Math.max(2,Math.min(5,Number(value.maxZoom)||4))};
 for(const [key,fallback] of Object.entries(IMAGE_VIEWER_TEXT))settings[key]=typeof value[key]==='string'&&value[key].trim()?value[key].slice(0,300):fallback;
 return settings;
}
export function constrainImageView(view,box,maxZoom=4){
 const scale=Math.max(1,Math.min(maxZoom,view.scale));
 const maxX=Math.max(0,(box.imageWidth*scale-box.width)/2),maxY=Math.max(0,(box.imageHeight*scale-box.height)/2);
 return {scale,x:maxX?Math.max(-maxX,Math.min(maxX,view.x)):0,y:maxY?Math.max(-maxY,Math.min(maxY,view.y)):0};
}
export function zoomImageAt(view,scale,point,box,maxZoom=4){
 const next=Math.max(1,Math.min(maxZoom,scale)),ratio=next/view.scale;
 return constrainImageView({scale:next,x:point.x-(point.x-view.x)*ratio,y:point.y-(point.y-view.y)*ratio},box,maxZoom);
}
