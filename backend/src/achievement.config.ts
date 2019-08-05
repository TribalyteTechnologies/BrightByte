import { AchievementDto } from "./dto/achievement.dto";

export class AchievementConfig {
    public static readonly achievements: Map<number, AchievementDto> = new Map<number, AchievementDto>([
        [1, new AchievementDto("Newbie", 10, "Commits", "../../assets/imgs/trophys/achievement2.svg")],
        [2, new AchievementDto("Beginner", 50, "Commits", "../../assets/imgs/trophys/achievement3.svg")],
        [3, new AchievementDto("Intermediate", 100, "Commits", "../../assets/imgs/trophys/achievement4.svg")],
        [4, new AchievementDto("Pro", 250, "Commits", "../../assets/imgs/trophys/achievement5.svg")],
        [5, new AchievementDto("Master", 1000, "Commits", "../../assets/imgs/trophys/achievement6.svg")],
        [6, new AchievementDto("First review", 1, "Reviews", "../../assets/imgs/trophys/achievement1.svg")],
        [7, new AchievementDto("Newbie", 10, "Reviews", "../../assets/imgs/trophys/achievement2.svg")],
        [8, new AchievementDto("Beginner", 50, "Reviews", "../../assets/imgs/trophys/achievement3.svg")],
        [9, new AchievementDto("Intermediate", 100, "Reviews", "../../assets/imgs/trophys/achievement4.svg")],
        [10, new AchievementDto("Pro", 250, "Reviews", "../../assets/imgs/trophys/achievement5.svg")],
        [11, new AchievementDto("Master", 1000, "Reviews", "../../assets/imgs/trophys/achievement6.svg")]
    ]);
}

