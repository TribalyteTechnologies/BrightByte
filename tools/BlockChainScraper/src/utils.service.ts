import { RepetitionStatistics } from './blockchain-scrapper.models';

export class UtilsService {

    private readonly HEX_HEADER_VALIDATOR = /0x.+/;
    private readonly HEX_RADIX = 16;

    public convertHexToAscii(hex: string, minCharCode?: number, maxCharCode?: number) {
        let resultAscii = "";
        let isMaxAndMinDefined = minCharCode && maxCharCode;
        let cleanHex = this.HEX_HEADER_VALIDATOR.test(hex) ? hex.substr(2, hex.length) : hex;
        for (var i = 0; i < cleanHex.length; i += 2) {
            let charCode = parseInt(cleanHex.substr(i, 2), this.HEX_RADIX);
            if (isMaxAndMinDefined && (charCode >= minCharCode && charCode <= maxCharCode)) {
                resultAscii += String.fromCharCode(charCode);
            } else if (!isMaxAndMinDefined) {
                resultAscii += String.fromCharCode(charCode);
            }
        }
        return resultAscii;
    }

    public getMostRepeatedValue(values: Array<string>): RepetitionStatistics {
        let keys = {};
        let numberOfRepetitions = 0;
        let mostRepeatedVal: string;
        values.forEach(val => {
            if (keys[val]) keys[val]++; else keys[val] = 1;

            if (numberOfRepetitions < keys[val]) {
                mostRepeatedVal = val;
                numberOfRepetitions = keys[val]
            }
        })
        return new RepetitionStatistics(mostRepeatedVal, numberOfRepetitions)
    }
}
