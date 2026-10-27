// Return only controlled diagnostics. Never expose tokens, credentials or SDK error messages.
export function firebaseAuthFailure(error) {
  const code = typeof error?.code === "string" ? error.code : "";
  if (code === "firebase_server_configuration_missing") return {
    status: 503, code,
    message: "Thiếu khóa Firebase máy chủ. Kiểm tra FIREBASE_SERVICE_ACCOUNT_JSON trên Vercel Production.",
  };
  if (["firebase_server_configuration_invalid", "app/invalid-credential", "auth/invalid-credential"].includes(code)) return {
    status: 503, code: "firebase_server_configuration_invalid",
    message: "Khóa Firebase máy chủ không hợp lệ hoặc không dùng được. Kiểm tra toàn bộ JSON trong FIREBASE_SERVICE_ACCOUNT_JSON và khóa còn hoạt động.",
  };
  if (code === "auth/argument-error" && /incorrect ["']?(aud|iss)|audience|issuer/i.test(error.message || "")) return {
    status: 503, code: "firebase_project_mismatch",
    message: "Firebase của website và máy chủ không cùng dự án. Đối chiếu VITE_FIREBASE_PROJECT_ID với project_id trong file JSON Firebase, rồi triển khai lại.",
  };
  if (["auth/id-token-expired", "auth/id-token-revoked", "auth/user-disabled", "auth/user-not-found", "auth/invalid-id-token", "auth/argument-error"].includes(code)) return {
    status: 401, code,
    message: code === "auth/id-token-expired" ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." : "Phiên đăng nhập không hợp lệ hoặc tài khoản đã bị khóa. Vui lòng đăng nhập lại.",
  };
  if (code === "auth/insufficient-permission") return {
    status: 503, code,
    message: "Tài khoản dịch vụ Firebase chưa có quyền kiểm tra người dùng Authentication. Kiểm tra quyền service account trên Google Cloud.",
  };
  return {
    status: 503, code: "firebase_auth_unavailable",
    message: "Máy chủ chưa xác thực được với Firebase. Xem Vercel Logs, dòng Newsletter authentication failed; không cần đổi khóa Microsoft.",
  };
}
