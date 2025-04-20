import {
    Credential,
    Bip32PublicKey,
    // EnterpriseAddress,
    NetworkInfo, BaseAddress,
} from "@emurgo/cardano-serialization-lib-nodejs";


export const generateUnusedAddress = async (xpubKey: string, index: number = 0, network: string = 'mainnet'): Promise<string> => {
    const bip32PublicKey = Bip32PublicKey.from_bech32(xpubKey);
    const derivedKey = bip32PublicKey.derive(0).derive(index).to_raw_key();
    const stakeKey = bip32PublicKey.derive(2).derive(0).to_raw_key();
    // This works to generate an enterprise address... not sure how Eternl will handle these but fees would be lower
    // and harder to track the merchant balance.
    // Maybe configure this with a function parameter?
    /*const enterpriseAddress = EnterpriseAddress.new(
        NetworkInfo.testnet_preprod().network_id(),
        Credential.from_keyhash(derivedKey.hash())
    );*/

    const stakeAddress = BaseAddress.new(
        network === 'mainnet' ? NetworkInfo.mainnet().network_id() : NetworkInfo.testnet_preprod().network_id(),
        Credential.from_keyhash(derivedKey.hash()),
        Credential.from_keyhash(stakeKey.hash()),
    )
    return stakeAddress.to_address().to_bech32();
}