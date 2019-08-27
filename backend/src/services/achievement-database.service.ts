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
            [10],
            "2",
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Newbie",
            "Newbie",
            "Commits",
            [10],
            BackendConfig.ACH_TROPHY_PATH + "2" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Beginner",
            "Beginner",
            "Commits",
            [50],
            BackendConfig.ACH_TROPHY_PATH + "3" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Intermediate",
            "Intermediate",
            "Commits",
            [100],
            BackendConfig.ACH_TROPHY_PATH + "4" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Pro",
            "Pro",
            "Commits",
            [250],
            BackendConfig.ACH_TROPHY_PATH + "5" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Master",
            "Master",
            "Commits",
            [1000],
            BackendConfig.ACH_TROPHY_PATH + "6" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "First Review",
            "First",
            "Reviews",
            [1],
            BackendConfig.ACH_TROPHY_PATH + "1" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Newbie",
            "Newbie",
            "Reviews",
            [10],
            BackendConfig.ACH_TROPHY_PATH + "2" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Beginner",
            "Beginner",
            "Reviews",
            [50],
            BackendConfig.ACH_TROPHY_PATH + "3" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Intermediate",
            "Intermediate",
            "Reviews",
            [100],
            BackendConfig.ACH_TROPHY_PATH + "4" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Pro",
            "Pro",
            "Reviews",
            [250],
            BackendConfig.ACH_TROPHY_PATH + "5" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Master",
            "Master",
            "Reviews",
            [1000],
            BackendConfig.ACH_TROPHY_PATH + "6" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Fast Reviewer",
            "Fast",
            "Reviews",
            [2, 300],
            "1",
            BackendConfig.AchievementTypeEnum.TimedReview
        ),
        new AchievementDto(
            "Rapid Reviewer",
            "Rapid Fire",
            "Reviews",
            [6, 300],
            "2",
            BackendConfig.AchievementTypeEnum.TimedReview
        ),
        new AchievementDto(
            "Batch Reviewer",
            "Batcher",
            "Reviews",
            [20, 900],
            "6",
            BackendConfig.AchievementTypeEnum.TimedReview
        ),
        new AchievementDto(
            "Consistent Reviewer",
            "Consistent",
            "Reviews",
            [10, 604800],
            "3",
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

    public getAchievements(ids: string): Observable<Array<AchievementDto>> {
        return this.initObs.pipe(
            map((mapAchievements: Map<string, AchievementDto>) => {
                let achievementIdentifiers = ids.split(",");
                let achievements = achievementIdentifiers.map(id => mapAchievements.get(id));
                return achievements;
            })
        );
    }

    public getAchievementMap(): Observable<Map<string, AchievementDto>> {
        return this.initObs;
    }
    private init(): Observable<Map<string, AchievementDto>> {
        let mapAchievements = new Map<string, AchievementDto>();
        this.ACHIEVEMENTS.forEach(achievement => {
            this.log.d(achievement);
            mapAchievements.set(achievement.id, achievement);
        });
        this.initObs = of(mapAchievements);
        return this.initObs;
    }
}
