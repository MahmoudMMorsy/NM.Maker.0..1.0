# GAPS HONEST AUDIT & COMPATIBILITY PARITY REPORT

## Engine & Runtime Gap Assessment

This report provides an unvarnished, technical audit of the current Android / Native C GameMaker & GM82 compatibility implementation in the NorMaker runtime.

### Completed Capabilities (Verified via Native Test Suite)

1. **GML Language & VM Capabilities:**
   - Full AST parsing and execution (`gml_frontend.c`, `gml_vm.c`).
   - Dynamic variable scoping: Local instance variables, global variables (`global.var`), and member property getters/setters.
   - Flow control constructs: `if/else`, `while`, `for`, `do ... until`, `switch/case`, `repeat`, `break`, `continue`, `return`.
   - Data structures: `ds_list`, `ds_map`, `ds_grid`, `ds_stack`, `ds_queue`, `ds_priority`.
   - Math & Geometry builtins: Trigonometry, 2D/3D dot products (`dot_product`, `dot_product_3d`), normal products, `point_distance_3d`, `angle_difference`, `math_set_epsilon`, `math_get_epsilon`.
   - GM82 Extension helpers: `modwrap`, `smoothstep`, `approach`, `lerproach`, `point_in_circle`, `circle_in_circle`, `point_in_rectangle`, `rectangle_in_rectangle`, `point_in_triangle`, `pack_bools`, `unpack_bool`.

2. **Instance & Object Lifecycle:**
   - Object parent hierarchy resolution (`object_get_parent`, `object_set_parent`, `object_is_ancestor`).
   - Instance creation, destruction, depth sorting, and layer spawning (`gm82_spawn_instance_layer`).
   - Instance activation and deactivation (`instance_deactivate_all`, `instance_deactivate_object`, `instance_activate_all`, `instance_activate_object`).
   - Motion kinematics (`speed`, `direction`, `hspeed`, `vspeed`, `gravity`, `gravity_direction`, `friction`).
   - Frame step synchronization (`xprevious`, `yprevious`, `xstart`, `ystart`).

3. **Asset & Format Parsing:**
   - GMK probe & parsing engine (`gm82_gmk_reader.c`) for GM7 and GM8 binary project formats.
   - Decompression streams using `zlib`.
   - Image RGBA decoding for sprites and tilesets.

### Identified Gaps & Future Roadmap Items (To Reach 100% Native Parity)

1. **Hardware Specific Sound Output (Android Phase 7):**
   - Sound enqueueing and status tracking are fully operational in native VM logic.
   - Hardware-level low-latency audio output (OpenSL ES / AAudio / SoundPool backend binding on real devices) requires device JNI audio stream linkage.

2. **Hardware Shader & Extended GLES Pipelines:**
   - Basic 2D sprite, shape, and primitive drawing routines pass host tests.
   - Advanced GameMaker / GM82 GLSL ES custom shader uniforms and 3D d3d vertex buffers use fallback emulation stubs on non-GLES targets.

3. **Complex Physical Mask Collisions:**
   - Bounding box (AABB) and edge-to-edge distance collisions (`distance_to_point`, `distance_to_object`, `place_meeting`, `place_free`) are supported.
   - Precise pixel-perfect collision mask checking for arbitrary rotated non-rectangular sprites requires per-pixel mask bitmask expansion.
