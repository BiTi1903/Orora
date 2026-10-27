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
    throw new Error("firebase_server_configuration_missing");
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

export default async function subscribers(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const reply = (status, data) =>
    res.status(status).json(data);

  // Kiểm tra admin secret
  const adminSecret = process.env.BULK_MAIL_SECRET;
  if (!adminSecret) {
    return reply(503, {
      ok: false,
      message: "BULK_MAIL_SECRET chưa được cấu hình.",
    });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (token !== adminSecret) {
    return reply(401, {
      ok: false,
      message: "Không có quyền truy cập.",
    });
  }

  if (req.method === "GET") {
    try {
      const db = await getDb();
      const snapshot = await db
        .collection("newsletterSubscribers")
        .orderBy("createdAt", "desc")
        .get();

      const list = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          email: data.email,
          status: data.status,
          mailStatus: data.mailStatus,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
          source: data.source,
        });
      });

      return reply(200, { ok: true, subscribers: list });
    } catch (error) {
      console.error("Subscribers list error:", error);
      return reply(500, {
        ok: false,
        message: "Không thể tải danh sách subscribers.",
      });
    }
  }

  if (req.method === "DELETE") {
    let body;
    try {
      body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body;
    } catch {
      return reply(400, { ok: false, message: "Dữ liệu không hợp lệ." });
    }

    const { id } = body || {};
    if (!id) {
      return reply(400, { ok: false, message: "Thiếu ID subscriber." });
    }

    try {
      const db = await getDb();
      await db.collection("newsletterSubscribers").doc(id).delete();
      return reply(200, { ok: true, message: "Đã xóa subscriber." });
    } catch (error) {
      console.error("Delete subscriber error:", error);
      return reply(500, { ok: false, message: "Không thể xóa subscriber." });
    }
  }

  res.setHeader("Allow", "GET, DELETE");
  return reply(405, { ok: false, message: "Phương thức không hỗ trợ." });
}
