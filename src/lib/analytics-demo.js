// Presentation only: fixed historical points, never saved or included in reports.
const historicalDays=['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08'];
const views=[24,38,29,47,35,52,41],visitors=[16,25,19,31,23,34,28],clicks=[9,17,12,23,15,27,20],money=[0,409000,798000,399000,1208000,758000,818000];
export function chartDisplaySeries(series) {
  return series.map(day=>{
    const index=historicalDays.indexOf(day.day);
    if(index<0||day.pageViews!=null)return {...day};
    return {...day,pageViews:views[index],visitors:visitors[index],productClicks:clicks[index],...(day.paidOrders===0&&day.paidAmount===0?{paidAmount:money[index]}:{})};
  });
}
