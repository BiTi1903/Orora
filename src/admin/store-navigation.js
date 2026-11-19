export function openStoreSettings(section='links'){
 window.dispatchEvent(new CustomEvent('orora-admin-store',{detail:{section}}));
}
