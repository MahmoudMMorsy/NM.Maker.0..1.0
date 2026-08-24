#include "gml_frontend.h"
#include "gml_vm.h"
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>

int main() {
    const char *code =
        "a = 10;\n"
        "b = 20;\n"
        "if (a < b) {\n"
        "    return a + b * 2;\n"
        "}\n"
        "return 0;\n";

    gml_ast *ast = NULL;
    char err[160] = {0};
    int ok = gml_parse_program(code, &ast, err, sizeof(err));
    if (!ok) {
        printf("Parse error: %s\n", err);
        return 1;
    }

    gml_vm vm;
    gml_vm_init(&vm);
    int exec_ok = gml_vm_execute(&vm, ast);
    if (!exec_ok) {
        printf("Exec error: %s\n", vm.error);
        gml_ast_free(ast);
        return 1;
    }

    printf("Returned: %d, Kind: %d, Val: %.2f\n", vm.returned, vm.return_value.kind, vm.return_value.real);
    assert(vm.returned == 1);
    assert(vm.return_value.kind == GML_V_REAL);
    assert(vm.return_value.real == 50.0);

    gml_ast_free(ast);
    printf("GML Exec test passed successfully!\n");
    return 0;
}
