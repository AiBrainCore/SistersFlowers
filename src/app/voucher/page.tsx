import Link from "next/link";
import { VoucherCheckForm } from "@/components/voucher-check-form";

export const metadata = {
  title: "Check voucher · Sisters Flowers",
  description: "Partners: verify and redeem Sisters money vouchers.",
};

export default function VoucherPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(165deg, #f6f1e8 0%, #ebe4d6 45%, #e4ddd0 100%)",
        color: "#2d3a28",
        padding: "48px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <p
          style={{
            margin: 0,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontSize: 11,
            color: "#8b4a4a",
          }}
        >
          Sisters Flowers
        </p>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 40,
            fontWeight: 400,
            margin: "12px 0 8px",
          }}
        >
          Partner voucher check
        </h1>
        <p style={{ margin: "0 0 28px", lineHeight: 1.7, opacity: 0.8 }}>
          Guest shows a code (from the order / WhatsApp). Enter it here to
          confirm the amount, then mark it used. Sisters settles with you later
          (face value minus your agreed commission).
        </p>

        <VoucherCheckForm />

        <p style={{ marginTop: 40, fontSize: 13, opacity: 0.65 }}>
          <Link href="/en/shop" style={{ color: "inherit" }}>
            ← Back to shop
          </Link>
        </p>
      </div>
    </main>
  );
}
