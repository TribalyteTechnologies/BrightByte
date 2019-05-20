# Change Log

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