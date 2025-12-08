export default async function () {
    try {
        // 尝试 ES Module 导入
        const mod = await import('modbus-serial');
        return mod.default || mod;
    } catch (e) {
        // 回退到 CommonJS
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        return require('modbus-serial');
    }
}
