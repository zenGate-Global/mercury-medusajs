# Cardano Mercury for Medusa JS

> **IMPORTANT**: This software is still in an `alpha` developmental stage,
> please do not use it in production unless you're sure of what you're doing.

## Installation Instructions

1. Include the package in your project: `npm i @cardano-mercury/medusajs`
2. Update your `medusa-config.json` file to add the following values:
   ```typescript
   module.exports = defineConfig({
    projectConfig: {},
    plugins: [
        {
            resolve: "@cardano-mercury/medusajs",
            options: {
                fixerApiKey: "d311e...aae3",
                currencyFreaksApiKey: "87b3...d5a6",
                oxrAppId: "24e5...6ecb",
                xPubKey: "xpub1pc20...6ald",
            },
        },
    ],
    modules: [
        {
            resolve: "@medusajs/medusa/payment",
            options: {
                providers: [
                    {
                        resolve: "@cardano-mercury/medusajs/providers/mercury",
                        options: {
                            fixerApiKey: "d311...aae3",
                            xPubKey: "xpub1pc20...6ald",
                            network: "preprod",
                            apiKey: "..."
                        }
                    }
                ]
            }
        }
    ]})
   ```
   The most important of the variables for the plugin are the `network`,
   `xPubKey` (should be exported from your Eternl Wallet), and `oxrAppId` which
   can be acquired from Open Exchange Rates
   here: [https://docs.openexchangerates.org/reference/api-introduction](https://docs.openexchangerates.org/reference/api-introduction).
3. Modify your `.env` environment variables to include the following:
   ```dotenv
   WALLET_EXTENDED_PUBLIC_KEY=xpub1pc20...6ald
   WALLET_NETWORK=preprod
   KOIOS_API_URL=https://preprod.koios.rest
   KOIOS_API_KEY=eyJh...VCJ9.eyJh...0oPw
   UPDATE_ADA_PRICE_PERIOD=15
   CHECK_ADA_PRICE_SCHEDULE="* * * * *"
   UPDATE_UNPAID_SESSIONS="*/2 * * * *"
   STALE_THRESHOLD_MINUTES=15
   UPDATE_UNPAID_SESSIONS="*/5 * * * *"
   ```
   All of these are required and should match the environment you are using.
4. You will need to customize your frontend structure to correctly connect a 
   Cardano light wallet from the user and craft and submit the transaction.

## Known Issues

- At the moment, the logic for updating currency conversion rates results in a 
  large number of derived, child addresses being generated but never used when
  an order is left unpaid for a long time. This should be addressed to keep a
  single address attached to a single shopping cart in the future and allow for
  address reuse if never used while the order fully expires.