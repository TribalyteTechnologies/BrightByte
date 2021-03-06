import { BackendConfig } from "../backend.config";

export class AchievementDto {
    public constructor(
        public id: string,
        public title: string,
        public parameter: string,
        public values: any,
        public iconPath: string,
        public processorType?: BackendConfig.AchievementTypeEnum
    ) {
        if (processorType && processorType === BackendConfig.AchievementTypeEnum.TimedReview) {
            this.iconPath = BackendConfig.ACH_TIMED_TROPHY_PATH + this.iconPath + BackendConfig.ACH_IMG_FORMAT;
        } else if (!processorType || processorType !== BackendConfig.AchievementTypeEnum.TimedReview) {
            this.iconPath = BackendConfig.ACH_TROPHY_PATH + this.iconPath + BackendConfig.ACH_IMG_FORMAT;
        }
    }
}
