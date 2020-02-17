# Change Log

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