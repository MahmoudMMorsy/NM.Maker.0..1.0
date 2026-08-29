#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include "gm82_gmk_format.h"
#include "gm82_gmk_reader.h"

int main() {
    DIR *dir = opendir("/tmp/GMK8_Examples");
    if (!dir) return 1;
    struct dirent *ent;
    int count = 0;
    int success = 0;

    printf("Parsing all .gmk files in /tmp/GMK8_Examples...\n\n");

    while ((ent = readdir(dir)) != NULL) {
        if (strstr(ent->d_name, ".gmk")) {
            char path[512];
            snprintf(path, sizeof(path), "/tmp/GMK8_Examples/%s", ent->d_name);
            FILE *f = fopen(path, "rb");
            if (!f) continue;
            fseek(f, 0, SEEK_END);
            long sz = ftell(f);
            fseek(f, 0, SEEK_SET);
            uint8_t *buf = malloc(sz);
            fread(buf, 1, sz, f);
            fclose(f);

            count++;
            gm82_gmk_probe_result res = gm82_gmk_probe(buf, sz);
            char *json = gm82_gmk_resource_manifest_json(buf, sz);
            if (res.status != GM82_GMK_PARSE_INVALID && json != NULL) {
                success++;
                printf("[%02d] PASSED: %s (v%d, sz: %ld bytes, json: %zu bytes)\n", count, ent->d_name, res.version, sz, strlen(json));
            } else {
                printf("[%02d] FAILED: %s (err: %s)\n", count, ent->d_name, res.error_code ? res.error_code : "unknown");
            }
            if (json) free(json);
            free(buf);
        }
    }
    closedir(dir);
    printf("\nSUMMARY: Tested %d .gmk projects. Successfully probed & parsed: %d/%d (%.1f%%)\n", count, success, count, (double)success/count*100.0);
    return 0;
}
