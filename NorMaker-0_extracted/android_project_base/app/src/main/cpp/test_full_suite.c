#include "gm82_gmk_reader.h"
#include "gml_frontend.h"
#include "gml_vm.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <math.h>

extern double nor_import_format_native(const char *path);
extern double nor_validate_rom_native(const char *path, double kind);
extern double nor_export_nes_native(const char *project, const char *output);
extern double nor_export_gbc_native(const char *project, const char *output);
extern double nor_export_gba_native(const char *project, const char *output);
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
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);
    int exec_ok = gml_vm_execute(&vm, ast);
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 20.0);

    gml_ast_free(ast);

    /* Test ds_list, ds_map, and INI built-ins */
    const char *code_ds =
        "l = ds_list_create();\n"
        "ds_list_add(l, 100, 200);\n"
        "sz = ds_list_size(l);\n"
        "val = ds_list_find_value(l, 1);\n"
        "ds_list_destroy(l);\n"
        "m = ds_map_create();\n"
        "ds_map_add(m, \"score\", 999);\n"
        "mval = ds_map_find_value(m, \"score\");\n"
        "ds_map_destroy(m);\n"
        "ini_open(\"/tmp/nor_core_tests/save.ini\");\n"
        "ini_write_real(\"player\", \"hp\", 50);\n"
        "hp = ini_read_real(\"player\", \"hp\", 0);\n"
        "ini_close();\n"
        "return sz + val + mval + hp;\n";

    ast = NULL;
    parse_ok = gml_parse_program(code_ds, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);
    exec_ok = gml_vm_execute(&vm, ast);
    assert(exec_ok);
    assert(vm.returned);
    /* sz(2) + val(200) + mval(999) + hp(50) = 1251 */
    assert(vm.return_value.real == 1251.0);

    gml_ast_free(ast);

    /* Test Extended GML Built-ins: math, string_format, ds_list_sort, ds_map_find_first, ds_grid_add, draw_set_color */
    const char *code_ext =
        "s = string_format(3.14159, 6, 2);\n"
        "b1 = string_byte_at(\"ABC\", 1);\n"
        "b_len = string_byte_length(\"ABC\");\n"
        "l2 = ds_list_create();\n"
        "ds_list_add(l2, 50, 10, 30);\n"
        "ds_list_sort(l2, true);\n"
        "first_val = ds_list_find_value(l2, 0);\n"
        "ds_list_destroy(l2);\n"
        "m2 = ds_map_create();\n"
        "ds_map_add(m2, \"alpha\", 1);\n"
        "ds_map_add(m2, \"beta\", 2);\n"
        "fk = ds_map_find_first(m2);\n"
        "nk = ds_map_find_next(m2, \"alpha\");\n"
        "ds_map_destroy(m2);\n"
        "g = ds_grid_create(4, 4);\n"
        "ds_grid_set(g, 1, 1, 10);\n"
        "ds_grid_add(g, 1, 1, 5);\n"
        "grid_val = ds_grid_get(g, 1, 1);\n"
        "grid_exists = ds_grid_value_exists(g, 0, 0, 3, 3, 15);\n"
        "ds_grid_destroy(g);\n"
        "draw_set_color(255);\n"
        "col = draw_get_color();\n"
        "return b1 + b_len + first_val + grid_val + grid_exists + col;\n";

    ast = NULL;
    parse_ok = gml_parse_program(code_ext, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);
    exec_ok = gml_vm_execute(&vm, ast);
    assert(exec_ok);
    assert(vm.returned);
    /* b1(65) + b_len(3) + first_val(10) + grid_val(15) + grid_exists(1) + col(255) = 349 */
    assert(vm.return_value.real == 349.0);

    gml_ast_free(ast);

    printf("[PASS] GML VM Suite\n");
}

void test_extended_gml_suite(void) {
    const char *code_ext =
        "c_str = chr(65);\n"
        "c_ord = ord(c_str);\n"
        "n_real = real(\"123.5\");\n"
        "chk_r = is_real(n_real);\n"
        "chk_s = is_string(c_str);\n"
        "sq_val = sqr(5);\n"
        "col_rgb = make_color_rgb(255, 128, 0);\n"
        "c_red = color_get_red(col_rgb);\n"
        "c_green = color_get_green(col_rgb);\n"
        "c_blue = color_get_blue(col_rgb);\n"
        "c_val = color_get_value(col_rgb);\n"
        "p_dist3d = point_distance_3d(0, 0, 0, 3, 4, 12);\n"
        "d_prod = dot_product(2, 3, 4, 5);\n"
        "l = ds_list_create();\n"
        "ds_list_add(l, 30, 10, 20);\n"
        "ds_list_sort(l, 1);\n"
        "s_val = ds_list_find_value(l, 0);\n"
        "ds_list_destroy(l);\n"
        "m = ds_map_create();\n"
        "ds_map_add(m, \"k1\", 100);\n"
        "ds_map_add(m, \"k2\", 200);\n"
        "f_key = ds_map_find_first(m);\n"
        "has_k = (f_key == \"k1\");\n"
        "ds_map_destroy(m);\n"
 main

    gml_ast *ast = NULL;
    char err[160] = {0};
    int parse_ok = gml_parse_program(code_ext, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm vm;
    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);
    int exec_ok = gml_vm_execute(&vm, ast);
    assert(exec_ok);
    assert(vm.returned);
 main

    gml_ast_free(ast);

    /* Test newly added core functions */
    const char *ext_script = "var w = string_width('hello'); var h = string_height('hello'); var k = keyboard_check(32); var m = mouse_check_button(1); return w + h + (k ? 100 : 0) + (m ? 200 : 0);";
    gml_ast *ext_ast = NULL;
    char ext_err[128] = {0};
    assert(gml_parse_program(ext_script, &ext_ast, ext_err, sizeof(ext_err)));
    gml_vm ext_vm;
    gml_vm_init(&ext_vm);
    gml_vm_set_native_call(&ext_vm, gm82_native_call, NULL);
    assert(gml_vm_execute(&ext_vm, ext_ast));
    assert(ext_vm.returned);
    /* 'hello' length 5 * 8 = 40; height = 16; k=0, m=0 -> total 56 */
    assert(ext_vm.return_value.real == 56.0);
    gml_ast_free(ext_ast);

    printf("[PASS] Extended GML Suite\n");
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
    test_extended_gml_suite();
    test_retro_rom_suite();
    printf("--- All Native Host Tests Passed! ---\n");
    return 0;
}
