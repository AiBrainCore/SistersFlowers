/** Human labels for shop order + Grab delivery statuses (admin UI). */

export const SHOP_ORDER_STATUSES = [
  "new",
  "awaiting_delivery_quote",
  "awaiting_payment",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "ready_for_dispatch",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
  "exception",
] as const;

export type ShopOrderStatus = (typeof SHOP_ORDER_STATUSES)[number];

export const DELIVERY_BOOKING_STATUSES = [
  "awaiting_arrangement",
  "courier_requested",
  "courier_assigned",
  "collected",
  "in_transit",
  "delivered",
  "failed",
  "returned",
] as const;

export type DeliveryBookingStatus =
  (typeof DELIVERY_BOOKING_STATUSES)[number];

const shopEn: Record<string, string> = {
  new: "New",
  awaiting_delivery_quote: "Awaiting delivery quote",
  awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed — start making",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  ready_for_dispatch: "Ready to dispatch",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  exception: "Exception",
};

const shopVi: Record<string, string> = {
  new: "Mới",
  awaiting_delivery_quote: "Chờ báo phí giao",
  awaiting_payment: "Chờ thanh toán",
  confirmed: "Đã xác nhận — bắt đầu làm",
  preparing: "Đang chuẩn bị",
  ready_for_pickup: "Sẵn sàng nhận tại studio",
  ready_for_dispatch: "Sẵn sàng giao",
  out_for_delivery: "Đang giao",
  delivered: "Đã giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  exception: "Sự cố",
};

const deliveryEn: Record<string, string> = {
  awaiting_arrangement: "Await arrangement",
  courier_requested: "Courier requested (Grab)",
  courier_assigned: "Courier assigned",
  collected: "Collected",
  in_transit: "In transit",
  delivered: "Delivered",
  failed: "Failed",
  returned: "Returned",
};

const deliveryVi: Record<string, string> = {
  awaiting_arrangement: "Chờ sắp xếp giao",
  courier_requested: "Đã gọi Grab / shipper",
  courier_assigned: "Shipper đã nhận",
  collected: "Đã lấy hàng",
  in_transit: "Đang trên đường",
  delivered: "Đã giao xong",
  failed: "Giao thất bại",
  returned: "Hoàn hàng",
};

export function shopOrderStatusLabel(
  status: string,
  locale: "en" | "vi" = "vi",
) {
  const map = locale === "en" ? shopEn : shopVi;
  return map[status] || status;
}

export function deliveryBookingStatusLabel(
  status: string,
  locale: "en" | "vi" = "vi",
) {
  const map = locale === "en" ? deliveryEn : deliveryVi;
  return map[status] || status;
}
