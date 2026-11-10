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
    } catch {
      setError("Email hoặc mật khẩu không đúng.");
    } finally {setBusy(false);}
  };

  return <div className="admin-login"><form aria-busy={busy} className="admin-login-card admin-form" onSubmit={submit}>
    <div>
      <div className="admin-brand">ORORA</div>
      <p className="admin-muted">Đăng nhập trang quản trị</p>
    </div>
    {!firebaseConfigured && <div className="admin-error">Chưa cấu hình Firebase. Hãy tạo file .env.local theo mẫu .env.example.</div>}
    {error && <div className="admin-error">{error}</div>}
    <div className="admin-field"><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required /></div>
    <div className="admin-field"><label>Mật khẩu</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password" required /></div>
    <button className="admin-btn primary" aria-busy={busy} disabled={!firebaseConfigured || busy}>Đăng nhập</button>
  </form></div>;
}