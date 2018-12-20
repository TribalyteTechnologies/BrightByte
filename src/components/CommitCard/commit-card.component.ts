import { Component, Input, Injectable } from "@angular/core";
import { UserCommit } from "../../models/user-commit.model";
import { UserDetails } from "../../models/user-details.model";


@Component({
    selector: "commit-card",
    templateUrl: "commit-card.component.html",
    styles: ["commit-card.component.scss"]
 })
 
@Injectable()
export class CommitCard {


    public urlHash: string = "0000";
    public urlLink = "http";
    public numberReviews = 0;
    public currentNumberReviews = 0;
    public title = "No title";
    public project = "No project";
    public score = 0;
    public isPending = false;
    public creationDateMs = 0;
    public stateFinished = false;
    public reviews = [];
    public reviewers: UserDetails[][] = [];

    private val: UserCommit;

    @Input()
    set commit(input: UserCommit){
        this.val = input;
        let split = this.val.url.split("/");
        this.urlHash = split[6];
        this.currentNumberReviews = this.val.reviewers[1].length;
        this.numberReviews = this.val.reviewers[0].length;
        this.reviewers = this.val.reviewers;
        this.title = this.val.title;
        this.project = this.val.project;
        this.score = this.val.score;
        this.isPending = this.val.isReadNeeded;
        this.creationDateMs = this.val.creationDateMs;
        this.urlLink = this.val.url;
        this.reviews = this.generateArray(this.val.currentNumberReviews);
        console.log(this.reviews, "IMPRESOO");
        this.stateFinished = this.val.currentNumberReviews !== this.val.numberReviews ? true : false;
    }
    get commit(){
        return this.val;
    }

    

    public openUrl(url: string){
        window.open(url, "_blank");
    }

    private generateArray(currentNumberReviews: number): Array<number>{
        let array = [];
        for (let i = 0; i < currentNumberReviews; i++){
            array.push(i);
        }
        return array;
    }
}
