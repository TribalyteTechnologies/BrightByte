import { Component, Input } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";


@Component({
    selector: "error",
    templateUrl: "error.component.html",
    styles: ["error.component.scss"]
})
export class ErrorMessage {

    @Input()
    public isErrorMessage: boolean;

    @Input()
    public message: string;

    public messageTranslate: string;

    constructor(
        private translateSrv: TranslateService
    ){

    }
    
    public ngOnInit() {
        this.translateSrv.get(this.message).subscribe(translation => {
            this.messageTranslate = translation;
        });
    }

}
