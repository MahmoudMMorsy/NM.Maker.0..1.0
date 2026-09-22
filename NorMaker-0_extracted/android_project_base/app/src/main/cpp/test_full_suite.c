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
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); }
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
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); }
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
        "return sz * 100 + val;\n";

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
    assert(vm.return_value.real == 220.0); /* 2*100 + 20 = 220 */

    gml_ast_free(ast);

    printf("[PASS] Data Structures Suite\n");
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
    if (!exec_ok) { printf("VM Error: %s\n", vm.error); }
    assert(exec_ok);
    assert(vm.returned);
    assert(vm.return_value.real == 500.0);

    gml_ast_free(ast);

    printf("[PASS] INI Files Suite\n");
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
    test_ini_files_suite();
    test_retro_rom_suite();
    printf("--- All Native Host Tests Passed! ---\n");
    return 0;
}
