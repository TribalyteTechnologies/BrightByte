import { Component } from "@angular/core";
import { Platform } from "ionic-angular";
import { StatusBar } from "@ionic-native/status-bar";
import { SplashScreen } from "@ionic-native/splash-screen";

import { LoginPage } from "../pages/login/login";

@Component({
  templateUrl: "app.html"
})
export class MyApp {

    public rootPage = LoginPage; //TabsPage;

    constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen) {
        platform.ready().then(() => {
          statusBar.styleDefault();
        });
    }

}
