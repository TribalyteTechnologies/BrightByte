import { Component, Input } from "@angular/core";
import { NavController } from "ionic-angular";
import { TabsPage } from "../../pages/tabs/tabs";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../../app.config";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "workspace-form",
    templateUrl: "workspace-form.component.html",
    styles: ["workspace-form.component.scss"]
})

export class WorkspaceForm {
    @Input()
    public workspace: string;

    public errorMsg: string;

    private userTeamUid: number;
    private currentVersion: number;

    constructor(
        private navCtrl: NavController,
        private http: HttpClient,
        private transalateSrv: TranslateService,
        contractManager: ContractManagerService
        ){
            contractManager.getUserTeam()
            .then((teamUid: Array<number>) => {
                this.userTeamUid = teamUid[teamUid.length - 1];
                return contractManager.getCurrentVersion();
            }).then((res: number) => this.currentVersion = res);
        }

    public goToTabsPage() {
        this.navCtrl.push(TabsPage);
    }

    public addWorkspaceAndContinue() {
        const url = AppConfig.TEAM_API + this.userTeamUid + "/" + this.currentVersion + AppConfig.WORKSPACE_PATH + this.workspace;
        this.http.post(url, {}).toPromise()
        .then(() => { 
            this.navCtrl.push(TabsPage);
        })
        .catch(() => { 
            this.transalateSrv.get("setProfile.workspaceErrorBackendDown")
            .subscribe(translation => {
                this.errorMsg = translation;
            });
        });
    }
}
