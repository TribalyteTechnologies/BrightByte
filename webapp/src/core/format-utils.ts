export class FormatUtils {

    private static readonly URL_VALIDATOR = /(^https\:\/\/(.+)\/(.+)\/)(.+(pull-requests|pull-request|commits|commit|pull)\/.+)/;
    private static readonly EMAIL_VALIDATOR = /.*@.*\..+$/;
    private static readonly PROJECT_FROM_URL_1 = /([a-zA-Z0-9-_]+\/(pull-requests|pull-request|commits|commit|pull)\/.+)/;
    private static readonly PROJECT_FROM_URL_2 = /^.[^/]+/;
    private static readonly HASH_FROM_URL_1 = /(pull-requests|pull-request|commits|commit|pull)\/[^/]+/;
    private static readonly HASH_FROM_URL_2 = /\/.*$/;
    private static readonly HASH_FROM_URL_3 = /[^/].*/;

    public static getUrlValidatorPattern(): RegExp{
        return this.URL_VALIDATOR;
    }

    public static getEmailValidatorPattern(): RegExp{
        return this.EMAIL_VALIDATOR;
    }

    public static getProjectFromUrl(url: string){
        let project: string;
        if (url){
            project = this.PROJECT_FROM_URL_1.exec(url)[0];
            project = this.PROJECT_FROM_URL_2.exec(project)[0];
        }
        return project ? project : null;
    }

    public static getHashFromUrl(url: string){
        let hash: string;
        if (url){
            hash = this.HASH_FROM_URL_1.exec(url)[0];
            hash = this.HASH_FROM_URL_2.exec(hash)[0];
            hash = this.HASH_FROM_URL_3.exec(hash)[0];
        }
        return hash ? hash : null;
    }

    public static padWithZeroes(value: number, length: number) {
        let str = "" + value;
        while (str.length < length) {
            str = "0" + str;
        }
        return str;
    }
}

