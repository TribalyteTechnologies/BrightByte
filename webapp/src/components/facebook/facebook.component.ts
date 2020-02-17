import { Component, Input } from "@angular/core";

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

    public goToShareUrl(){
        let newUrl = this.SHARE_URL + this.url + this.SRC_TAG + this.QUOTE_TAG + this.text;
        window.open(newUrl, "popup", "width=600,height=400");
    }
}
