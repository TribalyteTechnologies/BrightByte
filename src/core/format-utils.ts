export class FormatUtils {

    private static readonly URL_VALIDATOR = /(^https\:\/\/(.+)\/(.+)\/)(.+(pull-requests|pull-request|commits|commit|pull)\/.+)/;
    private static readonly EMAIL_VALIDATOR = /.*@.*\..+$/;
    private static readonly PROJECT_FROM_URL_1 = /([a-zA-Z0-9]+\/(pull-requests|pull-request|commits|commit)\/.+)/;
    private static readonly PROJECT_FROM_URL_2 = /^.[^/]+/;
    private static readonly HASH_FROM_URL_1 = /\/(pull-requests|pull-request|commits|commit)\/[^/]+/;
    private static readonly HASH_FROM_URL_2 = /[^/a-z-].+$/;


    public static getUrlValidatorPattern(): RegExp{
        return this.URL_VALIDATOR;
    }

    public static getEmailValidatorPattern(): RegExp{
        return this.EMAIL_VALIDATOR;
    }

    public static getProjectFromUrl(url: string){
        let project: string = this.PROJECT_FROM_URL_1.exec(url)[0];
        project = this.PROJECT_FROM_URL_2.exec(project)[0];
        return project;
    }

    public static getHashFromUrl(url: string){
        let hash = this.HASH_FROM_URL_1.exec(url)[0];
        return this.HASH_FROM_URL_2.exec(hash)[0];
    }
}

