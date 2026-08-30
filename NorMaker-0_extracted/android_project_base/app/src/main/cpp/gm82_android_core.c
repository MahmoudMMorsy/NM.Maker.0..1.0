#include <jni.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <math.h>
#include <sys/stat.h>
#include <errno.h>

#ifndef HOST_TEST_BUILD
#include <android/bitmap.h>
#else
typedef struct {
    uint32_t width;
    uint32_t height;
    uint32_t stride;
    int32_t format;
    uint32_t flags;
} AndroidBitmapInfo;
#define ANDROID_BITMAP_RESULT_SUCCESS 0
#define ANDROID_BITMAP_FORMAT_RGBA_8888 1
static inline int AndroidBitmap_getInfo(JNIEnv *env, jobject jbmp, AndroidBitmapInfo *info) { (void)env; (void)jbmp; (void)info; return -1; }
static inline int AndroidBitmap_lockPixels(JNIEnv *env, jobject jbmp, void **pixels) { (void)env; (void)jbmp; (void)pixels; return -1; }
static inline int AndroidBitmap_unlockPixels(JNIEnv *env, jobject jbmp) { (void)env; (void)jbmp; return -1; }
#endif
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <math.h>
#include <sys/stat.h>
#include <errno.h>
#include "gml_frontend.h"
#include "gml_vm.h"
#include "gm82_portable_compat.h"
#include "gm82_gmk_reader.h"

extern double nor_export_nes_native(const char*, const char*);
extern double nor_export_gbc_native(const char*, const char*);
extern double nor_export_gba_native(const char*, const char*);
extern double nor_export_pnor_native(const char*, const char*);
extern double nor_export_nor_native(const char*, const char*);
extern double nor_export_json_native(const char*, const char*);
extern double nor_validate_rom_native(const char*, double);
extern double nor_import_format_native(const char*);
extern double nor_import_gmx_gmz_native(const char*, const char*);
extern double nor_export_gmx_gmz_native(const char*, const char*, const char*);
extern double nor_export_gmk_raw_native(const char*, const char*);
extern double nor_export_gmx_semantic_native(const char*, const char*, const char*);

JNIEXPORT jstring JNICALL Java_com_normaker_nativefull_MainActivity_nativeGmkResourceManifest(JNIEnv *env, jobject self, jbyteArray bytes) {
    (void)self;
    if (!bytes) return (*env)->NewStringUTF(env, "{\"ok\":false,\"error\":\"null_input\"}");
    jsize size = (*env)->GetArrayLength(env, bytes);
    jbyte *raw = (*env)->GetByteArrayElements(env, bytes, NULL);
    if (!raw || size <= 0) { if (raw) (*env)->ReleaseByteArrayElements(env, bytes, raw, JNI_ABORT); return (*env)->NewStringUTF(env, "{\"ok\":false,\"error\":\"invalid_input\"}"); }
    char *manifest = gm82_gmk_resource_manifest_json((const uint8_t *)raw, (size_t)size);
    (*env)->ReleaseByteArrayElements(env, bytes, raw, JNI_ABORT);
    if (!manifest) return (*env)->NewStringUTF(env, "{\"ok\":false,\"error\":\"invalid_or_unsupported_gmk\"}");
    jstring result = (*env)->NewStringUTF(env, manifest);
    free(manifest);
    return result;
}

#define GM82_MAX_RESOURCE_REGISTRY 8192
#define GM82_RESOURCE_NAME_CAP 192
typedef struct {
    int kind;
    int id;
    int width;
    int height;
    int frames;
    char name[GM82_RESOURCE_NAME_CAP];
} gm82_resource_entry;
static gm82_resource_entry g_resource_registry[GM82_MAX_RESOURCE_REGISTRY];
static int g_resource_registry_count = 0;

#define GM82_MAX_OBJECT_EVENTS 8192
#define GM82_EVENT_SOURCE_CAP 8192
typedef struct {
    int active;
    int object_id;
    int main_type;
    int sub_type;
    char source[GM82_EVENT_SOURCE_CAP];
} gm82_object_event;
static gm82_object_event g_object_events[GM82_MAX_OBJECT_EVENTS];
static int g_object_event_count = 0;

#define GM82_MAX_OBJECT_NAMES 2048
#define GM82_OBJECT_NAME_CAP 192
typedef struct { int active; int object_id; char name[GM82_OBJECT_NAME_CAP]; } gm82_object_name_entry;
static gm82_object_name_entry g_object_names[GM82_MAX_OBJECT_NAMES];
static int g_object_name_count = 0;
static void gm82_object_names_clear(void) { memset(g_object_names, 0, sizeof(g_object_names)); g_object_name_count = 0; }
static int gm82_object_name_register(int object_id, const char *name) {
    if (object_id < 0 || !name || !*name) return 0;
    for (int i = 0; i < g_object_name_count; ++i) {
        if (g_object_names[i].active && g_object_names[i].object_id == object_id) {
            snprintf(g_object_names[i].name, sizeof(g_object_names[i].name), "%s", name);
            return 1;
        }
    }
    if (g_object_name_count >= GM82_MAX_OBJECT_NAMES) return 0;
    gm82_object_name_entry *entry = &g_object_names[g_object_name_count++];
    entry->active = 1; entry->object_id = object_id;
    snprintf(entry->name, sizeof(entry->name), "%s", name);
    return 1;
}
static int gm82_resolve_name(void *userdata, const char *name, gml_value *out) {
    (void)userdata;
    if (!name || !out) return 0;
    for (int i = 0; i < g_object_name_count; ++i) {
        if (g_object_names[i].active && !strcmp(g_object_names[i].name, name)) {
            *out = gml_value_real((double)g_object_names[i].object_id);
            return 1;
        }
    }
    return 0;
}

#define GM82_DS_MAX 256
#define GM82_DS_CAP 256
#define GM82_DS_KEY_CAP 128
typedef struct { int active; size_t count; gml_value items[GM82_DS_CAP]; } gm82_ds_list;
typedef struct { int active; size_t count; char keys[GM82_DS_CAP][GM82_DS_KEY_CAP]; gml_value values[GM82_DS_CAP]; } gm82_ds_map;
static gm82_ds_list g_ds_lists[GM82_DS_MAX];
static gm82_ds_map g_ds_maps[GM82_DS_MAX];
#define GM82_GRID_MAX 128
#define GM82_GRID_DIM 64
typedef struct { int active; int width; int height; gml_value cells[GM82_GRID_DIM * GM82_GRID_DIM]; } gm82_ds_grid;
static gm82_ds_grid g_ds_grids[GM82_GRID_MAX];
static void gm82_ds_clear(void) {
    for (int i = 0; i < GM82_DS_MAX; ++i) {
        for (size_t j = 0; j < g_ds_lists[i].count; ++j) gml_value_free(&g_ds_lists[i].items[j]);
        for (size_t j = 0; j < g_ds_maps[i].count; ++j) gml_value_free(&g_ds_maps[i].values[j]);
    }
    for (int i = 0; i < GM82_GRID_MAX; ++i) for (int j = 0; j < GM82_GRID_DIM * GM82_GRID_DIM; ++j) gml_value_free(&g_ds_grids[i].cells[j]);
    memset(g_ds_lists, 0, sizeof(g_ds_lists)); memset(g_ds_maps, 0, sizeof(g_ds_maps)); memset(g_ds_grids, 0, sizeof(g_ds_grids));
}
static int gm82_ds_handle(const gml_value *v) { return v && v->kind == GML_V_REAL ? (int)v->real : 0; }
static int gm82_ds_equal(const gml_value *a, const gml_value *b) {
    if (!a || !b) return 0;
    if (a->kind == GML_V_STRING || b->kind == GML_V_STRING) return !strcmp(a->string ? a->string : "", b->string ? b->string : "");
    if (a->kind == GML_V_BOOL || b->kind == GML_V_BOOL || a->kind == GML_V_REAL || b->kind == GML_V_REAL) {
        double av = a->kind == GML_V_BOOL ? a->boolean : a->real, bv = b->kind == GML_V_BOOL ? b->boolean : b->real; return av == bv;
    }
    return a->kind == b->kind;
}
static const char *gm82_ds_key(const gml_value *v) { return v && v->kind == GML_V_STRING && v->string ? v->string : ""; }

#define GM82_MAX_SCRIPTS 2048
#define GM82_SCRIPT_NAME_CAP 192
#define GM82_SCRIPT_SOURCE_CAP 65536
typedef struct {
    int active;
    char name[GM82_SCRIPT_NAME_CAP];
    char source[GM82_SCRIPT_SOURCE_CAP];
} gm82_script_entry;
static gm82_script_entry g_scripts[GM82_MAX_SCRIPTS];
static int g_script_count = 0;

static void gm82_script_clear(void) {
    memset(g_scripts, 0, sizeof(g_scripts));
    g_script_count = 0;
}

static int gm82_script_register(const char *name, const char *source) {
    if (!name || !*name || !source) return 0;
    for (int i = 0; i < g_script_count; ++i) {
        if (g_scripts[i].active && !strcmp(g_scripts[i].name, name)) {
            snprintf(g_scripts[i].source, sizeof(g_scripts[i].source), "%s", source);
            return 1;
        }
    }
    if (g_script_count >= GM82_MAX_SCRIPTS) return 0;
    gm82_script_entry *entry = &g_scripts[g_script_count++];
    entry->active = 1;
    snprintf(entry->name, sizeof(entry->name), "%s", name);
    snprintf(entry->source, sizeof(entry->source), "%s", source);
    return 1;
}

static void gm82_event_clear(void) {
    memset(g_object_events, 0, sizeof(g_object_events));
    g_object_event_count = 0;
}

static int gm82_event_register(int object_id, int main_type, int sub_type, const char *source) {
    if (g_object_event_count >= GM82_MAX_OBJECT_EVENTS || object_id < 0) return 0;
    gm82_object_event *event = &g_object_events[g_object_event_count++];
    event->active = 1;
    event->object_id = object_id;
    event->main_type = main_type;
    event->sub_type = sub_type;
    if (source) {
        strncpy(event->source, source, GM82_EVENT_SOURCE_CAP - 1);
        event->source[GM82_EVENT_SOURCE_CAP - 1] = 0;
    }
    return 1;
}

static void gm82_resource_clear(void) {
    memset(g_resource_registry, 0, sizeof(g_resource_registry));
    g_resource_registry_count = 0;
}

static int gm82_resource_register(int kind, int id, const char *name, int width, int height, int frames) {
    if (g_resource_registry_count >= GM82_MAX_RESOURCE_REGISTRY || id < 0) return 0;
    gm82_resource_entry *entry = &g_resource_registry[g_resource_registry_count++];
    entry->kind = kind;
    entry->id = id;
    entry->width = width > 0 ? width : 0;
    entry->height = height > 0 ? height : 0;
    entry->frames = frames > 0 ? frames : 0;
    if (name) {
        strncpy(entry->name, name, GM82_RESOURCE_NAME_CAP - 1);
        entry->name[GM82_RESOURCE_NAME_CAP - 1] = 0;
    }
    return 1;
}

static int32_t read_i32_le(const uint8_t *p) {
    return (int32_t)((uint32_t)p[0] | ((uint32_t)p[1] << 8) |
                     ((uint32_t)p[2] << 16) | ((uint32_t)p[3] << 24));
}

static int valid_gmk_header(const uint8_t *data, size_t size, int32_t *magic, int32_t *version) {
    gm82_gmk_probe_result probe = gm82_gmk_probe(data, size);
    if (probe.status == GM82_GMK_PARSE_INVALID) return 0;
    if (magic) *magic = probe.magic;
    if (version) *version = probe.version;
    return 1;
}

JNIEXPORT jstring JNICALL Java_com_normaker_nativefull_MainActivity_nativeEvaluateGml(JNIEnv *env, jobject self, jstring source) {
    (void)self;
    if (!source) return (*env)->NewStringUTF(env, "{\"ok\":false,\"error\":\"null source\"}");
    const char *raw = (*env)->GetStringUTFChars(env, source, NULL);
    if (!raw) return (*env)->NewStringUTF(env, "{\"ok\":false,\"error\":\"unavailable source\"}");
    gml_ast *root = NULL; char parse_error[160] = {0};
    int parsed = gml_parse_program(raw, &root, parse_error, sizeof parse_error);
    if (!parsed) {
        (*env)->ReleaseStringUTFChars(env, source, raw);
        char json[240]; snprintf(json, sizeof json, "{\"ok\":false,\"stage\":\"parse\",\"error\":\"%s\"}", parse_error);
        return (*env)->NewStringUTF(env, json);
    }
    gml_vm vm; gml_vm_init(&vm); int ok = gml_vm_execute(&vm, root);
    char json[320];
    if (!ok) snprintf(json, sizeof json, "{\"ok\":false,\"stage\":\"execute\",\"error\":\"%s\"}", vm.error);
    else snprintf(json, sizeof json, "{\"ok\":true,\"variables\":%d,\"returned\":%s,\"return\":%.17g}", (int)vm.count, vm.returned ? "true" : "false", vm.return_value.kind == GML_V_REAL ? vm.return_value.real : 0.0);
    gml_ast_free(root); gml_value_free(&vm.return_value);
    for (size_t i = 0; i < vm.count; ++i) gml_value_free(&vm.vars[i].value);
    (*env)->ReleaseStringUTFChars(env, source, raw);
    return (*env)->NewStringUTF(env, json);
}

JNIEXPORT jstring JNICALL Java_com_normaker_nativefull_MainActivity_nativeCoreIdentity(JNIEnv *env, jobject self) {
    (void)self;
    return (*env)->NewStringUTF(env, "GM82 Android Native Core / JNI foundation v1");
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeValidateGmk(JNIEnv *env, jobject self, jbyteArray bytes) {
    (void)self;
    if (!bytes) return JNI_FALSE;
    jsize size = (*env)->GetArrayLength(env, bytes);
    jbyte *raw = (*env)->GetByteArrayElements(env, bytes, NULL);
    if (!raw) return JNI_FALSE;
    int ok = valid_gmk_header((const uint8_t *)raw, (size_t)size, NULL, NULL);
    (*env)->ReleaseByteArrayElements(env, bytes, raw, JNI_ABORT);
    return ok ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jstring JNICALL Java_com_normaker_nativefull_MainActivity_nativeGmkHeaderJson(JNIEnv *env, jobject self, jbyteArray bytes) {
    (void)self;
    if (!bytes) return (*env)->NewStringUTF(env, "{\"valid\":false,\"reason\":\"null\"}");
    jsize size = (*env)->GetArrayLength(env, bytes);
    jbyte *raw = (*env)->GetByteArrayElements(env, bytes, NULL);
    if (!raw) return (*env)->NewStringUTF(env, "{\"valid\":false,\"reason\":\"unavailable\"}");
    int32_t magic = 0, version = 0;
    int ok = valid_gmk_header((const uint8_t *)raw, (size_t)size, &magic, &version);
    (*env)->ReleaseByteArrayElements(env, bytes, raw, JNI_ABORT);
    char json[160];
    if (!ok) snprintf(json, sizeof(json), "{\"valid\":false,\"bytes\":%d}", (int)size);
    else snprintf(json, sizeof(json), "{\"valid\":true,\"magic\":%d,\"version\":%d,\"bytes\":%d}", (int)magic, (int)version, (int)size);
    return (*env)->NewStringUTF(env, json);
}

#include <zlib.h>

static int read_u32_at(const uint8_t *data, size_t size, size_t *offset, uint32_t *out) {
    if (!data || !offset || !out || *offset + 4 > size) return 0;
    *out = (uint32_t)read_i32_le(data + *offset);
    *offset += 4;
    return 1;
}

JNIEXPORT jstring JNICALL Java_com_normaker_nativefull_MainActivity_nativeGmkLayoutJson(JNIEnv *env, jobject self, jbyteArray bytes) {
    (void)self;
    if (!bytes) return (*env)->NewStringUTF(env, "{\"valid\":false,\"reason\":\"null\"}");
    jsize size = (*env)->GetArrayLength(env, bytes);
    jbyte *raw = (*env)->GetByteArrayElements(env, bytes, NULL);
    if (!raw) return (*env)->NewStringUTF(env, "{\"valid\":false,\"reason\":\"unavailable\"}");
    const uint8_t *data = (const uint8_t *)raw;
    size_t off = 0;
    uint32_t magic = 0, version = 0, app_id = 0, settings_version = 0, compressed = 0;
    int ok = read_u32_at(data, (size_t)size, &off, &magic) && read_u32_at(data, (size_t)size, &off, &version);
    if (ok && magic != 1234321u && magic != 978472782u && magic != 0x32386d67u) ok = 0;
    if (ok) {
        ok = read_u32_at(data, (size_t)size, &off, &app_id);
        for (int i = 0; ok && i < 4; ++i) { uint32_t ignored = 0; ok = read_u32_at(data, (size_t)size, &off, &ignored); }
        ok = ok && read_u32_at(data, (size_t)size, &off, &settings_version);
    }
    size_t chunk_offset = off;
    int inflated = 0;
    if (ok && settings_version >= 800 && read_u32_at(data, (size_t)size, &off, &compressed)) {
        if (compressed == 0) inflated = 0;
        else if (compressed <= 50u * 1024u * 1024u && off + compressed <= (size_t)size) {
            const uint8_t *src = data + off;
            if (compressed > 2 && src[0] == 0x78) {
                uLongf target = compressed * 8u + 1024u;
                if (target > 64u * 1024u * 1024u) target = 64u * 1024u * 1024u;
                uint8_t *dst = (uint8_t *)malloc((size_t)target);
                if (dst) {
                    int z = uncompress(dst, &target, src, (uLong)compressed);
                    if (z == Z_OK) inflated = (int)target;
                    free(dst);
                }
            } else inflated = (int)compressed;
        }
    }
    char json[240];
    if (!ok) snprintf(json, sizeof(json), "{\"valid\":false,\"bytes\":%d}", (int)size);
    else snprintf(json, sizeof(json), "{\"valid\":true,\"magic\":%u,\"version\":%u,\"appId\":%u,\"settingsVersion\":%u,\"settingsOffset\":%d,\"compressedBytes\":%u,\"inflatedBytes\":%d}", magic, version, app_id, settings_version, (int)chunk_offset, compressed, inflated);
    (*env)->ReleaseByteArrayElements(env, bytes, raw, JNI_ABORT);
    return (*env)->NewStringUTF(env, json);
}

JNIEXPORT jstring JNICALL Java_com_normaker_nativefull_MainActivity_nativeImportGmkSnapshot(JNIEnv *env, jobject self, jbyteArray bytes, jstring output_dir) {
    (void)self;
    if (!bytes || !output_dir) return (*env)->NewStringUTF(env, "{\"ok\":false,\"error\":\"null_input\"}");
    jsize size = (*env)->GetArrayLength(env, bytes);
    jbyte *raw = (*env)->GetByteArrayElements(env, bytes, NULL);
    const char *dir = (*env)->GetStringUTFChars(env, output_dir, NULL);
    if (!raw || !dir || size < 8) {
        if (raw) (*env)->ReleaseByteArrayElements(env, bytes, raw, JNI_ABORT);
        if (dir) (*env)->ReleaseStringUTFChars(env, output_dir, dir);
        return (*env)->NewStringUTF(env, "{\"ok\":false,\"error\":\"invalid_input\"}");
    }
    int32_t magic = 0, version = 0;
    int valid = valid_gmk_header((const uint8_t *)raw, (size_t)size, &magic, &version);
    char raw_path[1024], ir_path[1024];
    snprintf(raw_path, sizeof(raw_path), "%s/project.gmk.raw", dir);
    snprintf(ir_path, sizeof(ir_path), "%s/project.gmk.ir.json", dir);
    char *manifest = valid ? gm82_gmk_resource_manifest_json((const uint8_t *)raw, (size_t)size) : NULL;
    FILE *rf = valid ? fopen(raw_path, "wb") : NULL;
    FILE *jf = valid ? fopen(ir_path, "wb") : NULL;
    int ok = valid && rf && jf && manifest;
    if (ok && fwrite(raw, 1, (size_t)size, rf) != (size_t)size) ok = 0;
    if (rf) fclose(rf);
    if (ok) {
        fprintf(jf, "{\"schema\":\"nor-maker.gmk-ir.v2\",\"format\":\"GMK\",\"complete\":false,\"rawFile\":\"project.gmk.raw\",\"bytes\":%d,\"magic\":%d,\"version\":%d,\"decodedManifest\":", (int)size, (int)magic, (int)version);
        if (fputs(manifest, jf) == EOF || fputs(",\"warnings\":[\"binary payloads are preserved; semantic writer and full resource materialization remain pending\"]}\n", jf) == EOF) ok = 0;
    }
    int decoded = manifest != NULL;
    if (jf) fclose(jf);
    free(manifest);
    (*env)->ReleaseByteArrayElements(env, bytes, raw, JNI_ABORT);
    (*env)->ReleaseStringUTFChars(env, output_dir, dir);
    char result[320];
    snprintf(result, sizeof(result), "{\"ok\":%s,\"complete\":false,\"format\":\"GMK\",\"rawFile\":\"%s\",\"irFile\":\"%s\",\"bytes\":%d,\"decoded\":%s}", ok ? "true" : "false", ok ? raw_path : "", ok ? ir_path : "", (int)size, decoded ? "true" : "false");
    return (*env)->NewStringUTF(env, result);
}

#define GM82_MAX_INSTANCES 256
#define GM82_MAX_SPRITE_BITMAPS 256
#define GM82_MAX_SPRITE_PIXELS (4096u * 4096u)
#define GM82_MAX_COLLISIONS 1024
#define GM82_MAX_CODE_POINTS 2048
#define GM82_CODE_SOURCE_MAX 8192

typedef struct {
    int active;
    int sprite_id;
    int frame;
    int width;
    int height;
    size_t bytes;
    uint8_t *rgba;
} Gm82SpriteBitmap;

typedef struct {
    int active;
    unsigned char create_dispatched;
    unsigned char destroy_dispatching;
    int id;
    int object_id;
    int layer_id;
    int sprite_id;
    int sprite_width;
    int sprite_height;
    int sprite_subimages;
    float x;
    float y;
    float vx;
    float vy;
    float speed;
    float direction;
    int frame;
    int alarms[12];
} Gm82Instance;

typedef struct {
    int a;
    int b;
} Gm82CollisionPair;

typedef struct {
    int initialized;
    int active;
    int width;
    int height;
    unsigned long long tick;
    int room_id;
    unsigned char room_started;
    int next_id;
    Gm82Instance instances[GM82_MAX_INSTANCES];
    unsigned char keys[256];
    unsigned char key_pressed[256];
    Gm82SpriteBitmap bitmaps[GM82_MAX_SPRITE_BITMAPS];
    Gm82CollisionPair collisions[GM82_MAX_COLLISIONS];
    int collision_count;
} Gm82Runtime;

static Gm82Runtime g_runtime;
static int gm82_execute_subset(Gm82Instance *it, const char *code);
static void gm82_dispatch_destroy_event(Gm82Instance *it);
static void gm82_dispatch_other_event(int subtype);
static void gm82_runtime_clear_room_transient(void);
#define GM82_MAX_DRAW_COMMANDS 2048
typedef struct { int sprite_id; int frame; float x; float y; float alpha; } Gm82DrawCommand;
static Gm82DrawCommand g_draw_commands[GM82_MAX_DRAW_COMMANDS];
static int g_draw_command_count = 0;
static float g_draw_alpha = 1.0f;
static void gm82_draw_clear(void) { g_draw_command_count = 0; g_draw_alpha = 1.0f; memset(g_draw_commands, 0, sizeof(g_draw_commands)); }
#define GM82_MAX_SOUND_COMMANDS 256
typedef struct { int kind; int sound_id; int loop; float volume; } Gm82SoundCommand;
static Gm82SoundCommand g_sound_commands[GM82_MAX_SOUND_COMMANDS];
static int g_sound_command_count = 0;
static float g_sound_volume = 1.0f;
static void gm82_sound_clear(void) { g_sound_command_count = 0; g_sound_volume = 1.0f; memset(g_sound_commands, 0, sizeof(g_sound_commands)); }
static void gm82_sound_push(int kind, int sound_id, int loop, float volume) { if (g_sound_command_count >= GM82_MAX_SOUND_COMMANDS) return; Gm82SoundCommand *c = &g_sound_commands[g_sound_command_count++]; c->kind = kind; c->sound_id = sound_id; c->loop = loop; c->volume = volume; }

typedef struct {
    int active;
    int argc;
    char source[GM82_CODE_SOURCE_MAX];
} Gm82CodePoint;

static Gm82CodePoint g_code_points[GM82_MAX_CODE_POINTS];
static int g_code_point_count = 0;

static void gm82_free_sprite_bitmaps(void) {
    for (int i = 0; i < GM82_MAX_SPRITE_BITMAPS; ++i) {
        free(g_runtime.bitmaps[i].rgba);
        memset(&g_runtime.bitmaps[i], 0, sizeof(g_runtime.bitmaps[i]));
    }
}

static void gm82_runtime_release(void) {
    gm82_free_sprite_bitmaps();
    gm82_ds_clear();
    gm82_script_clear();
    gm82_event_clear();
    gm82_object_names_clear();
    gm82_resource_clear();
    memset(g_code_points, 0, sizeof(g_code_points));
    g_code_point_count = 0;
    gm82_draw_clear();
    gm82_sound_clear();
    memset(&g_runtime, 0, sizeof(g_runtime));
}

static Gm82SpriteBitmap *gm82_find_bitmap(int sprite_id, int frame) {
    for (int i = 0; i < GM82_MAX_SPRITE_BITMAPS; ++i) {
        Gm82SpriteBitmap *bitmap = &g_runtime.bitmaps[i];
        if (bitmap->active && bitmap->sprite_id == sprite_id && bitmap->frame == frame) return bitmap;
    }
    return NULL;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeCreate(JNIEnv *env, jobject self, jint width, jint height) {
    (void)env; (void)self;
    gm82_runtime_release();
    g_runtime.initialized = 1;
    g_runtime.width = width > 0 ? width : 640;
    g_runtime.height = height > 0 ? height : 480;
    g_runtime.next_id = 1;
    return JNI_TRUE;
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeDestroy(JNIEnv *env, jobject self) {
    (void)env; (void)self;
    gm82_runtime_release();
}

static Gm82Instance *gm82_find_instance(int id);

static char *gm82_trim_statement(char *text) {
    while (*text && (isspace((unsigned char)*text) || *text == '{' || *text == '}')) text++;
    size_t length = strlen(text);
    while (length > 0 && (isspace((unsigned char)text[length - 1]) || text[length - 1] == '{' || text[length - 1] == '}')) text[--length] = 0;
    return text;
}

static int gm82_read_value(Gm82Instance *it, const char *token, float *out) {
    if (!it || !token || !out) return 0;
    if (strcmp(token, "x") == 0) *out = it->x;
    else if (strcmp(token, "y") == 0) *out = it->y;
    else if (strcmp(token, "hspeed") == 0) *out = it->vx;
    else if (strcmp(token, "vspeed") == 0) *out = it->vy;
    else if (strcmp(token, "speed") == 0) *out = it->speed;
    else if (strcmp(token, "direction") == 0) *out = it->direction;
    else {
        char *end = NULL;
        *out = strtof(token, &end);
        if (end == token || *end != 0) return 0;
    }
    return 1;
}

static int gm82_write_value(Gm82Instance *it, const char *name, float value) {
    if (strcmp(name, "x") == 0) it->x = value;
    else if (strcmp(name, "y") == 0) it->y = value;
    else if (strcmp(name, "hspeed") == 0) it->vx = value;
    else if (strcmp(name, "vspeed") == 0) it->vy = value;
    else if (strcmp(name, "speed") == 0) it->speed = value;
    else if (strcmp(name, "direction") == 0) it->direction = value;
    else return 0;
    return 1;
}

typedef struct {
    const char *cursor;
    Gm82Instance *instance;
    int ok;
} Gm82ExprParser;

static void gm82_expr_skip(Gm82ExprParser *parser) {
    while (parser->cursor && isspace((unsigned char)*parser->cursor)) parser->cursor++;
}

static float gm82_expr_primary(Gm82ExprParser *parser) {
    gm82_expr_skip(parser);
    if (!parser->cursor || !*parser->cursor) { parser->ok = 0; return 0.0f; }
    if (*parser->cursor == '(') {
        parser->cursor++;
        float value = gm82_expr_primary(parser);
        gm82_expr_skip(parser);
        if (*parser->cursor != ')') parser->ok = 0;
        else parser->cursor++;
        return value;
    }
    if (*parser->cursor == '+' || *parser->cursor == '-') {
        char sign = *parser->cursor++;
        float value = gm82_expr_primary(parser);
        return sign == '-' ? -value : value;
    }
    char token[64];
    size_t length = 0;
    while (parser->cursor[length] && (isalnum((unsigned char)parser->cursor[length]) || parser->cursor[length] == '_' || parser->cursor[length] == '.')) {
        if (length + 1 < sizeof(token)) token[length] = parser->cursor[length];
        length++;
    }
    if (length == 0 || length >= sizeof(token)) { parser->ok = 0; return 0.0f; }
    token[length] = 0;
    parser->cursor += length;
    float value = 0.0f;
    if (!gm82_read_value(parser->instance, token, &value)) parser->ok = 0;
    return value;
}

static float gm82_expr_factor(Gm82ExprParser *parser) {
    float value = gm82_expr_primary(parser);
    for (;;) {
        gm82_expr_skip(parser);
        char op = *parser->cursor;
        if (op != '*' && op != '/') break;
        parser->cursor++;
        float rhs = gm82_expr_primary(parser);
        if (op == '*') value *= rhs;
        else if (rhs != 0.0f) value /= rhs;
    }
    return value;
}

static float gm82_expr_term(Gm82ExprParser *parser) {
    float value = gm82_expr_factor(parser);
    for (;;) {
        gm82_expr_skip(parser);
        char op = *parser->cursor;
        if (op != '+' && op != '-') break;
        parser->cursor++;
        float rhs = gm82_expr_factor(parser);
        if (op == '+') value += rhs;
        else value -= rhs;
    }
    return value;
}

static int gm82_eval_expression(Gm82Instance *it, const char *source, float *out) {
    if (!it || !source || !out) return 0;
    Gm82ExprParser parser = { source, it, 1 };
    *out = gm82_expr_term(&parser);
    gm82_expr_skip(&parser);
    if (*parser.cursor != 0) parser.ok = 0;
    return parser.ok;
}

static int gm82_eval_condition(Gm82Instance *it, const char *condition) {
    char lhs[32] = {0};
    char op[3] = {0};
    char rhs[64] = {0};
    if (sscanf(condition, " %31s %2s %63s", lhs, op, rhs) != 3) return 0;
    float leftValue = 0.0f;
    float rightValue = 0.0f;
    if (!gm82_read_value(it, lhs, &leftValue) || !gm82_read_value(it, rhs, &rightValue)) return 0;
    if (strcmp(op, "==") == 0) return leftValue == rightValue;
    if (strcmp(op, "!=") == 0) return leftValue != rightValue;
    if (strcmp(op, ">") == 0) return leftValue > rightValue;
    if (strcmp(op, "<") == 0) return leftValue < rightValue;
    if (strcmp(op, ">=") == 0) return leftValue >= rightValue;
    if (strcmp(op, "<=") == 0) return leftValue <= rightValue;
    return 0;
}

static int gm82_spawn_instance_layer(int object_id, int layer_id, float x, float y) {
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        Gm82Instance *spawned = &g_runtime.instances[i];
        if (spawned->active) continue;
        memset(spawned, 0, sizeof(*spawned));
        spawned->active = 1;
        spawned->id = g_runtime.next_id++;
        spawned->object_id = object_id;
        spawned->layer_id = layer_id;
        spawned->sprite_id = -1;
        for (int r = 0; r < g_resource_registry_count; ++r) {
            if (g_resource_registry[r].kind == 2 && g_resource_registry[r].id == object_id) {
                spawned->sprite_id = g_resource_registry[r].id;
                break;
            }
        }
        spawned->sprite_width = 16;
        spawned->sprite_height = 16;
        spawned->sprite_subimages = 1;
        spawned->x = x;
        spawned->y = y;
        return spawned->id;
    }
        return -1;
}
static int gm82_spawn_instance(int object_id, float x, float y) {
    return gm82_spawn_instance_layer(object_id, -1, x, y);
}
static int gm82_execute_statement(Gm82Instance *it, char *statement) {
    if (!it || !it->active || !statement) return 0;
    statement = gm82_trim_statement(statement);
    if (*statement == 0 || strncmp(statement, "//", 2) == 0) return 0;
    int executed = 0;
    float value = 0.0f;
    if (strncmp(statement, "if", 2) == 0 && (statement[2] == ' ' || statement[2] == '(')) {
        char condition[96] = {0};
        char action[160] = {0};
        if (sscanf(statement, "if (%95[^)]) %159[^\\n]", condition, action) == 2 && gm82_eval_condition(it, condition)) {
            return gm82_execute_statement(it, action);
        }
        return 0;
    }
    char lhs[32] = {0};
    char op[3] = {0};
    char rhs[64] = {0};
    if (sscanf(statement, "%31s %2s %63s", lhs, op, rhs) == 3) {
        float rhsValue = 0.0f;
        float currentValue = 0.0f;
        if (gm82_eval_expression(it, rhs, &rhsValue) && gm82_read_value(it, lhs, &currentValue)) {
            float result = rhsValue;
            if (strcmp(op, "+=") == 0) result = currentValue + rhsValue;
            else if (strcmp(op, "-=") == 0) result = currentValue - rhsValue;
            else if (strcmp(op, "*=") == 0) result = currentValue * rhsValue;
            else if (strcmp(op, "/=") == 0) result = rhsValue == 0.0f ? currentValue : currentValue / rhsValue;
            else if (strcmp(op, "=") != 0) result = currentValue;
            if (strcmp(op, "=") == 0 || strcmp(op, "+=") == 0 || strcmp(op, "-=") == 0 || strcmp(op, "*=") == 0 || strcmp(op, "/=") == 0) executed = gm82_write_value(it, lhs, result);
        }
    }
    else if (strncmp(statement, "setgravity", 10) == 0 && sscanf(statement, "setgravity(%f", &value) == 1) { it->vy += value; executed = 1; }
    else if (strncmp(statement, "instance_create", 16) == 0) {
        float spawn_x = 0.0f, spawn_y = 0.0f;
        int object_id = -1;
        if (sscanf(statement, "instance_create(%f,%f,%d)", &spawn_x, &spawn_y, &object_id) == 3 || sscanf(statement, "instance_create( %f , %f , %d )", &spawn_x, &spawn_y, &object_id) == 3) {
            executed = gm82_spawn_instance(object_id, spawn_x, spawn_y) >= 0;
        }
    }
    else if (strncmp(statement, "move_towards_point", 19) == 0) {
        float target_x = 0.0f, target_y = 0.0f, move_speed = 0.0f;
        if (sscanf(statement, "move_towards_point(%f,%f,%f)", &target_x, &target_y, &move_speed) == 3 || sscanf(statement, "move_towards_point( %f , %f , %f )", &target_x, &target_y, &move_speed) == 3) {
            float dx = target_x - it->x;
            float dy = target_y - it->y;
            float length = sqrtf(dx * dx + dy * dy);
            if (length > 0.0001f) { it->vx = dx / length * move_speed; it->vy = dy / length * move_speed; }
            executed = 1;
        }
    }
    else if (strncmp(statement, "instance_destroy", 16) == 0) { gm82_dispatch_destroy_event(it); executed = 1; }
    else if (strncmp(statement, "move_wrap", 9) == 0) {
        if (g_runtime.width > 0) { while (it->x < 0) it->x += g_runtime.width; while (it->x >= g_runtime.width) it->x -= g_runtime.width; }
        if (g_runtime.height > 0) { while (it->y < 0) it->y += g_runtime.height; while (it->y >= g_runtime.height) it->y -= g_runtime.height; }
        executed = 1;
    }
    return executed;
}

static int gm82_member_get(void *userdata, const char *member, gml_value *out);
static int gm82_member_set(void *userdata, const char *member, const gml_value *value);
int gm82_native_call(void *userdata, const char *name, const gml_value *args, size_t count, gml_value *out);
static int gm82_with_call(void *userdata, gml_vm *vm, const gml_value *target, const gml_ast *body);
static int gm82_script_call(void *userdata, const char *name, const gml_value *args, size_t count, gml_value *out);

static int gm82_with_call(void *userdata, gml_vm *vm, const gml_value *target, const gml_ast *body) { Gm82Instance *caller = (Gm82Instance *)userdata; (void)caller; if (!vm || !target || !body) return 0; int needle = target->kind == GML_V_REAL ? (int)target->real : -1; int ran = 0; for (int i=0;i<GM82_MAX_INSTANCES;i++){ Gm82Instance *it=&g_runtime.instances[i]; if(!it->active) continue; if(it->id!=needle && it->object_id!=needle) continue; void *old_userdata=vm->member_userdata; gml_member_get old_get=vm->member_get; gml_member_set old_set=vm->member_set; gml_native_call old_native=vm->native_call; void *old_native_data=vm->native_userdata; vm->member_userdata=it; vm->member_get=gm82_member_get; vm->member_set=gm82_member_set; vm->native_userdata=it; (void)old_native; (void)old_native_data; gml_vm_execute(vm,body); vm->member_userdata=old_userdata; vm->member_get=old_get; vm->member_set=old_set; vm->native_call=old_native; vm->native_userdata=old_native_data; ran=1; if(!it->active) continue; } return ran; }

static int gm82_member_get(void *userdata, const char *member, gml_value *out) { Gm82Instance *it = (Gm82Instance *)userdata; if (!it || !member || !out) return 0; if (!strcmp(member,"x")) *out=gml_value_real(it->x); else if (!strcmp(member,"y")) *out=gml_value_real(it->y); else if (!strcmp(member,"hspeed")) *out=gml_value_real(it->vx); else if (!strcmp(member,"vspeed")) *out=gml_value_real(it->vy); else if (!strcmp(member,"speed")) *out=gml_value_real(it->speed); else if (!strcmp(member,"direction")) *out=gml_value_real(it->direction); else if (!strcmp(member,"image_index")) *out=gml_value_real(it->frame); else if (!strcmp(member,"object_index")) *out=gml_value_real(it->object_id); else if (!strcmp(member,"sprite_index")) *out=gml_value_real(it->sprite_id); else if (!strcmp(member,"id")) *out=gml_value_real(it->id); else return 0; return 1; }
static int gm82_member_set(void *userdata, const char *member, const gml_value *value) { Gm82Instance *it = (Gm82Instance *)userdata; if (!it || !member || !value) return 0; float v = value->kind == GML_V_REAL ? (float)value->real : (value->kind == GML_V_BOOL ? (float)value->boolean : 0.0f); if (!strcmp(member,"x")) it->x=v; else if (!strcmp(member,"y")) it->y=v; else if (!strcmp(member,"hspeed")) it->vx=v; else if (!strcmp(member,"vspeed")) it->vy=v; else if (!strcmp(member,"speed")) it->speed=v; else if (!strcmp(member,"direction")) it->direction=v; else if (!strcmp(member,"image_index")) it->frame=(int)v; else return 0; return 1; }

static int gm82_script_call(void *userdata, const char *name, const gml_value *args, size_t count, gml_value *out) {
    Gm82Instance *self = (Gm82Instance *)userdata;
    if (!name || !out) return 0;
    const gm82_script_entry *entry = NULL;
    for (int i = 0; i < g_script_count; ++i) {
        if (g_scripts[i].active && !strcmp(g_scripts[i].name, name)) { entry = &g_scripts[i]; break; }
    }
    if (!entry) return 0;
    gml_ast *root = NULL; char error[160] = {0};
    if (!gml_parse_program(entry->source, &root, error, sizeof(error))) return 0;
    gml_vm child; gml_vm_init(&child);
    if (self) {
        gml_vm_set(&child, "x", gml_value_real(self->x));
        gml_vm_set(&child, "y", gml_value_real(self->y));
        gml_vm_set(&child, "hspeed", gml_value_real(self->vx));
        gml_vm_set(&child, "vspeed", gml_value_real(self->vy));
    }
    for (size_t i = 0; i < count && i < 16; ++i) {
        char arg_name[16]; snprintf(arg_name, sizeof(arg_name), "arg%zu", i);
        gml_vm_set(&child, arg_name, args[i]);
    }
    gml_vm_set_native_call(&child, gm82_native_call, self);
    gml_vm_set_name_resolver(&child, gm82_resolve_name, self);
    gml_vm_set_member_callbacks(&child, gm82_member_get, gm82_member_set, self);
    gml_vm_set_with_callback(&child, gm82_with_call, self);
    gml_vm_set_script_call(&child, gm82_script_call, self);
    int ok = gml_vm_execute(&child, root);
    if (ok && self) {
        gml_value v = gml_vm_get(&child, "x"); if (v.kind == GML_V_REAL) self->x = (float)v.real; gml_value_free(&v);
        v = gml_vm_get(&child, "y"); if (v.kind == GML_V_REAL) self->y = (float)v.real; gml_value_free(&v);
        v = gml_vm_get(&child, "hspeed"); if (v.kind == GML_V_REAL) self->vx = (float)v.real; gml_value_free(&v);
        v = gml_vm_get(&child, "vspeed"); if (v.kind == GML_V_REAL) self->vy = (float)v.real; gml_value_free(&v);
    }
    if (ok) {
        if (!child.returned) *out = gml_value_real(0);
        else if (child.return_value.kind == GML_V_STRING) *out = gml_value_string(child.return_value.string ? child.return_value.string : "");
        else if (child.return_value.kind == GML_V_BOOL) *out = gml_value_bool(child.return_value.boolean);
        else if (child.return_value.kind == GML_V_REAL) *out = gml_value_real(child.return_value.real);
        else *out = gml_value_real(0);
    }
    for (size_t i = 0; i < child.count; ++i) gml_value_free(&child.vars[i].value);
    gml_value_free(&child.return_value); gml_ast_free(root);
    return ok;
}

static int gm82_instance_matches(const Gm82Instance *other, const Gm82Instance *self, int object_id) {
    return other && other->active && other != self && (object_id < 0 || other->object_id == object_id);
}
static int gm82_instance_overlaps_rect(const Gm82Instance *other, float left, float top, float right, float bottom) {
    if (!other || !other->active) return 0;
    float hw = other->sprite_width > 0 ? other->sprite_width * 0.5f : 8.0f;
    float hh = other->sprite_height > 0 ? other->sprite_height * 0.5f : 8.0f;
    float other_left = other->x - hw, other_right = other->x + hw;
    float other_top = other->y - hh, other_bottom = other->y + hh;
    return other_left < right && other_right > left && other_top < bottom && other_bottom > top;
}
static int gm82_instance_overlaps_circle(const Gm82Instance *other, float cx, float cy, float radius) {
    if (!other || !other->active || radius < 0.0f) return 0;
    float hw = other->sprite_width > 0 ? other->sprite_width * 0.5f : 8.0f;
    float hh = other->sprite_height > 0 ? other->sprite_height * 0.5f : 8.0f;
    float left = other->x - hw, right = other->x + hw;
    float top = other->y - hh, bottom = other->y + hh;
    float closest_x = cx < left ? left : (cx > right ? right : cx);
    float closest_y = cy < top ? top : (cy > bottom ? bottom : cy);
    float dx = cx - closest_x, dy = cy - closest_y;
    return (dx * dx + dy * dy) <= radius * radius;
}
static int gm82_mask_pixel_opaque(const Gm82SpriteBitmap *bitmap, int x, int y) {
    if (!bitmap || !bitmap->rgba || x < 0 || y < 0 || x >= bitmap->width || y >= bitmap->height) return 0;
    return bitmap->rgba[((size_t)y * (size_t)bitmap->width + (size_t)x) * 4u + 3u] >= 8u;
}
static int gm82_instance_mask_overlaps_rect(const Gm82Instance *other, float left, float top, float right, float bottom) {
    if (!other || !other->active) return 0;
    Gm82SpriteBitmap *bitmap = gm82_find_bitmap(other->sprite_id, other->frame < 0 ? 0 : other->frame);
    if (!bitmap || bitmap->width <= 0 || bitmap->height <= 0) return gm82_instance_overlaps_rect(other, left, top, right, bottom);
    float origin_x = other->x - bitmap->width * 0.5f, origin_y = other->y - bitmap->height * 0.5f;
    int x0 = (int)floorf(left - origin_x), x1 = (int)ceilf(right - origin_x);
    int y0 = (int)floorf(top - origin_y), y1 = (int)ceilf(bottom - origin_y);
    if (x0 < 0) x0 = 0; if (y0 < 0) y0 = 0;
    if (x1 > bitmap->width) x1 = bitmap->width; if (y1 > bitmap->height) y1 = bitmap->height;
    for (int y = y0; y < y1; ++y) for (int x = x0; x < x1; ++x) if (gm82_mask_pixel_opaque(bitmap, x, y)) return 1;
    return 0;
}
static int gm82_instance_mask_overlaps_circle(const Gm82Instance *other, float cx, float cy, float radius) {
    if (!other || !other->active || radius < 0.0f) return 0;
    Gm82SpriteBitmap *bitmap = gm82_find_bitmap(other->sprite_id, other->frame < 0 ? 0 : other->frame);
    if (!bitmap || bitmap->width <= 0 || bitmap->height <= 0) return gm82_instance_overlaps_circle(other, cx, cy, radius);
    float origin_x = other->x - bitmap->width * 0.5f, origin_y = other->y - bitmap->height * 0.5f, r2 = radius * radius;
    for (int y = 0; y < bitmap->height; ++y) for (int x = 0; x < bitmap->width; ++x) if (gm82_mask_pixel_opaque(bitmap, x, y)) {
        float px = origin_x + x + 0.5f, py = origin_y + y + 0.5f, dx = px - cx, dy = py - cy;
        if (dx * dx + dy * dy <= r2) return 1;
    }
    return 0;
}
int gm82_native_call(void *userdata, const char *name, const gml_value *args, size_t count, gml_value *out) {
    Gm82Instance *self = (Gm82Instance *)userdata;
    if (!name || !out) return 0;
    if (!strcmp(name, "__gm82core_dllcheck") && count == 0) { *out = gml_value_real(gm82_portable_dllcheck()); return 1; }
    if (!strcmp(name, "color_reverse") && count == 1) { double value = args[0].kind == GML_V_REAL ? args[0].real : 0.0; *out = gml_value_real(gm82_portable_color_reverse(value)); return 1; }
    if (!strcmp(name, "color_inverse") && count == 1) { double value = args[0].kind == GML_V_REAL ? args[0].real : 0.0; *out = gml_value_real(gm82_portable_color_inverse(value)); return 1; }
    if (!strcmp(name, "string_token_start") && count >= 2) { const char *text = args[0].kind == GML_V_STRING ? args[0].string : ""; const char *separator = args[1].kind == GML_V_STRING ? args[1].string : ""; *out = gml_value_real((double)gm82_portable_token_start(text, separator)); return 1; }
    if (!strcmp(name, "string_token_next") && count == 0) { *out = gml_value_string(gm82_portable_token_next()); return 1; }
    if (!strcmp(name, "string_token_reset") && count == 0) { gm82_portable_token_reset(); *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "sound_play") && count >= 1) { int sid = (int)(args[0].kind == GML_V_REAL ? args[0].real : -1); gm82_sound_push(1, sid, 0, g_sound_volume); *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "sound_loop") && count >= 1) { int sid = (int)(args[0].kind == GML_V_REAL ? args[0].real : -1); gm82_sound_push(1, sid, 1, g_sound_volume); *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "sound_stop") && count >= 1) { int sid = (int)(args[0].kind == GML_V_REAL ? args[0].real : -1); gm82_sound_push(2, sid, 0, g_sound_volume); *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "sound_set_volume") && count >= 2) { int sid = (int)(args[0].kind == GML_V_REAL ? args[0].real : -1); float v = (float)(args[1].kind == GML_V_REAL ? args[1].real : 1.0); if (v < 0) v = 0; if (v > 1) v = 1; g_sound_volume = v; gm82_sound_push(3, sid, 0, v); *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "draw_set_alpha") && count == 1) { float a = (float)(args[0].kind == GML_V_REAL ? args[0].real : 1.0); if (a < 0.0f) a = 0.0f; if (a > 1.0f) a = 1.0f; g_draw_alpha = a; *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "draw_sprite") && count == 4) { if (g_draw_command_count < GM82_MAX_DRAW_COMMANDS) { Gm82DrawCommand *cmd = &g_draw_commands[g_draw_command_count++]; cmd->sprite_id = (int)(args[0].kind == GML_V_REAL ? args[0].real : -1); cmd->frame = (int)(args[1].kind == GML_V_REAL ? args[1].real : 0); cmd->x = (float)(args[2].kind == GML_V_REAL ? args[2].real : 0); cmd->y = (float)(args[3].kind == GML_V_REAL ? args[3].real : 0); cmd->alpha = g_draw_alpha; } *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "ds_list_create") && count == 0) {
        for (int i = 0; i < GM82_DS_MAX; ++i) if (!g_ds_lists[i].active) { g_ds_lists[i].active = 1; g_ds_lists[i].count = 0; *out = gml_value_real((double)(i + 1)); return 1; }
        *out = gml_value_real(-1); return 1;
    }
    if (!strcmp(name, "ds_list_destroy") && count == 1) {
        int id = gm82_ds_handle(&args[0]) - 1; if (id >= 0 && id < GM82_DS_MAX && g_ds_lists[id].active) { for (size_t i = 0; i < g_ds_lists[id].count; ++i) gml_value_free(&g_ds_lists[id].items[i]); memset(&g_ds_lists[id], 0, sizeof(g_ds_lists[id])); }
        *out = gml_value_bool(1); return 1;
    }
    if (!strcmp(name, "ds_list_add") && count >= 2) {
        int id = gm82_ds_handle(&args[0]) - 1; if (id >= 0 && id < GM82_DS_MAX && g_ds_lists[id].active) { for (size_t i = 1; i < count && g_ds_lists[id].count < GM82_DS_CAP; ++i) { g_ds_lists[id].items[g_ds_lists[id].count++] = args[i].kind == GML_V_STRING ? gml_value_string(args[i].string) : (args[i].kind == GML_V_BOOL ? gml_value_bool(args[i].boolean) : gml_value_real(args[i].real)); } }
        *out = gml_value_bool(1); return 1;
    }
    if (!strcmp(name, "ds_list_size") && count == 1) { int id = gm82_ds_handle(&args[0]) - 1; *out = gml_value_real(id >= 0 && id < GM82_DS_MAX && g_ds_lists[id].active ? (double)g_ds_lists[id].count : 0); return 1; }
    if (!strcmp(name, "ds_list_find_value") && count == 2) { int id = gm82_ds_handle(&args[0]) - 1, index = gm82_ds_handle(&args[1]); if (id >= 0 && id < GM82_DS_MAX && g_ds_lists[id].active && index >= 0 && (size_t)index < g_ds_lists[id].count) { const gml_value *v = &g_ds_lists[id].items[index]; *out = v->kind == GML_V_STRING ? gml_value_string(v->string) : (v->kind == GML_V_BOOL ? gml_value_bool(v->boolean) : gml_value_real(v->real)); } return 1; }
    if (!strcmp(name, "ds_list_find_index") && count == 2) { int id = gm82_ds_handle(&args[0]) - 1, result = -1; if (id >= 0 && id < GM82_DS_MAX && g_ds_lists[id].active) for (size_t i = 0; i < g_ds_lists[id].count; ++i) if (gm82_ds_equal(&g_ds_lists[id].items[i], &args[1])) { result = (int)i; break; } *out = gml_value_real((double)result); return 1; }
    if (!strcmp(name, "ds_grid_create") && count == 2) { int width = gm82_ds_handle(&args[0]), height = gm82_ds_handle(&args[1]); if (width < 0) width = 0; if (height < 0) height = 0; if (width > GM82_GRID_DIM) width = GM82_GRID_DIM; if (height > GM82_GRID_DIM) height = GM82_GRID_DIM; for (int i = 0; i < GM82_GRID_MAX; ++i) if (!g_ds_grids[i].active) { g_ds_grids[i].active = 1; g_ds_grids[i].width = width; g_ds_grids[i].height = height; *out = gml_value_real((double)(i + 1)); return 1; } *out = gml_value_real(-1); return 1; }
    if (!strcmp(name, "ds_grid_destroy") && count == 1) { int id = gm82_ds_handle(&args[0]) - 1; if (id >= 0 && id < GM82_GRID_MAX && g_ds_grids[id].active) { for (int i = 0; i < GM82_GRID_DIM * GM82_GRID_DIM; ++i) gml_value_free(&g_ds_grids[id].cells[i]); memset(&g_ds_grids[id], 0, sizeof(g_ds_grids[id])); } *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "ds_grid_set") && count == 4) { int id = gm82_ds_handle(&args[0]) - 1, x = gm82_ds_handle(&args[1]), y = gm82_ds_handle(&args[2]); if (id >= 0 && id < GM82_GRID_MAX && g_ds_grids[id].active && x >= 0 && y >= 0 && x < g_ds_grids[id].width && y < g_ds_grids[id].height) { int index = y * GM82_GRID_DIM + x; gml_value_free(&g_ds_grids[id].cells[index]); g_ds_grids[id].cells[index] = args[3].kind == GML_V_STRING ? gml_value_string(args[3].string) : (args[3].kind == GML_V_BOOL ? gml_value_bool(args[3].boolean) : gml_value_real(args[3].real)); } *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "ds_grid_get") && count == 3) { int id = gm82_ds_handle(&args[0]) - 1, x = gm82_ds_handle(&args[1]), y = gm82_ds_handle(&args[2]); if (id >= 0 && id < GM82_GRID_MAX && g_ds_grids[id].active && x >= 0 && y >= 0 && x < g_ds_grids[id].width && y < g_ds_grids[id].height) { const gml_value *v = &g_ds_grids[id].cells[y * GM82_GRID_DIM + x]; *out = v->kind == GML_V_STRING ? gml_value_string(v->string) : (v->kind == GML_V_BOOL ? gml_value_bool(v->boolean) : gml_value_real(v->real)); } return 1; }
    if (!strcmp(name, "ds_grid_width") && count == 1) { int id = gm82_ds_handle(&args[0]) - 1; *out = gml_value_real(id >= 0 && id < GM82_GRID_MAX && g_ds_grids[id].active ? g_ds_grids[id].width : 0); return 1; }
    if (!strcmp(name, "ds_grid_height") && count == 1) { int id = gm82_ds_handle(&args[0]) - 1; *out = gml_value_real(id >= 0 && id < GM82_GRID_MAX && g_ds_grids[id].active ? g_ds_grids[id].height : 0); return 1; }
    if (!strcmp(name, "ds_map_create") && count == 0) { for (int i = 0; i < GM82_DS_MAX; ++i) if (!g_ds_maps[i].active) { g_ds_maps[i].active = 1; g_ds_maps[i].count = 0; *out = gml_value_real((double)(i + 1)); return 1; } *out = gml_value_real(-1); return 1; }
    if ((!strcmp(name, "ds_map_add") || !strcmp(name, "ds_map_set")) && count == 3) { int id = gm82_ds_handle(&args[0]) - 1; const char *key = gm82_ds_key(&args[1]); if (id >= 0 && id < GM82_DS_MAX && g_ds_maps[id].active && *key) { size_t slot = g_ds_maps[id].count; for (size_t i = 0; i < g_ds_maps[id].count; ++i) if (!strcmp(g_ds_maps[id].keys[i], key)) { slot = i; break; } if (slot < GM82_DS_CAP) { if (slot == g_ds_maps[id].count) g_ds_maps[id].count++; snprintf(g_ds_maps[id].keys[slot], GM82_DS_KEY_CAP, "%s", key); gml_value_free(&g_ds_maps[id].values[slot]); g_ds_maps[id].values[slot] = args[2].kind == GML_V_STRING ? gml_value_string(args[2].string) : (args[2].kind == GML_V_BOOL ? gml_value_bool(args[2].boolean) : gml_value_real(args[2].real)); } } *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "ds_map_destroy") && count == 1) { int id = gm82_ds_handle(&args[0]) - 1; if (id >= 0 && id < GM82_DS_MAX && g_ds_maps[id].active) { for (size_t i = 0; i < g_ds_maps[id].count; ++i) gml_value_free(&g_ds_maps[id].values[i]); memset(&g_ds_maps[id], 0, sizeof(g_ds_maps[id])); } *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "ds_map_size") && count == 1) { int id = gm82_ds_handle(&args[0]) - 1; *out = gml_value_real(id >= 0 && id < GM82_DS_MAX && g_ds_maps[id].active ? (double)g_ds_maps[id].count : 0); return 1; }
    if (!strcmp(name, "ds_map_find_value") && count == 2) { int id = gm82_ds_handle(&args[0]) - 1; const char *key = gm82_ds_key(&args[1]); if (id >= 0 && id < GM82_DS_MAX && g_ds_maps[id].active) for (size_t i = 0; i < g_ds_maps[id].count; ++i) if (!strcmp(g_ds_maps[id].keys[i], key)) { const gml_value *v = &g_ds_maps[id].values[i]; *out = v->kind == GML_V_STRING ? gml_value_string(v->string) : (v->kind == GML_V_BOOL ? gml_value_bool(v->boolean) : gml_value_real(v->real)); break; } return 1; }
    if (!strcmp(name, "ds_map_exists") && count == 2) { int id = gm82_ds_handle(&args[0]) - 1; const char *key = gm82_ds_key(&args[1]); int found = 0; if (id >= 0 && id < GM82_DS_MAX && g_ds_maps[id].active) for (size_t i = 0; i < g_ds_maps[id].count; ++i) if (!strcmp(g_ds_maps[id].keys[i], key)) { found = 1; break; } *out = gml_value_bool(found); return 1; }
    if (!strcmp(name, "instance_exists") && count == 1) {
        int needle = (int)(args[0].kind == GML_V_REAL ? args[0].real : -1); int found = 0;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) if (g_runtime.instances[i].active && (g_runtime.instances[i].id == needle || g_runtime.instances[i].object_id == needle)) { found = 1; break; }
        *out = gml_value_bool(found); return 1;
    }
    if (!strcmp(name, "instance_number") && count == 1) {
        int object_id = (int)(args[0].kind == GML_V_REAL ? args[0].real : -1), total = 0;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            if (gm82_instance_matches(&g_runtime.instances[i], NULL, object_id)) total++;
        }
        *out = gml_value_real((double)total); return 1;
    }
    if (!strcmp(name, "instance_nearest") && count == 3) {
        float x = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0), y = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
        int object_id = (int)(args[2].kind == GML_V_REAL ? args[2].real : -1), result = -1;
        float best = INFINITY;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            Gm82Instance *other = &g_runtime.instances[i];
            if (!gm82_instance_matches(other, self, object_id)) continue;
            float dx = other->x - x, dy = other->y - y, distance = dx * dx + dy * dy;
            if (distance < best) { best = distance; result = other->id; }
        }
        *out = gml_value_real((double)result); return 1;
    }
    if (!strcmp(name, "collision_point") && (count == 4 || count == 5)) {
        float x = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0), y = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
        int object_id = (int)(args[2].kind == GML_V_REAL ? args[2].real : -1), result = -1;
        int precise = args[3].kind == GML_V_REAL && args[3].real != 0.0;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            Gm82Instance *other = &g_runtime.instances[i];
            if (!gm82_instance_matches(other, self, object_id)) continue;
            int hit = precise ? gm82_instance_mask_overlaps_circle(other, x, y, 0.5f) : gm82_instance_overlaps_circle(other, x, y, 0.5f);
            if (hit) { result = other->id; break; }
        }
        *out = gml_value_real((double)result); return 1;
    }
    if (!strcmp(name, "position_meeting") && count == 3) {
        float x = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0), y = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0);
        int object_id = (int)(args[2].kind == GML_V_REAL ? args[2].real : -1); int hit = 0;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            Gm82Instance *other = &g_runtime.instances[i];
            if (!gm82_instance_matches(other, self, object_id)) continue;
            if (gm82_instance_overlaps_rect(other, x - 0.5f, y - 0.5f, x + 0.5f, y + 0.5f)) { hit = 1; break; }
        }
        *out = gml_value_bool(hit); return 1;
    }
    if (!strcmp(name, "collision_circle") && (count == 5 || count == 6)) {
        float x = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0), y = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0);
        float radius = (float)(args[2].kind == GML_V_REAL ? args[2].real : 0);
        int object_id = (int)(args[3].kind == GML_V_REAL ? args[3].real : -1); int result = -1;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            Gm82Instance *other = &g_runtime.instances[i];
            if (!gm82_instance_matches(other, self, object_id)) continue;
            int precise = count == 6 && args[5].kind == GML_V_REAL && args[5].real != 0.0;
            if ((precise ? gm82_instance_mask_overlaps_circle(other, x, y, radius) : gm82_instance_overlaps_circle(other, x, y, radius))) { result = other->id; break; }
        }
        *out = gml_value_real((double)result); return 1;
    }
    if (!strcmp(name, "place_meeting") && count == 3) {
        float x = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0), y = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0);
        int object_id = (int)(args[2].kind == GML_V_REAL ? args[2].real : -1); int hit = 0;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            Gm82Instance *other = &g_runtime.instances[i];
            if (!gm82_instance_matches(other, self, object_id)) continue;
            if (gm82_instance_overlaps_rect(other, x - 0.5f, y - 0.5f, x + 0.5f, y + 0.5f)) { hit = 1; break; }
        }
        *out = gml_value_bool(hit); return 1;
    }
    if (!strcmp(name, "instance_place") && count == 3) {
        float x = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0), y = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0);
        int object_id = (int)(args[2].kind == GML_V_REAL ? args[2].real : -1); int result = -1;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            Gm82Instance *other = &g_runtime.instances[i];
            if (!gm82_instance_matches(other, self, object_id)) continue;
            if (gm82_instance_overlaps_rect(other, x - 0.5f, y - 0.5f, x + 0.5f, y + 0.5f)) { result = other->id; break; }
        }
        *out = gml_value_real((double)result); return 1;
    }
    if (!strcmp(name, "collision_rectangle") && (count == 5 || count == 6)) {
        float x1 = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0), y1 = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0);
        float x2 = (float)(args[2].kind == GML_V_REAL ? args[2].real : x1), y2 = (float)(args[3].kind == GML_V_REAL ? args[3].real : y1);
        int object_id = (int)(args[4].kind == GML_V_REAL ? args[4].real : -1);
        float left = x1 < x2 ? x1 : x2, right = x1 > x2 ? x1 : x2, top = y1 < y2 ? y1 : y2, bottom = y1 > y2 ? y1 : y2;
        int result = -1;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            Gm82Instance *other = &g_runtime.instances[i];
            if (!gm82_instance_matches(other, self, object_id)) continue;
            int precise = count == 6 && args[5].kind == GML_V_REAL && args[5].real != 0.0;
            if ((precise ? gm82_instance_mask_overlaps_rect(other, left, top, right, bottom) : gm82_instance_overlaps_rect(other, left, top, right, bottom))) { result = other->id; break; }
        }
        *out = gml_value_real((double)result); return 1;
    }
    if (!strcmp(name, "abs") && count == 1) {
        double v = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        *out = gml_value_real(fabs(v)); return 1;
    }
    if (!strcmp(name, "sign") && count == 1) {
        double v = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        *out = gml_value_real(v > 0.0 ? 1.0 : (v < 0.0 ? -1.0 : 0.0)); return 1;
    }
    if ((!strcmp(name, "min") || !strcmp(name, "max")) && count >= 1) {
        double value = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        for (int i = 1; i < count; ++i) {
            double candidate = args[i].kind == GML_V_REAL ? args[i].real : 0.0;
            if (!strcmp(name, "min") ? candidate < value : candidate > value) value = candidate;
        }
        *out = gml_value_real(value); return 1;
    }
    if (!strcmp(name, "sqrt") && count == 1) {
        double v = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        *out = gml_value_real(v >= 0.0 ? sqrt(v) : 0.0); return 1;
    }
    if (!strcmp(name, "sqr") && count == 1) {
        double v = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        *out = gml_value_real(v * v); return 1;
    }
    if (!strcmp(name, "power") && count == 2) {
        double base = args[0].kind == GML_V_REAL ? args[0].real : 0.0, exponent = args[1].kind == GML_V_REAL ? args[1].real : 0.0;
        *out = gml_value_real(pow(base, exponent)); return 1;
    }
    if ((!strcmp(name, "floor") || !strcmp(name, "ceil") || !strcmp(name, "round")) && count == 1) {
        double v = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        double result = !strcmp(name, "floor") ? floor(v) : (!strcmp(name, "ceil") ? ceil(v) : floor(v + 0.5));
        *out = gml_value_real(result); return 1;
    }
    if ((!strcmp(name, "degtorad") || !strcmp(name, "radtodeg")) && count == 1) {
        double v = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        double result = !strcmp(name, "degtorad") ? v * 3.14159265358979323846 / 180.0 : v * 180.0 / 3.14159265358979323846;
        *out = gml_value_real(result); return 1;
    }
    if ((!strcmp(name, "sin") || !strcmp(name, "cos") || !strcmp(name, "tan")) && count == 1) {
        double v = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        double radians = v * 3.14159265358979323846 / 180.0;
        double result = !strcmp(name, "sin") ? sin(radians) : (!strcmp(name, "cos") ? cos(radians) : tan(radians));
        *out = gml_value_real(result); return 1;
    }
    if ((!strcmp(name, "arcsin") || !strcmp(name, "arccos") || !strcmp(name, "arctan")) && count == 1) {
        double v = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        double result = !strcmp(name, "arcsin") ? asin(v) : (!strcmp(name, "arccos") ? acos(v) : atan(v));
        *out = gml_value_real(result * 180.0 / 3.14159265358979323846); return 1;
    }
    if (!strcmp(name, "clamp") && count == 3) {
        double value = args[0].kind == GML_V_REAL ? args[0].real : 0.0, low = args[1].kind == GML_V_REAL ? args[1].real : 0.0, high = args[2].kind == GML_V_REAL ? args[2].real : 0.0;
        if (low > high) { double tmp = low; low = high; high = tmp; }
        if (value < low) value = low; else if (value > high) value = high;
        *out = gml_value_real(value); return 1;
    }
    if (!strcmp(name, "lerp") && count == 3) {
        double a = args[0].kind == GML_V_REAL ? args[0].real : 0.0, b = args[1].kind == GML_V_REAL ? args[1].real : 0.0, amount = args[2].kind == GML_V_REAL ? args[2].real : 0.0;
        *out = gml_value_real(a + (b - a) * amount); return 1;
    }
    if (!strcmp(name, "point_distance") && count == 4) {
        float x1 = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0), y1 = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
        float x2 = (float)(args[2].kind == GML_V_REAL ? args[2].real : 0.0), y2 = (float)(args[3].kind == GML_V_REAL ? args[3].real : 0.0);
        *out = gml_value_real((double)hypotf(x2 - x1, y2 - y1)); return 1;
    }
    if (!strcmp(name, "point_direction") && count == 4) {
        float x1 = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0), y1 = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
        float x2 = (float)(args[2].kind == GML_V_REAL ? args[2].real : 0.0), y2 = (float)(args[3].kind == GML_V_REAL ? args[3].real : 0.0);
        float direction = atan2f(-(y2 - y1), x2 - x1) * 180.0f / 3.14159265358979323846f;
        if (direction < 0.0f) direction += 360.0f;
        *out = gml_value_real((double)direction); return 1;
    }
    if (!strcmp(name, "lengthdir_x") && count == 2) {
        float length = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0), direction = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
        *out = gml_value_real((double)(cosf(direction * 3.14159265358979323846f / 180.0f) * length)); return 1;
    }
    if (!strcmp(name, "lengthdir_y") && count == 2) {
        float length = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0), direction = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
        *out = gml_value_real((double)(-sinf(direction * 3.14159265358979323846f / 180.0f) * length)); return 1;
    }
    if ((!strcmp(name, "place_free") || !strcmp(name, "place_empty")) && count == 2) {
        float x = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0), y = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
        int blocked = 0;
        if (self) {
            float half_w = self->sprite_width > 0 ? self->sprite_width * 0.5f : 0.5f;
            float half_h = self->sprite_height > 0 ? self->sprite_height * 0.5f : 0.5f;
            for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
                Gm82Instance *other = &g_runtime.instances[i];
                if (!gm82_instance_matches(other, self, -1)) continue;
                if (gm82_instance_overlaps_rect(other, x - half_w, y - half_h, x + half_w, y + half_h)) { blocked = 1; break; }
            }
        }
        *out = gml_value_bool(!blocked); return 1;
    }
    if (!strcmp(name, "move_wrap") && count >= 2) {
        if (self) {
            int horizontal = args[0].kind == GML_V_REAL && args[0].real != 0.0;
            int vertical = args[1].kind == GML_V_REAL && args[1].real != 0.0;
            float margin = count >= 3 && args[2].kind == GML_V_REAL ? (float)args[2].real : 0.0f;
            float hw = self->sprite_width > 0 ? self->sprite_width * 0.5f : 8.0f;
            float hh = self->sprite_height > 0 ? self->sprite_height * 0.5f : 8.0f;
            if (horizontal) {
                if (self->x + hw + 1.0f < -margin) self->x += g_runtime.width + margin + hw * 2.0f;
                else if (self->x - hw > g_runtime.width + margin) self->x -= g_runtime.width + margin + hw * 2.0f;
            }
            if (vertical) {
                if (self->y + hh + 1.0f < -margin) self->y += g_runtime.height + margin + hh * 2.0f;
                else if (self->y - hh > g_runtime.height + margin) self->y -= g_runtime.height + margin + hh * 2.0f;
            }
        }
        *out = gml_value_bool(1); return 1;
    }
    if (!strcmp(name, "motion_set") && count == 2) {
        if (self) {
            float direction = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0);
            float speed = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
            self->direction = direction;
            self->speed = speed;
            self->vx = cosf(direction * 3.14159265358979323846f / 180.0f) * speed;
            self->vy = -sinf(direction * 3.14159265358979323846f / 180.0f) * speed;
        }
        *out = gml_value_bool(self != NULL); return 1;
    }
    if (!strcmp(name, "move_towards_point") && count == 3) {
        if (self) {
            float target_x = (float)(args[0].kind == GML_V_REAL ? args[0].real : self->x);
            float target_y = (float)(args[1].kind == GML_V_REAL ? args[1].real : self->y);
            float speed = (float)(args[2].kind == GML_V_REAL ? args[2].real : 0.0);
            float dx = target_x - self->x;
            float dy = target_y - self->y;
            float distance = sqrtf(dx * dx + dy * dy);
            if (distance > 0.0001f) {
                self->direction = atan2f(-dy, dx) * 180.0f / 3.14159265358979323846f;
                if (self->direction < 0.0f) self->direction += 360.0f;
            }
            self->speed = speed;
            self->vx = distance > 0.0001f ? dx / distance * speed : 0.0f;
            self->vy = distance > 0.0001f ? dy / distance * speed : 0.0f;
        }
        *out = gml_value_bool(self != NULL); return 1;
    }
    if (!strcmp(name, "instance_create") && count == 3) {
        float x = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0);
        float y = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
        int object_id = (int)(args[2].kind == GML_V_REAL ? args[2].real : -1);
        int created = object_id >= 0 ? gm82_spawn_instance(object_id, x, y) : -1;
        *out = gml_value_real((double)created); return 1;
    }
    if (!strcmp(name, "instance_create_layer") && count == 4) {
        float x = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0);
        float y = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
        int layer_id = -1;
        if (args[2].kind == GML_V_REAL) layer_id = (int)args[2].real;
        else if (args[2].kind == GML_V_STRING && args[2].string) {
            unsigned int hash = 2166136261u;
            for (const unsigned char *p = (const unsigned char *)args[2].string; *p; ++p) { hash ^= *p; hash *= 16777619u; }
            layer_id = (int)(hash & 0x7fffffff);
        }
        int object_id = (int)(args[3].kind == GML_V_REAL ? args[3].real : -1);
        int created = object_id >= 0 ? gm82_spawn_instance_layer(object_id, layer_id, x, y) : -1;
        *out = gml_value_real((double)created); return 1;
    }
    if (!strcmp(name, "instance_find") && count == 2) {
        int object_id = (int)(args[0].kind == GML_V_REAL ? args[0].real : -1);
        int ordinal = (int)(args[1].kind == GML_V_REAL ? args[1].real : -1);
        int found = -1;
        if (ordinal >= 0) {
            int seen = 0;
            for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
                Gm82Instance *candidate = &g_runtime.instances[i];
                if (!gm82_instance_matches(candidate, self, object_id)) continue;
                if (seen++ == ordinal) { found = candidate->id; break; }
            }
        }
        *out = gml_value_real((double)found); return 1;
    }
    if (!strcmp(name, "instance_destroy") && count == 0) { if (self) gm82_dispatch_destroy_event(self); *out = gml_value_bool(1); return 1; }
    if ((!strcmp(name, "room_restart") || !strcmp(name, "game_restart")) && count == 0) {
        gm82_runtime_clear_room_transient();
        if (g_runtime.room_started) gm82_dispatch_other_event(5);
        g_runtime.room_started = 0;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            if (g_runtime.instances[i].active) {
                g_runtime.instances[i].create_dispatched = 0;
                g_runtime.instances[i].destroy_dispatching = 0;
            }
        }
        *out = gml_value_bool(1); return 1;
    }
    if (!strcmp(name, "room_goto") && count == 1) { g_runtime.room_id = (int)(args[0].kind == GML_V_REAL ? args[0].real : g_runtime.room_id); g_runtime.room_started = 0; *out = gml_value_bool(1); return 1; }
    if (!strcmp(name, "point_distance") && count == 4) {
        double x1 = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        double y1 = args[1].kind == GML_V_REAL ? args[1].real : 0.0;
        double x2 = args[2].kind == GML_V_REAL ? args[2].real : 0.0;
        double y2 = args[3].kind == GML_V_REAL ? args[3].real : 0.0;
        double dx = x2 - x1, dy = y2 - y1;
        *out = gml_value_real(sqrt(dx * dx + dy * dy));
        return 1;
    }
    if (!strcmp(name, "point_direction") && count == 4) {
        double x1 = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        double y1 = args[1].kind == GML_V_REAL ? args[1].real : 0.0;
        double x2 = args[2].kind == GML_V_REAL ? args[2].real : 0.0;
        double y2 = args[3].kind == GML_V_REAL ? args[3].real : 0.0;
        double dx = x2 - x1, dy = y2 - y1;
        double dir = atan2(-dy, dx) * 180.0 / 3.14159265358979323846;
        if (dir < 0.0) dir += 360.0;
        *out = gml_value_real(dir);
        return 1;
    }
    if (!strcmp(name, "lengthdir_x") && count == 2) {
        double len = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        double dir = args[1].kind == GML_V_REAL ? args[1].real : 0.0;
        *out = gml_value_real(cos(dir * 3.14159265358979323846 / 180.0) * len);
        return 1;
    }
    if (!strcmp(name, "lengthdir_y") && count == 2) {
        double len = args[0].kind == GML_V_REAL ? args[0].real : 0.0;
        double dir = args[1].kind == GML_V_REAL ? args[1].real : 0.0;
        *out = gml_value_real(-sin(dir * 3.14159265358979323846 / 180.0) * len);
        return 1;
    }
    if (!strcmp(name, "string_length") && count == 1) {
        const char *s = args[0].kind == GML_V_STRING && args[0].string ? args[0].string : "";
        *out = gml_value_real((double)strlen(s));
        return 1;
    }
    if (!strcmp(name, "string_upper") && count == 1) {
        const char *s = args[0].kind == GML_V_STRING && args[0].string ? args[0].string : "";
        size_t len = strlen(s);
        char *buf = (char*)malloc(len + 1);
        if (buf) {
            for (size_t i = 0; i < len; ++i) {
                buf[i] = (char)toupper((unsigned char)s[i]);
            }
            buf[len] = '\0';
            *out = gml_value_string(buf);
            free(buf);
        } else {
            *out = gml_value_string("");
        }
        return 1;
    }
    if (!strcmp(name, "string_lower") && count == 1) {
        const char *s = args[0].kind == GML_V_STRING && args[0].string ? args[0].string : "";
        size_t len = strlen(s);
        char *buf = (char*)malloc(len + 1);
        if (buf) {
            for (size_t i = 0; i < len; ++i) {
                buf[i] = (char)tolower((unsigned char)s[i]);
            }
            buf[len] = '\0';
            *out = gml_value_string(buf);
            free(buf);
        } else {
            *out = gml_value_string("");
        }
        return 1;
    }
    if (!strcmp(name, "string_count") && count == 2) {
        const char *sub = args[0].kind == GML_V_STRING && args[0].string ? args[0].string : "";
        const char *s = args[1].kind == GML_V_STRING && args[1].string ? args[1].string : "";
        size_t sublen = strlen(sub);
        int total = 0;
        if (sublen > 0) {
            const char *p = s;
            while ((p = strstr(p, sub)) != NULL) {
                total++;
                p += sublen;
            }
        }
        *out = gml_value_real((double)total);
        return 1;
    }
    if (!strcmp(name, "is_string") && count == 1) {
        *out = gml_value_bool(args[0].kind == GML_V_STRING);
        return 1;
    }
    if (!strcmp(name, "is_real") && count == 1) {
        *out = gml_value_bool(args[0].kind == GML_V_REAL);
        return 1;
    }
    if (!strcmp(name, "string_copy") && count == 3) {
        const char *s = args[0].kind == GML_V_STRING && args[0].string ? args[0].string : "";
        int index = (int)(args[1].kind == GML_V_REAL ? args[1].real : 1);
        int count_val = (int)(args[2].kind == GML_V_REAL ? args[2].real : 0);
        int len = (int)strlen(s);
        if (index < 1) index = 1;
        int start = index - 1;
        if (start >= len || count_val <= 0) {
            *out = gml_value_string("");
        } else {
            if (start + count_val > len) count_val = len - start;
            char *buf = (char*)malloc((size_t)count_val + 1);
            if (buf) {
                memcpy(buf, s + start, (size_t)count_val);
                buf[count_val] = '\0';
                *out = gml_value_string(buf);
                free(buf);
            } else {
                *out = gml_value_string("");
            }
        }
        return 1;
    }
    if (!strcmp(name, "string_pos") && count == 2) {
        const char *sub = args[0].kind == GML_V_STRING && args[0].string ? args[0].string : "";
        const char *s = args[1].kind == GML_V_STRING && args[1].string ? args[1].string : "";
        char *p = strstr(s, sub);
        if (p && sub[0] != '\0') {
            *out = gml_value_real((double)(p - s + 1));
        } else {
            *out = gml_value_real(0.0);
        }
        return 1;
    }
    if (!strcmp(name, "instance_exists") && count == 1) {
        int needle = (int)(args[0].kind == GML_V_REAL ? args[0].real : -1);
        int found = 0;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            Gm82Instance *candidate = &g_runtime.instances[i];
            if (gm82_instance_matches(candidate, self, needle)) { found = 1; break; }
        }
        *out = gml_value_bool(found);
        return 1;
    }
    if (!strcmp(name, "instance_number") && count == 1) {
        int needle = (int)(args[0].kind == GML_V_REAL ? args[0].real : -1);
        int total = 0;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            Gm82Instance *candidate = &g_runtime.instances[i];
            if (gm82_instance_matches(candidate, self, needle)) total++;
        }
        *out = gml_value_real((double)total);
        return 1;
    }
    if ((!strcmp(name, "place_meeting") || !strcmp(name, "position_meeting")) && count == 3) {
        float x = (float)(args[0].kind == GML_V_REAL ? args[0].real : 0.0);
        float y = (float)(args[1].kind == GML_V_REAL ? args[1].real : 0.0);
        int target_obj = (int)(args[2].kind == GML_V_REAL ? args[2].real : -1);
        int met = 0;
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            Gm82Instance *other = &g_runtime.instances[i];
            if (!gm82_instance_matches(other, self, target_obj)) continue;
            if (self && other->id == self->id) continue;
            float dx = fabsf(x - other->x);
            float dy = fabsf(y - other->y);
            if (dx <= 16.0f && dy <= 16.0f) { met = 1; break; }
        }
        *out = gml_value_bool(met);
        return 1;
    }
    return 0;
}

static int gm82_execute_native_vm(Gm82Instance *it, const char *code) {
    if (!it || !it->active || !code) return 0;
    gml_ast *root = NULL; char error[160] = {0};
    if (!gml_parse_program(code, &root, error, sizeof error)) return 0;
    gml_vm vm; gml_vm_init(&vm);
    gml_vm_set(&vm, "x", gml_value_real(it->x));
    gml_vm_set(&vm, "y", gml_value_real(it->y));
    gml_vm_set(&vm, "hspeed", gml_value_real(it->vx));
    gml_vm_set(&vm, "vspeed", gml_value_real(it->vy));
    gml_vm_set_native_call(&vm, gm82_native_call, it); gml_vm_set_name_resolver(&vm, gm82_resolve_name, it); gml_vm_set_member_callbacks(&vm, gm82_member_get, gm82_member_set, it); gml_vm_set_with_callback(&vm, gm82_with_call, it); gml_vm_set_script_call(&vm, gm82_script_call, it);
    int ok = gml_vm_execute(&vm, root);
    if (ok) {
        gml_value v = gml_vm_get(&vm, "x"); if (v.kind == GML_V_REAL) it->x = (float)v.real; gml_value_free(&v);
        v = gml_vm_get(&vm, "y"); if (v.kind == GML_V_REAL) it->y = (float)v.real; gml_value_free(&v);
        v = gml_vm_get(&vm, "hspeed"); if (v.kind == GML_V_REAL) it->vx = (float)v.real; gml_value_free(&v);
        v = gml_vm_get(&vm, "vspeed"); if (v.kind == GML_V_REAL) it->vy = (float)v.real; gml_value_free(&v);
    }
    for (size_t i = 0; i < vm.count; ++i) gml_value_free(&vm.vars[i].value);
    gml_value_free(&vm.return_value); gml_ast_free(root);
    return ok ? 1 : 0;
}

static int gm82_execute_subset(Gm82Instance *it, const char *code) {
    if (gm82_execute_native_vm(it, code)) return 1;
    if (!it || !it->active || !code) return 0;
    char buffer[GM82_CODE_SOURCE_MAX];
    snprintf(buffer, sizeof(buffer), "%s", code);
    int executed = 0;
    char *save = NULL;
    for (char *statement = strtok_r(buffer, ";\\n", &save); statement && it->active; statement = strtok_r(NULL, ";\\n", &save)) {
        executed |= gm82_execute_statement(it, statement);
    }
    return executed;
}

static int gm82_count_code_args(const char *source) {
    if (!source) return 0;
    if (strstr(source, "argument[")) return -1;
    int argc = 0;
    char needle[32];
    for (int i = 0; i < 16; ++i) {
        snprintf(needle, sizeof(needle), "argument%d", i);
        if (!strstr(source, needle)) break;
        argc++;
    }
    return argc;
}

static void gm82_dispatch_destroy_event(Gm82Instance *it) {
    if (!it || !it->active || it->destroy_dispatching) return;
    it->destroy_dispatching = 1;
    for (int e = 0; e < g_object_event_count; ++e) {
        gm82_object_event *event = &g_object_events[e];
        if (event->active && event->object_id == it->object_id && event->main_type == 1) {
            gm82_execute_subset(it, event->source);
        }
    }
    it->active = 0;
}
static void gm82_dispatch_create_events(void) {
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        Gm82Instance *it = &g_runtime.instances[i];
        if (!it->active || it->create_dispatched) continue;
        it->create_dispatched = 1;
        for (int e = 0; e < g_object_event_count; ++e) {
            gm82_object_event *event = &g_object_events[e];
            if (event->active && event->object_id == it->object_id && event->main_type == 0) {
                gm82_execute_subset(it, event->source);
                if (!it->active) break;
            }
        }
    }
}

static void gm82_dispatch_key_events(void) {
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        Gm82Instance *it = &g_runtime.instances[i];
        if (!it->active) continue;
        for (int e = 0; e < g_object_event_count; ++e) {
            gm82_object_event *event = &g_object_events[e];
            if (!event->active || event->object_id != it->object_id) continue;
            if (event->main_type == 5 && event->sub_type >= 0 && event->sub_type < 256 && g_runtime.keys[event->sub_type]) gm82_execute_subset(it, event->source);
            if (event->main_type == 9 && event->sub_type >= 0 && event->sub_type < 256 && g_runtime.key_pressed[event->sub_type]) gm82_execute_subset(it, event->source);
            if (!it->active) break;
        }
    }
}

static void gm82_dispatch_alarm_events(Gm82Instance *it, int alarm_index) {
    if (!it || !it->active) return;
    for (int e = 0; e < g_object_event_count; ++e) {
        gm82_object_event *event = &g_object_events[e];
        if (event->active && event->object_id == it->object_id && event->main_type == 2 && event->sub_type == alarm_index) {
            gm82_execute_subset(it, event->source);
            if (!it->active) return;
        }
    }
}

static void gm82_dispatch_collision_events(void) {
    for (int c = 0; c < g_runtime.collision_count; ++c) {
        Gm82Instance *left = gm82_find_instance(g_runtime.collisions[c].a);
        Gm82Instance *right = gm82_find_instance(g_runtime.collisions[c].b);
        if (!left || !right) continue;
        for (int e = 0; e < g_object_event_count; ++e) {
            gm82_object_event *event = &g_object_events[e];
            if (!event->active || event->main_type != 4) continue;
            if (event->object_id == left->object_id && event->sub_type == right->object_id) gm82_execute_subset(left, event->source);
            if (event->object_id == right->object_id && event->sub_type == left->object_id) gm82_execute_subset(right, event->source);
        }
    }
}

static void gm82_dispatch_other_event(int subtype) {
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        Gm82Instance *it = &g_runtime.instances[i];
        if (!it->active) continue;
        for (int e = 0; e < g_object_event_count; ++e) {
            gm82_object_event *event = &g_object_events[e];
            if (event->active && event->object_id == it->object_id && event->main_type == 7 && event->sub_type == subtype) {
                gm82_execute_subset(it, event->source);
                if (!it->active) break;
            }
        }
    }
}

static void gm82_dispatch_step_events(int step_subtype) {
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        Gm82Instance *it = &g_runtime.instances[i];
        if (!it->active) continue;
        for (int e = 0; e < g_object_event_count; ++e) {
            gm82_object_event *event = &g_object_events[e];
            if (event->active && event->object_id == it->object_id && event->main_type == 3 &&
                (event->sub_type == step_subtype || event->sub_type < 0)) {
                gm82_execute_subset(it, event->source);
                if (!it->active) break;
            }
        }
    }
}

/* GM8 event type 8 is Draw. Draw events are evaluated at render time, after
   simulation has completed and before the command buffer is consumed. */
static void gm82_dispatch_draw_events(void) {
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        Gm82Instance *it = &g_runtime.instances[i];
        if (!it->active) continue;
        for (int e = 0; e < g_object_event_count; ++e) {
            gm82_object_event *event = &g_object_events[e];
            if (event->active && event->object_id == it->object_id && event->main_type == 8) {
                gm82_execute_subset(it, event->source);
                if (!it->active) break;
            }
        }
    }
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeStep(JNIEnv *env, jobject self, jfloat delta) {
    (void)env; (void)self;
    if (!g_runtime.initialized) return;
    if (delta < 0.0f || delta > 1.0f) delta = 1.0f / 60.0f;
    g_runtime.tick++;
    if (!g_runtime.room_started) {
        gm82_dispatch_other_event(4); /* ev_other / ev_room_start */
        g_runtime.room_started = 1;
    }
    gm82_dispatch_create_events();
    gm82_dispatch_key_events();
    /* GM8-compatible step ordering: Begin Step -> movement/alarms -> Step. */
    gm82_dispatch_step_events(1);
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        Gm82Instance *it = &g_runtime.instances[i];
        if (!it->active) continue;
        const float input_speed = 120.0f;
        if (g_runtime.keys[37]) it->vx = -input_speed;
        else if (g_runtime.keys[39]) it->vx = input_speed;
        if (g_runtime.keys[38]) it->vy = -input_speed;
        else if (g_runtime.keys[40]) it->vy = input_speed;
        if (fabsf(it->speed) > 0.0001f) {
            const float radians = it->direction * 3.14159265358979323846f / 180.0f;
            it->vx = cosf(radians) * it->speed;
            it->vy = -sinf(radians) * it->speed;
        }
        it->x += it->vx * delta;
        it->y += it->vy * delta;
        if (it->sprite_subimages > 0) {
            it->frame = (int)((g_runtime.tick / 6u) % (unsigned)it->sprite_subimages);
        }
        for (int alarm = 0; alarm < 12; ++alarm) {
            if (it->alarms[alarm] == 1) gm82_dispatch_alarm_events(it, alarm);
            if (it->alarms[alarm] > 0) --it->alarms[alarm];
            if (!it->active) break;
        }
        if (it->x < 0.0f || it->x > (float)g_runtime.width) it->vx = -it->vx;
        if (it->y < 0.0f || it->y > (float)g_runtime.height) it->vy = -it->vy;
    }
    gm82_dispatch_step_events(0);
    /* End Step runs after movement and normal Step, before collision callbacks. */
    gm82_dispatch_step_events(2);
    memset(g_runtime.key_pressed, 0, sizeof(g_runtime.key_pressed));
    g_runtime.collision_count = 0;
    for (int a = 0; a < GM82_MAX_INSTANCES && g_runtime.collision_count < GM82_MAX_COLLISIONS; ++a) {
        Gm82Instance *left = &g_runtime.instances[a];
        if (!left->active) continue;
        const float left_w = left->sprite_width > 0 ? (float)left->sprite_width : 16.0f;
        const float left_h = left->sprite_height > 0 ? (float)left->sprite_height : 16.0f;
        for (int b = a + 1; b < GM82_MAX_INSTANCES && g_runtime.collision_count < GM82_MAX_COLLISIONS; ++b) {
            Gm82Instance *right = &g_runtime.instances[b];
            if (!right->active) continue;
            const float right_w = right->sprite_width > 0 ? (float)right->sprite_width : 16.0f;
            const float right_h = right->sprite_height > 0 ? (float)right->sprite_height : 16.0f;
            const float left_l = left->x - left_w * 0.5f, left_t = left->y - left_h * 0.5f;
            const float right_l = right->x - right_w * 0.5f, right_t = right->y - right_h * 0.5f;
            const int overlap = gm82_instance_mask_overlaps_rect(left, right_l, right_t, right_l + right_w, right_t + right_h) ||
                                gm82_instance_mask_overlaps_rect(right, left_l, left_t, left_l + left_w, left_t + left_h);
            if (overlap) {
                g_runtime.collisions[g_runtime.collision_count++] = (Gm82CollisionPair){ left->id, right->id };
            }
        }
    }
    gm82_dispatch_collision_events();
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeRegisterObject(JNIEnv *env, jobject self, jint object_id, jstring name) {
    (void)self;
    if (!name || object_id < 0) return JNI_FALSE;
    const char *n = (*env)->GetStringUTFChars(env, name, NULL);
    if (!n) return JNI_FALSE;
    int ok = gm82_object_name_register((int)object_id, n);
    (*env)->ReleaseStringUTFChars(env, name, n);
    return ok ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeRegisterScript(JNIEnv *env, jobject self, jstring name, jstring source) {
    (void)self;
    if (!name || !source) return JNI_FALSE;
    const char *n = (*env)->GetStringUTFChars(env, name, NULL);
    const char *s = (*env)->GetStringUTFChars(env, source, NULL);
    if (!n || !s) { if (n) (*env)->ReleaseStringUTFChars(env, name, n); if (s) (*env)->ReleaseStringUTFChars(env, source, s); return JNI_FALSE; }
    int ok = gm82_script_register(n, s);
    (*env)->ReleaseStringUTFChars(env, name, n); (*env)->ReleaseStringUTFChars(env, source, s);
    return ok ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeClearScripts(JNIEnv *env, jobject self) {
    (void)env; (void)self; gm82_script_clear();
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeRegisterEvent(JNIEnv *env, jobject self, jint object_id, jint main_type, jint sub_type, jstring source) {
    (void)self;
    if (!source || object_id < 0) return JNI_FALSE;
    const char *utf = (*env)->GetStringUTFChars(env, source, NULL);
    if (!utf) return JNI_FALSE;
    int ok = gm82_event_register(object_id, main_type, sub_type, utf);
    (*env)->ReleaseStringUTFChars(env, source, utf);
    return ok ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeClearEvents(JNIEnv *env, jobject self) {
    (void)env; (void)self;
    gm82_event_clear();
}

JNIEXPORT jstring JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeSnapshotJson(JNIEnv *env, jobject self) {
    (void)self;
    char json[4096];
    int used = snprintf(json, sizeof(json), "{\"initialized\":%s,\"width\":%d,\"height\":%d,\"tick\":%llu,\"collisionCount\":%d,\"instances\":[", g_runtime.initialized ? "true" : "false", g_runtime.width, g_runtime.height, g_runtime.tick, g_runtime.collision_count);
    int first = 1;
    for (int i = 0; i < GM82_MAX_INSTANCES && used > 0 && used < (int)sizeof(json) - 96; ++i) {
        Gm82Instance *it = &g_runtime.instances[i];
        if (!it->active) continue;
        used += snprintf(json + used, sizeof(json) - (size_t)used, "%s{\"id\":%d,\"objectId\":%d,\"spriteId\":%d,\"spriteWidth\":%d,\"spriteHeight\":%d,\"spriteSubimages\":%d,\"frame\":%d,\"x\":%.3f,\"y\":%.3f,\"vx\":%.3f,\"vy\":%.3f,\"speed\":%.3f,\"direction\":%.3f,\"alarms\":[%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d]}", first ? "" : ",", it->id, it->object_id, it->sprite_id, it->sprite_width, it->sprite_height, it->sprite_subimages, it->frame, it->x, it->y, it->vx, it->vy, it->speed, it->direction, it->alarms[0], it->alarms[1], it->alarms[2], it->alarms[3], it->alarms[4], it->alarms[5], it->alarms[6], it->alarms[7], it->alarms[8], it->alarms[9], it->alarms[10], it->alarms[11]);
        first = 0;
    }
    if (used < (int)sizeof(json) - 64) {
        used += snprintf(json + used, sizeof(json) - (size_t)used, "],\"collisions\":[");
        for (int i = 0; i < g_runtime.collision_count && used < (int)sizeof(json) - 48; ++i) {
            used += snprintf(json + used, sizeof(json) - (size_t)used, "%s[%d,%d]", i ? "," : "", g_runtime.collisions[i].a, g_runtime.collisions[i].b);
        }
        snprintf(json + used, sizeof(json) - (size_t)used, "]}");
    }
    return (*env)->NewStringUTF(env, json);
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeRenderBitmap(JNIEnv *env, jobject self, jobject target) {
    (void)self;
    if (!g_runtime.initialized || !target) return JNI_FALSE;
    AndroidBitmapInfo info;
    if (AndroidBitmap_getInfo(env, target, &info) != ANDROID_BITMAP_RESULT_SUCCESS) return JNI_FALSE;
    if (info.format != ANDROID_BITMAP_FORMAT_RGBA_8888) return JNI_FALSE;
    gm82_dispatch_draw_events();
    void *pixels = NULL;
    if (AndroidBitmap_lockPixels(env, target, &pixels) != ANDROID_BITMAP_RESULT_SUCCESS || !pixels) return JNI_FALSE;
    for (uint32_t y = 0; y < info.height; ++y) memset((uint8_t *)pixels + y * info.stride, 0, info.width * 4u);
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        Gm82Instance *it = &g_runtime.instances[i];
        if (!it->active) continue;
        Gm82SpriteBitmap *sprite = gm82_find_bitmap(it->sprite_id, it->frame);
        if (!sprite || !sprite->rgba || sprite->width <= 0 || sprite->height <= 0) continue;
        int dst_x = (int)floorf(it->x);
        int dst_y = (int)floorf(it->y);
        for (int sy = 0; sy < sprite->height; ++sy) {
            int dy = dst_y + sy;
            if (dy < 0 || dy >= (int)info.height) continue;
            for (int sx = 0; sx < sprite->width; ++sx) {
                int dx = dst_x + sx;
                if (dx < 0 || dx >= (int)info.width) continue;
                const uint8_t *src = sprite->rgba + ((size_t)sy * (size_t)sprite->width + (size_t)sx) * 4u;
                uint8_t *dst = (uint8_t *)pixels + (size_t)dy * info.stride + (size_t)dx * 4u;
                const unsigned alpha = src[3];
                if (alpha == 255u) memcpy(dst, src, 4u);
                else if (alpha != 0u) {
                    const unsigned inv = 255u - alpha;
                    dst[0] = (uint8_t)((src[0] * alpha + dst[0] * inv) / 255u);
                    dst[1] = (uint8_t)((src[1] * alpha + dst[1] * inv) / 255u);
                    dst[2] = (uint8_t)((src[2] * alpha + dst[2] * inv) / 255u);
                    dst[3] = (uint8_t)(alpha + (dst[3] * inv) / 255u);
                }
            }
        }
    }
    for (int ci = 0; ci < g_draw_command_count; ++ci) {
        Gm82DrawCommand *cmd = &g_draw_commands[ci]; Gm82SpriteBitmap *sprite = gm82_find_bitmap(cmd->sprite_id, cmd->frame);
        if (!sprite || !sprite->rgba || sprite->width <= 0 || sprite->height <= 0) continue;
        int dst_x = (int)floorf(cmd->x), dst_y = (int)floorf(cmd->y);
        for (int sy = 0; sy < sprite->height; ++sy) { int dy = dst_y + sy; if (dy < 0 || dy >= (int)info.height) continue;
            for (int sx = 0; sx < sprite->width; ++sx) { int dx = dst_x + sx; if (dx < 0 || dx >= (int)info.width) continue;
                const uint8_t *src = sprite->rgba + ((size_t)sy * (size_t)sprite->width + (size_t)sx) * 4u; uint8_t *dst = (uint8_t *)pixels + (size_t)dy * info.stride + (size_t)dx * 4u; unsigned alpha = (unsigned)((float)src[3] * cmd->alpha); if (alpha == 255u) memcpy(dst, src, 4u); else if (alpha != 0u) { unsigned inv = 255u - alpha; dst[0] = (uint8_t)((src[0] * alpha + dst[0] * inv) / 255u); dst[1] = (uint8_t)((src[1] * alpha + dst[1] * inv) / 255u); dst[2] = (uint8_t)((src[2] * alpha + dst[2] * inv) / 255u); dst[3] = (uint8_t)(alpha + (dst[3] * inv) / 255u); }
            }
        }
    }
    gm82_draw_clear();
    AndroidBitmap_unlockPixels(env, target);
    return JNI_TRUE;
}

static void gm82_runtime_clear_room_transient(void) {
    gm82_draw_clear();
    g_runtime.collision_count = 0;
    memset(g_runtime.keys, 0, sizeof(g_runtime.keys));
    memset(g_runtime.key_pressed, 0, sizeof(g_runtime.key_pressed));
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeClearRoomTransient(JNIEnv *env, jobject self) {
    (void)env; (void)self;
    if (!g_runtime.initialized) return;
    gm82_runtime_clear_room_transient();
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeSetRoom(JNIEnv *env, jobject self, jint room_id, jint width, jint height, jboolean clear_instances) {
    (void)env; (void)self;
    if (!g_runtime.initialized) return;
    gm82_runtime_clear_room_transient();
    if (g_runtime.room_started) {
        gm82_dispatch_other_event(5); /* ev_other / ev_room_end */
    }
    g_runtime.room_started = 0;
    g_runtime.room_id = room_id;
    if (width > 0) g_runtime.width = width;
    if (height > 0) g_runtime.height = height;
    if (clear_instances) {
        for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
            g_runtime.instances[i].active = 0;
            g_runtime.instances[i].create_dispatched = 0;
        }
        g_runtime.collision_count = 0;
    }
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeGetRoom(JNIEnv *env, jobject self) {
    (void)env; (void)self;
    return g_runtime.initialized ? g_runtime.room_id : -1;
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeAddInstance(JNIEnv *env, jobject self, jint object_id, jint sprite_id, jint sprite_width, jint sprite_height, jint sprite_subimages, jfloat x, jfloat y, jfloat vx, jfloat vy) {
    (void)env; (void)self;
    if (!g_runtime.initialized) return -1;
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        Gm82Instance *it = &g_runtime.instances[i];
        if (!it->active) {
            it->active = 1;
            it->id = g_runtime.next_id++;
            it->object_id = object_id;
            it->sprite_id = sprite_id;
            it->sprite_width = sprite_width;
            it->sprite_height = sprite_height;
            it->sprite_subimages = sprite_subimages;
            it->x = x; it->y = y; it->vx = vx; it->vy = vy;
            return it->id;
        }
    }
    return -1;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeSetSpriteBitmap(JNIEnv *env, jobject self, jint sprite_id, jint frame, jint width, jint height, jbyteArray rgba) {
    (void)self;
    if (!g_runtime.initialized || !rgba || sprite_id < 0 || frame < 0 || width <= 0 || height <= 0) return JNI_FALSE;
    size_t pixels = (size_t)width * (size_t)height;
    size_t bytes = pixels * 4u;
    if (pixels > GM82_MAX_SPRITE_PIXELS || bytes / 4u != pixels || (*env)->GetArrayLength(env, rgba) < (jsize)bytes) return JNI_FALSE;
    Gm82SpriteBitmap *slot = gm82_find_bitmap(sprite_id, frame);
    if (!slot) {
        for (int i = 0; i < GM82_MAX_SPRITE_BITMAPS; ++i) {
            if (!g_runtime.bitmaps[i].active) { slot = &g_runtime.bitmaps[i]; break; }
        }
    }
    if (!slot) return JNI_FALSE;
    uint8_t *copy = (uint8_t *)malloc(bytes);
    if (!copy) return JNI_FALSE;
    (*env)->GetByteArrayRegion(env, rgba, 0, (jsize)bytes, (jbyte *)copy);
    if ((*env)->ExceptionCheck(env)) { (*env)->ExceptionClear(env); free(copy); return JNI_FALSE; }
    free(slot->rgba);
    slot->active = 1;
    slot->sprite_id = sprite_id;
    slot->frame = frame;
    slot->width = width;
    slot->height = height;
    slot->bytes = bytes;
    slot->rgba = copy;
    return JNI_TRUE;
}

JNIEXPORT jstring JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeConsumeSoundCommands(JNIEnv *env, jobject self) {
    (void)self; char json[16384]; int used = snprintf(json, sizeof(json), "[");
    for (int i = 0; i < g_sound_command_count && used < (int)sizeof(json) - 96; ++i) { Gm82SoundCommand *c = &g_sound_commands[i]; used += snprintf(json + used, sizeof(json) - (size_t)used, "%s[%d,%d,%d,%.4f]", i ? "," : "", c->kind, c->sound_id, c->loop, c->volume); }
    snprintf(json + used, sizeof(json) - (size_t)used, "]"); gm82_sound_clear(); return (*env)->NewStringUTF(env, json);
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeClearInstances(JNIEnv *env, jobject self) {
    (void)env; (void)self; gm82_ds_clear(); gm82_draw_clear(); gm82_sound_clear();
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        g_runtime.instances[i].active = 0;
        g_runtime.instances[i].create_dispatched = 0;
        g_runtime.instances[i].destroy_dispatching = 0;
    }
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeCompileGml(JNIEnv *env, jobject self, jstring source) {
    (void)self;
    if (!source || g_code_point_count >= GM82_MAX_CODE_POINTS) return -1;
    const char *utf = (*env)->GetStringUTFChars(env, source, NULL);
    if (!utf) return -1;
    int index = g_code_point_count++;
    Gm82CodePoint *point = &g_code_points[index];
    memset(point, 0, sizeof(*point));
    snprintf(point->source, sizeof(point->source), "%s", utf);
    point->argc = gm82_count_code_args(point->source);
    point->active = 1;
    (*env)->ReleaseStringUTFChars(env, source, utf);
    return index;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeCodeExists(JNIEnv *env, jobject self, jint code_id) {
    (void)env; (void)self;
    return code_id >= 0 && code_id < g_code_point_count && g_code_points[code_id].active ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeCodeGetArgCount(JNIEnv *env, jobject self, jint code_id) {
    (void)env; (void)self;
    if (code_id < 0 || code_id >= g_code_point_count || !g_code_points[code_id].active) return -2;
    return g_code_points[code_id].argc;
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeCodeDestroy(JNIEnv *env, jobject self, jint code_id) {
    (void)env; (void)self;
    if (code_id >= 0 && code_id < g_code_point_count) {
        g_code_points[code_id].active = 0;
        g_code_points[code_id].source[0] = '\0';
    }
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeCodeExecute(JNIEnv *env, jobject self, jint instance_id, jint code_id) {
    (void)env; (void)self;
    if (code_id < 0 || code_id >= g_code_point_count || !g_code_points[code_id].active) return 0;
    Gm82Instance *instance = gm82_find_instance(instance_id);
    return instance ? gm82_execute_subset(instance, g_code_points[code_id].source) : 0;
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeKey(JNIEnv *env, jobject self, jint key_code, jboolean down) {
    (void)env; (void)self;
    if (!g_runtime.initialized || key_code < 0 || key_code >= 256) return;
    /* GM82-compatible key state: arrows, space, enter and printable codes. */
    if (down && !g_runtime.keys[key_code]) g_runtime.key_pressed[key_code] = 1;
    g_runtime.keys[key_code] = down ? 1 : 0;
}

JNIEXPORT jstring JNICALL Java_com_normaker_nativefull_MainActivity_nativeGmkChunkInventory(JNIEnv *env, jobject self, jbyteArray bytes) {
    (void)self;
    if (!bytes) return (*env)->NewStringUTF(env, "{\"valid\":false,\"error\":\"null\"}");
    jsize size = (*env)->GetArrayLength(env, bytes);
    jbyte *raw = (*env)->GetByteArrayElements(env, bytes, NULL);
    if (!raw || size < 32) {
        if (raw) (*env)->ReleaseByteArrayElements(env, bytes, raw, JNI_ABORT);
        return (*env)->NewStringUTF(env, "{\"valid\":false,\"error\":\"short\"}");
    }
    const uint8_t *data = (const uint8_t *)raw;
    int chunks = 0;
    unsigned long long compressed = 0;
    unsigned long long inflated = 0;
    /* GM8 resource payloads are length-prefixed zlib chunks. Scan only plausible
       little-endian lengths followed by zlib magic; do not mutate the source. */
    for (size_t i = 0; i + 6 <= (size_t)size; ++i) {
        uint32_t len = (uint32_t)data[i] | ((uint32_t)data[i+1] << 8) | ((uint32_t)data[i+2] << 16) | ((uint32_t)data[i+3] << 24);
        if (len < 8 || len > 50u * 1024u * 1024u || i + 4u + len > (size_t)size) continue;
        if (data[i + 4] != 0x78) continue;
        compressed += len;
        uLongf target = len * 16u + 1024u;
        if (target > 64u * 1024u * 1024u) target = 64u * 1024u * 1024u;
        uint8_t *out = (uint8_t *)malloc((size_t)target);
        if (out) {
            int z = uncompress(out, &target, data + i + 4, (uLong)len);
            if (z == Z_OK) { chunks++; inflated += target; }
            free(out);
        }
        i += 3u;
    }
    char json[256];
    snprintf(json, sizeof(json), "{\"valid\":true,\"bytes\":%d,\"zlibChunks\":%d,\"compressedBytes\":%llu,\"inflatedBytes\":%llu}", (int)size, chunks, compressed, inflated);
    (*env)->ReleaseByteArrayElements(env, bytes, raw, JNI_ABORT);
    return (*env)->NewStringUTF(env, json);
}

static Gm82Instance *gm82_find_instance(int id) {
    for (int i = 0; i < GM82_MAX_INSTANCES; ++i) {
        if (g_runtime.instances[i].active && g_runtime.instances[i].id == id) return &g_runtime.instances[i];
    }
    return NULL;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeExportRom(JNIEnv *env, jobject self, jstring title, jstring output_path, jint kind) {
    (void)self;
    if (!title || !output_path) return JNI_FALSE;
    const char *t = (*env)->GetStringUTFChars(env, title, NULL);
    const char *p = (*env)->GetStringUTFChars(env, output_path, NULL);
    if (!t || !p) { if (t) (*env)->ReleaseStringUTFChars(env, title, t); if (p) (*env)->ReleaseStringUTFChars(env, output_path, p); return JNI_FALSE; }
    double ok = 0.0;
    if (kind == 1) ok = nor_export_nes_native(t, p);
    else if (kind == 2) ok = nor_export_gbc_native(t, p);
    else if (kind == 3) ok = nor_export_gba_native(t, p);
    else if (kind == 4) ok = nor_export_nor_native(t, p);
    else if (kind == 5) ok = nor_export_pnor_native(t, p);
    (*env)->ReleaseStringUTFChars(env, title, t);
    (*env)->ReleaseStringUTFChars(env, output_path, p);
    return ok != 0.0 ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeExportNorJson(JNIEnv *env, jobject self, jstring json, jstring output_path) {
    (void)self;
    if (!json || !output_path) return JNI_FALSE;
    const char *j = (*env)->GetStringUTFChars(env, json, NULL);
    const char *p = (*env)->GetStringUTFChars(env, output_path, NULL);
    if (!j || !p) {
        if (j) (*env)->ReleaseStringUTFChars(env, json, j);
        if (p) (*env)->ReleaseStringUTFChars(env, output_path, p);
        return JNI_FALSE;
    }
    double ok = nor_export_json_native(j, p);
    (*env)->ReleaseStringUTFChars(env, json, j);
    (*env)->ReleaseStringUTFChars(env, output_path, p);
    return ok != 0.0 ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeDetectRom(JNIEnv *env, jobject self, jstring path) {
    (void)self;
    if (!path) return 0;
    const char *p = (*env)->GetStringUTFChars(env, path, NULL);
    if (!p) return 0;
    double kind = nor_import_format_native(p);
    (*env)->ReleaseStringUTFChars(env, path, p);
    return (jint)kind;
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeImportGmxGmz(JNIEnv *env, jobject self, jstring path, jstring output_dir) {
    (void)self;
    if (!path) return 0;
    const char *p = (*env)->GetStringUTFChars(env, path, NULL);
    const char *o = output_dir ? (*env)->GetStringUTFChars(env, output_dir, NULL) : NULL;
    if (!p || (output_dir && !o)) { if (p) (*env)->ReleaseStringUTFChars(env, path, p); if (o) (*env)->ReleaseStringUTFChars(env, output_dir, o); return 0; }
    double result = nor_import_gmx_gmz_native(p, o);
    (*env)->ReleaseStringUTFChars(env, path, p);
    if (o) (*env)->ReleaseStringUTFChars(env, output_dir, o);
    return (jint)result;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeExportGmxGmz(JNIEnv *env, jobject self, jstring source_dir, jstring output_path, jstring kind) {
    (void)self;
    if (!source_dir || !output_path || !kind) return JNI_FALSE;
    const char *s = (*env)->GetStringUTFChars(env, source_dir, NULL);
    const char *o = (*env)->GetStringUTFChars(env, output_path, NULL);
    const char *k = (*env)->GetStringUTFChars(env, kind, NULL);
    if (!s || !o || !k) { if (s) (*env)->ReleaseStringUTFChars(env, source_dir, s); if (o) (*env)->ReleaseStringUTFChars(env, output_path, o); if (k) (*env)->ReleaseStringUTFChars(env, kind, k); return JNI_FALSE; }
    double result = nor_export_gmx_gmz_native(s, o, k);
    (*env)->ReleaseStringUTFChars(env, source_dir, s);
    (*env)->ReleaseStringUTFChars(env, output_path, o);
    (*env)->ReleaseStringUTFChars(env, kind, k);
    return result != 0.0 ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeExportGmkRaw(JNIEnv *env, jobject self, jstring source_path, jstring output_path) {
    (void)self;
    if (!source_path || !output_path) return JNI_FALSE;
    const char *s = (*env)->GetStringUTFChars(env, source_path, NULL);
    const char *o = (*env)->GetStringUTFChars(env, output_path, NULL);
    if (!s || !o) { if (s) (*env)->ReleaseStringUTFChars(env, source_path, s); if (o) (*env)->ReleaseStringUTFChars(env, output_path, o); return JNI_FALSE; }
    double result = nor_export_gmk_raw_native(s, o);
    (*env)->ReleaseStringUTFChars(env, source_path, s);
    (*env)->ReleaseStringUTFChars(env, output_path, o);
    return result != 0.0 ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeExportGmxSemantic(JNIEnv *env, jobject self, jstring source_dir, jstring output_dir, jstring project_name) {
    (void)self;
    if (!source_dir || !output_dir || !project_name) return JNI_FALSE;
    const char *s = (*env)->GetStringUTFChars(env, source_dir, NULL);
    const char *o = (*env)->GetStringUTFChars(env, output_dir, NULL);
    const char *n = (*env)->GetStringUTFChars(env, project_name, NULL);
    if (!s || !o || !n) { if (s) (*env)->ReleaseStringUTFChars(env, source_dir, s); if (o) (*env)->ReleaseStringUTFChars(env, output_dir, o); if (n) (*env)->ReleaseStringUTFChars(env, project_name, n); return JNI_FALSE; }
    double result = nor_export_gmx_semantic_native(s, o, n);
    (*env)->ReleaseStringUTFChars(env, source_dir, s);
    (*env)->ReleaseStringUTFChars(env, output_dir, o);
    (*env)->ReleaseStringUTFChars(env, project_name, n);
    return result != 0.0 ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeValidateRom(JNIEnv *env, jobject self, jstring path, jint kind) {
    (void)self;
    if (!path || kind < 1 || kind > 4) return JNI_FALSE;
    const char *p = (*env)->GetStringUTFChars(env, path, NULL);
    if (!p) return JNI_FALSE;
    double ok = nor_validate_rom_native(p, (double)kind);
    (*env)->ReleaseStringUTFChars(env, path, p);
    return ok != 0.0 ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jboolean JNICALL Java_com_normaker_nativefull_MainActivity_nativeRuntimeExecuteGml(JNIEnv *env, jobject self, jint instance_id, jstring source) {
    (void)self;
    if (!g_runtime.initialized || !source) return JNI_FALSE;
    Gm82Instance *it = gm82_find_instance(instance_id);
    if (!it) return JNI_FALSE;
    const char *code = (*env)->GetStringUTFChars(env, source, NULL);
    if (!code) return JNI_FALSE;
    /* Prefer the full parser/VM path; retain the legacy statement fallback for
       malformed or partially supported GM8 snippets so old projects remain usable. */
    if (gm82_execute_native_vm(it, code)) {
        (*env)->ReleaseStringUTFChars(env, source, code);
        return JNI_TRUE;
    }
    int executed = 0;
    float value = 0.0f;
    if (sscanf(code, " x += %f", &value) == 1 || sscanf(code, "x += %f", &value) == 1) { it->x += value; executed = 1; }
    if (sscanf(code, " y += %f", &value) == 1 || sscanf(code, "y += %f", &value) == 1) { it->y += value; executed = 1; }
    if (sscanf(code, " x = %f", &value) == 1 || sscanf(code, "x = %f", &value) == 1) { it->x = value; executed = 1; }
    if (sscanf(code, " y = %f", &value) == 1 || sscanf(code, "y = %f", &value) == 1) { it->y = value; executed = 1; }
    if (sscanf(code, " hspeed = %f", &value) == 1 || sscanf(code, "hspeed = %f", &value) == 1) { it->vx = value; executed = 1; }
    if (sscanf(code, " vspeed = %f", &value) == 1 || sscanf(code, "vspeed = %f", &value) == 1) { it->vy = value; executed = 1; }
    if (sscanf(code, " speed = %f", &value) == 1 || sscanf(code, "speed = %f", &value) == 1) { it->speed = value; executed = 1; }
    if (sscanf(code, " direction = %f", &value) == 1 || sscanf(code, "direction = %f", &value) == 1) { it->direction = value; executed = 1; }
    if (strstr(code, "setgravity") != NULL && sscanf(code, "%*[^ (](%f", &value) == 1) { it->vy += value; executed = 1; }
    if (strstr(code, "instance_destroy") != NULL) { gm82_dispatch_destroy_event(it); executed = 1; }
    int alarm_index = -1, alarm_value = 0;
    if (sscanf(code, "alarm[%d] = %d", &alarm_index, &alarm_value) == 2 || sscanf(code, " alarm[%d] = %d", &alarm_index, &alarm_value) == 2) {
        if (alarm_index >= 0 && alarm_index < 12) { it->alarms[alarm_index] = alarm_value < 0 ? 0 : alarm_value; executed = 1; }
    }
    float target_x = 0.0f, target_y = 0.0f, max_speed = 0.0f;
    if (sscanf(code, "mp_potential_step(%f,%f,%f,%*[^)])", &target_x, &target_y, &max_speed) == 3 || sscanf(code, "mp_potential_step( %f , %f , %f , %*[^)])", &target_x, &target_y, &max_speed) == 3) {
        const float dx = target_x - it->x;
        const float dy = target_y - it->y;
        const float length = sqrtf(dx * dx + dy * dy);
        if (length > 0.0001f) { it->vx = dx / length * max_speed; it->vy = dy / length * max_speed; }
        executed = 1;
    }
    if (strstr(code, "move_wrap") != NULL) {
        if (g_runtime.width > 0) { while (it->x < 0) it->x += g_runtime.width; while (it->x >= g_runtime.width) it->x -= g_runtime.width; }
        if (g_runtime.height > 0) { while (it->y < 0) it->y += g_runtime.height; while (it->y >= g_runtime.height) it->y -= g_runtime.height; }
        executed = 1;
    }
    (*env)->ReleaseStringUTFChars(env, source, code);
    return executed ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jdouble JNICALL Java_com_normaker_nativefull_MainActivity_nativeGm82CompatCheck(JNIEnv *env, jobject self) {
    (void)env; (void)self;
    return (jdouble)gm82_portable_dllcheck();
}

JNIEXPORT jdouble JNICALL Java_com_normaker_nativefull_MainActivity_nativeGm82ColorReverse(JNIEnv *env, jobject self, jdouble color) {
    (void)env; (void)self;
    return (jdouble)gm82_portable_color_reverse((double)color);
}

JNIEXPORT jdouble JNICALL Java_com_normaker_nativefull_MainActivity_nativeGm82ColorInverse(JNIEnv *env, jobject self, jdouble color) {
    (void)env; (void)self;
    return (jdouble)gm82_portable_color_inverse((double)color);
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeGm82TokenStart(JNIEnv *env, jobject self, jstring text, jstring separator) {
    (void)self;
    const char *text_chars = text ? (*env)->GetStringUTFChars(env, text, NULL) : NULL;
    const char *separator_chars = separator ? (*env)->GetStringUTFChars(env, separator, NULL) : NULL;
    int count = gm82_portable_token_start(text_chars, separator_chars);
    if (text_chars) (*env)->ReleaseStringUTFChars(env, text, text_chars);
    if (separator_chars) (*env)->ReleaseStringUTFChars(env, separator, separator_chars);
    return (jint)count;
}

JNIEXPORT jstring JNICALL Java_com_normaker_nativefull_MainActivity_nativeGm82TokenNext(JNIEnv *env, jobject self) {
    (void)self;
    return (*env)->NewStringUTF(env, gm82_portable_token_next());
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeGm82TokenReset(JNIEnv *env, jobject self) {
    (void)env; (void)self;
    gm82_portable_token_reset();
}

JNIEXPORT void JNICALL Java_com_normaker_nativefull_MainActivity_nativeClearResourceRegistry(JNIEnv *env, jobject self) {
    (void)env; (void)self;
    gm82_resource_clear();
    gm82_event_clear();
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeRegisterResource(JNIEnv *env, jobject self, jint kind, jint id, jstring name, jint width, jint height, jint frames) {
    (void)self;
    const char *n = name ? (*env)->GetStringUTFChars(env, name, NULL) : NULL;
    int ok = gm82_resource_register((int)kind, (int)id, n, (int)width, (int)height, (int)frames);
    if (n) (*env)->ReleaseStringUTFChars(env, name, n);
    return ok ? (jint)g_resource_registry_count : 0;
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeResourceCount(JNIEnv *env, jobject self) {
    (void)env; (void)self;
    return (jint)g_resource_registry_count;
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeRegisterObjectEvent(JNIEnv *env, jobject self, jint object_id, jint main_type, jint sub_type, jstring source) {
    (void)self;
    const char *s = source ? (*env)->GetStringUTFChars(env, source, NULL) : NULL;
    int ok = gm82_event_register((int)object_id, (int)main_type, (int)sub_type, s);
    if (s) (*env)->ReleaseStringUTFChars(env, source, s);
    return ok ? (jint)g_object_event_count : 0;
}

JNIEXPORT jint JNICALL Java_com_normaker_nativefull_MainActivity_nativeObjectEventCount(JNIEnv *env, jobject self) {
    (void)env; (void)self;
    return (jint)g_object_event_count;
}
