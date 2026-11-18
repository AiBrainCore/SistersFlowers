import { NextResponse } from "next/server";
import { listPaymentMethodsForDisplay } from "@/lib/payments/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const citySlug = new URL(req.url).searchParams.get("city");
  const methods = await listPaymentMethodsForDisplay({ citySlug });
  return NextResponse.json({
    methods: methods.map((m) => ({
      id: m.id,
      nameEn: m.nameEn,
      nameVi: m.nameVi,
      icon: m.icon,
      selectable: m.selectable,
      comingSoon: m.comingSoon,
    })),
  });
}
