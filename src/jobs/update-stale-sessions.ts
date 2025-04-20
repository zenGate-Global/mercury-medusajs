import {MedusaContainer} from "@medusajs/framework/types"
import {Modules} from "@medusajs/framework/utils"
import {deletePaymentSessionsWorkflow, createPaymentSessionsWorkflow} from "@medusajs/medusa/core-flows"

export default async function updateStalePaymentSessionsJob(container: MedusaContainer) {
    const staleThresholdMinutes = Number(process.env.STALE_THRESHOLD_MINUTES) || 15
    const paymentModuleService = container.resolve(Modules.PAYMENT)
    const logger = container.resolve("logger")

    try {
        // Find payment sessions that need updating
        const staleTime = new Date(Date.now() - (staleThresholdMinutes * 60 * 1000))

        // Get stale payment sessions for your provider
        const staleSessions = await paymentModuleService.listPaymentSessions({
            updated_at: {
                $lt: staleTime.toISOString(),
            },
            provider_id: "pp_cardano-mercury",
        }, {
            filters: {
                status: "pending",
            }
        })

        // Process each stale session
        for (const session of staleSessions) {
            await deletePaymentSessionsWorkflow(container).run({
                input: {
                    ids: [session.id]
                }
            })
            // TODO: assuming this is successful we need to release the reserved address for it...

            await createPaymentSessionsWorkflow(container).run({
                input: {
                    payment_collection_id: session.payment_collection_id,
                    provider_id: "pp_cardano-mercury"
                }
            })
        }
    } catch (error) {
        logger.error(`Error updating stale payment sessions: ${error.message}`)
    }
}

export const config = {
    name: "update-mercury-payment-sessions",
    schedule: process.env.UPDATE_UNPAID_SESSIONS || "*/5 * * * *", // Run every 5 minutes by default
}