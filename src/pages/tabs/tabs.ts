import { Component } from '@angular/core';

import { CommitPage } from '../commits/commits';
import { ReviewPage } from '../review/review';
import { HomePage } from '../home/home';
import { RankingPage } from '../ranking/ranking';
import { NavParams } from 'ionic-angular';
import {ILogger, LoggerService} from "../../core/logger.service";

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = CommitPage;
  tab3Root = ReviewPage;
  tab4Root = RankingPage;
  //account: any;
  private log: ILogger;

  constructor(private navParams: NavParams, private loggerSrv: LoggerService) {
    //this.account = navParams.get('account');
    this.log = this.loggerSrv.get("TabsPage");
    //this.log.d(this.account);

  }
}
