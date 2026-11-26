export function validOrderPhone(value) {
  return /^\+?\d{7,15}$/.test(String(value).trim().replace(/[\s().-]/g, ""));
}
