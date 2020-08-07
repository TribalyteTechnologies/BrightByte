export class UnsignedTransaction { 
    public byteCode: string;
    public contractAddress: string;

    constructor(byteCode: string, contractAddress: string) {
        this.byteCode = byteCode;
        this.contractAddress = contractAddress;
    }
}
