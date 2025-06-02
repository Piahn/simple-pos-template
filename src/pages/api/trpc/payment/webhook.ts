import { db } from "@/server/db";
import type { NextApiHandler } from "next";

type xenditWebhookBody = {
    event: "payment.succeeded";
    data: {
        id: string;
        amount: number;
        payment_request_id: string;
        reference_id: string;
        status: "SUCCEEDED" | "FAILED";
    };
}

const handler: NextApiHandler = async (req, res) => {
    if (req.method !== "POST") return;

    const body = req.body as xenditWebhookBody;

    // TODO: Handle payment webhook
    // 1. Update order status
    // 2. Update order items
    // 3. Update payment method

    const order = await db.order.findUnique({
        where: {
            id: body.data.reference_id,
        },
    });

    if (!order) {
        return res.status(404).send("Order not found");
    }

    if (body.data.status !== "SUCCEEDED") {
        // TODO: Handle failed payment
        return res.status(200);
    }

    await db.order.update({
        where: {
            id: order.id,
        },
        data: {
            paidAt: new Date(),
            status: "PROCESSING",
        },
    });

    res.status(200);
}

export default handler;