pragma solidity 0.4.22;

library Reputation {
    uint256 private constant WEIGHT_FACTOR = 10000000000;
    function calculateCommitPonderation(uint256[] cleanliness, uint256[] complexity, uint256[] revKnowledge) public pure returns (uint256, uint256) {
        uint256 weightedCleanliness = 0;
        uint256 complexityPonderation = 0;
        uint256 totalKnowledge = 0;
        for(uint j = 0; j < cleanliness.length; j++) {
            totalKnowledge += revKnowledge[j];
        }
        for(uint i = 0; i < cleanliness.length; i++) {
            uint256 userKnowledge = (uint256(revKnowledge[i]) * WEIGHT_FACTOR) / totalKnowledge;
            weightedCleanliness += (cleanliness[i] * userKnowledge);
            complexityPonderation += (complexity[i] * userKnowledge);
        }
        return (weightedCleanliness, complexityPonderation);
    }

    function calculateUserReputation(uint256 prevReputation, uint256 prevPonderation, uint256 commitScore, uint256 commitComplexity, uint256 prevScore, uint256 prevComplexity) public pure returns (uint256, uint256) {
        uint256 num = (prevReputation * prevPonderation) - (prevScore * prevComplexity) + (commitScore * commitComplexity);
        uint256 cumulativePonderation = prevPonderation - prevComplexity + commitComplexity;
        uint256 reputation = num / cumulativePonderation;
        return (reputation, cumulativePonderation);
    }
}
