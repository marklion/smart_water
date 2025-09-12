import evaluator from '../lib/ast_expression_evaluator.js';

describe('AST Expression Evaluator', () => {
    describe('基本数学运算', () => {
        test('应该支持基本算术运算', () => {
            const context = { a: 10, b: 5 };
            
            expect(evaluator.evaluate('a + b', context)).toBe(15);
            expect(evaluator.evaluate('a - b', context)).toBe(5);
            expect(evaluator.evaluate('a * b', context)).toBe(50);
            expect(evaluator.evaluate('a / b', context)).toBe(2);
            expect(evaluator.evaluate('a % b', context)).toBe(0);
        });

        test('应该支持比较运算', () => {
            const context = { a: 10, b: 5, c: 10 };
            
            expect(evaluator.evaluate('a > b', context)).toBe(true);
            expect(evaluator.evaluate('a < b', context)).toBe(false);
            expect(evaluator.evaluate('a >= c', context)).toBe(true);
            expect(evaluator.evaluate('a <= c', context)).toBe(true);
            expect(evaluator.evaluate('a == c', context)).toBe(true);
            expect(evaluator.evaluate('a != b', context)).toBe(true);
        });

        test('应该支持逻辑运算', () => {
            const context = { a: true, b: false, c: 10 };
            
            expect(evaluator.evaluate('a && c', context)).toBe(10);
            expect(evaluator.evaluate('b && c', context)).toBe(false);
            expect(evaluator.evaluate('a || b', context)).toBe(true);
            expect(evaluator.evaluate('!a', context)).toBe(false);
            expect(evaluator.evaluate('!b', context)).toBe(true);
        });
    });

    describe('Math 函数支持', () => {
        test('应该支持 Math 函数', () => {
            const context = { Math, a: -5, b: 3.7 };
            
            expect(evaluator.evaluate('Math.abs(a)', context)).toBe(5);
            expect(evaluator.evaluate('Math.max(a, b)', context)).toBe(3.7);
            expect(evaluator.evaluate('Math.min(a, b)', context)).toBe(-5);
            expect(evaluator.evaluate('Math.round(b)', context)).toBe(4);
            expect(evaluator.evaluate('Math.floor(b)', context)).toBe(3);
            expect(evaluator.evaluate('Math.ceil(b)', context)).toBe(4);
            expect(evaluator.evaluate('Math.sqrt(16)', context)).toBe(4);
            expect(evaluator.evaluate('Math.pow(2, 3)', context)).toBe(8);
        });

        test('应该支持简化的 Math 函数', () => {
            const context = { 
                Math, 
                abs: Math.abs, 
                max: Math.max, 
                min: Math.min,
                round: Math.round,
                floor: Math.floor,
                ceil: Math.ceil,
                sqrt: Math.sqrt,
                pow: Math.pow,
                a: -5, 
                b: 3.7 
            };
            
            expect(evaluator.evaluate('abs(a)', context)).toBe(5);
            expect(evaluator.evaluate('max(a, b)', context)).toBe(3.7);
            expect(evaluator.evaluate('min(a, b)', context)).toBe(-5);
            expect(evaluator.evaluate('round(b)', context)).toBe(4);
            expect(evaluator.evaluate('floor(b)', context)).toBe(3);
            expect(evaluator.evaluate('ceil(b)', context)).toBe(4);
            expect(evaluator.evaluate('sqrt(16)', context)).toBe(4);
            expect(evaluator.evaluate('pow(2, 3)', context)).toBe(8);
        });
    });

    describe('复杂表达式', () => {
        test('应该支持复杂数学表达式', () => {
            const context = { a: 10, b: 5, c: 2 };
            
            expect(evaluator.evaluate('(a + b) * c', context)).toBe(30);
            expect(evaluator.evaluate('a + b * c', context)).toBe(20);
            expect(evaluator.evaluate('(a > b) && (c > 0)', context)).toBe(true);
        });

        test('应该支持三元表达式', () => {
            const context = { a: 10, b: 5 };
            
            expect(evaluator.evaluate('a > b ? a : b', context)).toBe(10);
            expect(evaluator.evaluate('a < b ? a : b', context)).toBe(5);
        });

        test('应该支持成员访问', () => {
            const context = { 
                sensors: { temperature: 25, humidity: 60 },
                devices: { pump: { status: 'on' } }
            };
            
            expect(evaluator.evaluate('sensors.temperature', context)).toBe(25);
            expect(evaluator.evaluate('sensors.humidity', context)).toBe(60);
            expect(evaluator.evaluate('devices.pump.status', context)).toBe('on');
        });
    });

    describe('安全性测试', () => {
        test('应该拒绝危险的代码', () => {
            const context = { a: 10 };
            
            // 尝试执行危险代码应该抛出错误
            expect(() => evaluator.evaluate('eval("1+1")', context)).toThrow();
            expect(() => evaluator.evaluate('Function("return 1")()', context)).toThrow();
            expect(() => evaluator.evaluate('global.process.exit()', context)).toThrow();
            expect(() => evaluator.evaluate('require("fs")', context)).toThrow();
            expect(() => evaluator.evaluate('import("fs")', context)).toThrow();
        });

        test('应该拒绝不允许的运算符', () => {
            const context = { a: 10, b: 5 };
            
            expect(() => evaluator.evaluate('a ** b', context)).toThrow(); // 幂运算
            expect(() => evaluator.evaluate('a << b', context)).toThrow(); // 左移
            expect(() => evaluator.evaluate('a >> b', context)).toThrow(); // 右移
            expect(() => evaluator.evaluate('a & b', context)).toThrow();  // 按位与
            expect(() => evaluator.evaluate('a | b', context)).toThrow();  // 按位或
        });

        test('应该拒绝不允许的函数', () => {
            const context = { a: 10 };
            
            expect(() => evaluator.evaluate('console.log(a)', context)).toThrow();
            expect(() => evaluator.evaluate('setTimeout(() => {}, 1000)', context)).toThrow();
            expect(() => evaluator.evaluate('process.exit()', context)).toThrow();
        });

        test('应该拒绝未定义的变量', () => {
            const context = { a: 10 };
            
            expect(() => evaluator.evaluate('undefinedVar', context)).toThrow();
            expect(() => evaluator.evaluate('a + undefinedVar', context)).toThrow();
        });
    });

    describe('错误处理', () => {
        test('应该处理语法错误', () => {
            const context = { a: 10 };
            
            expect(() => evaluator.evaluate('a +', context)).toThrow();
            expect(() => evaluator.evaluate('(a + b', context)).toThrow();
            expect(() => evaluator.evaluate('a + +', context)).toThrow();
        });

        test('应该处理空表达式', () => {
            const context = { a: 10 };
            
            expect(() => evaluator.evaluate('', context)).toThrow();
            expect(() => evaluator.evaluate('   ', context)).toThrow();
        });
    });

    describe('实际使用场景', () => {
        test('应该支持传感器数据比较', () => {
            const context = {
                sensors: { 
                    temperature: 25, 
                    humidity: 60,
                    soil_moisture: 30
                },
                Math
            };
            
            expect(evaluator.evaluate('sensors.temperature > 20', context)).toBe(true);
            expect(evaluator.evaluate('sensors.humidity < 70', context)).toBe(true);
            expect(evaluator.evaluate('sensors.soil_moisture > 25 && sensors.temperature < 30', context)).toBe(true);
        });

        test('应该支持设备状态检查', () => {
            const context = {
                devices: { 
                    pump: { status: 'on', pressure: 2.5 },
                    valve: { status: 'off', position: 0 }
                }
            };
            
            expect(evaluator.evaluate('devices.pump.status === "on"', context)).toBe(true);
            expect(evaluator.evaluate('devices.valve.status === "off"', context)).toBe(true);
            expect(evaluator.evaluate('devices.pump.pressure > 2.0', context)).toBe(true);
        });

        test('应该支持复杂的策略条件', () => {
            const context = {
                sensors: { temperature: 25, humidity: 60, soil_moisture: 30 },
                devices: { pump: { status: 'on' } },
                Math,
                abs: Math.abs,
                max: Math.max,
                min: Math.min
            };
            
            // 复杂的策略条件：温度适中且湿度不高且土壤湿度低时启动灌溉
            const condition = 'sensors.temperature > 20 && sensors.temperature < 30 && sensors.humidity < 80 && sensors.soil_moisture < 40';
            expect(evaluator.evaluate(condition, context)).toBe(true);
            
            // 使用数学函数计算
            const mathCondition = 'abs(sensors.temperature - 25) < 5 && max(sensors.humidity, sensors.soil_moisture) < 80';
            expect(evaluator.evaluate(mathCondition, context)).toBe(true);
        });
    });
});
