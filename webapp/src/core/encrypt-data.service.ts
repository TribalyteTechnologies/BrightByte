import { Injectable } from "@angular/core";
import { AppConfig } from "../app.config";
import { ILogger, LoggerService } from "../core/logger.service";
import { encrypt, decrypt } from "ethereum-cryptography/aes";

@Injectable()
export class EncryptDataService {

    private readonly MAX_ASCII_LENGTH = 16;
    private readonly BUFFER_ENCODING_TYPE = "ascii";
    private readonly BUFFER_DECODE_TYPE = "hex";

    private log: ILogger;
    private encodeKey: Buffer;
    private initializationVector: Buffer;

    constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("EncryptDataService");
        const windowLocation = window.location.href;
        this.encodeKey = Buffer.from(windowLocation.slice(0, this.MAX_ASCII_LENGTH), this.BUFFER_ENCODING_TYPE);
        this.initializationVector = Buffer.from(AppConfig.SERVER_BASE_URL.slice(0, this.MAX_ASCII_LENGTH), this.BUFFER_ENCODING_TYPE);
    }

    public encodeStringToHex(msg: string): string {
        const result = encrypt(
            Buffer.from(msg, this.BUFFER_ENCODING_TYPE),
            this.encodeKey,
            this.initializationVector
        ).toString(this.BUFFER_DECODE_TYPE);
        return result;
    }

    public decodeHexToString(cypherText: string): string {
        const result = decrypt(
            Buffer.from(cypherText, this.BUFFER_DECODE_TYPE),
            this.encodeKey,
            this.initializationVector
        );
        return Buffer.from(result).toString();
    }
}
