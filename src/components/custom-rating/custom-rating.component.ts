import { Component, Input } from "@angular/core";


@Component({
    selector: "custom-rating",
    templateUrl: "custom-rating.component.html",
    styles: ["custom-rating.component.scss"]
 })

export class CustomRating {

    @Input()
    public max: number = 5;

    @Input()
    public rate: number = 3;

    @Input()
    public readOnly: boolean = false;

    @Input()
    public small: boolean = false;

    @Input()
    public padding: boolean = false;

    public starIds: number[];
    public stars: string[];

    public ngOnInit(){
        this.starIds = new Array<number>(this.max);
        this.stars = new Array<string>(this.max);
        for(let i = 0; i < this.max; i++){
            this.starIds[i] = i;
            this.stars[i] = "star-outline";
        }
        this.setReputation(this.rate - 1);
    }

    public setReputation(value: number) {
        for(let i = 0; i < this.max; i++){
            this.stars[i] = "star-outline";
        }
        for (let i = 0; i <= value; ++i) {
            this.stars[i] = "star";
        }
    }
   
}
