import { AppConfig } from "../app.config";
import { encrypt, decrypt } from "ethereum-cryptography/aes";

export class EncryptionUtils {

    private static readonly MAX_ENC_BUFFER_LENGTH = 16;
    private static readonly BUFFER_ASCII_TYPE = "ascii";
    private static readonly BUFFER_HEX_TYPE = "hex";
    private static readonly WINDOW_LOCATION = window.location.href;
    private static readonly ENCODE_KEY = Buffer.from(
        EncryptionUtils.WINDOW_LOCATION.slice(0, EncryptionUtils.MAX_ENC_BUFFER_LENGTH),
        EncryptionUtils.BUFFER_ASCII_TYPE
    );
    private static readonly INITIALIZATION_VECTOR = Buffer.from(
        AppConfig.SERVER_BASE_URL.slice(0, EncryptionUtils.MAX_ENC_BUFFER_LENGTH),
        EncryptionUtils.BUFFER_ASCII_TYPE
    );


    public static encode(msg: string): string {
        const result = encrypt(
            Buffer.from(msg, this.BUFFER_ASCII_TYPE),
            this.ENCODE_KEY,
            this.INITIALIZATION_VECTOR
        ).toString(this.BUFFER_HEX_TYPE);
        return result;
    }

    public static decode(cypherText: string): string {
        const result = decrypt(
            Buffer.from(cypherText, this.BUFFER_HEX_TYPE),
            this.ENCODE_KEY,
            this.INITIALIZATION_VECTOR
        );
        return Buffer.from(result).toString();
    }
}
