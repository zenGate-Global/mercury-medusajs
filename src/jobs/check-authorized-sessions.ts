import {IOrderModuleService, MedusaContainer} from "@medusajs/framework/types"
import {Modules} from "@medusajs/framework/utils"
import axios from "axios";
import {capturePaymentWorkflow, markPaymentCollectionAsPaid} from "@medusajs/core-flows";

export default async function checkAuthorizedSessionsJob(container: MedusaContainer) {
    const paymentModuleService = container.resolve(Modules.PAYMENT)
    const orderService: IOrderModuleService = container.resolve(Modules.ORDER);
    const logger = container.resolve("logger")

    try {
        const authorized_sessions = await paymentModuleService.listPaymentSessions({
            provider_id: "pp_cardano-mercury",
        }, {
            filters: {
                status: ["authorized"]
            }
        });

        logger.info(`Found ${authorized_sessions.length} authorized sessions`)
        // logger.info(JSON.stringify(authorized_sessions, null, 2));

        for (const session of authorized_sessions) {
            if (session.status !== "authorized") continue;
            if (session.data.tx_hash) continue;
            console.log(`Checking session ${session.id} with status ${session.status}...`);
            console.log(JSON.stringify(session, null, 2));
            const txs = await hasAddressReceivedPaymentKoios(session.data.address as string);
            if (txs === false) {
                console.log(`No transactions found for address ${session.data.address}`);
                continue
            }
            if (typeof txs !== "boolean" && txs.length === 0) continue;

            console.log(`Found transactions?`, txs);

            for (const tx of txs as any[]) {
                const tx_details = await getTransactionDetails(tx.tx_hash);
                const tx_metadata = await getTransactionMetadata(tx.tx_hash);
                const payment_metadata = `payses_` + tx_metadata?.['647']?.['msg']?.[0];

                const matching_utxo = tx_details.outputs.find(o => {
                        const output_value = Number(o.value || 0) / 1000000;
                        return o.payment_addr.bech32 == session.data.address &&
                            output_value == session.data.ada_amount
                    }
                )

                if (payment_metadata === session.id && matching_utxo) {
                    console.log(`Valid payment... let's do the things!`);

                    const paymentId = session.payment?.id;
                    if (!paymentId) continue;
                    const paymentCollectionId = session.payment_collection?.id;
                    if (!paymentCollectionId) continue;

                    const paymentCollection = await paymentModuleService.retrievePaymentCollection(paymentCollectionId, {});

                    const payment = await paymentModuleService.capturePayment({
                        payment_id: paymentId,
                    });

                    let {result} = await capturePaymentWorkflow(container)
                        .run({
                            input: {
                                payment_id: paymentId,
                            }
                        })

                    await paymentModuleService.updatePaymentSession({
                        id: session.id,
                        currency_code: session.currency_code,
                        amount: session.amount,
                        data: {
                            ...session.data,
                            payment_tx: {
                                ...tx,
                                metadata: tx_metadata,
                                details: tx_details,
                            },
                            tx_hash: matching_utxo.tx_hash,
                        }
                    })

                    await paymentModuleService.updatePaymentCollections(paymentCollectionId,
                        {
                            metadata: {
                                payment_tx: {
                                    ...tx,
                                    metadata: tx_metadata,
                                    details: tx_details,
                                },
                                tx_hash: matching_utxo.tx_hash,
                            }
                        })

                    console.log(`Done capturing payment?`, payment);
                    // console.log(`Done capturing payment collection?`, paymentSession);
                }
            }


        }
    } catch (e) {
        logger.error(`Error checking for authorized sessions?`, e);
    }
}

export const config = {
    name: "check-mercury-authorized-sessions",
    schedule: process.env.UPDATE_UNPAID_SESSIONS || "*/2 * * * *" // Run every 2 minutes by default
}

const KOIOS_API_URL = process.env.KOIOS_API_URL || 'https://api.koios.rest';
const KOIOS_API_KEY = process.env.KOIOS_API_KEY;

async function hasAddressReceivedPaymentKoios(address: string): Promise<boolean | any[]> {
    try {
        const response = await axios.post(`${KOIOS_API_URL}/api/v1/address_txs`, {
            _addresses: [address]
        }, {
            headers: {
                accept: "application/json",
                'content-type': "application/json",
                authorization: `Bearer ${KOIOS_API_KEY}`
            }
        });

        console.log("how did it turn out?", response.status);
        // console.log(JSON.stringify(response, null, 2));

        const txs = response.data;

        console.log(JSON.stringify(txs, null, 2));

        return txs;
    } catch (err) {
        if (err.code === 'ECONNRESET') {
            // You're probably getting rate limited by Koios here...
            console.warn("⚠️ Connection was reset by the server.")
        }
        console.error(err);
        return false;
    }
}

async function getTransactionDetails(txHash: string): Promise<boolean | any> {
    try {
        const response = await axios.post(`${KOIOS_API_URL}/api/v1/tx_info`, {
            _tx_hashes: [txHash]
        }, {
            headers: {
                accept: "application/json",
                'content-type': "application/json",
                authorization: `Bearer ${KOIOS_API_KEY}`
            }
        });

        const tx = response.data[0];

        return tx;
    } catch (err) {
        console.error("Failed to fetch tx info:", err);
        return false;
    }
}

async function getTransactionMetadata(txHash: string): Promise<null | any> {
    try {
        const response = await axios.post(`${KOIOS_API_URL}/api/v1/tx_metadata`, {
            _tx_hashes: [txHash]
        }, {
            headers: {
                accept: "application/json",
                'content-type': "application/json",
                authorization: `Bearer ${KOIOS_API_KEY}`
            }
        });

        return response.data[0]?.metadata || null;
    } catch (err) {
        console.error("Failed to fetch tx metadata:", err);
        return null;
    }
}