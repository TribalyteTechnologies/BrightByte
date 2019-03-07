import { NgModule, ErrorHandler } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { IonicApp, IonicModule } from "ionic-angular";
import { HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

// Pages
import { HomePage } from "../pages/home/home";
import { CommitPage } from "../pages/commits/commits";
import { ReviewPage } from "../pages/review/review";
import { TabsPage } from "../pages/tabs/tabs";
import { LoginPage } from "../pages/login/login";
import { RankingPage } from "../pages/ranking/ranking";
import { AddCommitPopover } from "../pages/addcommit/addcommit";


// Providers
/// core
import { AppConfig } from "../app.config";
import { LoggerService } from "../core/logger.service";
import { Web3Service } from "../core/web3.service";
import { AppVersionService } from "../core/app-version.service";
import { LoginService } from "../core/login.service";
import { DateFormatPipe } from "../core/date-format.pipe";
import { SpinnerService } from "../core/spinner.service";
import { StorageService } from "../core/storage.service";
import { SessionStorageService } from "../core/session-storage.service";
import { LocalStorageService } from "../core/local-storage.service";

/// domain
import { ContractManagerService } from "../domain/contract-manager.service";
import { ErrorHandlerService } from "../domain/error-handler.service";
import { UserLoggerService } from "../domain/user-logger.service";
import { BitbucketService } from "../domain/bitbucket.service";


//Modules
import { IonicRatingModule } from "ionic-rating";


// Components
import { BrightByteApp } from "./app.component";
import { CommitCard } from "../components/commit-card/commit-card.component";
import { CommentComponent } from "../components/commit-comment/commit-comment.component";
import { LoginForm } from "../components/login-form/login-form.component";
import { NewUserForm } from "../components/new-user-form/new-user-form.component";
import { SetProfileForm } from "../components/set-profile-form/set-profile-form.component";
import { ReviewCard } from "../components/review-card/review-card.component";
import { ReviewCommentComponent } from "../components/review-comment/review-comment.component";
import { RankingCard } from "../components/ranking-card/ranking-card.component";
import { FilterComponent } from "../components/filter-selection/filter-selection.component";
import { MigrationService } from "../migration/migration.service";
export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

@NgModule({
    declarations: [
        BrightByteApp,
        CommitPage,
        HomePage,
        ReviewPage,
        TabsPage,
        LoginPage,
        RankingPage,
        AddCommitPopover,
        DateFormatPipe,
        CommitCard,
        CommentComponent,
        LoginForm,
        NewUserForm,
        SetProfileForm,
        ReviewCard,
        ReviewCommentComponent,
        FilterComponent,
        RankingCard
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(BrightByteApp),
        HttpClientModule,
        IonicRatingModule,
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
        CommitPage,
        HomePage,
        ReviewPage,
        TabsPage,
        LoginPage,
        RankingPage,
        AddCommitPopover,
        CommitCard,
        CommentComponent,
        LoginForm,
        NewUserForm,
        SetProfileForm,
        ReviewCard,
        ReviewCommentComponent,
        FilterComponent,
        RankingCard
    ],
    providers: [
        AppConfig,
        { provide: LoggerService, useFactory: () => new LoggerService(AppConfig.LOG_DEBUG) },
        Web3Service,
        LoginService,
        HttpClientModule,
        SpinnerService,
        LocalStorageService,
        SessionStorageService,
        {provide: StorageService, useClass: SessionStorageService},
        {provide: StorageService, useClass: LocalStorageService},
        BitbucketService,
        UserLoggerService,
        {provide: ErrorHandler, useClass: ErrorHandlerService},
        ContractManagerService,
        AppVersionService,
        MigrationService
    ]
})

export class AppModule { }
