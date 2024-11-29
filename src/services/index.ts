import CardanoMercuryService from "./service"
import {
    ModuleProvider,
    Modules
} from "@medusajs/utils"

export default ModuleProvider(Modules.PAYMENT, {
    services: [CardanoMercuryService],
})
