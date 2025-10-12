<template>
    <div class="dashboard-container">
        <!-- 动态背景效果 -->
        <div class="bg-animation"></div>

        <!-- 顶部标题区域 -->
        <div class="header-section">
            <button class="back-button" @click="goBack">
                <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                控制中心
            </button>
            <h1 class="main-title">{{ systemName }}数据大屏</h1>
        </div>

        <!-- 主要内容区域 -->
        <div class="main-content">
            <!-- 顶部图表区域 -->
            <!-- 左侧面板 - 灌溉新闻 -->
            <el-card class="left-panel" shadow="hover">
                <template #header>
                    <div class="panel-header">
                        <h2>灌溉新闻</h2>
                    </div>
                </template>
                <div class="news-section">
                    <div class="news-list">
                        <div class="news-item" v-for="news in newsList" :key="news.id"
                            :class="{ 'hot-news': news.hot }">
                            <div class="news-highlight" :class="{ 'hot-highlight': news.hot }"></div>
                            <div class="news-content">
                                <div class="news-header">
                                    <div class="news-category">{{ news.category }}</div>
                                    <div class="news-hot" v-if="news.hot">
                                        <svg class="hot-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path
                                                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                        热门
                                    </div>
                                </div>
                                <div class="news-title">{{ news.title }}</div>
                                <div class="news-content-text">{{ news.content }}</div>
                                <div class="news-meta">
                                    <div class="news-meta-left">
                                        <span class="news-author">{{ news.author }}</span>
                                        <span class="news-views">{{ news.views }} 阅读</span>
                                    </div>
                                    <span class="news-time">{{ formatNewsTime(news.publishTime) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-card>

            <!-- 中央区域 -->
            <el-card class="center-panel" shadow="hover">
                <!-- 四个统计卡片 - 在中央区域内 -->
                <div class="center-stats-cards">
                    <!-- 左上：设备状态统计 -->
                    <div class="center-stat-card device-stats-card">
                        <div class="card-header">
                            <h4>设备状态统计</h4>
                        </div>
                        <div class="card-content">
                            <div class="device-item online">
                                <div class="device-icon">🟢</div>
                                <div class="device-info">
                                    <div class="device-label">在线设备</div>
                                    <div class="device-value">{{ realData.onlineCount }}</div>
                                </div>
                            </div>
                            <div class="device-item offline">
                                <div class="device-icon">🔴</div>
                                <div class="device-info">
                                    <div class="device-label">离线设备</div>
                                    <div class="device-value">{{ realData.deviceCount - realData.onlineCount }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 右上：用水量趋势 -->
                    <div class="center-stat-card water-trend-card">
                        <div class="card-header">
                            <h4>用水量趋势</h4>
                        </div>
                        <div class="card-content">
                            <div class="water-trend">
                                <div class="trend-chart">
                                    <div class="trend-bar" v-for="(value, index) in waterTrendData" :key="index"
                                        :style="{ height: (value / Math.max(...waterTrendData) * 100) + '%' }"></div>
                                </div>
                                <div class="trend-labels">
                                    <span v-for="(label, index) in ['周一', '周二', '周三', '周四', '周五']" :key="index">{{ label
                                        }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 左下：设备统计 -->
                    <div class="center-stat-card farm-distribution-card">
                        <div class="card-header">
                            <h4>设备统计</h4>
                        </div>
                        <div class="card-content">
                            <div class="device-horizontal-chart">
                                <div class="chart-item">
                                    <div class="chart-label">传感器</div>
                                    <div class="chart-bar-container">
                                        <div class="chart-bar" style="width: 40%; background: #00d4ff;"></div>
                                        <div class="chart-value">40%</div>
                                    </div>
                                </div>
                                <div class="chart-item">
                                    <div class="chart-label">阀门</div>
                                    <div class="chart-bar-container">
                                        <div class="chart-bar" style="width: 30%; background: #4CAF50;"></div>
                                        <div class="chart-value">30%</div>
                                    </div>
                                </div>
                                <div class="chart-item">
                                    <div class="chart-label">流量计</div>
                                    <div class="chart-bar-container">
                                        <div class="chart-bar" style="width: 20%; background: #FF9800;"></div>
                                        <div class="chart-value">20%</div>
                                    </div>
                                </div>
                                <div class="chart-item">
                                    <div class="chart-label">控制器</div>
                                    <div class="chart-bar-container">
                                        <div class="chart-bar" style="width: 10%; background: #F44336;"></div>
                                        <div class="chart-value">10%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 右下：系统性能 -->
                    <div class="center-stat-card performance-card">
                        <div class="card-header">
                            <h4>系统性能</h4>
                        </div>
                        <div class="card-content">
                            <div class="performance-pie-chart">
                                <div class="pie-chart-container">
                                    <svg class="pie-chart" viewBox="0 0 100 100">
                                        <!-- 数据库性能 35% -->
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#00d4ff" stroke-width="8"
                                            stroke-dasharray="251.2" stroke-dashoffset="163.28"
                                            transform="rotate(-90 50 50)" />
                                        <!-- 应用服务 25% -->
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#4CAF50" stroke-width="8"
                                            stroke-dasharray="251.2" stroke-dashoffset="188.4"
                                            transform="rotate(-90 50 50)" />
                                        <!-- 网络通信 20% -->
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#FF9800" stroke-width="8"
                                            stroke-dasharray="251.2" stroke-dashoffset="201.0"
                                            transform="rotate(-90 50 50)" />
                                        <!-- 存储系统 20% -->
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#F44336" stroke-width="8"
                                            stroke-dasharray="251.2" stroke-dashoffset="251.2"
                                            transform="rotate(-90 50 50)" />
                                    </svg>
                                    <div class="pie-center">
                                        <div class="pie-total">100%</div>
                                        <div class="pie-label">系统负载</div>
                                    </div>
                                </div>
                                <div class="pie-legend">
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #00d4ff;"></div>
                                        <span class="legend-text">数据库 35%</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #4CAF50;"></div>
                                        <span class="legend-text">应用服务 25%</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #FF9800;"></div>
                                        <span class="legend-text">网络通信 20%</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #F44336;"></div>
                                        <span class="legend-text">存储系统 20%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="center-data-display">
                        <div class="main-stat">
                            <div class="stat-info">
                                <div class="stat-title">管控系统统计</div>
                            </div>
                        </div>
                        <div class="center-metrics">
                            <div class="metric-row">
                                <div class="metric-item">
                                    <div class="metric-label">设备总数</div>
                                    <div class="metric-value">{{ realData.deviceCount }}</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-label">在线设备</div>
                                    <div class="metric-value online">{{ realData.onlineCount }}</div>
                                </div>
                            </div>
                            <div class="metric-row">
                                <div class="metric-item">
                                    <div class="metric-label">用水量</div>
                                    <div class="metric-value">{{ realData.waterUsage }}L</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-label">运行率</div>
                                    <div class="metric-value">{{ realData.runRate }}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 中心区域内容布局 -->
                <div class="center-content-layout">
                    <!-- 中心数据展示 -->


                    <!-- 球体容器 -->
                    <div class="sphere-container">
                        <!-- 备用球体显示 -->
                        <div class="fallback-sphere">
                            <div class="sphere-circle outer-circle"></div>
                            <div class="sphere-circle inner-circle"></div>
                        </div>

                        <!-- 外层球体 - 逆时针旋转 -->
                        <div class="outer-sphere">
                            <img src="/earth1.png" alt="外层球体" class="sphere-image outer-sphere-img"
                                />
                        </div>
                        <!-- 内层球体 - 顺时针旋转 -->
                        <div class="inner-sphere">
                            <img src="/earth2.png" alt="内层球体" class="sphere-image inner-sphere-img"
                                />
                        </div>

                        <!-- 浮动数据气泡 -->
                        <div class="floating-data-bubbles">
                            <div v-for="(bubble, index) in floatingDataBubbles" :key="index" class="data-bubble"
                                :class="{ 'visible': bubble.visible }" :style="{
                                    left: bubble.x + '%',
                                    top: bubble.y + '%',
                                    animationDelay: bubble.delay + 's'
                                }">
                                <div class="bubble-content">
                                    <div class="bubble-icon">
                                        <svg class="bubble-svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path :d="bubble.icon" />
                                        </svg>
                                    </div>
                                    <div class="bubble-text">
                                        <div class="bubble-title">{{ bubble.title }}</div>
                                        <div class="bubble-value">{{ bubble.value }}</div>
                                    </div>
                                </div>
                                <div class="bubble-tail"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-card>

            <!-- 右侧面板 - 系统数据 -->
            <el-card class="right-panel" shadow="hover">
                <template #header>
                    <div class="panel-header">
                        <h2>系统数据</h2>
                    </div>
                </template>

                <!-- 系统统计 -->
                <div class="system-stats">
                    <div class="stat-item">
                        <div class="stat-label">设备总数</div>
                        <div class="stat-value">{{ realData.deviceCount }}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">在线设备</div>
                        <div class="stat-value">{{ realData.onlineCount }}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">访问量</div>
                        <div class="stat-value">{{ realData.viewCount }}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">农场数量</div>
                        <div class="stat-value">{{ realData.farmCount }}</div>
                    </div>
                </div>

                <!-- 农场灌溉率列表 -->
                <div class="farm-irrigation-list">
                    <div class="list-header">
                        <h3>农场灌溉详情</h3>
                    </div>
                    <div class="irrigation-list">
                        <div class="irrigation-item" v-for="farm in farmIrrigationData" :key="farm.id">
                            <div class="farm-info">
                                <div class="farm-name">{{ farm.name }}</div>
                                <div class="farm-id">{{ farm.id }}</div>
                            </div>
                            <div class="irrigation-metrics">
                                <div class="metric">
                                    <div class="metric-label">灌溉率</div>
                                    <div class="metric-value" :class="getIrrigationRateClass(farm.irrigationRate)">
                                        {{ farm.irrigationRate }}%
                                    </div>
                                </div>
                                <div class="metric">
                                    <div class="metric-label">用水量</div>
                                    <div class="metric-value">{{ farm.waterUsage }}L</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-label">效率</div>
                                    <div class="metric-value" :class="getEfficiencyClass(farm.efficiency)">
                                        {{ farm.efficiency }}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </el-card>
        </div>
    </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted } from 'vue'

export default {
    name: 'StandaloneDashboard',
    setup() {
        // 响应式数据
        const currentTime = ref('')
        const systemName = ref('舒德尔智能灌溉管理系统')
        const realData = reactive({
            deviceCount: 0,
            farmCount: 0,
            viewCount: 0,
            onlineCount: 0,
            waterUsage: 0,
            runRate: 0
        })
        // 用水量趋势数据
        const waterTrendData = ref([800, 1200, 900, 1100, 1000])
        // 新闻数据
        const newsList = ref([
            {
                id: 1,
                title: '智能灌溉系统助力农业现代化发展，节水率提升40%',
                content: '最新智能灌溉系统在全国范围内推广，通过AI算法优化灌溉方案，实现精准用水，节水率较传统方式提升40%，为农业可持续发展提供技术支撑。',
                author: '农业科技部',
                publishTime: new Date('2024-01-15 10:30:00'),
                category: '政策动态',
                hot: true,
                views: 12580
            },
            {
                id: 2,
                title: '节水灌溉技术推广取得新突破，覆盖面积达500万亩',
                content: '水利部发布最新节水灌溉技术标准，新型滴灌、喷灌技术覆盖面积达到500万亩，预计年节水2.5亿立方米，为干旱地区农业发展提供重要保障。',
                author: '水利部',
                publishTime: new Date('2024-01-14 15:20:00'),
                category: '技术创新',
                hot: false,
                views: 8920
            },
            {
                id: 3,
                title: '智慧农场建设带动农民增收致富，人均收入增长35%',
                content: '智慧农场项目在山东、河南等地试点成功，通过物联网、大数据等技术，实现精准种植管理，农民人均收入增长35%，为乡村振兴注入新动能。',
                author: '农业农村部',
                publishTime: new Date('2024-01-13 09:15:00'),
                category: '产业动态',
                hot: true,
                views: 15620
            },
            {
                id: 4,
                title: '精准灌溉技术提高作物产量30%，土壤水分利用率达95%',
                content: '农科院研发的精准灌溉技术通过土壤传感器实时监测，实现按需灌溉，作物产量平均提高30%，土壤水分利用率达到95%，为粮食安全提供技术保障。',
                author: '农科院',
                publishTime: new Date('2024-01-12 14:45:00'),
                category: '科研成果',
                hot: false,
                views: 7430
            },
            {
                id: 5,
                title: '物联网技术在农业灌溉中的应用，设备连接数突破100万',
                content: '物联网技术在农业灌溉领域应用日益广泛，全国农业物联网设备连接数突破100万台，实现远程监控、智能决策，为智慧农业发展奠定基础。',
                author: '科技部',
                publishTime: new Date('2024-01-11 11:30:00'),
                category: '技术前沿',
                hot: false,
                views: 11200
            },
            {
                id: 6,
                title: 'AI智能决策系统优化灌溉方案，决策准确率达98%',
                content: '人工智能研究院开发的智能决策系统通过机器学习算法，分析气象、土壤、作物等多维度数据，灌溉决策准确率达到98%，大幅提升农业生产效率。',
                author: '人工智能研究院',
                publishTime: new Date('2024-01-10 16:20:00'),
                category: 'AI应用',
                hot: true,
                views: 18900
            },
            {
                id: 7,
                title: '无人机巡检系统提升农田管理效率，巡检面积扩大10倍',
                content: '无人机技术中心开发的农田巡检系统，通过高精度传感器和图像识别技术，巡检效率比人工提升10倍，及时发现病虫害和灌溉问题，保障作物健康生长。',
                author: '无人机技术中心',
                publishTime: new Date('2024-01-09 13:45:00'),
                category: '智能设备',
                hot: false,
                views: 9680
            },
            {
                id: 8,
                title: '区块链技术保障农产品溯源安全，追溯准确率99.9%',
                content: '区块链研究院将区块链技术应用于农产品溯源，从种植到销售的全程记录不可篡改，追溯准确率达到99.9%，为食品安全提供技术保障。',
                author: '区块链研究院',
                publishTime: new Date('2024-01-08 10:15:00'),
                category: '安全溯源',
                hot: false,
                views: 6750
            },
            {
                id: 9,
                title: '5G网络覆盖助力智慧农业升级，数据传输速度提升50倍',
                content: '通信技术部推进5G网络在农业领域的应用，数据传输速度比4G提升50倍，支持高清视频监控、实时数据传输，为智慧农业提供强大网络支撑。',
                author: '通信技术部',
                publishTime: new Date('2024-01-07 14:30:00'),
                category: '网络技术',
                hot: true,
                views: 13450
            },
            {
                id: 10,
                title: '绿色农业可持续发展模式探索，碳排放减少25%',
                content: '环保农业研究所探索绿色农业可持续发展模式，通过精准施肥、节水灌溉等技术，农业生产碳排放减少25%，为碳中和目标贡献力量。',
                author: '环保农业研究所',
                publishTime: new Date('2024-01-06 11:00:00'),
                category: '可持续发展',
                hot: false,
                views: 8230
            }
        ])
        // 农场灌溉率数据
        const farmIrrigationData = ref([
            { id: 'F001', name: '智慧农场A', irrigationRate: 95, waterUsage: 1200, efficiency: 92, status: '在线' },
            { id: 'F002', name: '智慧农场B', irrigationRate: 88, waterUsage: 980, efficiency: 89, status: '在线' },
            { id: 'F003', name: '智慧农场C', irrigationRate: 76, waterUsage: 1450, efficiency: 78, status: '离线' },
            { id: 'F004', name: '智慧农场D', irrigationRate: 92, waterUsage: 1100, efficiency: 91, status: '在线' },
            { id: 'F005', name: '智慧农场E', irrigationRate: 85, waterUsage: 1350, efficiency: 87, status: '在线' },
            { id: 'F006', name: '智慧农场F', irrigationRate: 90, waterUsage: 1050, efficiency: 88, status: '在线' },
            { id: 'F007', name: '智慧农场G', irrigationRate: 82, waterUsage: 1280, efficiency: 85, status: '在线' },
            { id: 'F008', name: '智慧农场H', irrigationRate: 94, waterUsage: 1150, efficiency: 93, status: '在线' },
            { id: 'F009', name: '智慧农场I', irrigationRate: 79, waterUsage: 1380, efficiency: 81, status: '离线' },
            { id: 'F010', name: '智慧农场J', irrigationRate: 91, waterUsage: 1080, efficiency: 89, status: '在线' },
            { id: 'F011', name: '智慧农场K', irrigationRate: 86, waterUsage: 1320, efficiency: 88, status: '在线' },
            { id: 'F012', name: '智慧农场L', irrigationRate: 93, waterUsage: 1020, efficiency: 90, status: '在线' },
            { id: 'F013', name: '智慧农场M', irrigationRate: 77, waterUsage: 1420, efficiency: 79, status: '离线' },
            { id: 'F014', name: '智慧农场N', irrigationRate: 89, waterUsage: 1180, efficiency: 87, status: '在线' },
            { id: 'F015', name: '智慧农场O', irrigationRate: 84, waterUsage: 1250, efficiency: 86, status: '在线' }
        ])
        // 图表数据
        const waterChartData = ref('20,120 60,100 100,80 140,90 180,70 220,85 260,75')
        const waterChartPoints = ref([
            { x: 20, y: 120 },
            { x: 60, y: 100 },
            { x: 100, y: 80 },
            { x: 140, y: 90 },
            { x: 180, y: 70 },
            { x: 220, y: 85 },
            { x: 260, y: 75 }
        ])

        // 浮动数据气泡
        const floatingDataBubbles = ref([
            { x: -14, y: 25, title: '设备总数', value: '0', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', visible: false, delay: 0 },
            { x: 110, y: 20, title: '运行率', value: '0%', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', visible: false, delay: 2 },
            { x: -15, y: 50, title: '今日用水', value: '0m³', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1s-1 .45-1 1v3h-1c-.9 0-1.64.58-1.9 1.39C5.08 15.5 5 15.24 5 15c0-3.87 3.13-7 7-7s7 3.13 7 7c0 .24-.08.5-.1.39z', visible: false, delay: 4 },
            { x: 120, y: 55, title: '在线设备', value: '0', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', visible: false, delay: 6 },
            { x: -18, y: 75, title: '农场数量', value: '0', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', visible: false, delay: 8 },
            { x: 110, y: 80, title: '灌溉率', value: '0%', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', visible: false, delay: 10 },
            { x: 50, y: -10, title: '访问量', value: '0', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', visible: false, delay: 12 },
            { x: 50, y: 110, title: '系统状态', value: '正常', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', visible: false, delay: 14 }
        ])

        let timeInterval = null
        let bubbleInterval = null
        let currentBubbleIndex = 0 // 用于循环显示气泡
        
        const updateTime = () => {
            const now = new Date()
            currentTime.value = now.toLocaleTimeString('zh-CN')
        }
        
        // 气泡动画 - 使用循环显示替代随机选择
        const startBubbleAnimation = () => {
            bubbleInterval = setInterval(() => {
                // 循环显示所有气泡，避免随机性
                floatingDataBubbles.value[currentBubbleIndex].visible = true

                setTimeout(() => {
                    floatingDataBubbles.value[currentBubbleIndex].visible = false
                }, 3000) // 减少显示时间
                
                // 移动到下一个气泡
                currentBubbleIndex = (currentBubbleIndex + 1) % floatingDataBubbles.value.length
            }, 5000) // 增加间隔时间，减少频率
        }

        const updateBubbleData = () => {
            floatingDataBubbles.value[0].value = realData.deviceCount.toString()
            floatingDataBubbles.value[1].value = realData.runRate + '%'
            floatingDataBubbles.value[2].value = realData.waterUsage + 'm³'
            floatingDataBubbles.value[3].value = realData.onlineCount.toString()
            floatingDataBubbles.value[4].value = realData.farmCount.toString()
            // 灌溉率使用固定值，后续可替换为真实API数据
            floatingDataBubbles.value[5].value = '90%' // 固定值，待替换为真实数据
            floatingDataBubbles.value[6].value = realData.viewCount.toString()
        }



        // 数据刷新定时器
        let dataRefreshInterval = null

        // 加载真实数据 - 使用固定值，待替换为真实API调用
        const loadRealData = async () => {
            try {
                realData.deviceCount = 35
                realData.farmCount = 8
                realData.viewCount = 1200
                realData.onlineCount = 30 // 基于设备总数的85%
                realData.waterUsage = 85.5
                realData.runRate = 90

                updateBubbleData()
            } catch (error) {
                console.error('加载数据失败:', error)
            }
        }

        // 格式化新闻时间
        const formatNewsTime = (date) => {
            const now = new Date()
            const diff = now - date
            const minutes = Math.floor(diff / 60000)
            const hours = Math.floor(diff / 3600000)
            const days = Math.floor(diff / 86400000)

            if (minutes < 60) {
                return `${minutes}分钟前`
            } else if (hours < 24) {
                return `${hours}小时前`
            } else {
                return `${days}天前`
            }
        }

        // 获取灌溉率样式类
        const getIrrigationRateClass = (rate) => {
            if (rate >= 90) return 'rate-excellent'
            if (rate >= 80) return 'rate-good'
            if (rate >= 70) return 'rate-average'
            return 'rate-poor'
        }

        // 获取效率样式类
        const getEfficiencyClass = (efficiency) => {
            if (efficiency >= 90) return 'efficiency-excellent'
            if (efficiency >= 80) return 'efficiency-good'
            if (efficiency >= 70) return 'efficiency-average'
            return 'efficiency-poor'
        }

        // 图表点击事件
        const showChartDetail = (type) => {
            console.log('显示图表详情:', type)
        }

        // 返回按钮
        const goBack = () => {
            if (globalThis.history.length > 1) {
                globalThis.history.back()
            } else {
                globalThis.location.hash = '#/center'
            }
        }

        // 移除自动滚动功能
        const startAutoScroll = () => {
            // 滚动功能已禁用，新闻列表保持静态显示
            console.log('新闻滚动功能已禁用')
        }

        // 生命周期
        onMounted(() => {
            updateTime()
            timeInterval = setInterval(updateTime, 5000) // 减少时间更新频率
            loadRealData()
            startAutoScroll()
            startBubbleAnimation()
            getSystemName()

            // 每60秒刷新数据 - 减少刷新频率
            dataRefreshInterval = setInterval(loadRealData, 60000)
        })

        onUnmounted(() => {
            // 清理所有定时器
            if (timeInterval) clearInterval(timeInterval)
            if (bubbleInterval) clearInterval(bubbleInterval)
            if (dataRefreshInterval) clearInterval(dataRefreshInterval)
            
            // 清理DOM引用
            timeInterval = null
            bubbleInterval = null
            dataRefreshInterval = null
        })

        // 获取系统名称
        const getSystemName = async () => {
            try {
                const response = await fetch('/api/v1/get_sys_name', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                const data = await response.json()
                if (data.err_msg === '' && data.result.sys_name && data.result.sys_name !== 'no name') {
                    systemName.value = data.result.sys_name
                }
            } catch (error) {
                console.error('获取系统名称失败:', error)
            }
        }

        return {
            currentTime,
            systemName,
            realData,
            newsList,
            farmIrrigationData,
            waterChartData,
            waterChartPoints,
            waterTrendData,
            floatingDataBubbles,
            formatNewsTime,
            getIrrigationRateClass,
            getEfficiencyClass,
            showChartDetail,
            goBack
        }
    }
}
</script>

<style scoped>
/* 设计系统变量 */
:root {
    --font-size-xs: 8px;
    --font-size-sm: 10px;
    --font-size-base: 11px;
    --font-size-md: 100px;
    --font-size-lg: 16px;
    --font-size-xl: 18px;

    --spacing-xs: 4px;
    --spacing-sm: 6px;
    --spacing-md: 8px;
    --spacing-lg: 12px;
    --spacing-xl: 16px;

    --color-primary: #00d4ff;
    --color-success: #4CAF50;
    --color-warning: #FF9800;
    --color-danger: #F44336;
    --color-text: #ccc;
    --color-text-muted: #999;
}

/* 基础样式 - 优化性能 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    will-change: auto; /* 默认不启用硬件加速 */
}

/* 完全隐藏所有滚动条 */
.dashboard-container *::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
}

.dashboard-container * {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
}

/* 隐藏主容器滚动条 */
.dashboard-container::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
}

.dashboard-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background:
        linear-gradient(135deg, rgba(10, 10, 10, 0.8) 0%, rgba(26, 26, 46, 0.8) 50%, rgba(22, 33, 62, 0.8) 100%),
        url('/background.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    overflow-x: hidden;
    overflow-y: auto;
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Microsoft JhengHei', sans-serif;
    color: #fff;
    contain: layout style paint;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
}

/* 隐藏主容器滚动条已合并到主定义中 */

/* 动态背景效果 - 优化：减少复杂度 */
.bg-animation {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
        radial-gradient(circle at 20% 50%, rgba(0, 150, 255, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(0, 255, 150, 0.03) 0%, transparent 50%);
    opacity: 0.2; /* 降低透明度，减少渲染负担 */
    will-change: auto;
}

/* 顶部标题区域 */
.header-section {
    position: relative;
    z-index: 10;
    padding: 15px 30px;
    text-align: center;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    border-bottom: 2px solid rgba(0, 150, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
}

.back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 8px;
    color: #00d4ff;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
    position: absolute;
    left: 40px;
}

.back-button:hover {
    background: rgba(0, 212, 255, 0.2);
    border-color: rgba(0, 212, 255, 0.5);
    transform: translateY(-2px);
}

.back-icon {
    width: 16px;
    height: 16px;
}

.main-title {
    font-size: 48px;
    font-weight: 800;
    background: linear-gradient(135deg, #00d4ff, #0099ff, #00ff99);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
    margin: 0;
    animation: titleGlow 3s ease-in-out infinite;
}

@keyframes titleGlow {
    0%, 100% {
        text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
    }
    50% {
        text-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
    }
}

/* 主要内容区域 */
.main-content {
    position: relative;
    z-index: 5;
    display: grid;
    grid-template-columns: 380px 1fr 420px;
    gap: 20px;
    padding: 20px;
    height: calc(100vh - 120px);
    contain: layout style;
    grid-template-rows: auto 1fr;
}

/* 面板样式 */
.left-panel,
.right-panel {
    background: rgba(255, 255, 255, 0.05) !important;
    border-radius: 12px !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    height: 105%;
    overflow: hidden;
}

.left-panel :deep(.el-card__body),
.right-panel :deep(.el-card__body) {
    padding: 15px;
    height: calc(100% - 50px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.left-panel :deep(.el-card__header),
.right-panel :deep(.el-card__header) {
    padding: 15px 15px 10px 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.center-panel {
    background: rgba(255, 255, 255, 0.05) !important;
    border-radius: 12px !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    height: 105%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.center-panel :deep(.el-card__body) {
    padding: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.center-panel :deep(.el-card__header) {
    display: none;
}

.panel-header h2 {
    margin: 0 0 20px 0;
    font-size: 18px;
    color: #00d4ff;
    border-bottom: 2px solid rgba(0, 212, 255, 0.3);
    padding-bottom: 10px;
}


.news-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.news-item {
    position: relative;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.3s ease, background-color 0.3s ease; /* 简化过渡效果 */
    cursor: pointer;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    will-change: transform; /* 只对transform启用硬件加速 */
}

.news-item:hover {
    background: rgba(0, 212, 255, 0.15);
    border-color: rgba(0, 212, 255, 0.4);
    transform: translateY(-2px) scale(1.01); /* 减少变换幅度 */
    box-shadow: 0 6px 20px rgba(0, 212, 255, 0.15); /* 减少阴影复杂度 */
}

.news-item.hot-news {
    background: rgba(255, 152, 0, 0.1);
    border-color: rgba(255, 152, 0, 0.3);
}

.news-item.hot-news:hover {
    background: rgba(255, 152, 0, 0.2);
    border-color: rgba(255, 152, 0, 0.5);
    box-shadow: 0 8px 30px rgba(255, 152, 0, 0.3);
}

.news-highlight {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(to bottom, #00d4ff, #4CAF50);
    border-radius: 0 3px 3px 0;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.news-highlight.hot-highlight {
    background: linear-gradient(to bottom, #ff9800, #ff5722);
    box-shadow: 0 0 10px rgba(255, 152, 0, 0.5);
}

.news-content {
    margin-left: 12px;
}

.news-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.news-category {
    background: linear-gradient(45deg, #00d4ff, #4CAF50);
    color: #fff;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3);
}

.news-hot {
    display: flex;
    align-items: center;    
    gap: 4px;
    background: linear-gradient(45deg, #ff9800, #ff5722);
    color: #fff;
    padding: 4px 10px;
    border-radius: 15px;
    font-size: 10px;
    font-weight: 600;
    animation: hotPulse 2s ease-in-out infinite;
}

.hot-icon {
    width: 12px;
    height: 12px;
    animation: hotRotate 3s linear infinite;
}

@keyframes hotPulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.02); /* 减少缩放幅度 */
    }
}

@keyframes hotRotate {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.news-title {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 12px;
    line-height: 1.5;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.news-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #ccc;
}

.news-author {
    color: #00d4ff;
    font-weight: 500;
    background: rgba(0, 212, 255, 0.1);
    padding: 2px 8px;
    border-radius: 12px;
}

.news-time {
    color: #999;
    font-size: 11px;
}

.news-content-text {
    font-size: 12px;
    color: #ccc;
    line-height: 1.5;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.news-meta-left {
    display: flex;
    gap: 12px;
    align-items: center;
}

.news-views {
    color: #00d4ff;
    font-size: 11px;
    background: rgba(0, 212, 255, 0.1);
    padding: 2px 6px;
    border-radius: 8px;
}

/* 统计网格 */
.stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
}

.stat-item {
    text-align: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
}

.stat-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #00d4ff, #4CAF50, #00d4ff);
    background-size: 200% 100%;
    animation: gradientShift 3s ease-in-out infinite;
}

.stat-item:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 8px 30px rgba(0, 212, 255, 0.2);
    border-color: rgba(0, 212, 255, 0.3);
}

@keyframes gradientShift {

    0%,
    100% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }
}

.stat-value {
    font-size: 13px;
    font-weight: 800;
    background: linear-gradient(45deg, #00d4ff, #4CAF50);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
    text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
    animation: valueGlow 2s ease-in-out infinite;
}

@keyframes valueGlow {
    0%, 100% {
        filter: brightness(1);
    }
    50% {
        filter: brightness(1.1); /* 减少亮度变化 */
    }
}

.stat-label {
    font-size: 13px;
    color: #ccc;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* 中央区域样式已在上面定义 */

/* 球体容器 */
.sphere-container {
    position: relative;
    width: 400px;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    flex-shrink: 0;
}

/* 备用球体样式 */
.fallback-sphere {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
}

.sphere-circle {
    position: absolute;
    border-radius: 50%;
    border: 2px solid;
    animation: rotateCounterClockwise 20s linear infinite;
}

.outer-circle {
    width: 300px;
    height: 300px;
    border-color: rgba(0, 212, 255, 0.6);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.inner-circle {
    width: 200px;
    height: 220px;
    border-color: rgba(0, 255, 150, 0.6);
    box-shadow: 0 0 15px rgba(0, 255, 150, 0.3);
    animation: rotateClockwise 15s linear infinite;
}

.outer-sphere {
    position: absolute;
    width: 350px;
    height: 350px;
    animation: rotateCounterClockwise 30s linear infinite; /* 减慢旋转速度 */
    will-change: transform;
    z-index: 2;
    transform: translateZ(0);
}

.inner-sphere {
    position: absolute;
    width: 350px;
    height: 350px;
    animation: rotateClockwise 25s linear infinite; /* 减慢旋转速度 */
    will-change: transform;
    z-index: 3;
    transform: translateZ(0);
}

/* 球体图片 */
.sphere-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.3));
    transition: filter 0.3s ease;
}

.outer-sphere-img {
    filter: drop-shadow(0 0 25px rgba(0, 212, 255, 0.4)) brightness(1.1);
}

.inner-sphere-img {
    filter: drop-shadow(0 0 15px rgba(0, 255, 150, 0.3)) brightness(1.2);
}

/* 悬停效果 */
.sphere-container:hover .outer-sphere {
    animation-duration: 10s;
}

.sphere-container:hover .inner-sphere {
    animation-duration: 8s;
}

.sphere-container:hover .sphere-image {
    filter: drop-shadow(0 0 30px rgba(0, 212, 255, 0.6)) brightness(1.3);
}

/* 中心内容布局 */
.center-content-layout {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    gap: 20px;
}

 /* 中心数据展示 */
 .center-data-display {
     position: absolute;
     background: rgba(0, 0, 0, 0.4);
     border: 1px solid rgba(0, 212, 255, 0.3);
     border-radius: 8px;
     padding: 16px;
     left:10px;
     top: 10px;
     backdrop-filter: blur(10px);
     box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
     pointer-events: auto;
     transition: all 0.3s ease;
     width: 220px;
     height: 240px;
 }

 .center-data-display:hover {
     background: rgba(0, 0, 0, 0.8);
     border-color: rgba(0, 212, 255, 0.5);
     transform: scale(1.05);
 }

.main-stat {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    margin-bottom: 16px;
}


.stat-info {
    text-align: left;
}

.stat-title {
    font-size: 22px;
    font-weight: 700;
    color: #00d4ff;
    margin-bottom: 4px;
}


.center-metrics {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.metric-row {
    display: flex;
    gap: 10px;
}

.metric-item {
    flex: 1;
    text-align: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 8px;
    border: 1px solid rgba(0, 212, 255, 0.2);
}

.metric-label {
    font-size: 16px;    
    color: #999;
    margin-bottom: 4px;
}


.metric-value.online {
    color: #4CAF50;
}

/* 中央区域统计卡片 */
.center-stats-cards {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
}

/* 统计卡片基础样式 */
.center-stat-card {
    position: absolute;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 8px;
    padding: 16px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    transition: all 0.3s ease;
}

/* 设备状态统计卡片 */
.device-stats-card {
    width: 220px;
    height: 250px;
    top: 10px;
    left: 10px;
    transform: translate(0, 0);
}

/* 用水量趋势卡片 */
.water-trend-card {
    width: 260px;
    height: 240px;
    top: 10px;
    right: 10px;
    transform: translate(0, 0);
}

/* 设备统计卡片 */
.farm-distribution-card {
    width: 280px;
    height: 200px;
    bottom: 10px;
    left: 10px;
    transform: translate(0, 0);
}

/* 系统性能卡片 */
.performance-card {
    width: 260px;
    height: 320px;
    bottom: 400px;
    right: 400px;
    transform: translate(0, 0);
}

.center-stat-card:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(0, 212, 255, 0.5);
    transform: scale(1.05);
}

 /* 中央区域卡片定位 */
 .center-stats-cards .device-stats-card {
     top: 280px;
     left: 10px;
 }

.center-stats-cards .water-trend-card {
    top: 10px;
    right: 10px;
}

.center-stats-cards .farm-distribution-card {
    bottom: 10px;
    left: 10px;
}

.center-stats-cards .performance-card {
    bottom: 10px;
    right: 10px;
}

/* 球体容器内的统计卡片 */
.sphere-stats-cards {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 15;
}

.sphere-stat-card {
    position: absolute;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 8px;
    padding: 8px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    width: 120px;
    height: 90px;
    pointer-events: auto;
    transition: all 0.3s ease;
}

.sphere-stat-card:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(0, 212, 255, 0.5);
    transform: scale(1.05);
}

/* 卡片定位 - 分布在球体容器的四个角落，靠近边缘 */

/* .water-trend-card 已合并到主定义中 */



.card-header {
    margin-bottom: 8px;
}

.card-header h4 {
    font-size: var(--font-size-md);
    color: #00d4ff;
    margin: 0;
    font-weight: 600;
    line-height: 1.2;
}

.card-content {
    font-size: 11px;
}

/* 设备状态卡片样式 */
.device-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
}

.device-item:last-child {
    margin-bottom: 0;
}


.device-info {
    flex: 1;
}



/* 用水量趋势卡片样式 */
.water-trend {
    height: 120px;
}

.trend-chart {
    display: flex;
    align-items: end;
    gap: 4px;
    height: 100px;
    margin-bottom: 15px;
}

.trend-bar {
    flex: 1;
    background: linear-gradient(to top, #00d4ff, #0099cc);
    border-radius: 2px 2px 0 0;
    min-height: 4px;
    transition: all 0.3s ease;
}

.trend-labels {
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    color: #999;
}




/* 设备统计横向柱状图样式 */
.device-horizontal-chart {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    height: 100%;
    padding: var(--spacing-md) 0;
}

.chart-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.chart-label {
    font-size: var(--font-size-base);
    color: #ccc;
    font-weight: 500;
}

.chart-bar-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.chart-bar {
    height: 16px;
    border-radius: var(--spacing-md);
    transition: width 0.3s ease;
    position: relative;
    flex: 1;
}

.chart-value {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
    font-weight: bold;
    min-width: 30px;
    text-align: right;
}

/* 系统性能饼图样式 */
.performance-pie-chart {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
}

.pie-chart-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
}

.pie-chart {
    width: 120px;
    height: 120px;
    transform: rotate(-90deg);
}

.pie-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 10;
}

.pie-total {
    font-size: 24px;
    font-weight: bold;
    color: #ccc;
    line-height: 1;
}

.pie-label {
    font-size: 16px;
    color: #ccc;
    margin-top: 2px;
}

.pie-legend {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

.legend-color {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.legend-text {
    font-size: 12px;
    color: #ccc;
    white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .center-stat-card {
        padding: var(--spacing-lg);
    }


    .pie-chart {
        width: 100px;
        height: 100px;
    }

    .device-pie-chart {
        width: 90px;
        height: 90px;
    }
}

@media (max-width: 768px) {
    .center-stat-card {
        padding: var(--spacing-md);
    }


    .chart-label {
        font-size: var(--font-size-sm);
    }

    .chart-value {
        font-size: var(--font-size-xs);
    }
}

/* 浮动数据气泡 */
.floating-data-bubbles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
}

.data-bubble {
    position: absolute;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
    transition: all 0.5s ease;
    pointer-events: none;
}

.data-bubble.visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    animation: dataBubbleFloat 4s ease-in-out;
}

.bubble-content {
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid rgba(0, 212, 255, 0.6);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    backdrop-filter: blur(15px);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 0 20px rgba(0, 212, 255, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    min-width: 140px;
    position: relative;
}

.bubble-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 150, 0.1));
    border-radius: 12px;
    z-index: -1;
}

.bubble-icon {
    width: 28px;
    height: 28px;
    color: #00d4ff;
    animation: iconPulse 2s ease-in-out infinite;
    flex-shrink: 0;
}

.bubble-svg {
    width: 100%;
    height: 100%;
}

.bubble-text {
    flex: 1;
    min-width: 0;
}

.bubble-title {
    font-size: 12px;
    color: #aaa;
    margin-bottom: 4px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.bubble-value {
    font-size: 18px;
    font-weight: bold;
    color: #00d4ff;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    animation: valueGlow 2s ease-in-out infinite alternate;
}

.bubble-tail {
    position: absolute;
    bottom: -8px;
    left: 50%;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid rgba(0, 0, 0, 0.9);
    transform: translateX(-50%);
    animation: tailPulse 2s ease-in-out infinite;
}

/* 数据区域 */
.data-section {
    margin-bottom: 20px;
}

.data-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.data-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(to bottom, #00d4ff, #4CAF50);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.data-item:hover {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    transform: translateX(5px);
}

.data-item:hover::before {
    opacity: 1;
}

.data-label {
    font-size: 14px;
    color: #ccc;
    font-weight: 500;
}

.data-value {
    font-size: 16px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.3);
}

.status-normal {
    color: #4CAF50;
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-online {
    color: #4CAF50;
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-offline {
    color: #F44336;
    background: rgba(244, 67, 54, 0.2);
    border: 1px solid rgba(244, 67, 54, 0.3);
}

/* 系统数据 */
.system-metrics {
    margin-bottom: 20px;
}

/* .metric-row 已合并到主定义中 */



.metric-number {
    font-size: 16px;
    font-weight: 700;
    color: #00d4ff;
}

.metric-number.online {
    color: #4CAF50;
}

/* 农场灌溉率列表 */
.farm-irrigation-list {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    flex: 1;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 200px);
    min-height: 300px;
    overflow: hidden;
}

.list-header h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #00d4ff;
    border-bottom: 2px solid rgba(0, 212, 255, 0.3);
    padding-bottom: 8px;
}

.irrigation-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    overflow-y: auto;
    scroll-behavior: smooth;
    min-height: 0;
    max-height: calc(100vh - 300px);
    contain: layout style paint; /* 启用CSS containment */
    transform: translateZ(0); /* 启用硬件加速 */
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
}

/* 完全隐藏灌溉列表滚动条 */
.irrigation-list::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
}

.irrigation-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    min-height: 60px;
    width: 100%;
}

.irrigation-item:hover {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    transform: translateX(5px);
}

.farm-info {
    flex: 1;
    min-width: 70px;
    flex-shrink: 0;
}

.farm-name {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
}

.farm-id {
    font-size: 11px;
    color: #999;
    white-space: nowrap;
}

.irrigation-metrics {
    display: flex;
    gap: 15px;
    flex: 1;
    justify-content: flex-end;
    align-items: center;
}

.metric {
    text-align: center;
    min-width: 5px;
    flex-shrink: 0;
}


.metric-value {
    font-size: 14px;
    font-weight: 600;
    color: #00d4ff;
    padding: 3px 6px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.3);
    white-space: nowrap;
    display: inline-block;
    min-width: 40px;
    text-align: center;
}

.rate-excellent,
.efficiency-excellent {
    color: #4CAF50;
    background: rgba(76, 175, 80, 0.2);
}

.rate-good,
.efficiency-good {
    color: #8BC34A;
    background: rgba(139, 195, 74, 0.2);
}

.rate-average,
.efficiency-average {
    color: #FF9800;
    background: rgba(255, 152, 0, 0.2);
}

.rate-poor,
.efficiency-poor {
    color: #F44336;
    background: rgba(244, 67, 54, 0.2);
}


.farm-status.status-online {
    color: #4CAF50;
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid rgba(76, 175, 80, 0.3);
}

.farm-status.status-offline {
    color: #F44336;
    background: rgba(244, 67, 54, 0.2);
    border: 1px solid rgba(244, 67, 54, 0.3);
}

/* 农场数据表格 */
.farm-data-section h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #00d4ff;
}

.data-table {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    overflow: hidden;
}

.table-header {
    display: grid;
    grid-template-columns: 80px 1fr 60px;
    background: rgba(0, 212, 255, 0.1);
    font-weight: bold;
    font-size: 12px;
}

.table-row {
    display: grid;
    grid-template-columns: 80px 1fr 60px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.table-cell {
    padding: 8px 12px;
    color: #fff;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    word-break: break-all;
    display: flex;
    align-items: center;
    flex: 1;
}

.table-row .table-cell:nth-child(2) {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    word-break: keep-all !important;
    font-weight: 500;
    max-width: 100%;
    min-width: 0;
}

/* 顶部图表 */
.top-charts {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 0;
    margin-bottom: 20px;
}

.chart-card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)) !important;
    border-radius: 12px !important;
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    height: 240px;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
}

.chart-card :deep(.el-card__body) {
    padding: 15px;
    height: calc(100% - 50px);
    overflow: hidden;
}

.chart-card :deep(.el-card__header) {
    padding: 15px 15px 10px 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 150, 0.05));
    border-radius: 16px;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
}

.chart-card:hover::before {
    opacity: 1;
}

.chart-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow:
        0 20px 40px rgba(0, 0, 0, 0.4),
        0 0 30px rgba(0, 212, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-color: rgba(0, 212, 255, 0.4);
    animation: chartPulse 2s ease-in-out infinite;
}

.chart-header h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: #00d4ff;
    font-weight: 700;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
    position: relative;
}

.chart-header h3::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 30px;
    height: 2px;
    background: linear-gradient(90deg, #00d4ff, transparent);
    border-radius: 1px;
}

.chart-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.line-chart,
.pie-chart,
.bar-chart {
    width: 100%;
    height: 120px;
    flex-shrink: 0;
}

.chart-point {
    transition: all 0.3s ease;
}

.chart-point:hover {
    r: 5;
    fill: #4CAF50;
}

.pie-segment {
    transition: all 0.3s ease;
}

.pie-text {
    fill: #fff;
    font-size: 14px;
    font-weight: bold;
}

.bar {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.bar:hover {
    opacity: 0.9;
    transform: scaleY(1.05);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

/* 动画 */
@keyframes rotateClockwise {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes chartPulse {

    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.4);
    }

    50% {
        box-shadow: 0 0 0 10px rgba(0, 212, 255, 0);
    }
}

@keyframes dataGlow {

    0%,
    100% {
        text-shadow: 0 0 5px rgba(0, 212, 255, 0.5);
    }

    50% {
        text-shadow: 0 0 15px rgba(0, 212, 255, 0.8);
    }
}

@keyframes rotateCounterClockwise {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(-360deg);
    }
}

@keyframes dataBubbleFloat {
    0% {
        transform: translate(-50%, -50%) scale(0.8) translateY(20px);
        opacity: 0;
    }

    20% {
        transform: translate(-50%, -50%) scale(1) translateY(0);
        opacity: 1;
    }

    80% {
        transform: translate(-50%, -50%) scale(1) translateY(0);
        opacity: 1;
    }

    100% {
        transform: translate(-50%, -50%) scale(0.8) translateY(-20px);
        opacity: 0;
    }
}

@keyframes iconPulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }
}

@keyframes valueGlow {
    0% {
        text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }

    100% {
        text-shadow: 0 0 20px rgba(0, 212, 255, 0.8), 0 0 30px rgba(0, 212, 255, 0.3);
    }
}

@keyframes tailPulse {

    0%,
    100% {
        opacity: 0.6;
    }

    50% {
        opacity: 1;
    }
}

/* 响应式设计 */
@media (max-width: 1920px) {
    .main-content {
        grid-template-columns: 320px 1fr 380px;
        gap: 15px;
        padding: 15px;
    }

    .sphere-container {
        max-width: 450px;
        max-height: 450px;
    }

    .outer-sphere,
    .inner-sphere {
        max-width: 350px;
        max-height: 350px;
    }
}

@media (max-width: 1440px) {
    .main-content {
        grid-template-columns: 300px 1fr 350px;
        gap: 15px;
        padding: 15px;
    }

    .sphere-container {
        max-width: 400px;
        max-height: 400px;
    }

    .outer-sphere,
    .inner-sphere {
        max-width: 300px;
        max-height: 300px;
    }
}

@media (max-width: 1200px) {
    .main-content {
        grid-template-columns: 280px 1fr 320px;
        gap: 12px;
        padding: 12px;
    }

    .sphere-container {
        max-width: 350px;
        max-height: 350px;
    }

    .outer-sphere,
    .inner-sphere {
        max-width: 280px;
        max-height: 280px;
    }

    .top-charts {
        grid-template-columns: repeat(2, 1fr);
    }

    .chart-card {
        height: 180px;
    }
}

@media (max-width: 768px) {
    .main-content {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
        height: auto;
        min-height: calc(100vh - 120px);
    }

    .top-charts {
        grid-template-columns: 1fr;
    }

    .header-section {
        flex-direction: column;
        gap: 10px;
    }

    .main-title {
        font-size: 32px;
    }

    .back-button {
        position: static;
    }

    .left-panel,
    .right-panel,
    .center-panel {
        height: auto;
        min-height: 400px;
    }
}

@media (max-width: 480px) {
    .dashboard-container {
        padding: 10px;
    }

    .main-content {
        gap: 15px;
    }

    .left-panel,
    .right-panel {
        padding: 15px;
    }

    .main-title {
        font-size: 24px;
    }
}

/* 硬件加速已合并到.chart-card主定义中 */

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* 低性能设备优化 */
@media (max-width: 1024px) {
    .outer-sphere,
    .inner-sphere {
        animation-duration: 60s !important; /* 进一步减慢动画 */
    }
    
    .news-item:hover {
        transform: none; /* 禁用悬停动画 */
    }
    
    .chart-card:hover {
        transform: none; /* 禁用悬停动画 */
    }
}

/* 极低性能设备优化 */
@media (max-width: 768px) {
    .bg-animation {
        display: none; /* 隐藏背景动画 */
    }
    
    .outer-sphere,
    .inner-sphere {
        animation: none; /* 禁用旋转动画 */
    }
    
    .floating-data-bubbles {
        display: none; /* 隐藏浮动气泡 */
    }
}


/* 用水统计 */
.water-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 15px;
}

.metric-card {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 212, 255, 0.2);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
}

.metric-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.metric-icon {
    font-size: 16px;
}

.metric-title {
    font-size: 11px;
    color: #ccc;
}


.metric-change {
    font-size: 10px;
    font-weight: 600;
}

.metric-change.positive {
    color: #4CAF50;
}

/* 农场状态 */
.farm-status {
    display: flex;
    gap: 8px;
    margin-top: 15px;
}

.status-item {
    flex: 1;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.status-item.online .status-dot {
    background: #4CAF50;
}

.status-item.offline .status-dot {
    background: #F44336;
}

.status-item.maintenance .status-dot {
    background: #FF9800;
}

.status-item.total .status-dot {
    background: #2196F3;
}

.status-info {
    flex: 1;
    min-width: 0;
}

.status-name {
    font-size: 10px;
    color: #ccc;
    margin-bottom: 2px;
}

.status-count {
    font-size: 12px;
    font-weight: 600;
    color: #00d4ff;
}


/* 系统统计 */
.system-stats {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}




/* 设备状态统计 */
.device-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
}


.device-icon {
    font-size: 16px;
}

.device-label {
    font-size: 11px;
    color: #ccc;
    margin-bottom: 2px;
}

.device-value {
    font-size: 16px;
    font-weight: 700;
    color: #00d4ff;
}

/* 用水量趋势 */
/* .water-trend 已合并到主定义中 */
/* .trend-chart 已合并到主定义中 */

.trend-bar:hover {
    background: linear-gradient(to top, #00d4ff, #00a8e6);
}

/* 系统性能 */
.performance-metrics {
    display: flex;
    flex-direction: column;
    gap: 12px;
}



.metric-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
}

.metric-fill {
    height: 100%;
    background: linear-gradient(90deg, #00d4ff, #0099cc);
    border-radius: 2px;
    transition: width 0.3s ease;
}


/* 响应式字体大小 */
@media (max-width: 1200px) {


    .detail-label {
        font-size: 9px;
    }

    .detail-value {
        font-size: 10px;
    }

    .chart-label {
        font-size: 10px;
    }

    .chart-value {
        font-size: 12px;
    }

    .trend-labels {
        font-size: 10px;
    }
}

@media (max-width: 768px) {


    .detail-label {
        font-size: 8px;
    }

    .detail-value {
        font-size: 9px;
    }

    .chart-label {
        font-size: 9px;
    }

    .chart-value {
        font-size: 11px;
    }

    .trend-labels {
        font-size: 9px;
    }
}


.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}

.status-indicator.online {
    background: #4CAF50;
    box-shadow: 0 0 4px rgba(76, 175, 80, 0.5);
}

.status-indicator.offline {
    background: #F44336;
    box-shadow: 0 0 4px rgba(244, 67, 54, 0.5);
}

.status-indicator.maintenance {
    background: #FF9800;
    box-shadow: 0 0 4px rgba(255, 152, 0, 0.5);
}
</style>
