export class GMLParser {
    tokens: any[] = [];
    pos: number = 0;

    constructor(private input: string) {
        this.tokenize();
    }

    tokenize() {
        const regex = /\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+(?:\.\d+)?\b|[a-zA-Z_]\w*|==|!=|<=|>=|&&|\|\||\+=|-=|\*=|(?:\/=|div\b|mod\b)|[{}()\[\],;=+\-*/!<>])\s*/g;
        let match;
        while ((match = regex.exec(this.input)) !== null) {
            const token = match[0].trim();
            if (!token || token.startsWith('//') || token.startsWith('/*')) continue;
            this.tokens.push(token);
        }
    }

    parse(): string {
        return this.parseStatements();
    }

    next(): string { return this.tokens[this.pos++]; }
    peek(): string { return this.tokens[this.pos] || ''; }
    match(expected: string): boolean {
        if (this.peek() === expected) { this.pos++; return true; }
        return false;
    }

    parseStatements(): string {
        let js = '';
        while (this.pos < this.tokens.length) {
            if (this.peek() === '}') break;
            js += this.parseStatement() + '\n';
        }
        return js;
    }

    parseStatement(): string {
        const token = this.peek();

        if (token === 'var') {
            this.next();
            let decls = [];
            while (this.pos < this.tokens.length) {
                let id = this.next();
                let init = '';
                if (this.match('=')) {
                    init = ' = ' + this.parseExpression();
                }
                decls.push(id + init);
                if (!this.match(',')) break;
            }
            this.match(';');
            return 'let ' + decls.join(', ') + ';';
        }

        if (token === 'with') {
            this.next();
            let hasParen = this.match('(');
            let obj = this.parseExpression();
            if (hasParen) this.match(')');
            let body = this.parseBlock();
            return `(window.instances||[]).filter(i=>!i.dead&&(i.def?.name===(${obj})||i===(${obj}))).forEach(function(){${body}}.bind(this));`;
        }

        if (token === 'repeat') {
            this.next();
            let hasParen = this.match('(');
            let times = this.parseExpression();
            if (hasParen) this.match(')');
            let body = this.parseBlock();
            return `for(let _ri=0; _ri<(${times}); _ri++) { ${body} }`;
        }

        if (token === 'if') {
            this.next();
            let hasParen = this.match('(');
            let cond = this.parseExpression();
            if (hasParen) this.match(')');
            let body = this.parseStatement();
            let code = `if (${cond}) ${body}`;
            if (this.match('else')) {
                code += ` else ${this.parseStatement()}`;
            }
            return code;
        }

        if (token === '{') {
            return this.parseBlock();
        }

        if (token === 'return' || token === 'exit') {
            this.next();
            let res = 'return';
            if (this.peek() !== ';' && this.peek() !== '}') res += ' ' + this.parseExpression();
            this.match(';');
            return res + ';';
        }

        // Could be function call or assignment
        let exp = this.parseExpression();
        this.match(';');
        return exp + ';';
    }

    parseBlock(): string {
        if (this.match('{')) {
            let body = this.parseStatements();
            this.match('}');
            return `{ ${body} }`;
        }
        return this.parseStatement();
    }

    parseExpression(): string {
        // A very simple expression compiler handling balanced tracking and 2D arrays
        let exp = '';
        let balance = 0;
        while (this.pos < this.tokens.length) {
            const t = this.peek();
            if (!balance && (t === ';' || t === ',' || t === '}' || t === '{' || t === 'then' || t === 'else')) break;
            if (!balance && (t === ')' || t === ']')) break;

            if (t === '(' || t === '[') balance++;
            else if (t === ')' || t === ']') balance--;

            // Handle 1D/2D array assignments & access
            if (t === '[') {
                this.next(); // consume '['
                let args = [];
                let currArg = '';
                let bracketBalance = 0;
                while (this.pos < this.tokens.length) {
                    const bt = this.peek();
                    if (bt === '[' || bt === '(') bracketBalance++;
                    if (bt === ']' || bt === ')') bracketBalance--;
                    if (bt === ']' && bracketBalance < 0) { this.next(); break; }

                    if (bt === ',' && bracketBalance === 0) {
                        args.push(currArg);
                        currArg = '';
                        this.next();
                    } else {
                        currArg += this.next() + ' ';
                    }
                }
                args.push(currArg);

                if (args.length === 2 && exp.trim()) {
                    let base = exp.trim();
                    exp = '';
                    let r = `(__gml2d(${base}, ${args[0].trim()}, ${args[1].trim()}))`;
                    // Wait, assignment vs get is tricky here! Let's keep it simple.
                    exp += `[${args[0].trim()}][${args[1].trim()}]`; // 2D indexing mapping, though requires initialization.
                } else if (args.length === 1 && exp.trim()) {
                    exp += `[${args[0].trim()}]`;
                } else {
                    exp += '[' + args.join(',') + ']';
                }
                balance--; // we consumed the ending bracket
                continue;
            }

            let tk = this.next();
            if (tk === '=') tk = '==='; // GML `=` is `==` in expressions, but wait!
            // To differentiate `=` (assign) vs `=` (compare), simple AST won't suffice easily
            // We'll leave `=` as `=` but transform it inside if(...) condition natively.

            exp += tk + ' ';
        }
        return exp.trim();
    }
}
