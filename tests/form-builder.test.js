import test from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_SECTIONS } from '../src/lib/page-sections.js';
import { cartModalStyle, cartActionButtonStyle } from '../src/lib/cart-presentation.js';
import { checkoutStyle, checkoutSubmitStyle, receiptModalStyle } from '../src/lib/checkout-presentation.js';
import { editedSectionPayload, changedValues } from '../src/admin/builder/save-sections.js';

test('Visual Builder registers dedicated Cart, Order, and Order Success form sections without home visibility toggles', () => {
  const byKey = Object.fromEntries(PAGE_SECTIONS.map((s) => [s.key, s]));
  for (const key of ['cartform', 'orderform', 'ordersuccess']) {
    assert.ok(byKey[key], `Missing section ${key}`);
    assert.equal(byKey[key].hideVisibilityToggle, true);
  }
});

test('cartModalStyle and cartActionButtonStyle clamp numeric values and forward colors/typography', () => {
  const modal = cartModalStyle({
    modalWidth: 999,
    modalRadius: 18,
    modalPadding: 20,
    modalBackground: '#fff0f5',
    modalBorderColor: '#d090a8',
    dividerColor: '#e8c4d2',
    accent: '#991144',
    text: { fontSize: 15, color: '#221118' },
  });
  assert.equal(modal['--cart-modalWidth'], '760px');
  assert.equal(modal['--cart-modalRadius'], '18px');
  assert.equal(modal['--cart-modalPadding'], '20px');
  assert.equal(modal['--cart-modal-bg'], '#fff0f5');
  assert.equal(modal['--cart-modal-border'], '#d090a8');
  assert.equal(modal['--cart-divider'], '#e8c4d2');
  assert.equal(modal['--cart-accent'], '#991144');
  assert.equal(modal.fontSize, '15px');

  const btn = cartActionButtonStyle({ background: '#112233', borderColor: '#445566', radius: 16, height: 50, text: { fontWeight: 700 } });
  assert.equal(btn.background, '#112233');
  assert.equal(btn.borderColor, '#445566');
  assert.equal(btn.borderRadius, '16px');
  assert.equal(btn.minHeight, '50px');
  assert.equal(btn.fontWeight, 700);
});

test('checkoutStyle, checkoutSubmitStyle, and receiptModalStyle generate expected CSS custom properties', () => {
  const checkout = checkoutStyle({
    formWidth: 640,
    formPadding: 22,
    formRadius: 24,
    cardRadius: 12,
    inputRadius: 8,
    formBackground: '#fef8fa',
    cardBackground: '#ffffff',
    inputBackground: '#fffdfe',
    accentColor: '#aa2255',
  });
  assert.equal(checkout['--checkout-formWidth'], '640px');
  assert.equal(checkout['--checkout-cardRadius'], '12px');
  assert.equal(checkout['--checkout-inputRadius'], '8px');
  assert.equal(checkout['--checkout-card-bg'], '#ffffff');
  assert.equal(checkout['--checkout-accent'], '#aa2255');

  const submit = checkoutSubmitStyle({ orderSubmitBackground: '#aa2255', orderSubmitRadius: 20, orderSubmitHeight: 54, orderSubmitStyle: { color: '#ffffff' } }, false);
  assert.equal(submit.background, '#aa2255');
  assert.equal(submit.borderRadius, '20px');
  assert.equal(submit.minHeight, '54px');
  assert.equal(submit.color, '#ffffff');

  const receipt = receiptModalStyle({
    receiptWidth: 580,
    receiptRadius: 26,
    receiptFontSize: 15,
    receiptBannerBackground: '#fff1f6',
    receiptZaloBackground: '#0055cc',
    receiptAccent: '#881144',
  });
  assert.equal(receipt['--receiptWidth'], '580px');
  assert.equal(receipt['--receiptRadius'], '26px');
  assert.equal(receipt['--receipt-size'], '15px');
  assert.equal(receipt['--receipt-banner-bg'], '#fff1f6');
  assert.equal(receipt['--receipt-zalo-bg'], '#0055cc');
  assert.equal(receipt['--receipt-accent'], '#881144');
});

test('editedSectionPayload saves only the targeted form settings for cartform, orderform, and ordersuccess', () => {
  const before = {
    navStyles: { cart: { copy: { title: 'Giỏ hàng' } }, mobile: { enabled: true } },
    productDetailStyles: { purchaseOptions: { orderSubmitLabel: 'Đặt hàng ngay', receiptTitle: 'Đã nhận đơn hàng' }, name: { fontSize: 64 } },
    heroTitle: 'ORORA',
  };
  const after = structuredClone(before);
  after.navStyles.cart.copy.title = 'Túi mua sắm';
  after.productDetailStyles.purchaseOptions.orderSubmitLabel = 'Xác nhận đặt mua';
  after.productDetailStyles.purchaseOptions.receiptTitle = 'Đặt hàng thành công';

  assert.deepEqual(
    changedValues(before, editedSectionPayload(after, new Set(['cartform']))),
    { navStyles: { cart: { copy: { title: 'Túi mua sắm' } } } },
  );
  assert.deepEqual(
    changedValues(before, editedSectionPayload(after, new Set(['orderform']))),
    { productDetailStyles: { purchaseOptions: { orderSubmitLabel: 'Xác nhận đặt mua', receiptTitle: 'Đặt hàng thành công' } } },
  );
});
