import {MedusaRequest, MedusaResponse} from "@medusajs/framework/http";
import {ContainerRegistrationKeys} from "@medusajs/framework/utils";

export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse,
) => {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

    const {from, to, amount} = req.body as {
        from: string
        to: string
        amount: number
    };

    if (!from) {
        res.status(400).json({
            message: `From currency code is missing`
        });
    }

    if (!to) {
        res.status(400).json({
            message: `To currency code is missing`
        });
    }

    if (!amount) {
        res.status(400).json({
            message: `Order amount is missing`
        });
    }

    let currency_rate = 1;

    if (from.toUpperCase() === 'USD' && to.toUpperCase() === 'USD') {
        currency_rate = 1;
    } else {
        const {data: recentRates} = await query.graph({
            entity: "mercury_rate",
            fields: ["*"],
            filters: {
                from: from.toUpperCase(),
                to: to.toUpperCase(),
            },
            pagination: {
                skip: 0,
                take: 1,
                order: {
                    created_at: "DESC"
                }
            }
        });

        if (recentRates.length) {
            currency_rate = recentRates[0].rate;
        } else {
            res.status(500).json({
                message: `Could not find a rate for this currency code!`
            })
        }
    }

    const {data: recentRates} = await query.graph({
        entity: "mercury_rate",
        fields: ["*"],
        filters: {
            from: "USD",
            to: "ADA"
        },
        pagination: {
            skip: 0,
            take: 1,
            order: {
                created_at: "DESC"
            }
        }
    });

    if (recentRates.length === 0) {
        res.status(500).json({
            message: `Do not have a current ADA price value...`
        });
    }

    const ada_rate = recentRates[0].rate;
    const ada_amount = Number(((amount * currency_rate) * ada_rate).toFixed(6));

    return res.status(200).json({
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        amount,
        usd_rate: currency_rate,
        usd_amount: amount * currency_rate,
        ada_rate,
        ada_amount,
    })
}