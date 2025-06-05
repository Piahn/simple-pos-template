import { Button } from "@/components/ui/button";
import { toRupiah } from "@/utils/toRupiah";
import { OrderStatus } from "@prisma/client";

export interface Order {
  id: string;
  totalAmount: number;
  totalItems: number;
  status: "Processing" | "Finished";
}

interface OrderCardProps {
  id: string;
  onFinishOrder?: (orderId: string) => void;
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  isFinishingOrder: boolean;
}

export const OrderCard = ({
  id,
  onFinishOrder,
  totalAmount,
  totalItems,
  status,
  isFinishingOrder,
}: OrderCardProps) => {
  const handleFinishOrder = () => {
    if (onFinishOrder) {
      onFinishOrder(id);
    }
  };

  const getBadgeColor = () => {
    switch (status) {
      case OrderStatus.AWAITING_PAYMENT:
        return "bg-yellow-200 text-yellow-900";
      case OrderStatus.PROCESSING:
        return "bg-blue-200 text-blue-900";
      case OrderStatus.DONE:
        return "bg-green-200 text-green-900";
    }
  };

  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="text-muted-foreground text-sm font-medium">
            Order ID
          </h4>
          <p className="font-mono text-sm">{id}</p>
        </div>
        <div
          className={`rounded-full px-2 py-1 text-xs font-medium ${getBadgeColor()}`}
        >
          {status}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-muted-foreground text-sm font-medium">
            Total Amount
          </h4>
          <p className="text-lg font-bold">${toRupiah(totalAmount)}</p>
        </div>
        <div>
          <h4 className="text-muted-foreground text-sm font-medium">
            Total Items
          </h4>
          <p className="text-lg font-bold">{totalItems}</p>
        </div>
      </div>

      {status === OrderStatus.PROCESSING && (
        <Button
          onClick={handleFinishOrder}
          className="w-full"
          size="sm"
          disabled={isFinishingOrder}
        >
          {isFinishingOrder ? "Finishing Order..." : "Finish Order"}
        </Button>
      )}
    </div>
  );
};
