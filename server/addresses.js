import { getAllProvinces, getCommunesByProvinceId } from "vietnam-divisions-js/v3";
export const ADDRESS_VERSION = "vietnam-divisions-js@3.0.0/NQ202-2025";
let provincesPromise;
const wards = new Map();
export function addressProvinces() {
  if (!provincesPromise) {
    provincesPromise = getAllProvinces()
      .then((items) => items.map((item) => ({ code: item.idProvince, name: item.name })).sort((a, b) => a.name.localeCompare(b.name, "vi")))
      .catch((error) => { provincesPromise = undefined; throw error; });
  }
  return provincesPromise;
}
export async function addressWards(provinceCode) {
  if (!/^\d{2}$/.test(provinceCode || "") || !(await addressProvinces()).some((item) => item.code === provinceCode)) throw Object.assign(new Error("Tỉnh/thành không hợp lệ."), { status: 400 });
  if (!wards.has(provinceCode)) {
    wards.set(
      provinceCode,
      getCommunesByProvinceId(provinceCode)
        .then((items) => items.map((item) => ({ code: item.idCommune, provinceCode: item.idProvince, name: item.name })).sort((a, b) => a.name.localeCompare(b.name, "vi")))
        .catch((error) => { wards.delete(provinceCode); throw error; }),
    );
  }
  return wards.get(provinceCode);
}
export async function resolveDeliveryAddress(body) {
  if (body.provinceCode === undefined && body.wardCode === undefined && body.addressDetail === undefined) return null;
  const provinceCode = String(body.provinceCode || ""); const wardCode = String(body.wardCode || ""); const addressDetail = typeof body.addressDetail === "string" ? body.addressDetail.trim() : "";
  if (!/^\d{2}$/.test(provinceCode) || !/^\d{5}$/.test(wardCode) || addressDetail.length < 5 || addressDetail.length > 350) throw Object.assign(new Error("Chọn tỉnh/thành, phường/xã và nhập số nhà, tên đường đầy đủ."), { status: 400 });
  const province = (await addressProvinces()).find((item) => item.code === provinceCode);
  const ward = (await addressWards(provinceCode)).find((item) => item.code === wardCode);
  if (!province || !ward) throw Object.assign(new Error("Phường/xã không thuộc tỉnh/thành đã chọn. Vui lòng chọn lại địa chỉ."), { status: 400 });
  return { provinceCode, provinceName: province.name, wardCode, wardName: ward.name, addressDetail, addressVersion: ADDRESS_VERSION, address: `${addressDetail}, ${ward.name}, ${province.name}` };
}
export function createAddressesHandler() {
  return async (req, res) => {
    if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ message: "Chỉ nhận GET." }); }
    try {
      const items = req.query?.provinceCode === undefined ? await addressProvinces() : await addressWards(req.query.provinceCode);
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
      return res.status(200).json({ items, version: ADDRESS_VERSION });
    } catch (error) { res.setHeader("Cache-Control", "no-store"); return res.status(error.status || 503).json({ message: error.status ? error.message : "Chưa tải được địa chỉ. Vui lòng thử lại." }); }
  };
}
