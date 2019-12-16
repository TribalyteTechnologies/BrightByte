export interface ITrbSmartContact {
    [key: string]: any;
}

export interface ITrbSmartContractJson {
    abi: Array<Object>;
    networks: { [key: string]: { address: string } };
}
