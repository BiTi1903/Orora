export function openStoreSettings(section='cart'){
 window.dispatchEvent(new CustomEvent('orora-admin-store',{detail:{section}}));
}
