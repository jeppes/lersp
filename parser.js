function parse(str) {
    let exprs = [];
    while (str !== "") {
        const [expr, rest] = parseSingleExpr(str);

        if (expr !== null) exprs.push(expr);
        else return [exprs, rest];

        str = rest;
    }

    return [exprs, str];
}

function consume(str, match) {
    str = str.trimLeft();
    return str.startsWith(match)
        ? [match, str.slice(match.length, str.length)]
        : [null, str];
}

function consumeWhile(predicate, str) {
    str = str.trimLeft();
    let matches = [];
    for (let i = 0; str[i] && predicate(str[i]); i++) {
        matches.push(str[i]);
    }

    const match = matches.join("");
    return match.length > 0
        ? [match, str.slice(match.length, str.length)]
        : [null, str];
}

function parseSingleExpr(str) {
    let [parenExp, restParen] = parseBalanced(str, "(", ")");
    if (parenExp !== null) {
        return [parenExp, restParen];
    }

    let [squareExp, restSquare] = parseBalanced(str, "[", "]");
    if (squareExp !== null) {
        return [["arrayOf", ...squareExp], restSquare];
    }

    let [number, restNum] = parseNumber(str);
    if (number !== null) {
        return [parseInt(number), restNum];
    }

    let [symbol, restSym] = parseSymbol(str);
    if (symbol !== null) {
        return [symbol, restSym];
    }

    return [null, str];
}

function parseNumber(str) {
    return consumeWhile(c => c >= "0" && c <= "9", str);
}

function parseSymbol(str) {
    return consumeWhile(c => c !== "(" && c !== ")" && c !== "[" && c !== "]" && !/\s/.test(c), str);
}

function parseBalanced(str, startsWith, endsWith) {
    let [match, rest] = consume(str, startsWith);
    let expr = null;
    if (match !== null) {
        [expr, rest] = parse(rest);
        [match, rest] = consume(rest, endsWith);
        if (match) return [expr, rest];
        else return [null, rest];
    } else {
        return [null, str];
    }
}