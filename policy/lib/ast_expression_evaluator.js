import { Parser } from 'acorn';
class SafeExpressionEvaluator {
    constructor() {
        // 允许的节点类型
        this.allowedNodeTypes = new Set([
            'Literal',           // 字面量 (数字、字符串、布尔值)
            'Identifier',        // 标识符 (变量名)
            'BinaryExpression',  // 二元表达式 (+, -, *, /, ==, !=, <, >, <=, >=, &&, ||)
            'UnaryExpression',   // 一元表达式 (+, -, !)
            'ConditionalExpression', // 三元表达式 (condition ? trueValue : falseValue)
            'MemberExpression',  // 成员表达式 (object.property)
            'CallExpression',    // 函数调用
            'LogicalExpression',  // 逻辑表达式 (&&, ||),
            'AwaitExpression',    // Await 表达式
            'TemplateLiteral',  // 模板字符串
            'TemplateElement' // 模板字符串元素
        ]);

        // 允许的二元运算符
        this.allowedBinaryOperators = new Set([
            '+', '-', '*', '/', '%',           // 算术运算
            '==', '!=', '===', '!==',          // 比较运算
            '<', '>', '<=', '>=',              // 比较运算
            '&&', '||'                         // 逻辑运算
        ]);

        // 允许的一元运算符
        this.allowedUnaryOperators = new Set([
            '+', '-', '!', 'typeof'                      // 正号、负号、逻辑非
        ]);

        // 允许的函数调用
        this.allowedFunctions = new Set([
            'abs', 'max', 'min', 'round', 'floor', 'ceil', 'sqrt', 'pow',
            'sin', 'cos', 'tan', 'log', 'exp', 'getSource', 'print'
        ]);

        // 允许的全局对象
        this.allowedGlobals = new Set([
            'Math', 'Date', 'prs.variables', 'prs', 'variables'
        ]);

        // 危险函数名列表
        this.dangerousFunctions = new Set([
            'eval', 'Function', 'require', 'import', 'console', 'process', 'global',
            'setTimeout', 'setInterval', 'setImmediate', 'clearTimeout', 'clearInterval'
        ]);
    }

    parseExpression(expression) {
        try {
            // 使用 acorn 解析表达式
            const ast = Parser.parseExpressionAt(expression, 0, {
                ecmaVersion: 2020,
                sourceType: 'script',
                allowAwaitOutsideFunction: true
            });

            // 验证 AST 的安全性
            this.validateAST(ast);

            return ast;
        } catch (error) {
            throw new Error(`表达式解析失败: ${error.message}`);
        }
    }
    validateAST(node) {
        if (!node || typeof node !== 'object') {
            throw new Error('无效的 AST 节点');
        }

        const nodeType = node.type;

        if (!this.allowedNodeTypes.has(nodeType)) {
            throw new Error(`不允许的节点类型: ${nodeType}`);
        }

        switch (nodeType) {
            case 'BinaryExpression':
                this.validateBinaryExpression(node);
                break;
            case 'UnaryExpression':
                this.validateUnaryExpression(node);
                break;
            case 'CallExpression':
                this.validateCallExpression(node);
                break;
            case 'MemberExpression':
                this.validateMemberExpression(node);
                break;
            case 'Identifier':
                // 标识符验证在求值时进行，这里只检查基本格式
                if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(node.name)) {
                    throw new Error(`无效的标识符: ${node.name}`);
                }
                break;
        }

        // 递归验证子节点
        for (const key in node) {
            if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') {
                continue;
            }

            const value = node[key];
            if (Array.isArray(value)) {
                value.forEach(item => {
                    if (item && typeof item === 'object' && item.type) {
                        this.validateAST(item);
                    }
                });
            } else if (value && typeof value === 'object' && value.type) {
                this.validateAST(value);
            }
        }
    }
    validateBinaryExpression(node) {
        if (!this.allowedBinaryOperators.has(node.operator)) {
            throw new Error(`不允许的二元运算符: ${node.operator}`);
        }
    }
    validateUnaryExpression(node) {
        if (!this.allowedUnaryOperators.has(node.operator)) {
            throw new Error(`不允许的一元运算符: ${node.operator}`);
        }
    }
    validateCallExpression(node) {
        if (node.callee.type === 'Identifier') {
            // 检查是否是危险函数
            if (this.dangerousFunctions.has(node.callee.name)) {
                throw new Error(`危险函数: ${node.callee.name}`);
            }
            // 允许预定义函数和运行时上下文中的函数（如 getSource）
            if (!this.allowedFunctions.has(node.callee.name)) {
                // 对于不在预定义列表中的函数，允许通过（将在运行时验证）
                console.log(`警告: 函数 ${node.callee.name} 不在预定义列表中，将在运行时验证`);
            }
        } else if (node.callee.type === 'MemberExpression') {
            return;
        } else {
            throw new Error('不允许的函数调用类型');
        }
    }

    validateMemberExpression(node) {
        if (node.object.type === 'Identifier' &&
            this.allowedGlobals.has(node.object.name)) {
            // 允许访问 Math 和 Date 对象的属性
            return;
        }

        // 允许访问对象的属性，如 sensors.temperature
        if (node.object.type === 'Identifier' || node.object.type === 'MemberExpression') {
            return;
        }

        throw new Error(`不允许的成员访问: ${this.getMemberExpressionName(node)}`);
    }

    getMemberExpressionName(node) {
        if (node.type === 'Identifier') {
            return node.name;
        }
        if (node.type === 'MemberExpression') {
            const object = this.getMemberExpressionName(node.object);
            const property = node.computed ? `[${node.property.value}]` : `.${node.property.name}`;
            return object + property;
        }
        return 'unknown';
    }
    async evaluateNode(node, context) {
        switch (node.type) {
            case 'Literal':
                return node.value;
            case 'Identifier':
                // 检查是否为危险函数名
                if (this.dangerousFunctions.has(node.name)) {
                    throw new Error(`不允许访问危险函数: ${node.name}`);
                }
                if (!(node.name in context)) {
                    throw new Error(`未定义的变量: ${node.name}`);
                }
                return context[node.name];
            case 'BinaryExpression':
                return await this.evaluateBinaryExpression(node, context);
            case 'UnaryExpression':
                return await this.evaluateUnaryExpression(node, context);
            case 'ConditionalExpression':
                return await this.evaluateConditionalExpression(node, context);
            case 'MemberExpression':
                return await this.evaluateMemberExpression(node, context);
            case 'CallExpression':
                return await this.evaluateCallExpression(node, context);
            case 'LogicalExpression':
                return await this.evaluateLogicalExpression(node, context);
            case 'TemplateLiteral': {
                const expressions = await Promise.all(
                    node.expressions.map(expr => this.evaluateNode(expr, context))
                );
                let result = '';
                for (let i = 0; i < node.quasis.length; i++) {
                    result += node.quasis[i].value.cooked;
                    if (i < expressions.length) {
                        result += expressions[i];
                    }
                }
                return result;
            }
            case 'AwaitExpression': {
                // Evaluate the inner expression and await if it's a promise
                const result = await this.evaluateNode(node.argument, context);
                return result;
            }
            default:
                throw new Error(`不支持的节点类型: ${node.type}`);
        }
    }
    async evaluateBinaryExpression(node, context) {
        const left = await this.evaluateNode(node.left, context);
        const right = await this.evaluateNode(node.right, context);

        switch (node.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '%': return left % right;
            case '==': return left == right;
            case '!=': return left != right;
            case '===': return left === right;
            case '!==': return left !== right;
            case '<': return left < right;
            case '>': return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            case '&&': return left && right;
            case '||': return left || right;
            default:
                throw new Error(`不支持的二元运算符: ${node.operator}`);
        }
    }

    async evaluateUnaryExpression(node, context) {
        const argument = await this.evaluateNode(node.argument, context);

        switch (node.operator) {
            case '+': return +argument;
            case '-': return -argument;
            case '!': return !argument;
            case 'typeof': return typeof argument;
            default:
                throw new Error(`不支持的一元运算符: ${node.operator}`);
        }
    }

    async evaluateConditionalExpression(node, context) {
        const test = await this.evaluateNode(node.test, context);
        return test ? await this.evaluateNode(node.consequent, context) : await this.evaluateNode(node.alternate, context);
    }

    async evaluateMemberExpression(node, context) {
        const object = await this.evaluateNode(node.object, context);

        if (node.computed) {
            const property = await this.evaluateNode(node.property, context);
            return object[property];
        } else {
            return object[node.property.name];
        }
    }
    async evaluateCallExpression(node, context) {
        const argsPromises = node.arguments.map(arg => this.evaluateNode(arg, context));
        const args = await Promise.all(argsPromises);

        if (node.callee.type === 'Identifier') {
            const func = context[node.callee.name];
            if (typeof func !== 'function') {
                throw new Error(`不是函数: ${node.callee.name}`);
            }
            return func(...args);
        } else if (node.callee.type === 'MemberExpression') {
            const object = await this.evaluateNode(node.callee.object, context);
            const method = node.callee.property.name;
            const func = object[method];
            if (typeof func !== 'function') {
                throw new Error(`不是函数: ${this.getMemberExpressionName(node.callee)}`);
            }
            return func.apply(object, args);
        }

        throw new Error('不支持的函数调用类型');
    }
    async evaluateLogicalExpression(node, context) {
        const left = await this.evaluateNode(node.left, context);

        switch (node.operator) {
            case '&&':
                return left ? await this.evaluateNode(node.right, context) : left;
            case '||':
                return left ? left : await this.evaluateNode(node.right, context);
            default:
                throw new Error(`不支持的逻辑运算符: ${node.operator}`);
        }
    }
    async evaluate(expression, context) {
        // 解析表达式
        const ast = this.parseExpression(expression);

        // 求值 (支持异步求值)
        return await this.evaluateNode(ast, context);
    }
}

const evaluator = new SafeExpressionEvaluator();

export default evaluator;