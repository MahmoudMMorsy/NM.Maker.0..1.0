#include "gm82_portable_compat.h"
#include <stdint.h>
#include <string.h>

static char token_buffer[65536];
static char token_separator[64];
static char *token_cursor;
static int token_active;

int gm82_portable_dllcheck(void) { return 0; }

double gm82_portable_color_reverse(double color) {
    uint32_t c = (uint32_t)color & 0x00ffffffu;
    uint32_t r = (c >> 16) & 0xffu, g = (c >> 8) & 0xffu, b = c & 0xffu;
    return (double)((b << 16) | (g << 8) | r);
}

double gm82_portable_color_inverse(double color) {
    uint32_t c = (uint32_t)color & 0x00ffffffu;
    return (double)((~c) & 0x00ffffffu);
}

int gm82_portable_token_start(const char *text, const char *separator) {
    if (!text) text = "";
    if (!separator || !*separator) separator = " ";
    strncpy(token_buffer, text, sizeof(token_buffer) - 1);
    token_buffer[sizeof(token_buffer) - 1] = 0;
    strncpy(token_separator, separator, sizeof(token_separator) - 1);
    token_separator[sizeof(token_separator) - 1] = 0;
    token_cursor = token_buffer;
    token_active = 1;
    if (!*token_cursor) return 0;
    int count = 0, in_token = 0;
    for (const char *p = token_buffer; ; ++p) {
        int delim = *p == 0 || strchr(token_separator, *p) != NULL;
        if (!delim && !in_token) { ++count; in_token = 1; }
        if (delim) in_token = 0;
        if (*p == 0) break;
    }
    return count;
}

const char *gm82_portable_token_next(void) {
    static char out[65536];
    if (!token_active || !token_cursor) return "";
    while (*token_cursor && strchr(token_separator, *token_cursor) != NULL) ++token_cursor;
    if (!*token_cursor) { token_active = 0; return ""; }
    char *start = token_cursor;
    while (*token_cursor && strchr(token_separator, *token_cursor) == NULL) ++token_cursor;
    size_t n = (size_t)(token_cursor - start);
    if (n >= sizeof(out)) n = sizeof(out) - 1;
    memcpy(out, start, n); out[n] = 0;
    return out;
}

void gm82_portable_token_reset(void) {
    token_cursor = NULL;
    token_active = 0;
    token_buffer[0] = 0;
}
