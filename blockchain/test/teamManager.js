const CloudTeamManager = artifacts.require("./CloudTeamManager.sol");
const Web3 = require("web3");

const NODE_URL = "http://127.0.0.1:7545";

contract("CloudTeamManager", accounts => {
    const EMAIL_ACCOUNTS = ["0@example.com", "1@example.com", "2@example.com"];
    const TEAM_NAMES = ["team1"];
    const EMPTY_TEAM_ID = 0;
    const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

    const ADMIN_USERTYPE = 1;
    const MEMBER_USERTYPE = 2;
    const INITIAL_SEASON_LENGTH = 15;

    const LONG_EXP_SECS = 2000;
    const SHORT_EXP_SECS = 1;
    const EXP_TIMEOUT_MILIS = 5000;

    let adminOwnerAccount = accounts[0];
    let emailUser0 = EMAIL_ACCOUNTS[0];
    let teamName = TEAM_NAMES[0];

    let user1Account = accounts[1];
    let emailUser1 = EMAIL_ACCOUNTS[1];

    let user2Account = accounts[2];
    let emailUser2 = EMAIL_ACCOUNTS[2];

    let team1Uid;
    it("should create a team and ensure that the creator is an admin", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return teamManagerInstance.isUserEmailInvited(emailUser0);
            })
            .then(isUserInvited => {
                assert(!isUserInvited, "User already invited to team, cannot create team");
                return teamManagerInstance.createTeam(emailUser0, teamName, { from: adminOwnerAccount });
            })
            .then(response => {
                assert(response.receipt.status);
                return teamManagerInstance.getUserTeam(adminOwnerAccount);
            }).then(teamUids => {
                team1Uid = parseBn(teamUids[teamUids.length-1]);
                assert(teamUids.length !== EMPTY_TEAM_ID, "Team was created incorrectly");
                return teamManagerInstance.getTeamMembers(team1Uid);
            })
            .then(teamMembers => {
                let isUserCreatedAdmin = teamMembers[0].find(adminAddress => adminAddress === adminOwnerAccount) === adminOwnerAccount;
                assert(isUserCreatedAdmin, "Creator user is not admin");
                return deployTeamContracts(emailUser0, teamManagerInstance, team1Uid, INITIAL_SEASON_LENGTH, adminOwnerAccount);
            });
        }
    );

    it("should invite a user as an admin", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return inviteUser(teamManagerInstance, team1Uid, emailUser1, ADMIN_USERTYPE, LONG_EXP_SECS, adminOwnerAccount);
            });
    });

    it("should overwrite user invitation as member", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return inviteUser(teamManagerInstance, team1Uid, emailUser1, MEMBER_USERTYPE, LONG_EXP_SECS, adminOwnerAccount);
            });
    });

    it("should register user as member", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return registerToTeam(teamManagerInstance, user1Account, emailUser1, team1Uid, EMPTY_TEAM_ID, false);
            })
            .then(teamUId => {
                return teamManagerInstance.getTeamMembers(teamUId);
            })
            .then(teamMembers => {
                let isUserCreatedMember = teamMembers[1].find(address => address === user1Account) === user1Account;
                assert(isUserCreatedMember, "User is not member after register to team");
            });
        }
    );

    it("should fail registering because invitation is expired", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return inviteUser(teamManagerInstance, team1Uid, emailUser2, ADMIN_USERTYPE, SHORT_EXP_SECS, adminOwnerAccount);
            })
            .then(() => {
                return timeout(EXP_TIMEOUT_MILIS);
            })
            .then(() => { 
                return registerToTeam(teamManagerInstance, user2Account, emailUser2, team1Uid, EMPTY_TEAM_ID, true);
            });
        }
    );

    it("should deploy all contracts", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return teamManagerInstance.deployBright(team1Uid, { from: adminOwnerAccount });
            })
            .then(response => {
                assert(response.receipt.status);
                return teamManagerInstance.deployCommits(team1Uid, { from: adminOwnerAccount });
            })
            .then(response => {
                assert(response.receipt.status);
                return teamManagerInstance.deployThreshold(team1Uid, { from: adminOwnerAccount });
            })
            .then(response => {
                assert(response.receipt.status);
                return teamManagerInstance.deployRoot(emailUser0, team1Uid, INITIAL_SEASON_LENGTH, { from: adminOwnerAccount });
            })
            .then(response => {
                assert(response.receipt.status);
                return teamManagerInstance.getTeamContractAddresses(team1Uid, { from: adminOwnerAccount });
            })
            .then(allContracts => {
                let areContractsDeployedCorrectly = !Object.values(allContracts).some(address => address === EMPTY_ADDRESS);
                assert(areContractsDeployedCorrectly, "All or some contracts were deployed incorrectly");
            });
        }
    );
    
    it("should fail deploying all contracts because is not admin", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return teamManagerInstance.deployBright(team1Uid, { from: user1Account });
            })
            .catch(() => {
                assert(true);
                return teamManagerInstance.deployCommits(team1Uid, { from: user1Account });
            })
            .catch(() => {
                assert(true);
                return teamManagerInstance.deployThreshold(team1Uid, { from: user1Account });
            })
            .catch(() => {
                assert(true);
                return teamManagerInstance.deployRoot(team1Uid, INITIAL_SEASON_LENGTH, { from: user1Account });
            })
            .catch(() => {
                assert(true);
            });
        }
    );
    
    it("should change user from member to admin", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return toggleUserType(teamManagerInstance, team1Uid, user1Account, adminOwnerAccount, false);
            })
            .then(teamMembers => {
                let isChangedUserAdmin = teamMembers[0].find(address => address === user1Account) === user1Account &&
                    !teamMembers[1].find(address => address === user1Account);
                assert(isChangedUserAdmin, "User permisions has not changed");
            });
        }
    );

    it("should change user from admin to member", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return toggleUserType(teamManagerInstance, team1Uid, user1Account, adminOwnerAccount, false);
            })
            .then(teamMembers => {
                let isChangedUserMember = teamMembers[1].find(address => address === user1Account) === user1Account &&
                    !teamMembers[0].find(address => address === user1Account);
                assert(isChangedUserMember, "User permisions has not changed");
            });
        }
    );

    it("should fail changing user permissions because is member", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return toggleUserType(teamManagerInstance, team1Uid, adminOwnerAccount, user1Account, true);
            })
            .then(teamMembers => {
                let isChangedUserMember = teamMembers[0].find(address => address === adminOwnerAccount) === adminOwnerAccount &&
                    !teamMembers[1].find(address => address === adminOwnerAccount);
                assert(isChangedUserMember, "User permisions has changed");
            });
        }
    );

    it("should fail removing user from team because is not admin", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return removeUserFromTeam(teamManagerInstance, team1Uid, adminOwnerAccount, user1Account, true)
            })
            .then(teamMembers => {
                let isUserStillOnTeam = teamMembers[0].find(address => address === adminOwnerAccount) === adminOwnerAccount &&
                    !teamMembers[1].find(address => address === adminOwnerAccount);
                assert(isUserStillOnTeam, "User was removed from team");
            });
        }
    );

    it("should fail removing user from team because is owner", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return toggleUserType(teamManagerInstance, team1Uid, user1Account, adminOwnerAccount, false);
            })
            .then(teamMembers => {
                let isChangedUserAdmin = teamMembers[0].find(address => address === user1Account) === user1Account &&
                    !teamMembers[1].find(address => address === user1Account);
                assert(isChangedUserAdmin, "User permisions has not changed");
                return removeUserFromTeam(teamManagerInstance, team1Uid, adminOwnerAccount, user1Account, true)
            })
            .then(teamMembers => {
                let isUserStillOnTeam = teamMembers[0].find(address => address === adminOwnerAccount) === adminOwnerAccount &&
                    !teamMembers[1].find(address => address === adminOwnerAccount);
                assert(isUserStillOnTeam, "User was removed from team");
            });
        }
    );

    it("should remove user from team", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return removeUserFromTeam(teamManagerInstance, team1Uid, user1Account, adminOwnerAccount, false)
            })
            .then(teamMembers => {
                let isUserRemovedFromTeam = !teamMembers[0].find(address => address === user1Account) &&
                    !teamMembers[1].find(address => address === user1Account);
                assert(isUserRemovedFromTeam, "User was not removed from team");
            });
        }
    );
});

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function inviteUser(teamManagerInstance, team1Uid, email, usertype, expiration, senderAddress) {
    return teamManagerInstance.inviteToTeam(team1Uid, email, usertype, expiration, { from: senderAddress })         
    .then(response => {
        assert(response.receipt.status);
        return teamManagerInstance.isUserEmailInvitedToTeam(email, team1Uid);
    })
    .then(isUserInvited => {
        assert(isUserInvited, "User is not invited to team");
        return teamManagerInstance.getInvitedUserInfo(email, team1Uid);
    })
    .then(invitedUserInfo => {
        assert(invitedUserInfo[2] == usertype, "User invitation is not member");
    });
}

function registerToTeam(teamManagerInstance, userAddress, email, team1Uid, empyTeamId, shouldFail) {
    return teamManagerInstance.registerToTeam(userAddress, email, team1Uid, { from: userAddress })
    .then(response => {
        assert(response.receipt.status);
        return teamManagerInstance.getUserTeam(userAddress);
    })
    .then(teamUids => {
        if (shouldFail) {
            assert(teamUids.length === empyTeamId, "Team was created incorrectly");
        } else {
            assert(teamUids.length !== empyTeamId, "Team was created incorrectly");
        }
        return team1Uid;
    });
}

function toggleUserType(teamManagerInstance, teamUId, changedUserAddress, senderAddress, shouldFail) {
    let promise =  teamManagerInstance.toggleUserType(teamUId, changedUserAddress, { from: senderAddress })
    return concatEndPromise(teamManagerInstance, promise, teamUId, shouldFail);
}

function removeUserFromTeam(teamManagerInstance, teamUId, changedUserAddress, senderAddress, shouldFail) {
    let promise =  teamManagerInstance.removeFromTeam(teamUId, changedUserAddress, { from: senderAddress });
    return concatEndPromise(teamManagerInstance, promise, teamUId, shouldFail);
}

function concatEndPromise(teamManagerInstance, promise, teamUId, shouldFail) {
    let newPromise;
    if (shouldFail) {
        newPromise = promise
        .catch(() => {
            assert(true);
            return teamManagerInstance.getTeamMembers(teamUId);
        });
    }else {
        newPromise = promise
        .then(response => {
            assert(response.receipt.status);
            return teamManagerInstance.getTeamMembers(teamUId);
        });
    }
    return newPromise;
}

function parseBn(bigNumber) {
    const web3 = openConnection();
    var BN = web3.utils.BN;
    return parseInt(new BN(bigNumber));
}

function openConnection() {
    return new Web3(new Web3.providers.HttpProvider(NODE_URL));
}

async function deployTeamContracts(userMail, teamManagerInstance, teamUid, seasonLength, adminUserAddress) {
    await teamManagerInstance.deployBright(teamUid, { from: adminUserAddress });
    await teamManagerInstance.deployCommits(teamUid, { from: adminUserAddress });
    await teamManagerInstance.deployThreshold(teamUid, { from: adminUserAddress });
    await teamManagerInstance.deployRoot(userMail, teamUid, seasonLength, { from: adminUserAddress });
}