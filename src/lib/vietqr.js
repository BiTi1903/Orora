// Bank identifiers from the VietQR directory (api.vietqr.io/v2/banks), 2026-11-26.
export const banks = [
  {
    "bin": "970415",
    "name": "VietinBank",
    "code": "ICB"
  },
  {
    "bin": "970436",
    "name": "Vietcombank",
    "code": "VCB"
  },
  {
    "bin": "970418",
    "name": "BIDV",
    "code": "BIDV"
  },
  {
    "bin": "970405",
    "name": "Agribank",
    "code": "VBA"
  },
  {
    "bin": "970448",
    "name": "OCB",
    "code": "OCB"
  },
  {
    "bin": "970422",
    "name": "MBBank",
    "code": "MB"
  },
  {
    "bin": "970407",
    "name": "Techcombank",
    "code": "TCB"
  },
  {
    "bin": "970416",
    "name": "ACB",
    "code": "ACB"
  },
  {
    "bin": "970432",
    "name": "VPBank",
    "code": "VPB"
  },
  {
    "bin": "970423",
    "name": "TPBank",
    "code": "TPB"
  },
  {
    "bin": "970403",
    "name": "Sacombank",
    "code": "STB"
  },
  {
    "bin": "970437",
    "name": "HDBank",
    "code": "HDB"
  },
  {
    "bin": "970454",
    "name": "VietCapitalBank",
    "code": "VCCB"
  },
  {
    "bin": "970429",
    "name": "SCB",
    "code": "SCB"
  },
  {
    "bin": "970441",
    "name": "VIB",
    "code": "VIB"
  },
  {
    "bin": "970443",
    "name": "SHB",
    "code": "SHB"
  },
  {
    "bin": "970431",
    "name": "Eximbank",
    "code": "EIB"
  },
  {
    "bin": "970426",
    "name": "MSB",
    "code": "MSB"
  },
  {
    "bin": "546034",
    "name": "CAKE",
    "code": "CAKE"
  },
  {
    "bin": "546035",
    "name": "Ubank",
    "code": "Ubank"
  },
  {
    "bin": "963388",
    "name": "Timo",
    "code": "TIMO"
  },
  {
    "bin": "970400",
    "name": "SaigonBank",
    "code": "SGICB"
  },
  {
    "bin": "970409",
    "name": "BacABank",
    "code": "BAB"
  },
  {
    "bin": "971133",
    "name": "PVcomBank Pay",
    "code": "PVDB"
  },
  {
    "bin": "971025",
    "name": "MoMo",
    "code": "momo"
  },
  {
    "bin": "970412",
    "name": "PVcomBank",
    "code": "PVCB"
  },
  {
    "bin": "970414",
    "name": "MBV",
    "code": "MBV"
  },
  {
    "bin": "970419",
    "name": "NCB",
    "code": "NCB"
  },
  {
    "bin": "970424",
    "name": "ShinhanBank",
    "code": "SHBVN"
  },
  {
    "bin": "970425",
    "name": "ABBANK",
    "code": "ABB"
  },
  {
    "bin": "970427",
    "name": "VietABank",
    "code": "VAB"
  },
  {
    "bin": "970428",
    "name": "NamABank",
    "code": "NAB"
  },
  {
    "bin": "970430",
    "name": "PGBank",
    "code": "PGB"
  },
  {
    "bin": "970433",
    "name": "VietBank",
    "code": "VIETBANK"
  },
  {
    "bin": "970438",
    "name": "BaoVietBank",
    "code": "BVB"
  },
  {
    "bin": "970440",
    "name": "SeABank",
    "code": "SEAB"
  },
  {
    "bin": "970446",
    "name": "COOPBANK",
    "code": "COOPBANK"
  },
  {
    "bin": "970449",
    "name": "LPBank",
    "code": "LPB"
  },
  {
    "bin": "970452",
    "name": "KienLongBank",
    "code": "KLB"
  },
  {
    "bin": "668888",
    "name": "KBank",
    "code": "KBank"
  },
  {
    "bin": "971101",
    "name": "ZaloPay",
    "code": "ZALOPAY"
  },
  {
    "bin": "971032",
    "name": "MVAS",
    "code": "MVAS"
  },
  {
    "bin": "970434",
    "name": "IndovinaBank",
    "code": "IVB"
  },
  {
    "bin": "422589",
    "name": "CIMB",
    "code": "CIMB"
  },
  {
    "bin": "970444",
    "name": "CBBank",
    "code": "CBB"
  },
  {
    "bin": "970457",
    "name": "Woori",
    "code": "WVN"
  },
  {
    "bin": "970462",
    "name": "KookminHN",
    "code": "KBHN"
  },
  {
    "bin": "970463",
    "name": "KookminHCM",
    "code": "KBHCM"
  }
];

const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/đ/g,"d").replace(/[^a-z0-9]/g,"");
export function resolveBank(name) {
 const key=normalize(name);
 return banks.find(bank=>[bank.bin,bank.name,bank.code].some(value=>normalize(value)===key));
}

function field(id,value) {
 const length=new TextEncoder().encode(value).length;
 if(length>99)throw new RangeError("Thông tin chuyển khoản quá dài.");
 return id+String(length).padStart(2,"0")+value;
}

export function transferPayload(bank,account,amount,note) {
 if(!bank || !/^\d{6,19}$/.test(account) || !Number.isSafeInteger(amount) || amount<=0)return "";
 const merchant=field("00","A000000727")+field("01",field("00",bank.bin)+field("01",account))+field("02","QRIBFTTA");
 const memo=String(note||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").replace(/[^ -~]/g,"").trim();
 if(memo.length>80)return "";
 const body=field("00","01")+field("01","12")+field("38",merchant)+field("53","704")+field("54",String(amount))+field("58","VN")+(memo?field("62",field("08",memo)):"")+"6304";
 let crc=0xffff;
 for(const byte of new TextEncoder().encode(body)){
  crc^=byte<<8;
  for(let i=0;i<8;i++)crc=((crc<<1)^((crc&0x8000)?0x1021:0))&0xffff;
 }
 return body+crc.toString(16).toUpperCase().padStart(4,"0");
}

export function vietQrUrl({ bankName, accountNumber, accountName, amount, transferNote } = {}) {
 const bank = resolveBank(bankName);
 const digits = String(accountNumber || "").replace(/[^a-zA-Z0-9]/g, "");
 if (!bank || digits.length < 6) return "";
 const params = new URLSearchParams();
 if (Number.isFinite(Number(amount)) && Number(amount) > 0) params.set("amount", String(Math.round(Number(amount))));
 if (transferNote) params.set("addInfo", String(transferNote).slice(0, 80));
 if (accountName) params.set("accountName", String(accountName).trim().slice(0, 80));
 const qs = params.toString();
 return `https://img.vietqr.io/image/${encodeURIComponent(bank.code || bank.bin)}-${encodeURIComponent(digits)}-compact2.png${qs ? `?${qs}` : ""}`;
}

