import { useState } from 'react';
import { availablePaymentMethods, PAYMENT_LABELS, formatVnd } from '../lib/commerce';
import { validShippingFee } from '../lib/shipping';
import useAddressOptions from '../hooks/useAddressOptions';

function ShippingEstimate({ settings }) {
  const [province, setProvince] = useState('');
  const { provinces, loadingProvinces, error, retry } = useAddressOptions('');
  const fee = settings.provinces?.[province]?.fee;
  return <>
    <label>Ước tính phí giao hàng
      <select value={province} onChange={event => setProvince(event.target.value)} disabled={loadingProvinces}>
        <option value="">{loadingProvinces ? 'Đang tải tỉnh/thành…' : 'Chọn tỉnh/thành'}</option>
        {provinces.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select>
    </label>
    {error && <button type="button" onClick={retry}>Tải lại danh sách tỉnh/thành</button>}
    {province && <p role="status">{validShippingFee(fee) ? `Ước tính ${formatVnd(fee)}. Phí có thể thay đổi theo phường/xã.` : 'Chọn địa chỉ cụ thể khi đặt đơn để kiểm tra phí.'}</p>}
  </>;
}

export default function PurchaseTrust({ home, copy = {}, preview = false }) {
  const [estimating, setEstimating] = useState(false);
  const policies = Array.isArray(home.productPolicies) ? home.productPolicies : [];
  const returns = copy.returnPolicyLabel || policies.find(item => item?.kind === 'returns' && item.enabled !== false)?.content;
  const methods = availablePaymentMethods(home);
  return <aside className="product-purchase-trust" aria-label="Thanh toán và giao hàng">
    {methods.length > 0 && <p><strong>Thanh toán</strong> {methods.map(key => PAYMENT_LABELS[key]).join(' · ')}</p>}
    <p><strong>Giao hàng</strong> {copy.deliveryEstimateLabel || 'ORORA xác nhận thời gian giao theo địa chỉ.'}</p>
    {returns && <p><strong>Đổi trả</strong> {returns}</p>}
    {home.shippingSettings?.enabled === true && (estimating
      ? <ShippingEstimate settings={home.shippingSettings} />
      : <button type="button" disabled={preview} onClick={() => setEstimating(true)}>Xem phí giao theo tỉnh</button>)}
  </aside>;
}
