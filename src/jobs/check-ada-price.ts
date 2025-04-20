import {MedusaContainer} from "@medusajs/framework/types";
import {MERCURY_MODULE} from "../modules/mercury";
import MercuryService from "../modules/mercury/service";
import {OpenExchangeRate} from "../modules/mercury/lib/openExchange";
import {Pricefeeder} from "../modules/mercury/lib/pricefeeder";

export default async function checkAdaPriceJob(container: MedusaContainer): Promise<void> {
    const logger = container.resolve("logger");
    const query = container.resolve("query");
    const cardanoMercuryService: MercuryService = container.resolve(MERCURY_MODULE);

    const {data: stores} = await query.graph({
        entity: "store",
        fields: [
            "supported_currencies.currency.*"
        ],
    })

    const storeCurrencies = stores[0].supported_currencies;
    const currencies: string[] = [];

    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const updateAdaPricePeriod = Number(process.env.UPDATE_ADA_PRICE_PERIOD) || 15;
    const freshAdaPrice = new Date(Date.now() - (updateAdaPricePeriod * 60 * 1000));

    const {data: recentRates} = await query.graph({
        entity: "mercury_rates",
        fields: ["*"],
        filters: {
            from: "USD",
            to: "ADA",
            created_at: {
                $gt: freshAdaPrice,
            }
        },
        pagination: {
            skip: 0,
            take: 1,
            order: {
                created_at: "DESC"
            }
        }
    })

    if (recentRates.length === 0) {
        // Do not have a recent price for ADA... time to look for one!
        const priceFeeder = new Pricefeeder();
        const ada = await priceFeeder.getAveragePrice();
        const usdada = Number((1 / ada.price).toFixed(6));
        await cardanoMercuryService.createMercuryRates({
            from: "USD",
            to: "ADA",
            rate: usdada,
        });
    }

    for (const currency of storeCurrencies) {
        if (currency.currency_code === 'usd') {
            continue;
        }

        const {data: recentRates} = await query.graph({
            entity: "mercury_rates",
            fields: ["*"],
            filters: {
                from: currency.currency_code.toUpperCase(),
                to: 'USD',
                created_at: {
                    $gt: oneHourAgo
                }
            },
            pagination: {
                skip: 0,
                take: 1,
                order: {
                    created_at: "DESC"
                },
            }
        });

        if (recentRates.length > 0) {
            continue;
        }

        currencies.push(currency.currency_code.toUpperCase());
    }

    if (currencies.length) {
        const oxr = new OpenExchangeRate(cardanoMercuryService.options.oxrAppId);
        const rates = await oxr.latest();

        for (const ticker of currencies) {
            if (rates.data.rates[ticker]) {
                await cardanoMercuryService.createMercuryRates({
                    from: ticker,
                    to: 'USD',
                    rate: 1 / rates.data.rates[ticker]
                });
            }
        }
    } else {
        // logger.info("Currently no currencies need to be updated...");
    }
}

export const config = {
    name: "check-ada-price",
    schedule: process.env.CHECK_ADA_PRICE_SCHEDULE || "* * * * *"
}