import {
    AbstractPaymentProvider,
    MedusaError,
    BigNumber
} from "@medusajs/utils"
import {
    CreatePaymentProviderSession,
    Logger,
    PaymentProviderError,
    PaymentProviderSessionResponse,
    PaymentSessionStatus,
    ProviderWebhookPayload,
    UpdatePaymentProviderSession,
    WebhookActionResult
} from "@medusajs/types"

type InjectedDependencies = {
    logger: Logger
}

interface apiInterface {
    readonly name: string;
    readonly key: string;
    readonly network: string;
}

type Options = {
    apiProvider: apiInterface
}

class CardanoMercuryService extends AbstractPaymentProvider<
    Options
> {

    static identifier = "cardano-mercury"
    protected logger_: Logger
    protected options_: Options
    protected client

    constructor(
        {logger}: InjectedDependencies,
        options: Options
    ) {
        // @ts-ignore
        super(...arguments)

        this.logger_ = logger
        this.options_ = options
    }

    static validateOptions(
        options: Record<any, any>
    ) {
        if (!options.apiProvider) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "You must specify a Cardano API Provider"
            )
        }
    }

    async capturePayment(
        paymentData: Record<string, unknown>
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        const externalId = paymentData.id

        try {
            const newData = {};
            // const newData = await this.client.doSomething();

            return {
                ...newData,
                id: externalId
            }
        } catch (e) {
            return {
                error: e,
                code: "unknown",
                detail: e
            }
        }
    }

    async authorizePayment(
        paymentSessionData: Record<string, unknown>,
        context: Record<string, unknown>
    ): Promise<
        PaymentProviderError | {
        status: PaymentSessionStatus
        data: PaymentProviderSessionResponse["data"]
    }> {
        const externalId = paymentSessionData.id

        try {
            const paymentData = {}
            // const paymentData = await this.client.authorizePayment(externalId)

            return {
                data: {
                    ...paymentData,
                    id: externalId
                },
                status: "authorized"
            }
        } catch (e) {
            return {
                error: e,
                code: "unknown",
                detail: e
            }
        }
    }

    async cancelPayment(
        paymentData: Record<string, unknown>
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
        const externalId = paymentData.id

        try {
            const paymentData = {}
            // const paymentData = await this.client.cancelPayment(externalId)
        } catch (e) {
            return {
                error: e,
                code: "unknown",
                detail: e
            }
        }
    }

    async initiatePayment(
        context: CreatePaymentProviderSession
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        const {
            amount,
            currency_code,
            context: customerDetails
        } = context

        this.logger_.info(`Setting up payment... ${amount} ${currency_code}`);
        this.logger_.info(`Payment Context: ${context}`);

        try {
            const response = {
                id: "abc123"
            }
            // const response = await this.client.init(
            //     amount, currency_code, customerDetails
            // )

            return {
                ...response,
                data: {
                    id: response.id
                }
            }
        } catch (e) {
            return {
                error: e,
                code: "unknown",
                detail: e
            }
        }
    }

    async deletePayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<
        PaymentProviderError | PaymentProviderSessionResponse["data"]
    > {
        const externalId = paymentSessionData.id

        try {
            // await this.client.cancelPayment(externalId)
            return {}
        } catch (e) {
            return {
                error: e,
                code: "unknown",
                detail: e
            }
        }
    }

    async getPaymentStatus(
        paymentSessionData: Record<string, unknown>,
    ): Promise<PaymentSessionStatus> {
        const externalId = paymentSessionData.id

        try {
            const status = "something"
            // const status = await this.client.getStatus(externalId)

            switch (status) {
                default:
                    return "pending"
            }
        } catch (e) {
            return "error"
        }
    }

    async refundPayment(
        paymentData: Record<string, unknown>,
        refundAmount: number,
    ): Promise<
        PaymentProviderError | PaymentProviderSessionResponse["data"]
    > {
        const externalId = paymentData.id

        try {
            const newData = {}
            // const newData = await this.client.refund(externalId, refundAmount)
            return {
                ...newData,
                id: externalId
            }
        } catch (e) {
            return {
                error: e,
                code: "unknown",
                detail: e
            }
        }
    }

    async retrievePayment(
        paymentSessionData: Record<string, unknown>
    ): Promise<
        PaymentProviderError | PaymentProviderSessionResponse["data"]
    > {
        const externalId = paymentSessionData.id

        try {
            // return await this.client.retrieve(externalId)
            return {}
        } catch (e) {
            return {
                error: e,
                code: "unknown",
                detail: e
            }
        }
    }

    async updatePayment(
        context: UpdatePaymentProviderSession
    ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
        const {
            amount,
            currency_code,
            context: customerDetails,
            data
        } = context
        const externalId = data.id

        try {
            const response = {
                id: externalId
            }
            // const response = await this.client.update(
            //     externalId,
            //     {
            //         amount,
            //         currency_code,
            //         customerDetails
            //     }
            // )

            return {
                ...response,
                data: {
                    id: response.id
                }
            }
        } catch (e) {
            return {
                error: e,
                code: "unknown",
                detail: e
            }
        }
    }

    async getWebhookActionAndData(
        payload: ProviderWebhookPayload["payload"]
    ): Promise<WebhookActionResult> {
        const {
            data,
            rawData,
            headers
        } = payload

        try {
            switch (data.event_type) {
                case "authorized_amount":
                    return {
                        action: "authorized",
                        data: {
                            session_id: (data.metadata as Record<string, any>).session_id,
                            amount: new BigNumber(data.amount as number)
                        }
                    }
                case "success":
                    return {
                        action: "captured",
                        data: {
                            session_id: (data.metadata as Record<string, any>).session_id,
                            amount: new BigNumber(data.amount as number)
                        }
                    }
                default:
                    return {
                        action: "not_supported"
                    }
            }
        } catch (e) {
            return {
                action: "failed",
                data: {
                    session_id: (data.metadata as Record<string, any>).session_id,
                    amount: new BigNumber(data.amount as number)
                }
            }
        }
    }


    // TODO implement methods
}

export default CardanoMercuryService