import { Component, Input, Output, EventEmitter } from "@angular/core";


@Component({
    selector: "custom-rating",
    templateUrl: "custom-rating.component.html",
    styles: ["custom-rating.component.scss"]
 })

export class CustomRating {

    @Output()
    public value = new EventEmitter<number>();

    @Input()
    public max: number = 5;

    @Input()
    public rate: number = 3;

    @Input()
    public setStars: boolean = false;

    @Input()
    public small: boolean = false;

    @Input()
    public iconPadding: boolean = false;

    @Input()
    public ratingType = "codeQuality";

    public iconColor = "stars-color";

    public iconIds: number[];
    public icons: string[];
    public ghosted: boolean;

    private difficultyIcons = ["bb-boy", "bb-graduation", "bb-crown"];
    private confidenceIcons = ["bb-gears-1", "bb-gears-2", "bb-gears-3"];
    private currentIcons = [""];

    public ngOnInit(){
        this.iconIds = new Array<number>(this.max);
        this.icons = new Array<string>(this.max);
        
        switch (this.ratingType) {
            case "codeQuality":
                for(let i = 0; i < this.max; i++){
                    this.iconIds[i] = i;
                    this.icons[i] = "star-outline";
                }
                break;
            case "difficulty":
                this.iconColor = "gears-color";
                this.currentIcons = this.difficultyIcons;
                break;
            case "reviewerExperience":
                this.iconColor = "confidence-color";
                this.currentIcons = this.confidenceIcons;
                break;
            default:
                break;
        }

        for(let i = 0; i < this.max; i++){
            this.iconIds[i] = i;
            this.icons[i] = this.currentIcons[i];
        }
        
        this.setReputation(this.rate - 1);
    }

    public setReputation(value: number) {

        if (this.ratingType === "codeQuality"){
            for(let i = 0; i < this.max; i++){
                this.icons[i] = i <= value ? "star" : "star-outline";
            }
        }else{
            for(let i = 0; i < this.max; i++){
                this.icons[i] = i === value ? this.currentIcons[i] : this.currentIcons[i] + "-ghosted";
            }
        }
   
        this.rate = value;
        this.value.next((this.rate + 1) * 100);
    }
   
}
