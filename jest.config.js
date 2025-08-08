export default {
  testEnvironment: 'node',
  transform: {},
  maxWorkers: 1,
  reporters: [
    "default",
    "jest-github-actions-reporter",
    ["jest-html-reporters", {
      publicPath: "./test_reports",
      filename: "test-report.html",
      expand: true, // 显示详细测试过程
    }]
  ],
  testLocationInResults: true
};
