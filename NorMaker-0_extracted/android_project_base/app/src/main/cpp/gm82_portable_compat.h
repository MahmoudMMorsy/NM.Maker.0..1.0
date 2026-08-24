#ifndef GM82_PORTABLE_COMPAT_H
#define GM82_PORTABLE_COMPAT_H

#ifdef __cplusplus
extern "C" {
#endif

int gm82_portable_dllcheck(void);
double gm82_portable_color_reverse(double color);
double gm82_portable_color_inverse(double color);
int gm82_portable_token_start(const char *text, const char *separator);
const char *gm82_portable_token_next(void);
void gm82_portable_token_reset(void);

#ifdef __cplusplus
}
#endif
#endif
