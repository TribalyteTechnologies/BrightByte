import { BackendConfig } from "src/backend.config";

export class AchievementDto {
    public constructor(
        public id: string,
        public title: string,
        public parameter: string,
        public values: any[],
        public iconPath: string,
        public processorType?: BackendConfig.AchievementTypeEnum
    ) { }
}
