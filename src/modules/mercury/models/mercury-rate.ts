import {model} from "@medusajs/framework/utils"

export const MercuryRate = model.define('mercury_rate', {
    id: model.id().primaryKey(),
    from: model.text(),
    to: model.text(),
    rate: model.float()
})