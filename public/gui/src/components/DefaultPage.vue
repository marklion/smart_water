<template>
  <div class="default-page">
    <!-- 监控中心特殊布局 -->
    <div v-if="route.name === '监控中心'" class="monitoring-center">

      <!-- 内容包装器 -->
      <div class="content-wrapper">
        <!-- 主要内容区域 -->
        <div class="main-content">
          <!-- 左侧信息面板 -->
          <div class="left-panel">
            <!-- 基本信息卡片 -->
            <BasicInfoCard :data="basicInfo" :items="basicInfoItems" title="基本信息" />

            <!-- 气象信息卡片 -->
            <el-card class="weather-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span class="card-title">气象信息</span>
                </div>
              </template>
              <div class="weather-content">
                <WeatherWeekly ref="weatherRef" />
              </div>
            </el-card>
          </div>

          <!-- 中央地图区域 -->
          <div class="center-panel">
            <!-- 地图和策略详情卡片 -->
            <el-card class="map-irrigation-card" shadow="hover">
              <el-tabs v-model="activeMainTab" class="main-tabs" @tab-change="handleMainTabChange">
                <!-- 轮灌组状态 Tab -->
                <el-tab-pane label="轮灌组状态" name="watering">
                  <div class="tab-content-with-actions">
                    <div class="tab-actions">
                      <el-button type="primary" size="small" @click="refreshWateringGroup" :icon="Refresh">
                        刷新
                      </el-button>
                    </div>
                    <div class="tab-content-scroll">
                      <WateringGroupStatus ref="wateringGroupRef" :farm-name="selectedFarm" />
                    </div>
                  </div>
                </el-tab-pane>

                <!-- 所有设备 Tab -->
                <el-tab-pane label="所有设备" name="devices">
                  <div class="tab-content-with-actions">
                    <div class="tab-actions">
                      <div class="tab-actions-left">
                        <span class="farm-name-display" v-if="selectedFarm">
                          <el-icon>
                            <House />
                          </el-icon>
                          当前农场：{{ selectedFarm }}
                        </span>
                      </div>
                      <div class="tab-actions-right">
                        <el-button
                          type="success"
                          size="small"
                          :icon="Plus"
                          @click="openAddWaterGroupValveDialog"
                        >
                          添加设备
                        </el-button>
                        <el-button type="primary" size="small" @click="refreshDeviceList" :icon="Refresh">
                          刷新
                        </el-button>
                      </div>
                    </div>
                    <div class="tab-content-scroll">
                      <el-table :data="deviceList" stripe border :loading="deviceListLoading"
                        :empty-text="selectedFarm ? '当前农场暂无设备数据' : '请先选择农场'" class="device-list-table">
                        <el-table-column prop="deviceName" label="设备名称" width="180" align="left"
                          show-overflow-tooltip />
                        <el-table-column prop="deviceType" label="设备类型" width="150" align="center" />
                        <el-table-column prop="blockName" label="所属区块" width="120" align="center" />
                        <el-table-column prop="status" label="状态" width="100" align="center">
                          <template #default="{ row }">
                            <el-button type="primary" size="small" @click="onDeviceClick(row)">
                              查看
                            </el-button>
                          </template>
                        </el-table-column>
                        <el-table-column prop="is_online" label="在线状态" width="100" align="center">
                          <template #default="{ row }">
                            <el-tag :type="row.is_online ? 'success' : 'danger'" size="small">
                              {{ row.is_online ? '在线' : '离线' }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column prop="longitude" label="经度" width="120" align="center" />
                        <el-table-column prop="latitude" label="纬度" width="120" align="center" />
                        <el-table-column prop="capability" label="能力集" min-width="150" align="left"
                          show-overflow-tooltip>
                          <template #default="{ row }">
                            {{ Array.isArray(row.capability) ? row.capability.join(', ') : row.capability }}
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </div>
                </el-tab-pane>

                <!-- 农场地图 Tab -->
                <el-tab-pane label="农场地图" name="map">
                  <div class="map-container">
                    <InteractiveMapComponent :devices="mapMarkers" :center="mapCenter" :zoom="mapZoom"
                      @device-toggle="onDeviceToggle" />
                  </div>
                </el-tab-pane>

                <!-- 策略运行时状态 Tab -->
                <el-tab-pane label="策略运行时状态" name="runtime">
                  <div class="tab-content-with-actions">
                    <div class="tab-actions">
                      <el-button type="primary" size="small" @click="refreshIrrigationData" :icon="Refresh">
                        刷新
                      </el-button>
                    </div>
                    <div class="tab-content-scroll">
                      <PolicyRuntimeStatus ref="policyRuntimeRef" :farm-name="selectedFarm" />
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </el-card>
          </div>

          <!-- 右侧信息面板 -->
          <div class="right-panel">
            <!-- 实时数据卡片 -->
            <RealtimeDataCard :farm-name="selectedFarm" ref="realtimeDataRef" />

            <!-- 告警信息卡片 -->
            <WarningCard ref="warningCardRef" />
          </div>
        </div>

      </div>

    </div>

    <!-- 其他页面的默认布局 -->
    <div v-else>
      <el-card>
        <template #header>
          <div class="card-header">
            <span>{{ pageTitle }}</span>
          </div>
        </template>

        <div class="page-content">
          <el-empty :description="pageDescription" :image-size="200">
            <el-button type="primary">开始使用</el-button>
          </el-empty>
        </div>
      </el-card>
    </div>

    <!-- 添加轮灌阀门对话框 -->
    <el-dialog
      v-model="addWaterGroupValveDialogVisible"
      title="添加轮灌组阀门设备"
      width="640px"
      :close-on-click-modal="false"
      :append-to-body="true"
      class="add-wgv-dialog"
    >
      <el-form
        ref="addWaterGroupValveFormRef"
        :model="addWaterGroupValveForm"
        :rules="addWaterGroupValveRules"
        label-width="140px"
      >
        <el-form-item label="所属农场" prop="farm_name">
          <el-input v-model="addWaterGroupValveForm.farm_name" disabled />
        </el-form-item>
        <el-form-item label="所属区块" prop="block_name">
          <el-select
            v-model="addWaterGroupValveForm.block_name"
            placeholder="请选择所属区块"
            filterable
            clearable
          >
            <el-option
              v-for="block in blocks"
              :key="block.name"
              :label="block.name"
              :value="block.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备名称" prop="valve_name">
          <el-input v-model="addWaterGroupValveForm.valve_name" placeholder="例如：农场1-阀门1" />
        </el-form-item>
        <el-form-item label="驱动名称" prop="driver_name">
          <el-select v-model="addWaterGroupValveForm.driver_name" placeholder="请选择驱动类型">
            <el-option label="WaterGroupValve" value="WaterGroupValve" />
            <el-option label="WaterGroupValve_v2" value="WaterGroupValve_v2" />
          </el-select>
        </el-form-item>
        <el-form-item label="阀门配置" prop="">
          <div class="valve-config-fields">
            <el-input
              v-model="valveConfigForm.token"
              placeholder="token，例如：9CrLOUBhedObQjLTmhZJbQ=="
            />
            <el-input
              v-model="valveConfigForm.device_sn"
              placeholder="device_sn，例如：DZ005JSJ25180162"
            />
            <el-switch
              v-model="valveConfigForm.is_left"
              active-text="左侧阀门"
              inactive-text="右侧阀门"
            />
            <el-input-number
              v-model="valveConfigForm.poll_interval"
              :min="1000"
              :step="1000"
              style="width: 100%;"
              placeholder="poll_interval 轮询间隔（毫秒）"
            />
          </div>
        </el-form-item>
        <el-form-item label="经度（-180~180）" prop="longitude">
          <el-input-number
            v-model="addWaterGroupValveForm.longitude"
            :precision="6"
            :step="0.000001"
            :min="-180"
            :max="180"
            placeholder="例如 111.670801"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="纬度（-90~90）" prop="latitude">
          <el-input-number
            v-model="addWaterGroupValveForm.latitude"
            :precision="6"
            :step="0.000001"
            :min="-90"
            :max="90"
            placeholder="例如 40.818311"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="开阀压力下限" prop="open_pressure_low_limit">
          <el-input-number
            v-model="addWaterGroupValveForm.open_pressure_low_limit"
            :min="0"
            :step="0.01"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="关阀压力上限" prop="close_pressure_high_limit">
          <el-input-number
            v-model="addWaterGroupValveForm.close_pressure_high_limit"
            :min="0"
            :step="0.01"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="压力检查周期(秒)" prop="pressure_check_interval">
          <el-input-number
            v-model="addWaterGroupValveForm.pressure_check_interval"
            :min="1"
            :step="1"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addWaterGroupValveDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitAddWaterGroupValve">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog v-model="deviceDetailDialogVisible" title="设备详情" width="800px" :close-on-click-modal="false">
      <div v-if="selectedDeviceDetail" class="device-detail-content">
        <!-- 设备基本信息 -->
        <div class="device-details-section">
          <h3 class="section-title">{{ selectedDeviceDetail.deviceName || selectedDeviceDetail.device_name }}</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="设备类型">
              {{ selectedDeviceDetail.deviceType || selectedDeviceDetail.driver_name || '未知' }}
            </el-descriptions-item>
            <el-descriptions-item label="所属农场">
              {{ selectedDeviceDetail.farmName || selectedDeviceDetail.farm_name || '未知' }}
            </el-descriptions-item>
            <el-descriptions-item label="所属区块">
              {{ selectedDeviceDetail.blockName || selectedDeviceDetail.block_name || '未知' }}
            </el-descriptions-item>
            <el-descriptions-item label="坐标位置">
              <span v-if="selectedDeviceDetail.longitude && selectedDeviceDetail.latitude">
                经度: {{ selectedDeviceDetail.longitude.toFixed(6) }}, 纬度: {{ selectedDeviceDetail.latitude.toFixed(6) }}
              </span>
              <span v-else>
                X: {{ selectedDeviceDetail.x }}, Y: {{ selectedDeviceDetail.y }}
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 运行时信息区域 -->
        <div v-if="(selectedDeviceDetail.runtime_info && selectedDeviceDetail.runtime_info.length > 0) || selectedDeviceDetail.is_online !== undefined"
            class="runtime-info-section" :class="{ loading: refreshingRuntimeInfo }">
          <div class="section-title">
            <span>运行时信息</span>
            <el-button size="small" type="primary" :icon="Refresh" @click="refreshRuntimeInfo"
                :loading="refreshingRuntimeInfo" circle />
          </div>
          <div class="runtime-info-list">
            <!-- 设备在线状态 -->
            <div v-if="selectedDeviceDetail.is_online !== undefined" class="runtime-info-item online-status-item">
              <div class="info-label">
                <el-icon class="status-icon"
                    :class="{ 'online': selectedDeviceDetail.is_online, 'offline': !selectedDeviceDetail.is_online }">
                  <CircleCheck v-if="selectedDeviceDetail.is_online" />
                  <CircleClose v-else />
                </el-icon>
                设备在线状态：
              </div>
              <div class="info-value"
                  :class="{ 'online': selectedDeviceDetail.is_online, 'offline': !selectedDeviceDetail.is_online }">
                {{ selectedDeviceDetail.is_online ? '在线' : '离线' }}
              </div>
            </div>
            <!-- 其他运行时信息 -->
            <div v-for="(info, index) in selectedDeviceDetail.runtime_info" :key="index"
                class="runtime-info-item">
              <div class="info-label">{{ info.title }}：</div>
              <div class="info-value">{{ info.text }}</div>
            </div>
          </div>
        </div>

         <!-- 设备操作按钮 -->
         <div class="device-actions" v-if="hasAnyDeviceCapability(selectedDeviceDetail)">
           <div class="device-controls-container">
             <!-- 动态生成的设备操作按钮 -->
             <div v-for="buttonGroup in getDeviceButtonGroupsWrapperLocal(selectedDeviceDetail)" :key="buttonGroup.key"
                :class="buttonGroup.containerClass">
              <el-button v-for="buttonConfig in buttonGroup.buttons" :key="buttonConfig.key"
                  :type="buttonConfig.buttonType" :size="buttonConfig.buttonSize"
                  :class="buttonConfig.buttonClass"
                  @click="handleDeviceAction(buttonConfig.action, selectedDeviceDetail.deviceName || selectedDeviceDetail.device_name)">
                <el-icon v-if="buttonConfig.icon" class="mr-1">
                  <VideoPlay v-if="buttonConfig.icon === 'VideoPlay'" />
                  <VideoPause v-else-if="buttonConfig.icon === 'VideoPause'" />
                  <Monitor v-else-if="buttonConfig.icon === 'Monitor'" />
                  <Close v-else-if="buttonConfig.icon === 'Close'" />
                </el-icon>
                {{ buttonConfig.buttonText }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeDeviceDetailDialog">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, onUnmounted, shallowRef, watch, inject, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import { Refresh, House, Monitor, VideoPlay, VideoPause, Close, CircleCheck, CircleClose, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import WeatherWeekly from '../../../../weather/gui/WeatherWeekly.vue'
import InteractiveMapComponent from './InteractiveMapComponent.vue'
import WateringGroupStatus from '../../../../policy/gui/WateringGroupStatus.vue'
import PolicyRuntimeStatus from '../../../../policy/gui/PolicyRuntimeStatus.vue'
import BasicInfoCard from '../../../../monitoring/gui/BasicInfoCard.vue'
import RealtimeDataCard from '../../../../monitoring/gui/RealtimeDataCard.vue'
import WarningCard from '../../../../monitoring/gui/WarningCard.vue'
import call_remote from '../../../lib/call_remote.js'
import { fetchMapConfig } from '../config/mapConfig.js'
import config_lib from '../../../../config/lib/config_lib.js'
import resource_lib from '../../../../resource/lib/resource_lib.js'
import { 
  getDeviceType, 
  hasDeviceCapability, 
  hasAnyDeviceCapability, 
  refreshRuntimeInfo as refreshRuntimeInfoUtil,
  createRuntimeInfoAutoRefresh,
  handleDeviceAction as handleDeviceActionUtil,
  getDeviceButtonGroupsWrapper
} from '../utils/deviceUtils.js'

const route = useRoute()
// 注入城市变化数据
const cityChangeData = inject('cityChangeData', ref({ city: '', location: null, timestamp: null }))

const pageTitle = computed(() => {
  return route.name || '页面'
})

const pageDescription = computed(() => {
  const descriptions = {
    '首页': '欢迎使用智能灌溉管理系统',
    '设备配置': '在这里可以配置和管理各种设备',
    '策略配置': '在这里可以配置各种策略规则',
    '用户管理': '在这里可以管理系统用户',
    '权限管理': '在这里可以配置用户权限',
    '数据监控': '在这里可以监控系统数据',
    '告警管理': '在这里可以管理系统告警'
  }
  return descriptions[route.name] || `${route.name}功能正在开发中...`
})

// 监控中心数据
const selectedFarm = ref('')
const weatherRef = ref(null) // 天气组件引用
const blocks = ref([])

// 基本信息数据
const basicInfo = reactive({
  waterGroupCount: 0,
  farmArea: '0亩',
  cropName: '',
  totalDevices: 0,
  onlineDevices: 0,
  offlineDevices: 0
})

// 基本信息卡片配置
const basicInfoItems = [
  { key: 'waterGroupCount', label: '轮灌组数量', valueClass: '' },
  { key: 'farmArea', label: '农场面积', valueClass: '' },
  { key: 'cropName', label: '作物名称', valueClass: '' },
  { key: 'totalDevices', label: '设备总数量', valueClass: '' },
  { key: 'onlineDevices', label: '在线设备', valueClass: 'online' },
  { key: 'offlineDevices', label: '离线设备', valueClass: 'offline' }
]

// 实时数据已移至 RealtimeDataCard 组件中管理


// 地图配置
const mapCenter = ref({ lng: 111.670801, lat: 40.818311 }) // 默认呼和浩特市坐标
const mapZoom = ref(15)

// 地图标记点 - 使用shallowRef优化性能，从真实设备数据获取
const mapMarkers = shallowRef([])


// Tab切换相关
const activeMainTab = ref('watering') // 主tab切换（轮灌组状态、所有设备、地图、策略运行时状态）
const activeIrrigationTab = ref('watering')

// 设备列表相关
const deviceList = ref([])
const deviceListLoading = ref(false)

// 设备详情对话框
const deviceDetailDialogVisible = ref(false)
const selectedDeviceDetail = ref(null)
const refreshingRuntimeInfo = ref(false)
const deviceStatuses = ref({}) // 跟踪设备状态

// 添加轮灌阀门对话框
const addWaterGroupValveDialogVisible = ref(false)
const addWaterGroupValveFormRef = ref(null)
const addWaterGroupValveForm = ref({
  farm_name: '',
  block_name: '',
  valve_name: '',
  driver_name: 'WaterGroupValve',
  valve_config_key: '',
  latitude: null,
  longitude: null,
  open_pressure_low_limit: 0.1,
  close_pressure_high_limit: 0.25,
  pressure_check_interval: 3
})

const valveConfigForm = ref({
  token: '',
  device_sn: '',
  is_left: false,
  poll_interval: 5000
})

const addWaterGroupValveRules = {
  farm_name: [{ required: true, message: '所属农场不能为空', trigger: 'blur' }],
  block_name: [{ required: true, message: '所属区块不能为空', trigger: 'blur' }],
  valve_name: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
  driver_name: [{ required: true, message: '请选择驱动类型', trigger: 'change' }],
  valve_config_key: [{ required: true, message: '阀门配置键不能为空', trigger: 'blur' }],
  longitude: [{ required: true, message: '经度不能为空', trigger: 'change' }],
  latitude: [{ required: true, message: '纬度不能为空', trigger: 'change' }],
  open_pressure_low_limit: [{ required: true, message: '开阀压力下限不能为空', trigger: 'change' }],
  close_pressure_high_limit: [{ required: true, message: '关阀压力上限不能为空', trigger: 'change' }],
  pressure_check_interval: [{ required: true, message: '压力检查周期不能为空', trigger: 'change' }]
}

// 创建自动刷新定时器管理器
const runtimeInfoAutoRefresh = createRuntimeInfoAutoRefresh(
  () => selectedDeviceDetail,
  () => refreshRuntimeInfo(),
  30000
)


// 组件引用
const wateringGroupRef = ref(null)
const policyRuntimeRef = ref(null)
const realtimeDataRef = ref(null)
const warningCardRef = ref(null)


// API接口方法
const loadBlocks = async (farmId) => {
  if (!farmId) {
    blocks.value = []
    return
  }
  try {
    const result = await resource_lib.list_block(farmId, 0)
    blocks.value = result?.blocks || []
  } catch (error) {
    console.error('加载区块列表失败:', error)
    blocks.value = []
  }
}

const loadFarmData = async (farmId) => {
  try {

    // 更新地图中心点 - 根据农场位置信息
    await updateMapCenterForFarm(farmId)

    // 加载基本信息 - 使用监控中心模块
    const basicResponse = await call_remote('/monitoring/getBasicInfo', { farmName: farmId })

    if (basicResponse) {
      // 直接从后端API获取所有基础信息，包括轮灌组数量
      basicInfo.waterGroupCount = basicResponse.waterGroupCount || 0
      basicInfo.farmArea = `${basicResponse.totalArea || 0}亩`
      basicInfo.cropName = basicResponse.cropName || '未知'
      basicInfo.totalDevices = basicResponse.totalDevices || 0
      basicInfo.onlineDevices = basicResponse.onlineDevices || 0
      basicInfo.offlineDevices = basicResponse.offlineDevices || 0
    } else {
      // 如果 API 没有返回数据，使用默认值
      basicInfo.waterGroupCount = 0
      basicInfo.farmArea = '0亩'
      basicInfo.cropName = '未知'
      basicInfo.totalDevices = 0
      basicInfo.onlineDevices = 0
      basicInfo.offlineDevices = 0
    }

    // 加载真实设备数据
    await loadRealDeviceData(farmId)

  } catch (error) {
    console.error('加载农场数据失败:', error)
    // 使用默认值而不是硬编码的模拟数据
    basicInfo.waterGroupCount = 0
    basicInfo.farmArea = '0亩'
    basicInfo.cropName = '未知'
    basicInfo.totalDevices = 0
    basicInfo.onlineDevices = 0
    basicInfo.offlineDevices = 0

    // 实时数据由 RealtimeDataCard 组件管理
  }
}

// 实时数据加载已移至 RealtimeDataCard 组件中

// 更新地图中心点 - 根据农场位置信息
const updateMapCenterForFarm = async (farmId) => {
  try {
    // 首先尝试从全局农场列表中获取农场位置信息
    if (window.farmList && window.farmList.length > 0) {
      const farm = window.farmList.find(f => f.id === farmId)
      if (farm && farm.longitude && farm.latitude) {
        mapCenter.value = { lng: farm.longitude, lat: farm.latitude }
        mapZoom.value = 15
        return
      }
    }

    // 如果农场没有位置信息，尝试从设备数据中获取位置
    try {
      const deviceResponse = await call_remote('/device_management/list_device', {
        farm_name: farmId,
        pageNo: 0
      })

      if (deviceResponse && deviceResponse.devices && deviceResponse.devices.length > 0) {
        // 查找有真实坐标的设备
        const deviceWithLocation = deviceResponse.devices.find(device =>
          device.longitude && device.latitude
        )

        if (deviceWithLocation) {
          mapCenter.value = {
            lng: deviceWithLocation.longitude,
            lat: deviceWithLocation.latitude
          }
          mapZoom.value = 15
          return
        }
      }
    } catch (error) {
      console.warn('获取设备位置信息失败:', error)
    }

    // 如果都没有位置信息，使用默认位置
    mapCenter.value = { lng: 111.670801, lat: 40.818311 } // 默认呼和浩特市坐标
    mapZoom.value = 15

  } catch (error) {
    console.error('更新地图中心点失败:', error)
    // 出错时使用默认位置
    mapCenter.value = { lng: 111.670801, lat: 40.818311 }
    mapZoom.value = 15
  }
}

// 处理农场切换事件
const handleFarmChange = async (farmId) => {
  selectedFarm.value = farmId
  await loadBlocks(farmId)
  await loadFarmData(farmId)
}


// 处理城市切换事件
const handleCityChangeEvent = async (cityData) => {
  const { city, location } = cityData

  // 更新地图中心点
  mapCenter.value = location
  mapZoom.value = 13

  // 直接调用天气组件的方法更新天气
  if (weatherRef.value && weatherRef.value.updateCity) {
    weatherRef.value.updateCity(city)
  }
}

// 更新设备实际状态
const updateDeviceStatuses = async (devices) => {
  try {
    // 从设备管理API获取最新的设备信息（包含运行时信息）
    const deviceResponse = await call_remote('/device_management/list_device', {
      pageNo: 0
    })

    if (deviceResponse && deviceResponse.devices) {
      // 更新设备状态和运行时信息
      for (const device of devices) {
        const latestDeviceInfo = deviceResponse.devices.find(d => d.device_name === device.deviceName)
        if (latestDeviceInfo) {
          // 更新运行时信息
          if (latestDeviceInfo.runtime_info) {
            device.runtime_info = latestDeviceInfo.runtime_info
          }

          // 根据运行时信息或设备读数更新状态
          try {
            const response = await call_remote('/device_management/readout_device', {
              device_name: device.deviceName
            })
            if (response && response.readout !== undefined) {
              if (response.readout > 0) {
                device.status = device.type === 'fertilizer' ? 'active' : 'open'
              } else {
                device.status = device.type === 'fertilizer' ? 'inactive' : 'closed'
              }
            }
          } catch (error) {
            // 保持默认状态
          }
        }
      }
    } else {
      // 如果没有获取到最新设备信息，使用原有方式
      for (const device of devices) {
        try {
          const response = await call_remote('/device_management/readout_device', {
            device_name: device.deviceName
          })
          if (response && response.readout !== undefined) {
            if (response.readout > 0) {
              device.status = device.type === 'fertilizer' ? 'active' : 'open'
            } else {
              device.status = device.type === 'fertilizer' ? 'inactive' : 'closed'
            }
          }
        } catch (error) {
          // 保持默认状态
        }
      }
    }

    // 更新基本信息统计
    updateBasicInfoStats()
  } catch (error) {
    console.error('更新设备状态失败:', error)
  }
}

// 加载真实设备数据
const loadRealDeviceData = async (farmId) => {
  try {
    // 从设备管理API获取设备列表
    const deviceResponse = await call_remote('/device_management/list_device', {
      farm_name: farmId,
      pageNo: 0
    })

    if (deviceResponse && deviceResponse.devices) {

      // 转换设备数据为地图标记格式
      const devices = deviceResponse.devices.map((device, index) => {
        // 根据设备类型确定标记类型
        let deviceType = 'valve' // 默认类型
        if (device.driver_name && device.driver_name.includes('流量计')) {
          deviceType = 'flowmeter'
        } else if (device.driver_name && device.driver_name.includes('施肥机')) {
          deviceType = 'fertilizer'
        }
        // 电磁阀类型保持默认值 'valve'

        // 如果有经纬度坐标，不设置x,y（让地图组件直接使用经纬度）；否则使用默认坐标
        let x, y
        if (device.longitude && device.latitude) {
          // 有真实坐标时，不设置x,y，让地图组件直接使用经纬度
          x = null
          y = null
        } else {
          // 使用默认坐标（如果没有设置经纬度）
          x = 20 + (index % 5) * 20
          y = 30 + Math.floor(index / 5) * 20
        }

        return {
          id: device.id || index + 1,
          x: x,
          y: y,
          type: deviceType,
          label: device.device_name || `设备${index + 1}`,
          deviceName: device.device_name,
          deviceType: device.driver_name || '未知设备',
          status: 'closed', // 默认状态设为关闭，需要从实际设备状态获取
          capability: device.capability ? (typeof device.capability === 'string' ? JSON.parse(device.capability) : device.capability) : ['readout'],
          farmName: device.farm_name || farmId,
          blockName: device.block_name || '未知区块',
          showPopover: false,
          // 保存原始设备数据
          originalDevice: device,
          // 保存真实坐标
          longitude: device.longitude,
          latitude: device.latitude,
          // 保存在线状态
          is_online: device.is_online,
          // 保存运行时信息
          runtime_info: device.runtime_info
        }
      })

      mapMarkers.value = devices

      // 获取设备实际状态并更新统计
      await updateDeviceStatuses(devices)

      // 更新基本信息中的设备数量 - 根据在线状态计算
      basicInfo.totalDevices = devices.length
      basicInfo.onlineDevices = devices.filter(d => d.is_online === true).length
      // 离线设备：明确为 false 或 undefined/null 的都算离线
      basicInfo.offlineDevices = devices.filter(d => d.is_online !== true).length

      // 更新设备列表
      updateDeviceList()


    } else {
      // 如果没有获取到设备数据，使用空数组
      mapMarkers.value = []
      deviceList.value = []
    }

  } catch (error) {
    console.error('加载真实设备数据失败:', error)
    // 出错时使用空数组
    mapMarkers.value = []
    deviceList.value = []
  }
}




// 显示设备详情对话框（用于表格中的查看按钮）
const onDeviceClick = (device) => {
  if (!device) return

  selectedDeviceDetail.value = device
  deviceDetailDialogVisible.value = true
  
  // 启动自动刷新定时器
  startRuntimeInfoAutoRefresh()
}

// 处理设备操作
const handleDeviceAction = async (action, deviceName) => {
  await handleDeviceActionUtil(action, deviceName, refreshRuntimeInfo)
}

// 刷新运行时信息
const refreshRuntimeInfo = async () => {
  if (!selectedDeviceDetail.value) return
  await refreshRuntimeInfoUtil(selectedDeviceDetail.value, refreshingRuntimeInfo)
}

// 打开添加轮灌阀门对话框
const openAddWaterGroupValveDialog = () => {
  if (!selectedFarm.value) {
    ElMessage.warning('请先选择农场')
    return
  }
  addWaterGroupValveForm.value.farm_name = selectedFarm.value
  // 重置阀门配置表单
  valveConfigForm.value = {
    token: '',
    device_sn: '',
    is_left: false,
    poll_interval: 5000
  }
  if (blocks.value.length === 0) {
    loadBlocks(selectedFarm.value)
  }
  addWaterGroupValveDialogVisible.value = true
}

// 提交添加轮灌阀门
const submitAddWaterGroupValve = () => {
  if (!addWaterGroupValveFormRef.value) return
  addWaterGroupValveFormRef.value.validate(async (valid) => {
    if (!valid) return
    if (!valveConfigForm.value.token || !valveConfigForm.value.device_sn) {
      ElMessage.warning('请填写完整的阀门配置（token 和 device_sn 必填）')
      return
    }
    try {
      addWaterGroupValveForm.value.valve_config_key = JSON.stringify({
        token: valveConfigForm.value.token,
        device_sn: valveConfigForm.value.device_sn,
        is_left: !!valveConfigForm.value.is_left,
        poll_interval: Number(valveConfigForm.value.poll_interval) || 5000
      })
      const payload = {
        ...addWaterGroupValveForm.value
      }
      const result = await config_lib.add_water_group_valve(payload)
      if (result && result.result) {
        // 保存配置到文件
        await call_remote('/config/save_config', {})
        ElMessage.success('轮灌组阀门添加成功')
      } else if (result === true) {
        // 保存配置到文件
        await call_remote('/config/save_config', {})
        ElMessage.success('轮灌组阀门添加成功')
      } else {
        ElMessage.error('轮灌组阀门添加失败')
      }
      addWaterGroupValveDialogVisible.value = false
      await refreshDeviceList()
    } catch (error) {
      console.error('添加轮灌组阀门失败:', error)
      const msg = error?.err_msg || error?.message || '轮灌组阀门添加失败'
      ElMessage.error(msg)
    }
  })
}

// 获取设备按钮分组（使用共享函数）
const getDeviceButtonGroupsWrapperLocal = (device) => {
  return getDeviceButtonGroupsWrapper(device, getCurrentInstance)
}

// 启动自动刷新定时器
const startRuntimeInfoAutoRefresh = () => {
  runtimeInfoAutoRefresh.start()
}

// 停止自动刷新定时器
const stopRuntimeInfoAutoRefresh = () => {
  runtimeInfoAutoRefresh.stop()
}

// 关闭设备详情对话框
const closeDeviceDetailDialog = () => {
  // 停止自动刷新定时器
  stopRuntimeInfoAutoRefresh()
  deviceDetailDialogVisible.value = false
}

const onDeviceToggle = (device) => {
  // 更新本地设备状态
  const marker = mapMarkers.value.find(m => m.id === device.id)
  if (marker) {
    marker.status = device.status
  }

  // 更新基本信息统计
  updateBasicInfoStats()
}

// 更新基本信息统计
const updateBasicInfoStats = () => {
  if (mapMarkers.value && mapMarkers.value.length > 0) {
    basicInfo.totalDevices = mapMarkers.value.length

    // 根据设备的在线状态计算在线和离线设备数量
    const onlineDevices = mapMarkers.value.filter(d => d.is_online === true).length
    // 离线设备：明确为 false 或 undefined/null 的都算离线
    const offlineDevices = mapMarkers.value.filter(d => d.is_online !== true).length

    basicInfo.onlineDevices = onlineDevices
    basicInfo.offlineDevices = offlineDevices

  }
}




// 初始化地图配置
const initMapConfig = async () => {
  try {
    const config = await fetchMapConfig()
    mapCenter.value = config.center
    mapZoom.value = config.zoom

    // 加载保存的城市
    const savedCity = localStorage.getItem('weather_selected_city')
    if (savedCity) {
      cityChangeData.value.city = savedCity
    }
  } catch (error) {
    console.error('加载地图配置失败，使用默认值:', error)
  }
}


// Tab切换处理
// 主tab切换处理
const handleMainTabChange = (tabName) => {
  // Tab切换时刷新对应组件数据
  if (tabName === 'runtime' && policyRuntimeRef.value) {
    policyRuntimeRef.value.refresh()
  } else if (tabName === 'watering' && wateringGroupRef.value) {
    wateringGroupRef.value.refresh?.()
  } else if (tabName === 'devices') {
    // 切换到设备列表时，更新设备列表数据
    updateDeviceList()
  }
}

const handleIrrigationTabChange = (tabName) => {
  // Tab切换时刷新对应组件数据
  if (tabName === 'runtime' && policyRuntimeRef.value) {
    policyRuntimeRef.value.refresh()
  }
}

// 刷新轮灌组数据
const refreshWateringGroup = async () => {
  if (wateringGroupRef.value && wateringGroupRef.value.refresh) {
    wateringGroupRef.value.refresh()
  }
}

const refreshIrrigationData = async () => {
  if (policyRuntimeRef.value) {
    policyRuntimeRef.value.refresh()
  }
}

// 更新设备列表
const updateDeviceList = () => {
  // 从 mapMarkers 获取设备数据并转换为列表格式
  // 确保只显示当前选中农场的设备（双重保险）
  const currentFarmDevices = mapMarkers.value.filter(marker =>
    !selectedFarm.value || marker.farmName === selectedFarm.value
  )

  deviceList.value = currentFarmDevices.map(marker => ({
    deviceName: marker.deviceName,
    deviceType: marker.deviceType,
    blockName: marker.blockName,
    status: marker.status,
    is_online: marker.is_online,
    longitude: marker.longitude,
    latitude: marker.latitude,
    capability: marker.capability,
    farmName: marker.farmName // 保留农场名称用于过滤
  }))
}

// 刷新设备列表
const refreshDeviceList = async () => {
  if (selectedFarm.value) {
    deviceListLoading.value = true
    try {
      await loadRealDeviceData(selectedFarm.value)
      updateDeviceList()
    } catch (error) {
      console.error('刷新设备列表失败:', error)
    } finally {
      deviceListLoading.value = false
    }
  }
}


// 组件挂载时加载数据
onMounted(async () => {
  await initMapConfig()

  // 添加全局事件监听器
  window.addEventListener('farmChanged', (event) => {
    handleFarmChange(event.detail.farmId)
  })


  // 如果是监控中心页面，立即尝试加载数据
  if (route.name === '监控中心') {
    // 先尝试从 localStorage 获取上次选中的农场
    const savedFarm = localStorage.getItem('selectedFarm')
    if (savedFarm) {
      selectedFarm.value = savedFarm
      await loadBlocks(savedFarm)
      await loadFarmData(savedFarm)
    } else {
      // 如果没有保存的农场，等待 MainLayout 触发事件
    }
  }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('farmChanged', handleFarmChange)
  // 停止自动刷新定时器
  stopRuntimeInfoAutoRefresh()
})

// 监听对话框关闭，停止定时器
watch(() => deviceDetailDialogVisible.value, (isVisible) => {
  if (!isVisible) {
    stopRuntimeInfoAutoRefresh()
  }
})


// 监听路由变化，当切换到监控中心时重新加载数据
watch(() => route.name, async (newRouteName, oldRouteName) => {
  if (newRouteName === '监控中心' && oldRouteName !== '监控中心') {

    // 获取当前选中的农场
    const currentFarm = localStorage.getItem('selectedFarm')
    if (currentFarm) {
      selectedFarm.value = currentFarm
      await loadBlocks(currentFarm)
      await loadFarmData(currentFarm)
    } else {
      // 如果没有保存的农场，等待 MainLayout 触发事件
    }
  }
})

// 监听城市变化数据
watch(cityChangeData, (newCityData, oldCityData) => {
  if (newCityData && newCityData.city && newCityData.location &&
    (!oldCityData || newCityData.timestamp !== oldCityData.timestamp)) {
    handleCityChangeEvent(newCityData)
  }
}, { deep: true })

</script>

<style scoped>
.default-page {
  height: 100%;
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
}

/* 隐藏滚动条但保留滚动功能 - 仅监控中心页面 */
.monitoring-center ::-webkit-scrollbar {
  display: none;
}

.monitoring-center {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  color: #2d3748;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
}

.page-content {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 监控中心响应式样式 */
.monitoring-center {
  height: 100%;
  background: #f5f5f5;
  color: #1a202c;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  padding: 0;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* 确保所有子元素不会超出容器 */
.monitoring-center * {
  max-width: 100%;
  box-sizing: border-box;
}

/* 防止横向滚动 */
body,
html {
  overflow-x: hidden;
}




/* 内容包装器 */
.content-wrapper {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* 响应式网格布局 */

.main-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  padding: 16px;
}

/* 超大屏幕布局 (≥1600px) */
@media (min-width: 1600px) {
  .main-content {
    grid-template-columns: 350px 1fr 350px;
    grid-template-areas:
      "left center right";
    gap: 20px;
  }

  .left-panel {
    grid-area: left;
    min-width: 0;
  }

  .center-panel {
    grid-area: center;
    min-width: 0;
  }

  .right-panel {
    grid-area: right;
    min-width: 0;
  }
}

/* 大屏幕布局 (1200px-1599px) */
@media (min-width: 1200px) and (max-width: 1599px) {
  .main-content {
    grid-template-columns: 300px 1fr 300px;
    grid-template-areas:
      "left center right";
    gap: 16px;
  }

  .left-panel {
    grid-area: left;
    min-width: 0;
  }

  .center-panel {
    grid-area: center;
    min-width: 0;
  }

  .right-panel {
    grid-area: right;
    min-width: 0;
  }
}

/* 中等屏幕布局 (768px-1199px) */
@media (min-width: 768px) and (max-width: 1199px) {
  .main-content {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "left right"
      "center center";
    gap: 16px;
  }

  .left-panel {
    grid-area: left;
    min-width: 0;
  }

  .center-panel {
    grid-area: center;
    min-width: 0;
  }

  .right-panel {
    grid-area: right;
    min-width: 0;
  }
}


/* 卡片通用样式 */

.card-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 24px;
  right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 响应式卡片标题 */
@media (min-width: 1600px) {
  .card-title {
    font-size: 22px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .card-title {
    font-size: 20px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .card-title {
    font-size: 18px;
  }
}

@media (max-width: 767px) {
  .card-title {
    font-size: 16px;
  }
}

.farm-select {
  width: 140px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 8px;
  color: #333;
  padding: 8px 12px;
  font-size: 14px;
}

/* 卡片样式优化 */
.info-card,
.weather-card,
.realtime-card {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.map-irrigation-card {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  /* 整个卡片的高度自适应 */
  height: auto;
  min-height: 550px;
}

.info-card::before,
.weather-card::before,
.map-irrigation-card::before,
.realtime-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  opacity: 0.8;
}

.info-card:hover,
.weather-card:hover,
.map-irrigation-card:hover,
.realtime-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.08),
    0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: rgba(102, 126, 234, 0.2);
}

/* 面板样式 */
.left-panel,
.right-panel,
.center-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}

/* 确保面板内容能够自适应 */
.left-panel>*,
.right-panel>*,
.center-panel>* {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.panel-title {
  font-size: 18px;
  color: #409eff;
  margin: 0 0 20px 0;
  border-bottom: 2px solid rgba(64, 158, 255, 0.3);
  padding-bottom: 10px;
}

.info-section {
  margin-bottom: 30px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

/* 响应式信息网格 */
@media (min-width: 1600px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;
  }
}

@media (max-width: 767px) {
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 8px;
  }
}

.info-item {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  text-align: center;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.info-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.info-item:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(102, 126, 234, 0.2);
}

.info-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.info-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 响应式信息值字体 */
@media (min-width: 1600px) {
  .info-value {
    font-size: 20px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .info-value {
    font-size: 18px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .info-value {
    font-size: 16px;
  }
}

@media (max-width: 767px) {
  .info-value {
    font-size: 14px;
  }
}

.info-value.online {
  color: #67c23a;
}

.info-value.offline {
  color: #f56c6c;
}

.weather-section {
  margin-top: 20px;
}


.weather-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 中央地图区域 */
.center-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: fit-content;
}

.map-header {
  margin-bottom: 15px;
}


.map-selector {
  position: absolute;
  top: 80px;
  left: 20px;
  z-index: 10;
}


.map-container {
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 确保 el-card 的 body 填满剩余空间 */
.map-irrigation-card :deep(.el-card__body) {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 地图容器高度 */
.map-container {
  height: 100%;
  min-height: 300px;
}

/* 响应式地图容器高度 */
@media (min-width: 1600px) {
  .map-container {
    height: 100%;
    min-height: 300px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .map-container {
    height: 300px;
    min-height: 280px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .map-container {
    height: 280px;
    min-height: 260px;
  }
}

@media (max-width: 767px) {
  .map-container {
    height: 240px;
    min-height: 220px;
  }
}

/* 旧的地图标记样式已移除，现在使用真实地图组件 */

/* 设备控制弹框样式 - 优化性能 */
.device-control-modal .el-message-box {
  width: 650px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: none;
  overflow: hidden;
  background: #ffffff;
  position: relative;
}

.device-control-modal .el-message-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(102, 126, 234, 0.02);
  pointer-events: none;
}

.device-control-modal .el-message-box__header {
  background: #667eea;
  color: white;
  padding: 24px 32px;
  border-bottom: none;
  position: relative;
  overflow: hidden;
}



.device-control-modal .el-message-box__title {
  color: white;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
  position: relative;
  z-index: 1;
}

.device-control-modal .el-message-box__close {
  color: white;
  font-size: 24px;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-control-modal .el-message-box__close:hover {
  transform: scale(1.1);
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
}

.device-control-modal .el-message-box__content {
  padding: 0;
  background: transparent;
}

.device-control-content,
.device-info-content {
  padding: 40px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.device-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  position: relative;
  overflow: hidden;
}

.device-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #667eea;
  border-radius: 1px;
}

.device-icon {
  width: 60px;
  height: 60px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 12px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.2s ease;
}


.device-icon img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  object-position: center;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.device-info {
  flex: 1;
  position: relative;
  z-index: 1;
}

.device-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
}

.device-type {
  display: inline-block;
  padding: 6px 16px;
  background: #667eea;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}


.device-status {
  margin-bottom: 32px;
}

.device-actions {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
}

.device-actions::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: #667eea;
  border-radius: 1px;
}

.device-type-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 12px;
  font-weight: 700;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.device-location {
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
  font-weight: 500;
}

.device-status-card {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 16px;
  padding: 24px;
  margin: 24px 0;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.status-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-weight: 700;
  font-size: 14px;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.status-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}

.status-value.realtime {
  color: #409eff;
  font-weight: 700;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 24px;
}

.action-btn {
  min-width: 140px;
  height: 48px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

/* Popover 样式 */
.device-popover-content {
  padding: 16px;
  min-width: 350px;
}

.device-popover-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.device-popover-icon {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.device-popover-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.device-popover-info {
  flex: 1;
}

.device-popover-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.device-popover-details {
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

.device-popover-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.map-marker.valve:hover .marker-icon {
  box-shadow: 0 0 15px rgba(64, 158, 255, 0.8);
}

.map-marker.flowmeter:hover .marker-icon {
  box-shadow: 0 0 15px rgba(230, 162, 60, 0.8);
}

.map-marker.fertilizer:hover .marker-icon {
  box-shadow: 0 0 15px rgba(156, 39, 176, 0.8);
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}


.farm-selector {
  margin-bottom: 20px;
}

.realtime-data {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

/* 响应式实时数据布局 */
@media (min-width: 1600px) {
  .realtime-data {
    gap: 12px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .realtime-data {
    gap: 10px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .realtime-data {
    gap: 8px;
  }
}

@media (max-width: 767px) {
  .realtime-data {
    gap: 6px;
  }
}

.data-item {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 8px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.data-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
}

.data-item:hover {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(102, 126, 234, 0.2);
}

.data-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.data-value {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

/* 响应式数据值字体 */
@media (min-width: 1600px) {
  .data-value {
    font-size: 20px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .data-value {
    font-size: 18px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .data-value {
    font-size: 16px;
  }
}

@media (max-width: 767px) {
  .data-value {
    font-size: 14px;
  }
}

/* 底部表格区域 */
.bottom-section {
  margin-top: 20px;
  width: 100%;
}

.irrigation-section {
  margin-top: 20px;
}

/* Element Plus表格样式 */
.irrigation-table {
  width: 100%;
  font-size: 13px;
  border-radius: 6px;
  overflow: hidden;
  table-layout: fixed;
  min-width: 0;
}

/* 响应式表格字体 */
@media (min-width: 1600px) {
  .irrigation-table {
    font-size: 14px;
  }
}

@media (min-width: 1200px) and (max-width: 1599px) {
  .irrigation-table {
    font-size: 13px;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .irrigation-table {
    font-size: 12px;
  }
}

@media (max-width: 767px) {
  .irrigation-table {
    font-size: 11px;
  }
}

.irrigation-table .el-table__cell {
  padding: 12px 8px !important;
  font-size: 13px;
}

.irrigation-table .el-table__header-cell {
  padding: 12px 8px !important;
  font-size: 13px;
  font-weight: 600;
  background: #f8fafc !important;
  color: #4a5568 !important;
}

.irrigation-table .el-table__body tr:hover {
  background-color: #f7fafc !important;
}

/* 禁用列宽调整 */
.irrigation-table .el-table__header-wrapper {
  user-select: none;
  pointer-events: none;
}

.irrigation-table .el-table__header {
  pointer-events: none;
}

.irrigation-table .el-table__header th {
  cursor: default !important;
  resize: none !important;
  pointer-events: none !important;
  user-select: none !important;
}

.irrigation-table .el-table__header th:hover {
  cursor: default !important;
  pointer-events: none !important;
}

.irrigation-table .el-table__header th::after {
  display: none !important;
  pointer-events: none !important;
}

.irrigation-table .el-table__header th .cell {
  pointer-events: none !important;
  user-select: none !important;
}

.irrigation-table .el-table__header th .el-table__column-resize-proxy {
  display: none !important;
  pointer-events: none !important;
}

.irrigation-table .el-table__header th .el-table__column-resize-trigger {
  display: none !important;
  pointer-events: none !important;
}

.irrigation-table .el-table__header th .el-table__column-resize-handle {
  display: none !important;
  pointer-events: none !important;
}

.irrigation-table .el-table__header th .el-table__column-resize-handle::after {
  display: none !important;
  pointer-events: none !important;
}

/* 禁用所有可能的调整元素 */
.irrigation-table .el-table__header th * {
  pointer-events: none !important;
  user-select: none !important;
  resize: none !important;
}

/* 确保表格布局固定 */
.irrigation-table .el-table__body-wrapper {
  pointer-events: auto;
}

.irrigation-table .el-table__body tr {
  pointer-events: auto;
}

.irrigation-table .el-table__body td {
  pointer-events: auto;
}

/* 表格行样式 */
.el-table .warning-row {
  background: oldlace;
}

.el-table .success-row {
  background: #f0f9eb;
}

/* 表格说明文字 */






/* 移动端优化 */
@media (max-width: 767px) {
  .monitoring-center {
    padding: 0;
  }

  .main-content {
    padding: 12px;
    gap: 12px;
    display: flex;
    flex-direction: column;
  }

  /* 确保所有面板都显示 */
  .left-panel,
  .center-panel,
  .right-panel {
    width: 100%;
    max-width: 100%;
    order: unset;
  }

  /* 调整显示顺序 */
  .left-panel {
    order: 1;
  }

  .center-panel {
    order: 2;
  }

  .right-panel {
    order: 3;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .info-item {
    padding: 10px 12px;
  }

  .card-header {
    padding: 8px 12px;
  }

  .card-title {
    font-size: 16px;
  }

  .realtime-data {
    gap: 6px;
  }

  .data-item {
    padding: 10px 12px;
  }

  .map-container {
    height: 300px;
  }

  .el-table {
    font-size: 12px;
  }

  .el-table .el-table__cell {
    padding: 6px 4px;
  }
}

/* 平板端优化 */
@media (min-width: 768px) and (max-width: 1023px) {
  .monitoring-center {
    padding: 0;
  }

  .main-content {
    padding: 14px;
    gap: 14px;
  }

  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;
  }

  .info-item {
    padding: 10px 12px;
  }

  .data-item {
    padding: 10px 12px;
  }

  .map-container {
    height: 260px;
  }
}


/* 超小屏幕优化 */
@media (max-width: 480px) {
  .monitoring-center {
    padding: 0;
  }

  .main-content {
    padding: 8px;
    gap: 8px;
    display: flex;
    flex-direction: column;
  }

  .farm-selector-header {
    padding: 8px 12px;
  }

  /* 确保所有面板都显示 */
  .left-panel,
  .center-panel,
  .right-panel {
    width: 100%;
    max-width: 100%;
    order: unset;
  }

  /* 调整显示顺序 */
  .left-panel {
    order: 1;
  }

  .center-panel {
    order: 2;
  }

  .right-panel {
    order: 3;
  }

  .card-header {
    padding: 8px 12px;
  }

  .info-item,
  .data-item {
    padding: 8px 10px;
  }

  .map-container {
    height: 220px;
  }

  .el-table {
    font-size: 11px;
  }

  .el-table .el-table__cell {
    padding: 4px 2px;
  }
}

/* 横屏优化 */
@media (orientation: landscape) and (max-height: 600px) {
  .monitoring-center {
    padding: 0;
  }

  .main-content {
    padding: 12px;
  }

  .map-container {
    height: 180px;
  }
}

/* 表格和内容防止溢出 */
.el-table {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

/* Tab样式 */
/* 主tabs样式 */
.main-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-tabs :deep(.el-tabs__header) {
  margin: 0 0 0 0;
  flex-shrink: 0;
  height: 40px;
}

.main-tabs :deep(.el-tabs__nav-wrap) {
  height: 40px;
}

.main-tabs :deep(.el-tabs__nav) {
  height: 40px;
}

.main-tabs :deep(.el-tabs__item) {
  height: 40px;
  line-height: 40px;
  padding: 0 20px;
  font-size: 14px;
}

.main-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.main-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.irrigation-tabs {
  margin-top: 0;
}

.tab-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.tab-content::-webkit-scrollbar {
  display: none;
}

.tab-content-with-actions {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-actions {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.tab-actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-actions-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.farm-name-display {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #409eff;
  font-size: 14px;
  font-weight: 500;
}

.farm-name-display .el-icon {
  font-size: 16px;
}

.tab-content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.tab-content-scroll::-webkit-scrollbar {
  display: none;
}


/* 急停对话框样式 */
.emergency-stop-content {
  padding: 20px;
}

.emergency-warning {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #fff5f5, #ffe6e6);
  border-radius: 8px;
  border-left: 4px solid #f56c6c;
  font-size: 16px;
  font-weight: 600;
  color: #d32f2f;
}

.block-selection {
  margin-bottom: 24px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.block-checkbox {
  display: block;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s ease;
}

.block-checkbox:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.block-checkbox:last-child {
  margin-bottom: 0;
}

.emergency-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

/* 响应式急停对话框 */
@media (max-width: 767px) {
  .emergency-stop-content {
    padding: 16px;
  }

  .emergency-warning {
    font-size: 14px;
    padding: 12px;
  }

  .block-selection {
    max-height: 200px;
    padding: 12px;
  }

  .block-checkbox {
    padding: 6px 10px;
    font-size: 14px;
  }

  .emergency-actions {
    flex-direction: column;
    gap: 8px;
  }
}

/* 设备详情对话框样式 */
.device-detail-content {
  padding: 10px 0;
}

.device-details-section {
  margin-bottom: 24px;
}

.device-details-section .section-title {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 运行时信息样式 */
.runtime-info-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.runtime-info-section .section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.runtime-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.runtime-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(64, 158, 255, 0.03) 100%);
  border-radius: 8px;
  border-left: 4px solid #409eff;
  transition: all 0.3s ease;
}

.runtime-info-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.info-label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-value {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

/* 在线状态特殊样式 */
.online-status-item {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.08) 0%, rgba(103, 194, 58, 0.03) 100%) !important;
  border-left: 4px solid #67c23a !important;
}

.online-status-item .status-icon {
  font-size: 16px;
}

.online-status-item .status-icon.online {
  color: #67c23a;
}

.online-status-item .status-icon.offline {
  color: #f56c6c;
}

.online-status-item .info-value.online {
  background: rgba(103, 194, 58, 0.1) !important;
  border-color: #67c23a !important;
  color: #67c23a !important;
}

.online-status-item .info-value.offline {
  background: rgba(245, 108, 108, 0.1) !important;
  border-color: #f56c6c !important;
  color: #f56c6c !important;
}

/* 运行时信息加载状态 */
.runtime-info-section.loading .runtime-info-item {
  opacity: 0.6;
  pointer-events: none;
}

/* 设备操作按钮样式 */
.device-actions {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.device-controls-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.device-control-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.full-width-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.full-width-buttons-container .el-button,
.device-control-row .el-button {
  width: 100%;
}

.mr-1 {
  margin-right: 4px;
}

/* 添加轮灌阀门对话框样式 */
.add-wgv-dialog :deep(.el-dialog__body) {
  padding: 16px 24px 24px;
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  max-height: none;
  overflow-y: visible;
}

.add-wgv-dialog :deep(.el-form-item) {
  margin-bottom: 16px;
}

.valve-config-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
