import {MedusaRequest, MedusaResponse} from "@medusajs/framework/http"
import {ContainerRegistrationKeys} from "@medusajs/framework/utils"
import {generateMercuryAddressWorkflow} from "../../../../workflows/generate-mercury-address";
import {MERCURY_MODULE} from "../../../../modules/mercury";
import MercuryService from "../../../../modules/mercury/service";

type GeneratedAddress = {
    id: string;
    bech32: string;
    xpubKey: string;
    index: number;
    status: string;
}

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    // Resolve the Query provider from the container
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
    const cardanoMercuryService: MercuryService = req.scope.resolve(MERCURY_MODULE);


    // @ts-ignore
    const {order_id} = req.body;

    let address: GeneratedAddress;

    const {data: assignedAddress} = await query.graph({
        entity: "mercury_address",
        fields: ["id", "bech32", "xpubKey", "index", "status"],
        filters: {
            status: "pending",
            order_id: order_id,
        },
        pagination: {
            skip: 0,
            take: 1,
            order: {
                index: "ASC"
            }
        }
    });

    if (assignedAddress.length) {
        address = assignedAddress[0];
    } else {
        // Query for an unused address
        const {data: unusedAddresses} = await query.graph({
            entity: "mercury_address",
            fields: ["id", "bech32", "xpubKey", "index", "status"],
            filters: {
                status: "idle"
            },
            pagination: {
                skip: 0,
                take: 1,
                order: {
                    index: "ASC"
                }
            }
        });

        if (unusedAddresses.length > 0) {
            // Return the first unused address
            address = unusedAddresses[0]
            await cardanoMercuryService.updateMercuryAddresses([
                {
                    id: address.id,
                    status: "pending",
                    order_id: order_id,
                }
            ])
        } else {
            const {result} = await generateMercuryAddressWorkflow(req.scope)
                .run({
                    input: {
                        xpubKey: process.env.WALLET_EXTENDED_PUBLIC_KEY || '',
                        network: process.env.WALLET_NETWORK || 'mainnet',
                        order_id: order_id,
                        // Any parameters needed for address creation
                    },
                });

            address = result.address; // result.address
        }
    }

    res.json(address)
}