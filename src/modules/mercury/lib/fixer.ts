import axios, {AxiosInstance} from 'axios';

export class Fixer {
    private client: AxiosInstance;
    private static readonly uri: string = 'https://data.fixer.io/api/';

    constructor(private readonly apikey: string) {
        this.client = axios.create({
            baseURL: Fixer.uri,
        });
    }

    public async convert(
        base: string = 'EUR',
        to: string = 'USD'
    ): Promise<{ code: number; data?: any; message?: string }> {
        try {
            const response = await this.client.get(`latest?access_key=${this.apikey}`, {
                params: {
                    base,
                    symbols: to,
                },
            });

            return {
                code: response.status,
                data: response.data,
            };
        } catch (error: unknown) {
            // Log the error – here we use console.error as an example
            console.error("Fixer.io Currency API Error:", error);

            let code = 0;
            let message = 'Unknown error';

            if (axios.isAxiosError(error)) {
                code = error.response ? error.response.status : 500;
                message = error.message;
            }
            return {code, message};
        }
    }
}