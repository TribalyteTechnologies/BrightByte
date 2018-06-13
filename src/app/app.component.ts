import { Component } from "@angular/core";
import { Platform } from "ionic-angular";

import { LoginPage } from "../pages/login/login";

@Component({
  templateUrl: "app.html"
})
export class MyApp {

    public rootPage = LoginPage; //TabsPage;

    constructor(platform: Platform) {
        platform.ready().then(() => {
          
        });
    }

}
