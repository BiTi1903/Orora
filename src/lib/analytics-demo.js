import { analyticsWindow } from './analytics.js';
// Browser preview only. Never used by collection/report API or saved to Firestore.
export function demoAnalyticsReport(now,days=7) {
  const window=analyticsWindow(now,days);
  const views=[24,38,29,47,35,52,41],visitors=[16,25,19,31,23,34,28],clicks=[9,17,12,23,15,27,20],money=[0,409000,798000,399000,1208000,758000,818000];
  const series=window.days.map((day,i)=>({day,pageViews:views[i%7],visitors:visitors[i%7],productClicks:clicks[i%7],paidAmount:money[i%7],paidOrders:[0,1,2,1,3,1,2][i%7],unpricedPaid:0}));
  const totalClicks=series.reduce((sum,day)=>sum+day.productClicks,0),totalViews=Math.round(series.reduce((sum,day)=>sum+day.pageViews,0)*0.65);
  const split=total=>{const first=Math.round(total*.45),second=Math.round(total*.33);return [first,second,total-first-second];};
  const perClicks=split(totalClicks),perViews=split(totalViews);
  return {isDemo:true,updatedAt:now,recordedSince:window.days[0],series,products:[{id:'demo-white',name:'White Gel - Bodyplex',path:'/product/demo-white'},{id:'demo-whip',name:'Whip Care - Bodyplex',path:'/product/demo-whip'},{id:'demo-mist',name:'Deodorant Mist - Bodyplex',path:'/product/demo-mist'}].map((product,i)=>({...product,clicks:perClicks[i],views:perViews[i]}))};
}
