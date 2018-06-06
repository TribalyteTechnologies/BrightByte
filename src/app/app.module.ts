import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { RankingPage } from '../pages/ranking/ranking';
import { CommitPage } from '../pages/commits/commits';
import { HomePage } from '../pages/home/home';
import { ReviewPage } from '../pages/review/review';
import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage } from '../pages/login/login';
import { NewuserPage } from '../pages/newuser/newuser'
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LoggerService } from "../core/logger.service";
import { AppConfig } from "../app.constants";
import { Web3Service } from "../core/web3.service";
import { LoginService } from "../core/login.service";

import { default as Web3 } from 'web3';
import Tx from 'ethereumjs-tx';
import { default as contract } from 'truffle-contract';
//import { Bright_artifacts } from '../../build/contracts/Bright.json'
//import {HttpClientModule} from '@angular/common/http';//import
//import {Http, Response} from "@angular/http";
import {HttpClientModule} from '@angular/common/http';
@NgModule({
  declarations: [
    MyApp,
    RankingPage,
    CommitPage,
    HomePage,
    ReviewPage,
    TabsPage,
    LoginPage,
    NewuserPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    HttpClientModule
    
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    RankingPage,
    CommitPage,
    HomePage,
    ReviewPage,
    TabsPage,
    LoginPage,
    NewuserPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    AppConfig,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {provide: LoggerService,useFactory: () => new LoggerService(AppConfig.LOG_DEBUG)},
    Web3,
    Web3Service,
    LoginService,
    //Http,
    HttpClientModule
    //Tx
    //contract
  ]
})
export class AppModule {}
