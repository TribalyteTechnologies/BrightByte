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

}
