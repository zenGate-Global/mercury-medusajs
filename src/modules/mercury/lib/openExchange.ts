import axios, {AxiosInstance} from 'axios';

export class OpenExchangeRate {
    private client: AxiosInstance;
    private static readonly uri: string = "https://openexchangerates.org/api/"; // latest.json?app_id=YOUR_APP_ID

    constructor(private app_id: string) {
        this.client = axios.create({
            baseURL: OpenExchangeRate.uri
        });
    }

    public async latest(): Promise<{ code: number; data?: any; message?: string }> {
        try {
            const response = await this.client.get(`latest.json?app_id=${this.app_id}`);

            return {
                code: response.status,
                data: response.data,
            };
        } catch (error) {
            console.error(`Could not fetch data from OpenExchangeRate: ${error}`);

            let code = 0;
            let message = `Uknown Error`;

            if (axios.isAxiosError(error)) {
                code = error.response ? error.response.status : 500;
                message = error.message;
            }

            return {code, message};
        }
    }
}