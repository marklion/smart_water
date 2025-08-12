export default {
    testEnvironment: 'node',
    transform: {},
    maxWorkers: 1,
    testTimeout: 60000, // CI环境中使用更长的超时时间
    forceExit: true, // 强制退出，防止卡住
    detectOpenHandles: true,
    setupFilesAfterEnv: ['jest-allure/dist/setup'],
    reporters: [
        ['default', 'jest-allure'],
    ],
    testLocationInResults: true,
    // 在CI环境中可能需要的额外配置
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
