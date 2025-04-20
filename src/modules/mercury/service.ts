import {MedusaService} from "@medusajs/framework/utils"
import {MercuryAddress} from "./models/mercury-address"
import {MercuryRate} from "./models/mercury-rate";

type Options = {
    fixerApiKey: string;
    currencyFreaksApiKey: string;
    oxrAppId: string;
    apiKey: string
}

export default class MercuryService extends MedusaService({
    MercuryAddress,
    MercuryRate
}) {
    public options: Options;

    constructor({}, options: Options) {
        super(...arguments);
        this.options = options;
    }
}