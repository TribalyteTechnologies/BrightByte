import { ILogger, LoggerService } from "./logger.service";
import { Injectable } from "@angular/core";
import { Achievement } from "../models/achievement.model";

@Injectable()
export class AchievementService {

    private readonly ACHIEVEMENTS = [new Achievement(false, "First commit", 1, "Commit", "../../assets/imgs/trophys/achievement1.svg"),
        new Achievement(false, "Newbie", 10, "Commits", "../../assets/imgs/trophys/achievement2.svg"),
        new Achievement(false, "Beginner", 50, "Commits", "../../assets/imgs/trophys/achievement3.svg"),
        new Achievement(false, "Intermediate", 100, "Commits", "../../assets/imgs/trophys/achievement4.svg"),
        new Achievement(false, "Pro", 250, "Commits", "../../assets/imgs/trophys/achievement5.svg"),
        new Achievement(false, "Master", 1000, "Commits", "../../assets/imgs/trophys/achievement6.svg"),
        new Achievement(false, "First review", 1, "Reviews", "../../assets/imgs/trophys/achievement1.svg"),
        new Achievement(false, "Newbie", 10, "Reviews", "../../assets/imgs/trophys/achievement2.svg"),
        new Achievement(false, "Beginner", 50, "Reviews", "../../assets/imgs/trophys/achievement3.svg"),
        new Achievement(false, "Intermediate", 100, "Reviews", "../../assets/imgs/trophys/achievement4.svg"),
        new Achievement(false, "Pro", 250, "Reviews", "../../assets/imgs/trophys/achievement5.svg"),
        new Achievement(false, "Master", 1000, "Reviews", "../../assets/imgs/trophys/achievement6.svg"),
        new Achievement(false, "First peak", 5, "EIndex", "../../assets/imgs/trophys/achievement1.svg"),
        new Achievement(false, "Newbie", 25, "EIndex", "../../assets/imgs/trophys/achievement2.svg"),
        new Achievement(false, "Beginner", 100, "EIndex", "../../assets/imgs/trophys/achievement3.svg"),
        new Achievement(false, "Intermediate", 250, "EIndex", "../../assets/imgs/trophys/achievement4.svg"),
        new Achievement(false, "Pro", 500, "EIndex", "../../assets/imgs/trophys/achievement5.svg"),
        new Achievement(false, "Master", 1000, "EIndex", "../../assets/imgs/trophys/achievement6.svg")];
    private readonly RANGES = [[1, 10, 50, 100, 250, 1000], [1, 10, 50, 100, 250, 1000], [5, 25, 100, 250, 500, 1000]];
    private readonly INIT_INDEXES = [0, 6, 12];
    private log: ILogger;
            
    constructor(loggerSrv: LoggerService) {

        this.log = loggerSrv.get("AchievementService");
    }

    public getCurrentUnlockedAchievements(numCommits: number, numReviews: number, numEIndex: number): Array<Achievement>{

        let params = [numCommits, numReviews, numEIndex];
        let currentAchievements = new Array<Achievement>();
        
        let stop = false;
        

        for(let w = 0; w < params.length; w++){
            let paramVal = params[w];
            stop = false;
            
            
            for(let i = this.RANGES[w].length; i >= 0; i--){
                if (paramVal >= this.RANGES[w][i] && !stop){
                    for(let z = this.INIT_INDEXES[w]; z <= this.INIT_INDEXES[w] + i; z++){
                        currentAchievements.push(this.ACHIEVEMENTS[z]);
                    }
                    stop = true;
                }
            }
        }

        for(let i = currentAchievements.length; i < this.ACHIEVEMENTS.length; i++){
            currentAchievements.push(new Achievement());
        }

        return currentAchievements;
    }

    public checkForNewAchievementAndReturn(paramVal: number, paramName: string): Achievement{
        let idParam = -1;

        if (paramName === "commits"){
            idParam = 0;
        }else if (paramName === "reviews"){
            idParam = 1;
        }else{
            this.log.e("Wrong param name");
            return null;
        }

        for(let i = this.RANGES[idParam].length; i >= 0; i--){
            if (paramVal === this.RANGES[idParam][i]){
                    return this.ACHIEVEMENTS[this.INIT_INDEXES[idParam] + i];
            }
        }

        return null;
    }

}
