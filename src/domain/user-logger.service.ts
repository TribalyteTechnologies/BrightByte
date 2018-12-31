import { Injectable } from "@angular/core";

const USERNAME: string = "user";
const PASSWORD: string = "password";

@Injectable()
export class UserLoggerService {

    constructor(){ 
        console.log("User Logger created");
    }

    public setAccount(user: string, password: string){
        localStorage.setItem(USERNAME, JSON.stringify(user));
        localStorage.setItem(PASSWORD, password);
    }

    public retrieveAccount(): any {
        let user = JSON.parse(localStorage.getItem(USERNAME));
        let pass = localStorage.getItem(PASSWORD);
        return {user: user, password: pass};
    }

    public logout(){
        localStorage.removeItem(USERNAME);
        localStorage.removeItem(PASSWORD);
    }
 
}
