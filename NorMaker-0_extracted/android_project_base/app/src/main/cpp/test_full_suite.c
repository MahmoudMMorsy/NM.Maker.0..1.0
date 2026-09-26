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
    assert(vm.return_value.real == 420.0); /* sz(2)*100 + val(20) + min_val(200) = 420 */

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

void test_ds_queue_and_stack_suite(void) {
    const char *code =
        "q = ds_queue_create();\n"
        "ds_queue_enqueue(q, 10, 20, 30);\n"
        "q_sz = ds_queue_size(q);\n"
        "q_head = ds_queue_head(q);\n"
        "q_pop = ds_queue_dequeue(q);\n"
        "ds_queue_destroy(q);\n"
        "st = ds_stack_create();\n"
        "ds_stack_push(st, 100, 200);\n"
        "st_top = ds_stack_top(st);\n"
        "st_pop = ds_stack_pop(st);\n"
        "ds_stack_destroy(st);\n"
        "return q_sz * 10000 + q_head * 1000 + q_pop * 100 + st_top * 10 + st_pop;\n";

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
    /* q_sz(3)*10000 + q_head(10)*1000 + q_pop(10)*100 + st_top(200)*10 + st_pop(200) = 30000 + 10000 + 1000 + 2000 + 200 = 43200 */
    assert(vm.return_value.real == 43200.0);

    gml_ast_free(ast);

    printf("[PASS] DS Queue & Stack Suite\n");
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

int main(void) {
    printf("--- Running Native Host Comprehensive Test Suite ---\n");
    test_gmk_probe_suite();
    test_gml_vm_suite();
    test_gml_extended_builtins_suite();
    test_object_inheritance_suite();
    test_ds_structures_suite();
    test_motion_planning_epsilon_suite();
    test_ini_files_suite();
    test_instance_activation_suite();
    test_drawing_display_audio_suite();
    test_gml_actions_and_math_helpers_suite();
    test_ds_queue_and_stack_suite();
    test_retro_rom_suite();
    printf("--- All Native Host Tests Passed! ---\n");
    return 0;
}
