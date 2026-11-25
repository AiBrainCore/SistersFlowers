import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/app/admin/_shell";
import { OrderEditForm } from "@/components/admin/order-edit-form";
import { prisma } from "@/lib/db";
import { getAdminT } from "@/lib/admin-locale";

export const dynamic = "force-dynamic";

export default async function AdminOrderEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const { locale, t } = await getAdminT();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!order) notFound();

  return (
    <AdminShell title={`${t.common.edit} · ${order.saleCode || order.reference}`}>
      <p style={{ marginBottom: 16 }}>
        <Link href={`/admin/orders/${order.id}`}>← {t.common.backToList}</Link>
        {" · "}
        <Link href="/admin/orders">{t.orders.title}</Link>
      </p>
      <OrderEditForm
        locale={locale}
        t={t}
        error={error === "1"}
        order={{
          id: order.id,
          source: order.source,
          reference: order.reference,
          saleCode: order.saleCode,
          customerName: order.customerName,
          phone: order.phone,
          email: order.email,
          address: order.address,
          zone: order.zone,
          deliveryDate: order.deliveryDate,
          deliveryTime: order.deliveryTime,
          fulfillment: order.fulfillment,
          recipientName: order.recipientName,
          recipientPhone: order.recipientPhone,
          notes: order.notes,
          cardMessage: order.cardMessage,
          hotelName: order.hotelName,
          roomNumber: order.roomNumber,
          anonymousSender: order.anonymousSender,
          paymentStatus: order.paymentStatus,
          depositAmount: order.depositAmount,
          deliveryFee: order.deliveryFee,
          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            qty: item.qty,
            price: item.price,
          })),
        }}
      />
    </AdminShell>
  );
}
