import { Component, Input } from "@angular/core";


@Component({
    selector: "status-message",
    templateUrl: "status-message.component.html",
    styles: ["status-message.component.scss"]
})
export class StatusMessage {

    @Input()
    public isErrorMessage: boolean;

    @Input()
    public messageId: string;

}
