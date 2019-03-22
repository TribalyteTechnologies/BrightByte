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
    public setstars: boolean = false;

    @Input()
    public small: boolean = false;

    @Input()
    public starPadding: boolean = false;

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
            this.stars[i] = i <= value ? "star" : "star-outline";
        }
        
        this.rate = value;
        this.value.next((this.rate + 1) * 100);
    }
   
}
