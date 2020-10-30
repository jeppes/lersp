const stdLib = `
(macro defn (::name ::args ::body) (def ::name (fn ::args ::body)))
(macro or (::x ::y) (if ::x ::x ::y))
(macro and (::x ::y) (not (or (not ::x) (not ::y))))

(defn > (a b) (and (not (= a b)) (not (< a b))))
(defn >= (a b) (not (< a b)))
(defn <= (a b) (not (> a b)))
(defn != (a b) (not (= a b)))

(defn map (f arr) (reduce (fn (acc x) (append (f x) acc)) [] arr))
(defn filter (pred arr) (reduce (fn (acc x) (if (pred x) (append x acc) acc)) [] arr))
`;

const Function = (run) => {
    return {
        type: "fn",
        // run :: (Args, Env) -> Result
        run: run,
    };
};

const arithmeticEnv = {
    "+": Function((args) => (args.reduce((acc, x) => acc + x, 0))),
    "*": Function((args) => (args.reduce((acc, x) => acc * x, 1))),
    "-": Function((args) => {
        const [head, ...tail] = args;
        return tail.reduce((acc, x) => acc - x, head);
    }),
    "/": Function((args) => {
        const [head, ...tail] = args;
        return tail.reduce((acc, x) => acc / x, head);
    }),
    "^": Function((args) => {
        const [head, ...tail] = args;
        return tail.reduce(Math.pow, head);
    }),
};

function vector(args) {
    return { type: "vector", contents: args };
}

const dataStructureEnv = {
    "arrayOf": Function((args) => vector(args)),
    "reduce": Function((args, env) => {
        const [fn, seed, arr] = args;
        return arr.contents.reduce((acc, x) => fn.run([acc, x], env), seed);
    }),
    "append": Function(([e, arr]) => vector([...arr.contents, e])),
};

const logicalEnv = {
    "true": true,
    "false": false,
    "or": Function(() => { throw false; }),
    "<": Function((args) => args[0] < args[1]),
    "not": Function((arg) => !arg[0]),
    "=": Function((args) => {
        const [head, ...tail] = args.map(JSON.stringify);
        return tail.length > 0 && tail.every(e => e === head);
    }),
};

const globalEnv = {
    ...logicalEnv,
    ...arithmeticEnv,
    ...dataStructureEnv,
    "print": Function((message) => {
        console.log(...message);
        return message;
    }),
    macros: {}
};

function replaceInBody(macroBody, definitions) {
    return macroBody.map(element => {
        if (Array.isArray(element)) {
            return replaceInBody(element, definitions);
        } else if (definitions[element] != undefined) {
            return definitions[element];
        } else {
            return element;
        }
    });
}

function apply(list, env) {
    const [fn, ...args] = list;
    if (fn && fn.type === "vector") {
        return [fn.contents[args[0]], env];
    }
    else if (fn && fn.type === "fn") {
        return [fn.run(args, env), env];
    }
    else {
        return [list[list.length - 1], env];
    }
}

function evaluate(expression, env) {
    if (expression[0] === "macro") {
        const [, name, macroArgs, macroBody] = expression;
        const newMacros = { ...env.macros };
        newMacros[name] = Function((innerArgs) => {
            // Map the args to the macro to the args to the function
            const defs = Object.fromEntries(macroArgs.map((arg, i) => 
                [arg, innerArgs[i]]
            ));
            const substitutedMacroBody = replaceInBody(macroBody, defs);
            return substitutedMacroBody;
        });
        const newEnv = { ...env, macros: newMacros };

        return [null, newEnv];
    }
    else if (expression[0] === "def") {
        const [, name, expr] = expression;
        const [value] = evaluate(expr, env);
        return [null, { ...env, [name]: value }];
    }
    else if (env.macros[expression[0]] !== undefined) {
        const [macro, ...args] = expression;
        return evaluate(env.macros[macro].run(args, env), env);
    }
    else if (expression[0] === "fn") {
        const [, argNames, body] = expression;
        const func = Function((args, env) => {
            const program = [
                ...argNames.map((argName, i) => ["def", argName, args[i]]),
                body,
            ];
            return evaluate(program, env)[0];
        });
        return [func, env];
    }
    else if (expression[0] === "if") {
        const [, condition, consequent, alternative] = expression;
        const [evaluatedCondition] = evaluate(condition, env);
        return evaluatedCondition 
            ? evaluate(consequent, env) 
            : evaluate(alternative, env);
    }
    else if (Array.isArray(expression)) {
        let result = null;
        let results = [];
        for (const expr of expression) {
            [result, env] = evaluate(expr, env);
            results.push(result);
        }
        return apply(results, env);
    }
    else {
        const inEnv = env[expression];
        const value = inEnv !== undefined ? inEnv : expression;
        return [value, env];
    }
}