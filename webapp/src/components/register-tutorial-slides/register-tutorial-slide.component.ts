import { Component, ViewChild } from "@angular/core";
import { ViewController, Slides } from "ionic-angular";
import { LocalStorageService } from "../../core/local-storage.service";
import { AppConfig } from "../../app.config";

@Component({
  selector: "slide-popover",
  templateUrl: "register-tutorial-slide.component.html",
  styles: ["register-tutorial-slide.component.scss"]
})
export class RegisterSlidePopover {
  @ViewChild(Slides) public slides: Slides;
  public slidesContent: any;
  
  constructor(private viewCtrl: ViewController, private storageSrv: LocalStorageService){

    this.slidesContent = [
      {title: "Step 1", id: 1, picture: "../../assets/imgs/Paso1.png"},
      {title: "Step 2", id: 2, picture: "../../assets/imgs/Paso2.png"},
      {title: "Step 3", id: 3, picture: "../../assets/imgs/Paso3.png"}
    ];
  }

  public ngAfterViewInit() {
    this.slides.lockSwipes(true);
  }

  public hideSlides(){
    this.storageSrv.set(AppConfig.StorageKey.REGISTERTUTORIALVISITED, true);
    this.viewCtrl.dismiss();
  }
  
  public goNext(){
    this.slides.lockSwipes(false);
    this.slides.slideNext();
    this.slides.lockSwipes(true);
  }

  public goPrev(){
    this.slides.lockSwipes(false);
    this.slides.slidePrev();
    this.slides.lockSwipes(true);
  }

}
