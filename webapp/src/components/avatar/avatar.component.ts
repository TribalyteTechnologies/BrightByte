import { Component, Input } from "@angular/core";

@Component({
    selector: "avatar",
    templateUrl: "avatar.component.html",
    styles: ["avatar.component.scss"]
})

export class Avatar {

    private readonly IDENTICON_URL = "http://avatars.dicebear.com/v2/identicon/";
    private readonly IMAGE_FORMAT = ".svg";

    @Input()
    private name: string;

    @Input()
    private isBig: boolean;

    private avatarUrl: string;

    constructor(){
        this.isBig = false;
    }

    public ngOnInit(){
        this.avatarUrl = this.IDENTICON_URL + this.name + this.IMAGE_FORMAT;
    }
}

