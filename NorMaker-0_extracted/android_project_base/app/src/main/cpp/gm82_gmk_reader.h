#ifndef GM82_GMK_READER_H
#define GM82_GMK_READER_H
#include <stddef.h>
#include <stdint.h>
#include "gm82_gmk_format.h"
char *gm82_gmk_resource_manifest_json(const uint8_t *data, size_t size);
gm82_gmk_probe_result gm82_gmk_probe(const uint8_t *data, size_t size);
#endif
