import { Injectable } from "@nestjs/common";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementDto } from "../dto/achievement.dto";
import { BackendConfig } from "../backend.config";

@Injectable()
export class AchievementDatabaseService {

    private readonly ACHIEVEMENTS: Array<AchievementDto> = [
        new AchievementDto(
            "First Commit",
            "First",
            "Commits",
            [1],
            "1",
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Newbie",
            "Newbie",
            "Commits",
            [10],
            "2" ,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Beginner",
            "Beginner",
            "Commits",
            [50],
            "3" ,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Intermediate",
            "Intermediate",
            "Commits",
            [100],
            "4" ,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Pro",
            "Pro",
            "Commits",
            [250],
            "5" ,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Master",
            "Master",
            "Commits",
            [1000],
            "6" ,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "First Review",
            "First",
            "Reviews",
            [1],
            "1" ,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Newbie",
            "Newbie",
            "Reviews",
            [10],
            "2" ,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Beginner",
            "Beginner",
            "Reviews",
            [50],
            "3" ,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Intermediate",
            "Intermediate",
            "Reviews",
            [100],
            "4" ,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Pro",
            "Pro",
            "Reviews",
            [250],
            "5" ,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Master",
            "Master",
            "Reviews",
            [1000],
            "6" ,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Timed Review Fast",
            "Fast & Furious",
            "Reviews",
            [2, 300],
            "1" ,
            BackendConfig.AchievementTypeEnum.TimedReview
        ),
        new AchievementDto(
            "Timed Review Rapid",
            "Rapid Fire",
            "Reviews",
            [6, 300],
            "2" ,
            BackendConfig.AchievementTypeEnum.TimedReview
        ),
        new AchievementDto(
            "Timed Review Bullets",
            "Few time, many bullets",
            "Reviews",
            [20, 900],
            "3" ,
            BackendConfig.AchievementTypeEnum.TimedReview
        ),
        new AchievementDto(
            "Timed Review Hero",
            "Non-stop hero",
            "Reviews",
            [10, 604800],
            "4" ,
            BackendConfig.AchievementTypeEnum.TimedReview
        )
    ];

    private log: ILogger;
    private initObs: Observable<Map<string, AchievementDto>>;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("AchievementDatabaseService");
        this.initObs = this.init();
    }

    public getAchievements(achievementIdentifiers: Array<string>): Observable<Array<AchievementDto>> {
        return this.initObs.pipe(
            map((mapAchievements: Map<string, AchievementDto>) => {
                let achievements = achievementIdentifiers.map(id => mapAchievements.get(id));
                return achievements;
            })
        );
    }

    public getAchievementMap(): Observable<Map<string, AchievementDto>> {
        return this.initObs;
    }

    private init(): Observable<Map<string, AchievementDto>>{
        let mapAchievements = new Map<string, AchievementDto>();
        this.ACHIEVEMENTS.forEach(achievement => {
            mapAchievements.set(achievement.id, achievement);
        });
        return of(mapAchievements);
    }
}
