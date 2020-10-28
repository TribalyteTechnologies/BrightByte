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

    @Input()
    public organization: string;

    public errorWorkspaceMsg: string;

    public errorOrganizationMsg: string;

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

    public addWorkspace() {
        this.http.post(AppConfig.TEAM_API + this.userTeamUid + AppConfig.WORKSPACE_PATH + this.workspace, {}).toPromise()
        .then(() => { 
            this.transalateSrv.get("setProfile.newWorkspaceSuccessMsg")
            .subscribe(translation => {
                this.errorWorkspaceMsg = translation;
            });
        })
        .catch(() => { 
            this.transalateSrv.get("setProfile.workspaceErrorBackendDown")
            .subscribe(translation => {
                this.errorWorkspaceMsg = translation;
            });
        });
    }

    public addOrganization() {
        this.http.post(AppConfig.TEAM_API + this.userTeamUid + AppConfig.ORGANIZATION_PATH + this.organization, {}).toPromise()
        .then(() => { 
            this.transalateSrv.get("setProfile.newOrganizationSuccessMsg")
            .subscribe(translation => {
                this.errorOrganizationMsg = translation;
            });
        })
        .catch(() => { 
            this.transalateSrv.get("setProfile.organizationErrorBackendDown")
            .subscribe(translation => {
                this.errorOrganizationMsg = translation;
            });
        });
    }

    public continue() {
        this.navCtrl.push(TabsPage);
    }
}
