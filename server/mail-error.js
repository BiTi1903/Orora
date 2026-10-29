const messages = {
  mail_auth_failed: "Microsoft từ chối xác thực ứng dụng.",
  mail_smtp_auth_failed: "SMTP OAuth2 bị từ chối. Kiểm tra SMTP AUTH và quyền SMTP.SendAsApp của ứng dụng.",
  mail_smtp_connection_failed: "Không kết nối được smtp.office365.com:587.",
  mail_send_failed: "Microsoft từ chối nhận thư gửi.",
  mail_configuration_missing: "Thiếu cấu hình Microsoft 365 trên máy chủ.",
  mail_transport_invalid: "MS_MAIL_TRANSPORT phải là smtp hoặc graph.",
  mail_template_invalid: "Nội dung hoặc biến trong mẫu đơn hàng không hợp lệ.",
};
// Return only known codes and numeric SMTP status, never raw provider errors/tokens.
export function describeMailError(error) {
  const code = Object.hasOwn(messages, error?.message) ? error.message : "mail_outcome_unknown";
  const status = error?.smtp;
  const codes = [Number.isInteger(status?.responseCode) && status.responseCode >= 400 && status.responseCode <= 599 ? status.responseCode : null, /^[245]\.\d{1,3}\.\d{1,3}$/.test(status?.enhancedCode || "") ? status.enhancedCode : null].filter(Boolean).join(" ");
  return { errorCode: code, errorMessage: `${messages[code] || "Chưa rõ Microsoft đã nhận thư hay chưa; kiểm tra Outlook trước khi gửi lại."}${codes ? ` (${codes})` : ""}` };
}
