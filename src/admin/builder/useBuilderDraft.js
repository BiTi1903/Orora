import {useMemo,useState} from 'react';
import {DEFAULT_ABOUT,DEFAULT_TICKER} from './defaults';
import {DEFAULT_HERO,DEFAULT_COLLECTION,DEFAULT_PRODUCT_DETAIL,DEFAULT_FEATURES,DEFAULT_REVIEWS,DEFAULT_NEWSLETTER,DEFAULT_FOOTER,createPhilosophy} from './home-model';
import {createNav} from './navbar-state';
import {DEFAULT_PRODUCT_NEEDS,DEFAULT_PRODUCT_FAQ} from '../../lib/product-discovery';
const fields=['about','hero','collection','productDetail','features','reviews','newsletter','footer','ticker','navbar','philosophy','sectionVisibility','discovery'];
export default function useBuilderDraft(){
 const [draft,setDraft]=useState(()=>({about:DEFAULT_ABOUT,hero:DEFAULT_HERO,collection:DEFAULT_COLLECTION,productDetail:DEFAULT_PRODUCT_DETAIL,features:DEFAULT_FEATURES,reviews:DEFAULT_REVIEWS,newsletter:DEFAULT_NEWSLETTER,footer:DEFAULT_FOOTER,ticker:DEFAULT_TICKER,navbar:createNav(),philosophy:createPhilosophy(),sectionVisibility:{},discovery:{productNeeds:DEFAULT_PRODUCT_NEEDS,productFaq:DEFAULT_PRODUCT_FAQ}}));
 const setters=useMemo(()=>Object.fromEntries(fields.map(field=>[`set${field[0].toUpperCase()}${field.slice(1)}`,update=>setDraft(current=>({...current,[field]:typeof update==='function'?update(current[field]):update}))])),[]);
 return {...draft,...setters};
}
