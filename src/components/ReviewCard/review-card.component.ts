import { Component, Input } from "@angular/core";
import { UserCommit } from "../../models/user-commit.model";
import { UserDetails } from "../../models/user-details.model";


@Component({
    selector: "review-card",
    templateUrl: "review-card.component.html",
    styles: ["review-card.component.scss"]
 })
export class ReviewCard {

    public urlHash: string = "0000";
    public urlLink = "http";
    public numberReviews = 0;
    public currentNumberReviews = 0;
    public title = "No title";
    public project = "No project";
    public score = 0;
    public isReadNeeded = false;
    public creationDateMs = 0;
    public stateFinished = false;
    public reviews = [];
    public reviewers: UserDetails[][] = [];


    @Input()
    public set commit(val: UserCommit){
        let split = val.url.split("/");
        this.urlHash = split[6];
        this.currentNumberReviews = val.reviewers[1].length;
        this.numberReviews = val.reviewers[0].length;
        this.reviewers = val.reviewers;
        this.title = val.title;
        this.project = val.project;
        this.score = val.score;
        this.isReadNeeded = val.isReadNeeded;
        this.creationDateMs = val.creationDateMs;
        this.urlLink = val.url;
        this.reviews = this.generateArray(val.currentNumberReviews);
        this.stateFinished = val.currentNumberReviews !== val.numberReviews ? true : false;
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
