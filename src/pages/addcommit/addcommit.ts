import { Component } from "@angular/core";
import { NavController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { LoginService } from "../../core/login.service";
import { ViewController } from "ionic-angular";
import { HttpClient } from "@angular/common/http";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { AppConfig } from "../../app.config";
import { UserDetails } from "../../models/user-details.model";

@Component({
    selector: "popover-addcommit",
    templateUrl: "addcommit.html"
})
export class AddCommitPopover {
    
    public isTxOngoing = false;
    public msg: string;
    public usersMail = new Array<string>();
    public isShowList = new Array<boolean>();
    public mockInputElementList = new Array<any>();
    public arraySearch: string[];
    public myForm: FormGroup;
    public searchInput = "";
    public userAdded = new Array<string>();
    public allEmails = new Array<string>();

    private readonly MAX_REVIEWERS = AppConfig.MAX_REVIEWER_COUNT;
    private userDetailsProm: Promise<UserDetails>;
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        public viewCtrl: ViewController,
        public http: HttpClient,
        public fb: FormBuilder,
        public translateService: TranslateService,
        loggerSrv: LoggerService,
        private contractManagerService: ContractManagerService,
        public loginService: LoginService
    ) {
        this.log = loggerSrv.get("AddCommitPage");
        this.myForm = this.fb.group({
            url: ["", [Validators.required,
            Validators.pattern(/^(https)(:)\/\/(bitbucket)\.(org)\/[a-z0-9]+\/[a-z0-9]+\/(commits)\/[a-z0-9]+$/)]],
            title: ["", [Validators.required]]
        });
        this.userDetailsProm = this.contractManagerService.getUserDetails(this.loginService.getAccount().address);
        this.contractManagerService.getAllUserReputation()
        .then(allReputations => {
            this.log.d("All user reputations: ", allReputations);
            this.allEmails = allReputations.map(userRep => userRep.email);
            this.setUpList(this.searchInput);
        }).catch((e) => {
            this.showGuiMessage("addCommit.errorEmails", e);
        });
        
       
    }
    
    public addCommit(url: string, title: string) {
        this.isTxOngoing = true;
        this.clearGuiMessage();
        let errMsgId = null;
        this.userDetailsProm.then(userDetails => {
            for (let userEmail of this.userAdded) {
                if (this.userAdded.indexOf(userEmail) < 0) {
                    errMsgId = "addCommit.unknownEmail";
                }
                if (this.userAdded.reduce((prevCount, mail) => (mail === userEmail ? prevCount + 1 : prevCount), 0) > 1){
                    errMsgId = "addCommit.emailDuplicated";
                }
                if (userEmail === userDetails.email){
                    errMsgId = "addCommit.ownEmail";
                }
            }
            if (this.userAdded.every(userEmail => !userEmail)) {
                errMsgId = "addCommit.emptyInput";
            }
            let ret;
            if (!errMsgId){
                ret = this.contractManagerService.getDetailsCommits(url);
            } else {
                ret = Promise.reject({msg: errMsgId});
            }
            return ret;
        }).catch(e => {
            return Promise.reject((e.msg ? {msg: e.msg, err: e.err} : {msg: "addCommit.commitDetails", err: e}));
        })
        .then(detailsCommits => {
            let ret;
            if (!detailsCommits || !detailsCommits.url) {
                ret = this.contractManagerService.addCommit(url, title, this.userAdded)
                .catch(err => Promise.reject({msg: "addCommit.addingCommit", err: err}));
            } else {
                ret = Promise.reject({msg: "addCommit.urlDuplicated"});
            }
            return ret;
        }).then(txResponse => {
            this.log.d("Contract manager response: ", txResponse);
            if (txResponse) {
                this.isTxOngoing = false;
                this.viewCtrl.dismiss();
            } else {
                throw "Error: addcommit response is undefined";
            }
        }).catch(e => {
            this.showGuiMessage(e.msg, e.err);
            this.isTxOngoing = false;
        });
    }

    public setUpList(word: string){

        let array;
        array = this.allEmails.filter((item) => {
            if(word){
                return (item.toLowerCase().indexOf(word.trim().toLowerCase()) > -1);
            } else {
                return item;
            }
        });
        this.userDetailsProm.then((userDetails: UserDetails) => {
            array.find((value, index) => {
                if (value === userDetails.email) {
                    array.splice(index, 1);
                }
            });
        });
        for(let email of this.userAdded){
            array.find((value, index) => {
                if (value === email ){
                    array.splice(index, 1);
                }
            });
        }            
        this.arraySearch = array;
    }


    public refreshSearchbar(ev: any) { 
        let val = ev.target.value;
        this.searchInput = val;
        this.setUpList(val);
    }
    
    public setEmailFromList(item: string) {
        let isDuplicated = false;

        if (this.userAdded.length < this.MAX_REVIEWERS){
            this.userDetailsProm.then((userDetails: UserDetails) => {
                if (item === userDetails.email) {
                    this.showGuiMessage("addCommit.ownEmail");
                    isDuplicated = true;
                }
                isDuplicated = isDuplicated || (this.usersMail.indexOf(item) >= 0);
                if(isDuplicated){
                    this.showGuiMessage("addCommit.emailDuplicated");
                }else{
                    this.userAdded.push(item);
                    this.arraySearch.splice(this.arraySearch.indexOf(item), 1 );
                }
    
            });
        }

        
    }

    public removeUser(idx: number){
        this.userAdded.splice(idx, 1);
        this.setUpList(this.searchInput);
    }
    
    
    private showGuiMessage(txtId, e?: any){
        this.translateService.get(txtId)
        .subscribe(msg => {
            this.msg = msg;
            if(e){
                this.log.e(msg, e);
            }
        });
    }
    
    private clearGuiMessage(){
        this.msg = "";
    }
}
