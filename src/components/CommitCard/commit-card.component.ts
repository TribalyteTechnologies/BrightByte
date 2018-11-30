import { Component, Input } from "@angular/core";
import { UserCommit } from "../../models/user-commit.model";


@Component({
    selector: "commit-card",
    templateUrl: " commit-card.component.html ",
    styles: ["commit-card.component.scss"]
 })

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


    @Input()
    public set commit(val: UserCommit){
        let split = val.url.split("/");
        this.urlHash = split[6];
        this.currentNumberReviews = val.currentNumberReviews;
        this.numberReviews = val.numberReviews;
        this.title = val.title;
        this.project = val.project;
        this.score = val.score;
        this.isPending = val.isReadNeeded;
        this.creationDateMs = val.creationDateMs;
        this.urlLink = val.url;
        this.reviews = this.generateArray(val.currentNumberReviews);
        console.log(this.reviews, "IMPRESOO");
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
