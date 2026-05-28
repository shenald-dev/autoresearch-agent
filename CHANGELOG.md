@@ -1,120 +1,451 @@
-﻿# Changelog
+We are given a merge conflict in CHANGELOG.md. We have three versions: base (master), head (PR branch), and the common ancestor.
 
-All notable changes to autoresearch-agent will be documented in this file.
+The goal is to produce a resolved file that includes all meaningful changes from both branches, without conflict markers.
 
-The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
-and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
-## [1.0.27] - 2026-05-11
-* **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.
-* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.
+From the context:
 
-## [1.0.25] - 2026-05-04
-* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.
+- The base branch (master) has changes from lines 7-138 (126 lines changed) and includes version bumps up to 1.0.31.
+- The head branch (PR branch) has changes from lines 7-129 (98 lines changed) and includes version bumps up to 1.0.29.
 
-## [1.0.24] - 2026-05-03
-* **[Optimization]:** Added unit tests for empty context chunk skipping in ResearchEngine.
-* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.
+The git diff provided (Head changes vs base) shows that the head branch has added two new version sections at the top: [1.0.29] and [1.0.28], and then the base branch has [1.0.30] and [1.0.31] (among others) that are not in the head.
 
-## [1.0.23] - 2026-05-02
-* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.
+However, note that the base branch already has [1.0.30] and [1.0.31] (and more) while the head branch has [1.0.29] and [1.0.28] and then the rest.
 
+But wait: the base branch (master) has:
+  ## [1.0.31] - 2026-05-27
+  ... (then 1.0.30, 1.0.29, ...)
 
-## [1.0.22] - 2026-05-02
-* **[Optimization]:** Im