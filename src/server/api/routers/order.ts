import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
    createQRIS,
    xenditPaymenMethodClient,
    xenditPaymentRequestClient,
} from "@/server/xendit";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";
// import { addMinutes } from "date-fns";

export const orderRouter = createTRPCRouter({
    createOrder: protectedProcedure
        .input(
            z.object({
                orderItems: z.array(
                    z.object({
                        productId: z.string(),
                        quantity: z.number().min(1),
                    }),
                ),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;
            const { orderItems } = input;

            const products = await db.product.findMany({
                where: {
                    id: {
                        in: orderItems.map((item) => item.productId),
                    },
                },
            });

            let subtotal = 0;

            products.forEach((product) => {
                const productQuantity = orderItems.find(
                    (item) => item.productId === product.id,
                )!.quantity;

                const totalPrice = product.price * productQuantity;

                subtotal += totalPrice;
            });

            const tax = subtotal * 0.1;
            const grandTotal = subtotal + tax;

            const order = await db.order.create({
                data: {
                    status: "AWAITING_PAYMENT",
                    grandTotal,
                    subtotal,
                    tax,
                },
            });

            const newOrderItems = await db.orderItem.createMany({
                data: products.map((product) => {
                    const productQuantity = orderItems.find(
                        (item) => item.productId === product.id,
                    )!.quantity;

                    return {
                        orderId: order.id,
                        price: product.price,
                        productId: product.id,
                        quantity: productQuantity,
                    };
                }),
            });

            const paymentRequest = await createQRIS({
                amount: grandTotal,
                orderId: order.id,
            });

            await db.order.update({
                where: {
                    id: order.id,
                },
                data: {
                    externalTransactionId: paymentRequest.id,
                    paymentMethodId: paymentRequest.paymentMethod.id,
                },
            });

            return {
                order,
                newOrderItems,
                qrString:
                    paymentRequest.paymentMethod.qrCode!.channelProperties!.qrString!,
            };
        }),

    simulatePayment: protectedProcedure
        .input(
            z.object({
                orderId: z.string().uuid(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const order = await db.order.findUnique({
                where: {
                    id: input.orderId,
                },
                select: {
                    paymentMethodId: true,
                    grandTotal: true,
                },
            });

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });
            }

            await xenditPaymenMethodClient.simulatePayment({
                paymentMethodId: order.paymentMethodId!,
                data: {
                    amount: order.grandTotal,
                },
            });

            await db.order.update({
                where: {
                    id: input.orderId,
                },
                data: {
                    paidAt: new Date(),
                    status: "PROCESSING",
                },
            });
        }),

    checkOrderStatus: protectedProcedure
        .input(
            z.object({
                orderId: z.string().uuid(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const order = await db.order.findUnique({
                where: {
                    id: input.orderId,
                },
                select: {
                    paidAt: true,
                    status: true,
                    externalTransactionId: true,
                },
            });

            // Jika order sudah lunas, langsung kembalikan status sukses.
            if (order?.paidAt) {
                return { status: "SUCCEEDED", message: "Order sudah dibayar." };
            }

            // Periksa apakah ID transaksi eksternal ada. Ini perbaikan utamanya.
            if (!order?.externalTransactionId) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "Order tidak memiliki ID transaksi eksternal untuk dicek.",
                });
            }

            // Lanjutkan untuk memeriksa status ke Xendit.
            return xenditPaymentRequestClient.simulatePaymentRequestPayment({
                paymentRequestId: order.externalTransactionId,
            });
        }),

    getOrders: protectedProcedure
        .input(
            z.object({
                status: z.enum(["ALL", ...Object.keys(OrderStatus)]).default("All"),
            }),
        )
        .query(async ({ ctx, input }) => {
            const { db } = ctx;
            const whereClause: Prisma.OrderWhereInput = {};

            switch (input.status) {
                case OrderStatus.AWAITING_PAYMENT:
                    whereClause.status = OrderStatus.AWAITING_PAYMENT;
                    break;
                case OrderStatus.PROCESSING:
                    whereClause.status = OrderStatus.PROCESSING;
                    break;
                case OrderStatus.DONE:
                    whereClause.status = OrderStatus.DONE;
                    break;
            }

            const orders = await db.order.findMany({
                where: whereClause,
                select: {
                    id: true,
                    grandTotal: true,
                    status: true,
                    paidAt: true,
                    _count: {
                        select: {
                            orderItems: true,
                        },
                    },
                },
            });
            return orders;
        }),

    finishOrder: protectedProcedure
        .input(
            z.object({
                orderId: z.string().uuid(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { db } = ctx;

            const order = await db.order.findUnique({
                where: {
                    id: input.orderId,
                },
                select: {
                    id: true,
                    paidAt: true,
                    status: true,
                },
            });

            if (!order) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order not found",
                });
            }

            if (!order.paidAt) {
                throw new TRPCError({
                    code: "UNPROCESSABLE_CONTENT",
                    message: "Order is not paid yet",
                });
            }

            await db.order.update({
                where: {
                    id: order.id,
                },
                data: {
                    status: OrderStatus.DONE,
                },
            });
        }),

    getSalesReport: protectedProcedure.query(async ({ ctx }) => {
        const { db } = ctx;

        const paidOrdersQuery = db.order.findMany({
            where: {
                paidAt: {
                    not: null,
                },
            },
            select: {
                grandTotal: true,
            },
        });

        const ongoingOrdersQuery = db.order.findMany({
            where: {
                status: {
                    not: "DONE",
                },
            },
            select: {
                id: true,
            },
        });

        const completedOrderQuery = db.order.findMany({
            where: {
                status: "DONE",
            },
            select: {
                id: true,
            },
        });

        const [paidOrders, ongoingOrders, completedOrders] = await Promise.all([
            paidOrdersQuery,
            ongoingOrdersQuery,
            completedOrderQuery,
        ]);

        const totalRevenue = paidOrders.reduce((a, b) => {
            return a + b.grandTotal;
        }, 0);

        const totalOngoingOrders = ongoingOrders.length;
        const totalCompletedOrders = completedOrders.length;

        return {
            totalRevenue,
            totalOngoingOrders,
            totalCompletedOrders,
        };
    }),
});