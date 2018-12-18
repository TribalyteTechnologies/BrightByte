import { Injectable } from "@angular/core";
//import { NavController } from "ionic-angular";
//import { LoginPage } from "../pages/login/login";

@Injectable()
export class UserLoggerService {
    constructor(){ 
        console.log("User Logger created");
    }

    public setAccount(user: string, password: string){
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("password", password);
    }

    public retrieveAccount(): any {
        let user = localStorage.getItem("user");
        let password = localStorage.getItem("password");
        return {user: user, password: password};
    }

    public logout(){
        localStorage.clear();
    }
 
}
