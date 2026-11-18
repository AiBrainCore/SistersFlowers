/**
 * VietQR image URL helper (Napas-compatible transfer QR via img.vietqr.io).
 * Amount is integer VND. addInfo must stay short — full cart lives on Order.
 */

export type VietQrAccount = {
  bankCode: string;
  accountNumber: string;
  accountName: string;
};

export function buildVietQrImageUrl(input: {
  account: VietQrAccount;
  amount: number;
  addInfo: string;
  template?: "compact2" | "compact" | "qr_only" | "print";
}) {
  const amount = Math.max(0, Math.round(input.amount));
  const info = encodeURIComponent(input.addInfo.slice(0, 25));
  const name = encodeURIComponent(input.account.accountName.slice(0, 50));
  const template = input.template || "compact2";
  const bank = encodeURIComponent(input.account.bankCode.trim());
  const acct = encodeURIComponent(input.account.accountNumber.replace(/\s/g, ""));
  return `https://img.vietqr.io/image/${bank}-${acct}-${template}.png?amount=${amount}&addInfo=${info}&accountName=${name}`;
}

/** Short unique transfer content: SF + last 8 of reference (bank memo limits). */
export function vietQrTransferContent(orderReference: string) {
  const clean = orderReference.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return `SF${clean.slice(-8)}`;
}
