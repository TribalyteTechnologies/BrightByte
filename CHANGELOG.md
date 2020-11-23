# Change Log

#### v0.5.1-cloud

- Refactor backend.
- Fix season changes, duration should be bigger than the time elapsed.
- Minor bug fixes.

#### v0.5.0-cloud

BrightByte cloud now can work with different cloud versions.
- Added Github provider for importing batch commits.
- New smart contracts for multi version management.
- Adapted BrightByte cloud smart contracts for multi version.
- Fronted changes for multi versions and new provider (Github).
- Backend changes for multi versions (New achievements events subscription).
- New frontend-backend-blockchain integration (on ConctractManagerService both backend and frontend).
- Added multiple test for new multi version team smart contracts.


#### v0.4.10-cloud

- Added cron script to call view methods.
- Fixed issue with Bitbucket workspaces.
- Back-end retry to connect to node.
- Added retry method to all getter view methods.
- Minor bug fixes.
- Remove serve-static files in the backend.

#### v0.4.9-cloud

- Fix recursive method, to call view methods from smart contracts.
- Remove serve-static files in the backend.

#### v0.4.8-cloud

- Increase recursive params to change the workaround.

#### v0.4.7-cloud

- Increase recursive params to change the workaround.

#### v0.4.6-cloud

- Increase recursive params to change the workaround.
- Minor visual changes in the slides tutorials.
- Minor bug fixes.

#### v0.4.5-cloud

- Increase recursive params to change the workaround.
- Improve add commit response to the users.
- Minor bug fixes.

#### v0.4.4-cloud

- Added Github authentication to  to the backend.
- Added new methods to the recursive get method workaround, to avoid erros from the blockchain.
- Optimistic response for reviews made.

#### v0.4.3-cloud

- Solved transaction service issue.
- Solved notification bell issue.

#### v0.4.2-cloud

- Uprade node version to v12.
- Migration to yarn.
- Refactor transaction queue to work with all the sendTx methods.
- New alert that appears when the system has still pending transactions, and the users wants to leave.

#### v0.4.1-cloud

- Enable team creation to users alredy registered in other teams.
- Improve visual responses to users when an action is done.
- Refactor Ranking tab.
- Added peding typescript types.
- Minor bug fixes.

#### v0.4.0-cloud

- New scripts to automatize the upgrades with Openzeppelin.
- Added team rules, information to the with the team rules to review.
- New Random revievers feature, if the admin enable this option, all the commits will be assign to random reviewers.s 
- Refactor smart contracts structures.
- Refactor deployment scripts.
- Minor bug fixes.

#### v0.3.3-cloud

- Fix review transaction queue.
- New recursive method to avoid errors from the blockchain.
- Minor bug fixes.

#### v0.3.2-cloud

- Implementes Openzeppelin smart contract upgrades. 
- Update truffle version (5.1.33).
- Update solidity compiler version (5.1.33).
- Added optional bitbucket configuration after team creation.
- Nginx config file.
- Minor bug fixes.

#### v0.3.1-cloud

- Apply solidity interfaces to smart contracts.
- Added new blockchain scrapping tool.
- Added encryption accents support.
- Minor bug fixes.

#### v0.3.0-cloud

- Enable secure connections (https, wss) on backend.
- New smart contract, stores all the teams projects.
- Optimization in the backend initialization.
- Solved review filter issues.
- Minor bug fixes.

#### v0.2.0-cloud

- New encryption service for the users data. 
- Improve create team view.
- Added linters to smart contracts, coverage to smart contracts tests.
- Added new slides to tutorial.
- New alert to mobile browsers users.
- Solved minor bugs.

#### v0.1.2-cloud

- Implement mail service, to notify users invitations.
- New popup service, to deploy the user required information.
- Added new smart contract test.
- Change intial season length to 14 days, it is also allowed to modify this variable.
- New global scripts to deploy the entire environment immediately.
- Added invitation managing feature and thresholds changes to team settings.
- Change smart contract modifiers, improvement in data permissions.
- Minor bug fixes.
- Style refactor.

#### v0.1.1-cloud

- New team settings view, where the admins can change the team configurable variable.
- Changes in the smart contracts to give special powers to the admins.
- Improve user experience with multiple info popups.
- Solved Firefox security flag due to password field.
- Mayor code refactor on Backend (enforce typings, refactor controllers).
- Minor bug fixes.

#### v0.1.0-cloud

BrightByte cloud is a multi team implementation for base BrightByte v0.7.0. Open to public at http://cloud.brightbyteapp.com/ 
- New smart contracts for multi team management.
- Adapted BrightByte base smart contracts for multi team.
- Fronted changes for multi team (Team creation page, team name display).
- Backend changes for multi team (New achievements events subscrption).
- New frontend-backend-blockchain integration (on ConctractManagerService both backend and frontend).
- Added multiple test for new multi team smart contracts.


`No migration needed for v0.1.0-cloud`


#### v0.7.2 (WIP)

- This version is in progress.
- Bug fix on Bright contract when the season change.
- The migration process is not provided.

`Migration needed from 0.7.1 to 0.7.2`

#### v0.7.1

- Solved twitter sharing not showing up.
- New settings button.
- New alerts for enabling popup windows.
- Some feedback improvements.
- Minor bug fixes.

`No migration needed from 0.7.0 to 0.7.1`

#### v0.7.0

- New feature, change user name.
- Add Pagination to review and commits.
- New Smart Contract to store season thresholds.
- Added multi websocket session, all your tabs will be connected to the backend.
- Implemented a utils library on the smart contracts.
- Solved the how timed achievements are obtain on the backend initialization.
- First smart contrats unitary tests.
- Bug fix on Bright contract initialization.
- Increase Weight Factor on the mathematical operations to solve issues with the users reputation.
- Mayor code refactor.

**IMPORTANT NOTE**: It's necessary to deploy all the new contracts again and run the [migration procedure](https://github.com/TribalyteTechnologies/BrightByte/blob/master/MIGRATIONS.md)

#### v 0.6.4

- Enabled social share feature.
- Added slides for register and use tutorials.
- Style changes on ranking page.
- Bug fixes on add commit rollback.

`No migration needed from 0.6.3 to 0.6.4`

#### v 0.6.3

- Added queue service for reviews. Improves performance when reviewing multiple commits.
- Added season engagement index.
- Modified ranking sort to take in account season engagement index.
- Solved reputation precission error (Frontend only).
- Backend minor refactor.
- Some bug fixes.

`No migration needed from 0.6.2 to 0.6.3`

#### v 0.6.2

- Added social sharing features (Facebook and twitter).
- Performance improve on reviews page.
- Some bug fixes.

`No migration needed from 0.6.1 to 0.6.2`

#### v 0.6.1

- New blockchain events initialization for achievement database.
- New endpoint for system configuration on backend.
- Added progress bar in batch import dialog.
- Added load more repositories feature on batch import dialog.
- Minor bitbucket integration bug fixes.

`No migration needed from 0.6.0 to 0.6.1`

#### v 0.6.0

- Support for integration with Bitbucket API (import commits and pull requests from the user account).
- Modified season qualifying feature to take into account user participation for clasified users sort.
- Added new designs for timed achievements.
- Docker documentation updates.
- Implemented first websockets tests.
- Major refactor on ranking page.
- Major observables refactor.
- Minor visual improvements.
- Bug fixes.

`No migration needed from 0.5.6 to 0.6.0`

#### v 0.5.6

- Added season qualifying feature (Requires the users to have a minimum number of commits and reviews 
    to be qualified to be present on the season ranking).
- Visual mods on ranking page for qualifying feature.
- Browser compatiblity refactor.
- Solved minor bugs.

`No migration needed from 0.5.5 to 0.5.6`

#### v 0.5.5

- Hid review card reputation after reviewing the commit.
- Added new use analytics tool.
- Refactored avatar component.
- Minor visual fixes.
- Solved some avatar component bugs.

`No migration needed from 0.5.4 to 0.5.5`

#### v 0.5.4

- Solved review showng error issue.
- Added countdown for season end.

`No migration needed from 0.5.3 to 0.5.4`

#### v 0.5.3

- Implemented directory for profile image storing on the backend.
- Implemented avatar component for profile image managing on the webapp.
- New versioning update procedure for webapp.
- Implemented profile upluading tests.
- Minor documentation mods.
- Minor bug fixes.

`No migration needed from 0.5.2 to 0.5.3`

#### v 0.5.2

- Remove truffle-contract dependecies to avoid chrome realated bugs.
- Added new tool in node.js for migrations.
- Added versioning for smartcontracts
- Improved webapp error handling.
- Updated cross-platform pacake.json scripts
- Solved minor bugs

`No migration needed from 0.5.1 to 0.5.2`

#### v 0.5.1

- Solved reputation precission bug on the smartcontracts (migration needed).
- Added delete commit functionality to the smartcontracts and the webapp.
- Modified backend to get the contracts ABIs from the frontend.
- Implemented first backend test.
- Minor style modifications.

**IMPORTANT NOTE**: It's necessary to deploy all the new contracts again and run the [migration procedure](https://github.com/TribalyteTechnologies/BrightByte/blob/master/MIGRATIONS.md)

####  v 0.5.0

- Added backend for achievements management and Blockchain event handling.
- Optimized Smart Conctracts bytecode size.
- Created onchain migration  library.
- Added contribute shortcut on the side menu.
- Added new time based achievements.
- Modified pending reviews for only showing pending reviews from current season.
- Solved some firefox and safari compatibility issues
- Minor bug fixes

    **IMPORTANT NOTE**: It's necessary to deploy all the new contracts again and run the [migration procedure](https://github.com/TribalyteTechnologies/BrightByte/blob/master/MIGRATIONS.md)

####  v 0.4.5

- Solved season timestamp overflow on the smart contracts.

    **IMPORTANT NOTE**: It's necessary to deploy all the new contracts again and run the [migration procedure](https://github.com/TribalyteTechnologies/BrightByte/blob/master/MIGRATIONS.md)

####  v 0.4.4

- Solved minor issues

    `No migration needed from 0.4.3 to 0.4.4`

####  v 0.4.3

- Updated truffle dependencies
- Added optimistic refresh to commits page
- Solved minor bugs

    `No migration needed from 0.4.2 to 0.4.3`

####  v 0.4.2

- Solved review component refresh bug.

    `No migration needed from 0.4.1 to 0.4.2`

####  v 0.4.1

- Added optimistic refresh to reviews page.
- Solved regex pattern for github Pull Request.

    `No migration needed from 0.4.0 to 0.4.1`

#### v 0.4.0

- Added new multicriteria reputation system. Three criteria "Code quality", "Complexity" and "Reviewer confidence".
- Moved reputation calculations to a separate contract.
- Contracts optimizations (variable sizes).
- Global ranking now is based on participation ("Engagement index").
- Pull request and multirepository validation.
- Visual redesign.
- Mayor code refactor.
- Most pending minor issues solved.

    **IMPORTANT NOTE**: It's necessary to deploy the following new contracts and run the [migration procedure](https://github.com/TribalyteTechnologies/BrightByte/blob/master/MIGRATIONS.md): Bright, Commit, Root.

####  v 0.3.6 (Migration warning screen)

- Solved remember login bug on warning screen.

    `No migration needed from 0.3.5 to 0.3.6`

####  v 0.3.5 (Migration warning screen)

- Change login screen to migration warning (maintenance static web).

    `No migration needed from 0.3.4 to 0.3.5`

####  v 0.3.4

- Reduced review page network requests 60%.
- Added regex null check functionality.

    `No migration needed from 0.3.3 to 0.3.4`

####  v 0.3.3

- Added more transalations.
- Added service for migration between quorum networks.
- Added optimization with cache service.
- Solved regex minor issue.

    `No migration needed from 0.3.2 to 0.3.3`

####  v 0.3.2

- Added more transalations.
- Added more assets.

    `No migration needed from 0.3.1 to 0.3.2`

####  v 0.3.1

- Added more transalations.
- Fixed ranking combobox.
- Added session storage management.
- Added error message when review comment or rating is empty.
- Review page now refresh as soon as you submit a revew.
- Url hash link now shows up on both columns in review page.
- Multiple repository providers (BitBucket, GitHub, GitLab, etc), and pull requests are now admitted.
- New tab now opens two tabs. The repository and BrightByte.
- New login and home page design.
- Pending filter now shows only the pending commits for you to review.
- Some icon adjustments.
- No new deployment of smart contracts

    `No migration needed from 0.3.0 to 0.3.1`

####  v 0.3.0

- Added seasons to the blockchain contracts.
- Implemented seasonal ranking feature.
- Minor issues solved.

    **IMPORTANT NOTE**: It's necessary to deploy the following new contracts and run the [migration procedure](https://github.com/TribalyteTechnologies/BrightByte/blob/master/MIGRATIONS.md): Bright.

####  v 0.2.1

- Visual improvements.
- Code refactor.
- Minor issues solved.
    **IMPORTANT NOTE**: It's necessary to deploy the following new contracts and run the [migration procedure](https://github.com/TribalyteTechnologies/BrightByte/blob/master/MIGRATIONS.md): Bright, Commit, Root.

####  v 0.2.0

- Smart contracts now are divided in three new ones. "Bright", "Commits" and "Root".
- Multinode implementation.
- New migration service.
- Added agree buttons an its functionality on commits page.
- Solved local storage issues.
- New login screen.