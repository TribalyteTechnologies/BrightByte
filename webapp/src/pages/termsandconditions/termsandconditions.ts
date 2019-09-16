import { Component } from "@angular/core";
import { ViewController } from "ionic-angular";

@Component({
    selector: "popover-termsandconditions",
    templateUrl: "termsandconditions.html"
})
export class TermsAndConditions {

    constructor(private viewCtrl: ViewController){

    }

    public hideTerms(){
        this.viewCtrl.dismiss();
    }
    
}
