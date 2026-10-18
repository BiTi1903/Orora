import { getAuth } from "firebase/auth";
import { app } from "./firebase";

/* Chỉ trang admin dùng — tách riêng để khách xem web không phải tải firebase/auth */
export const auth = app ? getAuth(app) : null;