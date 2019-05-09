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
import { TermsAndConditions } from "../pages/termsandconditions/termsandconditions";

// Providers
/// core
import { AppConfig } from "../app.config";
import { LoggerService } from "../core/logger.service";
import { Web3Service } from "../core/web3.service";
import { AppVersionService } from "../core/app-version.service";
import { LoginService } from "../core/login.service";
import { DateFormatPipe } from "../core/date-format.pipe";
import { SpinnerService } from "../core/spinner.service";
import { SessionStorageService } from "../core/session-storage.service";
import { LocalStorageService } from "../core/local-storage.service";

/// domain
import { ContractManagerService } from "../domain/contract-manager.service";
import { ErrorHandlerService } from "../domain/error-handler.service";
import { UserLoggerService } from "../domain/user-logger.service";
import { BitbucketService } from "../domain/bitbucket.service";
import { UserCacheService } from "../domain/user-cache.service";


//Modules

// Components
import { BrightByteApp } from "./app.component";
import { CommitCard } from "../components/commit-card/commit-card.component";
import { CommentComponent } from "../components/commit-comment/comment.component";
import { LoginForm } from "../components/login-form/login-form.component";
import { NewUserForm } from "../components/new-user-form/new-user-form.component";
import { SetProfileForm } from "../components/set-profile-form/set-profile-form.component";
import { RankingCard } from "../components/ranking-card/ranking-card.component";
import { CustomRating } from "../components/custom-rating/custom-rating.component";
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
        TermsAndConditions,
        DateFormatPipe,
        CommitCard,
        CommentComponent,
        LoginForm,
        NewUserForm,
        SetProfileForm,
        FilterComponent,
        CustomRating,
        RankingCard
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
        CommitPage,
        HomePage,
        ReviewPage,
        TabsPage,
        LoginPage,
        RankingPage,
        AddCommitPopover,
        TermsAndConditions,
        CommitCard,
        CommentComponent,
        LoginForm,
        NewUserForm,
        SetProfileForm,
        RankingCard,
        CustomRating
    ],
    providers: [
        AppConfig,
        { provide: LoggerService, useFactory: () => new LoggerService(AppConfig.LOG_DEBUG) },
        Web3Service,
        LoginService,
        HttpClientModule,
        SpinnerService,
        SessionStorageService,
        LocalStorageService,
        BitbucketService,
        UserLoggerService,
        UserCacheService,
        {provide: ErrorHandler, useClass: ErrorHandlerService},
        ContractManagerService,
        AppVersionService,
        MigrationService
    ]
})

export class AppModule { }
