import {
    createWorkflow,
    WorkflowResponse,
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import {ContainerRegistrationKeys} from "@medusajs/framework/utils"
import {MERCURY_MODULE} from "../modules/mercury";
import MercuryService from "../modules/mercury/service";
import {generateUnusedAddress} from "../modules/mercury/lib/cardano";

// Step 1: Find the highest index in the mercury_address table
const findHighestIndexStep = createStep(
    "find-highest-index",
    async ({}, {container}) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)

        // Query for the highest index
        const {data: addresses} = await query.graph({
            entity: "mercury_address",
            fields: ["index"],
            pagination: {
                skip: 0,
                take: 1,
                order: {
                    index: "DESC"
                }
            }
        })

        // Get the highest index or default to -1 if no addresses exist
        const highestIndex = addresses.length > 0 ? addresses[0].index : -1

        return new StepResponse({highestIndex})
    }
)

// Step 2: Generate a new address using the highest index + 1
const generateAddressStep = createStep(
    "generate-address",
    async (input: { xpubKey: string, highestIndex: number, network: string }) => {
        // Generate a new address with index + 1
        const newIndex = input.highestIndex + 1
        const bech32 = await generateUnusedAddress(input.xpubKey, newIndex, input.network)

        return new StepResponse({
            newAddress: {
                bech32,
                xpubKey: input.xpubKey,
                index: newIndex,
                status: "pending"
            }
        })
    }
)

// Step 3: Insert the new address into the database
const saveAddressStep = createStep(
    "save-address",
    async (input: { newAddress: object, order_id: string }, {container}) => {

        const cardanoMercuryService: MercuryService = container.resolve(MERCURY_MODULE);

        console.log(`Saving newly generated address...`);
        console.log(JSON.stringify({...input.newAddress, order_id: input.order_id}, null, 2));

        const createdAddress = await cardanoMercuryService.createMercuryAddresses({...input.newAddress, order_id: input.order_id})

        console.log("Did save address?");
        console.log(JSON.stringify(createdAddress, null, 2));

        return new StepResponse({createdAddressId: createdAddress.id})
    },
    // Compensation function to delete the address if a later step fails
    async (createdAddressId, {container}) => {
        if (!createdAddressId) {
            return
        }

        const cardanoMercuryService: MercuryService = container.resolve(MERCURY_MODULE);

        await cardanoMercuryService.deleteMercuryAddresses(createdAddressId);
    }
)

// Step 4: Query the newly created address to return complete data
const getCreatedAddressStep = createStep(
    "get-created-address",
    async (input: { createdAddressId: number }, {container}) => {
        const query = container.resolve(ContainerRegistrationKeys.QUERY)

        const {data: addresses} = await query.graph({
            entity: "mercury_address",
            fields: ["id", "bech32", "xpubKey", "index", "status"],
            filters: {id: input.createdAddressId}
        })

        const address = addresses[0]

        return new StepResponse({address})
    }
)

// Create and export the workflow
export const generateMercuryAddressWorkflow = createWorkflow(
    "generate-mercury-address",
    (input: {
        xpubKey: string,
        network: string,
        order_id: string,
    }) => {
        const {highestIndex} = findHighestIndexStep()
        const {newAddress} = generateAddressStep({xpubKey: input.xpubKey, highestIndex, network: input.network})
        const {createdAddressId} = saveAddressStep({
                newAddress,
                order_id: input.order_id,
        })
        const {address} = getCreatedAddressStep({createdAddressId})

        return new WorkflowResponse({address})
    }
)