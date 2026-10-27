import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getApp() {
  const existing = getApps().find((app) => app.name === "newsletter");
  if (existing) return existing;
  let credentials;
  try {
    credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}");
  } catch {
    const error = new Error("firebase_server_configuration_invalid");
    error.code = "firebase_server_configuration_invalid";
    throw error;
  }
  if (!credentials?.project_id || !credentials?.client_email || !credentials?.private_key) {
    const error = new Error("firebase_server_configuration_missing");
    error.code = "firebase_server_configuration_missing";
    throw error;
  }
  return initializeApp({ credential: cert(credentials) }, "newsletter");
}

export const getNewsletterDb = () => getFirestore(getApp());
export const verifyAdminToken = (token) => getAuth(getApp()).verifyIdToken(token, true);
