import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderBrandedEmailHtml, renderOrderEmailHtml, renderWelcomeEmailHtml } from "../src/lib/mail-html.js";
import { DEFAULT_ORDER_MESSAGE, renderOrderMessage } from "../server/order-mail.js";
import { DEFAULT_WELCOME, withUnsubscribe, subscriberId } from "../server/newsletter-content.js";
import { createMicrosoftSmtpMailer } from "../server/microsoft-smtp.js";

const ENV = {
  NEWSLETTER_SITE_ORIGIN: "https://ororavn.com",
  NEWSLETTER_UNSUBSCRIBE_SECRET: "s".repeat(48),
  MS_SENDER_EMAIL: "sales@ororavn.com",
  MS_TENANT_ID: "tenant",
  MS_CLIENT_ID: "client",
  MS_CLIENT_SECRET: "secret",
};

test("renderWelcomeEmailHtml renders luxury ORORA layout, pillars, CTA, unsubscribe link and escapes HTML", () => {
  const unsub = "https://ororavn.com/api/unsubscribe?id=abc&token=def";
  const html = renderWelcomeEmailHtml({
    subject: "Chào mừng <script>alert(1)</script> ORORA",
    text: "Chào bạn,\n\n- Ưu đãi <img src=x onerror=alert(1)>\n- Tư vấn 1-1\n\n---\nHủy đăng ký nhận tin từ ORORA: " + unsub,
    unsubscribeUrl: unsub,
    siteOrigin: "https://ororavn.com",
  });
  assert.match(html, /ORORA/);
  assert.match(html, /Chào mừng thành viên mới/i);
  assert.match(html, /Khám phá bộ sưu tập ORORA/);
  assert.ok(html.includes(escapeHtml(unsub)));
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.ok(!html.includes("<img src=x onerror=alert(1)>"));
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("Hủy đăng ký nhận tin từ ORORA: https://ororavn.com/api/unsubscribe"));
});

test("renderOrderEmailHtml renders multi-item table, 3-step tracker, trackingCode, VietQR bank transfer and escapes HTML", () => {
  const order = {
    code: "OW_2048B",
    customer: {
      name: "Trần <b>Minh</b>",
      phone: "0909123456",
      email: "minh@example.com",
      address: "10 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
      note: "Gọi trước <script>x</script>",
    },
    product: { name: "Serum ORORA", variantLabel: "50 ml", unitPrice: 450000 },
    items: [
      { name: "Serum ORORA", variantLabel: "50 ml", quantity: 2, unitPrice: 450000, subtotal: 900000 },
      { name: "Gel dưỡng ORORA", variantLabel: "100 ml", quantity: 1, unitPrice: 250000, subtotal: 250000 },
    ],
    quantity: 3,
    subtotal: 1150000,
    shippingFee: 0,
    totalAmount: 1150000,
    paymentMethod: "bank_transfer",
    paymentStatus: "unpaid",
    trackingCode: "GHTK-889900",
    createdAt: "2026-11-26T08:30:00.000Z",
  };
  const bankInfo = {
    bankHeading: "Chuyển khoản ngân hàng",
    bankName: "Vietcombank",
    bankAccountNumber: "0011001234567",
    bankAccountName: "CONG TY ORORA",
    bankTransferNote: "Thanh toan don {{code}}",
  };
  const html = renderOrderEmailHtml({
    subject: "ORORA xác nhận đơn hàng OW_2048B",
    text: "Cảm ơn bạn đã đặt hàng tại ORORA.",
    order,
    siteOrigin: "https://ororavn.com",
    bankInfo,
  });
  assert.ok(html.includes("OW_2048B"));
  assert.ok(html.includes("Serum ORORA"));
  assert.ok(html.includes("Gel dưỡng ORORA"));
  assert.ok(html.includes("GHTK-889900"));
  assert.ok(html.includes("0011001234567"));
  assert.ok(html.includes("https://img.vietqr.io/image/VCB-0011001234567-compact2.png"));
  assert.ok(html.includes("https://ororavn.com/tra-cuu-don-hang?code=OW_2048B"));
  assert.ok(!html.includes("<b>Minh</b>"));
  assert.ok(!html.includes("<script>x</script>"));
});

test("server renderOrderMessage & withUnsubscribe produce both plain text and branded HTML", () => {
  const welcome = withUnsubscribe(DEFAULT_WELCOME, subscriberId("guest@example.com"), ENV, { kind: "welcome" });
  assert.ok(welcome.text.includes("Hủy đăng ký nhận tin từ ORORA:"));
  assert.ok(welcome.html.includes("Chào mừng thành viên mới"));
  assert.ok(welcome.html.includes(escapeHtml(welcome.unsubscribeUrl)));

  const orderMsg = renderOrderMessage(
    { subject: DEFAULT_ORDER_MESSAGE.subject, text: `${DEFAULT_ORDER_MESSAGE.text}\nMã vận đơn: {{trackingCode}}` },
    {
      code: "OW_3001C",
      customer: { name: "Lan Anh", phone: "0912345678", email: "lan@example.com", address: "Hà Nội" },
      product: { name: "Kem dưỡng ORORA", variantLabel: "50 ml", unitPrice: 320000 },
      quantity: 1,
      subtotal: 320000,
      shippingFee: 25000,
      totalAmount: 345000,
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      trackingCode: "VNPOST-777",
      createdAt: new Date("2026-11-26T09:00:00.000Z"),
    },
    ENV,
  );
  assert.ok(orderMsg.text.includes("VNPOST-777"));
  assert.ok(orderMsg.html.includes("OW_3001C"));
  assert.ok(orderMsg.html.includes("VNPOST-777"));

  const branded = renderBrandedEmailHtml({ subject: "Ưu đãi tháng 11", text: "Giảm 15% cho thành viên." });
  assert.ok(branded.includes("Ưu đãi tháng 11"));
});

test("createMicrosoftSmtpMailer passes multipart text and html to Nodemailer", async () => {
  const sent = [];
  const sendMail = createMicrosoftSmtpMailer(
    ENV,
    async () => ({ ok: true, json: async () => ({ access_token: "tok", expires_in: 3600 }) }),
    () => ({
      async sendMail(mail) {
        sent.push(mail);
        return { accepted: mail.envelope.to };
      },
      close() {},
    }),
  );
  const welcome = withUnsubscribe(DEFAULT_WELCOME, subscriberId("vip@example.com"), ENV, { kind: "welcome" });
  await sendMail("vip@example.com", welcome);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, welcome.subject);
  assert.equal(sent[0].text, welcome.text);
  assert.equal(sent[0].html, welcome.html);
  assert.ok(sent[0].headers["List-Unsubscribe"].includes(welcome.unsubscribeUrl));
});

test("bank transfer email never invites second payment when paid and never renders blank-amount QR", async () => {
  const { vietQrUrl } = await import("../src/lib/vietqr.js");
  const bankInfo = {
    bankHeading: "Chuyển khoản ngân hàng",
    bankName: "Vietcombank",
    bankAccountNumber: "0011001234567",
    bankAccountName: "CONG TY ORORA",
    bankTransferNote: "Thanh toan don {{code}}",
  };
  assert.equal(vietQrUrl({ bankName: "Vietcombank", accountNumber: "0011001234567", amount: null }), "");
  assert.equal(vietQrUrl({ bankName: "Vietcombank", accountNumber: "0011001234567", amount: 0 }), "");
  assert.match(vietQrUrl({ bankName: "Vietcombank", accountNumber: "0011001234567", amount: 250000 }), /amount=250000/);

  const paidHtml = renderOrderEmailHtml({
    subject: "Gửi lại xác nhận đơn OW_PAID",
    text: "Cảm ơn bạn đã đặt hàng.",
    order: {
      code: "OW_PAID",
      customer: { name: "An", phone: "0901234567", email: "an@example.com", address: "HCM" },
      product: { name: "Serum ORORA", unitPrice: 450000 },
      quantity: 1,
      subtotal: 450000,
      shippingFee: 0,
      totalAmount: 450000,
      paymentMethod: "bank_transfer",
      paymentStatus: "paid",
      createdAt: "2026-11-26T08:00:00.000Z",
    },
    siteOrigin: "https://ororavn.com",
    bankInfo,
  });
  assert.ok(paidHtml.includes("Đã nhận thanh toán"));
  assert.ok(!paidHtml.includes("img.vietqr.io"));
  assert.ok(!paidHtml.includes("0011001234567"));

  const unpricedHtml = renderOrderEmailHtml({
    subject: "Xác nhận đơn OW_QUOTE",
    text: "Đơn chờ báo giá.",
    order: {
      code: "OW_QUOTE",
      customer: { name: "An", phone: "0901234567", email: "an@example.com", address: "HCM" },
      product: { name: "Serum ORORA" },
      quantity: 1,
      subtotal: null,
      shippingFee: null,
      totalAmount: null,
      paymentMethod: "bank_transfer",
      paymentStatus: "unpaid",
      createdAt: "2026-11-26T08:00:00.000Z",
    },
    siteOrigin: "https://ororavn.com",
    bankInfo,
  });
  assert.ok(unpricedHtml.includes("chờ ORORA xác nhận tổng tiền chính xác"));
  assert.ok(!unpricedHtml.includes("img.vietqr.io"));
  assert.ok(!unpricedHtml.includes("0011001234567"));
});
