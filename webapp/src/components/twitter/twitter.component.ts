import { Component, Input } from "@angular/core";
import { PopupService } from "../../domain/popup.service";

@Component({
    selector: "twitter-share",
    templateUrl: "twitter.component.html"
})

export class TwitterComponent {
    @Input() public url = location.href;
    @Input() public text = "";
    @Input() public hashtag = "";

    constructor(private popupSrv: PopupService) {}

    public shareInBlank(){
        this.popupSrv.openUrlNewTab("http://twitter.com/share?text=" + this.text + "&url=" + this.url + "&hashtags=" + this.hashtag);
    }
}
