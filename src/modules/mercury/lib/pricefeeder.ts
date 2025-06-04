import axios from 'axios';

export interface AveragePrice {
    price: number;
    hitbtc: number;
    coingecko: number;
}

export class Pricefeeder {
    private static readonly hitbtc_url: string = 'https://api.hitbtc.com/api/2/public/ticker/ADAUSD';
    private static readonly coingecko_url: string =
        'https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd';

    constructor() {
    }


    private async getPrice(url: string): Promise<any> {
        const response = await axios.get(url);
        return response.data;
    }

    private async getHitBTCPrice(): Promise<number> {
        // const cacheKey = "Mercury_HitBTC_ADA_USD_Price";
        const data = await this.getPrice(Pricefeeder.hitbtc_url);
        // Use optional chaining to safely access the property.
        return data?.last;
    }

    private async getCoinGeckoPrice(): Promise<number> {
        // const cacheKey = "Mercury_CoinGecko_ADA_USD_Price";
        const data = await this.getPrice(Pricefeeder.coingecko_url);
        // Use optional chaining to safely access nested properties.
        return data?.cardano?.usd;
    }

    public async getAveragePrice(): Promise<AveragePrice> {
        // Fetch prices concurrently.
        const [hitbtc, coingecko] = await Promise.all([
            this.getHitBTCPrice(),
            this.getCoinGeckoPrice(),
        ]);

        const prices = [hitbtc, coingecko].filter((p) => p != null);
        const avg_price = prices.length === 0 ? 0 : parseFloat(
            (prices.reduce((sum, p) => sum + Number(p), 0) / prices.length).toFixed(6)
        );

        return {
            price: avg_price,
            hitbtc,
            coingecko,
        };
    }
}
