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

#ifdef HOST_TEST_BUILD
extern int gm82_native_call(void *userdata, const char *name, const gml_value *args, size_t count, gml_value *out);

void test_gml_builtins_suite(void) {
    gml_value args[3];
    gml_value out;

    /* string_length */
    args[0] = gml_value_string("Hello NorMaker");
    assert(gm82_native_call(NULL, "string_length", args, 1, &out));
    assert(out.kind == GML_V_REAL && out.real == 14.0);
    gml_value_free(&args[0]); gml_value_free(&out);

    /* string_copy */
    args[0] = gml_value_string("Hello World");
    args[1] = gml_value_real(1);
    args[2] = gml_value_real(5);
    assert(gm82_native_call(NULL, "string_copy", args, 3, &out));
    assert(out.kind == GML_V_STRING && strcmp(out.string, "Hello") == 0);
    gml_value_free(&args[0]); gml_value_free(&out);

    /* string_pos */
    args[0] = gml_value_string("Nor");
    args[1] = gml_value_string("Hello NorMaker");
    assert(gm82_native_call(NULL, "string_pos", args, 2, &out));
    assert(out.kind == GML_V_REAL && out.real == 7.0);
    gml_value_free(&args[0]); gml_value_free(&args[1]); gml_value_free(&out);

    /* is_real & is_string */
    args[0] = gml_value_real(42.0);
    assert(gm82_native_call(NULL, "is_real", args, 1, &out));
    assert(out.kind == GML_V_BOOL && out.boolean == 1);
    gml_value_free(&out);
    assert(gm82_native_call(NULL, "is_string", args, 1, &out));
    assert(out.kind == GML_V_BOOL && out.boolean == 0);
    gml_value_free(&out);

    printf("[PASS] GML Built-ins Suite\n");
}
#endif

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
#ifdef HOST_TEST_BUILD
    test_gml_builtins_suite();
#endif
    test_retro_rom_suite();
    printf("--- All Native Host Tests Passed! ---\n");
    return 0;
}
