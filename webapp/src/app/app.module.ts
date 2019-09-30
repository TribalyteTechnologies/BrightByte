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
import { AchievementPopOver } from "../pages/achievementpopover/achievementpopover";


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
import { AchievementService } from "../core/achievement.service";
import { UpdateCheckService } from "../core/update-check.service";
import { SocketIoModule } from "ng-socket-io";


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
import { LoginForm } from "../components/login-form/login-form.component";
import { NewUserForm } from "../components/new-user-form/new-user-form.component";
import { SetProfileForm } from "../components/set-profile-form/set-profile-form.component";
import { CommentComponent } from "../components/comment/comment.component";
import { AchievementComponent } from "../components/achievement/achievement.component";
import { RankingCard } from "../components/ranking-card/ranking-card.component";
import { CustomRating } from "../components/custom-rating/custom-rating.component";
import { FilterComponent } from "../components/filter-selection/filter-selection.component";
import { MigrationService } from "../migration/migration.service";
import { BackendAPIService } from "../domain/backend-api.service";
import { WebSocketService } from "../core/websocket.service";
import { UserAddressService } from "../domain/user-address.service";
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
        AchievementPopOver,
        DateFormatPipe,
        CommitCard,
        CommentComponent,
        AchievementComponent,
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
        SocketIoModule.forRoot(AppConfig.SERVER_NETWORK_CONFIG),
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
        AchievementPopOver,
        CommitCard,
        CommentComponent,
        AchievementComponent,
        LoginForm,
        NewUserForm,
        SetProfileForm,
        FilterComponent,
        CustomRating,
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
        BackendAPIService,
        WebSocketService,
        BitbucketService,
        AchievementService,
        UserLoggerService,
        UserCacheService,
        UserAddressService,
        ErrorHandlerService,
        {provide: ErrorHandler, useClass: ErrorHandlerService},
        ContractManagerService,
        AppVersionService,
        MigrationService,
        UpdateCheckService
    ]
})

export class AppModule { }
