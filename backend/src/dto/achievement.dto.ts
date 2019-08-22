import { BackendConfig } from "src/backend.config";

export class AchievementDto {
    public constructor(
        public title: string,
        public parameter: string,
        public values: Array<number>,
        public iconPath: string,
        public processorType?: BackendConfig.AchievementTypeEnum
    ) { }
}
