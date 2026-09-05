# Bolt's Journal

## 2025-08-10 - O(N^2) Nested Loops in Rule-Based Diagnostics
**Learning:** In React-based game editor environments, routine analytical operations (like checking room properties, sprites, and objects) can easily introduce O(N^2) complexity or heavy array operations (like `.flat()`, `.filter()`, or `.some()`) inside high-frequency render-triggered loops. Caching flattened properties using a WeakMap and prebuilding O(1) Map lookups for assets instead of performing inline linear searches drastically optimizes diagnostic time.
**Action:** Always inspect loops inside loops (such as checking objects inside room iterators) and lift independent checks outside. Use `WeakMap` to safely cache expensive/rebuilt properties on component prop snapshots without leaking memory.

## 2025-08-10 - O(Assets * Files) GMX Project Import Optimization
**Learning:** Importing third-party or legacy projects (like GMX folder conversion) usually involves resolving physical files (images, sounds, scripts) via linear scanning. Since this happens for every single asset, lookups inside file lists lead to severe $O(\text{Assets} \times \text{Files})$ bottleneck on large projects.
**Action:** Pre-index dropped file lists into lookup Maps by full path and suffix names on the first search. Scoping the cache to the files array using `WeakMap` ensures memory is automatically reclaimed while lookups run in instant $O(1)$ time.

## 2026-08-13 - Diagnostic Engine and React Render Memoization Optimization
**Learning:** Checking whether game objects are placed in any room inside of `checkGameplay` originally resulted in $O(\text{Objects} \times \text{Rooms} \times \text{MapSize})$ nested loops. Moving room map indexing outside the objects loop by precomputing a Set of placed indices reduces the complexity of finding placed objects to a fast $O(1)$ lookup per object. Similarly, memoizing rendering calculations like `grouped` issues and `filteredKnowledge` list search in React panel components prevents heavy CPU/memory thrashing on every component render.
**Action:** Lift room map searches out of game object loops and precompute Set indices. Memoize grouped list aggregations and filtering operations in components.

## 2026-08-14 - GC Thrashing Prevention in Polling Loops and O(N*M) Auto-Repair Optimizations
**Learning:** High-frequency polling loops (like inspecting iframe window state every 500ms) that use `.filter().length` trigger continuous GC allocation churn during live game execution. Replacing `.filter().length` with an in-place counter loop eliminates allocations completely. Furthermore, in project repair routines, inline `.find()` searches on sprite lists inside game object iterators generate $O(\text{Objects} \times \text{Sprites})$ complexity; precomputing a `Set` of sprite IDs reduces lookup to $O(\text{Sprites} + \text{Objects})$.
**Action:** Prefer imperative loop counting over `.filter().length` in recurring polling intervals. Precompute lookup `Set`s before iterating collections in batch repair or diagnostic functions.

## 2026-09-05 - O(N log N) Runtime Instance Sorting and GC Allocation Elimination
**Learning:** Hot game loop functions (such as `instance_nearest` and `instance_furthest`) implemented using `.filter().sort()` allocate temporary arrays and perform $O(N \log N)$ sorting operations every frame (e.g. 60 times/sec per instance). Replaces `.filter().sort()` with single-pass $O(N)$ linear loops tracking min/max distance completely eliminates GC array allocation thrashing and reduces time complexity to $O(N)$.
**Action:** Always replace `.filter().sort()[0]` with a single-pass loop tracking min/max variables when retrieving extrema from dynamic runtime collections.
