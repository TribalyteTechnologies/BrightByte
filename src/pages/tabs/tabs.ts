import { Component } from '@angular/core';

import { CommitPage } from '../commits/commits';
import { ReviewPage } from '../review/review';
import { HomePage } from '../home/home';
import { RankingPage } from '../ranking/ranking';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = HomePage;
  tab2Root = CommitPage;
  tab3Root = ReviewPage;
  tab4Root = RankingPage
  constructor() {

  }
}
