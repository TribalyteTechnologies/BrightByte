import { Component, Input } from "@angular/core";
import { PopupService } from "../../domain/popup.service";

@Component({
    selector: "facebook-share",
    templateUrl: "facebook.component.html"
})

export class FacebookComponent {
    @Input() public text = "";
    @Input() public url = location.href;
    
    public readonly SHARE_URL = "https://www.facebook.com/sharer/sharer.php?u=";
    public readonly SRC_TAG = "&src=sdkpreparse";
    public readonly QUOTE_TAG = "&quote=";

    constructor(private popupSrv: PopupService) {}

    public goToShareUrl(){
        this.popupSrv.openUrlNewTab(this.SHARE_URL + this.url + this.SRC_TAG + this.QUOTE_TAG + this.text);
    }
}
