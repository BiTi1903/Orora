import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getApp() {
  const existing = getApps().find((app) => app.name === "newsletter");
  if (existing) return existing;
  const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}");
  if (!credentials.project_id || !credentials.client_email || !credentials.private_key) {
    throw new Error("firebase_server_configuration_missing");
  }
  return initializeApp({ credential: cert(credentials) }, "newsletter");
}

export const getNewsletterDb = () => getFirestore(getApp());
export const verifyAdminToken = (token) => getAuth(getApp()).verifyIdToken(token, true);
