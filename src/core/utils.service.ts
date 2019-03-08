import {Injectable} from "@angular/core";

@Injectable()
export class UtilsService {

    private readonly urlValidator = /(^https\:\/\/(.+)\/(.+)\/)(.+(pull-requests|pull-request|commits|commit|pull)\/.+)/;

    public getUrlValidator(){
        return this.urlValidator;
    }

    public getProjectFromUrl(url: string){
        let project: string = /([a-zA-Z0-9]+\/(pull-requests|pull-request|commits|commit)\/.+)/.exec(url)[0];
        project = /^.[^/]+/.exec(project)[0];
        return project;
    }

    public getHashFromUrl(url: string){
        return /[^/]+$/.exec(url)[0];
    }
}

