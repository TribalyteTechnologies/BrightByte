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

    constructor(
        private navCtrl: NavController,
        private http: HttpClient,
        private transalateSrv: TranslateService,
        contractManager: ContractManagerService
        ){
            contractManager.getUserTeam()
            .then((teamUid: Array<number>) => this.userTeamUid = teamUid[teamUid.length - 1]);
        }

    public goToTabsPage() {
        this.navCtrl.push(TabsPage);
    }

    public addWorkspaceAndContinue() {
        this.http.post(AppConfig.TEAM_API + this.userTeamUid + AppConfig.WORKSPACE_PATH + this.workspace, {}).toPromise()
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
