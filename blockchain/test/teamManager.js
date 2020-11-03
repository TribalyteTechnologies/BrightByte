const CloudTeamManager = artifacts.require("./CloudTeamManager.sol");
const ProxyManager = artifacts.require("./ProxyManager.sol");
const Web3 = require("web3");

const NODE_URL = "http://127.0.0.1:7545";

contract("CloudTeamManager", accounts => {
    const web3 = openConnection();

    const EMAIL_ACCOUNTS = ["0@example.com", "1@example.com", "2@example.com"];
    const HASH_EMAIL_ACCOUNTS = EMAIL_ACCOUNTS.map(email =>  web3.utils.utf8ToHex(email));
    const TEAM_NAMES = ["team1"];
    const HASH_TEAM_NAMES = TEAM_NAMES.map(name => web3.utils.utf8ToHex(name));

    const EMPTY_TEAM_ID = 0;
    const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";

    const ADMIN_USERTYPE = 1;
    const MEMBER_USERTYPE = 2;
    const INITIAL_SEASON_LENGTH_DAYS = 15;

    const LONG_EXP_SECS = 2000;
    const SHORT_EXP_SECS = 1;
    const EXP_TIMEOUT_MILIS = 5000;

    const PROJECTS = ["pj0", "pj1", "pj2", "pj3"];
    const NEW_VERSION = 410;

    let adminOwnerAccount = accounts[0];
    let emailUser0 = HASH_EMAIL_ACCOUNTS[0];
    let teamName = HASH_TEAM_NAMES[0];

    let user1Account = accounts[1];
    let emailUser1 = HASH_EMAIL_ACCOUNTS[1];

    let user2Account = accounts[2];
    let emailUser2 = HASH_EMAIL_ACCOUNTS[2];

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
                assert(response.receipt.status, "The transaction was not created correctly");
                return teamManagerInstance.getUserTeam(adminOwnerAccount);
            }).then(teamUids => {
                team1Uid = parseBn(teamUids[teamUids.length-1]);
                assert(teamUids.length !== EMPTY_TEAM_ID, "Team was created incorrectly");
                return teamManagerInstance.getTeamMembers(team1Uid);
            })
            .then(teamMembers => {
                let isUserCreatedAdmin = teamMembers[0].find(adminAddress => adminAddress === adminOwnerAccount) === adminOwnerAccount;
                assert(isUserCreatedAdmin, "Creator user is not admin");
                return deployTeamContracts(emailUser0, teamManagerInstance, team1Uid, INITIAL_SEASON_LENGTH_DAYS, adminOwnerAccount);
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
                assert(response.receipt.status, "The transaction was not created correctly");
                return teamManagerInstance.deployCommits(team1Uid, { from: adminOwnerAccount });
            })
            .then(response => {
                assert(response.receipt.status, "The transaction was not created correctly");
                return teamManagerInstance.deploySettings(team1Uid, { from: adminOwnerAccount });
            })
            .then(response => {
                assert(response.receipt.status, "The transaction was not created correctly");
                return teamManagerInstance.deployRoot(emailUser0, team1Uid, INITIAL_SEASON_LENGTH_DAYS, { from: adminOwnerAccount });
            })
            .then(response => {
                assert(response.receipt.status, "The transaction was not created correctly");
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
                return teamManagerInstance.deploySettings(team1Uid, { from: user1Account });
            })
            .catch(() => {
                assert(true);
                return teamManagerInstance.deployRoot(team1Uid, INITIAL_SEASON_LENGTH_DAYS, { from: user1Account });
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

    it("should add a project to a team", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return teamManagerInstance.doesTeamExists(team1Uid, { from: adminOwnerAccount });
            })
            .then(doesTeamExists => {
                assert(!doesTeamExists, "The team already exists");
                return teamManagerInstance.addProject(team1Uid, PROJECTS[0], { from: adminOwnerAccount });
            })
            .then(() => {
                return teamManagerInstance.doesTeamExists(team1Uid, { from: adminOwnerAccount });
            })
            .then(doesTeamExists => {
                assert(doesTeamExists, "The team does not exists");
                return teamManagerInstance.getProjectPageCount(team1Uid, { from: adminOwnerAccount });
            })
            .then(numberOfPositions => {
                return teamManagerInstance.getAllProjects(team1Uid, numberOfPositions, { from: adminOwnerAccount });
            })
            .then(projects => {
                let isProjectCreated = Object.values(projects).some(proj => proj === PROJECTS[0]);
                assert(isProjectCreated, "The project is not created");
            });
        }
    );

    it("should clear all team projects", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return teamManagerInstance.getAllProjects(team1Uid, 0, { from: adminOwnerAccount });
            })
            .then(projects => {
                let isProjectCreated = Object.values(projects).some(proj => proj === PROJECTS[0]);
                assert(isProjectCreated, "The project is not created");
                return teamManagerInstance.clearAllProjects(team1Uid, { from: adminOwnerAccount });
            })
            .then(() => {
                return teamManagerInstance.getAllProjects(team1Uid, 0, { from: adminOwnerAccount });
            })
            .then(projects => {
                let isProjectCreated = Object.values(projects).some(proj => proj !== "");
                assert(!isProjectCreated, "The project is created");
            });
        }
    );

    it("should fail adding, getting, clearing and checking team projects because is sender not member", () => {
        let teamManagerInstance;
        return CloudTeamManager.deployed()
            .then(instance => {
                teamManagerInstance = instance;
                return teamManagerInstance.addProject(team1Uid, PROJECTS[0], { from: user1Account });
            })
            .catch(() => {
                assert(true);
                return teamManagerInstance.doesTeamExists(team1Uid, { from: user1Account });
            })
            .catch(() => {
                assert(true);
                return teamManagerInstance.clearAllProjects(team1Uid, { from: user1Account });
            })
            .catch(() => {
                assert(true);
                return teamManagerInstance.getProjectPageCount(team1Uid, { from: user1Account });
            })
            .catch(() => {
                assert(true);
            })
        }
    );

    it("should check that ProxyManager is working with the current version", async () => {
        let proxyManager = await ProxyManager.deployed();
        let teamManagerInstance = await CloudTeamManager.deployed();
        let currentVersion = await proxyManager.getCurrentVersion();
        let currentVersionAddress = await proxyManager.getVersionContracts(currentVersion);
        assert(currentVersionAddress === teamManagerInstance.address, "The current version of team manager address is wrong");
    });

    it("should check that the user teams are the same in the Proxy Manager", async () => {
        let proxyManager = await ProxyManager.deployed();
        let teamManagerInstance = await CloudTeamManager.deployed();
        let currentVersion = await proxyManager.getCurrentVersion();
        let teamsProxy = await proxyManager.getUserTeam(currentVersion, adminOwnerAccount, { from: adminOwnerAccount });
        let teamsManager = await teamManagerInstance.getUserTeam(adminOwnerAccount);
        assert(teamsProxy.length === teamsManager.length, "The number of teams does not match");
    });

    it("should check that the user is participating in the current version in the Proxy Manager", async () => {
        let proxyManager = await ProxyManager.deployed();
        let currentVersion = await proxyManager.getCurrentVersion();
        let versions = await proxyManager.getUserTeamVersions(adminOwnerAccount, { from: adminOwnerAccount });
        assert.equal(parseBn(currentVersion), parseBn(versions[versions.length - 1]), "The user is not participating in the current version");
    });

    it("should add a new version to the Proxy Manager", async () => {
        const web3 = openConnection();
        let proxyManager = await ProxyManager.deployed();
        let newCloudTeamManager = await CloudTeamManager.new();
        const newAddress = newCloudTeamManager.address;
        await proxyManager.setNewVersion(NEW_VERSION, newAddress, { from: adminOwnerAccount });
        let currentVersion = await proxyManager.getCurrentVersion();
        assert.equal(parseBn(currentVersion), NEW_VERSION, "The expected new version is wrong");
        let currentVersionAddress = await proxyManager.getVersionContracts(currentVersion);
        assert(currentVersionAddress === newAddress, "The user is not participating in the current version");
    });

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
        assert(parseBn(invitedUserInfo[2]) === usertype, "User invitation is not member");
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
    await teamManagerInstance.deploySettings(teamUid, { from: adminUserAddress });
    await teamManagerInstance.deployRoot(userMail, teamUid, seasonLength, { from: adminUserAddress });
}