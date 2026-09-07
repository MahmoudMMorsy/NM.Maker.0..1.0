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

    /* Test extended GML core built-ins (math, string, vector, ds, and input) */
    const char *code_ext =
        "dp = dot_product(3, 4, 3, 4);\n"
        "d3 = point_distance_3d(0, 0, 0, 3, 4, 12);\n"
        "sf = string_format(12.345, 6, 2);\n"
        "sb = string_byte_at(\"ABC\", 1);\n"
        "l2 = ds_list_create();\n"
        "ds_list_add(l2, 50, 10, 30);\n"
        "ds_list_sort(l2, 1);\n"
        "s_val = ds_list_find_value(l2, 0);\n"
        "ds_list_destroy(l2);\n"
        "m2 = ds_map_create();\n"
        "ds_map_add(m2, \"k1\", 10);\n"
        "ds_map_add(m2, \"k2\", 20);\n"
        "fk = ds_map_find_first(m2);\n"
        "nk = ds_map_find_next(m2, fk);\n"
        "ds_map_destroy(m2);\n"
        "g2 = ds_grid_create(4, 4);\n"
        "ds_grid_set(g2, 1, 1, 99);\n"
        "gmax = ds_grid_get_max(g2, 0, 0, 3, 3);\n"
        "ds_grid_destroy(g2);\n"
        "kc = keyboard_clear(32);\n"
        "return dp + d3 + sb + s_val + gmax;\n";

    ast = NULL;
    parse_ok = gml_parse_program(code_ext, &ast, err, sizeof(err));
    assert(parse_ok);

    gml_vm_init(&vm);
    gml_vm_set_native_call(&vm, gm82_native_call, NULL);
    exec_ok = gml_vm_execute(&vm, ast);
    assert(exec_ok);
    assert(vm.returned);
    /* dp(25) + d3(13) + sb(65) + s_val(10) + gmax(99) = 212 */
    assert(vm.return_value.real == 212.0);

    gml_ast_free(ast);

    printf("[PASS] GML VM Suite\n");
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
    test_retro_rom_suite();
    printf("--- All Native Host Tests Passed! ---\n");
    return 0;
}
