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
   - Instance activation and deactivation (`instance_deactivate_all`, `instance_deactivate_object`, `instance_deactivate_region`, `instance_activate_all`, `instance_activate_object`, `instance_activate_region`).
   - Instance spatial queries (`instance_nearest`, `instance_farthest`, `instance_nth_nearest`, `instance_nth_farthest`).
   - Motion kinematics (`speed`, `direction`, `hspeed`, `vspeed`, `gravity`, `gravity_direction`, `friction`).
   - Frame step synchronization (`xprevious`, `yprevious`, `xstart`, `ystart`).

3. **Asset & Format Parsing:**
   - GMK probe & parsing engine (`gm82_gmk_reader.c`) for GM7 and GM8 binary project formats.
   - Decompression streams using `zlib`.
   - Legacy GM4/GM5 uncompressed DIB bitmap decoder (`gm82_decode_dib_bitmap`).
   - Image RGBA decoding for sprites and tilesets.

### Verified Capabilities (PASS)
1. **GML Virtual Machine Engine:**
   - Control flow: `while`, `for`, `repeat`, `do-until`, `switch/case/default`, `break/continue`, ternary, short-circuit boolean logic.
   - Instance variables & Kinematics: `x`, `y`, `xprevious`, `yprevious`, `xstart`, `ystart`, `hspeed`, `vspeed`, `speed`, `direction`, `gravity`, `gravity_direction`, `friction`, `image_index`, `image_speed`, `image_angle`, `image_xscale`, `image_yscale`, `image_alpha`, `image_single`, `depth`, `visible`, `persistent`, `solid`, `mask_index`, `alarm[0..11]`.
   - Views & Mouse Input: `view_enabled`, `view_visible[8]`, `view_xview[8]`, `view_yview[8]`, `view_wview[8]`, `view_hview[8]`, `mouse_x`, `mouse_y`.
   - Data Structures: `ds_list_*`, `ds_map_*`, `ds_grid_*`, `ds_queue_*`, `ds_stack_*`, `ds_priority_*`.
   - GM82 Math & Utility Polyfills: `modwrap`, `approach`, `lerproach`, `smoothstep`, `point_in_circle`, `point_in_rectangle`, `point_in_triangle`, `circle_in_circle`, `rectangle_in_rectangle`, `pack_bools`, `unpack_bool`.
   - Object Inheritance: `object_set_parent`, `object_get_parent`, `object_is_ancestor`.
   - Instance Activation & Queries: `instance_deactivate_all`, `instance_deactivate_object`, `instance_deactivate_region`, `instance_activate_all`, `instance_activate_object`, `instance_activate_region`, `instance_nearest`, `instance_farthest`, `instance_nth_nearest`, `instance_nth_farthest`.
   - String & Data Structure Utilities: `string_trim`, `string_contains`, `string_starts_with`, `string_ends_with`, `ds_list_add_list`, `ds_map_add_map`, `get_timer`, `parameter_count`, `parameter_string`, `game_restart_soft`.
   - Win32 Extension Stubs & Display Queries: `external_define`, `external_call`, `external_free`, `window_handle`, `display_mouse_get_x`, `display_mouse_get_y`, `display_mouse_set`.
   - Motion Planning: `mp_linear_step`, `mp_linear_step_object`, `math_set_epsilon`, `math_get_epsilon`.
   - INI Storage: `ini_open`, `ini_read_real`, `ini_write_real`, `ini_read_string`, `ini_write_string`, `ini_close`, `ini_key_delete`, `ini_section_delete`.
   - Drawing & Audio Dispatchers: `draw_sprite_ext`, `draw_text_transformed`, `audio_play_sound`, `audio_is_playing`, `audio_stop_sound`.

2. **Frontend & Studio Integration:**
   - `Nor-maker-7-main` TypeScript web studio typechecks with 0 errors.

### Remaining Gaps (Honest Tracking)
1. **Commercial Extension DLLs:** Windows-specific x86 32-bit `.dll` extensions (e.g. DirectX9 native wrappers, Windows dialogs) are stubbed or bridged via portable equivalents on Android/Linux host.
2. **Device Hardware Testing:** Continuous device instrumentation tests across physical ARM64/ARMv7 devices require manual physical device testing for real-time framerate optimization.
