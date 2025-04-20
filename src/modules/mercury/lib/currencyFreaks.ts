import axios, {AxiosInstance} from 'axios';

export class CurrencyFreaks {
    private client: AxiosInstance;
    private static readonly uri: string = 'https://api.currencyfreaks.com/v2.0/';

    constructor(private apiKey: string) {
        this.client = axios.create({
            baseURL: CurrencyFreaks.uri
        })
    }

    public async latest(): Promise<any> {
        try {
            const response = await this.client.get(`rates/latest?apikey=${this.apiKey}`);
            return {
                status: response.status,
                rates: response.data.rates,
            }
        } catch (error: unknown) {
            console.error(`Could not fetch rates from Currency Freaks?`, error);
            let code = 0;
            let message = `Unknown error`;

            if (axios.isAxiosError(error)) {
                code = error.response ? error.response.status : 500;
                message = error.message;
            }

            return {code, message};
        }
    }
}