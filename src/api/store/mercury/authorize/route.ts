import {MedusaRequest, MedusaResponse} from "@medusajs/framework/http";
import {processPaymentWorkflow} from "@medusajs/medusa/core-flows";
import {ContainerRegistrationKeys} from "@medusajs/framework/utils";
import {Modules} from "@medusajs/framework/utils";

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse,
) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

    const {id, currency_code, amount, paymentStatus, txHash} = req.body as {
        id: string;
        currency_code: string;
        amount: number;
        paymentStatus?: string;
        txHash?: string;
    };

    if (!id) {
        res.status(400).json({
            success: false,
            message: `Payment session ID is required`,
        });
        return;
    }

    try {
        // First authorization (before transaction submission)
        if (paymentStatus === "pending" && !txHash) {
            logger.info(`Initial payment authorization for session: ${id}`);

            // Update payment session with pending status
            await paymentModuleService.updatePaymentSession({
                id,
                currency_code,
                amount,
                data: {
                    payment_status: "pending",
                    authorized_at: new Date().toISOString(),
                },
            });

            res.status(200).json({
                success: true,
                message: `Payment pre-authorized successfully`,
            });
            return;
        }

        // Second authorization (after transaction submission with txHash)
        if (txHash) {
            logger.info(
                `Final payment authorization for session: ${id} with txHash: ${txHash}`
            );

            // Update payment session with transaction hash
            await paymentModuleService.updatePaymentSession({
                id,
                currency_code,
                amount,
                data: {
                    transaction_hash: txHash,
                    payment_status: "authorized",
                    completed_at: new Date().toISOString(),
                },
            });

            // Process the payment workflow
            const payment = await processPaymentWorkflow(req.scope).run({
                input: {
                    action: "authorized",
                    data: {
                        session_id: id,
                        amount: amount,
                    },
                },
            });

            res.status(200).json({
                success: true,
                message: `Payment authorized successfully with transaction hash: ${txHash}`,
            });
            return;
        }

        // Fallback for backward compatibility
        if (!txHash) {
            res.status(400).json({
                success: false,
                message: `Transaction hash is required for final authorization`,
            });
            return;
        }
    } catch (e) {
        logger.error(`Could not update the payment session: ${e.message}`);
        res.status(400).json({
            success: false,
            message: e.message,
        });
    }
};
