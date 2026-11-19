import VisualBuilder from "./builder/VisualBuilder";
export default function HomeAdmin({workspace="home",storeSection="links",storeVersion=0}){
 return <section className="home-admin"><div className="home-admin-top"><div><h1>{workspace==='store'?'Cửa hàng':'Trang chủ'}</h1><p className="admin-muted">{workspace==='store'?'Kênh mua hàng, phương thức thanh toán và trang tra cứu đơn.':'Chọn phần trên trang hoặc tìm phần tử để chỉnh. Các thiết lập chi tiết nằm trong Nâng cao.'}</p></div></div><div className="home-builder-panel"><VisualBuilder workspace={workspace} requestedStoreSection={storeSection} requestedStoreVersion={storeVersion}/></div></section>;
}
