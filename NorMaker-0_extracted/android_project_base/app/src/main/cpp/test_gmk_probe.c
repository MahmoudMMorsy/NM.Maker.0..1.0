#include "gm82_gmk_reader.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

int main() {
    uint8_t dummy[1024];
    memset(dummy, 0, sizeof(dummy));
    /* GMK header magic: 1234321 (0x0012d591), version: 800, app_id: 123 */
    dummy[0] = 0x91; dummy[1] = 0xd5; dummy[2] = 0x12; dummy[3] = 0x00; // 1234321
    dummy[4] = 0x20; dummy[5] = 0x03; dummy[6] = 0x00; dummy[7] = 0x00; // 800
    dummy[8] = 0x7b; dummy[9] = 0x00; dummy[10] = 0x00; dummy[11] = 0x00; // 123

    gm82_gmk_probe_result probe = gm82_gmk_probe(dummy, sizeof(dummy));
    printf("Probe status: %d, format_kind: %d, magic: %d, version: %d, app_id: %d\n",
           probe.status, probe.format_kind, probe.magic, probe.version, probe.app_id);
    assert(probe.status == GM82_GMK_PARSE_PARTIAL);
    assert(probe.format_kind == GM82_GMK_FORMAT_GM7_GM8);
    assert(probe.magic == 1234321);
    assert(probe.version == 800);
    assert(probe.app_id == 123);

    printf("GMK Probe test passed successfully!\n");
    return 0;
}
