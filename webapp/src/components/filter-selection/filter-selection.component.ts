import { Component, Input, Output, EventEmitter } from "@angular/core";
import { ContractManagerService } from "../../domain/contract-manager.service";

@Component({
    selector: "filter-selection",
    templateUrl: "filter-selection.component.html",
    styles: ["filter-selection.component.scss"]
 })

export class FilterComponent {

    public readonly ALL = "all";
    public readonly INCOMPLETED = "incomplete";
    public readonly COMPLETED = "complete";
    public projectSelected: string = "";
    public filterValue: string;
    public filterIsPending: boolean;

    @Output() 
    public filterEmit = new EventEmitter<string>();

    @Output()
    public projectEmit = new EventEmitter<string>();

    @Input()
    public set projects(val: string[]){
        if (val){
            this._projects = this.sortProjects(val);
        }
    }

    public get projects(){
        return this._projects;
    }

    @Input()
    public set parentFilterValue(val: string){
        this.filterValue = val;
    }

    public get parentFilterValue(){
        return this.filterValue;
    }

    @Input()
    public set parentPendingFilter(val: boolean){
        this.filterIsPending = val;
    }

    public get parentPendingFilter(){
        return this.filterIsPending;
    }

    @Input()
    public isGetProjectsFromBc: boolean;

    private _projects: string[];

    constructor(private contractManager: ContractManagerService){
    }

    public ngOnInit() {
        if (this.isGetProjectsFromBc){
            this.contractManager.getAllProjects()
            .then(projs => { 
                this.projects = this.sortProjects(projs);
            });
        }
    }

    public ngDoCheck(): void {
        this.projects = this._projects; 
    }

    public setIncompleted(){
        this.filterValue = (this.filterValue ===  this.INCOMPLETED) ? "" : this.INCOMPLETED;
        this.filterEmit.emit(this.filterValue);
    }

    public setCompleted(){
        this.filterValue = (this.filterValue === this.COMPLETED) ? "" : this.COMPLETED;
        this.filterEmit.emit(this.filterValue);
    }

    public setPending(){
        this.filterIsPending = this.filterIsPending ? false : true;
        this.filterEmit.emit("pending");
    }

    public setProject(project: string){
        this.projectEmit.emit(project);
    }

    private sortProjects(projects: Array<string>): Array<string> {
        return projects.sort((inA, inB) => {
            const a = inA.toLowerCase();
            const b = inB.toLowerCase();            
            return a > b ? 1 : a < b ? -1 : 0;
        });
    }

}
