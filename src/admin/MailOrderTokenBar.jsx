const TOKEN_GROUPS = [
  {
    label: "Khách hàng",
    items: [
      ["{{customerName}}", "Tên khách"],
      ["{{phone}}", "SĐT"],
      ["{{email}}", "Email"],
      ["{{address}}", "Địa chỉ"],
      ["{{note}}", "Ghi chú khách"],
    ],
  },
  {
    label: "Đơn hàng & Thanh toán",
    items: [
      ["{{orderCode}}", "Mã đơn"],
      ["{{createdAt}}", "Ngày đặt"],
      ["{{productName}}", "Sản phẩm"],
      ["{{variantLabel}}", "Dung tích"],
      ["{{quantity}}", "Số lượng"],
      ["{{unitPrice}}", "Đơn giá"],
      ["{{subtotal}}", "Tạm tính"],
      ["{{shippingFee}}", "Phí ship"],
      ["{{totalAmount}}", "Tổng tiền"],
      ["{{paymentMethod}}", "PT thanh toán"],
      ["{{paymentStatus}}", "TT thanh toán"],
    ],
  },
  {
    label: "Vận chuyển & Tra cứu",
    items: [
      ["{{trackingCode}}", "Mã vận đơn"],
      ["{{trackingUrl}}", "Link tra cứu"],
      ["{{trackingInstructions}}", "Câu hướng dẫn tra cứu"],
    ],
  },
];

export default function MailOrderTokenBar({ onInsert, disabled }) {
  return (
    <details className="mail-token-drawer" open>
      <summary>Chèn nhanh biến đơn hàng (tại vị trí con trỏ)</summary>
      <div className="mail-token-groups">
        {TOKEN_GROUPS.map((group) => (
          <div className="mail-token-group" key={group.label}>
            <span className="mail-token-group-label">{group.label}</span>
            <div className="mail-token-bar">
              {group.items.map(([token, label]) => (
                <button
                  type="button"
                  className="mail-token-chip"
                  key={token}
                  title={`Chèn ${token}`}
                  disabled={disabled}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onInsert(token)}
                >
                  + {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
