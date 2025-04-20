import {model} from "@medusajs/framework/utils"

export const MercuryAddress = model.define('mercury_address', {
    id: model.id().primaryKey(),
    bech32: model.text(),
    xpubKey: model.text(),
    index: model.bigNumber(),
    status: model.enum(['idle', 'pending']),
    order_id: model.text().nullable()
})
.indexes([
    {
        on: ["order_id"],
        unique: true,
    }
])