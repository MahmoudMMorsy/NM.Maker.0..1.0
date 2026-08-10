# Bolt's Journal

## 2025-08-10 - O(N^2) Nested Loops in Rule-Based Diagnostics
**Learning:** In React-based game editor environments, routine analytical operations (like checking room properties, sprites, and objects) can easily introduce O(N^2) complexity or heavy array operations (like `.flat()`, `.filter()`, or `.some()`) inside high-frequency render-triggered loops. Caching flattened properties using a WeakMap and prebuilding O(1) Map lookups for assets instead of performing inline linear searches drastically optimizes diagnostic time.
**Action:** Always inspect loops inside loops (such as checking objects inside room iterators) and lift independent checks outside. Use `WeakMap` to safely cache expensive/rebuilt properties on component prop snapshots without leaking memory.
