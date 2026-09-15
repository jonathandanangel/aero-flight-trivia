/**
 * Safe expression normalize + compile.
 * No eval of arbitrary JS — recursive-descent parser over an allowlisted grammar.
 */

export class ExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpressionError";
  }
}

const ASSIGNMENT_RE = /^\s*(?:f|g)\s*\([^)]*\)\s*=\s*/i;

const ALLOWED_FUNCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "exp",
  "log",
  "ln",
  "log10",
  "sqrt",
  "abs",
  "floor",
  "ceil",
  "sign",
  "pow",
  "erf",
  "erfc",
]);

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  E: Math.E,
};

type Token =
  | { kind: "number"; value: number }
  | { kind: "ident"; value: string }
  | { kind: "op"; value: string }
  | { kind: "lparen" }
  | { kind: "rparen" }
  | { kind: "comma" };

type AstNode =
  | { type: "num"; value: number }
  | { type: "var"; name: string }
  | { type: "const"; name: string; value: number }
  | { type: "unary"; op: "+" | "-"; arg: AstNode }
  | { type: "bin"; op: "+" | "-" | "*" | "/" | "^"; left: AstNode; right: AstNode }
  | { type: "call"; name: string; args: AstNode[] };

export function normalizeExpression(raw: string): string {
  if (typeof raw !== "string") {
    throw new ExpressionError("Expression must be text.");
  }
  let expression = raw.trim().replace(ASSIGNMENT_RE, "");
  expression = expression.replace(/;+\s*$/, "").trim();
  expression = expression
    .replace(/−/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    // Octave/MATLAB element-wise ops, including spaced forms: .^  .*  ./
    .replace(/\s*\.\s*\^\s*/g, "^")
    .replace(/\s*\.\s*\*\s*/g, "*")
    .replace(/\s*\.\s*\/\s*/g, "/")
    .replace(/\*\*/g, "^");
  if (!expression) {
    throw new ExpressionError("Expression cannot be empty.");
  }
  if (expression.length > 8000) {
    throw new ExpressionError("Expression is limited to 8000 characters.");
  }
  return expression;
}

/**
 * Insert implicit multiplication without breaking multi-letter names like cos/sin/asin.
 * Safer than a naive `(?<=[xyzs])(?=\()` which turns `cos(` into `co*s(`.
 */
function applyImplicitMultiply(expression: string): string {
  let out = expression.replace(/\s+/g, "");
  // 2x, )x, 2pi, 2(, )(
  out = out.replace(/(?<=[0-9)])(?=(?:x|y|z|s|alpha|pi|\())/gi, "*");
  // Single-letter variable immediately before '(': x(  — not cos(, sin(, etc.
  out = out.replace(/(?<![A-Za-z0-9_])([xyzs])(?=\()/gi, "$1*");
  out = out.replace(/\)\(/g, ")*(");
  return out;
}

export function vectorizeExpression(raw: string): {
  cleaned: string;
  python: string;
  octave: string;
} {
  let expression = applyImplicitMultiply(normalizeExpression(raw));
  expression = expression.replace(/\+/g, " + ");
  expression = expression.replace(/(?<![eE])-/g, " - ");
  expression = expression.replace(/\*/g, " * ");
  expression = expression.replace(/\//g, " / ");
  expression = expression.replace(/\^/g, " ^ ");
  expression = expression.replace(/\s+/g, " ").trim();
  expression = expression.replace(/^\+\s*/, "");
  expression = expression.replace(/^-\s+/, "-");
  return {
    cleaned: expression,
    python: expression.replace(/\^/g, "**"),
    octave: expression.replace(/\^/g, ".^").replace(/ \* /g, " .* ").replace(/ \/ /g, " ./ "),
  };
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i]!;
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < source.length && /[0-9.]/.test(source[j]!)) j += 1;
      if (j < source.length && (source[j] === "e" || source[j] === "E")) {
        j += 1;
        if (j < source.length && (source[j] === "+" || source[j] === "-")) j += 1;
        while (j < source.length && /[0-9]/.test(source[j]!)) j += 1;
      }
      const text = source.slice(i, j);
      const value = Number(text);
      if (!Number.isFinite(value)) {
        throw new ExpressionError(`Invalid number '${text}'.`);
      }
      tokens.push({ kind: "number", value });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < source.length && /[A-Za-z0-9_]/.test(source[j]!)) j += 1;
      tokens.push({ kind: "ident", value: source.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/^".includes(ch)) {
      tokens.push({ kind: "op", value: ch });
      i += 1;
      continue;
    }
    if (ch === "(") {
      tokens.push({ kind: "lparen" });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ kind: "rparen" });
      i += 1;
      continue;
    }
    if (ch === ",") {
      tokens.push({ kind: "comma" });
      i += 1;
      continue;
    }
    throw new ExpressionError(`Unsupported character '${ch}'.`);
  }
  return tokens;
}

class Parser {
  private pos = 0;
  private nodeCount = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly variables: Set<string>,
  ) {}

  parse(): AstNode {
    const node = this.parseExpr();
    if (this.pos < this.tokens.length) {
      throw new ExpressionError("Unexpected trailing tokens.");
    }
    return node;
  }

  private bump(): void {
    this.nodeCount += 1;
    // Large multi-term V15 demo f(x) can exceed several hundred AST nodes.
    if (this.nodeCount > 8000) {
      throw new ExpressionError("Expression is too complex.");
    }
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private take(): Token {
    const token = this.tokens[this.pos];
    if (!token) throw new ExpressionError("Unexpected end of expression.");
    this.pos += 1;
    return token;
  }

  private parseExpr(): AstNode {
    let left = this.parseTerm();
    while (true) {
      const token = this.peek();
      if (!token || token.kind !== "op" || (token.value !== "+" && token.value !== "-")) break;
      this.take();
      this.bump();
      const right = this.parseTerm();
      left = { type: "bin", op: token.value, left, right };
    }
    return left;
  }

  private parseTerm(): AstNode {
    let left = this.parsePower();
    while (true) {
      const token = this.peek();
      if (!token || token.kind !== "op" || (token.value !== "*" && token.value !== "/")) break;
      this.take();
      this.bump();
      const right = this.parsePower();
      left = { type: "bin", op: token.value, left, right };
    }
    return left;
  }

  /** Right-associative power. */
  private parsePower(): AstNode {
    const left = this.parseUnary();
    const token = this.peek();
    if (token && token.kind === "op" && token.value === "^") {
      this.take();
      this.bump();
      const right = this.parsePower();
      if (right.type === "num" && Math.abs(right.value) > 100) {
        throw new ExpressionError("Numeric exponents are limited to magnitude 100.");
      }
      return { type: "bin", op: "^", left, right };
    }
    return left;
  }

  private parseUnary(): AstNode {
    const token = this.peek();
    if (token && token.kind === "op" && (token.value === "+" || token.value === "-")) {
      this.take();
      this.bump();
      return { type: "unary", op: token.value, arg: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): AstNode {
    const token = this.take();
    this.bump();
    if (token.kind === "number") {
      return { type: "num", value: token.value };
    }
    if (token.kind === "ident") {
      const name = token.value;
      if (this.peek()?.kind === "lparen") {
        if (!ALLOWED_FUNCTIONS.has(name)) {
          throw new ExpressionError(`Unknown function '${name}'.`);
        }
        this.take();
        const args: AstNode[] = [];
        if (this.peek()?.kind !== "rparen") {
          args.push(this.parseExpr());
          while (this.peek()?.kind === "comma") {
            this.take();
            args.push(this.parseExpr());
          }
        }
        if (this.take().kind !== "rparen") {
          throw new ExpressionError("Expected ')' after function arguments.");
        }
        if (name === "pow") {
          if (args.length !== 2) {
            throw new ExpressionError("pow() requires two arguments.");
          }
        } else if (args.length !== 1) {
          throw new ExpressionError(`${name}() requires one argument.`);
        }
        return { type: "call", name, args };
      }
      if (name in CONSTANTS) {
        return { type: "const", name, value: CONSTANTS[name]! };
      }
      if (!this.variables.has(name)) {
        throw new ExpressionError(`Unknown name '${name}'.`);
      }
      return { type: "var", name };
    }
    if (token.kind === "lparen") {
      const inner = this.parseExpr();
      if (this.take().kind !== "rparen") {
        throw new ExpressionError("Expected ')'.");
      }
      return inner;
    }
    throw new ExpressionError("Unsupported syntax.");
  }
}

function callMath(name: string, args: number[]): number {
  switch (name) {
    case "sin":
      return Math.sin(args[0]!);
    case "cos":
      return Math.cos(args[0]!);
    case "tan":
      return Math.tan(args[0]!);
    case "asin":
      return Math.asin(args[0]!);
    case "acos":
      return Math.acos(args[0]!);
    case "atan":
      return args.length === 2 ? Math.atan2(args[0]!, args[1]!) : Math.atan(args[0]!);
    case "sinh":
      return Math.sinh(args[0]!);
    case "cosh":
      return Math.cosh(args[0]!);
    case "tanh":
      return Math.tanh(args[0]!);
    case "exp":
      return Math.exp(args[0]!);
    case "log":
    case "ln":
      return Math.log(args[0]!);
    case "log10":
      return Math.log10(args[0]!);
    case "sqrt":
      return Math.sqrt(args[0]!);
    case "abs":
      return Math.abs(args[0]!);
    case "floor":
      return Math.floor(args[0]!);
    case "ceil":
      return Math.ceil(args[0]!);
    case "sign":
      return Math.sign(args[0]!);
    case "pow":
      return Math.pow(args[0]!, args[1]!);
    case "erf":
      return errorFunction(args[0]!);
    case "erfc":
      return 1 - errorFunction(args[0]!);
    default:
      throw new ExpressionError(`Unsupported function '${name}'.`);
  }
}

/**
 * Abramowitz & Stegun 7.1.26 approximation for erf(x).
 * Max absolute error ~1.5e-7 — enough for NA demos and f(x) plotting.
 */
function errorFunction(x: number): number {
  if (!Number.isFinite(x)) return Number.NaN;
  const sign = Math.sign(x);
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const poly =
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t);
  return sign * (1 - poly * Math.exp(-ax * ax));
}

function evalAst(node: AstNode, env: Record<string, number>): number {
  switch (node.type) {
    case "num":
      return node.value;
    case "const":
      return node.value;
    case "var": {
      const v = env[node.name];
      if (v === undefined) return Number.NaN;
      return v;
    }
    case "unary": {
      const a = evalAst(node.arg, env);
      return node.op === "-" ? -a : a;
    }
    case "bin": {
      const l = evalAst(node.left, env);
      const r = evalAst(node.right, env);
      switch (node.op) {
        case "+":
          return l + r;
        case "-":
          return l - r;
        case "*":
          return l * r;
        case "/":
          return l / r;
        case "^":
          return Math.pow(l, r);
      }
      break;
    }
    case "call": {
      const args = node.args.map((a) => evalAst(a, env));
      return callMath(node.name, args);
    }
  }
  return Number.NaN;
}

function astToString(node: AstNode): string {
  switch (node.type) {
    case "num":
      return String(node.value);
    case "const":
      return node.name;
    case "var":
      return node.name;
    case "unary":
      return `(${node.op}${astToString(node.arg)})`;
    case "bin":
      return `(${astToString(node.left)} ${node.op === "^" ? "**" : node.op} ${astToString(node.right)})`;
    case "call":
      return `${node.name}(${node.args.map(astToString).join(", ")})`;
  }
}

export interface CompiledExpression {
  source: string;
  normalized: string;
  symbolic: string;
  variables: string[];
  evaluate: (...values: number[]) => number;
  evaluateNamed: (vars: Record<string, number>) => number;
}

function compileInternal(raw: string, variables: string[]): CompiledExpression {
  if (!variables.length || new Set(variables).size !== variables.length) {
    throw new ExpressionError("Variable names must be unique.");
  }
  const normalized = normalizeExpression(raw);
  const forParse = applyImplicitMultiply(normalized);
  const tokens = tokenize(forParse);
  const ast = new Parser(tokens, new Set(variables)).parse();
  const symbolic = astToString(ast);

  const evaluateNamed = (vars: Record<string, number>): number => {
    try {
      const result = evalAst(ast, vars);
      return Number.isFinite(result) ? result : Number.NaN;
    } catch {
      return Number.NaN;
    }
  };

  const evaluate = (...values: number[]): number => {
    if (values.length !== variables.length) {
      throw new ExpressionError("Wrong number of variable values.");
    }
    const env: Record<string, number> = {};
    for (let i = 0; i < variables.length; i += 1) {
      env[variables[i]!] = values[i]!;
    }
    return evaluateNamed(env);
  };

  return {
    source: raw,
    normalized,
    symbolic,
    variables: [...variables],
    evaluate,
    evaluateNamed,
  };
}

/** Compile a scalar f(x). */
export function compileScalar(raw: string): (x: number) => number {
  const compiled = compileInternal(raw, ["x"]);
  return (x: number) => compiled.evaluate(x);
}

/** Compile a named multi-variable expression (e.g. x, y for nonlinear systems). */
export function compileNamed(
  raw: string,
  variables: string[] = ["x", "y"],
): (vars: Record<string, number>) => number {
  const compiled = compileInternal(raw, variables);
  return compiled.evaluateNamed;
}

/** Full compile with metadata (used by analysis modules). */
export function compileExpression(
  raw: string,
  variables: string[] = ["x"],
): CompiledExpression {
  return compileInternal(raw, variables);
}
