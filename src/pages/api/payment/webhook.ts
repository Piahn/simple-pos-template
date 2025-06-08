import { db } from "@/server/db";
import type { NextApiHandler } from "next";

type XenditWebhookBody = {
    event: "payment.succeeded";
    data: {
        id: string;
        amount: number;
        payment_request_id: string;
        reference_id: string;
        status: "SUCCEEDED" | "FAILED";
    };
};

const handler: NextApiHandler = async (req, res) => {
    // if (req.method !== "POST") return;

    //   Verify Webhook Xendit
    const headers = req.headers;
    const webhookToken = headers["x-callback-token"];
    const body = req.body as XenditWebhookBody;

    if (webhookToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
        return res.status(401).send("Unauthorized");
    }

    const order = await db.order.findUnique({
        where: {
            id: body.data.reference_id,
        },
    });

    if (!order) {
        return res.status(404).send("Order not found");
    }

    if (body.data.status !== "SUCCEEDED") {
        return res.status(422);
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

    return res.status(200).send("OK");
};

export default handler;