import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseConfigured } from "../lib/firebase";
import { auth } from "../lib/firebaseAuth";
import "../styles/admin.css";

export default function AdminLogin({ onLoggedIn }) {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  const submit=async(e)=>{
    e.preventDefault(); if(busy)return;setBusy(true);setError("");
    try {
      await signInWithEmailAndPassword(auth,email,password);
      onLoggedIn?.();
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/network-request-failed") setError("Không thể kết nối mạng. Vui lòng kiểm tra Internet và thử lại.");
      else if (code === "auth/too-many-requests") setError("Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.");
      else if (code === "auth/user-disabled") setError("Tài khoản này đã bị tạm khóa.");
      else if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(code)) setError("Email hoặc mật khẩu không đúng.");
      else setError("Đăng nhập chưa thành công. Vui lòng thử lại sau.");
    } finally {setBusy(false);}
  };

  return <div className="admin-login"><form aria-busy={busy} className="admin-login-card admin-form" onSubmit={submit}>
    <div>
      <div className="admin-brand">ORORA</div>
      <p className="admin-muted">Đăng nhập trang quản trị</p>
    </div>
    {!firebaseConfigured && <div className="admin-error">Chưa cấu hình Firebase. Hãy tạo file .env.local theo mẫu .env.example.</div>}
    {error && <div className="admin-error">{error}</div>}
    <div className="admin-field"><label htmlFor="admin-login-email">Email</label><input id="admin-login-email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} type="email" required /></div>
    <div className="admin-field"><label htmlFor="admin-login-password">Mật khẩu</label><input id="admin-login-password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} type="password" required /></div>
    <button className="admin-btn primary" aria-busy={busy} disabled={!firebaseConfigured || busy}>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</button>
  </form></div>;
}