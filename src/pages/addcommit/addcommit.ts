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
import { LocalStorageService } from "../../core/local-storage.service";
import { BitbucketService } from "../../domain/bitbucket.service";

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
    public userAdded = new Array<string>();

    public bitbucketForm: FormGroup;
    public bitbucketUser = {};
    public bitbucketProjects: Array<string> = [];
    public commitList = [];
    public formUrl = "";
    public formTitle = "";
    public currentProject = "";
    public commitMethod = "url";
    public selectedCommit: any;

    private allEmails = new Array<string>();
    private searchInput = "";
    private readonly MAX_REVIEWERS = AppConfig.MAX_REVIEWER_COUNT;
    private userDetailsProm: Promise<UserDetails>;
    private log: ILogger;

    constructor(
        public navCtrl: NavController,
        public viewCtrl: ViewController,
        public http: HttpClient,
        public fb: FormBuilder,
        public translateService: TranslateService,
        private loggerSrv: LoggerService,
        private contractManagerService: ContractManagerService,
        private storageSrv: LocalStorageService,
        private loginService: LoginService,
        private bitbucketSrv: BitbucketService
    ) {
        this.log = this.loggerSrv.get("AddCommitPage");
        this.myForm = this.fb.group({
            url: ["", [Validators.required,
            Validators.pattern(
                /(^https\:\/\/(.+)\/(.+)\/)(.+(pull-requests|pull-request|commits|commit|pull)\/.+)/)
            ]],
            title: ["", [Validators.required]]
        });


        this.bitbucketForm = this.fb.group({
            username: ["", [Validators.required]],
            password: ["", [Validators.required]]
        });
        this.userDetailsProm = this.contractManagerService.getUserDetails(this.loginService.getAccount().address);
        this.contractManagerService.getAllUserReputation()
        .then(allReputations => {
            this.log.d("All user reputations: ", allReputations);
            this.allEmails = allReputations.map(userRep => userRep.email);
            this.setUpList(this.searchInput);
            let mailString = this.storageSrv.get(AppConfig.StorageKey.USERMAILS);
            if (mailString){
                let mailArray = mailString.split(";");
                mailArray.forEach(mail => {
                    this.log.d("Setting email from local Storage: " + mail);
                    this.setEmailFromList(mail);
                });
            }
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
            let mailArray = this.userAdded.join(";");
            this.storageSrv.set(AppConfig.StorageKey.USERMAILS, mailArray);
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

    public loginBitbucket(username: string, password: string){
        this.bitbucketSrv.loginUser(username, password).then(() => {
            return this.bitbucketSrv.getUsername();
        }).then((usr) => {
            this.bitbucketUser = usr;
            return this.bitbucketSrv.getRepositories();
        }).then((repos) => {
            this.bitbucketProjects = repos.map((repo) => {
                return repo["name"];
            });
        });
    }

    public getProjectCommits(project: string){
        this.currentProject = project;
        this.bitbucketSrv.getReposlug(project).then((val) => {
            let commits: Array<any> = val["values"];
            let filteredList = commits.filter((com) => {
                let author: any = com["author"]["user"]["nickname"];
                return author === this.bitbucketUser["username"]; 
            });
            filteredList.forEach((com, idx) => {
                let titulo = com["message"].split("\n");
                let object = {
                    "title": titulo[0],
                    "hash": com["hash"]
                };
                this.commitList.push(object);
            });
        });
    }

    public setFromBitbucket(commit: any){
        this.selectedCommit = commit;
        this.formTitle = commit["title"];
        this.formUrl = "https://bitbucket.org/tribalyte/" + this.currentProject + "/commits/" + commit["hash"];
    }

    public setUploadMethod(method: string){
        this.commitMethod = method;
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
