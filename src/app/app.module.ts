import { NgModule, ErrorHandler } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { default as Web3 } from "web3";

// Pages
import { RankingPage } from "../pages/ranking/ranking";
import { CommitPage } from "../pages/commits/commits";
import { HomePage } from "../pages/home/home";
import { ReviewPage } from "../pages/review/review";
import { TabsPage } from "../pages/tabs/tabs";
import { LoginPage } from "../pages/login/login";
import { NewuserPage } from "../pages/newuser/newuser";
import { AddCommitPopover } from "../pages/addcommit/addcommit";
import { SetProfilePage } from "../pages/setprofile/setprofile";
import { CommitReviewPage } from "../pages/commitreview/commitreview"
import { CommitDetailsPage } from "../pages/commitdetails/commitdetails"

// Providers
import { AppConfig } from "../app.config";
import { LoggerService } from "../core/logger.service";
import { Web3Service } from "../core/web3.service";
import { LoginService } from "../core/login.service";
import { ContractManagerService } from "../domain/contract-manager.service";

// Components
import { BrightByteApp } from "./app.component";

export function HttpLoaderFactory(http: HttpClient) {
	return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

@NgModule({
	declarations: [
		BrightByteApp,
		RankingPage,
		CommitPage,
		HomePage,
		ReviewPage,
		TabsPage,
		LoginPage,
		NewuserPage,
		AddCommitPopover,
		SetProfilePage,
		CommitReviewPage,
		CommitDetailsPage
	],
	imports: [
		BrowserModule,
		IonicModule.forRoot(BrightByteApp),
		HttpClientModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [HttpClient]
			}
		})
	],
	bootstrap: [IonicApp],
	entryComponents: [
		BrightByteApp,
		RankingPage,
		CommitPage,
		HomePage,
		ReviewPage,
		TabsPage,
		LoginPage,
		NewuserPage,
		AddCommitPopover,
		SetProfilePage,
		CommitReviewPage,
		CommitDetailsPage
	],
	providers: [
		AppConfig,
		{ provide: ErrorHandler, useClass: IonicErrorHandler },
		{ provide: LoggerService, useFactory: () => new LoggerService(AppConfig.LOG_DEBUG) },
		Web3,
		Web3Service,
		LoginService,
		HttpClientModule,
		ContractManagerService
	]
})

export class AppModule { }
