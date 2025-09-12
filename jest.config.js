export default {
  testEnvironment: 'node',
  transform: {},
  maxWorkers: 1,
  testTimeout: 60000, // 增加到60秒超时，与CI环境一致
  forceExit: true, // 强制退出，防止卡住
  detectOpenHandles: true, // 检测未关闭的句柄
  setupFilesAfterEnv: [],
  reporters: [
    "default",
    "jest-github-actions-reporter",
    ["jest-html-reporters", {
      publicPath: "./test_reports",
      filename: "test-report.html",
      expand: true, // 显示详细测试过程
    }]
  ],
  testLocationInResults: true,
  // 添加与CI环境一致的配置
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
