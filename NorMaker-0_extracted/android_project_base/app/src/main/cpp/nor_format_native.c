#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <errno.h>
#include <dirent.h>
#include <sys/stat.h>
#include <stdint.h>
#include <time.h>
#include <ctype.h>
#include <zlib.h>

static const char b64[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static char *base64_codes(const unsigned char *src, size_t n) {
    size_t bytes = n * 2;
    size_t out_n = ((bytes + 2) / 3) * 4;
    char *out = (char *)malloc(out_n + 1);
    if (!out) return NULL;
    size_t i = 0, o = 0;
    while (i < bytes) {
        size_t rem = bytes - i;
        unsigned int a = src[i++];
        unsigned int c = rem > 1 ? src[i++] : 0;
        unsigned int d = rem > 2 ? src[i++] : 0;
        unsigned int v = (a << 16) | (c << 8) | d;
        out[o++] = b64[(v >> 18) & 63];
        out[o++] = b64[(v >> 12) & 63];
        out[o++] = rem > 1 ? b64[(v >> 6) & 63] : '=';
        out[o++] = rem > 2 ? b64[v & 63] : '=';
    }
    out[o] = '\0';
    return out;
}

static char *json_escape(const char *s) {
    size_t n = strlen(s), extra = 0;
    for (size_t i = 0; i < n; ++i) if (s[i] == '\\' || s[i] == '"' || s[i] == '\n' || s[i] == '\r' || s[i] == '\t') extra++;
    char *out = (char *)malloc(n + extra + 1);
    if (!out) return NULL;
    size_t j = 0;
    for (size_t i = 0; i < n; ++i) {
        unsigned char c = (unsigned char)s[i];
        if (c == '\\' || c == '"') out[j++] = '\\', out[j++] = (char)c;
        else if (c == '\n') out[j++] = '\\', out[j++] = 'n';
        else if (c == '\r') out[j++] = '\\', out[j++] = 'r';
        else if (c == '\t') out[j++] = '\\', out[j++] = 't';
        else if (c < 0x20) out[j++] = ' ';
        else out[j++] = (char)c;
    }
    out[j] = '\0';
    return out;
}

static int read_source(const char *arg, unsigned char **data, size_t *size) {
    FILE *f = fopen(arg, "rb");
    if (!f) {
        *size = strlen(arg);
        *data = (unsigned char *)malloc(*size ? *size : 1);
        if (!*data) return 0;
        memcpy(*data, arg, *size);
        return 1;
    }
    if (fseek(f, 0, SEEK_END) != 0) { fclose(f); return 0; }
    long len = ftell(f);
    if (len < 0 || fseek(f, 0, SEEK_SET) != 0) { fclose(f); return 0; }
    *size = (size_t)len;
    *data = (unsigned char *)malloc(*size ? *size : 1);
    if (!*data) { fclose(f); return 0; }
    size_t got = fread(*data, 1, *size, f);
    fclose(f);
    if (got != *size) { free(*data); *data = NULL; return 0; }
    return 1;
}

static double write_nor(const char *title_arg, const char *output, const char *magic, int editable) {
    unsigned char *source = NULL;
    size_t source_n = 0;
    if (!read_source(title_arg ? title_arg : "", &source, &source_n)) return 0.0;
    unsigned char *codes = (unsigned char *)malloc(source_n * 2 + 1);
    if (!codes) { free(source); return 0.0; }
    for (size_t i = 0; i < source_n; ++i) {
        codes[i * 2] = source[i];
        codes[i * 2 + 1] = 0;
    }
    char *payload = base64_codes(codes, source_n);
    char *title = json_escape(title_arg ? title_arg : "NOR Maker project");
    if (!payload || !title) { free(source); free(codes); free(payload); free(title); return 0.0; }
    FILE *f = fopen(output, "wb");
    if (!f) { free(source); free(codes); free(payload); free(title); return 0.0; }
    fprintf(f, "NOR:{\"magic\":\"%s\",\"meta\":{\"title\":\"%s\",\"timestamp\":%ld,\"version\":\"9.0\"},\"payload\":\"%s\"%s}\n", magic, title, (long)time(NULL), payload, editable ? ",\"project\":{}" : "");
    int ok = ferror(f) ? 0 : 1;
    fclose(f);
    free(source); free(codes); free(payload); free(title);
    return (double)ok;
}

double nor_export_pnor_native(const char *title, const char *path) { return write_nor(title, path, "PNOR_V1", 1); }
double nor_export_nor_native(const char *title, const char *path) { return write_nor(title, path, "NOR_SEALED_V1", 0); }
double nor_export_json_native(const char *json, const char *path) {
    if (!json || !path) return 0.0;
    FILE *f = fopen(path, "wb");
    if (!f) return 0.0;
    size_t n = strlen(json);
    size_t written = fwrite(json, 1, n, f);
    int ok = (written == n && ferror(f) == 0);
    if (fclose(f) != 0) ok = 0;
    return ok ? 1.0 : 0.0;
}

static int contains_ascii_native(const unsigned char *data, size_t n, const char *needle) {
    if (!data || !needle || !*needle) return 0;
    size_t m = strlen(needle);
    if (m > n) return 0;
    for (size_t i = 0; i + m <= n; ++i) if (memcmp(data + i, needle, m) == 0) return 1;
    return 0;
}

static int valid_gmk_header_native(const unsigned char *head, size_t n) {
    if (!head || n < 8) return 0;
    uint32_t magic = (uint32_t)head[0] | ((uint32_t)head[1] << 8) | ((uint32_t)head[2] << 16) | ((uint32_t)head[3] << 24);
    uint32_t version = (uint32_t)head[4] | ((uint32_t)head[5] << 8) | ((uint32_t)head[6] << 16) | ((uint32_t)head[7] << 24);
    if (magic != 1234321u && magic != 978472782u && magic != 0x32386d67u) return 0;
    return version >= 500u && version <= 900u;
}

double nor_import_format_native(const char *path) {
    FILE *f = fopen(path, "rb");
    if (!f) return 0.0;
    unsigned char head[64] = {0}; size_t n = fread(head, 1, sizeof(head), f); fclose(f);
    if (n >= 4 && memcmp(head, "NOR:", 4) == 0) {
        if (contains_ascii_native(head, n, "PNOR_V1")) return 5.0;
        if (contains_ascii_native(head, n, "NOR_SEALED_V1")) return 4.0;
        return 4.0;
    }
    if (n >= 4 && memcmp(head, "PK\\003\\004", 4) == 0) return 6.0;
    if (n >= 4 && memcmp(head, "NES\032", 4) == 0) return 1.0;
    if (valid_gmk_header_native(head, n)) return 3.0;
    if (n >= 4 && ((head[0] == 'G' || head[0] == 'g') || head[0] == '<')) return 2.0;
    return 0.0;
}
double nor_validate_rom_native(const char *path, double kind) {
    FILE *f = fopen(path, "rb"); if (!f) return 0.0;
    unsigned char h[16] = {0}; size_t n = fread(h, 1, sizeof(h), f); fclose(f);
    if (kind == 1.0) return n >= 16 && memcmp(h, "NES\032", 4) == 0;
    if (kind == 4.0 || kind == 5.0) return n >= 4 && memcmp(h, "NOR:", 4) == 0;
    return n > 0 ? 1.0 : 0.0;
}

static uint16_t zip_read_u16_native(const unsigned char *p) { return (uint16_t)p[0] | ((uint16_t)p[1] << 8); }
static uint32_t zip_read_u32_native(const unsigned char *p) { return (uint32_t)p[0] | ((uint32_t)p[1] << 8) | ((uint32_t)p[2] << 16) | ((uint32_t)p[3] << 24); }

static int zip_inflate_raw_native(const unsigned char *src, size_t src_n, unsigned char *dst, size_t dst_n) {
    if (!src || !dst || src_n > UINT32_MAX || dst_n > UINT32_MAX) return 0;
    z_stream zs; memset(&zs, 0, sizeof(zs));
    if (inflateInit2(&zs, -MAX_WBITS) != Z_OK) return 0;
    zs.next_in = (Bytef *)src; zs.avail_in = (uInt)src_n;
    zs.next_out = dst; zs.avail_out = (uInt)dst_n;
    int rc = inflate(&zs, Z_FINISH);
    int ok = (rc == Z_STREAM_END && zs.total_out == (uLong)dst_n);
    inflateEnd(&zs); return ok;
}

static int mkdir_p_native(const char *path) {
    char tmp[2048]; size_t n = strlen(path); if (n == 0 || n >= sizeof(tmp)) return 0;
    memcpy(tmp, path, n + 1);
    for (char *p = tmp + 1; *p; ++p) {
        if (*p == '/') { *p = 0; mkdir(tmp, 0775); *p = '/'; }
    }
    return mkdir(tmp, 0775) == 0 || errno == EEXIST;
}

static int copy_file_native(const char *source, const char *output) {
    FILE *in = fopen(source, "rb");
    FILE *out = NULL;
    unsigned char buf[8192];
    size_t n;
    int ok = 0;
    if (!in) return 0;
    out = fopen(output, "wb");
    if (!out) { fclose(in); return 0; }
    while ((n = fread(buf, 1, sizeof(buf), in)) > 0) {
        if (fwrite(buf, 1, n, out) != n) { fclose(in); fclose(out); return 0; }
    }
    ok = ferror(in) == 0 && ferror(out) == 0;
    if (fclose(in) != 0 || fclose(out) != 0) ok = 0;
    return ok;
}

double nor_export_gmk_raw_native(const char *source, const char *output) {
    FILE *f;
    unsigned char h[8];
    size_t n;
    if (!source || !output) return 0.0;
    f = fopen(source, "rb");
    if (!f) return 0.0;
    n = fread(h, 1, sizeof(h), f);
    fclose(f);
    if (!valid_gmk_header_native(h, n)) return 0.0;
    return copy_file_native(source, output) ? 1.0 : 0.0;
}

static void xml_write_escaped_native(FILE *f, const char *s) {
    if (!f || !s) return;
    for (; *s; ++s) {
        if (*s == '&') fputs("&amp;", f);
        else if (*s == '<') fputs("&lt;", f);
        else if (*s == '>') fputs("&gt;", f);
        else if (*s == '\"') fputs("&quot;", f);
        else if (*s == '\'') fputs("&apos;", f);
        else fputc((unsigned char)*s, f);
    }
}

static const char *gmx_resource_type_native(const char *name) {
    const char *dot = strrchr(name ? name : "", '.');
    if (!dot) return "file";
    if (strcasecmp(dot, ".gml") == 0) return "script";
    if (strcasecmp(dot, ".png") == 0 || strcasecmp(dot, ".bmp") == 0) return "image";
    if (strcasecmp(dot, ".wav") == 0 || strcasecmp(dot, ".mp3") == 0 || strcasecmp(dot, ".ogg") == 0) return "sound";
    if (strcasecmp(dot, ".gmk") == 0 || strcasecmp(dot, ".gm81") == 0) return "project-binary";
    if (strcasecmp(dot, ".xml") == 0 || strcasecmp(dot, ".gmx") == 0) return "metadata";
    return "file";
}

static int gmx_manifest_walk_native(FILE *f, const char *root, const char *path, int *count) {
    DIR *d;
    struct dirent *ent;
    struct stat st;
    char child[4096];
    const char *rel;
    if (!f || !root || !path || !count || *count >= 4096) return 0;
    d = opendir(path);
    if (!d) return 0;
    while ((ent = readdir(d)) != NULL) {
        if (strcmp(ent->d_name, ".") == 0 || strcmp(ent->d_name, "..") == 0) continue;
        if (snprintf(child, sizeof(child), "%s/%s", path, ent->d_name) < 0) { closedir(d); return 0; }
        if (stat(child, &st) != 0) { closedir(d); return 0; }
        rel = child;
        if (strncmp(child, root, strlen(root)) == 0) {
            rel = child + strlen(root);
            if (*rel == '/') ++rel;
        }
        if (S_ISDIR(st.st_mode)) {
            if (!gmx_manifest_walk_native(f, root, child, count)) { closedir(d); return 0; }
        } else if (S_ISREG(st.st_mode)) {
            fprintf(f, "    <resource type=\""); xml_write_escaped_native(f, gmx_resource_type_native(rel));
            fprintf(f, "\" path=\""); xml_write_escaped_native(f, rel);
            fprintf(f, "\" bytes=\"%llu\"/>\n", (unsigned long long)st.st_size);
            ++*count;
        }
    }
    closedir(d);
    return 1;
}

static void gmx_write_rel_native(FILE *f, const char *rel) {
    if (!f || !rel) return;
    for (const char *p = rel; *p; ++p) fputc(*p == '/' ? '\\' : (unsigned char)*p, f);
}
static const char *gmx_group_tag_native(const char *group) {
    if (strcasecmp(group, "sounds") == 0) return "sound";
    if (strcasecmp(group, "sprites") == 0) return "sprite";
    if (strcasecmp(group, "backgrounds") == 0) return "background";
    if (strcasecmp(group, "paths") == 0) return "path";
    if (strcasecmp(group, "scripts") == 0) return "script";
    if (strcasecmp(group, "fonts") == 0) return "font";
    if (strcasecmp(group, "objects") == 0) return "object";
    if (strcasecmp(group, "rooms") == 0) return "room";
    return "resource";
}
static int gmx_write_group_walk_native(FILE *f, const char *root, const char *path, const char *group, int *count) {
    DIR *d = opendir(path); if (!d) return 1;
    struct dirent *ent; struct stat st; char child[4096];
    const char *tag = gmx_group_tag_native(group);
    while ((ent = readdir(d)) != NULL) {
        if (!strcmp(ent->d_name, ".") || !strcmp(ent->d_name, "..")) continue;
        int n = snprintf(child, sizeof(child), "%s/%s", path, ent->d_name);
        if (n < 0 || (size_t)n >= sizeof(child) || stat(child, &st) != 0) { closedir(d); return 0; }
        if (S_ISDIR(st.st_mode)) {
            if (!gmx_write_group_walk_native(f, root, child, group, count)) { closedir(d); return 0; }
        } else if (S_ISREG(st.st_mode)) {
            const char *rel = child + strlen(root); if (*rel == '/') ++rel;
            fprintf(f, "    <%s>", tag); gmx_write_rel_native(f, rel); fprintf(f, "</%s>\n", tag);
            ++*count;
        }
    }
    closedir(d); return 1;
}
static int gmx_copy_tree_native(const char *source_root, const char *source_path, const char *output_root) {
    struct stat st; if (stat(source_path, &st) != 0) return 0;
    const char *rel = source_path + strlen(source_root); if (*rel == '/') ++rel;
    char outpath[4096];
    if (*rel) { if (snprintf(outpath, sizeof(outpath), "%s/%s", output_root, rel) < 0) return 0; }
    else if (snprintf(outpath, sizeof(outpath), "%s", output_root) < 0) return 0;
    if (S_ISDIR(st.st_mode)) {
        if (!mkdir_p_native(outpath)) return 0;
        DIR *d = opendir(source_path); if (!d) return 0;
        struct dirent *ent; int ok = 1;
        while (ok && (ent = readdir(d)) != NULL) {
            if (!strcmp(ent->d_name, ".") || !strcmp(ent->d_name, "..")) continue;
            char child[4096];
            if (snprintf(child, sizeof(child), "%s/%s", source_path, ent->d_name) < 0) { ok = 0; break; }
            ok = gmx_copy_tree_native(source_root, child, output_root);
        }
        closedir(d); return ok;
    }
    if (!S_ISREG(st.st_mode)) return 1;
    char *slash = strrchr(outpath, '/'); if (slash) { *slash = 0; if (!mkdir_p_native(outpath)) return 0; *slash = '/'; }
    return copy_file_native(source_path, outpath);
}
static int gmx_write_group_native(FILE *f, const char *root, const char *group, int *count) {
    char dir[4096]; struct stat st;
    if (snprintf(dir, sizeof(dir), "%s/%s", root, group) < 0 || stat(dir, &st) != 0 || !S_ISDIR(st.st_mode)) {
        fprintf(f, "  <%s name=\"%s\"/>\n", group, group); return 1;
    }
    fprintf(f, "  <%s name=\"%s\">\n", group, group);
    int ok = gmx_write_group_walk_native(f, root, dir, group, count);
    fprintf(f, "  </%s>\n", group); return ok;
}

double nor_export_gmx_semantic_native(const char *source_dir, const char *output_dir, const char *project_name) {
    struct stat st;
    char manifest[4096];
    FILE *f;
    int count = 0;
    if (!source_dir || !output_dir || !project_name || !*project_name) return 0.0;
    if (stat(source_dir, &st) != 0 || !S_ISDIR(st.st_mode) || !mkdir_p_native(output_dir)) return 0.0;
    if (strcmp(source_dir, output_dir) != 0 && !gmx_copy_tree_native(source_dir, source_dir, output_dir)) return 0.0;
    if (snprintf(manifest, sizeof(manifest), "%s/project.project.gmx", output_dir) < 0) return 0.0;
    f = fopen(manifest, "wb");
    if (!f) return 0.0;
    fputs("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n", f);
    fputs("<!-- NOR Maker semantic GMX export; resource payloads remain source files. -->\n", f);
    fputs("<GMProject name=\"", f); xml_write_escaped_native(f, project_name);
    fputs("\" schema=\"nor-maker.gmx-semantic.v3\">\n  <assets hash=\"\">\n", f);
    fputs("  <Configs name=\"configs\"><Config>Configs\\\\Default</Config></Configs>\n  <NewExtensions/>\n", f);
    const char *groups[] = {"sounds", "sprites", "backgrounds", "paths", "scripts", "fonts", "objects", "rooms"};
    for (size_t i = 0; i < sizeof(groups) / sizeof(groups[0]); ++i) {
        if (!gmx_write_group_native(f, source_dir, groups[i], &count)) { fclose(f); return 0.0; }
    }
    fputs("  <help><rtf>help.rtf</rtf></help>\n  <TutorialState><IsTutorial>0</IsTutorial><TutorialName></TutorialName><TutorialPage>0</TutorialPage></TutorialState>\n  </assets>\n", f);
    fprintf(f, "  <metadata complete=\"false\" fileCount=\"%d\" note=\"Resource-specific asset tree emitted; native per-resource GMX payload schemas and GM8.2 validation remain pending.\"/>\n</GMProject>\n", count);
    if (fclose(f) != 0) return 0.0;
    return count >= 0 ? 1.0 : 0.0;
}

static int zip_safe_name_native(const char *name) {
    if (!name || !*name || name[0] == '/' || strstr(name, "..") != NULL) return 0;
    return 1;
}

double nor_import_gmx_gmz_native(const char *path, const char *output_dir) {
    if (!path || !output_dir) return 0.0;
    FILE *f = fopen(path, "rb"); if (!f) return 0.0;
    if (fseek(f, 0, SEEK_END) != 0) { fclose(f); return 0.0; }
    long end = ftell(f); if (end < 22 || end > 64 * 1024 * 1024) { fclose(f); return 0.0; }
    size_t total = (size_t)end; rewind(f);
    unsigned char *data = (unsigned char *)malloc(total);
    if (!data || fread(data, 1, total, f) != total) { free(data); fclose(f); return 0.0; }
    fclose(f);
    size_t eocd = total - 22; int found = 0;
    for (size_t i = total - 22; i + 4 > 0 && i > (total > 65557 ? total - 65557 : 0); --i) {
        if (zip_read_u32_native(data + i) == 0x06054b50u) { eocd = i; found = 1; break; }
    }
    if (!found) { free(data); return 0.0; }
    uint16_t count = zip_read_u16_native(data + eocd + 10); uint32_t central_size = zip_read_u32_native(data + eocd + 12); uint32_t central_off = zip_read_u32_native(data + eocd + 16);
    if ((uint64_t)central_off + central_size > total || !mkdir_p_native(output_dir)) { free(data); return 0.0; }
    size_t pos = central_off; int extracted = 0;
    for (uint16_t i = 0; i < count; ++i) {
        if (pos + 46 > total || zip_read_u32_native(data + pos) != 0x02014b50u) { free(data); return 0.0; }
        uint16_t method = zip_read_u16_native(data + pos + 10); uint32_t csize = zip_read_u32_native(data + pos + 20); uint32_t usize = zip_read_u32_native(data + pos + 24);
        uint16_t nlen = zip_read_u16_native(data + pos + 28); uint16_t xlen = zip_read_u16_native(data + pos + 30); uint16_t clen = zip_read_u16_native(data + pos + 32); uint32_t local = zip_read_u32_native(data + pos + 42);
        if (pos + 46u + nlen + xlen + clen > total || nlen >= 1024 || (method != 0 && method != 8) || (uint64_t)local + 30 > total) { free(data); return 0.0; }
        char name[1024]; memcpy(name, data + pos + 46, nlen); name[nlen] = 0;
        if (!zip_safe_name_native(name)) { free(data); return 0.0; }
        uint16_t ln = zip_read_u16_native(data + local + 26); uint16_t lx = zip_read_u16_native(data + local + 28); uint64_t payload = (uint64_t)local + 30 + ln + lx;
        if (payload + csize > total || usize > 64u * 1024u * 1024u) { free(data); return 0.0; }
        unsigned char *decoded = NULL;
        if (method == 0) {
            if (csize != usize) { free(data); return 0.0; }
            decoded = (unsigned char *)malloc(usize ? usize : 1);
            if (!decoded || (usize && memcpy(decoded, data + payload, usize) == NULL)) { free(decoded); free(data); return 0.0; }
        } else {
            decoded = (unsigned char *)malloc(usize ? usize : 1);
            if (!decoded) { free(data); return 0.0; }
            if (!zip_inflate_raw_native(data + payload, csize, decoded, usize)) { free(decoded); free(data); return 0.0; }
        }
        char outpath[3072]; int pn = snprintf(outpath, sizeof(outpath), "%s/%s", output_dir, name); if (pn < 0 || (size_t)pn >= sizeof(outpath)) { free(decoded); free(data); return 0.0; }
        char *slash = strrchr(outpath, '/'); if (slash) { *slash = 0; mkdir_p_native(outpath); *slash = '/'; }
        FILE *out = fopen(outpath, "wb"); if (!out || (usize && fwrite(decoded, 1, usize, out) != usize)) { if (out) fclose(out); free(decoded); free(data); return 0.0; }
        free(decoded);
        fclose(out); ++extracted; pos += 46u + nlen + xlen + clen;
    }
    free(data); return extracted == count ? 1.0 : 0.0;
}
typedef struct {
    char name[1024];
    uint32_t crc;
    uint32_t size;
    uint32_t csize;
    uint32_t offset;
    uint16_t method;
} zip_entry_native;

static uint32_t zip_crc32_native(const unsigned char *data, size_t n) {
    uint32_t crc = 0xffffffffu;
    for (size_t i = 0; i < n; ++i) {
        crc ^= data[i];
        for (int b = 0; b < 8; ++b) crc = (crc >> 1) ^ (0xedb88320u & (0u - (crc & 1u)));
    }
    return crc ^ 0xffffffffu;
}

static void zip_u16_native(FILE *f, uint16_t v) { fputc((int)(v & 255u), f); fputc((int)(v >> 8), f); }
static void zip_u32_native(FILE *f, uint32_t v) { zip_u16_native(f, (uint16_t)v); zip_u16_native(f, (uint16_t)(v >> 16)); }

static int zip_deflate_raw_native(const unsigned char *src, size_t src_n, unsigned char *dst, size_t *dst_n) {
    if (!src || !dst || !dst_n || src_n > UINT32_MAX || *dst_n > UINT32_MAX) return 0;
    z_stream zs; memset(&zs, 0, sizeof(zs));
    if (deflateInit2(&zs, Z_BEST_SPEED, Z_DEFLATED, -MAX_WBITS, 8, Z_DEFAULT_STRATEGY) != Z_OK) return 0;
    zs.next_in = (Bytef *)src; zs.avail_in = (uInt)src_n;
    zs.next_out = dst; zs.avail_out = (uInt)*dst_n;
    int rc = deflate(&zs, Z_FINISH);
    if (rc != Z_STREAM_END) { deflateEnd(&zs); return 0; }
    *dst_n = (size_t)zs.total_out;
    deflateEnd(&zs); return 1;
}

static int zip_add_file_native(FILE *out, const char *root, const char *path, zip_entry_native *entries, int *count) {
    if (*count >= 4096) return 0;
    struct stat st;
    if (stat(path, &st) != 0) return 0;
    if (S_ISDIR(st.st_mode)) {
        DIR *d = opendir(path); if (!d) return 0;
        struct dirent *ent; int ok = 1;
        while (ok && (ent = readdir(d)) != NULL) {
            if (strcmp(ent->d_name, ".") == 0 || strcmp(ent->d_name, "..") == 0) continue;
            char child[2048];
            int n = snprintf(child, sizeof(child), "%s/%s", path, ent->d_name);
            if (n < 0 || (size_t)n >= sizeof(child)) { ok = 0; break; }
            ok = zip_add_file_native(out, root, child, entries, count);
        }
        closedir(d); return ok;
    }
    if (!S_ISREG(st.st_mode)) return 1;
    FILE *in = fopen(path, "rb"); if (!in) return 0;
    if (st.st_size < 0 || (uint64_t)st.st_size > 0xffffffffu) { fclose(in); return 0; }
    uint32_t size = (uint32_t)st.st_size;
    unsigned char *buf = size ? (unsigned char *)malloc(size) : NULL;
    if (size && !buf) { fclose(in); return 0; }
    if (size && fread(buf, 1, size, in) != size) { free(buf); fclose(in); return 0; }
    fclose(in);
    const char *rel = path;
    size_t root_len = strlen(root);
    if (strncmp(path, root, root_len) == 0) { rel = path + root_len; if (*rel == '/') ++rel; }
    zip_entry_native *e = &entries[*count];
    size_t rel_len = strlen(rel); if (rel_len == 0 || rel_len >= sizeof(e->name)) { free(buf); return 0; }
    strncpy(e->name, rel, sizeof(e->name) - 1); e->name[sizeof(e->name) - 1] = 0;
    for (char *q = e->name; *q; ++q) if (*q == '\\') *q = '/';
    e->crc = zip_crc32_native(buf, size); e->size = size; e->offset = (uint32_t)ftell(out); e->method = 0; e->csize = size;
    unsigned char *packed = buf;
    if (size > 0) {
        uLongf bound = compressBound((uLong)size);
        unsigned char *candidate = (unsigned char *)malloc((size_t)bound);
        if (candidate) {
            size_t packed_size = (size_t)bound;
            if (zip_deflate_raw_native(buf, size, candidate, &packed_size) && packed_size < size) {
                packed = candidate; e->csize = (uint32_t)packed_size; e->method = 8;
            } else free(candidate);
        }
    }
    zip_u32_native(out, 0x04034b50u); zip_u16_native(out, 20); zip_u16_native(out, 0); zip_u16_native(out, e->method);
    zip_u16_native(out, 0); zip_u16_native(out, 0); zip_u32_native(out, e->crc); zip_u32_native(out, e->csize); zip_u32_native(out, e->size);
    zip_u16_native(out, (uint16_t)strlen(e->name)); zip_u16_native(out, 0); fwrite(e->name, 1, strlen(e->name), out);
    if (e->csize) fwrite(packed, 1, e->csize, out);
    if (packed != buf) free(packed);
    free(buf);
    ++*count;
    return !ferror(out);
}

double nor_export_gmx_gmz_native(const char *source_dir, const char *output, const char *kind) {
    if (!source_dir || !output || !kind) return 0.0;
    if (strcasecmp(kind, "gmx") == 0) {
        char outdir[2048], generated[4096], project[1024];
        const char *base = strrchr(source_dir, '/');
        base = base ? base + 1 : source_dir;
        if (!*base || snprintf(project, sizeof(project), "%s", base) < 0) return 0.0;
        if (snprintf(outdir, sizeof(outdir), "%s", output) < 0) return 0.0;
        char *slash = strrchr(outdir, '/');
        if (slash) *slash = 0; else snprintf(outdir, sizeof(outdir), ".");
        if (!*outdir || !mkdir_p_native(outdir)) return 0.0;
        if (nor_export_gmx_semantic_native(source_dir, outdir, project) == 0.0) return 0.0;
        if (snprintf(generated, sizeof(generated), "%s/project.project.gmx", outdir) < 0) return 0.0;
        if (strcmp(generated, output) == 0) return 1.0;
        return copy_file_native(generated, output) ? 1.0 : 0.0;
    }
    if (strcasecmp(kind, "gmz") != 0) return 0.0;
    struct stat st; if (stat(source_dir, &st) != 0 || !S_ISDIR(st.st_mode)) return 0.0;
    FILE *out = fopen(output, "wb"); if (!out) return 0.0;
    zip_entry_native *entries = (zip_entry_native *)calloc(4096, sizeof(zip_entry_native)); int count = 0;
    int ok = entries && zip_add_file_native(out, source_dir, source_dir, entries, &count);
    uint32_t central = ok ? (uint32_t)ftell(out) : 0;
    for (int i = 0; ok && i < count; ++i) {
        zip_entry_native *e = &entries[i]; size_t nl = strlen(e->name);
        zip_u32_native(out, 0x02014b50u); zip_u16_native(out, 20); zip_u16_native(out, 20); zip_u16_native(out, 0); zip_u16_native(out, e->method);
        zip_u16_native(out, 0); zip_u16_native(out, 0); zip_u32_native(out, e->crc); zip_u32_native(out, e->csize); zip_u32_native(out, e->size);
        zip_u16_native(out, (uint16_t)nl); zip_u16_native(out, 0); zip_u16_native(out, 0); zip_u16_native(out, 0); zip_u16_native(out, 0); zip_u32_native(out, 0); zip_u32_native(out, e->offset); fwrite(e->name, 1, nl, out);
        ok = !ferror(out);
    }
    uint32_t end = (uint32_t)ftell(out); uint32_t central_size = end - central;
    if (ok) { zip_u32_native(out, 0x06054b50u); zip_u16_native(out, 0); zip_u16_native(out, 0); zip_u16_native(out, (uint16_t)count); zip_u16_native(out, (uint16_t)count); zip_u32_native(out, central_size); zip_u32_native(out, central); zip_u16_native(out, 0); ok = !ferror(out); }
    free(entries); if (fclose(out) != 0) ok = 0; return ok ? 1.0 : 0.0;
}
