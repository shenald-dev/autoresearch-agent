We are given a merge conflict in CHANGELOG.md between base (master) and head (PR branch).
 The base branch has changes that include:
   - Adding a new version [1.0.29] - 2026-05-20 at the top (with some changes)
   - And then a series of version entries from [1.0.28] down to [0.1.0]

 The head branch has changes that include:
   - Adding a new version [1.0.28] - 2026-05-11 at the top (with a specific change: pruning unused temporary scripts)
   - And then a series of version entries from [1.0.27] down to [0.1.0]

 However, note that the base branch already has [1.0.29] and then [1.0.28] (which in base is the same as the head's [1.0.28] but without the pruning change?).

 Let's look at the provided diff (Head changes vs base) which shows:

   @@ -4,6 +4,9 @@
    The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
    and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
   +## [1.0.28] - 2026-05-11
   +* **[Pruned]:** Removed unused temporary scripts `resolve_changelog.js` and `resolve_warden.js`.
   +
    ## [1.0.27] - 2026-05-11
    * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
    * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

 This diff indicates that in the head branch, we have added a new section for [1.0.28] (with the pruning change) right after the header and before the existing [1.0.27] section.

 However, in the base branch, we see that the version [1.0.29] is present at the top, and then [1.0.28] (without the pruning change) is present later.

 But note: the base branch's [1.0.28] section (as seen in the base version) does not have the pruning change. Instead, the base branch has:

   ## [1.0.29] - 2026-05-20
   * **[Optimized]:** Replaced inline charset parsing in WebFetcher with the shared `extractCharset` utility to eliminate duplicate computation.
   * **[Pruned]:** Removed unused `HttpError` export from `GoogleSearcher`.
   * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

   ... and then later ...

   ## [1.0.28] - 2026-05-11
   * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
   * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

 The head branch, on the other hand, has:

   ## [1.0.28] - 2026-05-11
   * **[Pruned]:** Removed unused temporary scripts `resolve_changelog.js` and `resolve_warden.js`.

   ## [1.0.27] - 2026-05-11
   * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
   * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

 And then the rest of the versions are the same as in base? But note: the base branch has [1.0.29] at the top, which the head branch does not have.

 However, the head branch does not have [1.0.29] at all? Actually, the head branch's version list starts at [1.0.28] and goes down.

 But wait: the base branch has [1.0.29] and then [1.0.28] (without the pruning) and then [1.0.27] (which is the same as in head?).

 The conflict is that the head branch added a new [1.0.28] section (with the pruning change) at the top (after the header) and then the base branch has [1.0.29] at the top and then [1.0.28] (without the pruning) and then [1.0.27].

 How to resolve?

 According to the rules:
   - We must keep ALL meaningful changes from both branches.

 Steps:

 1. The base branch has a version [1.0.29] that the head branch does not have. We must keep it.
 2. The head branch has a version [1.0.28] with a pruning change that the base branch does not have in its [1.0.28] section (the base branch's [1.0.28] section is different: it has the ConfigManager reuse and dependencies bump).
 3. However, note that the base branch's [1.0.28] section is actually the same as the head branch's [1.0.27] section? Let's compare:

    Base branch's [1.0.28]:
        * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
        * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

    Head branch's [1.0.27]:
        * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
        * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

    So they are identical.

 4. Therefore, the head branch has:
        [1.0.28] (with pruning) 
        [1.0.27] (which is the same as base's [1.0.28])

    And the base branch has:
        [1.0.29]
        [1.0.28] (which is the same as head's [1.0.27])
        [1.0.27] (which we don't see in the base branch's provided snippet? Actually, the base branch's snippet shows [1.0.27] as well, but let's check the base branch's description)

 Looking at the base branch's description:

     Base (master): 98 lines changed (lines 7-129)
         ... 
         - ## [1.0.27] - 2026-05-11
         + ## [1.0.29] - 2026-05-20
         ... 
         - ## [1.0.25] - 2026-05-04
         + ## [1.0.28] - 2026-05-11
         ... 
         - ## [1.0.24] - 2026-05-03
         + ## [1.0.27] - 2026-05-11
         ... 
         - ## [1.0.23] - 2026-05-02
         + ## [1.0.25] - 2026-05-04
         ... 
         - ## [1.0.22] - 2026-05-02
         + ## [1.0.24] - 2026-05-03
         ... 
         - ## [1.0.21] - 2026-04-29
         + ## [1.0.23] - 2026-05-02
         ... 
         - ## [1.0.20] - 2026-04-28
         + ## [1.0.22] - 2026-05-02
         ... 
         - ## [1.0.19] - 2026-04-27
         + 
         ... 
         - ## [1.0.18] - 2026-04-26
         + ## [1.0.20] - 2026-04-28
         ... 
         - ## [1.0.17] - 2026-04-25
         + ## [1.0.19] - 2026-04-27
         ... 
         - ## [1.0.16] - 2026-04-24
         + ## [1.0.18] - 2026-04-26
         ... 
         - ## [1.0.15] - 2026-04-23
         + ## [1.0.17] - 2026-04-25
         ... 
         - ## [1.0.14] - 2026-04-22
         + ## [1.0.16] - 2026-04-24
         ... 
         - ## [1.0.13] - 2026-04-21
         + ## [1.0.15] - 2026-04-23
         ... 
         - ## [1.0.12] - 2026-04-20
         + ## [1.0.14] - 2026-04-22
         ... 
         - ## [1.0.11] - 2026-04-19
         + ## [1.0.13] - 2026-04-21
         ... 
         - ## [1.0.10] - 2026-04-18
         + ## [1.0.12] - 2026-04-20
         ... 
         - ## [1.0.09] - 2026-04-17
         + ## [1.0.11] - 2026-04-19
         ... 
         - ## [1.0.08] - 2026-04-16
         + ## [1.0.10] - 2026-04-18
         ... 
         - ## [1.0.07] - 2026-04-15
         + ## [1.0.09] - 2026-04-17
         ... 
         - ## [1.0.06] - 2026-04-14
         + ## [1.0.08] - 2026-04-16
         ... 
         - ## [1.0.05] - 2026-04-13
         + ## [1.0.07] - 2026-04-15
         ... 
         - ## [1.0.04] - 2026-04-12
         + ## [1.0.06] - 2026-04-14
         ... 
         - ## [1.0.03] - 2026-04-11
         + ## [1.0.05] - 2026-04-13
         ... 
         - ## [1.0.02] - 2026-04-10
         + ## [1.0.04] - 2026-04-12
         ... 
         - ## [1.0.01] - 2026-04-09
         + ## [1.0.03] - 2026-04-11
         ... 
         - ## [1.0.00] - 2026-04-08
         + ## [1.0.02] - 2026-04-10
         ... 
         - ## [0.1.0] - YYYY-MM-DD
         + ## [1.0.01] - 2026-04-09
         ... 
         + ## [0.1.0] - YYYY-MM-DD

 This is very confusing because it seems the base branch has shifted all the versions up by one? Actually, it looks like the base branch has inserted a new version [1.0.29] at the top and then shifted every existing version down by one (so [1.0.28] becomes the old [1.0.27], etc.) and then added a new [0.1.0] at the bottom? But note the base branch's description says it changed lines 7-129 (98 lines) and the head branch changed lines 7-124 (109 lines).

 However, the provided diff (Head changes vs base) only shows a small change at the top: adding [1.0.28] with the pruning change.

 Let me re-read the problem:

   Base (master): 98 lines changed (lines 7-129)
   Head (jules-4209760490708721413-6d6499be): 109 lines changed (lines 7-124)

 And the Git Diff (Head changes vs base) is:

   @@ -4,6 +4,9 @@
    The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
    and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
   +## [1.0.28] - 2026-05-11
   +* **[Pruned]:** Removed unused temporary scripts `resolve_changelog.js` and `resolve_warden.js`.
   +
    ## [1.0.27] - 2026-05-11
    * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
    * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

 This diff is comparing the head branch to the base branch. It says that in the head branch, we have added three lines (the new [1.0.28] section) at the position after the header and before the existing [1.0.27] section.

 But note: in the base branch, the section that is currently at the position of the head branch's [1.0.27] is actually the base branch's [1.0.29]? No, because the base branch has [1.0.29] at the very top.

 Actually, the base branch's file starts:

   # Changelog
   ... header ...
   ## [1.0.29] - 2026-05-20
   ... 

 The head branch's file starts:

   # Changelog
   ... header ...
   ## [1.0.28] - 2026-05-11   [added by head]
   ## [1.0.27] - 2026-05-11   [which in base is the [1.0.29]? No, wait]

 This doesn't align.

 Let me try to reconstruct:

   Ancestor: 
        ... 
        ## [1.0.27] - 2026-05-11   [let's assume this was the latest in ancestor]
        ## [1.0.26] - ...
        ...

   Base branch (master): 
        They added a new version [1.0.29] at the top, and then shifted all the existing versions down by one? 
        So:
          ## [1.0.29] - 2026-05-20   [new]
          ## [1.0.28] - 2026-05-11   [which was the old [1.0.27] in ancestor?]
          ## [1.0.27] - 2026-05-04   [which was the old [1.0.26] in ancestor?]
          ... and so on.

   Head branch (PR):
        They added a new version [1.0.28] at the top (with the pruning change) and then left the rest as in the ancestor? 
        So:
          ## [1.0.28] - 2026-05-11   [new, with pruning]
          ## [1.0.27] - 2026-05-11   [which is the same as the ancestor's [1.0.27]]
          ## [1.0.26] - ...          [same as ancestor]

 But wait, the base branch's description says they changed lines 7-129 (98 lines) and the head branch changed lines 7-124 (109 lines). This suggests that the base branch did more than just add a version at the top? It also modified many existing version entries.

 However, the provided diff (Head changes vs base) only shows a small change at the top. This implies that the rest of the file is the same? But that contradicts the base branch's description of 98 lines changed.

 Given the complexity, let's rely on the provided diff and the fact that we must keep all changes from both branches.

 The diff (Head vs base) shows that the head branch has added:
   ## [1.0.28] - 2026-05-11
   * **[Pruned]:** Removed unused temporary scripts `resolve_changelog.js` and `resolve_warden.js`.

 right after the header and before the existing ## [1.0.27] section.

 In the base branch, at that same position (after the header) we have:
   ## [1.0.29] - 2026-05-20
   * **[Optimized]:** Replaced inline charset parsing in WebFetcher with the shared `extractCharset` utility to eliminate duplicate computation.
   * **[Pruned]:** Removed unused `HttpError` export from `GoogleSearcher`.
   * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

 So the base branch has a [1.0.29] section at the top, and the head branch has a [1.0.28] section at the top.

 How to merge?

 We want to keep both:

   - The base branch's [1.0.29] section (which is a new version that the head branch doesn't have)
   - The head branch's [1.0.28] section (which is a new version that the base branch doesn't have in the form of having the pruning change? But note: the base branch does have a [1.0.28] section, but it is different)

 However, note that the base branch's [1.0.28] section (as seen in the base version) is:

   ## [1.0.28] - 2026-05-11
   * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
   * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

 And the head branch's [1.0.28] section is:

   ## [1.0.28] - 2026-05-11
   * **[Pruned]:** Removed unused temporary scripts `resolve_changelog.js` and `resolve_warden.js`.

 These are two different changes to the same version section? But wait, the head branch's [1.0.28] section is placed at the top (right after the header) and the base branch's [1.0.28] section is actually not at the top? 

 In the base branch, the [1.0.28] section is the second section (after [1.0.29]).

 In the head branch, the [1.0.28] section is the first section (after the header).

 So they are not the same section in the file? They are both labeled [1.0.28] but at different positions? That doesn't make sense because version numbers should be unique and in descending order.

 Actually, the head branch has:

   [1.0.28] (newly added at the top)
   [1.0.27] (which is the same as the base branch's [1.0.28]? because the base branch's [1.0.28] is the same as the head branch's [1.0.27] in content? Let's check:

        Base branch's [1.0.28]: 
            * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
            * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

        Head branch's [1.0.27]:
            * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
            * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

        So they are identical.

 Therefore, the head branch has:

   [1.0.28] (with pruning)   -> new
   [1.0.27] (which is the same as base's [1.0.28])

 And the base branch has:

   [1.0.29] (new) 
   [1.0.28] (which is the same as head's [1.0.27])
   [1.0.27] (which we don't see in the base branch's provided snippet? But the base branch's description shows they changed many lines, so likely the base branch has shifted all versions down by one and added [1.0.29] at the top)

 So the base branch's version list is:

   [1.0.29]
   [1.0.28]   (which is the old [1.0.27] from ancestor)
   [1.0.27]   (which is the old [1.0.26] from ancestor)
   ... 

 And the head branch's version list is:

   [1.0.28]   (new, with pruning)
   [1.0.27]   (which is the old [1.0.27] from ancestor) -> same as base's [1.0.28]
   [1.0.26]   (which is the old [1.0.26] from ancestor) -> same as base's [1.0.27]
   ...

 Therefore, to keep all changes:

   We want to have:
        [1.0.29]   (from base)
        [1.0.28]   (we have two versions: one from base and one from head? But note: they are different changes to the same version number? Actually, no: the head branch's [1.0.28] is a new version that the base branch doesn't have as a version? Wait, the base branch does have a [1.0.28] but it is actually the old [1.0.27] from ancestor.)

 This is very confusing.

 Let me try to think of the version numbers as they should be:

   We want the versions in descending order.

   The base branch has introduced a new version [1.0.29] (so the latest is 1.0.29).
   The head branch has introduced a new version [1.0.28] (so the latest would be 1.0.28) but wait, the base branch already has 1.0.29 so 1.0.28 is not the latest.

   However, the head branch does not have [1.0.29] at all? So if we merge, we must have [1.0.29] as the latest.

   Then, what about [1.0.28]? 
        The base branch has a [1.0.28] section (which is actually the changes that were in [1.0.27] in the ancestor, but now labeled as 1.0.28 because they added 1.0.29).
        The head branch has a [1.0.28] section (which is a new set of changes: the pruning of temporary scripts).

   So we have two different sets of changes for version 1.0.28? 

   But note: the base branch's [1.0.28] section is not marked as new in the base branch's description? It is presented as a version that existed in the ancestor but now has been shifted? Actually, no: the base branch's description shows that they changed the version numbers of many entries.

   Given the instructions: "Keep ALL meaningful changes from BOTH branches"

   We must include:
        - The base branch's [1.0.29] section (because it's new in base and not in head)
        - The head branch's [1.0.28] section (because it's new in head and not in base? But wait, the base branch does have a [1.0.28] section, but it is different)

   However, the two [1.0.28] sections are different. We cannot have two [1.0.28] sections.

   How did this happen? 
        The base branch decided to bump the version to 1.0.29 and then relabeled all previous versions (so the old 1.0.27 became 1.0.28, etc.)
        The head branch decided to add a new version 1.0.28 (with some changes) and then left the previous versions as they were (so the old 1.0.27 remained 1.0.27).

   This is a conflict in version numbering.

   But note: the head branch's [1.0.28] is intended to be a new version (so it should be the latest at the time of the PR), but the base branch has already released 1.0.29.

   Therefore, in the merged version, the latest should be 1.0.29 (from base), and then we should have the head branch's changes as part of an earlier version? 

   However, the head branch's changes (the pruning of temporary scripts) are meant to be in version 1.0.28. But in the base branch, version 1.0.28 already exists (and it contains different changes: the ConfigManager reuse and dependencies bump).

   So we have two different sets of changes that both want to be in version 1.0.28.

   According to rule 2: When both modify the same code (same version section), if they add different things, keep BOTH.

   Therefore, for version 1.0.28, we should combine the changes from both branches.

   The base branch's version 1.0.28 section has:
        * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
        * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

   The head branch's version 1.0.28 section has:
        * **[Pruned]:** Removed unused temporary scripts `resolve_changelog.js` and `resolve_warden.js`.

   So we keep both.

   Additionally, the base branch has a version 1.0.29 that the head branch does not have, so we keep that.

   And the head branch has versions below 1.0.28 that are the same as the base branch's versions below 1.0.28? 

   But note: the base branch's version 1.0.27 is actually the head branch's version 1.0.26? 

   However, we are not changing the version numbers arbitrarily. We are keeping the version labels as they appear in the file.

   Proposed merged file:

        # Changelog
        ... header ...
        ## [1.0.29] - 2026-05-20   [from base]
        * **[Optimized]:** Replaced inline charset parsing in WebFetcher with the shared `extractCharset` utility to eliminate duplicate computation.
        * **[Pruned]:** Removed unused `HttpError` export from `GoogleSearcher`.
        * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

        ## [1.0.28] - 2026-05-11   [we are going to combine the two]
        * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.   [from base's 1.0.28]
        * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.        [from base's 1.0.28]
        * **[Pruned]:** Removed unused temporary scripts `resolve_changelog.js` and `resolve_warden.js`.   [from head's 1.0.28]

        ## [1.0.27] - 2026-05-11   [this is the same in both?]
        * **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
        * **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

        ... and then the rest ...

   But wait: the base branch's version 1.0.27 is not shown in the base branch's provided snippet? Actually, the base branch's description shows that they have a version 1.0.27 (it appears in the diff as being changed from something else). However, in the base branch's file, after the [1.0.28] section, we would expect to see the [1.0.27] section.

   And the head branch's file has a [1.0.27] section that is identical to the base branch's [1.0.28] section? 

   But in our merged file, we have:

        [1.0.29] (base)
        [1.0.28] (combined)
        [1.0.27] (which we are taking from where?)

   Now, what should be in [1.0.27]? 

        In the base branch, the [1.0.27] section would be the changes that were in [1.0.26] in the ancestor.
        In the head branch, the [1.0.27] section is the same as the base branch's [1.0.28] section (which we have already used in the combined [1.0.28]).

   This would mean that the head branch's [1.0.27] section is duplicate of the base branch's [1.0.28] section, which we have already included.

   Therefore, we should skip the head branch's [1.0.27] section because it is already represented in our combined [1.0.28]? 

   But note: the head branch's [1.0.27] section is not the same as the base branch's [1.0.27] section.

   Let me clarify with the ancestor:

        Ancestor had:
            [1.0.27] - ...   (let's call this A)
            [1.0.26] - ...   (B)
            [1.0.25] - ...   (C)
            ...

        Base branch:
            Added [1.0.29] (new changes: D)
            Then shifted: 
                [1.0.28] = A   (with no changes? but wait, the base branch's description shows they changed the content of many versions? Actually, no: the base branch's description shows they only changed the version numbers and added the new [1.0.29] and then the rest are the same as ancestor but with version numbers incremented by one? But the provided base branch snippet shows changes in the content of the versions too.)

   Given the complexity and the fact that the problem states that the base branch changed 98 lines (lines 7-129) and the head branch changed 109 lines (lines 7-124), and the only diff provided is the small one at the top, I think we are meant to assume that the rest of the file is identical between base and head except for the top part.

   However, the base branch's description of changes shows many lines changed, so that assumption is invalid.

   But note: the problem says "File Versions" and then gives truncated versions. We are not given the full file.

   Given the instructions and the provided diff, the only conflict we are shown is at the very top: the head branch added a [1.0.28] section with the pruning change, and the base branch has a [1.0.29] section at the top.

   And the diff (Head vs base) only shows that the head branch has added three lines (the [1.0.28] section) at the top.

   Therefore, for the purpose of this merge, we will:

        - Keep the base branch's [1.0.29] section (because it's in base and not in the head branch's diff? but note: the head branch's file does not have [1.0.29] at all, so we must add it from base)
        - Keep the head branch's added [1.0.28] section (with the pruning change) 
        - And then keep the rest of the file as in the base branch? or as in the head branch? 

   But wait: the base branch's file, after the header, has:
        [1.0.29] ... 
        [1.0.28] ...   [which is the base branch's version of 1.0.28]
        [1.0.27] ... 
        ...

   The head branch's file, after the header, has:
        [1.0.28] ...   [the head branch's version of 1.0.28: the pruning change]
        [1.0.27] ...   [which is the same as the base branch's [1.0.28]?]
        [1.0.26] ...   [which is the same as the base branch's [1.0.27]?]
        ...

   So if we take the base branch's file and insert the head branch's [1.0.28] section (the pruning change)