export const DEFAULT_COMPANY = "CTY TNHH ORORA. MST 0123456789";
export function companyLabel(value) {
 return value == null || value.trim() === "CTY TNHH ORORA No. 0123456789" ? DEFAULT_COMPANY : value;
}
