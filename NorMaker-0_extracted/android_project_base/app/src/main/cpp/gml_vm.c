#include "gml_vm.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <math.h>
#include <ctype.h>

typedef struct {
    int id;
    gml_value *items;
    size_t count;
    size_t capacity;
} gml_ds_list;

typedef struct {
    char key[64];
    gml_value val;
} gml_ds_map_entry;

typedef struct {
    int id;
    gml_ds_map_entry *entries;
    size_t count;
    size_t capacity;
} gml_ds_map;

static gml_ds_list g_ds_lists[64];
static size_t g_ds_list_count = 0;
static int g_next_list_id = 1;

static gml_ds_map g_ds_maps[64];
static size_t g_ds_map_count = 0;
static int g_next_map_id = 1;

static gml_ds_list* find_ds_list(int id) {
    for (size_t i = 0; i < g_ds_list_count; i++) {
        if (g_ds_lists[i].id == id) return &g_ds_lists[i];
    }
    return NULL;
}

static gml_ds_map* find_ds_map(int id) {
    for (size_t i = 0; i < g_ds_map_count; i++) {
        if (g_ds_maps[i].id == id) return &g_ds_maps[i];
    }
    return NULL;
}

void gml_vm_reset_ds_structures(void) {
    for (size_t i = 0; i < g_ds_list_count; i++) {
        for (size_t j = 0; j < g_ds_lists[i].count; j++) {
            gml_value_free(&g_ds_lists[i].items[j]);
        }
        free(g_ds_lists[i].items);
    }
    g_ds_list_count = 0;
    g_next_list_id = 1;

    for (size_t i = 0; i < g_ds_map_count; i++) {
        for (size_t j = 0; j < g_ds_maps[i].count; j++) {
            gml_value_free(&g_ds_maps[i].entries[j].val);
        }
        free(g_ds_maps[i].entries);
    }
    g_ds_map_count = 0;
    g_next_map_id = 1;
}

static gml_value undef(void){gml_value v={0};return v;}
gml_value gml_value_real(double n){gml_value v=undef();v.kind=GML_V_REAL;v.real=n;return v;}
gml_value gml_value_bool(int b){gml_value v=undef();v.kind=GML_V_BOOL;v.boolean=!!b;v.real=!!b;return v;}
gml_value gml_value_string(const char*s){gml_value v=undef();v.kind=GML_V_STRING;const char*src=s?s:"";size_t n=strlen(src);v.string=malloc(n+1);if(v.string)memcpy(v.string,src,n+1);return v;} gml_value gml_value_array(size_t count){gml_value v=undef();v.kind=GML_V_ARRAY;v.array=calloc(1,sizeof *v.array);if(!v.array)return v;v.array->count=count;v.array->items=calloc(count?count:1,sizeof(gml_value));if(!v.array->items){free(v.array);v.array=0;v.kind=GML_V_UNDEFINED;}return v;} void gml_value_free(gml_value*v){if(!v)return;if(v->kind==GML_V_STRING)free(v->string);else if(v->kind==GML_V_ARRAY&&v->array){for(size_t i=0;i<v->array->count;i++)gml_value_free(&v->array->items[i]);free(v->array->items);free(v->array);}memset(v,0,sizeof*v);} static gml_value copyv(const gml_value*v){if(!v)return undef();if(v->kind==GML_V_STRING)return gml_value_string(v->string);if(v->kind==GML_V_ARRAY&&v->array){gml_value r=gml_value_array(v->array->count);if(r.array)for(size_t i=0;i<v->array->count;i++){r.array->items[i]=copyv(&v->array->items[i]);}return r;}return *v;}
void gml_vm_init(gml_vm*vm){memset(vm,0,sizeof*vm);}
void gml_vm_set_native_call(gml_vm*vm,gml_native_call callback,void*userdata){if(vm){vm->native_call=callback;vm->native_userdata=userdata;}} void gml_vm_set_name_resolver(gml_vm*vm,gml_name_resolve callback,void*userdata){if(vm){vm->name_resolve=callback;vm->name_userdata=userdata;}} void gml_vm_set_with_callback(gml_vm*vm,gml_with_call callback,void*userdata){if(vm){vm->with_call=callback;vm->with_userdata=userdata;}} void gml_vm_set_member_callbacks(gml_vm*vm,gml_member_get getter,gml_member_set setter,void*userdata){if(vm){vm->member_get=getter;vm->member_set=setter;vm->member_userdata=userdata;}} void gml_vm_set_script_call(gml_vm*vm,gml_script_call callback,void*userdata){if(vm){vm->script_call=callback;vm->script_userdata=userdata;}} void gml_vm_push_scope(gml_vm*vm){if(vm&&vm->scope_depth<GML_VM_MAX_SCOPE_DEPTH)vm->scope_marks[vm->scope_depth++]=vm->count;} void gml_vm_pop_scope(gml_vm*vm){if(!vm||!vm->scope_depth)return;size_t mark=vm->scope_marks[--vm->scope_depth];while(vm->count>mark){vm->count--;gml_value_free(&vm->vars[vm->count].value);memset(&vm->vars[vm->count],0,sizeof vm->vars[vm->count]);}}
int gml_vm_set(gml_vm*vm,const char*n,gml_value v){if(!vm||!n)return 0;size_t mark=vm->scope_depth?vm->scope_marks[vm->scope_depth-1]:0;for(size_t i=vm->count;i>mark;i--)if(!strcmp(vm->vars[i-1].name,n)){gml_value_free(&vm->vars[i-1].value);vm->vars[i-1].value=copyv(&v);return 1;}if(vm->count>=GML_VM_MAX_VARS)return 0;strncpy(vm->vars[vm->count].name,n,63);vm->vars[vm->count].name[63]=0;vm->vars[vm->count].value=copyv(&v);vm->count++;return 1;}
gml_value gml_vm_get(gml_vm*vm,const char*n){if(vm&&n)for(size_t i=vm->count;i>0;i--)if(!strcmp(vm->vars[i-1].name,n))return copyv(&vm->vars[i-1].value);return undef();}
static double num(gml_value v){if(v.kind==GML_V_BOOL)return v.boolean;if(v.kind==GML_V_REAL)return v.real;return 0;}
static int truth(gml_value v){if(v.kind==GML_V_STRING)return v.string&&v.string[0];return num(v)!=0;}
static gml_value eval(gml_vm*vm,const gml_ast*n); static gml_value call(gml_vm*vm,const gml_ast*n); static gml_value* named_slot(gml_vm*vm,const char*n){if(!vm||!n)return 0;for(size_t i=vm->count;i>0;i--)if(!strcmp(vm->vars[i-1].name,n))return &vm->vars[i-1].value;return 0;} static gml_value eval_member(gml_vm*vm,const gml_ast*n){if(!n||!n->left||!n->text)return undef();gml_value base=eval(vm,n->left);gml_value r=undef();if(!strcmp(n->text,"length")){if(base.kind==GML_V_ARRAY&&base.array)r=gml_value_real((double)base.array->count);else if(base.kind==GML_V_STRING&&base.string)r=gml_value_real((double)strlen(base.string));}else if(vm->member_get && n->left->kind==GML_AST_NAME && !strcmp(n->left->text,"self")){vm->member_get(vm->member_userdata,n->text,&r);}gml_value_free(&base);return r;} static gml_value eval_index(gml_vm*vm,const gml_ast*n){if(!n||!n->left||!n->right)return undef();gml_value*base=(n->left->kind==GML_AST_NAME)?named_slot(vm,n->left->text):0;gml_value temp=undef();if(!base){temp=eval(vm,n->left);base=&temp;}gml_value idx=eval(vm,n->right);size_t i=num(idx)<0?0:(size_t)num(idx);gml_value r=undef();if(base->kind==GML_V_ARRAY&&base->array&&i<base->array->count)r=copyv(&base->array->items[i]);gml_value_free(&idx);if(base==&temp)gml_value_free(&temp);return r;}

static gml_value call(gml_vm*vm,const gml_ast*n){
    if(!n||!n->text)return undef();
    gml_value args[16];
    size_t count=n->count<16?n->count:16;
    for(size_t i=0;i<count;i++)args[i]=eval(vm,n->items[i]);
    gml_value res=undef();
    if(!strcmp(n->text,"max")){
        double maxv=count>0?num(args[0]):0;
        for(size_t i=1;i<count;i++)if(num(args[i])>maxv)maxv=num(args[i]);
        res=gml_value_real(maxv);
    }else if(!strcmp(n->text,"min")){
        double minv=count>0?num(args[0]):0;
        for(size_t i=1;i<count;i++)if(num(args[i])<minv)minv=num(args[i]);
        res=gml_value_real(minv);
    }else if(!strcmp(n->text,"ds_list_create")){
        int id=g_next_list_id++;
        if(g_ds_list_count<64){
            g_ds_lists[g_ds_list_count].id=id;
            g_ds_lists[g_ds_list_count].items=NULL;
            g_ds_lists[g_ds_list_count].count=0;
            g_ds_lists[g_ds_list_count].capacity=0;
            g_ds_list_count++;
        }
        res=gml_value_real(id);
    }else if(!strcmp(n->text,"ds_list_add")){
        if(count>=2){
            gml_ds_list*l=find_ds_list((int)num(args[0]));
            if(l){
                for(size_t i=1;i<count;i++){
                    if(l->count>=l->capacity){
                        size_t nc=l->capacity?l->capacity*2:8;
                        l->items=realloc(l->items,nc*sizeof(gml_value));
                        l->capacity=nc;
                    }
                    l->items[l->count++]=copyv(&args[i]);
                }
            }
        }
        res=gml_value_real(1);
    }else if(!strcmp(n->text,"ds_list_size")){
        gml_ds_list*l=count>0?find_ds_list((int)num(args[0])):NULL;
        res=gml_value_real(l?(double)l->count:0);
    }else if(!strcmp(n->text,"ds_list_find_value")){
        gml_ds_list*l=count>1?find_ds_list((int)num(args[0])):NULL;
        size_t idx=count>1?(size_t)num(args[1]):0;
        if(l&&idx<l->count)res=copyv(&l->items[idx]);
    }else if(!strcmp(n->text,"ds_list_destroy")){
        int id=count>0?(int)num(args[0]):0;
        for(size_t i=0;i<g_ds_list_count;i++){
            if(g_ds_lists[i].id==id){
                for(size_t j=0;j<g_ds_lists[i].count;j++)gml_value_free(&g_ds_lists[i].items[j]);
                free(g_ds_lists[i].items);
                g_ds_lists[i]=g_ds_lists[--g_ds_list_count];
                break;
            }
        }
        res=gml_value_real(1);
    }else if(!strcmp(n->text,"ds_map_create")){
        int id=g_next_map_id++;
        if(g_ds_map_count<64){
            g_ds_maps[g_ds_map_count].id=id;
            g_ds_maps[g_ds_map_count].entries=NULL;
            g_ds_maps[g_ds_map_count].count=0;
            g_ds_maps[g_ds_map_count].capacity=0;
            g_ds_map_count++;
        }
        res=gml_value_real(id);
    }else if(!strcmp(n->text,"ds_map_add")){
        if(count>=3){
            gml_ds_map*m=find_ds_map((int)num(args[0]));
            const char*k=args[1].kind==GML_V_STRING?args[1].string:"";
            if(m){
                if(m->count>=m->capacity){
                    size_t nc=m->capacity?m->capacity*2:8;
                    m->entries=realloc(m->entries,nc*sizeof(gml_ds_map_entry));
                    m->capacity=nc;
                }
                strncpy(m->entries[m->count].key,k,63);
                m->entries[m->count].key[63]=0;
                m->entries[m->count].val=copyv(&args[2]);
                m->count++;
            }
        }
        res=gml_value_real(1);
    }else if(!strcmp(n->text,"ds_map_find_value")){
        gml_ds_map*m=count>0?find_ds_map((int)num(args[0])):NULL;
        const char*k=count>1&&args[1].kind==GML_V_STRING?args[1].string:"";
        if(m){
            for(size_t i=0;i<m->count;i++){
                if(!strcmp(m->entries[i].key,k)){
                    res=copyv(&m->entries[i].val);
                    break;
                }
            }
        }
    }else if(!strcmp(n->text,"ds_map_destroy")){
        int id=count>0?(int)num(args[0]):0;
        for(size_t i=0;i<g_ds_map_count;i++){
            if(g_ds_maps[i].id==id){
                for(size_t j=0;j<g_ds_maps[i].count;j++)gml_value_free(&g_ds_maps[i].entries[j].val);
                free(g_ds_maps[i].entries);
                g_ds_maps[i]=g_ds_maps[--g_ds_map_count];
                break;
            }
        }
        res=gml_value_real(1);
    }else if(vm->script_call && vm->script_call(vm->script_userdata,n->text,args,count,&res)){
        /* resolved by script call */
    }else if(vm->native_call && vm->native_call(vm->native_userdata,n->text,args,count,&res)){
        /* resolved by native callback */
    }
    for(size_t i=0;i<count;i++)gml_value_free(&args[i]);
    return res;
}

static gml_value eval(gml_vm*vm,const gml_ast*n){if(!n)return undef();switch(n->kind){case GML_AST_NUMBER:return gml_value_real(n->number);case GML_AST_STRING:return gml_value_string(n->text);case GML_AST_NAME:{gml_value named=gml_vm_get(vm,n->text);if(named.kind==GML_V_UNDEFINED&&vm->name_resolve){gml_value resolved=undef();if(vm->name_resolve(vm->name_userdata,n->text,&resolved)){gml_value_free(&named);return resolved;}gml_value_free(&resolved);}return named;}case GML_AST_INDEX:return eval_index(vm,n);case GML_AST_MEMBER:return eval_member(vm,n);case GML_AST_CALL:return call(vm,n);case GML_AST_TERNARY:{gml_value condition=eval(vm,n->left);int choose_yes=truth(condition);gml_value_free(&condition);return eval(vm,choose_yes?n->right:n->items[0]);}case GML_AST_UNARY:{gml_value a=eval(vm,n->left);double x=num(a);gml_value r=(n->op==GML_T_NOT)?gml_value_bool(!truth(a)):gml_value_real(n->op==GML_T_MINUS?-x:x);gml_value_free(&a);return r;}case GML_AST_ASSIGN:{gml_value r=eval(vm,n->right);if(n->left&&n->left->kind==GML_AST_NAME)gml_vm_set(vm,n->left->text,r);else if(n->left&&n->left->kind==GML_AST_MEMBER&&n->left->left&&n->left->left->kind==GML_AST_NAME&&!strcmp(n->left->left->text,"self")){if(vm->member_set)vm->member_set(vm->member_userdata,n->left->text,&r);}else if(n->left&&n->left->kind==GML_AST_INDEX&&n->left&&n->left->left&&n->left->left->kind==GML_AST_NAME){gml_value*base=named_slot(vm,n->left->left->text);gml_value idx=eval(vm,n->left->right);size_t i=num(idx)<0?0:(size_t)num(idx);if(base&&base->kind==GML_V_ARRAY&&base->array&&i<base->array->count){gml_value_free(&base->array->items[i]);base->array->items[i]=copyv(&r);}gml_value_free(&idx);}return r;}case GML_AST_BINARY:{
 gml_value a=eval(vm,n->left);
 if(n->op==GML_T_AND){
  int left_truth=truth(a);
  gml_value_free(&a);
  if(!left_truth)return gml_value_bool(0);
  gml_value b=eval(vm,n->right);
  int right_truth=truth(b);
  gml_value_free(&b);
  return gml_value_bool(right_truth);
 }
 if(n->op==GML_T_OR){
  int left_truth=truth(a);
  gml_value_free(&a);
  if(left_truth)return gml_value_bool(1);
  gml_value b=eval(vm,n->right);
  int right_truth=truth(b);
  gml_value_free(&b);
  return gml_value_bool(right_truth);
 }
 gml_value b=eval(vm,n->right);double x=num(a),y=num(b),z=0;int bo=0;gml_value r=undef();switch(n->op){case GML_T_PLUS:if(a.kind==GML_V_STRING||b.kind==GML_V_STRING){const char*as=a.kind==GML_V_STRING?(a.string?a.string:""):"";const char*bs=b.kind==GML_V_STRING?(b.string?b.string:""):"";size_t na=strlen(as),nb=strlen(bs);char*joined=malloc(na+nb+1);if(joined){memcpy(joined,as,na);memcpy(joined+na,bs,nb+1);r=gml_value_string(joined);free(joined);}else r=undef();}else z=x+y;break;case GML_T_MINUS:z=x-y;break;case GML_T_STAR:z=x*y;break;case GML_T_SLASH:z=y==0?0:x/y;break;case GML_T_PERCENT:z=fmod(x,y);break;case GML_T_EQ:bo=(a.kind==GML_V_STRING||b.kind==GML_V_STRING)?!strcmp(a.string?a.string:"",b.string?b.string:""):x==y;break;case GML_T_NE:bo=(a.kind==GML_V_STRING||b.kind==GML_V_STRING)?strcmp(a.string?a.string:"",b.string?b.string:"")!=0:x!=y;break;case GML_T_LT:bo=x<y;break;case GML_T_LE:bo=x<=y;break;case GML_T_GT:bo=x>y;break;case GML_T_GE:bo=x>=y;break;case GML_T_AND:bo=truth(a)&&truth(b);break;case GML_T_OR:bo=truth(a)||truth(b);break;default:break;}r=(n->op==GML_T_PLUS&&(a.kind==GML_V_STRING||b.kind==GML_V_STRING))?r:(((n->op>=GML_T_EQ&&n->op<=GML_T_GE)||n->op==GML_T_AND||n->op==GML_T_OR)?gml_value_bool(bo):gml_value_real(z));gml_value_free(&a);gml_value_free(&b);return r;}default:return undef();}}
static void exec(gml_vm*vm,const gml_ast*n){if(!n||vm->returned||vm->error[0])return;switch(n->kind){case GML_AST_BLOCK:for(size_t i=0;i<n->count&&!vm->returned&&!vm->break_pending&&!vm->continue_pending&&!vm->error[0];i++)exec(vm,n->items[i]);break;case GML_AST_EXPR_STMT:{gml_value v=eval(vm,n->left);gml_value_free(&v);break;}case GML_AST_RETURN:vm->return_value=eval(vm,n->left);vm->returned=1;break;case GML_AST_EXIT:gml_value_free(&vm->return_value);vm->return_value=undef();vm->returned=1;break;case GML_AST_BREAK:vm->break_pending=1;break;case GML_AST_CONTINUE:vm->continue_pending=1;break;case GML_AST_IF:{gml_value c=eval(vm,n->left);if(truth(c))exec(vm,n->right);else if(n->count)exec(vm,n->items[0]);gml_value_free(&c);break;}case GML_AST_WHILE:{size_t guard=0;while(!vm->returned&&!vm->error[0]&&!vm->break_pending&&guard++<100000){gml_value c=eval(vm,n->left);int ok=truth(c);gml_value_free(&c);if(!ok)break;vm->continue_pending=0;exec(vm,n->right);if(vm->break_pending){vm->break_pending=0;break;}if(vm->continue_pending){vm->continue_pending=0;continue;}}if(guard>=100000&&!vm->returned)snprintf(vm->error,sizeof vm->error,"while loop limit exceeded");break;}case GML_AST_DO_UNTIL:{size_t guard=0;do{if(vm->returned||vm->error[0])break;vm->continue_pending=0;exec(vm,n->right);if(vm->break_pending){vm->break_pending=0;break;}if(vm->continue_pending)vm->continue_pending=0;gml_value c=eval(vm,n->left);int done=truth(c);gml_value_free(&c);if(done)break;}while(++guard<100000);if(guard>=100000&&!vm->returned&&!vm->error[0])snprintf(vm->error,sizeof vm->error,"do-until loop limit exceeded");break;}case GML_AST_SWITCH:{gml_value key=eval(vm,n->left);size_t match=(size_t)-1,def=(size_t)-1;for(size_t i=0;i<n->count;i++){const gml_ast*c=n->items[i];if(!c||c->kind!=GML_AST_SWITCH_CASE)continue;if(!c->left){def=i;continue;}gml_value cv=eval(vm,c->left);int same=(key.kind==GML_V_STRING||cv.kind==GML_V_STRING)?!strcmp(key.string?key.string:"",cv.string?cv.string:""):num(key)==num(cv);gml_value_free(&cv);if(same){match=i;break;}}if(match==(size_t)-1)match=def;if(match!=(size_t)-1){for(size_t i=match;i<n->count&&!vm->returned&&!vm->error[0];i++){const gml_ast*c=n->items[i];if(!c||c->kind!=GML_AST_SWITCH_CASE)continue;vm->continue_pending=0;exec(vm,c->right);if(vm->break_pending){vm->break_pending=0;break;}}}gml_value_free(&key);break;}case GML_AST_FOR:{if(n->count<4)break;gml_value init=eval(vm,n->items[0]);gml_value_free(&init);size_t guard=0;while(!vm->returned&&!vm->error[0]&&!vm->break_pending&&guard++<100000){gml_value c=eval(vm,n->items[1]);int ok=truth(c);gml_value_free(&c);if(!ok)break;vm->continue_pending=0;exec(vm,n->items[3]);if(vm->break_pending){vm->break_pending=0;break;}vm->continue_pending=0;gml_value post=eval(vm,n->items[2]);gml_value_free(&post);}if(guard>=100000&&!vm->returned)snprintf(vm->error,sizeof vm->error,"for loop limit exceeded");break;}case GML_AST_WITH:{gml_value target=eval(vm,n->left);if(vm->with_call)vm->with_call(vm->with_userdata,vm,&target,n->right);else snprintf(vm->error,sizeof vm->error,"with callback unavailable");gml_value_free(&target);break;}case GML_AST_REPEAT:{gml_value count=eval(vm,n->left);double raw=num(count);gml_value_free(&count);size_t limit=raw>0?(size_t)raw:0;if(limit>100000)limit=100000;for(size_t i=0;i<limit&&!vm->returned&&!vm->error[0];i++){vm->break_pending=0;vm->continue_pending=0;exec(vm,n->right);if(vm->break_pending){vm->break_pending=0;break;}if(vm->continue_pending)vm->continue_pending=0;}break;}default:break;}}
int gml_vm_execute(gml_vm*vm,const gml_ast*root){if(!vm||!root)return 0;vm->error[0]=0;vm->returned=0;vm->break_pending=0;vm->continue_pending=0;gml_value_free(&vm->return_value);exec(vm,root);return vm->error[0]==0;} int gml_vm_invoke(gml_vm*vm,const gml_ast*root,const gml_value*args,size_t count,gml_value*out){if(!vm||!root)return 0;int old_returned=vm->returned,old_break=vm->break_pending,old_continue=vm->continue_pending;gml_value old_return=copyv(&vm->return_value);char old_error[160];memcpy(old_error,vm->error,sizeof old_error);vm->returned=0;vm->break_pending=0;vm->continue_pending=0;vm->error[0]=0;gml_vm_push_scope(vm);for(size_t i=0;i<count&&i<16;i++){char name[16];snprintf(name,sizeof name,"arg%zu",i);gml_vm_set(vm,name,args[i]);}gml_value_free(&vm->return_value);vm->return_value=undef();exec(vm,root);if(out)*out=copyv(&vm->return_value);int ok=vm->error[0]==0;gml_vm_pop_scope(vm);gml_value_free(&vm->return_value);vm->return_value=old_return;vm->returned=old_returned;vm->break_pending=old_break;vm->continue_pending=old_continue;if(!ok)memcpy(old_error,vm->error,sizeof old_error);memcpy(vm->error,old_error,sizeof vm->error);return ok;}
