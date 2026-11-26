import {withProductIdentity} from '../src/lib/product-identity.js';
import {publishedProductReviews} from '../src/lib/product-content.js';

const fields = ('number name slug slugAliases price image image2 image3 image4 image5 image6 images additionalImages description shoppingGuide story material size color origin category categoryId detailSections detailVisibility productReviews volumeOptions translations active publicId canonicalSlug').split(' ');

export function createCatalogHandler({getDb}) {
 return async (req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return res.status(405).end();}
  try {
   const snap=await getDb().collection('products').select(...fields).get();
   const catalog=withProductIdentity(snap.docs.map(doc=>({...doc.data(),id:doc.id})));
   const products=catalog.filter(item=>item.active!==false).map(item=>({
    ...item,productReviews:publishedProductReviews(item),
    ...(Array.isArray(item.detailSections)?{detailSections:item.detailSections.filter(section=>section&&section.enabled!==false)}:{}),
   }));
   res.setHeader('Cache-Control','public, max-age=0, s-maxage=15, stale-while-revalidate=15');
   return req.method==='HEAD'?res.status(200).end():res.status(200).json({products});
  }catch{res.setHeader('Cache-Control','no-store');return res.status(503).json({message:'Chưa tải được danh mục sản phẩm.'});}
 };
}
