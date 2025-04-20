import MercuryService from "./service";
import { Module } from "@medusajs/framework/utils"

export const MERCURY_MODULE = "mercury"

export default Module(MERCURY_MODULE, {
    service: MercuryService,
})