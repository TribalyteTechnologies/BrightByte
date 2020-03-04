import { Component, ViewChild } from "@angular/core";
import { ViewController, Slides } from "ionic-angular";
import { LocalStorageService } from "../../core/local-storage.service";
import { AppConfig } from "../../app.config";

@Component({
  selector: "after-login-slide-popover",
  templateUrl: "after-login-tutorial-slide.component.html",
  styles: ["after-login-tutorial-slide.component.scss"]
})
export class AfterLoginSlidePopover {
  @ViewChild(Slides) public slides: Slides;
  public readonly slidesContentIds = [1, 2, 3, 4];
  public readonly brightBytePage = AppConfig.BRIGHTBYTE_LANDING_PAGE;
  
  constructor(private viewCtrl: ViewController,
              private storageSrv: LocalStorageService){
  }

  public ngAfterViewInit() {
    this.slides.lockSwipes(true);
  }

  public hideSlides(){
    this.storageSrv.set(AppConfig.StorageKey.AFTERLOGINTUTORIALVISITED, true);
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
