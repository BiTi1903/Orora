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

  const binHtml = renderOrderEmailHtml({
    subject: "Đơn OW_BIN",
    text: "Cảm ơn.",
    order: {
      code: "OW_BIN",
      customer: { name: "An", phone: "0901234567", email: "an@example.com", address: "HCM" },
      product: { name: "Serum ORORA", unitPrice: 300000 },
      quantity: 1,
      subtotal: 300000,
      shippingFee: 0,
      totalAmount: 300000,
      paymentMethod: "bank_transfer",
      paymentStatus: "unpaid",
      createdAt: "2026-11-26T08:00:00.000Z",
    },
    siteOrigin: "https://ororavn.com",
    bankInfo: { bankCode: "970436", bankName: "Ngân hàng tùy chỉnh", bankAccountNumber: "0011001234567", bankAccountName: "ORORA" },
  });
  assert.ok(binHtml.includes("https://img.vietqr.io/image/VCB-0011001234567-compact2.png"));
});

test("custom frame survives newsletter delivery and is shared by all HTML previews", () => {
  const message = { subject: "ORORA", text: "Xin chào", design: { background: "#123456", thickness: 0, radius: 12, width: 640, button: "#304050" } };
  const delivered = withUnsubscribe(message, subscriberId("test@example.com"), ENV, { kind: "welcome" });
  for (const html of [delivered.html, renderWelcomeEmailHtml(message), renderOrderEmailHtml(message), renderBrandedEmailHtml(message)]) {
    assert.match(html, /background-color:#123456/);
    assert.match(html, /max-width:640px/);
    assert.match(html, /border:0px solid #efe0e7;border-radius:12px/);
  }
  assert.match(delivered.html, /bgcolor="#304050"/);
  assert.doesNotMatch(renderWelcomeEmailHtml({ ...message, design: { background: "invalid-color" } }), /invalid-color/);
});

test("custom inbox preview, brand and button reach marketing HTML while order tracking keeps its destination", () => {
  const design = { brand: "ORORA & Co", preheader: "Ưu đãi tháng này", buttonLabel: "Xem thêm", buttonUrl: "https://example.com/offers", align: "right", weight: "bold" };
  const message = { subject: "Mẫu", text: "Cảm ơn", design };
  for (const render of [renderWelcomeEmailHtml, renderBrandedEmailHtml, renderOrderEmailHtml]) {
    const html = render(message);
    assert.match(html, /ORORA &amp; Co/);
    assert.match(html, /Ưu đãi tháng này/);
    assert.match(html, /text-align:right;font-weight:bold/);
    assert.match(html, />Xem thêm<\/a>/);
    assert.equal(html.includes(design.buttonUrl), render !== renderOrderEmailHtml);
  }
});

test("mail code formats personalized copy and retains the delivery footer", () => {
  const design = {useHtml:true,htmlSource:'<table><tr><td style="color:#123456">{{content}}</td></tr></table><h2>Ưu đãi</h2>'};
  const message = {subject:"ORORA",text:"Xin chào <An>",design};
  const result = withUnsubscribe(message,subscriberId("mail@example.com"),ENV,{kind:"welcome"});
  assert.match(result.html, /<h2>Ưu đãi<\/h2>/);
  assert.match(result.html, /Xin chào &lt;An&gt;/);
  assert.match(result.html, /Hủy đăng ký nhận tin/);
  assert.match(result.text, /Xin chào <An>/);
  assert.doesNotMatch(renderBrandedEmailHtml({...message,design:{...design,useHtml:false}}), /<h2>Ưu đãi/);
});

test("Email Studio supports inline formatting, per-section typography/colors, coupon box, toggles and order layout", () => {
  const welcomeHtml = renderWelcomeEmailHtml({
    subject: "Subject ngoài hộp thư",
    text: "## Tiêu đề mục\n\nChào **bạn**, nhận ==ưu đãi 15%== và *quà tặng*.\n\n> Lưu ý đặc biệt cho thành viên mới",
    design: {
      heading: "Tiêu đề riêng bên trong",
      headingFont: "arial",
      headingSize: 30,
      headingMobileSize: 22,
      headingColor: "#221122",
      accent: "#cc2255",
      showPillars: false,
      showCoupon: true,
      couponTitle: "Mã quà tặng",
      couponCode: "WELCOME15",
      showFooter: false,
    },
  });
  assert.match(welcomeHtml, /Tiêu đề riêng bên trong/);
  assert.match(welcomeHtml, /<h2[^>]*>Tiêu đề mục<\/h2>/);
  assert.match(welcomeHtml, /<strong>bạn<\/strong>/);
  assert.match(welcomeHtml, /color:#cc2255;font-weight:600;">ưu đãi 15%<\/span>/);
  assert.match(welcomeHtml, /<em>quà tặng<\/em>/);
  assert.match(welcomeHtml, /WELCOME15/);
  assert.doesNotMatch(welcomeHtml, /Tuyển chọn công thức lành tính/);
  assert.doesNotMatch(welcomeHtml, /Chính sách mua hàng/);

  const orderHtml = renderOrderEmailHtml({
    subject: "Đơn OW_99",
    text: "Lời nhắn đặt lên đầu",
    order: { code: "OW_99", customer: { name: "An" }, product: { name: "Serum" }, quantity: 1 },
    design: {
      orderLayout: "message-first",
      showOrderSteps: false,
      showOrderDelivery: false,
      orderItemsHeading: "Danh sách món đã đặt",
    },
  });
  assert.ok(orderHtml.indexOf("Lời nhắn đặt lên đầu") < orderHtml.indexOf("Mã đơn hàng"));
  assert.match(orderHtml, /Danh sách món đã đặt/);
  assert.doesNotMatch(orderHtml, /2\. Xác nhận &amp; đóng gói/);
  assert.doesNotMatch(orderHtml, /Thông tin giao nhận/);
});

test("built-in templates include a campaign and omit unconfigured discounts", async () => {
  const { BUILTIN_MAIL_PRESETS, findMailPreset } = await import("../src/lib/mail-presets.js");
  assert.equal(BUILTIN_MAIL_PRESETS.length, 5);

  const sampleOrder = {
    code: "OW_STAGE9",
    customer: { name: "Nguyễn Minh Anh", phone: "0909123456", email: "minhanh@example.com", address: "TP.HCM" },
    product: { name: "Serum ORORA", unitPrice: 450000 },
    quantity: 1,
    subtotal: 450000,
    shippingFee: 0,
    totalAmount: 450000,
    paymentMethod: "bank_transfer",
    paymentStatus: "unpaid",
    trackingCode: "GHTK-STAGE9",
  };
  const bankInfo = { bankName: "Vietcombank", bankAccountNumber: "0011001234567", bankAccountName: "ORORA" };

  const welcomePreset = findMailPreset("builtin-welcome");
  const welcomeHtml = renderWelcomeEmailHtml({ ...welcomePreset, unsubscribeUrl: "https://ororavn.com/api/unsubscribe?id=1&token=2" });
  assert.match(welcomeHtml, /Đặc quyền dành cho thành viên ORORA/);
  assert.match(welcomeHtml, /Khám phá bộ sưu tập ORORA/);

  const receivedPreset = findMailPreset("builtin-order-confirmation");
  const receivedMsg = renderOrderMessage(receivedPreset, sampleOrder, ENV, { bankInfo });
  assert.match(receivedMsg.html, /Đã tiếp nhận đơn hàng/);
  assert.match(receivedMsg.html, /img\.vietqr\.io/);

  const shippingPreset = findMailPreset("builtin-order-shipping");
  const shippingMsg = renderOrderMessage(shippingPreset, sampleOrder, ENV, { bankInfo });
  assert.match(shippingMsg.html, /Kiện hàng đang trên đường đến với bạn/);
  assert.match(shippingMsg.html, /3\. Đang giao hàng/);
  assert.match(shippingMsg.html, /GHTK-STAGE9/);
  assert.doesNotMatch(shippingMsg.html, /img\.vietqr\.io/);

  const thankYouPreset = findMailPreset("builtin-order-thankyou");
  const thankYouMsg = renderOrderMessage(thankYouPreset, sampleOrder, ENV, { bankInfo });
  assert.doesNotMatch(thankYouMsg.html, /ORORATHANK|ORORA10/);
  assert.ok(findMailPreset("builtin-campaign-catalog"));
  assert.match(thankYouMsg.html, /3\. Đã nhận hàng/);
  assert.ok(thankYouMsg.html.indexOf("Cảm ơn bạn đã tin chọn ORORA") < thankYouMsg.html.indexOf("Mã đơn hàng"));
  assert.doesNotMatch(thankYouMsg.html, /img\.vietqr\.io/);
});


test("mail body size and family cover paragraphs, subheadings and bullet text", () => {
  const html = renderBrandedEmailHtml({ subject:"Thử", text:"Một đoạn\n\n## Gợi ý\n\n- Một mục", design:{font:"tahoma",fontSize:22,mobileFontSize:16} });
  assert.match(html, /<h2 class="mail-body-subheading"[^>]+font-family:Tahoma[^>]+font-size:26px/);
  assert.match(html, /<p class="mail-body-text"[^>]+font-size:22px[^>]+font-family:Tahoma/);
  assert.match(html, /<td valign="top" class="mail-body-text"[^>]+font-size:22px/);
  assert.match(html, /\.mail-body-subheading \{ font-size: 20px/);
  assert.match(renderBrandedEmailHtml({text:"Xin chào"}), /font-family:'Noto Serif', Georgia/);
});

test("order code and detail blocks expose editable copy and styles in preview and delivery", () => {
  const design = {codeLabel:"Số phiếu", productLabel:"Mặt hàng", totalLabel:"Tổng cộng", orderCodeFont:"arial", orderCodeSize:28, detailFont:"tahoma", detailSize:18};
  for (const interactivePreview of [false,true]) {
    const html = renderOrderEmailHtml({order:{code:"OW_ABC"}, design, interactivePreview});
    assert.match(html,/>Số phiếu</);
    assert.match(html,/font-family:Arial[^>]+font-size:28px[^>]+>OW_ABC</);
    assert.match(html,/font-family:Tahoma[^>]+font-size:15.5px[^>]+>Mặt hàng</);
    assert.match(html,/>Tổng cộng</);
    assert.equal(html.includes('data-mail-section="Mã đơn"'),interactivePreview);
    assert.equal(html.includes('data-mail-section="Chi tiết đơn"'),interactivePreview);
  }
});
