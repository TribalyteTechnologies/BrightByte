import { Injectable, HttpService } from "@nestjs/common";
import { AchievementEventDto } from "src/dto/achievementEvent.dto";
import { BackendConfig } from "src/backend.config";
import { Observable } from "rxjs";
import { AxiosResponse } from "axios";

@Injectable()
export abstract class AchievementProcessorService {

    public achievementId: number;

    private httpService = new HttpService();

    public constructor(achievementId: number) {
        this.achievementId = achievementId;
    }

    public abstract process(event: AchievementEventDto): Observable<number>;

    public isObtained(userHash: string): Observable<AxiosResponse<any>> {
        return this.httpService.get(BackendConfig.IS_OBTAINED_REQ + userHash + "/" + this.achievementId);
    }
}
