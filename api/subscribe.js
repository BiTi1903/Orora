import { createSubscribeHandler } from "../server/newsletter.js";
import { createMicrosoftMailer } from "../server/microsoft-mail.js";

async function getDb() {
  const [
    { getApps, initializeApp, cert },
    { getFirestore },
  ] = await Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/firestore"),
  ]);

  const credentials = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}"
  );

  if (
    !credentials.project_id ||
    !credentials.client_email ||
    !credentials.private_key
  ) {
    throw new Error(
      "firebase_server_configuration_missing"
    );
  }

  const app =
    getApps().find(
      (item) => item.name === "newsletter"
    ) ||
    initializeApp(
      {
        credential: cert(credentials),
      },
      "newsletter"
    );

  return getFirestore(app);
}

export default createSubscribeHandler({
  getDb,
  sendWelcome: createMicrosoftMailer(),
});