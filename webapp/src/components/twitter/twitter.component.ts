import { Component, Input, OnChanges } from "@angular/core";

@Component({
    selector: "twitter-share",
    templateUrl: "twitter.component.html"
})

export class TwitterComponent implements OnChanges{
    @Input() public url = location.href;
    @Input() public text = "";
    @Input() public hashtag = "";

    constructor() {
        const auxUrl = "https://platform.twitter.com/widgets.js";
        if (!document.querySelector(`script[src='${auxUrl}']`)) {
            let script = document.createElement("script");
            script.src = auxUrl;
            document.body.appendChild(script);
        }
    }

    public ngOnChanges(): void {
        if(window["twttr"]) {
            window["twttr"].widgets.load();
        }
    }
}
