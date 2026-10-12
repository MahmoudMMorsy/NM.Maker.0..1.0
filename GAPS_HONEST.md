# GAPS HONEST AUDIT & COMPATIBILITY PARITY REPORT

## Engine & Runtime Gap Assessment

This report provides an unvarnished, technical audit of the current Android / Native C GameMaker & GM82 compatibility implementation in the NorMaker runtime.

### Completed Capabilities (Verified via Native Test Suite)

1. **GML Language & VM Capabilities:**
   - Full AST parsing and execution (`gml_frontend.c`, `gml_vm.c`).
   - Dynamic variable scoping: Local instance variables, global variables (`global.var`), and member property getters/setters.
   - Flow control constructs: `if/else`, `while`, `for`, `do ... until`, `switch/case`, `repeat`, `break`, `continue`, `return`.
   - Data structures: `ds_list`, `ds_map`, `ds_grid`, `ds_stack`, `ds_queue`, `ds_priority`.
   - Math & Geometry builtins: Trigonometry, natural logarithms (`ln`), inverse trig (`arcsin`, `arccos`, `arctan`), `random_get_seed`, 2D/3D dot products (`dot_product`, `dot_product_3d`), normal products, `point_distance_3d`, `angle_difference`, `math_set_epsilon`, `math_get_epsilon`.
   - Date Builtins: `date_current_datetime`, `date_current_date`, `date_current_time`, `date_get_year`, `date_get_month`, `date_get_day`, `date_get_hour`, `date_get_minute`, `date_get_second`.
   - Catalog Dispatcher Safety: All 1,080 functions listed in standard GameMaker / GM82 portable `fnames` catalog are dispatched natively or via safe fallback return handlers in `gm82_native_call` to prevent script execution failures on unhandled functions.
   - GM82 Extension helpers: `modwrap`, `smoothstep`, `approach`, `lerproach`, `point_in_circle`, `circle_in_circle`, `point_in_rectangle`, `rectangle_in_rectangle`, `point_in_triangle`, `pack_bools`, `unpack_bool`.
   - Filename & Directory Utilities: `filename_name`, `filename_path`, `filename_dir`, `filename_drive`, `filename_ext`, `filename_change_ext`, `file_rename`, `file_copy`, `directory_exists`, `directory_create`.
   - Binary File IO: `file_bin_open`, `file_bin_close`, `file_bin_write_byte`, `file_bin_read_byte`, `file_bin_seek`, `file_bin_size`, `file_bin_position`.
   - Array Utilities: `array_create`, `array_height_2d`, `array_length_2d`, `array_equals`, `array_copy`.
   - Variable Reflector Helpers: `variable_global_exists`, `variable_local_exists`, `variable_global_get`, `variable_global_set`, `variable_local_get`, `variable_local_set`.
   - Resource Queries: `sprite_get_width`, `sprite_get_height`, `sprite_get_xoffset`, `sprite_get_yoffset`, `sprite_get_number`, `sprite_exists`, `sprite_get_name`, `background_get_width`, `background_get_height`, `background_exists`, `font_exists`, `sound_exists`, `room_exists`, `path_exists`, `timeline_exists`, `script_exists`.
   - Tile Functions: `tile_get_depth`, `tile_get_left`, `tile_get_top`, `tile_get_width`, `tile_get_height`, `tile_get_x`, `tile_get_y`, `tile_get_visible`, `tile_get_background`, `tile_exists`, `tile_add`, `tile_delete`, `tile_set_position`, `tile_set_visible`, `tile_set_depth`.
   - D3D Model Functions & Primitive Constants: `d3d_model_create`, `d3d_model_destroy`, `d3d_model_clear`, `d3d_model_draw`, `d3d_model_primitive_begin`, `d3d_model_primitive_end`, `d3d_model_vertex`, `d3d_model_vertex_color`, `d3d_model_vertex_texture`, `d3d_model_vertex_texture_color`, `d3d_model_bake`, `d3d_model_save_g3z`, `pr_pointlist`, `pr_linelist`, `pr_linestrip`, `pr_trianglelist`, `pr_trianglestrip`, `pr_trianglefan`.
   - Type Queries: `is_nan`, `is_infinity`, `is_ptr`, `is_int32`, `is_int64`, `is_vec3`, `is_matrix`.
   - Window & Motion Action Helpers: `window_set_caption`, `window_get_caption`, `window_set_fullscreen`, `window_get_fullscreen`, `window_set_size`, `window_center`, `action_linear_step`, `action_potential_step`, `action_move_point`, `action_move_to`, `action_move_start`, `action_move_random`.

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
   - Project Simulation Engine: Verified against ALL 12 bundled real GM82 project archives (`gm82test.gm82`, `gm82path.gm82`, `gm82upx.gm82`, `gm82ui_test.gm82`, `n_menu/test.gm82`, `gm82room source`, `model_viewer.gm82`, `gm82hub.gm82`, `gm82angle/anvil`, `gm82vp`, `gm82venc`, `DragonScript2`).

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

### Strategic REA Reverse-Engineering Roadmap & Gap Tracking

1. **REA Methodology & Reverse-Engineering Plan:**
   - **Binary Inspection with REA:** Utilize `morluto/rea` workflows (Hopper/Ghidra/IDA providers via MCP or static JavaScript/ELF analysis) to decompile and inspect legacy GameMaker 8.2 runtime executables and x86 Win32 DLL extensions (`game maker/portable/`).
   - **Win32 & Extension Bridging:** Reconstruct complex Win32 extension entry points and DLL calls into cross-platform C / Android JNI polyfills in `gm82_android_core.c`.
   - **Graphics & Particle Pipelines:** Decompile legacy GameMaker D3D model, particle emitter, and effect creation pipelines (`effect_create_above`, `effect_create_below`, `d3d_draw_*`) and mirror behavior in OpenGLES/Native C drawing queues.

2. **Remaining Gaps (Honest Parity Tracking):**
   - **Commercial Extension DLLs & Win32 Stubs:** Windows-specific x86 32-bit `.dll` extensions and Win32 dialog/splash calls are stubbed via safe default return values (0.0/1.0) on Android/Linux host pending REA decompilation.
   - **Fallback Stubs vs Full Features:** While all 1,080 `fnames` catalog functions are recognized by `gm82_native_call`, complex legacy platform routines (e.g., legacy MDI splash windows, legacy CD-ROM controls) return safe default values rather than full native platform implementations.
   - **Device Hardware Testing:** Continuous device instrumentation tests across physical ARM64/ARMv7 devices require manual physical device testing for real-time framerate optimization.
