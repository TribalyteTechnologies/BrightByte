import { BackendConfig } from "../../backend.config";

export abstract class AchievementEventDto{
    public userHash: string;    
    public count: number;
    public url: string;
    public currentSeason: number;
    public timestamp: number;
    public eventType: BackendConfig.EventTypeEnum;
}
