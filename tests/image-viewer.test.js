import test from 'node:test';import assert from 'node:assert/strict';
import {imageViewerSettings,constrainImageView,zoomImageAt} from '../src/lib/image-viewer.js';
test('viewer settings preserve custom text and constrain zoom without changing CMS input',()=>{
 const saved={enabled:false,openLabel:'Xem ảnh lớn',maxZoom:99};const value=imageViewerSettings(saved);
 assert.equal(value.enabled,false);assert.equal(value.openLabel,'Xem ảnh lớn');assert.equal(value.maxZoom,5);assert.equal(saved.maxZoom,99);
 assert.equal(imageViewerSettings({maxZoom:-5}).maxZoom,2);assert.equal(imageViewerSettings().maxZoom,4);
});
test('zoom and pan remain within the visible photo and resetting returns to center',()=>{
 const box={width:400,height:500,imageWidth:300,imageHeight:500};
 assert.deepEqual(constrainImageView({scale:1,x:500,y:900},box),{scale:1,x:0,y:0});
 assert.deepEqual(constrainImageView({scale:2,x:500,y:-900},box),{scale:2,x:100,y:-250});
 assert.deepEqual(zoomImageAt({scale:1,x:0,y:0},2,{x:50,y:30},box),{scale:2,x:-50,y:-30});
 assert.deepEqual(zoomImageAt({scale:2,x:-50,y:-30},1,{x:0,y:0},box),{scale:1,x:0,y:0});
 assert.equal(zoomImageAt({scale:2,x:0,y:0},99,{x:0,y:0},box,3).scale,3);
});
