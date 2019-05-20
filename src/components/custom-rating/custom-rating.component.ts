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
    public set rate(rate: number) {
        this._rate = rate;
    }

    @Input()
    public setStars: boolean = false;

    @Input()
    public small: boolean = false;

    @Input()
    public iconMargin: boolean = false;

    @Input()
    public ratingType = "quality";

    
    public iconColor = "stars-color";
    public _rate: number;
    public iconIds: number[];
    public icons: string[];
    public ghosted: boolean;

    private readonly CONFIDENCE_ICONS = ["bb-boy", "bb-graduation", "bb-crown"];
    private readonly DIFFYCULTY_ICONS = ["bb-gears-1", "bb-gears-2", "bb-gears-3"];
    private readonly QUALITY = "quality";
    private readonly DIFFICULTY = "difficulty";
    private readonly CONFIDENCE = "confidence";
    private readonly GEARS_COLOR = "gears-color ";
    private readonly CONFIDENCE_COLOR = "confidence-color ";
    private readonly STAR = "bb-star";
    private readonly STAR_OUTLINE = "bb-star-outline";
    private currentIcons = [""];

    public ngDoCheck() {
        this.rate = this._rate;
        this.setReputation(this._rate);
    }

    public ngOnInit(){
        this.iconIds = new Array<number>(this.max);
        this.icons = new Array<string>(this.max);
        
        switch (this.ratingType) {
            case this.QUALITY:
                for(let i = 0; i < this.max; i++){
                    this.iconIds[i] = i;
                    this.icons[i] = this.STAR_OUTLINE;
                }
                break;
            case this.DIFFICULTY:
                this.iconColor = this.GEARS_COLOR;
                this.currentIcons = this.DIFFYCULTY_ICONS;
                break;
            case this.CONFIDENCE:
                this.iconColor = this.CONFIDENCE_COLOR;
                this.currentIcons = this.CONFIDENCE_ICONS;
                break;
            default:
                break;
        }

        for(let i = 0; i < this.max; i++){
            this.iconIds[i] = i;
            this.icons[i] = this.currentIcons[i];
        }
        
        this.setReputation(this._rate - 1);
    }

    public setReputation(value: number) {

        if (this.ratingType === this.QUALITY){
            for(let i = 0; i < this.max; i++){
                this.icons[i] = i <= value ? this.STAR : this.STAR_OUTLINE;
            }
        }else{
            for(let i = 0; i < this.max; i++){
                this.icons[i] = i === value ? this.currentIcons[i] : this.currentIcons[i] + " ghosted";
            }
        }
   
        this._rate = value;
        this.value.next((this._rate + 1) * 100);
    }
   
}
