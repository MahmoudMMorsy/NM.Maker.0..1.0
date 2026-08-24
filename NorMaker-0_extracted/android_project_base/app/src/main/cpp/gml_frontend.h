#ifndef NOR_GML_FRONTEND_H
#define NOR_GML_FRONTEND_H

#include <stddef.h>

typedef enum {
    GML_T_EOF, GML_T_NUMBER, GML_T_STRING, GML_T_IDENT,
    GML_T_PLUS, GML_T_MINUS, GML_T_STAR, GML_T_SLASH, GML_T_PERCENT,
    GML_T_ASSIGN, GML_T_PLUS_ASSIGN, GML_T_MINUS_ASSIGN, GML_T_STAR_ASSIGN, GML_T_SLASH_ASSIGN, GML_T_AND, GML_T_OR, GML_T_NOT, GML_T_EQ, GML_T_NE, GML_T_LT, GML_T_LE, GML_T_GT, GML_T_GE,
    GML_T_LPAREN, GML_T_RPAREN, GML_T_LBRACE, GML_T_RBRACE, GML_T_LBRACKET, GML_T_RBRACKET,
    GML_T_SEMI, GML_T_COMMA, GML_T_DOT, GML_T_QUESTION, GML_T_COLON,
    GML_T_IF, GML_T_ELSE, GML_T_VAR, GML_T_RETURN, GML_T_EXIT, GML_T_WHILE, GML_T_DO, GML_T_UNTIL, GML_T_SWITCH, GML_T_CASE, GML_T_DEFAULT, GML_T_FOR, GML_T_REPEAT, GML_T_BREAK, GML_T_CONTINUE, GML_T_WITH
} gml_token_kind;

typedef struct {
    gml_token_kind kind;
    const char *start;
    size_t length;
    double number;
} gml_token;

typedef struct {
    const char *source;
    size_t length;
    size_t offset;
    int line;
} gml_lexer;

void gml_lexer_init(gml_lexer *lexer, const char *source);
int gml_lexer_next(gml_lexer *lexer, gml_token *out);

typedef enum {
    GML_AST_NUMBER, GML_AST_STRING, GML_AST_NAME, GML_AST_INDEX, GML_AST_MEMBER, GML_AST_ASSIGN, GML_AST_BINARY, GML_AST_UNARY, GML_AST_WHILE, GML_AST_DO_UNTIL, GML_AST_SWITCH, GML_AST_SWITCH_CASE, GML_AST_FOR, GML_AST_REPEAT, GML_AST_WITH, GML_AST_CALL, GML_AST_BLOCK,
    GML_AST_IF, GML_AST_RETURN, GML_AST_EXIT, GML_AST_BREAK, GML_AST_CONTINUE, GML_AST_TERNARY, GML_AST_EXPR_STMT
} gml_ast_kind;

typedef struct gml_ast gml_ast;
struct gml_ast {
    gml_ast_kind kind;
    double number;
    char *text;
    int op;
    gml_ast *left;
    gml_ast *right;
    gml_ast **items;
    size_t count;
};

typedef struct {
    const char *source;
    size_t length;
    size_t offset;
    int line;
    char error[160];
} gml_parser;

int gml_parse_program(const char *source, gml_ast **out, char *error, size_t error_cap);
void gml_ast_free(gml_ast *node);
const char *gml_token_name(gml_token_kind kind);

#endif
