pragma solidity 0.4.21;

library Reputation {
    uint16 private constant WEIGHT_FACTOR = 1000;

    function calculateCommitPonderation(uint16[] cleanliness, uint16[] complexity, uint16[] revKnowledge) public pure returns (uint32, uint32) {
        uint32 weightedCleanliness = 0;
        uint32 complexityPonderation = 0;
        uint32 totalKnowledge = 0;
        for(uint8 j = 0; j < cleanliness.length; j++) {
            totalKnowledge += revKnowledge[j];
        }
        for(uint8 i = 0; i < cleanliness.length; i++) {
            uint32 userKnowledge = (uint32(revKnowledge[i]) * WEIGHT_FACTOR) / totalKnowledge;
            weightedCleanliness += (cleanliness[i] * userKnowledge);
            complexityPonderation += (complexity[i] * userKnowledge);
        }
        return (weightedCleanliness/WEIGHT_FACTOR, complexityPonderation/WEIGHT_FACTOR);
    }

    function calculateUserReputation(uint32 prevReputation, uint32 prevPonderation, uint32 commitScore, uint32 commitComplexity, uint32 prevScore, uint32 prevComplexity) public pure returns (uint32, uint32) {
        uint32 num = (prevReputation * prevPonderation) - (prevScore * prevComplexity) + (commitScore * commitComplexity);
        uint32 cumulativePonderation = prevPonderation - prevComplexity + commitComplexity;
        uint32 reputation = (num * WEIGHT_FACTOR) / cumulativePonderation;
        return (reputation/WEIGHT_FACTOR, cumulativePonderation);
    }
}
