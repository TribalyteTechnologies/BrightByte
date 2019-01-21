import { Component } from "@angular/core";
import { NavController, PopoverController } from "ionic-angular";
import { ILogger, LoggerService } from "../../core/logger.service";
import { HttpClient } from "@angular/common/http";
import { AddCommitPopover } from "../../pages/addcommit/addcommit";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { TranslateService } from "@ngx-translate/core";
import { UserCommit } from "../../models/user-commit.model";
import { CommitComment } from "../../models/commit-comment.model";
import { SpinnerService } from "../../core/spinner.service";
import { AppConfig } from "../../app.config";

@Component({
    selector: "page-commits",
    templateUrl: "commits.html"
})

export class CommitPage {

    public readonly ALL = "all";
    public readonly INCOMPLETED = 0;
    public readonly COMPLETED = 1;
    public arrayCommits = new Array<UserCommit>();
    public filterArrayCommits = new Array<UserCommit>();
    public currentCommit: UserCommit;
    public commitComments = new Array<CommitComment>();
    public projects = new Array<string>();
    public projectSelected = this.ALL;
    public openedComments = false;
    public currentCommitName = "";
    public currentCommitEmail = "";
    public filterValue = 2;
    public filterIsPending = false;
    public msg: string;
    private log: ILogger;


    constructor(
        public popoverCtrl: PopoverController,
        public navCtrl: NavController,
        public http: HttpClient,
        public translateService: TranslateService,
        public spinnerService: SpinnerService,
        private contractManagerService: ContractManagerService,
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("CommitsPage");
    }

    public ionViewWillEnter() {
        this.refresh();
    }

    public refresh() {
        this.log.d("Refreshing page");
        this.spinnerService.showLoader();
        let commits: UserCommit[];
        this.contractManagerService.getCommits()
            .then((commitConcat: UserCommit[][]) => {
                this.log.d("User Commits received");
                commits = commitConcat[0].concat(commitConcat[1]);
                let reviewers = commits.map((commit) => {
                    return this.contractManagerService.getReviewersName(commit.url);
                });
                return Promise.all(reviewers);
            }).then((reviewers) => {
                this.log.d("Reviewers from commits recieved");
                commits.forEach((com, idx) => {
                    com.reviewers = reviewers[idx];
                });
                let projects = commits.map( commit => commit.project );
                this.projects = projects.filter((value, index , array) => array.indexOf(value) === index);
                
                this.arrayCommits = commits;
                this.applyFilters(this.arrayCommits);
                this.spinnerService.hideLoader();
            }).then(() => {
                let url = new URLSearchParams(document.location.search);
                if(url.has(AppConfig.UrlKey.COMMITID)){
                    let decodedUrl = decodeURIComponent(url.get(AppConfig.UrlKey.COMMITID));
                    let filteredCommit = this.filterArrayCommits.filter(c =>  c.url === decodedUrl);
                    this.shouldOpen(filteredCommit[0]);
                }
                
            }).catch((e) => {
                this.translateService.get("commits.getCommits").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                        this.spinnerService.hideLoader();
                    });
            });
    }

    public openAddCommitDialog() {
        let popover = this.popoverCtrl.create(AddCommitPopover, { cssClass: "custom-popover" });
        popover.present();
        popover.onDidDismiss(() => {
            this.refresh();
        });
    }

    public setThumbs(url: string, index: number, value: number) {
        this.spinnerService.showLoader();
        this.contractManagerService.setThumbReviewForComment(url, index, value)
            .then(txResponse => {
                if (txResponse) {
                    this.log.d("Contract manager response: ", txResponse);
                    this.commitComments[index].vote = value;
                } else {
                    throw "Error: commitdetails response is undefine";
                }
                this.spinnerService.hideLoader();
            }).catch(e => {
                this.log.e("Can't set the vote", e);
                this.translateService.get("commitDetails.setThumbs").subscribe(
                    msg => {
                        this.msg = msg;
                        this.log.e(msg, e);
                    }
                );
                this.spinnerService.hideLoader();
            });
    }

    
    public applyFilters(usercommits: UserCommit[]) {
        let projectFilter = this.setProjectFilter(usercommits);
        let statusFilter = this.setStatusFilter(projectFilter);
        let pendingFilter = this.setPendingFilter(statusFilter);
        this.filterArrayCommits = pendingFilter.sort((c1, c2) => {
            return (c2.creationDateMs - c1.creationDateMs);
        });
    }

    public setFilter(name: string){
        switch (name) {
            case "incompleted":
                this.filterValue === this.INCOMPLETED ? this.filterValue = 2 : this.filterValue = 0;
                break;
            case "completed":
                this.filterValue === this.COMPLETED ? this.filterValue = 2 : this.filterValue = 1;
                break;
            case "pending":
                this.filterIsPending = !this.filterIsPending;
                break;
            default:
                this.filterValue = 2;
                break;
        }
        this.openedComments = false;  
        this.applyFilters(this.arrayCommits);
    }

    public setProject(name: string){
        this.projectSelected = name;
        this.applyFilters(this.arrayCommits);
    }

    public shouldOpen(commit: UserCommit) {

        this.spinnerService.showLoader();
        this.log.d("Opening commit: " + commit.url);
        this.spinnerService.showLoader();
        this.log.d("Opening commit: " + commit.url);
        this.contractManagerService.getCommentsOfCommit(commit.url)
            .then((comments: CommitComment[][]) => {
                this.log.d("We received " + comments.length + " comments");
                this.commitComments = comments[1];
                this.currentCommit = commit;
                this.openedComments = comments[1].length > 0;
                this.log.d("Changing flag of " + commit.url);
                this.spinnerService.hideLoader();
                return this.getReviewerName(commit);
            }).then((name) => {
                this.currentCommitName =  name[0];
                this.currentCommitEmail = name[1];
                return this.contractManagerService.reviewChangesCommitFlag(commit.url);
            }).then((response) => {
                this.log.d("Received response: " + response);
                let idx = this.filterArrayCommits.indexOf(commit);
                commit.isReadNeeded = false;
                this.filterArrayCommits[idx] = commit;
            }).catch((err) => {
                this.log.e(err);
                this.spinnerService.hideLoader();
            });

        
    }

    

    private getReviewerName(commit: UserCommit): Promise<Array<string>>{
        let hash = commit.author;
        return this.contractManagerService.getUserDetails(hash)
        .then((user) => {
            return [user.name, user.email];
        }).catch((e) => {
            this.log.e(e);
            return ["Anonymous", "nomail@web.com"];
        });
    }

    private setProjectFilter(usercommits: UserCommit[]): UserCommit[]{
        if (this.projectSelected !== this.ALL){
            return usercommits.filter(commit => {
                return (commit.project === this.projectSelected);
            });
        } else {
            return usercommits;
        }
    }
    private setStatusFilter(usercommits: UserCommit[]): UserCommit[]{
        switch(this.filterValue){
            case 0:
                return usercommits.filter(commit => {
                    return (commit.numberReviews !== commit.currentNumberReviews);
                });
            case 1:
                return usercommits.filter(commit => {
                    return (commit.numberReviews === commit.currentNumberReviews);
                });
            default:
                return usercommits;
        }
    }
    private setPendingFilter(usercommits: UserCommit[]): UserCommit[]{
        if(this.filterIsPending){
            return usercommits.filter(commit => {
                return commit.isReadNeeded;
            });
        } else {
            return usercommits;
        }
    }

}
