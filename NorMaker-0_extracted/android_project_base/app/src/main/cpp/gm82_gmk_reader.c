#include "gm82_gmk_reader.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <zlib.h>

typedef struct { const uint8_t *p; size_t n, o; } gmk_reader;
static int u32(gmk_reader *r, uint32_t *v) { if (!r || !v || r->o + 4 > r->n) return 0; *v=(uint32_t)r->p[r->o]|((uint32_t)r->p[r->o+1]<<8)|((uint32_t)r->p[r->o+2]<<16)|((uint32_t)r->p[r->o+3]<<24); r->o+=4; return 1; }
static int i32(gmk_reader *r, int32_t *v) { uint32_t x; if (!u32(r,&x)) return 0; *v=(int32_t)x; return 1; }
static int skip(gmk_reader *r, size_t n) { if (!r || n > r->n-r->o) return 0; r->o+=n; return 1; }
static int str(gmk_reader *r, char *out, size_t cap) {
    int32_t len=0; if (!i32(r,&len) || len < 0 || (size_t)len > r->n-r->o) return 0;
    size_t take = 0;
    if (cap > 0) take = (size_t)len < cap - 1 ? (size_t)len : cap - 1;
    if (cap) { memcpy(out,r->p+r->o,take); out[take]=0; }
    r->o+=(size_t)len; return 1;
}
static int chunk_owned(gmk_reader *r, uint32_t seed, uint8_t **out, size_t *outn) {
    uint32_t len=0; if (!u32(r,&len) || len > r->n-r->o || len > 50u*1024u*1024u) return 0;
    uint8_t *raw=(uint8_t*)malloc(len ? len : 1); if(!raw) return 0; memcpy(raw,r->p+r->o,len); r->o+=(size_t)len;
    if(seed) { uint32_t key=seed; for(uint32_t i=0;i<len;i++){ raw[i]=(uint8_t)(raw[i]^(key&0xffu)); key=key*0x08088405u+1u; } }
    if(len>2 && raw[0]==0x78) { uLongf cap=(uLongf)(len*8u+1024u); if(cap>100u*1024u*1024u) cap=100u*1024u*1024u; uint8_t *infl=NULL; int rc=Z_BUF_ERROR; while(rc==Z_BUF_ERROR && cap<=100u*1024u*1024u){ infl=(uint8_t*)realloc(infl,(size_t)cap); if(!infl) {free(raw);return 0;} uLongf got=cap; rc=uncompress(infl,&got,raw,(uLong)len); if(rc==Z_BUF_ERROR) cap*=2u; else if(rc==Z_OK){free(raw);*out=infl;*outn=(size_t)got;return 1;} } free(infl); }
    *out=raw; *outn=(size_t)len; return 1;
}
static void json_escape(char *dst, size_t cap, const char *src) {
    size_t o=0; if (!cap) return;
    for (size_t i=0; src && src[i] && o+2<cap; ++i) { unsigned char c=(unsigned char)src[i]; if (c=='"'||c=='\\') { dst[o++]='\\'; dst[o++]=(char)c; } else if (c>=32) dst[o++]=(char)c; }
    dst[o]=0;
}
static int append(char **s, size_t *cap, size_t *len, const char *fmt, ...) {
    va_list ap; va_start(ap,fmt); va_list cp; va_copy(cp,ap); int need=vsnprintf(NULL,0,fmt,cp); va_end(cp); if (need<0) { va_end(ap); return 0; }
    if (*len+(size_t)need+1>*cap) { size_t nc=*cap?*cap:1024; while (*len+(size_t)need+1>nc) nc*=2; char *p=(char*)realloc(*s,nc); if (!p) { va_end(ap); return 0; } *s=p; *cap=nc; }
    vsnprintf(*s+*len,*cap-*len,fmt,ap); va_end(ap); *len+=(size_t)need; return 1;
}
static int skip_trigger_list(gmk_reader *r, int version, uint32_t seed, char **json, size_t *cap, size_t *len, int *first) {
    int32_t lv=0,count=0; if (!i32(r,&lv)||!i32(r,&count)||count<0||count>100000) return 0;
    if (!append(json,cap,len,"%s\"Triggers\":{\"version\":%d,\"count\":%d,\"items\":[",*first?"":",",lv,count)) return 0;
    *first=0;
    int shown=0;
    for (int32_t id=0; id<count; ++id) { int32_t exists=0; if(!i32(r,&exists)) return 0; if(!exists) continue; const uint8_t *cp; size_t cn; if(version>=800){uint8_t *owned=NULL;if(!chunk_owned(r,seed,&owned,&cn))return 0;cp=owned;}else return 0; gmk_reader q={cp,cn,0}; int32_t tv=0,step=0; char name[192]={0}; if(!i32(&q,&tv)||!str(&q,name,sizeof(name))||!str(&q,name,sizeof(name))||!i32(&q,&step)||!str(&q,name,sizeof(name))) { /* preserve item even if trigger payload is incomplete */ }
        char esc[400]; json_escape(esc,sizeof(esc),name); free((void*)cp); if(shown++>0&&!append(json,cap,len,","))return 0; if(!append(json,cap,len,"{\"id\":%d,\"exists\":true,\"name\":\"%s\",\"chunkBytes\":%zu}",id,esc,cn))return 0;
    }
    return append(json,cap,len,"]}");
}
static int read_discard_string(gmk_reader *r) { char b[2]; return str(r,b,sizeof(b)); }
static int read_bool32(gmk_reader *r, int *v) { int32_t x=0; if(!i32(r,&x)) return 0; if(v) *v=(x!=0); return 1; }
static int skip_action_block(gmk_reader *r, int *actionsOut) {
    int32_t ver=0,count=0; if(!i32(r,&ver)||!i32(r,&count)||count<0||count>1000) return 0;
    for(int32_t k=0;k<count;k++) {
        int32_t x=0,args=0; int b=0;
        if(!i32(r,&x)||!i32(r,&x)||!i32(r,&x)||!i32(r,&x)) return 0;
        if(!read_bool32(r,&b)||!read_bool32(r,&b)||!read_bool32(r,&b)||!i32(r,&x)) return 0;
        if(!read_discard_string(r)||!read_discard_string(r)||!i32(r,&args)||args<0||args>64) return 0;
        for(int32_t a=0;a<args;a++) if(!i32(r,&x)) return 0;
        if(!i32(r,&x)||!read_bool32(r,&b)) return 0;
        for(int32_t a=0;a<args;a++) if(!read_discard_string(r)) return 0;
        if(!read_bool32(r,&b)) return 0;
    }
    if(actionsOut) *actionsOut=count;
    return 1;
}
static int append_payload_summary(gmk_reader *q, const char *label, char **json, size_t *cap, size_t *len) {
    char tmp[4096]; int32_t ver=0,x=0; int b=0;
    if(strcmp(label,"Scripts")==0) {
        if(q->o+8>q->n || !skip(q,8) || !i32(q,&ver)) return append(json,cap,len,"\"payloadStatus\":\"partial\"");
        char code[3000]={0}; if(!str(q,code,sizeof(code))) return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        char esc[6000]; json_escape(esc,sizeof(esc),code);
        return append(json,cap,len,"\"payloadStatus\":\"decoded\",\"version\":%d,\"code\":\"%s\"",ver,esc);
    }
    if(strcmp(label,"Objects")==0) {
        if(q->o+8>q->n || !skip(q,8) || !i32(q,&ver)) return append(json,cap,len,"\"payloadStatus\":\"partial\"");
        int32_t sprite=0,depth=0,parent=0,mask=0; if(!i32(q,&sprite)||!read_bool32(q,&b)||!read_bool32(q,&b)||!i32(q,&depth)||!read_bool32(q,&b)||!i32(q,&parent)||!i32(q,&mask)) return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        int events=0, actions=0;
        for(int main=0;main<11;main++) { while(q->o+4<=q->n) { int32_t sub=0; if(!i32(q,&sub)) return 0; if(sub==-1) break; int ac=0; if(!skip_action_block(q,&ac)) return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d,\"eventsDecoded\":%d,\"actionsDecoded\":%d",ver,events,actions); events++; actions+=ac; } }
        return append(json,cap,len,"\"payloadStatus\":\"decoded\",\"version\":%d,\"spriteId\":%d,\"depth\":%d,\"parentId\":%d,\"maskId\":%d,\"eventsDecoded\":%d,\"actionsDecoded\":%d",ver,sprite,depth,parent,mask,events,actions);
    }
    if(strcmp(label,"Sounds")==0) {
        if(q->o+8>q->n || !skip(q,8) || !i32(q,&ver)) return append(json,cap,len,"\"payloadStatus\":\"partial\"");
        int32_t kind=0,effects=0; char type[96]={0},file[256]={0}; int has=0,preload=0; double volume=0.0,pan=0.0;
        if(!i32(q,&kind)||!str(q,type,sizeof(type))||!str(q,file,sizeof(file))||!read_bool32(q,&has)) return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        if(has){int32_t bytes=0;if(!i32(q,&bytes)||bytes<0||(size_t)bytes>q->n-q->o||!skip(q,(size_t)bytes))return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);}
        if (!i32(q, &effects) || q->o + 16 > q->n)
            return append(json, cap, len, "\"payloadStatus\":\"partial\",\"version\":%d", ver);
        memcpy(&volume, q->p + q->o, 8); q->o += 8;
        memcpy(&pan, q->p + q->o, 8); q->o += 8;
        if (!read_bool32(q, &preload)) return 0;
        char et[192],ef[512];json_escape(et,sizeof(et),type);json_escape(ef,sizeof(ef),file); return append(json,cap,len,"\"payloadStatus\":\"decoded\",\"version\":%d,\"kind\":%d,\"fileType\":\"%s\",\"fileName\":\"%s\",\"hasData\":%s,\"effects\":%d,\"volume\":%.17g,\"pan\":%.17g,\"preload\":%s",ver,kind,et,ef,has?"true":"false",effects,volume,pan,preload?"true":"false");
    }
    if(strcmp(label,"Sprites")==0) {
        if(q->o+8>q->n || !skip(q,8) || !i32(q,&ver)) return append(json,cap,len,"\"payloadStatus\":\"partial\"");
        int32_t w=0,h=0,ox=0,oy=0,sub=0; if(!i32(q,&w)||!i32(q,&h)||!skip(q,36)||!i32(q,&ox)||!i32(q,&oy)||!i32(q,&sub)||sub<0)return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        return append(json,cap,len,"\"payloadStatus\":\"decoded\",\"version\":%d,\"width\":%d,\"height\":%d,\"originX\":%d,\"originY\":%d,\"subImages\":%d,\"remainingBytes\":%zu",ver,w,h,ox,oy,sub,q->n-q->o);
    }
    if(strcmp(label,"Backgrounds")==0) {
        if(q->o+8>q->n || !skip(q,8) || !i32(q,&ver)) return append(json,cap,len,"\"payloadStatus\":\"partial\"");
        int use=0; int32_t tw=0,th=0,ho=0,vo=0,hs=0,vs=0,bv=0,w=0,h=0; if(!read_bool32(q,&use)||!i32(q,&tw)||!i32(q,&th)||!i32(q,&ho)||!i32(q,&vo)||!i32(q,&hs)||!i32(q,&vs)||!i32(q,&bv))return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver); if(bv>=800&&(!i32(q,&w)||!i32(q,&h)))return 0;
        return append(json,cap,len,"\"payloadStatus\":\"decoded\",\"version\":%d,\"useAsTileset\":%s,\"tileWidth\":%d,\"tileHeight\":%d,\"width\":%d,\"height\":%d,\"remainingBytes\":%zu",ver,use?"true":"false",tw,th,w,h,q->n-q->o);
    }
    if(strcmp(label,"Paths")==0) {
        if(q->o+8>q->n || !skip(q,8) || !i32(q,&ver)) return append(json,cap,len,"\"payloadStatus\":\"partial\"");
        int smooth=0,closed=0; int32_t precision=0,room=0,sx=0,sy=0,count=0;
        if(!read_bool32(q,&smooth)||!read_bool32(q,&closed)||!i32(q,&precision)||!i32(q,&room)||!i32(q,&sx)||!i32(q,&sy)||!i32(q,&count)||count<0||count>100000)
            return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        for(int32_t i=0;i<count;i++) if(!skip(q,24)) return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d,\"pointsDecoded\":%d",ver,i);
        return append(json,cap,len,"\"payloadStatus\":\"decoded\",\"version\":%d,\"smooth\":%s,\"closed\":%s,\"precision\":%d,\"roomId\":%d,\"snapX\":%d,\"snapY\":%d,\"points\":%d",ver,smooth?"true":"false",closed?"true":"false",precision,room,sx,sy,count);
    }
    if(strcmp(label,"Fonts")==0) {
        if(q->o+8>q->n || !skip(q,8) || !i32(q,&ver)) return append(json,cap,len,"\"payloadStatus\":\"partial\"");
        char fontName[192]={0}; int32_t size=0,firstChar=0,lastChar=0,charset=0,aa=0; int bold=0,italic=0;
        if(!str(q,fontName,sizeof(fontName))||!i32(q,&size)||!read_bool32(q,&bold)||!read_bool32(q,&italic)) return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        if(ver>=800 && (!i32(q,&firstChar)||!i32(q,&lastChar)||!i32(q,&charset)||!i32(q,&aa))) return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        char ef[400]; json_escape(ef,sizeof(ef),fontName);
        return append(json,cap,len,"\"payloadStatus\":\"decoded\",\"version\":%d,\"fontName\":\"%s\",\"size\":%d,\"bold\":%s,\"italic\":%s,\"firstChar\":%d,\"lastChar\":%d,\"charset\":%d,\"aaLevel\":%d",ver,ef,size,bold?"true":"false",italic?"true":"false",firstChar,lastChar,charset,aa);
    }
    if(strcmp(label,"Timelines")==0) {
        if(q->o+8>q->n || !skip(q,8) || !i32(q,&ver)) return append(json,cap,len,"\"payloadStatus\":\"partial\"");
        int32_t moments=0; if(!i32(q,&moments)||moments<0||moments>100000) return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        int totalActions=0;
        for(int32_t i=0;i<moments;i++){int32_t step=0,ac=0;if(!i32(q,&step)||!skip_action_block(q,(int*)&ac))return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d,\"momentsDecoded\":%d,\"actionsDecoded\":%d",ver,i,totalActions);totalActions+=ac;}
        return append(json,cap,len,"\"payloadStatus\":\"decoded\",\"version\":%d,\"moments\":%d,\"actionsDecoded\":%d",ver,moments,totalActions);
    }
    if(strcmp(label,"Rooms")==0) {
        if(q->o+8>q->n || !skip(q,8) || !i32(q,&ver)) return append(json,cap,len,"\"payloadStatus\":\"partial\"");
        char caption[512]={0}; int32_t w=0,h=0,snapY=0,snapX=0,speed=0,color=0; int32_t roomW=0,roomH=0,roomSpeed=0; int iso=0,persistent=0,showColor=0;
        if(!str(q,caption,sizeof(caption))||!i32(q,&roomW)||!i32(q,&roomH)||!i32(q,&snapY)||!i32(q,&snapX)||!read_bool32(q,&iso)||!i32(q,&roomSpeed)||!read_bool32(q,&persistent)||!i32(q,&color)||!read_bool32(q,&showColor)||!read_discard_string(q))
            return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        int32_t nb=0,nv=0,ni=0,nt=0; if(!i32(q,&nb)||nb<0||nb>100000)return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        for(int32_t i=0;i<nb;i++){int z=0; if(!read_bool32(q,&z)||!read_bool32(q,&z)||!i32(q,&w)||!i32(q,&h)||!read_bool32(q,&z)||!read_bool32(q,&z)||!i32(q,&speed)||!i32(q,&speed)||!read_bool32(q,&z))return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d,\"backgroundsDecoded\":%d",ver,i);}
        if(!read_bool32(q,&showColor)||!i32(q,&nv)||nv<0||nv>100000)return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d,\"backgrounds\":%d",ver,nb);
        if(!append(json,cap,len,"\"viewsEnabled\":%s,\"views\":[",showColor?"true":"false"))return 0;
        for(int32_t i=0;i<nv;i++){
            int z=0; int32_t vx=0,vy=0,vw=0,vh=0,px=0,py=0,pw=0,ph=0,hb=0,vb=0,hs=0,vs=0,oid=0;
            if(!read_bool32(q,&z)||!i32(q,&vx)||!i32(q,&vy)||!i32(q,&vw)||!i32(q,&vh)||!i32(q,&px)||!i32(q,&py)||!i32(q,&pw)||!i32(q,&ph)||!i32(q,&hb)||!i32(q,&vb)||!i32(q,&hs)||!i32(q,&vs)||!i32(q,&oid))return append(json,cap,len,"],\"payloadStatus\":\"partial\",\"version\":%d,\"viewsDecoded\":%d",ver,i);
            if(!append(json,cap,len,"%s{\"visible\":%s,\"viewX\":%d,\"viewY\":%d,\"viewW\":%d,\"viewH\":%d,\"portX\":%d,\"portY\":%d,\"portW\":%d,\"portH\":%d,\"hBorder\":%d,\"vBorder\":%d,\"hSpeed\":%d,\"vSpeed\":%d,\"objectId\":%d}",i?",":"",z?"true":"false",vx,vy,vw,vh,px,py,pw,ph,hb,vb,hs,vs,oid))return 0;
        }
        if(!i32(q,&ni)||ni<0||ni>100000)return append(json,cap,len,"],\"payloadStatus\":\"partial\",\"version\":%d,\"views\":%d",ver,nv);
        if(!append(json,cap,len,"],\"instances\":["))return 0;
        for(int32_t i=0;i<ni;i++){
            int32_t ix=0,iy=0,oid=0,iid=0; int locked=0; char code[1024]={0},escCode[2048]={0};
            if(!i32(q,&ix)||!i32(q,&iy)||!i32(q,&oid)||!i32(q,&iid)||!str(q,code,sizeof(code))||!read_bool32(q,&locked))return append(json,cap,len,"],\"payloadStatus\":\"partial\",\"version\":%d,\"instancesDecoded\":%d",ver,i);
            json_escape(escCode,sizeof(escCode),code);
            if(!append(json,cap,len,"%s{\"x\":%d,\"y\":%d,\"objectId\":%d,\"instanceId\":%d,\"creationCode\":\"%s\",\"locked\":%s}",i?",":"",ix,iy,oid,iid,escCode,locked?"true":"false"))return 0;
        }
        if(!i32(q,&nt)||nt<0||nt>100000)return append(json,cap,len,"],\"payloadStatus\":\"partial\",\"version\":%d,\"instances\":%d",ver,ni);
        if(!append(json,cap,len,"],\"tiles\":["))return 0;
        for(int32_t i=0;i<nt;i++){
            int32_t tx=0,ty=0,bgid=0,bgx=0,bgy=0,tw=0,th=0,td=0,tid=0; int locked=0;
            if(!i32(q,&tx)||!i32(q,&ty)||!i32(q,&bgid)||!i32(q,&bgx)||!i32(q,&bgy)||!i32(q,&tw)||!i32(q,&th)||!i32(q,&td)||!i32(q,&tid)||!read_bool32(q,&locked))return append(json,cap,len,"],\"payloadStatus\":\"partial\",\"version\":%d,\"tilesDecoded\":%d",ver,i);
            if(!append(json,cap,len,"%s{\"x\":%d,\"y\":%d,\"backgroundId\":%d,\"backgroundX\":%d,\"backgroundY\":%d,\"width\":%d,\"height\":%d,\"depth\":%d,\"tileId\":%d,\"locked\":%s}",i?",":"",tx,ty,bgid,bgx,bgy,tw,th,td,tid,locked?"true":"false"))return 0;
        }
        if(!append(json,cap,len,"] ,"))return 0;
        int editorRemember=0, editorFlag=0; int32_t editorWidth=0,editorHeight=0,editorTab=0,scrollX=0,scrollY=0;
        if(!read_bool32(q,&editorRemember)||!i32(q,&editorWidth)||!i32(q,&editorHeight))return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        for(int k=0;k<8;k++)if(!read_bool32(q,&editorFlag))return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        if(!i32(q,&editorTab)||!i32(q,&scrollX)||!i32(q,&scrollY))return append(json,cap,len,"\"payloadStatus\":\"partial\",\"version\":%d",ver);
        char escCaption[1024]; json_escape(escCaption,sizeof(escCaption),caption);
        return append(json,cap,len,"\"payloadStatus\":\"decoded\",\"version\":%d,\"caption\":\"%s\",\"width\":%d,\"height\":%d,\"speed\":%d,\"persistent\":%s,\"backgrounds\":%d,\"viewCount\":%d,\"instanceCount\":%d,\"tileCount\":%d",ver,escCaption,roomW,roomH,roomSpeed,persistent?"true":"false",nb,nv,ni,nt);
    }
    (void)tmp; (void)x; (void)b; return append(json,cap,len,"\"payloadStatus\":\"raw-preserved\"");
}
static int skip_list(gmk_reader *r, int version, uint32_t seed, const char *label, char **json, size_t *cap, size_t *len, int *first) {
    int32_t lv=0,count=0; if (!i32(r,&lv)||!i32(r,&count)||count<0||count>100000) return 0;
    if (!append(json,cap,len,"%s\"%s\":{\"version\":%d,\"count\":%d,\"items\":[",*first?"":",",label,lv,count)) return 0;
    *first=0;
    int shown=0;
    for (int32_t id=0; id<count; ++id) {
        int32_t exists=0; if (!i32(r,&exists)) return 0;
        if (!exists) continue;
        const uint8_t *cp=NULL; size_t cn=0; size_t payloadOffset=0; uint32_t rawBytes=0;
        if (version>=800) {
            if (r->o + 4 > r->n) return 0;
            payloadOffset = r->o + 4;
            rawBytes = (uint32_t)r->p[r->o] | ((uint32_t)r->p[r->o+1] << 8) |
                       ((uint32_t)r->p[r->o+2] << 16) | ((uint32_t)r->p[r->o+3] << 24);
            uint8_t *owned=NULL; if (!chunk_owned(r,seed,&owned,&cn)) return 0; cp=owned;
        }
        else { cp=r->p+r->o; cn=r->n-r->o; }
        gmk_reader q={cp,cn,0}; char name[192]={0}; int has=str(&q,name,sizeof(name));
        if (version<800) { /* legacy item length is not safely inferable here */ return 0; }
        char esc[400]; json_escape(esc,sizeof(esc),has?name:"");
        if (shown++ > 0 && !append(json,cap,len,",")) { free((void*)cp); return 0; }
        if (!append(json,cap,len,"{\"id\":%d,\"exists\":true,\"name\":\"%s\",\"payloadOffset\":%zu,\"rawBytes\":%u,\"decodedBytes\":%zu,\"chunkBytes\":%zu,",id,esc,payloadOffset,rawBytes,cn,cn)) { free((void*)cp); return 0; }
        if (!append_payload_summary(&q,label,json,cap,len) || !append(json,cap,len,"}")) { free((void*)cp); return 0; }
        free((void*)cp);
    }
    return append(json,cap,len,"]}");
}
static char *gm82_gmk_resource_manifest_json_full(const uint8_t *data, size_t size) {
    if (!data || size<8) return NULL;
    gmk_reader r={data,size,0}; int32_t magic=0,version=0,app=0;
    if (!i32(&r,&magic)||!i32(&r,&version)||!i32(&r,&app)) return NULL;
    if (!((magic==1234321)||(magic==978472782)||(uint32_t)magic==0x32386d67u) || version<500 || version>900) return NULL;
    int skipInts=(version==800)?8:4; for(int i=0;i<skipInts;i++){int32_t x;if(!i32(&r,&x))return NULL;}
    uint32_t seed=(version==800)?(uint32_t)app:0; int32_t settingsVer=0; if(!i32(&r,&settingsVer))return NULL; if(settingsVer>=800){uint8_t *p=NULL;size_t n=0;if(!chunk_owned(&r,seed,&p,&n)){free(p);return NULL;}free(p); if(!skip(&r,8))return NULL;}
    if(version>=800 && r.o+8<=r.n) { /* settings last-changed already consumed */ }
    /* Triggers, constants, and resource lists follow the GM8 ordering. */
    int first=1; char *json=NULL; size_t cap=0,len=0;
    if(!append(&json,&cap,&len,"{\"ok\":true,\"format\":\"GMK\",\"magic\":%d,\"version\":%d,\"appId\":%d,\"resources\":{",magic,version,app)) {free(json);return NULL;}
    /* Triggers */
    if(!skip_trigger_list(&r,version,seed,&json,&cap,&len,&first)) {free(json);return NULL;}
    if(version>=800 && !skip(&r,8)) {free(json);return NULL;}
    /* Constants: version, compressed chunk, last-changed. */
    int32_t constantsVer=0; if(!i32(&r,&constantsVer)) {free(json);return NULL;}
    if(constantsVer>=800) { uint8_t *p=NULL; size_t n; if(!chunk_owned(&r,seed,&p,&n)||!skip(&r,8)) {free(p);free(json);return NULL;} free(p); }
    const char *labels[] = {"Sounds","Sprites","Backgrounds","Paths","Scripts","Fonts","Timelines","Objects","Rooms"};
    for(size_t i=0;i<sizeof(labels)/sizeof(labels[0]);++i) { if(!skip_list(&r,version,seed,labels[i],&json,&cap,&len,&first)) {free(json);return NULL;} if(version>=800 && !skip(&r,8)) {free(json);return NULL;} }
    if(!append(&json,&cap,&len,"},\"bytesConsumed\":%zu,\"bytesTotal\":%zu}",r.o,size)) {free(json);return NULL;}
    return json;
}

gm82_gmk_probe_result gm82_gmk_probe(const uint8_t *data, size_t size) {
    gm82_gmk_probe_result result;
    result.format_kind = GM82_GMK_FORMAT_UNKNOWN;
    result.status = GM82_GMK_PARSE_INVALID;
    result.magic = 0;
    result.version = 0;
    result.app_id = 0;
    result.header_bytes = 0;
    result.error_code = "buffer_too_small";
    if (!data || size < 12) return result;
    uint32_t umagic = (uint32_t)data[0] | ((uint32_t)data[1] << 8) |
                      ((uint32_t)data[2] << 16) | ((uint32_t)data[3] << 24);
    uint32_t uversion = (uint32_t)data[4] | ((uint32_t)data[5] << 8) |
                       ((uint32_t)data[6] << 16) | ((uint32_t)data[7] << 24);
    uint32_t uapp = (uint32_t)data[8] | ((uint32_t)data[9] << 8) |
                   ((uint32_t)data[10] << 16) | ((uint32_t)data[11] << 24);
    result.magic = (int32_t)umagic;
    result.version = (int32_t)uversion;
    result.app_id = (int32_t)uapp;
    result.header_bytes = 12;
    if (!((umagic == 1234321u) || (umagic == 978472782u) || umagic == 0x32386d67u)) {
        result.error_code = "bad_magic";
        return result;
    }
    if (uversion < 500u || uversion > 900u) {
        result.error_code = "unsupported_version";
        return result;
    }
    result.format_kind = (uversion == 810u) ? GM82_GMK_FORMAT_GM81 : GM82_GMK_FORMAT_GM7_GM8;
    result.status = GM82_GMK_PARSE_PARTIAL;
    result.error_code = NULL;
    return result;
}

char *gm82_gmk_resource_manifest_json(const uint8_t *data, size_t size) {
    char *full = gm82_gmk_resource_manifest_json_full(data, size);
    if (full) return full;
    if (!data || size < 12) return NULL;
    int32_t magic = (int32_t)((uint32_t)data[0] | ((uint32_t)data[1]<<8) | ((uint32_t)data[2]<<16) | ((uint32_t)data[3]<<24));
    int32_t version = (int32_t)((uint32_t)data[4] | ((uint32_t)data[5]<<8) | ((uint32_t)data[6]<<16) | ((uint32_t)data[7]<<24));
    int32_t app = (int32_t)((uint32_t)data[8] | ((uint32_t)data[9]<<8) | ((uint32_t)data[10]<<16) | ((uint32_t)data[11]<<24));
    if (!((magic==1234321)||(magic==978472782)||(uint32_t)magic==0x32386d67u) || version<500 || version>900) return NULL;
    char *fallback=(char*)malloc(256); if(!fallback) return NULL;
    snprintf(fallback,256,"{\"ok\":true,\"format\":\"GMK\",\"magic\":%d,\"version\":%d,\"appId\":%d,\"parseStatus\":\"partial\",\"warning\":\"resource layout requires a matching GM8 fixture; raw bytes preserved\"}",magic,version,app);
    return fallback;
}
