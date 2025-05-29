import {AbstractPaymentProvider, BigNumber, MedusaError} from "@medusajs/framework/utils";
import {
    Logger,
    PaymentProviderSessionResponse,
    PaymentSessionStatus,
    PaymentProviderError,
    CreatePaymentProviderSession,
    WebhookActionResult,
} from "@medusajs/framework/types";
import {ProviderWebhookPayload} from "@medusajs/types";
import {Fixer} from "../../modules/mercury/lib/fixer";
import {Pricefeeder} from "../../modules/mercury/lib/pricefeeder";

const baseUrl = process.env.VITE_BACKEND_URL;

type Options = {
    fixerApiKey?: string;
    currencyFreaksApiKey?: string;
    apiKey: string
}

type InjectedDependencies = {
    logger: Logger
}

class MercuryProviderService extends AbstractPaymentProvider<Options> {
    protected logger_: Logger
    public options_: Options

    static identifier = "cardano-mercury"
    static displayName = "Cardano Mercury"
    static title = "Cardano Mercury"

    constructor(
        container: InjectedDependencies,
        options: Options
    ) {
        console.log("✅ Cardano Mercury Payment Provider initialized!");

        super(container, options)

        this.logger_ = container.logger;
        this.options_ = options;

    }

    static validateOptions(options: Record<any, any>) {
        if (!options.apiKey) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "API key is required in the provider's options."
            )
        }

        // TODO: Add more granular error checking of options here
    }

    async capturePayment(input: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        this.logger_.debug("Capturing payment!");
        this.logger_.debug(JSON.stringify(input));

        return {
            data: {
                id: input.id
            },
            status: "captured"
        }
    }

    async authorizePayment(input: Record<string, unknown>): Promise<PaymentProviderError | {
        status: PaymentSessionStatus
        data: PaymentProviderSessionResponse["data"]
    }> {
        this.logger_.debug("Authorizing payment!");
        this.logger_.debug(JSON.stringify(input));

        return {
            data: {
                id: input.id,
                transaction_hash: input.txHash,
            },
            status: "authorized"
        }
    }

    async cancelPayment(input: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        this.logger_.debug("Cancel payment!");
        this.logger_.debug(JSON.stringify(input));

        return {
            id: input.id
        }
    }

    async initiatePayment(input: CreatePaymentProviderSession): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        const {
            amount,
            currency_code,
            context: customerDetails
        } = input

        const rate_response = await fetch(`${baseUrl}/mercury/rate`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: currency_code.toUpperCase(),
                to: "USD",
                amount,
            })
        });
        const rate_details = await rate_response.json();

        const response = await fetch(`${baseUrl}/mercury/address`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                order_id: customerDetails.session_id,
            })
        });
        const payment_address = await response.json();

        return {
            data: {
                ...rate_details,
                customerDetails,
                address: payment_address.bech32,
            }
        }
    }

    async deletePayment(input: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        this.logger_.debug("Delete payment!");
        this.logger_.debug(JSON.stringify(input));

        return {
            input
        }
    }

    async getPaymentStatus(input: Record<string, unknown>): Promise<PaymentSessionStatus> {
        this.logger_.debug("Getting payment status!");
        this.logger_.debug(JSON.stringify(input));

        return "pending";
    }

    async refundPayment(input: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        this.logger_.debug("Refund payment!");
        this.logger_.debug(JSON.stringify(input));

        return {
            data: {
                id: input.id,
            }
        }
    }

    async retrievePayment(input: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        this.logger_.debug("Retrieve payment status!");
        this.logger_.debug(JSON.stringify(input));

        return {
            id: input.id,
        }
    }

    async updatePayment(input: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        this.logger_.debug("Update payment!");
        this.logger_.debug(JSON.stringify(input));

        return {data: {}}
    }

    async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
        return {
            action: "authorized",
            data: {
                session_id: (payload.data.metadata as Record<string, any>).session_id,
                amount: new BigNumber(payload.data.amount as number)
            }
        }
    }


}

export default MercuryProviderService