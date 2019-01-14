import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "filter-selection",
    templateUrl: "filter-selection.component.html",
    styles: ["filter-selection.component.scss"]
 })

export class FilterComponent {

    public readonly ALL = "all";
    public readonly INCOMPLETED = "incompleted";
    public readonly COMPLETED = "completed";
    public projectSelected: string = "";
    public filterValue: string;
    public filterIsPending: boolean;

    @Output() 
    public filterEmit = new EventEmitter<string>();

    @Output()
    public projectEmit = new EventEmitter<string>();

    private _projects: string[];

    @Input()
    public set projects(val: string[]){
        this._projects = val;
    }

    public get projects(){
        return this._projects;
    }

    public ngDoCheck(): void {
        this.projects = this._projects; 
    }

    
    public setIncompleted(){
        this.filterValue = (this.filterValue ===  "incompleted") ? "" : "incompleted";
        this.filterEmit.emit(this.filterValue);
    }

    public setCompleted(){
        this.filterValue = (this.filterValue === "completed") ? "" : "completed";
        this.filterEmit.emit(this.filterValue);
    }

    public setPending(){
        this.filterIsPending = this.filterIsPending ? false : true;
        this.filterEmit.emit("pending");
    }

    public setProject(project: string){
        this.projectEmit.emit(project);
    }

}
