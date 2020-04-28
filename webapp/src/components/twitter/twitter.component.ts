import { Component, Input } from "@angular/core";

@Component({
    selector: "twitter-share",
    templateUrl: "twitter.component.html"
})

export class TwitterComponent {
    @Input() public url = location.href;
    @Input() public text = "";
    @Input() public hashtag = "";

    public shareInBlank(){
        window.open("http://twitter.com/share?text=" + this.text + "&url=" + this.url + "&hashtags=" + this.hashtag, "_blank");
    }
}
