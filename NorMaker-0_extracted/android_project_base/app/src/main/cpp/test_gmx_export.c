#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <assert.h>

extern double nor_import_format_native(const char *path);

int main() {
    /* Test on dummy empty file */
    const char *dummy_path = "/tmp/nor_core_tests/test.gmk";
    FILE *f = fopen(dummy_path, "wb");
    if (f) {
        uint8_t header[12] = {0x91, 0xd5, 0x12, 0x00, 0x20, 0x03, 0x00, 0x00, 0x7b, 0x00, 0x00, 0x00};
        fwrite(header, 1, 12, f);
        fclose(f);
    }

    double res = nor_import_format_native(dummy_path);
    printf("Import format result for dummy GMK: %.0f\n", res);
    assert(res == 3.0); // 3 = GMK format detected

    printf("GMX/GMZ format import test passed!\n");
    return 0;
}
