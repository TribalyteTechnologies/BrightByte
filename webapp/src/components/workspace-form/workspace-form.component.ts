import { Component, Input } from "@angular/core";
import { NavController } from "ionic-angular";
import { TabsPage } from "../../pages/tabs/tabs";
import { ContractManagerService } from "../../domain/contract-manager.service";
import { HttpClient } from "@angular/common/http";
import { AppConfig } from "../../app.config";

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
    public isWorkspaceAdded: boolean;
    public errorOrganizationMsg: string;
    public isOrganizationAdded: boolean;

    private userTeamUid: number;
    private currentVersion: number;

    constructor(
        private navCtrl: NavController,
        private http: HttpClient,
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

    public addWorkspace() {
        this.isWorkspaceAdded = false;
        const url = AppConfig.TEAM_API + this.userTeamUid + "/" + this.currentVersion + AppConfig.WORKSPACE_PATH + this.workspace;
        this.http.post(url, {}).toPromise()
        .then(() => { 
            this.isWorkspaceAdded = true;
        })
        .catch(() => { 
            this.errorWorkspaceMsg = "setProfile.workspaceErrorBackendDown";
        });
    }

    public addOrganization() {
        this.isOrganizationAdded = false;
        const url = AppConfig.TEAM_API + this.userTeamUid + "/" + this.currentVersion + AppConfig.ORGANIZATION_PATH + this.organization;
        this.http.post(url, {}).toPromise()
        .then(() => { 
            this.isOrganizationAdded = true;
        })
        .catch(() => { 
            this.errorOrganizationMsg = "setProfile.organizationErrorBackendDown";
        });
    }

    public continue() {
        this.navCtrl.push(TabsPage);
    }
}
