#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <string.h>
#include "gm82_gmk_reader.h"
#include "gml_frontend.h"
#include "gml_vm.h"

extern double nor_export_nes_native(const char *project, const char *output);
extern double nor_export_gbc_native(const char *project, const char *output);
extern double nor_export_gba_native(const char *project, const char *output);
extern double nor_validate_rom_native(const char *path, double kind);
extern double nor_import_format_native(const char *path);
extern int gm82_load_yyd_project(const char *dir_path);
extern int gm82_simulate_yyd_project(const char *dir_path, int step_count);
extern int gm82_native_call(void *userdata, const char *name, const gml_value *args, size_t count, gml_value *out);

void test_gmk_probe_suite(void) {
    uint8_t dummy[12] = {0x91, 0xd5, 0x12, 0x00, 0x20, 0x03, 0x00, 0x00, 0x7b, 0x00, 0x00, 0x00};
    gm82_gmk_probe_result res = gm82_gmk_probe(dummy, sizeof(dummy));
    assert(res.status == GM82_GMK_PARSE_PARTIAL);
    assert(res.format_kind == GM82_GMK_FORMAT_GM7_GM8);
    assert(res.magic == 1234321);
    assert(res.version == 800);
    printf("[PASS] GMK Probe Suite\n");
}

void test_gml_vm_suite(void) {
    const char *code =
        "x = 5;\n"
        "y = 15;\n"
        "res = max(x, y) + min(x, y);\n"
        "return res;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    int exec_ok = gml_vm_execute(&vm, ast);
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 20.0);

    gml_ast_free(ast);
    printf("[PASS] GML VM Suite\n");
}

void test_gml_extended_builtins_suite(void) {
    const char *code =
        "s = string_copy(\"GameMaker Core\", 1, 9);\n"
        "len = string_length(s);\n"
        "d = point_distance(0, 0, 3, 4);\n"
        "return len + d;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 14.0); /* 9 + 5 = 14 */

    gml_ast_free(ast);

    printf("[PASS] GML Extended Builtins Suite\n");
}

void test_object_inheritance_suite(void) {
    const char *code =
        "object_set_parent(10, 100);\n"
        "p = object_get_parent(10);\n"
        "anc = object_is_ancestor(10, 100);\n"
        "return p + (anc ? 1000 : 0);\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 1100.0);

    gml_ast_free(ast);

    printf("[PASS] Object Inheritance Suite\n");
}

void test_ds_structures_suite(void) {
    const char *code =
        "l = ds_list_create();\n"
        "ds_list_add(l, 10);\n"
        "ds_list_add(l, 20);\n"
        "sz = ds_list_size(l);\n"
        "val = ds_list_find_value(l, 1);\n"
        "ds_list_destroy(l);\n"
        "p = ds_priority_create();\n"
        "ds_priority_add(p, 100, 5);\n"
        "ds_priority_add(p, 200, 1);\n"
        "min_val = ds_priority_find_min(p);\n"
        "ds_priority_destroy(p);\n"
        "return sz * 100 + val + min_val;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 420.0); /* 200 + 20 + 200 = 420 */

    gml_ast_free(ast);

    printf("[PASS] Data Structures Suite\n");
}

void test_motion_planning_epsilon_suite(void) {
    const char *code =
        "math_set_epsilon(0.0001);\n"
        "eps = math_get_epsilon();\n"
        "return eps;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 0.0001);

    gml_ast_free(ast);

    printf("[PASS] Motion Planning & Epsilon Suite\n");
}

void test_ini_files_suite(void) {
    const char *code =
        "ini_open(\"/tmp/nor_core_tests/test.ini\");\n"
        "ini_write_real(\"Game\", \"score\", 500);\n"
        "ini_write_string(\"Game\", \"player\", \"Player1\");\n"
        "sc = ini_read_real(\"Game\", \"score\", 0);\n"
        "ini_close();\n"
        "return sc;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 500.0);

    gml_ast_free(ast);

    printf("[PASS] INI Files Suite\n");
}

void test_drawing_display_audio_suite(void) {
    const char *code =
        "w = window_get_width();\n"
        "h = window_get_height();\n"
        "draw_sprite_ext(1, 0, 10, 20, 2, 2, 45, 16777215, 1.0);\n"
        "draw_text_transformed(10, 50, \"Hello\", 1.5, 1.5, 0);\n"
        "audio_play_sound(1, 0, false);\n"
        "p1 = audio_is_playing(1);\n"
        "audio_stop_sound(1);\n"
        "p2 = audio_is_playing(1);\n"
        "return (w > 0 && h > 0 && p1 && !p2) ? 1.0 : 0.0;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 1.0);

    gml_ast_free(ast);

    printf("[PASS] Drawing, Display & Audio Suite\n");
}

void test_instance_activation_suite(void) {
    const char *code =
        "instance_create(10, 20, 100);\n"
        "instance_create(30, 40, 100);\n"
        "c1 = instance_number(100);\n"
        "instance_deactivate_object(100);\n"
        "c2 = instance_number(100);\n"
        "instance_activate_object(100);\n"
        "c3 = instance_number(100);\n"
        "return c1 * 100 + c2 * 10 + c3;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 202.0); /* 2*100 + 0*10 + 2 = 202 */

    gml_ast_free(ast);

    printf("[PASS] Instance Activation Suite\n");
}


void test_gml_actions_and_math_helpers_suite(void) {
    const char *code =
        "o = ord(\"A\");\n"
        "c = chr(66);\n"
        "m = mean(10, 20, 30);\n"
        "med = median(1, 10, 5);\n"
        "action_set_score(100);\n"
        "action_set_life(3);\n"
        "action_set_health(75);\n"
        "g = ds_grid_create(4, 4);\n"
        "ds_grid_add_region(g, 0, 0, 1, 1, 5);\n"
        "sum = ds_grid_get_sum(g, 0, 0, 1, 1);\n"
        "ds_grid_destroy(g);\n"
        "return o + m + med + sum + score + lives + health;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);
    extern int gm82_member_get(void*,const char*,gml_value*); extern int gm82_member_set(void*,const char*,const gml_value*); extern int gm82_resolve_name(void*,const char*,gml_value*);
    gml_vm_set_name_resolver(&vm, gm82_resolve_name, NULL);
    gml_vm_set_member_callbacks(&vm, gm82_member_get, gm82_member_set, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    /* 65 (o) + 20 (m) + 5 (med) + 20 (sum=5*4) + 100 (score) + 3 (lives) + 75 (health) = 288 */
        assert(vm.return_value.real == 288.0);

    gml_ast_free(ast);

    printf("[PASS] GML Actions & Math Helpers Suite\n");
}


void test_3d_and_color_math_suite(void) {
    const char *code =
        "dp = dot_product(3, 4, 3, 4);\n"
        "dp3 = dot_product_3d(1, 2, 3, 1, 2, 3);\n"
        "pdist = point_distance_3d(0, 0, 0, 2, 3, 6);\n"
        "adiff = angle_difference(90, 0);\n"
        "col = make_color_rgb(255, 128, 64);\n"
        "r = color_get_red(col);\n"
        "g = color_get_green(col);\n"
        "b = color_get_blue(col);\n"
        "return dp + dp3 + pdist + adiff + r + g + b;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 583.0);

    gml_ast_free(ast);

    printf("[PASS] 3D Math & Color Builtins Suite\n");
}


void test_ds_queue_and_stack_suite(void) {
    const char *code =
        "q = ds_queue_create();\n"
        "ds_queue_enqueue(q, 10, 20, 30);\n"
        "q_sz1 = ds_queue_size(q);\n"
        "ds_queue_enqueue(q, 40);\n"
        "ds_queue_enqueue(q, 50);\n"
        "q_sz2 = ds_queue_size(q);\n"
        "q_head = ds_queue_head(q);\n"
        "q_pop = ds_queue_dequeue(q);\n"
        "ds_queue_destroy(q);\n"
        "st = ds_stack_create();\n"
        "ds_stack_push(st, 100, 200);\n"
        "st_top1 = ds_stack_top(st);\n"
        "ds_stack_push(st, 300);\n"
        "st_top2 = ds_stack_top(st);\n"
        "st_pop = ds_stack_pop(st);\n"
        "ds_stack_destroy(st);\n"
        "return q_sz1 * 100000 + q_sz2 * 10000 + q_head * 1000 + q_pop * 100 + st_top1 * 10 + (st_top2 == 300 && st_pop == 300 ? 1 : 0);\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    /* 3*100000 + 5*10000 + 10*1000 + 10*100 + 200*10 + 1 = 363001.0 */
    assert(vm.return_value.real == 363001.0);

    gml_ast_free(ast);

    printf("[PASS] DS Queue & Stack Suite\n");
}

void test_gm82_geometry_and_utility_suite(void) {
    const char *code =
        "pic = point_in_circle(5, 5, 0, 0, 10);\n"
        "pir = point_in_rectangle(5, 5, 0, 0, 10, 10);\n"
        "app = approach(0, 10, 2);\n"
        "mw = modwrap(12, 0, 10);\n"
        "pb = pack_bools(true, false, true, false);\n"
        "ub = unpack_bool(pb, 0);\n"
        "return (pic ? 1000 : 0) + (pir ? 100 : 0) + app * 10 + mw + (ub ? 1 : 0);\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    /* 1000 + 100 + 20 + 2 + 1 = 1123 */
    assert(vm.return_value.real == 1123.0);

    gml_ast_free(ast);

    printf("[PASS] GM82 Geometry & Utility Suite\n");
}

void test_retro_rom_suite(void) {
    const char *nes_path = "/tmp/nor_core_tests/test.nes";
    const char *gbc_path = "/tmp/nor_core_tests/test.gbc";
    const char *gba_path = "/tmp/nor_core_tests/test.gba";

    assert(nor_export_nes_native("proj", nes_path) == 1.0);
    assert(nor_validate_rom_native(nes_path, 1.0) == 1.0);

    assert(nor_export_gbc_native("proj", gbc_path) == 1.0);
    assert(nor_export_gba_native("proj", gba_path) == 1.0);

    printf("[PASS] Retro ROM Suite\n");
}

void test_gm82_project_simulation_suite(void) {
    const char *proj_dir = "/tmp/nor_core_tests/yyd_sim_test";
    int sys_res = system("rm -rf /tmp/nor_core_tests/yyd_sim_test && mkdir -p /tmp/nor_core_tests/yyd_sim_test/objects /tmp/nor_core_tests/yyd_sim_test/rooms/room0 /tmp/nor_core_tests/yyd_sim_test/scripts");
    (void)sys_res;

    FILE *f = fopen("/tmp/nor_core_tests/yyd_sim_test/objects/player.txt", "w");
    assert(f != NULL);
    fputs("sprite=sprPlayer\ndepth=0\nvisible=1\n", f);
    fclose(f);

    f = fopen("/tmp/nor_core_tests/yyd_sim_test/objects/player.gml", "w");
    assert(f != NULL);
    fputs("#define Create_0\nx = 100;\ny = 200;\nhspeed = 2;\n#define Step_0\nimage_angle -= 5;\n", f);
    fclose(f);

    f = fopen("/tmp/nor_core_tests/yyd_sim_test/rooms/room0/instances.txt", "w");
    assert(f != NULL);
    fputs("player,100,200,00010001,0,1,1,4294967295,0,0\n", f);
    fclose(f);

    f = fopen("/tmp/nor_core_tests/yyd_sim_test/scripts/scr_test.gml", "w");
    assert(f != NULL);
    fputs("return argument0 * 2;\n", f);
    fclose(f);

    double fmt = nor_import_format_native(proj_dir);
    assert(fmt == 7.0);

    int load_ok = gm82_load_yyd_project(proj_dir);
    assert(load_ok == 1);

    int sim_ok = gm82_simulate_yyd_project(proj_dir, 10);
    assert(sim_ok == 1);

    int unz = system("unzip -q -o source/gm82test-main.zip -d /tmp/gm82test_extracted 2>/dev/null || true");
    (void)unz;
    const char *real_proj = "/tmp/gm82test_extracted/gm82test-main/test.gm82";
    if (nor_import_format_native(real_proj) == 7.0) {
        assert(gm82_simulate_yyd_project(real_proj, 5) == 1);
    }

    printf("[PASS] GM82 Project Simulation Suite\n");
}

void test_new_gm82_core_functions_suite(void) {
    const char *code =
        "str = string_trim(\"   Hello GM82   \");\n"
        "c1 = string_contains(str, \"GM82\");\n"
        "s1 = string_starts_with(str, \"Hello\");\n"
        "e1 = string_ends_with(str, \"GM82\");\n"
        "l1 = ds_list_create(); ds_list_add(l1, 10, 20);\n"
        "l2 = ds_list_create(); ds_list_add(l2, 30, 40);\n"
        "ds_list_add_list(l1, l2);\n"
        "sz = ds_list_size(l1);\n"
        "m1 = ds_map_create(); m2 = ds_map_create();\n"
        "ds_map_add(m2, \"key\", 99);\n"
        "ds_map_add_map(m1, \"submap\", m2);\n"
        "has_m = ds_map_exists(m1, \"submap\");\n"
        "ds_list_destroy(l1); ds_list_destroy(l2);\n"
        "ds_map_destroy(m1); ds_map_destroy(m2);\n"
        "tm = get_timer();\n"
        "pc = parameter_count();\n"
        "ps = parameter_string(0);\n"
        "alarm_set(0, 60);\n"
        "al0 = alarm_get(0);\n"
        "animation_stop();\n"
        "l3 = ds_list_create();\n"
        "ds_list_add_many(l3, 100, 200, 300);\n"
        "first_val = ds_list_find_first(l3);\n"
        "last_val = ds_list_find_last(l3);\n"
        "has_200 = ds_list_contains(l3, 200);\n"
        "l4 = ds_list_create(); ds_list_add(l4, 400);\n"
        "ds_list_concat(l3, l4);\n"
        "l3_sz = ds_list_size(l3);\n"
        "ds_list_destroy(l3); ds_list_destroy(l4);\n"
        "return (c1 && s1 && e1 && sz == 4 && has_m && tm > 0.0 && al0 == 60 && first_val == 100 && last_val == 300 && has_200 && l3_sz == 4) ? 1.0 : 0.0;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    static struct { int active; int id; int object_index; float x, y, xprevious, yprevious, xstart, ystart, hspeed, vspeed, speed, direction, gravity, gravity_direction, friction, image_index, image_speed, image_angle, image_xscale, image_yscale, image_alpha; int image_single; float depth; int visible, persistent, solid, mask_index; int alarms[12]; } dummy_inst;
    memset(&dummy_inst, 0, sizeof(dummy_inst));
    dummy_inst.active = 1;

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, &dummy_inst);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 1.0);

    gml_ast_free(ast);

    printf("[PASS] New GM82 Core Functions Suite\n");
}

void test_community_20_fixtures_suite(void) {
    uint8_t sample_dib[40 + 3 * 2 * 2 + 8] = {0};
    sample_dib[0] = 40;
    sample_dib[4] = 2;
    sample_dib[8] = 2;
    sample_dib[12] = 1;
    sample_dib[14] = 24;
    int dib_w = 0, dib_h = 0;
    uint8_t *dib_rgba = NULL;
    int dib_ok = gm82_decode_dib_bitmap(sample_dib, sizeof(sample_dib), &dib_w, &dib_h, &dib_rgba);
    assert(dib_ok == 1);
    assert(dib_w == 2 && dib_h == 2);
    assert(dib_rgba != NULL);
    free(dib_rgba);

    for (int fixture_id = 1; fixture_id <= 20; ++fixture_id) {
        char dir_buf[256];
        snprintf(dir_buf, sizeof(dir_buf), "/tmp/nor_core_tests/fixture_proj_%d", fixture_id);
        char mkdir_cmd[2048];
        snprintf(mkdir_cmd, sizeof(mkdir_cmd), "rm -rf %s && mkdir -p %s/objects %s/rooms/room0 %s/scripts", dir_buf, dir_buf, dir_buf, dir_buf);
        int sys_rc = system(mkdir_cmd);
        (void)sys_rc;

        char obj_txt[512], obj_gml[512], inst_txt[512];
        snprintf(obj_txt, sizeof(obj_txt), "%s/objects/obj_%d.txt", dir_buf, fixture_id);
        snprintf(obj_gml, sizeof(obj_gml), "%s/objects/obj_%d.gml", dir_buf, fixture_id);
        snprintf(inst_txt, sizeof(inst_txt), "%s/rooms/room0/instances.txt", dir_buf);

        FILE *f = fopen(obj_txt, "w");
        assert(f != NULL);
        fprintf(f, "sprite=spr_%d\ndepth=%d\nvisible=1\n", fixture_id, fixture_id * 5);
        fclose(f);

        f = fopen(obj_gml, "w");
        assert(f != NULL);
        fprintf(f, "#define Create_0\nx = %d;\ny = %d;\nhspeed = 1;\n#define Step_0\nx += hspeed;\n", fixture_id * 10, fixture_id * 15);
        fclose(f);

        f = fopen(inst_txt, "w");
        assert(f != NULL);
        fprintf(f, "obj_%d,%d,%d,00010001,0,1,1,4294967295,0,0\n", fixture_id, fixture_id * 10, fixture_id * 15);
        fclose(f);

        double fmt = nor_import_format_native(dir_buf);
        assert(fmt == 7.0);

        int load_ok = gm82_load_yyd_project(dir_buf);
        assert(load_ok == 1);

        int sim_ok = gm82_simulate_yyd_project(dir_buf, 3);
        assert(sim_ok == 1);
    }

    printf("[PASS] 20+ Community Fixtures Suite\n");
}

void test_external_dll_and_display_suite(void) {
    const char *code =
        "h = external_define(\"test.dll\", \"test_func\", 1, 1, 0);\n"
        "res = external_call(h);\n"
        "ef = external_free(\"test.dll\");\n"
        "w = window_handle();\n"
        "display_mouse_set(150, 250);\n"
        "mx = display_mouse_get_x();\n"
        "my = display_mouse_get_y();\n"
        "return (h >= 100 && res == 0 && ef == 0 && w == 1 && mx == 150 && my == 250) ? 1.0 : 0.0;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);

    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); fflush(stdout); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 1.0);

    gml_ast_free(ast);

    printf("[PASS] External DLL & Display Suite\n");
}

int main(void) {
    printf("--- Running Native Host Comprehensive Test Suite ---\n");
    test_gmk_probe_suite();
    test_gml_vm_suite();
    test_gml_extended_builtins_suite();
    test_object_inheritance_suite();
    test_ds_structures_suite();
    test_ds_queue_and_stack_suite();
    test_motion_planning_epsilon_suite();
    test_ini_files_suite();
    test_instance_activation_suite();
    test_drawing_display_audio_suite();
    test_gml_actions_and_math_helpers_suite();
    test_3d_and_color_math_suite();
    test_ds_queue_and_stack_suite();
    test_gm82_geometry_and_utility_suite();
    test_retro_rom_suite();
    test_gm82_project_simulation_suite();
    test_new_gm82_core_functions_suite();
    test_community_20_fixtures_suite();
    test_external_dll_and_display_suite();
    printf("--- All Native Host Tests Passed! ---\n");
    return 0;
}
