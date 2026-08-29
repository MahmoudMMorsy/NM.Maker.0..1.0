#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "gm82_gmk_format.h"
#include "gm82_gmk_reader.h"

int main() {
    FILE *f = fopen("/tmp/GMK8_Examples/metalslug.gmk", "rb");
    if (!f) { printf("Failed to open metalslug.gmk\n"); return 1; }
    fseek(f, 0, SEEK_END);
    long sz = ftell(f);
    fseek(f, 0, SEEK_SET);
    uint8_t *buf = malloc(sz);
    size_t rd = fread(buf, 1, sz, f);
    fclose(f);

    printf("Read %zu bytes from metalslug.gmk\n", rd);

    gm82_gmk_probe_result res = gm82_gmk_probe(buf, sz);
    printf("Metalslug.gmk Probe Result: format_kind=%d, status=%d, version=%d, error_code=%s\n",
           res.format_kind, res.status, res.version, res.error_code ? res.error_code : "none");

    char *json = gm82_gmk_resource_manifest_json(buf, sz);
    if (json) {
        printf("Manifest JSON length: %zu\n", strlen(json));
        printf("Snippet:\n%.1000s\n...\n", json);
        free(json);
    } else {
        printf("Manifest JSON returned NULL\n");
    }
    free(buf);
    return 0;
}
