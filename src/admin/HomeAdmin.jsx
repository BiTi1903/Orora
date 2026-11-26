import VisualBuilder from "./builder/VisualBuilder";
export default function HomeAdmin({workspace="home",storeSection="links",storeVersion=0}){
 return <section className="home-admin"><div className="home-admin-top"><div><h1>Visual Builder</h1><p className="admin-muted">Chỉnh giao diện, thiết lập sản phẩm dùng chung và cửa hàng.</p></div></div><div className="home-builder-panel"><VisualBuilder workspace={workspace} requestedStoreSection={storeSection} requestedStoreVersion={storeVersion}/></div></section>;
}
