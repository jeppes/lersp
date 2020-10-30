function test(program, expectation) {
    let output = [];
    const testEnv = {
        ...globalEnv,
        print: Function((message) => {
            output.push(...message);
            return message;
        }),
    };

    // Append the standard library to the program being executed 
    const [standardLibrary] = parse(stdLib);
    evaluate([...standardLibrary, ...program], testEnv);
    const passedTest = JSON.stringify(output) === JSON.stringify(expectation);
    if (!passedTest) {
        console.log(
            "Failed test. Expected Program: '", program, "' to return: ", expectation, "Got:", output
        );
    }
}

function testProgram(program, expectation) {
    const [ast] = parse(program);

    if (ast !== null) {
        test(ast, expectation);
    } else {
        console.log("Failed to parse program:", program);
    }
}

test(
    [
        ["print", 123],
    ],
    [123]
);

test(
    [
        ["def", "a", 5],
        ["print", "a"],
    ],
    [5]
);

test(
    [
        ["def", "print2", ["fn",
            ["arg1"],
            ["print", "arg1"]]],
        ["print2", 17]
    ],
    [17]
);

test(
    [
        ["def", "print2", ["fn",
            ["arg1", "arg2"],
            [["print", "arg1"], ["print", "arg2"]]]],
        ["print2", 17, 18]
    ],
    [17, 18]
);

test(
    [
        ["defn", "print2",
            ["arg1", "arg2"],
            [["print", "arg1"], ["print", "arg2"]]],
        ["def", "a", 15],
        ["print2", "a", 16],
    ],
    [15, 16]
);

test(
    [
        ["defn", "f", [], ["def", "a", 5]],
        ["print", "a"]
    ],
    ["a"]
);

test(
    [
        ["def", "a", 5],
        ["defn", "f", [], ["def", "a", 5]],
        ["print", "a"]
    ],
    [5]
);

// What should this do?
// test(
//     [
//         ["defn", "f", ["a"], [["def", "a", 6], ["print", "a"]]],
//         ["f", 5]
//     ],
//     [6]
// );

test(
    [
        ["defn", "f", ["a"], [["print", "a"], ["def", "a", 6]]],
        ["f", 5]
    ],
    [5]
);

test(
    [
        ["print", ["+", 5, 6, ["+", 1, 2]]],
    ],
    [5 + 6 + (1 + 2)]
);

test(
    [
        ["print", ["-", 25, 10, 5]],
    ],
    [25 - 10 - 5]
);

test(
    [
        ["print", ["/", 25, 10, 5]],
    ],
    [25 / 10 / 5]
);

test(
    [
        ["print", ["*", 25, 10, 5]],
    ],
    [25 * 10 * 5]
);

test(
    [
        ["print", ["^", 3, 2]],
    ],
    [9]
);

test(
    [
        ["print", ["arrayOf", 1, 2, ["+", 1, 2]]],
    ],
    [vector([1, 2, 3])]
);

test(
    [
        ["print", ["reduce", "+", 0, ["arrayOf", 1, 2, 3]]],
    ],
    [1 + 2 + 3]
);

testProgram(`
(print (= 1 1))
`, [true]);

testProgram(`
(print (= 1 2))
`, [false]);

testProgram(`
(print (= [1 2 3] [1 2 3]))
`, [true]);

testProgram(`
(print (= [1 2 3] [3 2 1]))
`, [false]);


testProgram(`
(print (and true true))
(print (and true false))
(print (and false false))
(print (and false true))
`, [true, false, false, false]);

testProgram(`
(print (or true true))
(print (or true false))
(print (or false false))
(print (or false true))
`, [true, true, false, true]);

testProgram(`
(or true (print 1))
(or false (print 2))
`, [2]);

// Need to implement macros on lists
// testProgram(`
// (print (or false false false false true))
// `, [true]);
// testProgram(`
// (print (and true true true true false))
// `, [false]);

testProgram(`
(and true (print 1))
(and false (print 2))
`, [1]);

testProgram(`
(def print2 (fn (arg1 arg2) ((print arg1) (print arg2))))
(print2 17 18)
`, [17, 18]);

testProgram(`
(defn print-twice (arg) ((print arg) (print arg)))
(print-twice 123)
`, [123, 123]);

testProgram(`
(print [1 2 3])
`, [vector([1, 2, 3])]);

testProgram(`
(print (reduce + 0 [1 2 3 4]))
`, [1 + 2 + 3 + 4]);

testProgram(`
(print (+ 1 2 3 4))
`, [1 + 2 + 3 + 4]);

testProgram(`
(macro define-function (::name ::args ::body) (def ::name (fn ::args ::body)))
(define-function print2 (arg1 arg2) ((print arg1) (print arg2)))
(print2 1 2)
`, [1, 2]);

testProgram(`
(print (append 3 [1 2]))
`, [vector([1, 2, 3])]);

testProgram(`
(defn plus (a b) (+ a b))
(print (reduce plus 0 [1 2 3]))
`, [1 + 2 + 3]);

testProgram(`
(print (reduce (fn (acc x) (append x acc)) [] [1 2 3]))
`, [vector([1, 2, 3])]);

testProgram(`
(print (map (fn (x) (+ x 5)) [1 2 3]))
`, [vector([6, 7, 8])]);

testProgram(`
(if true (print 1) (print 2))
`, [1]);

testProgram(`
(if false (print 1) (print 2))
`, [2]);

testProgram(`
(def a 5)
(print a)
`, [5]);

testProgram(`
(print ((+ 1 2) (+ 1 3)))
`, [4]);

testProgram(`
(def plus (fn (a b) (+ a b)))
(print (plus 1 2))
`, [3]);

testProgram(`
(defn plus (a b) (+ a b))
(print (plus 1 2))
`, [3]);

testProgram(`
(print ([1 2 3] 2))
(print ([1 2 3] 1))
(print ([1 2 3] 0))
(print ([1 2 3] 4))
`, [3, 2, 1, null]);

testProgram(`
(print (< 1 2))
`, [true]);

testProgram(`
(defn add-1 (x) (+ 1 x))
(defn add-2 (x) (add-1 (add-1 x)))
(print (add-2 1))
`, [3]);

testProgram(`
(print (not false))
(print (not true))
`, [!false, !true]);

testProgram(`
(print (if (= 0 0) true false))
(print (if (= 0 1) true false))
`, [true, false]); 

testProgram(`
(print (if (= 0 0) 0 1))
(print (if (= 0 1) 0 1))
`, [0, 1]); 

testProgram(`
(defn f (n) 
    (if (= 0 n) 0 1))
(print (f 5))
(print (f 0))
`, [1, 0]); 

testProgram(`
(defn ! (n) 
    (if (= 0 n) 
        1 
        (* n (! (- n 1)))))
(print (! 5))
`, [5 * 4 * 3 * 2 * 1]); 

testProgram(`
(defn fib (n) (
    (if (< 3 n)
        (+ (fib (- n 1))
            (fib (- n 2)))
        n)))
(print (fib 2))
(print (fib 3))
(print (fib 4))
(print (fib 5))
`, [2, 3, 5, 8]);

// Nesting functions
testProgram(`
(defn add (a b)
    (
        (defn plus (a b) (+ a b))
        (plus a b)
    ))
(print (add 1 2))
`, [3]);

testProgram(`
(defn multiplesOf (m max)
    ((defn multiples' (n acc)
                    (if (< n (+ 1 max))
                        (multiples' (+ n m) (append n acc))
                        acc))
        (multiples' m [])))
(print (multiplesOf 5 25))
`, [vector([5, 10, 15, 20, 25])]);

testProgram(`
(print (> 5 6))
(print (> 5 5))
(print (> 5 4))
`, [false, false, true]);

testProgram(`
(print (>= 5 6))
(print (>= 5 5))
(print (>= 5 4))
`, [false, true, true]);

testProgram(`
(print (<= 5 6))
(print (<= 5 5))
(print (<= 5 4))
`, [true, true, false]);

testProgram(`
(print (!= 5 6))
(print (!= 5 5))
(print (!= 5 4))
`, [true, false, true]);

testProgram(`
(print (filter (fn (n) (= n 5)) [1 5 2 5 3 5]))
`, [vector([5, 5, 5])]);

testProgram(`
(print (filter (fn (n) (!= n 5)) [1 5 2 5 3 5]))
`, [vector([1, 2, 3])]);