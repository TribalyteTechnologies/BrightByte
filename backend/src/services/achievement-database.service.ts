import { Injectable } from "@nestjs/common";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementDto } from "../dto/achievement.dto";
import { BackendConfig } from "../backend.config";

@Injectable()
export class AchievementDatabaseService {

    public initObs: Observable<Map<string, AchievementDto>>;

    private readonly ACHIEVEMENTS: Array<AchievementDto> = [
        new AchievementDto(
            "Commit Newbie",
            "Commits",
            [10],
            BackendConfig.ACH_TROPHY_PATH + "2" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Beginner",
            "Commits",
            [50],
            BackendConfig.ACH_TROPHY_PATH + "3" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Intermediate",
            "Commits",
            [100],
            BackendConfig.ACH_TROPHY_PATH + "4" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Pro",
            "Commits",
            [250],
            BackendConfig.ACH_TROPHY_PATH + "5" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "Commit Master",
            "Commits",
            [1000],
            BackendConfig.ACH_TROPHY_PATH + "6" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Commit
        ),
        new AchievementDto(
            "First Review",
            "Reviews",
            [1],
            BackendConfig.ACH_TROPHY_PATH + "1" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Newbie",
            "Reviews",
            [10],
            BackendConfig.ACH_TROPHY_PATH + "2" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Beginner",
            "Reviews",
            [50],
            BackendConfig.ACH_TROPHY_PATH + "3" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Intermediate",
            "Reviews",
            [100],
            BackendConfig.ACH_TROPHY_PATH + "4" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Pro",
            "Reviews",
            [250],
            BackendConfig.ACH_TROPHY_PATH + "5" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Review Master",
            "Reviews",
            [1000],
            BackendConfig.ACH_TROPHY_PATH + "6" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Review
        ),
        new AchievementDto(
            "Fast Reviewer",
            "Reviews",
            [5, 300],
            BackendConfig.ACH_TROPHY_PATH + "1" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.TimedReview
        ),
        new AchievementDto(
            "Season Opener",
            "Season",
            [],
            BackendConfig.ACH_TROPHY_PATH + "1" + BackendConfig.ACH_IMG_FORMAT,
            BackendConfig.AchievementTypeEnum.Season
        )
    ];

    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService
    ) {
        this.log = loggerSrv.get("AchievementDatabaseService");
        this.initObs = this.init();
    }

    public getAchievements(ids: string): Observable<Array<AchievementDto>> {
        return this.initObs.pipe(
            map((mapAchievements: Map<string, AchievementDto>) => {
                let achievementIdentifiers: string[] = ids.toString().split(",");
                let achievements = new Array<AchievementDto>();
                achievementIdentifiers
                    .map(id => achievements.push(mapAchievements.get(id)));
                return achievements;
            })
        );
    }

    private init(): Observable<Map<string, AchievementDto>> {
        let mapAchievements = new Map<string, AchievementDto>();
        this.ACHIEVEMENTS.map(achievement => {
            mapAchievements.set(achievement.title, achievement);
        });
        this.initObs = of(mapAchievements);
        return this.initObs;
    }
}
