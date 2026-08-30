#include "gm82_gmk_reader.h"
#include "gml_frontend.h"
#include "gml_vm.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

extern double nor_import_format_native(const char *path);
extern double nor_validate_rom_native(const char *path, double kind);
extern double nor_export_nes_native(const char *project, const char *output);
extern double nor_export_gbc_native(const char *project, const char *output);
extern double nor_export_gba_native(const char *project, const char *output);

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

extern int gm82_native_call(void *userdata, const char *name, const gml_value *args, size_t count, gml_value *out);

void test_gml_builtins_suite(void) {
    gml_value args[4];
    gml_value out;

    // Test point_distance(0, 0, 3, 4) == 5.0
    args[0] = gml_value_real(0.0);
    args[1] = gml_value_real(0.0);
    args[2] = gml_value_real(3.0);
    args[3] = gml_value_real(4.0);
    assert(gm82_native_call(NULL, "point_distance", args, 4, &out) == 1);
    assert(out.kind == GML_V_REAL && out.real == 5.0);

    // Test point_direction(0, 0, 0, -10) == 90.0
    args[0] = gml_value_real(0.0);
    args[1] = gml_value_real(0.0);
    args[2] = gml_value_real(0.0);
    args[3] = gml_value_real(-10.0);
    assert(gm82_native_call(NULL, "point_direction", args, 4, &out) == 1);
    assert(out.kind == GML_V_REAL && out.real == 90.0);

    // Test string_length("Hello") == 5
    args[0] = gml_value_string("Hello");
    assert(gm82_native_call(NULL, "string_length", args, 1, &out) == 1);
    assert(out.kind == GML_V_REAL && out.real == 5.0);

    // Test string_copy("NorMaker", 1, 3) == "Nor"
    args[0] = gml_value_string("NorMaker");
    args[1] = gml_value_real(1.0);
    args[2] = gml_value_real(3.0);
    assert(gm82_native_call(NULL, "string_copy", args, 3, &out) == 1);
    assert(out.kind == GML_V_STRING && strcmp(out.string, "Nor") == 0);
    gml_value_free(&out);

    // Test string_pos("Maker", "NorMaker") == 4
    args[0] = gml_value_string("Maker");
    args[1] = gml_value_string("NorMaker");
    assert(gm82_native_call(NULL, "string_pos", args, 2, &out) == 1);
    assert(out.kind == GML_V_REAL && out.real == 4.0);

    // Test string_upper, string_lower, string_count, is_string, is_real
    args[0] = gml_value_string("NorMaker");
    assert(gm82_native_call(NULL, "string_upper", args, 1, &out) == 1);
    assert(out.kind == GML_V_STRING && strcmp(out.string, "NORMAKER") == 0);
    gml_value_free(&out);

    args[0] = gml_value_string("NorMaker");
    assert(gm82_native_call(NULL, "string_lower", args, 1, &out) == 1);
    assert(out.kind == GML_V_STRING && strcmp(out.string, "normaker") == 0);
    gml_value_free(&out);

    args[0] = gml_value_string("a");
    args[1] = gml_value_string("banana");
    assert(gm82_native_call(NULL, "string_count", args, 2, &out) == 1);
    assert(out.kind == GML_V_REAL && out.real == 3.0);

    args[0] = gml_value_string("text");
    assert(gm82_native_call(NULL, "is_string", args, 1, &out) == 1);
    assert(out.kind == GML_V_BOOL && out.boolean == 1);

    args[0] = gml_value_real(123.45);
    assert(gm82_native_call(NULL, "is_real", args, 1, &out) == 1);
    assert(out.kind == GML_V_BOOL && out.boolean == 1);

    // Test ds_list functions
    assert(gm82_native_call(NULL, "ds_list_create", NULL, 0, &out) == 1);
    double list_id = out.real;
    assert(list_id > 0);

    args[0] = gml_value_real(list_id);
    args[1] = gml_value_string("Item1");
    assert(gm82_native_call(NULL, "ds_list_add", args, 2, &out) == 1);

    args[0] = gml_value_real(list_id);
    assert(gm82_native_call(NULL, "ds_list_size", args, 1, &out) == 1);
    assert(out.kind == GML_V_REAL && out.real == 1.0);

    args[0] = gml_value_real(list_id);
    args[1] = gml_value_real(0.0);
    assert(gm82_native_call(NULL, "ds_list_find_value", args, 2, &out) == 1);
    assert(out.kind == GML_V_STRING && strcmp(out.string, "Item1") == 0);
    gml_value_free(&out);

    args[0] = gml_value_real(list_id);
    assert(gm82_native_call(NULL, "ds_list_destroy", args, 1, &out) == 1);

    // Test ds_map functions
    assert(gm82_native_call(NULL, "ds_map_create", NULL, 0, &out) == 1);
    double map_id = out.real;
    assert(map_id > 0);

    args[0] = gml_value_real(map_id);
    args[1] = gml_value_string("score");
    args[2] = gml_value_real(100.0);
    assert(gm82_native_call(NULL, "ds_map_add", args, 3, &out) == 1);

    args[0] = gml_value_real(map_id);
    args[1] = gml_value_string("score");
    assert(gm82_native_call(NULL, "ds_map_find_value", args, 2, &out) == 1);
    assert(out.kind == GML_V_REAL && out.real == 100.0);

    args[0] = gml_value_real(map_id);
    assert(gm82_native_call(NULL, "ds_map_destroy", args, 1, &out) == 1);

    // Test ds_grid functions
    args[0] = gml_value_real(10.0);
    args[1] = gml_value_real(10.0);
    assert(gm82_native_call(NULL, "ds_grid_create", args, 2, &out) == 1);
    double grid_id = out.real;
    assert(grid_id > 0);

    args[0] = gml_value_real(grid_id);
    args[1] = gml_value_real(2.0);
    args[2] = gml_value_real(3.0);
    args[3] = gml_value_real(42.0);
    assert(gm82_native_call(NULL, "ds_grid_set", args, 4, &out) == 1);

    args[0] = gml_value_real(grid_id);
    args[1] = gml_value_real(2.0);
    args[2] = gml_value_real(3.0);
    assert(gm82_native_call(NULL, "ds_grid_get", args, 3, &out) == 1);
    assert(out.kind == GML_V_REAL && out.real == 42.0);

    args[0] = gml_value_real(grid_id);
    assert(gm82_native_call(NULL, "ds_grid_destroy", args, 1, &out) == 1);

    printf("[PASS] GML Built-ins Suite\n");
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
    test_gml_builtins_suite();
    test_retro_rom_suite();
    printf("--- All Native Host Tests Passed! ---\n");
    return 0;
}
