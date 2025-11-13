import evaluator from '../lib/ast_expression_evaluator.js';

test('array literal - simple elements', async () => {
    const res = await evaluator.evaluate('[1, 2, 3]', {});
    expect(res).toEqual([1, 2, 3]);
});

test('array literal - expressions and identifiers', async () => {
    const res = await evaluator.evaluate('[1, 2+3, x]', { x: 5 });
    expect(res).toEqual([1, 5, 5]);
});

test('array literal - sparse and undefined slots', async () => {
    const res = await evaluator.evaluate('[1, , 3]', {});
    // 稀疏数组的空位在实现中返回 undefined
    expect(res).toEqual([1, undefined, 3]);
});

test('array literal - spread elements', async () => {
    const res = await evaluator.evaluate('[1, ...arr, 4]', { arr: [2, 3] });
    expect(res).toEqual([1, 2, 3, 4]);
});
