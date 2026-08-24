#ifndef NOR_GML_VM_H
#define NOR_GML_VM_H

#include "gml_frontend.h"
#include <stddef.h>

#define GML_VM_MAX_VARS 256
#define GML_VM_MAX_SCOPE_DEPTH 32

typedef enum { GML_V_UNDEFINED=0, GML_V_REAL, GML_V_BOOL, GML_V_STRING, GML_V_ARRAY } gml_value_kind;
typedef struct gml_value gml_value;
typedef struct { size_t count; gml_value *items; } gml_array;
struct gml_value { gml_value_kind kind; double real; int boolean; char *string; gml_array *array; };

typedef struct gml_vm gml_vm;
typedef int (*gml_native_call)(void *userdata, const char *name, const gml_value *args, size_t count, gml_value *out);
typedef int (*gml_name_resolve)(void *userdata, const char *name, gml_value *out);
typedef int (*gml_with_call)(void *userdata, gml_vm *vm, const gml_value *target, const gml_ast *body);
typedef int (*gml_member_get)(void *userdata, const char *name, gml_value *out);
typedef int (*gml_member_set)(void *userdata, const char *name, const gml_value *value);
typedef int (*gml_script_call)(void *userdata, const char *name, const gml_value *args, size_t count, gml_value *out);

typedef struct { char name[64]; gml_value value; } gml_vm_var;
struct gml_vm {
    gml_vm_var vars[GML_VM_MAX_VARS];
    size_t count;
    size_t scope_marks[GML_VM_MAX_SCOPE_DEPTH];
    size_t scope_depth;
    gml_native_call native_call; void *native_userdata;
    gml_name_resolve name_resolve; void *name_userdata;
    gml_with_call with_call; void *with_userdata;
    gml_member_get member_get; gml_member_set member_set; void *member_userdata;
    gml_script_call script_call; void *script_userdata;
    gml_value return_value;
    int returned, break_pending, continue_pending;
    char error[160];
};

gml_value gml_value_real(double n);
gml_value gml_value_bool(int b);
gml_value gml_value_string(const char *s);
gml_value gml_value_array(size_t count);
void gml_value_free(gml_value *v);
void gml_vm_init(gml_vm *vm);
int gml_vm_set(gml_vm *vm, const char *name, gml_value value);
gml_value gml_vm_get(gml_vm *vm, const char *name);
void gml_vm_set_native_call(gml_vm *vm, gml_native_call callback, void *userdata);
void gml_vm_set_name_resolver(gml_vm *vm, gml_name_resolve callback, void *userdata);
void gml_vm_set_with_callback(gml_vm *vm, gml_with_call callback, void *userdata);
void gml_vm_set_member_callbacks(gml_vm *vm, gml_member_get getter, gml_member_set setter, void *userdata);
void gml_vm_set_script_call(gml_vm *vm, gml_script_call callback, void *userdata);
void gml_vm_push_scope(gml_vm *vm);
void gml_vm_pop_scope(gml_vm *vm);
int gml_vm_execute(gml_vm *vm, const gml_ast *root);
int gml_vm_invoke(gml_vm *vm, const gml_ast *root, const gml_value *args, size_t count, gml_value *out);

#endif
