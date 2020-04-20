import { Injectable } from "@nestjs/common";
import { AchievementProcessor } from "../achievement-processor/achievement-processor";
import { ILogger, LoggerService } from "../logger/logger.service";
import { AchievementEventDto } from "../dto/events/achievement-event.dto";
import { EventDatabaseService } from "./event-database.service";
import { UserDatabaseService } from "../services/user-database.service";
import { ClientNotificationService } from "./client-notfication.service";
import { map, flatMap, tap } from "rxjs/operators";
import { Observable, combineLatest, of } from "rxjs";
import { BackendConfig } from "../backend.config";
import { AchievementDatabaseService } from "./achievement-database.service";
import { CommitAchievementProcessor } from "../achievement-processor/commit-achievement-processor";
import { ReviewAchievementProcessor } from "../achievement-processor/review-achievement-processor";
import { TimedReviewAchievementProcessor } from "../achievement-processor/timed-review-achievement-processor";
import { SuccessResponseDto } from "../dto/response/success-response.dto";
import { ResponseDto } from "../dto/response/response.dto";
import { AchievementDto } from "../dto/achievement.dto";

@Injectable()
export class DispatcherService {

    private readonly TIMESTAMP_DIVISION_FACTOR = 1000;
    private readonly THRESHOLD_IN_SECS = 60;
    private achievementStack: Array<AchievementProcessor>;
    private log: ILogger;

    public constructor(
        loggerSrv: LoggerService,
        private eventDbSrv: EventDatabaseService,
        private userDbSrv: UserDatabaseService,
        private achievementDbSrv: AchievementDatabaseService,
        private clientNtSrv: ClientNotificationService
    ) {
        this.log = loggerSrv.get("DispatcherService");
        this.init();
    }

    public dispatch(event: AchievementEventDto): Observable<ResponseDto> {
        this.log.d("New event received:", event);
        return this.eventDbSrv.setEvent(event).pipe(
            flatMap((res: ResponseDto) => this.userDbSrv.createUser(event.userHash)),
            flatMap((res: ResponseDto) => {
                let obs = this.achievementStack.map(achievementProcessor => achievementProcessor.process(event));
                return combineLatest(obs);
            }),
            map(achievements => achievements.filter(value => !!value)),
            tap((obtainedAchievements: Array<AchievementDto>) => {
                let currentThresholdedDate = (Date.now() / this.TIMESTAMP_DIVISION_FACTOR) - this.THRESHOLD_IN_SECS;
                if (obtainedAchievements.length > 0 && event.timestamp > currentThresholdedDate) {
                    this.log.d("The obtained achivements for the event are: ", obtainedAchievements);
                    this.clientNtSrv.sendNewAchievement(event.userHash, obtainedAchievements);
                }
            }),
            flatMap((obtainedAchievements: Array<AchievementDto>) => {
                let ret = new Observable<Array<ResponseDto>>();
                if (obtainedAchievements.length > 0) {
                    let obs = obtainedAchievements.map(achivement => this.userDbSrv.setObtainedAchievement(event.userHash, achivement.id));
                    ret = combineLatest(obs);
                } else {
                    let aux = new Array<ResponseDto>();
                    aux.push(new SuccessResponseDto("No new achievement obtained for the event"));
                    ret = of(aux);
                }
                return ret;
            }),
            map(res => {
                this.log.d("The event has been dispatched ", res);
                return new SuccessResponseDto();
            })
        );
    }

    private init() {
        this.achievementStack = new Array<AchievementProcessor>();
        this.achievementDbSrv.getAchievementMap().subscribe(mapAchievements => {
            mapAchievements.forEach((achievement) => {
                this.log.d(achievement);
                let processor: AchievementProcessor;
                switch (achievement.processorType) {
                    case BackendConfig.AchievementTypeEnum.Commit:
                        processor = new CommitAchievementProcessor(achievement, this.userDbSrv);
                        break;
                    case BackendConfig.AchievementTypeEnum.Review:
                        processor = new ReviewAchievementProcessor(achievement, this.userDbSrv);
                        break;
                    case BackendConfig.AchievementTypeEnum.TimedReview:
                        processor = new TimedReviewAchievementProcessor(achievement, this.userDbSrv);
                        break;
                    default:
                        this.log.d("Error, type " + achievement.processorType);
                }
                this.achievementStack.push(processor);
            });
        });
    }
}
