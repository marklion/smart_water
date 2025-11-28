<template>
    <div class="interactive-map-container">
        
        <div id="amap-container" class="amap-container"></div>

        
        <div class="unified-control-panel">
            
            <div class="emergency-section">
                <div class="section-header">
                    <el-icon class="section-icon">
                        <Warning />
                    </el-icon>
                    <span class="section-title">紧急控制</span>
                </div>
                <el-button type="danger" @click="showEmergencyStopDialog" class="emergency-stop-btn"
                    :loading="emergencyStopLoading">
                    <el-icon>
                        <Warning />
                    </el-icon>
                    设备紧急停止
                </el-button>
            </div>

            
            <div class="control-divider"></div>

            
            <div class="policy-section">
                <div class="section-header">
                    <el-icon class="section-icon">
                        <Monitor />
                    </el-icon>
                    <span class="section-title">策略控制</span>
                </div>

                <div class="policy-controls">
                    <div class="period-input-wrapper">
                        <span class="input-label">扫描周期</span>
                        <el-input-number v-model="scanPeriod" :min="100" :max="10000" :step="100" size="small"
                            class="period-input" />
                        <span class="input-unit">毫秒</span>
                    </div>

                    <div class="control-buttons">
                        <el-button type="primary" size="small" @click="startScan" :loading="scanLoading"
                            :disabled="isScanning" :icon="VideoPlay" round>
                            运行策略
                        </el-button>
                        <el-button type="danger" size="small" @click="stopScan" :loading="scanLoading"
                            :disabled="!isScanning" :icon="VideoPause" round>
                            停止运行
                        </el-button>
                        <el-button type="success" size="small" @click="showPolicyConfigWizard" :icon="Setting" round>
                            策略程序设定
                        </el-button>
                    </div>

                    <div class="status-indicator">
                        <div v-if="isScanning" class="status-running">
                            <span class="status-dot running"></span>
                            <span class="status-text">运行中</span>
                        </div>
                        <div v-else class="status-stopped">
                            <span class="status-dot stopped"></span>
                            <span class="status-text">已停止</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        
        <div class="map-controls">
            <el-dropdown trigger="click" @command="handleMapLayerCommand">
                <el-tag type="success" size="small" class="map-type-tag" title="点击选择地图图层类型">
                    <el-icon>
                        <Location />
                    </el-icon>
                    {{ currentLayerType }}
                    <el-icon>
                        <ArrowDown />
                    </el-icon>
                </el-tag>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="satellite">
                            <el-icon>
                                <Location />
                            </el-icon>
                            卫星地图（定期更新）
                        </el-dropdown-item>
                        <el-dropdown-item command="traffic">
                            <el-icon>
                                <Grid />
                            </el-icon>
                            实时交通地图
                        </el-dropdown-item>
                        <el-dropdown-item command="hybrid">
                            <el-icon>
                                <Grid />
                            </el-icon>
                            混合图层（卫星+交通）
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>

            <el-button-group class="control-group">
                <el-button size="small" @click="zoomIn">
                    <el-icon>
                        <ZoomIn />
                    </el-icon>
                </el-button>
                <el-button size="small" @click="zoomOut">
                    <el-icon>
                        <ZoomOut />
                    </el-icon>
                </el-button>
                <el-button size="small" @click="resetView">
                    <el-icon>
                        <Refresh />
                    </el-icon>
                </el-button>
            </el-button-group>
        </div>

        
        <div v-if="selectedDevice" class="device-info-panel">
            <div class="panel-header">
                <h3>{{ selectedDevice.deviceName }}</h3>
                <el-button size="small" @click="closeDevicePanel">
                    <el-icon>
                        <Close />
                    </el-icon>
                </el-button>
            </div>
            <div class="panel-content">
                <div class="device-details">
                    <div class="detail-item">
                        <span class="label">设备类型：</span>
                        <span class="value">{{ selectedDevice.deviceType }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">所属农场：</span>
                        <span class="value">{{ selectedDevice.farmName }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">设备区块：</span>
                        <span class="value">{{ selectedDevice.blockName }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">坐标位置：</span>
                        <span class="value">
                            <span v-if="selectedDevice.longitude && selectedDevice.latitude">
                                经度: {{ selectedDevice.longitude.toFixed(6) }}, 纬度: {{ selectedDevice.latitude.toFixed(6)
                                }}
                            </span>
                            <span v-else>
                                X: {{ selectedDevice.x }}, Y: {{ selectedDevice.y }}
                            </span>
                        </span>
                    </div>
                </div>

                
                <div v-if="(selectedDevice.runtime_info && selectedDevice.runtime_info.length > 0) || selectedDevice.is_online !== undefined"
                    class="runtime-info-section" :class="{ loading: refreshingRuntimeInfo }">
                    <div class="section-title">
                        <el-icon>
                            <Monitor />
                        </el-icon>
                        <span>运行时信息</span>
                        <el-button size="small" type="primary" :icon="Refresh" @click="refreshRuntimeInfo"
                            :loading="refreshingRuntimeInfo" circle />
                    </div>
                    <div class="runtime-info-list">
                        
                        <div v-if="selectedDevice.is_online !== undefined" class="runtime-info-item online-status-item">
                            <div class="info-label">
                                <el-icon class="status-icon"
                                    :class="{ 'online': selectedDevice.is_online, 'offline': !selectedDevice.is_online }">
                                    <CircleCheck v-if="selectedDevice.is_online" />
                                    <CircleClose v-else />
                                </el-icon>
                                设备在线状态：
                            </div>
                            <div class="info-value"
                                :class="{ 'online': selectedDevice.is_online, 'offline': !selectedDevice.is_online }">
                                {{ selectedDevice.is_online ? '在线' : '离线' }}
                            </div>
                        </div>
                        
                        <div v-for="(info, index) in selectedDevice.runtime_info" :key="index"
                            class="runtime-info-item">
                            <div class="info-label">{{ info.title }}：</div>
                            <div class="info-value">{{ info.text }}</div>
                        </div>
                    </div>
                </div>

                <div class="device-actions" v-if="hasAnyDeviceCapability(selectedDevice)">
                    <div class="device-controls-container">
                        
                        <div v-for="buttonGroup in getDeviceButtonGroupsWrapperLocal(selectedDevice)"
                            :key="buttonGroup.key" :class="buttonGroup.containerClass">
                            <el-button v-for="buttonConfig in buttonGroup.buttons" :key="buttonConfig.key"
                                :type="buttonConfig.buttonType" :size="buttonConfig.buttonSize"
                                :class="buttonConfig.buttonClass"
                                @click="handleDeviceAction(buttonConfig.action, selectedDevice.deviceName || selectedDevice.device_name)">
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
        </div>

        
        <div v-if="loading" class="loading-overlay">
            <div class="loading-spinner"></div>
            <p>地图加载中...</p>
        </div>

        
        <el-dialog v-model="emergencyStopDialogVisible" title="紧急停止" width="600px" :close-on-click-modal="false"
            :close-on-press-escape="false">
            <div class="emergency-stop-content">
                <div class="emergency-warning">
                    <el-icon size="24" color="#f56c6c">
                        <Warning />
                    </el-icon>
                    <span>请选择需要执行急停的地块：</span>
                </div>

                <el-checkbox-group v-model="selectedBlocks" class="block-selection">
                    <el-checkbox v-for="block in availableBlocks" :key="block.id" :label="block.id"
                        class="block-checkbox">
                        {{ block.name }}
                    </el-checkbox>
                </el-checkbox-group>

                <div class="emergency-actions">
                    <el-button @click="cancelEmergencyStop">取消</el-button>
                    <el-button type="danger" @click="executeEmergencyStop" :loading="emergencyStopLoading">
                        执行急停
                    </el-button>
                </div>
            </div>
        </el-dialog>

        
        <el-dialog v-model="policyConfigWizardVisible" title="策略程序设定向导" width="800px" :close-on-click-modal="false"
            :close-on-press-escape="false" :modal="true" :append-to-body="true" :lock-scroll="true"
            class="policy-config-dialog">
            <div class="policy-config-wizard">
                
                <el-steps :active="wizardStep - 1" finish-status="success" align-center>
                    <el-step title="创建轮灌组" description="设置轮灌组名称和面积" />
                    <el-step title="分配设备" description="为轮灌组分配阀门设备" />
                    <el-step title="施肥配置" description="设置施肥方式和参数" />
                </el-steps>

                
                <div v-if="wizardStep === 1" class="wizard-step-content">
                    <div class="step-header">
                        <h3>步骤1：创建轮灌组</h3>
                        <p>请创建轮灌组并设置每个组的面积</p>
                    </div>

                    <div class="watering-groups-config">
                        <div class="groups-header">
                            <span>轮灌组列表</span>
                            <div class="header-buttons">
                                <el-button type="info" size="small" @click="loadExistingGroups" :icon="Refresh">
                                    加载已配置
                                </el-button>
                                <el-button type="primary" size="small" @click="addWateringGroup" :icon="Plus">
                                    添加轮灌组
                                </el-button>
                            </div>
                        </div>

                        
                        <div v-if="existingGroups.length > 0" class="existing-groups-section">
                            <div class="existing-groups-header">
                                <span>已配置的轮灌组（点击复制新增）</span>
                                <span class="groups-count">共 {{ existingGroups.length }} 个</span>
                            </div>
                            <div class="existing-groups-list">
                                <div v-for="existingGroup in existingGroups" :key="existingGroup.name"
                                    class="existing-group-item">
                                    <el-button type="primary" size="small" @click="copyExistingGroup(existingGroup)"
                                        :icon="CopyDocument" class="existing-group-btn">
                                        <span class="btn-text">复制 {{ existingGroup.name }}</span>
                                    </el-button>
                                    <el-popover :width="600" placement="right" trigger="click"
                                        popper-class="group-detail-popover">
                                        <template #reference>
                                            <el-button type="info" size="small" :icon="View" class="view-group-btn">
                                                查看
                                            </el-button>
                                        </template>
                                        <template #default>
                                            <div class="group-detail-popover-content">
                                                <div class="popover-header">
                                                    <h4 class="popover-title">{{ existingGroup.name }} - 配置详情</h4>
                                                </div>

                                                <div class="detail-section">
                                                    <h5 class="section-title">基本信息</h5>
                                                    <div class="detail-row">
                                                        <span class="detail-label">轮灌组名称：</span>
                                                        <span class="detail-value">{{ existingGroup.name }}</span>
                                                    </div>
                                                    <div class="detail-row">
                                                        <span class="detail-label">面积：</span>
                                                        <span class="detail-value">{{ existingGroup.area }} 亩</span>
                                                    </div>
                                                </div>

                                                <div class="detail-section">
                                                    <h5 class="section-title">阀门配置</h5>
                                                    <div v-if="existingGroup.valves && existingGroup.valves.length > 0"
                                                        class="valves-list">
                                                        <el-tag v-for="(valve, index) in existingGroup.valves"
                                                            :key="index" type="primary" class="valve-tag">
                                                            {{ valve }}
                                                        </el-tag>
                                                    </div>
                                                    <div v-else class="no-data">未配置阀门</div>
                                                    <div class="detail-row">
                                                        <span class="detail-label">阀门数量：</span>
                                                        <span class="detail-value">{{ existingGroup.valves?.length || 0
                                                            }} 个</span>
                                                    </div>
                                                </div>

                                                <div class="detail-section">
                                                    <h5 class="section-title">施肥配置</h5>
                                                    <div class="detail-row">
                                                        <span class="detail-label">施肥方式：</span>
                                                        <span class="detail-value">
                                                            {{ existingGroup.fertConfig?.method === 'AreaBased' ? '亩定量'
                                                                :
                                                                existingGroup.fertConfig?.method === 'Total' ? '总定量' :
                                                            existingGroup.fertConfig?.method === 'Time' ? '定时' : '未知' }}
                                                        </span>
                                                    </div>
                                                    <div v-if="existingGroup.fertConfig?.method === 'AreaBased'"
                                                        class="detail-row">
                                                        <span class="detail-label">亩定量：</span>
                                                        <span class="detail-value">{{ existingGroup.fertConfig?.AB_fert
                                                            || 0 }} L/亩</span>
                                                    </div>
                                                    <div v-if="existingGroup.fertConfig?.method === 'Total'"
                                                        class="detail-row">
                                                        <span class="detail-label">总定量：</span>
                                                        <span class="detail-value">{{
                                                            existingGroup.fertConfig?.total_fert || 0 }} L</span>
                                                    </div>
                                                    <div v-if="existingGroup.fertConfig?.method === 'Time'"
                                                        class="detail-row">
                                                        <span class="detail-label">施肥时间：</span>
                                                        <span class="detail-value">{{
                                                            existingGroup.fertConfig?.fert_time || 0 }} 分钟</span>
                                                    </div>
                                                    <div class="detail-row">
                                                        <span class="detail-label">期望施肥速度：</span>
                                                        <span class="detail-value">{{
                                                            existingGroup.fertConfig?.fert_rate || 0 }} L/分钟</span>
                                                    </div>
                                                    <div class="detail-row">
                                                        <span class="detail-label">肥前时间：</span>
                                                        <span class="detail-value">{{
                                                            existingGroup.fertConfig?.pre_fert_time || 0 }} 分钟</span>
                                                    </div>
                                                    <div class="detail-row">
                                                        <span class="detail-label">肥后时间：</span>
                                                        <span class="detail-value">{{
                                                            existingGroup.fertConfig?.post_fert_time || 0 }} 分钟</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </el-popover>
                                </div>
                            </div>
                        </div>

                        <div v-for="(group, index) in wateringGroups" :key="index" class="group-item">
                            <div class="group-info">
                                <el-input v-model="group.name" placeholder="轮灌组名称" style="width: 200px;" />
                                <el-input-number v-model="group.area" :min="0" :precision="2" placeholder="面积"
                                    style="width: 150px; margin-left: 10px;" />
                                <span class="unit">亩</span>
                                <el-popover v-model:visible="areaParamsPopoverVisible[index]" placement="top"
                                    :width="400" trigger="hover" popper-class="area-params-popover">
                                    <template #reference>
                                        <span class="recommended-area"
                                            :class="{ 'has-recommendation': getRecommendedArea(index) > 0 }">
                                            建议{{ getRecommendedArea(index).toFixed(2) }}亩
                                        </span>
                                    </template>
                                    <div class="area-params-content">
                                        <div class="params-header">
                                            <h4>建议亩数计算参数</h4>
                                        </div>
                                        <div class="params-formula">
                                            <p>计算公式：</p>
                                            <p class="formula-text">系统流量 × 1000 ÷ (667 ÷ 铺设间距 ÷ 滴头间距 × 滴头流量) × 系数</p>
                                        </div>
                                        <div class="params-list">
                                            <div class="param-item">
                                                <span class="param-label">系统流量：</span>
                                                <el-input-number v-model="farmAreaParams.system_flow" :min="0"
                                                    :precision="2" size="small" style="width: 120px;"
                                                    @change="updateAreaParam('system_flow', $event)" />
                                            </div>
                                            <div class="param-item">
                                                <span class="param-label">铺设间距：</span>
                                                <el-input-number v-model="farmAreaParams.laying_spacing" :min="0"
                                                    :precision="2" size="small" style="width: 120px;"
                                                    @change="updateAreaParam('laying_spacing', $event)" />
                                            </div>
                                            <div class="param-item">
                                                <span class="param-label">滴头间距：</span>
                                                <el-input-number v-model="farmAreaParams.dripper_spacing" :min="0"
                                                    :precision="2" size="small" style="width: 120px;"
                                                    @change="updateAreaParam('dripper_spacing', $event)" />
                                            </div>
                                            <div class="param-item">
                                                <span class="param-label">滴头流量：</span>
                                                <el-input-number v-model="farmAreaParams.dripper_flow" :min="0"
                                                    :precision="2" size="small" style="width: 120px;"
                                                    @change="updateAreaParam('dripper_flow', $event)" />
                                            </div>
                                            <div class="param-item">
                                                <span class="param-label">系数：</span>
                                                <el-input-number v-model="farmAreaParams.coefficient" :min="0"
                                                    :precision="2" size="small" style="width: 120px;"
                                                    @change="updateAreaParam('coefficient', $event)" />
                                            </div>
                                        </div>
                                        <div class="params-result">
                                            <p>计算结果：<strong>{{ getRecommendedArea(index).toFixed(2) }}亩</strong></p>
                                        </div>
                                    </div>
                                </el-popover>
                            </div>
                            <el-button type="danger" size="small" @click="removeWateringGroup(index)" :icon="Delete">
                                删除
                            </el-button>
                        </div>
                    </div>
                </div>

                
                <div v-if="wizardStep === 2" class="wizard-step-content">
                    <div class="step-header">
                        <h3>步骤2：分配阀门设备</h3>
                        <p class="step-description">为每个轮灌组在地图上选择阀门设备，点击地图上的设备标记进行选择，选中的设备会显示为蓝色</p>
                        <div v-if="availableValveDevices.length === 0" class="no-devices-warning">
                            <el-alert title="未找到WaterGroupValve设备" type="warning"
                                description="当前农场没有找到WaterGroupValve类型的设备，请先配置相关设备" :closable="false" show-icon />
                        </div>
                    </div>

                    <div class="device-allocation">
                        
                        <div v-if="wateringGroups.length > 1" class="group-switcher">
                            <el-button :disabled="currentGroupIndex === 0" @click="switchToPreviousGroup"
                                :icon="ArrowLeft" size="small">
                                上一个
                            </el-button>
                            <span class="group-counter">
                                {{ currentGroupIndex + 1 }} / {{ wateringGroups.length }}
                            </span>
                            <el-button :disabled="currentGroupIndex === wateringGroups.length - 1"
                                @click="switchToNextGroup" :icon="ArrowRight" size="small">
                                下一个
                            </el-button>
                        </div>

                        
                        <div v-for="(group, index) in wateringGroups" :key="group.name" class="group-device-config"
                            :class="{ 'active': index === currentGroupIndex, 'hidden': index !== currentGroupIndex }">
                            <div class="group-device-header">
                                <h4>{{ group.name }}</h4>
                                <div class="header-actions">
                                    
                                    <el-tabs v-model="valveDisplayMode" class="display-mode-tabs"
                                        @tab-change="handleDisplayModeChange">
                                        <el-tab-pane label="地图显示" name="map"></el-tab-pane>
                                        <el-tab-pane label="列表显示" name="list"></el-tab-pane>
                                    </el-tabs>
                                    <el-button v-if="valveDisplayMode === 'map'" type="primary" size="small"
                                        @click="enterFullscreenMap(group.name)" :icon="FullScreen">
                                        全屏查看
                                    </el-button>
                                </div>
                            </div>

                            
                            <div v-if="valveDisplayMode === 'map'" class="valve-selection-map-container">
                                <div :id="`valve-selection-map-${group.name}`" class="valve-selection-map"
                                    :data-group-name="group.name"></div>
                                <div class="selected-valves-info">
                                    <span class="info-text">已选择 {{ selectedValveDevices[group.configKey ||
                                        group.name]?.length
                                        || 0 }} 个阀门（共 {{ availableValveDevices.length }} 个可用）</span>
                                    <el-button v-if="selectedValveDevices[group.configKey || group.name]?.length > 0"
                                        type="danger" size="small"
                                        @click="clearSelectedValves(group.configKey || group.name)" :icon="Delete">
                                        清空选择
                                    </el-button>
                                </div>
                            </div>

                            
                            <div v-if="valveDisplayMode === 'list'" class="valve-selection-list-container">
                                <div class="valve-list-header">
                                    <span class="info-text">已选择 {{ selectedValveDevices[group.configKey ||
                                        group.name]?.length
                                        || 0 }} 个阀门（共 {{ availableValveDevices.length }} 个可用）</span>
                                    <div class="list-actions">
                                        <el-button
                                            v-if="selectedValveDevices[group.configKey || group.name]?.length > 0"
                                            type="danger" size="small"
                                            @click="clearSelectedValves(group.configKey || group.name)" :icon="Delete">
                                            清空选择
                                        </el-button>
                                        <el-button
                                            v-if="selectedValveDevices[group.configKey || group.name]?.length < availableValveDevices.length"
                                            type="primary" size="small"
                                            @click="selectAllValves(group.configKey || group.name)" :icon="Check">
                                            全选
                                        </el-button>
                                    </div>
                                </div>
                                <div class="valve-list-content">
                                    <el-checkbox-group v-model="selectedValveDevices[group.configKey || group.name]"
                                        class="valve-checkbox-group">
                                        <div v-for="device in availableValveDevices" :key="device.device_name"
                                            class="valve-list-item"
                                            :class="{ 'selected': isValveSelected(device.device_name, group.name) }">
                                            <el-checkbox :label="device.device_name" class="valve-checkbox">
                                                <div class="valve-item-content">
                                                    <div class="valve-item-info">
                                                        <span class="valve-name">{{ device.device_name }}</span>
                                                        <span v-if="device.label && device.label !== device.device_name"
                                                            class="valve-label">{{ device.label }}</span>
                                                    </div>
                                                    <div class="valve-item-meta">
                                                        <el-tag v-if="device.is_online !== undefined"
                                                            :type="device.is_online ? 'success' : 'danger'"
                                                            size="small">
                                                            {{ device.is_online ? '在线' : '离线' }}
                                                        </el-tag>
                                                        <span v-if="device.longitude && device.latitude"
                                                            class="valve-coords">
                                                            经度: {{ device.longitude.toFixed(6) }}, 纬度: {{
                                                            device.latitude.toFixed(6) }}
                                                        </span>
                                                    </div>
                                                </div>
                                            </el-checkbox>
                                        </div>
                                    </el-checkbox-group>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                
                <div v-if="wizardStep === 3" class="wizard-step-content">
                    <div class="step-header">
                        <h3>步骤3：施肥配置</h3>
                        <p>为每个轮灌组设置施肥方式和参数</p>
                    </div>

                    <div class="fert-config">
                        <div v-for="group in wateringGroups.filter(g => g.isCopied !== true)" :key="group.name"
                            class="group-fert-config">
                            <h4>{{ group.name }}</h4>

                            <div class="fert-method">
                                <label>施肥方式：</label>
                                <el-radio-group v-model="fertConfigs[group.configKey || group.name].method">
                                    <el-radio value="AreaBased">亩定量</el-radio>
                                    <el-radio value="Total">总定量</el-radio>
                                    <el-radio value="Time">定时</el-radio>
                                </el-radio-group>
                            </div>

                            <div class="fert-params">
                                <div v-if="fertConfigs[group.configKey || group.name].method === 'AreaBased'"
                                    class="param-item">
                                    <label>施肥参数：</label>
                                    <el-input-number v-model="fertConfigs[group.configKey || group.name].AB_fert"
                                        :min="0" :precision="2" placeholder="施肥量" />
                                    <span class="unit">L/亩</span>
                                </div>

                                <div v-if="fertConfigs[group.configKey || group.name].method === 'Total'"
                                    class="param-item">
                                    <label>施肥参数：</label>
                                    <el-input-number v-model="fertConfigs[group.configKey || group.name].total_fert"
                                        :min="0" :precision="2" placeholder="总量" />
                                    <span class="unit">L</span>
                                </div>

                                <div v-if="fertConfigs[group.configKey || group.name].method === 'Time'"
                                    class="param-item">
                                    <label>施肥参数：</label>
                                    <el-input-number v-model="fertConfigs[group.configKey || group.name].fert_time"
                                        :min="0" :precision="1" placeholder="施肥时间" />
                                    <span class="unit">分钟</span>
                                </div>

                                <div class="param-item">
                                    <label>期望施肥速度：</label>
                                    <el-input-number v-model="fertConfigs[group.configKey || group.name].fert_rate"
                                        :min="0" :precision="1" placeholder="速度" />
                                    <span class="unit">L/分钟</span>
                                </div>
                            </div>

                            <div class="time-params">
                                <div class="param-item">
                                    <label>肥前时间：</label>
                                    <el-input-number v-model="fertConfigs[group.configKey || group.name].pre_fert_time"
                                        :min="0" :precision="1" placeholder="肥前时间" />
                                    <span class="unit">分钟</span>
                                </div>

                                <div class="param-item">
                                    <label>肥后时间：</label>
                                    <el-input-number v-model="fertConfigs[group.configKey || group.name].post_fert_time"
                                        :min="0" :precision="1" placeholder="肥后时间" />
                                    <span class="unit">分钟</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                
                <div class="wizard-actions">
                    <el-button v-if="wizardStep > 1" @click="prevStep">上一步</el-button>
                    
                    <el-button v-if="wizardStep === 2 && allGroupsAreCopied" type="success" @click="finishWizard">
                        完成配置
                    </el-button>
                    <el-button v-else-if="wizardStep === 2" type="primary" @click="nextStep">
                        下一步
                    </el-button>
                    
                    <el-button v-else-if="wizardStep === 1" type="primary" @click="nextStep">
                        下一步
                    </el-button>
                    
                    <el-button v-if="wizardStep === 3" type="success" @click="finishWizard">
                        完成配置
                    </el-button>
                    <el-button @click="policyConfigWizardVisible = false">取消</el-button>
                </div>
            </div>
        </el-dialog>

        
        <el-dialog v-model="fullscreenMapVisible" :title="`${fullscreenMapGroupName} - 全屏查看阀门`" width="95vw"
            :close-on-click-modal="false" :close-on-press-escape="true" :modal="true" :append-to-body="true"
            :lock-scroll="true" class="fullscreen-map-dialog" @close="exitFullscreenMap">
            <div class="fullscreen-map-container">
                <div id="fullscreen-valve-map" class="fullscreen-valve-map"></div>
                <div class="fullscreen-map-info">
                    <span>当前轮灌组：{{ fullscreenMapGroupName }}</span>
                    <span>已选择：{{ selectedValveDevices[fullscreenMapGroupName]?.length || 0 }} / {{
                        availableValveDevices.length
                        }} 个阀门</span>
                </div>
            </div>
        </el-dialog>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ZoomIn, ZoomOut, Refresh, Close, Location, ArrowDown, Grid, Monitor, VideoPlay, VideoPause, Warning, CircleCheck, CircleClose, Setting, Plus, Delete, CopyDocument, ArrowLeft, ArrowRight, FullScreen, Check, View } from '@element-plus/icons-vue'
import call_remote from '../../../lib/call_remote.js'
import { mapConfig, getAMapScriptUrl, getDeviceIcon, convertXYToLngLat } from '../config/mapConfig.js'
import {
    getDeviceType,
    hasDeviceCapability,
    hasAnyDeviceCapability,
    refreshRuntimeInfo as refreshRuntimeInfoUtil,
    createRuntimeInfoAutoRefresh,
    handleDeviceAction as handleDeviceActionUtil,
    getDeviceButtonGroupsWrapper,
    openDevice,
    closeDevice
} from '../utils/deviceUtils.js'


const props = defineProps({
    devices: {
        type: Array,
        default: () => []
    },
    center: {
        type: Object,
        default: () => mapConfig.defaultCenter
    },
    zoom: {
        type: Number,
        default: mapConfig.defaultZoom
    }
})


const emit = defineEmits(['device-click'])


const selectedDevice = ref(null)
const loading = ref(true)
const currentLayerType = ref('卫星地图')
const refreshingRuntimeInfo = ref(false)
const deviceStatuses = ref({}) 


const runtimeInfoAutoRefresh = createRuntimeInfoAutoRefresh(
    () => selectedDevice,
    () => refreshRuntimeInfo(),
    30000
)


const emergencyStopDialogVisible = ref(false)
const selectedBlocks = ref([])
const availableBlocks = ref([])
const emergencyStopLoading = ref(false)


const scanPeriod = ref(200) 
const scanLoading = ref(false)
const isScanning = ref(false)


const policyConfigWizardVisible = ref(false)
const wizardStep = ref(1)
const wateringGroups = ref([])
const availableValveDevices = ref([])
const selectedValveDevices = ref({}) 
const fertConfigs = ref({}) 
const valveSelectionMaps = ref({}) 
const copiedGroups = ref(new Set()) 
const valveSelectionMarkers = ref({}) 


const newGroupsOnly = computed(() => {
    return wateringGroups.value.filter(g => g.isCopied !== true)
})


const allGroupsAreCopied = computed(() => {
    if (wateringGroups.value.length === 0) {
        return false
    }

    
    return wateringGroups.value.every(g => g.isCopied === true)
})

const farmAreaParams = ref({
    system_flow: 1,
    laying_spacing: 0,
    dripper_spacing: 0,
    dripper_flow: 0,
    coefficient: 0.9
}) 
const areaParamsPopoverVisible = ref({}) 
const existingGroups = ref([]) 
const currentGroupIndex = ref(0) 
const fullscreenMapVisible = ref(false) 
const fullscreenMapGroupName = ref('') 
const fullscreenMapInstance = ref(null) 
const valveDisplayMode = ref('map') 

let map = null

let satelliteLayer = null
let trafficLayer = null
let markers = []


const initMap = async () => {
    try {
        loading.value = true

        
        if (!globalThis.AMap) {
            await loadAMapScript()
        }

        
        if (!globalThis.AMap) {
            throw new Error('高德地图API加载失败')
        }

        
        const initialStyle = mapConfig.mapStyles.normal

        map = new AMap.Map('amap-container', {
            zoom: props.zoom,
            center: [props.center.lng, props.center.lat],
            mapStyle: initialStyle,
            viewMode: '2D', 
            pitch: 0,
            rotation: 0,
            features: ['bg', 'road', 'building', 'point'],
            showLabel: true,
            
            optimize: true,
            
            renderOnMoving: false
        })

        
        setTimeout(() => {
            if (map) {
                
                setSatelliteLayer()
                
                map.render()
            }
        }, 1000)

        
        if (mapConfig.controls.showScale) {
            map.addControl(new AMap.Scale())
        }
        if (mapConfig.controls.showToolbar) {
            map.addControl(new AMap.ToolBar())
        }

        
        map.on('click', onMapClick)

        
        map.on('complete', () => {
            loading.value = false
            
            initDeviceMarkers()
        })

    } catch (error) {
        console.error('地图初始化失败:', error)
        loading.value = false
        ElMessage.error('地图加载失败，请检查网络连接')
    }
}


const loadAMapScript = () => {
    return new Promise((resolve, reject) => {
        if (globalThis.AMap) {
            resolve()
            return
        }

        const script = document.createElement('script')
        script.src = getAMapScriptUrl()
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
    })
}


const initDeviceMarkers = () => {
    if (!map || !props.devices) {
        return
    }

    
    clearMarkers()

    for (const device of props.devices) {
        const marker = createDeviceMarker(device)
        if (marker) {
            markers.push(marker)
        }
    }
}


const createDeviceMarker = (device) => {
    if (!globalThis.AMap) {
        return null
    }

    try {
        let lng, lat

        
        if (device.longitude && device.latitude) {
            lng = device.longitude
            lat = device.latitude
        } else if (device.x && device.y) {
            
            const converted = convertXYToLngLat(device.x, device.y, props.center.lng, props.center.lat)
            lng = converted.lng
            lat = converted.lat
        } else {
            return null
        }

        
        const markerContent = createMarkerContent(device)

        const marker = new AMap.Marker({
            position: [lng, lat],
            content: markerContent,
            anchor: 'center',
            offset: new AMap.Pixel(0, 0)
        })

        
        marker.on('click', () => {
            
            const deviceWithType = {
                ...device,
                type: getDeviceType(device)
            }
            onDeviceClick(deviceWithType)
        })

        
        map.add(marker)

        return marker
    } catch (error) {
        console.error('创建设备标记失败:', error, device)
        return null
    }
}


const handleDeviceAction = async (action, deviceName) => {
    
    if (action === 'openDevice') {
        await openDeviceWrapper(deviceName)
    } else if (action === 'closeDevice') {
        await closeDeviceWrapper(deviceName)
    } else {
        
        await handleDeviceActionUtil(action, deviceName, refreshRuntimeInfo)
    }
}


const getDeviceButtonGroupsWrapperLocal = (device) => {
    return getDeviceButtonGroupsWrapper(device, getCurrentInstance)
}


const getDeviceStatus = (device) => {
    if (!device) return false
    const deviceName = device.deviceName || device.device_name
    return deviceStatuses.value[deviceName] || false
}


const setDeviceStatus = (deviceName, status) => {
    deviceStatuses.value[deviceName] = status
}


const createMarkerContent = (device) => {
    const deviceType = getDeviceType(device)
    const iconName = getDeviceIcon(deviceType)
    const deviceName = device.label || device.device_name || device.deviceName

    let statusClass
    if (device.is_online === true) {
        statusClass = 'online'
    } else if (device.is_online === false) {
        statusClass = 'offline'
    } else {
        const isOpen = getDeviceStatus(device)
        statusClass = isOpen ? 'active' : 'inactive'
    }

    return `
    <div class="device-marker ${deviceType} ${statusClass}" title="${deviceName}">
      <div class="marker-icon">
        <img src="/deviceIcon/${iconName}.png" alt="${deviceName}" />
      </div>
      <div class="marker-info">
        <div class="device-name">${deviceName}</div>
      </div>
    </div>
  `
}


const onDeviceClick = (device) => {
    selectedDevice.value = device
    emit('device-click', device)

    
    startRuntimeInfoAutoRefresh()
}


const onMapClick = (e) => {
    
    if (selectedDevice.value) {
        closeDevicePanel()
    }
}


const handleMapLayerCommand = (command) => {
    switch (command) {
        case 'satellite':
            setSatelliteLayer()
            break
        case 'traffic':
            setTrafficLayer()
            break
        case 'hybrid':
            setHybridLayer()
            break
    }
}


const setSatelliteLayer = () => {
    if (!map) return

    currentLayerType.value = '卫星地图'

    try {
        
        clearAllLayers()

        
        satelliteLayer = new AMap.TileLayer.Satellite({
            zIndex: 1
        })

        
        map.add(satelliteLayer)

        
        map.setMapStyle(mapConfig.mapStyles.normal)

        ElMessage.success('已切换到卫星地图')

    } catch (error) {
        console.error('设置卫星图层失败:', error)
        ElMessage.error('卫星地图设置失败')
    }
}


const setTrafficLayer = () => {
    if (!map) return

    currentLayerType.value = '实时交通'

    try {
        
        clearAllLayers()

        
        trafficLayer = new AMap.TileLayer.Traffic({
            zIndex: 1,
            autoRefresh: true,
            interval: 180
        })

        
        map.add(trafficLayer)

        
        map.setMapStyle(mapConfig.mapStyles.normal)

        ElMessage.success('已切换到实时交通地图')

    } catch (error) {
        console.error('设置交通图层失败:', error)
        ElMessage.error('交通地图设置失败')
    }
}


const setHybridLayer = () => {
    if (!map) return

    currentLayerType.value = '混合图层'

    try {
        
        clearAllLayers()

        
        satelliteLayer = new AMap.TileLayer.Satellite({
            zIndex: 1
        })

        
        trafficLayer = new AMap.TileLayer.Traffic({
            zIndex: 2,
            autoRefresh: true,
            interval: 180
        })

        
        map.add(satelliteLayer)
        map.add(trafficLayer)

        
        map.setMapStyle(mapConfig.mapStyles.normal)

        ElMessage.success('已切换到混合图层（卫星+交通）')

    } catch (error) {
        console.error('设置混合图层失败:', error)
        ElMessage.error('混合图层设置失败')
    }
}


const clearAllLayers = () => {
    if (satelliteLayer) {
        map.remove(satelliteLayer)
        satelliteLayer = null
    }
    if (trafficLayer) {
        map.remove(trafficLayer)
        trafficLayer = null
    }
}


const zoomIn = () => {
    if (map) {
        map.zoomIn()
    }
}

const zoomOut = () => {
    if (map) {
        map.zoomOut()
    }
}


const resetView = () => {
    if (map) {
        map.setCenter([props.center.lng, props.center.lat])
        map.setZoom(props.zoom)
    }
}


const clearMarkers = () => {
    for (const marker of markers) {
        map.remove(marker)
    }
    markers = []
}


const closeDevicePanel = () => {
    
    stopRuntimeInfoAutoRefresh()
    selectedDevice.value = null
}



const toggleDevice = async (device) => {
    try {
        const deviceName = device.deviceName || device.device_name
        const currentStatus = getDeviceStatus(device)

        if (currentStatus) {
            
            await closeDevice(deviceName)
            setDeviceStatus(deviceName, false)
            ElMessage.success(`设备 ${deviceName} 已关闭`)
        } else {
            
            await openDevice(deviceName)
            setDeviceStatus(deviceName, true)
            ElMessage.success(`设备 ${deviceName} 已开启`)
        }

        
        initDeviceMarkers()
    } catch (error) {
        console.error('设备切换失败:', error)
        ElMessage.error(`设备切换失败: ${error.message || error}`)
    }
}


const openDeviceWrapper = async (deviceName) => {
    await openDevice(deviceName)
    setDeviceStatus(deviceName, true)
    
    initDeviceMarkers()
}


const closeDeviceWrapper = async (deviceName) => {
    await closeDevice(deviceName)
    setDeviceStatus(deviceName, false)
    
    initDeviceMarkers()
}


const refreshRuntimeInfo = async () => {
    if (!selectedDevice.value) return
    await refreshRuntimeInfoUtil(selectedDevice.value, refreshingRuntimeInfo)
}


const startRuntimeInfoAutoRefresh = () => {
    runtimeInfoAutoRefresh.start()
}


const stopRuntimeInfoAutoRefresh = () => {
    runtimeInfoAutoRefresh.stop()
}


const showEmergencyStopDialog = async () => {
    try {
        
        await loadAvailableBlocks()
        emergencyStopDialogVisible.value = true
        selectedBlocks.value = []
    } catch (error) {
        console.error('加载地块列表失败:', error)
        ElMessage.error('加载地块列表失败')
    }
}

const loadAvailableBlocks = async () => {
    try {
        
        const blockSet = new Set()
        props.devices.forEach(device => {
            if (device.blockName || device.block_name) {
                blockSet.add(device.blockName || device.block_name)
            }
        })

        availableBlocks.value = Array.from(blockSet).map(blockName => ({
            id: blockName,
            name: blockName
        }))
    } catch (error) {
        console.error('加载地块列表失败:', error)
        availableBlocks.value = []
    }
}

const cancelEmergencyStop = () => {
    emergencyStopDialogVisible.value = false
    selectedBlocks.value = []
}

const executeEmergencyStop = async () => {
    if (selectedBlocks.value.length === 0) {
        ElMessage.warning('请选择至少一个地块')
        return
    }

    emergencyStopLoading.value = true
    try {
        
        const currentFarm = props.devices.length > 0 ? (props.devices[0].farmName || props.devices[0].farm_name) : '默认农场'

        
        const response = await call_remote('/device_management/emergency_stop', {
            farm_name: currentFarm,
            block_names: selectedBlocks.value
        })

        if (response.result) {
            const stoppedCount = response.stopped_devices ? response.stopped_devices.length : 0
            const failedCount = response.failed_devices ? response.failed_devices.length : 0

            if (failedCount === 0) {
                ElMessage.success(`急停操作执行成功，共急停 ${stoppedCount} 个设备`)
            } else {
                ElMessage.warning(`急停操作部分成功：成功 ${stoppedCount} 个，失败 ${failedCount} 个设备`)
            }

            emergencyStopDialogVisible.value = false
            selectedBlocks.value = []

            
            emit('device-click', null) 
        } else {
            ElMessage.error('急停操作执行失败')
        }
    } catch (error) {
        console.error('急停操作失败:', error)
        ElMessage.error(`急停操作失败: ${error.message || error}`)
    } finally {
        emergencyStopLoading.value = false
    }
}


const startScan = async () => {
    try {
        scanLoading.value = true
        const result = await call_remote('/policy/set_scan_period', {
            period_ms: scanPeriod.value
        })

        if (result.result) {
            ElMessage.success(`策略开始运行，扫描周期: ${scanPeriod.value}ms`)
            isScanning.value = true
        }
    } catch (error) {
        console.error('启动策略扫描失败:', error)
        ElMessage.error('启动策略扫描失败')
    } finally {
        scanLoading.value = false
    }
}

const stopScan = async () => {
    try {
        scanLoading.value = true
        const result = await call_remote('/policy/set_scan_period', {
            period_ms: 0
        })

        if (result.result) {
            ElMessage.success('策略已停止运行')
            isScanning.value = false
        }
    } catch (error) {
        console.error('停止策略扫描失败:', error)
        ElMessage.error('停止策略扫描失败')
    } finally {
        scanLoading.value = false
    }
}

const checkScanStatus = async () => {
    try {
        const result = await call_remote('/policy/get_scan_period', {})
        if (result.period_ms && result.period_ms > 0) {
            isScanning.value = true
            scanPeriod.value = result.period_ms
        } else {
            isScanning.value = false
        }
    } catch (error) {
        console.error('获取扫描状态失败:', error)
    }
}


const showPolicyConfigWizard = async () => {
    try {
        
        const currentFarm = props.devices.length > 0 ? (props.devices[0].farmName || props.devices[0].farm_name) : '默认农场'

        const deviceResponse = await call_remote('/device_management/list_device', {
            farm_name: currentFarm,
            pageNo: 0
        })

        if (deviceResponse && deviceResponse.devices) {
            
            const valveDevices = deviceResponse.devices.filter(device =>
                device.driver_name && device.driver_name.includes('WaterGroupValve')
            )
            availableValveDevices.value = valveDevices
        } else {
            availableValveDevices.value = []
        }

        
        try {
            const paramsResponse = await call_remote('/resource/get_farm_area_params', {
                farm_name: currentFarm
            })
            if (paramsResponse) {
                farmAreaParams.value = {
                    system_flow: paramsResponse.system_flow !== undefined ? paramsResponse.system_flow : 1,
                    laying_spacing: paramsResponse.laying_spacing || 0,
                    dripper_spacing: paramsResponse.dripper_spacing || 0,
                    dripper_flow: paramsResponse.dripper_flow || 0,
                    coefficient: paramsResponse.coefficient !== undefined ? paramsResponse.coefficient : 0.9
                }
            }
        } catch (error) {
            console.error('获取农场参数失败:', error)
            
            farmAreaParams.value = {
                system_flow: 1,
                laying_spacing: 0,
                dripper_spacing: 0,
                dripper_flow: 0,
                coefficient: 0.9
            }
        }

        
        wizardStep.value = 1
        wateringGroups.value = []
        selectedValveDevices.value = {}
        fertConfigs.value = {}
        areaParamsPopoverVisible.value = {}
        currentGroupIndex.value = 0
        copiedGroups.value.clear() 

        
        await loadExistingGroups()

        policyConfigWizardVisible.value = true
    } catch (error) {
        console.error('获取设备列表失败:', error)
        ElMessage.error('获取设备列表失败')
    }
}


const parseTimeValue = (expression) => {
    const timeValue = parseFloat(expression) || 0
    return timeValue > 1000 ? timeValue / 60000 : timeValue
}

const parseValvesFromExpression = (expression) => {
    if (!expression || expression === '""' || expression === '[]' || expression.trim() === '') {
        return []
    }

    let cleanExpression = expression.trim()
    if (cleanExpression.startsWith('"') && cleanExpression.endsWith('"')) {
        cleanExpression = cleanExpression.slice(1, -1)
    }

    if (cleanExpression.startsWith('[') && cleanExpression.endsWith(']')) {
        const arrayContent = cleanExpression.slice(1, -1).trim()
        if (!arrayContent) return []
        
        const matches = arrayContent.match(/"([^"]+)"/g)
        if (matches) {
            return matches.map(m => m.replace(/"/g, '').trim()).filter(Boolean)
        }
        return arrayContent.split(',').map(v => v.trim()).filter(Boolean)
    }

    if (cleanExpression.includes(',')) {
        const matches = cleanExpression.match(/"([^"]+)"/g)
        if (matches && matches.length > 1) {
            return matches.map(m => m.replace(/"/g, '').trim()).filter(Boolean)
        }
        return cleanExpression.split(',').map(v => v.trim()).filter(Boolean)
    }

    const matches = cleanExpression.match(/"([^"]+)"/g)
    if (matches) {
        return matches.map(m => m.replace(/"/g, '').trim()).filter(Boolean)
    }
    
    return cleanExpression.trim() ? [cleanExpression.trim()] : []
}

const parseFertMethod = (expression) => {
    const methodStr = expression.replace(/"/g, '')
    if (methodStr === '亩定量' || methodStr === 'AreaBased') return 'AreaBased'
    if (methodStr === '总定量' || methodStr === 'Total') return 'Total'
    if (methodStr === '定时' || methodStr === 'Time') return 'Time'
    return 'AreaBased'
}

const parseFertConfigFromVariables = (initVariables, fertConfig) => {
    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        const expression = initVar.expression || ''

        if (varName === 'method' || varName === '施肥策略') {
            fertConfig.method = parseFertMethod(expression)
        } else if (varName === 'fert_time' || varName === '施肥时间') {
            fertConfig.fert_time = parseTimeValue(expression)
        } else if (varName === 'pre_ms' || varName === '肥前时间') {
            fertConfig.pre_fert_time = parseTimeValue(expression)
        } else if (varName === 'post_ms' || varName === '肥后时间') {
            fertConfig.post_fert_time = parseTimeValue(expression)
        } else if (varName === 'fert_rate' || varName === '期望施肥速率') {
            fertConfig.fert_rate = parseFloat(expression) || 0
        } else if (varName === '期望每亩施肥量' || varName === 'area_based_amount') {
            fertConfig.AB_fert = parseFloat(expression) || 0
        } else if (varName === '期望施肥总量') {
            fertConfig.total_fert = parseFloat(expression) || 0
        }
    }
}

const parseAreaFromVariable = (initVariables) => {
    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        if (varName === 'area' || varName === '面积') {
            const areaValue = parseFloat(initVar.expression) || 0
            if (areaValue > 0) {
                return areaValue
            }
        }
    }
    return null
}

const parseValvesFromGroup = (group) => {
    if (!group.valves || group.valves === '-') {
        return []
    }

    if (group.valves.includes('|')) {
        return group.valves.split('|').map(v => v.trim()).filter(Boolean)
    }

    const matches = group.valves.match(/"([^"]+)"/g)
    return matches ? matches.map(m => m.replace(/"/g, '')) : []
}

const applyDefaultFertConfig = (fertConfig, area) => {
    if (fertConfig.AB_fert === 0 && area > 0 && fertConfig.fert_rate > 0 && fertConfig.method === 'AreaBased') {
        fertConfig.AB_fert = fertConfig.fert_rate
    }
}

const loadExistingGroups = async () => {
    try {
        const currentFarm = props.devices.length > 0 ? (props.devices[0].farmName || props.devices[0].farm_name) : '默认农场'

        const response = await call_remote('/policy/list_watering_groups', { pageNo: 0 })
        if (response && response.groups) {
            let filteredGroups = response.groups
            if (currentFarm && currentFarm !== '默认农场') {
                const policyFarmMatches = await Promise.all(
                    response.groups.map(async (group) => {
                        try {
                            const farmMatch = await call_remote('/policy/get_matched_farm', {
                                policy_name: group.name
                            })
                            return {
                                group,
                                farmName: farmMatch.farm_name
                            }
                        } catch (error) {
                            return {
                                group,
                                farmName: null
                            }
                        }
                    })
                )
                filteredGroups = policyFarmMatches
                    .filter(item => item.farmName === currentFarm)
                    .map(item => item.group)
            }

            const policyListResponse = await call_remote('/policy/list_policy', { pageNo: 0 })
            const allPolicies = policyListResponse?.policies || []

            existingGroups.value = await Promise.all(filteredGroups.map(async (group) => {
                const policy = allPolicies.find(p => p.name === group.name)

                let area = group.area || 0
                let valves = []
                let fertConfig = {
                    method: 'AreaBased',
                    AB_fert: 0,
                    total_fert: 0,
                    fert_time: 0,
                    pre_fert_time: 0,
                    post_fert_time: 0,
                    fert_rate: group.fert_rate || 0,
                }

                if (policy?.init_variables) {
                    const areaFromVar = parseAreaFromVariable(policy.init_variables)
                    if (areaFromVar !== null) {
                        area = areaFromVar
                    }

                    for (const initVar of policy.init_variables) {
                        const varName = initVar.variable_name
                        if (varName === 'valves' || varName === '组内阀门') {
                            valves = parseValvesFromExpression(initVar.expression || '')
                            break
                        }
                    }

                    parseFertConfigFromVariables(policy.init_variables, fertConfig)
                    applyDefaultFertConfig(fertConfig, area)
                }

                if (valves.length === 0) {
                    valves = parseValvesFromGroup(group)
                }

                return {
                    name: group.name,
                    area: area,
                    valves: valves,
                    fertConfig: fertConfig
                }
            }))

            if (existingGroups.value.length > 0) {
                ElMessage.success(`已加载 ${existingGroups.value.length} 个已配置的轮灌组`)
            } else {
                ElMessage.info('当前没有已配置的轮灌组')
            }
        } else {
            existingGroups.value = []
            ElMessage.info('当前没有已配置的轮灌组')
        }
    } catch (error) {
        console.error('加载已配置轮灌组失败:', error)
        ElMessage.error('加载已配置轮灌组失败')
        existingGroups.value = []
    }
}


const isGroupNameDuplicate = (name, excludeName = null) => {
    
    const existsInCurrent = wateringGroups.value.some(g => g.name === name && g.name !== excludeName)
    
    const existsInExisting = existingGroups.value.some(g => g.name === name)
    return existsInCurrent || existsInExisting
}


const validateExistingGroup = (existingGroup) => {
    if (!existingGroup || !existingGroup.name || typeof existingGroup.name !== 'string') {
        ElMessage.error('无效的轮灌组数据')
        return null
    }
    
    const groupName = existingGroup.name.trim()
    if (groupName.length > 100) {
        ElMessage.error('轮灌组名称过长')
        return null
    }
    
    return groupName
}

const extractBaseName = (groupName) => {
    if (groupName.length === 0) {
        return '轮灌组'
    }
    
    let endIndex = groupName.length
    while (endIndex > 0 && groupName.charCodeAt(endIndex - 1) >= 48 && groupName.charCodeAt(endIndex - 1) <= 57) {
        endIndex--
    }
    
    const baseName = endIndex > 0 ? groupName.substring(0, endIndex) : '轮灌组'
    if (baseName.length > 50) {
        ElMessage.error('轮灌组基础名称过长')
        return null
    }
    
    return baseName
}

const generateDefaultName = (baseName) => {
    let defaultName = `${baseName}${wateringGroups.value.length + 1}`
    let counter = 1
    while (isGroupNameDuplicate(defaultName)) {
        counter++
        if (counter > 10000) {
            ElMessage.error('无法生成唯一的轮灌组名称')
            return null
        }
        defaultName = `${baseName}${counter}`
    }
    return defaultName
}

const createCopiedGroup = (trimmedName, existingGroup) => {
    const index = wateringGroups.value.length
    
    wateringGroups.value.push({
        name: trimmedName,
        area: existingGroup.area || 0,
        isCopied: true,
        configKey: trimmedName
    })

    selectedValveDevices.value[trimmedName] = []

    fertConfigs.value[trimmedName] = {
        method: existingGroup.fertConfig?.method || 'AreaBased',
        AB_fert: existingGroup.fertConfig?.AB_fert ?? 0,
        total_fert: existingGroup.fertConfig?.total_fert ?? 0,
        fert_time: existingGroup.fertConfig?.fert_time ?? 0,
        pre_fert_time: existingGroup.fertConfig?.pre_fert_time ?? 0,
        post_fert_time: existingGroup.fertConfig?.post_fert_time ?? 0,
        fert_rate: existingGroup.fertConfig?.fert_rate ?? 0,
    }

    copiedGroups.value.add(trimmedName)
    areaParamsPopoverVisible.value[index] = false
}

const copyExistingGroup = async (existingGroup) => {
    const groupName = validateExistingGroup(existingGroup)
    if (!groupName) return
    
    const baseName = extractBaseName(groupName)
    if (!baseName) return
    
    const defaultName = generateDefaultName(baseName)
    if (!defaultName) return

    try {
        const { value: newName } = await ElMessageBox.prompt(
            `请输入新轮灌组的名称（复制自：${existingGroup.name}）`,
            '复制轮灌组',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputValue: defaultName,
                inputPlaceholder: '请输入轮灌组名称',
                inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                        return '轮灌组名称不能为空'
                    }
                    if (isGroupNameDuplicate(value.trim())) {
                        return '该轮灌组名称已存在，请使用其他名称'
                    }
                    return true
                },
                inputErrorMessage: '请输入有效的轮灌组名称'
            }
        )

        const trimmedName = newName?.trim()
        if (!trimmedName || isGroupNameDuplicate(trimmedName)) {
            if (!trimmedName) {
                ElMessage.warning('轮灌组名称不能为空')
            } else {
                ElMessage.error('该轮灌组名称已存在，请使用其他名称')
            }
            return
        }

        createCopiedGroup(trimmedName, existingGroup)

        if (wizardStep.value === 2) {
            await nextTick()
            await initValveSelectionMap(trimmedName)
        }

        ElMessage.success(`已将轮灌组 ${existingGroup.name} 的配置复制到 ${trimmedName}`)
    } catch (error) {
        if (error === 'cancel') {
            return
        }
        console.error('复制轮灌组失败:', error)
    }
}

const addWateringGroup = async () => {
    
    let defaultName = `轮灌组${wateringGroups.value.length + 1}`
    let counter = 1
    while (isGroupNameDuplicate(defaultName)) {
        counter++
        defaultName = `轮灌组${counter}`
    }

    
    try {
        const { value: groupName } = await ElMessageBox.prompt(
            '请输入新轮灌组的名称',
            '新增轮灌组',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputValue: defaultName,
                inputPlaceholder: '请输入轮灌组名称',
                inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                        return '轮灌组名称不能为空'
                    }
                    if (isGroupNameDuplicate(value.trim())) {
                        return '该轮灌组名称已存在，请使用其他名称'
                    }
                    return true
                },
                inputErrorMessage: '请输入有效的轮灌组名称'
            }
        )

        if (!groupName || groupName.trim() === '') {
            ElMessage.warning('轮灌组名称不能为空')
            return
        }

        const trimmedName = groupName.trim()
        if (isGroupNameDuplicate(trimmedName)) {
            ElMessage.error('该轮灌组名称已存在，请使用其他名称')
            return
        }

        const index = wateringGroups.value.length
        wateringGroups.value.push({
            name: trimmedName,
            area: 0,
            isCopied: false, 
            configKey: trimmedName 
        })

        selectedValveDevices.value[trimmedName] = []
        fertConfigs.value[trimmedName] = {
            method: 'AreaBased',
            AB_fert: 0,
            total_fert: 0,
            fert_time: 0,
            pre_fert_time: 0,
            post_fert_time: 0,
            fert_rate: 0,
        }
        areaParamsPopoverVisible.value[index] = false
    } catch (error) {
        if (error === 'cancel') {
            return
        }
        console.error('新增轮灌组失败:', error)
    }
}

const removeWateringGroup = (index) => {
    const groupName = wateringGroups.value[index].name
    wateringGroups.value.splice(index, 1)
    delete selectedValveDevices.value[groupName]
    delete fertConfigs.value[groupName]

    
    if (valveSelectionMaps.value[groupName]) {
        valveSelectionMaps.value[groupName].destroy()
        delete valveSelectionMaps.value[groupName]
    }
    delete valveSelectionMarkers.value[groupName]
    delete areaParamsPopoverVisible.value[index]
}


const getRecommendedArea = (index) => {
    const params = farmAreaParams.value
    
    
    const system_flow = Number(params.system_flow) || 0
    const laying_spacing = Number(params.laying_spacing) || 0
    const dripper_spacing = Number(params.dripper_spacing) || 0
    const dripper_flow = Number(params.dripper_flow) || 0
    const coefficient = Number(params.coefficient) || 0.9

    
    if (system_flow <= 0 ||
        laying_spacing <= 0 ||
        dripper_spacing <= 0 ||
        dripper_flow <= 0) {
        return 0
    }

    
    const denominator = (667 / laying_spacing / dripper_spacing) * dripper_flow

    if (denominator === 0 || !isFinite(denominator)) {
        return 0
    }

    
    const result = (system_flow * 1000 / denominator) * coefficient

    return result > 0 && isFinite(result) ? result : 0
}


const updateAreaParam = async (paramName, value) => {
    const currentFarm = props.devices.length > 0 ? (props.devices[0].farmName || props.devices[0].farm_name) : '默认农场'
    try {
        const params = { [paramName]: value }
        await call_remote('/resource/set_farm_area_params', {
            farm_name: currentFarm,
            ...params
        })
        
        farmAreaParams.value[paramName] = value
    } catch (error) {
        console.error('更新参数失败:', error)
        ElMessage.error('更新参数失败')
    }
}


const initValveSelectionMap = async (groupName) => {
    await nextTick()

    const mapContainerId = `valve-selection-map-${groupName}`
    const container = document.getElementById(mapContainerId)
    if (!container) {
        console.error('找不到地图容器:', mapContainerId)
        
        await new Promise(resolve => setTimeout(resolve, 200))
        const retryContainer = document.getElementById(mapContainerId)
        if (!retryContainer) {
            console.error('重试后仍找不到地图容器:', mapContainerId)
            return
        }
    }

    
    const group = wateringGroups.value.find(g => (g.configKey || g.name) === groupName || g.name === groupName)
    const configKey = group ? (group.configKey || group.name) : groupName

    
    if (valveSelectionMaps.value[configKey]) {
        try {
            valveSelectionMaps.value[configKey].destroy()
        } catch (e) {
            console.warn('销毁地图失败:', e)
        }
        delete valveSelectionMaps.value[configKey]
        delete valveSelectionMarkers.value[configKey]
    }

    
    if (groupName !== configKey && valveSelectionMaps.value[groupName]) {
        try {
            valveSelectionMaps.value[groupName].destroy()
        } catch (e) {
            console.warn('销毁旧地图失败:', e)
        }
        delete valveSelectionMaps.value[groupName]
        delete valveSelectionMarkers.value[groupName]
    }

    try {
        
        if (!globalThis.AMap) {
            await loadAMapScript()
        }

        if (!globalThis.AMap) {
            throw new Error('高德地图API加载失败')
        }

        
        let centerLng = props.center.lng
        let centerLat = props.center.lat

        if (availableValveDevices.value.length > 0) {
            const lngs = availableValveDevices.value.map(d => d.longitude).filter(Boolean)
            const lats = availableValveDevices.value.map(d => d.latitude).filter(Boolean)

            if (lngs.length > 0 && lats.length > 0) {
                centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
                centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
            }
        }

        
        const selectionMap = new AMap.Map(mapContainerId, {
            zoom: 15,
            center: [centerLng, centerLat],
            mapStyle: 'amap://styles/normal',
            viewMode: '2D'
        })

        
        const satelliteLayer = new AMap.TileLayer.Satellite({
            zIndex: 1,
            opacity: 1
        })
        selectionMap.add(satelliteLayer)

        valveSelectionMaps.value[configKey] = selectionMap

        
        const markers = []
        for (const device of availableValveDevices.value) {
            if (!device.longitude || !device.latitude) continue

            const isSelected = selectedValveDevices.value[configKey]?.includes(device.device_name) || false

            const marker = createValveSelectionMarker(device, isSelected, configKey)
            if (marker) {
                selectionMap.add(marker)
                markers.push(marker)
            }
        }

        valveSelectionMarkers.value[configKey] = markers

    } catch (error) {
        console.error('初始化阀门选择地图失败:', error)
        ElMessage.error('地图加载失败')
    }
}


const createValveSelectionMarker = (device, isSelected, groupName) => {
    if (!globalThis.AMap) return null

    try {
        const deviceName = device.device_name
        
        const deviceType = 'valve' 
        const iconName = getDeviceIcon(deviceType)

        
        const statusClass = isSelected ? 'selected' : ''
        const selectionClass = isSelected ? 'valve-selected' : ''

        const markerContent = `
            <div class="device-marker valve ${statusClass} ${selectionClass}" title="${deviceName}">
                <div class="marker-icon">
                    <img src="/deviceIcon/${iconName}.png" alt="${deviceName}" />
                </div>
                <div class="marker-name">${deviceName}</div>
            </div>
        `

        const marker = new AMap.Marker({
            position: [device.longitude, device.latitude],
            content: markerContent,
            anchor: 'center',
            offset: new AMap.Pixel(0, 0)
        })

        
        marker.on('click', () => {
            toggleValveSelection(device.device_name, groupName)
        })

        return marker
    } catch (error) {
        console.error('创建阀门选择标记失败:', error)
        return null
    }
}


const toggleValveSelection = (deviceName, groupName) => {
    if (!selectedValveDevices.value[groupName]) {
        selectedValveDevices.value[groupName] = []
    }

    const index = selectedValveDevices.value[groupName].indexOf(deviceName)
    if (index > -1) {
        
        selectedValveDevices.value[groupName].splice(index, 1)
    } else {
        
        selectedValveDevices.value[groupName].push(deviceName)
    }

    
    if (valveDisplayMode.value === 'map') {
        updateValveSelectionMarkers(groupName)
    }
}


const updateValveSelectionMarkers = (groupName) => {
    
    const group = wateringGroups.value.find(g => (g.configKey || g.name) === groupName || g.name === groupName)
    const configKey = group ? (group.configKey || group.name) : groupName

    const markers = valveSelectionMarkers.value[configKey]
    if (!markers) return

    markers.forEach((marker, index) => {
        const device = availableValveDevices.value[index]
        if (!device) return

        const isSelected = selectedValveDevices.value[configKey]?.includes(device.device_name) || false

        
        const deviceName = device.device_name
        const deviceType = 'valve'
        const iconName = getDeviceIcon(deviceType)
        const statusClass = isSelected ? 'selected' : ''
        const selectionClass = isSelected ? 'valve-selected' : ''

        const markerContent = `
            <div class="device-marker valve ${statusClass} ${selectionClass}" title="${deviceName}">
                <div class="marker-icon">
                    <img src="/deviceIcon/${iconName}.png" alt="${deviceName}" />
                </div>
                <div class="marker-name">${deviceName}</div>
            </div>
        `

        marker.setContent(markerContent)
    })

    
    if (configKey !== groupName && valveSelectionMarkers.value[groupName]) {
        delete valveSelectionMarkers.value[groupName]
    }
}


const clearSelectedValves = (groupName) => {
    if (selectedValveDevices.value[groupName]) {
        selectedValveDevices.value[groupName] = []
        
        if (valveDisplayMode.value === 'map') {
            updateValveSelectionMarkers(groupName)
        }
    }
}


const selectAllValves = (groupName) => {
    if (!selectedValveDevices.value[groupName]) {
        selectedValveDevices.value[groupName] = []
    }
    selectedValveDevices.value[groupName] = availableValveDevices.value.map(d => d.device_name)
    
    if (valveDisplayMode.value === 'map') {
        updateValveSelectionMarkers(groupName)
    }
}


const getGroupConfigKey = (group) => {
    return group.configKey || group.name
}


const isValveSelected = (deviceName, groupName) => {
    return selectedValveDevices.value[groupName]?.includes(deviceName) || false
}


const handleDisplayModeChange = async (mode) => {
    
    if (mode === 'map') {
        const currentGroup = wateringGroups.value[currentGroupIndex.value]
        if (currentGroup) {
            
            await nextTick()
            
            await new Promise(resolve => setTimeout(resolve, 150))

            
            await initValveSelectionMap(currentGroup.name)
        }
    }
}


const switchToPreviousGroup = async () => {
    if (currentGroupIndex.value > 0) {
        currentGroupIndex.value--
        
        if (valveDisplayMode.value === 'map') {
            await nextTick()
            const groupName = wateringGroups.value[currentGroupIndex.value]?.name
            if (groupName && !valveSelectionMaps.value[groupName]) {
                await initValveSelectionMap(groupName)
            }
        }
        
        const groupName = wateringGroups.value[currentGroupIndex.value]?.name
        if (groupName && !selectedValveDevices.value[groupName]) {
            selectedValveDevices.value[groupName] = []
        }
    }
}


const switchToNextGroup = async () => {
    if (currentGroupIndex.value < wateringGroups.value.length - 1) {
        currentGroupIndex.value++
        
        if (valveDisplayMode.value === 'map') {
            await nextTick()
            const groupName = wateringGroups.value[currentGroupIndex.value]?.name
            if (groupName && !valveSelectionMaps.value[groupName]) {
                await initValveSelectionMap(groupName)
            }
        }
        
        const groupName = wateringGroups.value[currentGroupIndex.value]?.name
        if (groupName && !selectedValveDevices.value[groupName]) {
            selectedValveDevices.value[groupName] = []
        }
    }
}


const enterFullscreenMap = async (groupName) => {
    fullscreenMapGroupName.value = groupName
    fullscreenMapVisible.value = true
    await nextTick()
    await initFullscreenMap(groupName)
}


const exitFullscreenMap = () => {
    if (fullscreenMapInstance.value) {
        fullscreenMapInstance.value.destroy()
        fullscreenMapInstance.value = null
    }
    fullscreenMapVisible.value = false
    fullscreenMapGroupName.value = ''
}


const getMapCenterFromDevices = () => {
    if (availableValveDevices.value.length === 0) {
        return { lng: props.center.lng, lat: props.center.lat }
    }

    const lngs = availableValveDevices.value.map(d => d.longitude).filter(Boolean)
    const lats = availableValveDevices.value.map(d => d.latitude).filter(Boolean)

    if (lngs.length === 0 || lats.length === 0) {
        return { lng: props.center.lng, lat: props.center.lat }
    }

    return {
        lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        lat: lats.reduce((a, b) => a + b, 0) / lats.length
    }
}

const createFullscreenMapMarkers = (fullscreenMap, groupName) => {
    const markers = []
    for (const device of availableValveDevices.value) {
        if (!device.longitude || !device.latitude) continue

        const isSelected = selectedValveDevices.value[groupName]?.includes(device.device_name) || false
        const marker = createValveSelectionMarker(device, isSelected, groupName)
        
        if (marker) {
            fullscreenMap.add(marker)
            markers.push(marker)
        }
    }
    return markers
}

const calculateZoomFromRange = (lngs, lats) => {
    const lngRange = Math.max(...lngs) - Math.min(...lngs)
    const latRange = Math.max(...lats) - Math.min(...lats)
    const maxRange = Math.max(lngRange, latRange)
    
    if (maxRange <= 0) return null
    return maxRange > 0.1 ? 12 : maxRange > 0.05 ? 13 : 14
}

const getDeviceCoordinates = () => {
    const lngs = availableValveDevices.value.map(d => d.longitude).filter(Boolean)
    const lats = availableValveDevices.value.map(d => d.latitude).filter(Boolean)
    return { lngs, lats }
}

const adjustMapView = (fullscreenMap, markers) => {
    if (markers.length > 0) {
        fullscreenMap.setFitView(markers, false, [100, 100, 100, 100])
        return
    }

    const { lngs, lats } = getDeviceCoordinates()
    if (lngs.length === 0 || lats.length === 0) return

    const center = {
        lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        lat: lats.reduce((a, b) => a + b, 0) / lats.length
    }
    
    fullscreenMap.setCenter([center.lng, center.lat])
    
    const zoom = calculateZoomFromRange(lngs, lats)
    if (zoom !== null) {
        fullscreenMap.setZoom(zoom)
    }
}

const ensureAMapLoaded = async () => {
    if (!globalThis.AMap) {
        await loadAMapScript()
    }
    if (!globalThis.AMap) {
        throw new Error('高德地图API加载失败')
    }
}

const initFullscreenMap = async (groupName) => {
    await nextTick()

    const mapContainerId = 'fullscreen-valve-map'
    const container = document.getElementById(mapContainerId)
    if (!container) {
        console.error('找不到全屏地图容器')
        return
    }

    if (fullscreenMapInstance.value) {
        fullscreenMapInstance.value.destroy()
    }

    try {
        await ensureAMapLoaded()

        const center = getMapCenterFromDevices()
        const fullscreenMap = new AMap.Map(mapContainerId, {
            zoom: 15,
            center: [center.lng, center.lat],
            mapStyle: 'amap://styles/normal',
            viewMode: '2D'
        })

        const satelliteLayer = new AMap.TileLayer.Satellite({
            zIndex: 1,
            opacity: 1
        })
        fullscreenMap.add(satelliteLayer)
        fullscreenMapInstance.value = fullscreenMap

        const markers = createFullscreenMapMarkers(fullscreenMap, groupName)
        adjustMapView(fullscreenMap, markers)

    } catch (error) {
        console.error('初始化全屏地图失败:', error)
        ElMessage.error('全屏地图加载失败')
    }
}

const nextStep = async () => {
    if (wizardStep.value === 1) {
        
        if (wateringGroups.value.length === 0) {
            ElMessage.warning('请至少创建一个轮灌组')
            return
        }
        for (const group of wateringGroups.value) {
            if (group.area <= 0) {
                ElMessage.warning(`请为${group.name}设置有效的面积`)
                return
            }
        }
        
        wizardStep.value = 2
        
        await nextTick()
        wateringGroups.value.forEach(group => {
            initValveSelectionMap(group.name)
        })
    } else if (wizardStep.value === 2) {
        
        for (const group of wateringGroups.value) {
            const configKey = group.configKey || group.name
            if (!selectedValveDevices.value[configKey] || selectedValveDevices.value[configKey].length === 0) {
                ElMessage.warning(`请为${group.name}分配至少一个阀门设备`)
                return
            }
        }

        
        if (allGroupsAreCopied.value) {
            
            await finishWizard()
            return
        } else {
            
            
            for (const group of wateringGroups.value) {
                const configKey = group.configKey || group.name
                
                if (!fertConfigs.value[configKey]) {
                    if (group.isCopied) {
                        console.warn('复制的轮灌组配置丢失，创建默认配置', {
                            轮灌组名称: group.name,
                            configKey: configKey
                        })
                    }
                    fertConfigs.value[configKey] = {
                        method: 'AreaBased',
                        AB_fert: 0,
                        total_fert: 0,
                        fert_time: 0,
                        pre_fert_time: 0,
                        post_fert_time: 0,
                        fert_rate: 0,
                    }
                } else {
                    
                    const config = fertConfigs.value[configKey]
                    if (!config.method) config.method = 'AreaBased'
                    if (config.AB_fert === undefined) config.AB_fert = 0
                    if (config.total_fert === undefined) config.total_fert = 0
                    if (config.fert_time === undefined) config.fert_time = 0
                    if (config.pre_fert_time === undefined) config.pre_fert_time = 0
                    if (config.post_fert_time === undefined) config.post_fert_time = 0
                    if (config.fert_rate === undefined) config.fert_rate = 0
                }
            }
            
            wizardStep.value = 3
        }
    }
}

const prevStep = () => {
    if (wizardStep.value > 1) {
        wizardStep.value--
    }
}

const finishWizard = () => {
    
    if (!Array.isArray(wateringGroups.value)) {
        console.error('wateringGroups.value 不是数组:', wateringGroups.value, typeof wateringGroups.value)
        
        wateringGroups.value = []
        ElMessage.error('轮灌组数据异常，请重新配置')
        return
    }

    
    if (wateringGroups.value.length === 0) {
        ElMessage.warning('请至少创建一个轮灌组')
        return
    }

    
    for (const group of wateringGroups.value) {
        if (!group || !group.name) {
            console.error('轮灌组数据异常:', group)
            ElMessage.error('轮灌组数据异常，请重新配置')
            return
        }
        
        const configKey = group.configKey || group.name
        const config = fertConfigs.value[configKey]
        if (!config) {
            console.error('施肥配置缺失:', {
                轮灌组名称: group.name,
                configKey: configKey,
                是否复制: group.isCopied,
                所有施肥配置keys: Object.keys(fertConfigs.value),
                所有轮灌组: wateringGroups.value.map(g => ({ name: g.name, configKey: g.configKey }))
            })
            ElMessage.warning(`请为${group.name}设置施肥配置`)
            return
        }
        if (config.method === 'AreaBased' && config.AB_fert <= 0) {
            ElMessage.warning(`请为${group.name}设置有效的亩定量施肥参数`)
            return
        }
        if (config.method === 'Total' && config.total_fert <= 0) {
            ElMessage.warning(`请为${group.name}设置有效的总定量施肥参数`)
            return
        }
        if (config.method === 'Time' && config.fert_time <= 0) {
            ElMessage.warning(`请为${group.name}设置有效的定时施肥参数`)
            return
        }
    }

    
    
    if (!Array.isArray(wateringGroups.value)) {
        console.error('wateringGroups.value 在生成配置时不是数组:', wateringGroups.value)
        wateringGroups.value = []
        ElMessage.error('轮灌组数据异常，请重新配置')
        return
    }

    const finalConfig = wateringGroups.value.map(group => {
        if (!group || !group.name) {
            console.error('轮灌组数据异常:', group)
            return null
        }
        
        const configKey = group.configKey || group.name
        const config = fertConfigs.value[configKey]
        if (!config) {
            console.error('施肥配置缺失:', { 轮灌组名称: group.name, configKey: configKey })
            return null
        }
        let AB_fert = config.AB_fert;
        if (config.method == 'Total') {
            AB_fert = config.total_fert / group.area;
        }
        return {
            name: group.name,
            area: group.area,
            valves: selectedValveDevices.value[group.name] || [],
            method: config.method,
            AB_fert: parseFloat(AB_fert.toFixed(2)),
            fert_time: config.method === 'Time' ? config.fert_time : 0,
            pre_fert_time: config.pre_fert_time || 0,
            post_fert_time: config.post_fert_time || 0,
            fert_rate: config.fert_rate || 0,
        }
    }).filter(Boolean) 

    
    if (finalConfig.length === 0) {
        ElMessage.error('没有有效的轮灌组配置')
        return
    }

    
    (async () => {
        try {
            const farm_name = localStorage.getItem('selectedFarm') || ''

            if (!farm_name) {
                ElMessage.error('请先选择农场')
                return
            }

            
            try {
                await ensureRequiredPolicies(farm_name)
            } catch (e) {
                console.error('确保必要策略失败:', e)
                ElMessage.error(e?.err_msg || e?.message || '检查必要策略失败: ' + String(e))
                return
            }

            const resp = await call_remote('/policy/apply_wizard_groups', { groups: finalConfig, farm_name })

            if (resp && resp.result) {
                ElMessage.success('轮灌组策略已下发并生效')
                policyConfigWizardVisible.value = false
            } else {
                const errorMsg = resp?.err_msg || resp?.message || '下发失败，未知错误'
                console.error('下发失败:', errorMsg, resp)
                ElMessage.error(errorMsg)
            }
        } catch (e) {
            console.error('下发异常:', e)
            const errorMsg = e?.err_msg || e?.message || e?.toString() || '下发失败，未知错误'
            ElMessage.error(errorMsg)
        }
    })()
}


const ensureRequiredPolicies = async (farm_name) => {
    if (!farm_name) {
        throw new Error('请先选择农场')
    }

    try {
        
        const requiredPolicies = [
            { name: `${farm_name}-供水`, type: '供水策略' },
            { name: `${farm_name}-总策略`, type: '总策略' }
        ]

        
        const policyList = await call_remote('/policy/list_policy', { pageNo: 0, farm_name: farm_name })
        const existingPolicies = policyList?.policies || []
        const existingPolicyNames = new Set(existingPolicies.map(p => p.name))

        
        const waterPolicyName = `${farm_name}-供水`
        if (!existingPolicyNames.has(waterPolicyName)) {
            
            const requiredDevices = [
                `${farm_name}-主泵`,
                `${farm_name}-主管道压力计`,
                `${farm_name}-主管道流量计`
            ]

            try {
                const deviceList = await call_remote('/device_management/list_device', {
                    farm_name: farm_name,
                    pageNo: 0
                })
                const existingDevices = deviceList?.devices || []
                const existingDeviceNames = new Set(existingDevices.map(d => d.device_name))

                const missingDevices = requiredDevices.filter(name => !existingDeviceNames.has(name))
                if (missingDevices.length > 0) {
                    throw new Error(`缺少必要设备：${missingDevices.join('、')}。请先配置这些设备，设备名称格式必须为"${farm_name}-设备名"`)
                }

                await call_remote('/config/init_water_policy', {
                    farm_name: farm_name,
                    flow_warning_low_limit: 1,
                    flow_warning_high_limit: 6,
                    pressure_warning_low_limit: 0.1,
                    pressure_warning_high_limit: 0.25,
                    pressure_shutdown_low_limit: 0.05,
                    pressure_shutdown_high_limit: 0.3,
                    flow_check_interval: 60,
                    pressure_shutdown_check_interval: 3
                })
            } catch (e) {
                
                if (e?.err_msg && e.err_msg.includes('缺少必要设备')) {
                    throw new Error(e.err_msg + `。请先配置以下设备（设备名称格式必须为"${farm_name}-设备名"）：\n1. ${farm_name}-主泵\n2. ${farm_name}-主管道压力计\n3. ${farm_name}-主管道流量计`)
                }
                throw e
            }
        }

        
        const globalPolicyName = `${farm_name}-总策略`
        if (!existingPolicyNames.has(globalPolicyName)) {
            try {
                await call_remote('/config/init_global_policy', {
                    farm_name: farm_name,
                    start_hour: 8
                })
            } catch (e) {
                throw e
            }
        }

        
        const fertPolicyName = `${farm_name}-施肥`
        if (!existingPolicyNames.has(fertPolicyName)) {
            
            const requiredFertDevices = [
                `${farm_name}-施肥泵`,
                `${farm_name}-施肥流量计`,
                `${farm_name}-施肥液位计`
            ]

            try {
                const deviceList = await call_remote('/device_management/list_device', {
                    farm_name: farm_name,
                    pageNo: 0
                })
                const existingDevices = deviceList?.devices || []
                const existingDeviceNames = new Set(existingDevices.map(d => d.device_name))

                const missingDevices = requiredFertDevices.filter(name => !existingDeviceNames.has(name))
                if (missingDevices.length > 0) {
                    throw new Error(`缺少必要设备：${missingDevices.join('、')}。请先配置这些设备，设备名称格式必须为"${farm_name}-设备名"`)
                }

                await call_remote('/config/init_fert_policy', {
                    farm_name: farm_name,
                    flow_expected_value: 2,
                    flow_warning_max_offset: 0.5,
                    flow_check_interval: 60,
                    level_warning_limit: 0.8,
                    level_shutdown_limit: 0.5,
                    level_check_interval: 60
                })
            } catch (e) {
                
                if (e?.err_msg && e.err_msg.includes('缺少必要设备')) {
                    throw new Error(e.err_msg + `。请先配置以下设备（设备名称格式必须为"${farm_name}-设备名"）：\n1. ${farm_name}-施肥泵\n2. ${farm_name}-施肥流量计\n3. ${farm_name}-施肥液位计`)
                }
                throw e
            }
        }
    } catch (e) {
        
        if (e?.err_msg && e.err_msg.includes('缺少必要设备')) {
            throw e
        }
        throw e
    }
}


watch(() => props.devices, () => {
    if (map && !loading.value) {
        initDeviceMarkers()
    }
}, { deep: true })



watch(() => wizardStep.value, (newStep) => {
    if (newStep === 2) {
        
        if (valveDisplayMode.value === 'map') {
            nextTick(() => {
                wateringGroups.value.forEach(group => {
                    initValveSelectionMap(group.name)
                })
            })
        }
    }
})


watch(() => valveDisplayMode.value, (newMode) => {
    if (newMode === 'map' && wizardStep.value === 2) {
        
        const currentGroup = wateringGroups.value[currentGroupIndex.value]
        if (currentGroup && !valveSelectionMaps.value[currentGroup.name]) {
            nextTick(() => {
                initValveSelectionMap(currentGroup.name)
            })
        }
    }
})


watch(() => selectedValveDevices.value, (newValves) => {
    if (valveDisplayMode.value === 'map' && wizardStep.value === 2) {
        
        wateringGroups.value.forEach(group => {
            if (valveSelectionMaps.value[group.name]) {
                updateValveSelectionMarkers(group.name)
            }
        })
    }
}, { deep: true })

watch(() => props.center, (newCenter) => {
    if (map && newCenter) {
        map.setCenter([newCenter.lng, newCenter.lat])
    }
}, { deep: true })


onMounted(() => {
    nextTick(() => {
        initMap()
    })
    
    checkScanStatus()
})


onUnmounted(() => {
    
    stopRuntimeInfoAutoRefresh()

    if (map) {
        
        clearAllLayers()

        
        for (const marker of markers) {
            if (marker) {
                map.remove(marker)
            }
        }
        markers = []

        
        map.destroy()
        map = null
    }
})
</script>

<style scoped>
.interactive-map-container {
    position: relative;
    width: 100%;
    height: 718px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.amap-container {
    width: 100%;
    height: 718px;
}


.unified-control-panel {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 1000;
    display: flex;
    background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 16px;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 2px 8px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    overflow: hidden;
    min-width: 800px;
    max-width: 1000px;
}

.unified-control-panel:hover {
    border-color: rgba(64, 158, 255, 0.3);
    box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.15),
        0 4px 12px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
}


.emergency-section {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 200px;
    border-right: 1px solid rgba(0, 0, 0, 0.06);
}

.section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.section-icon {
    font-size: 16px;
    color: #f56c6c;
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    letter-spacing: 0.5px;
}

.emergency-stop-btn {
    background: linear-gradient(135deg, #ff4757, #ff3742);
    border: none;
    box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
    transition: all 0.3s ease;
    font-weight: 600;
    letter-spacing: 0.5px;
    padding: 0 24px;
    font-size: 14px;
    height: 44px;
    border-radius: 8px;
}

.emergency-stop-btn:hover {
    background: linear-gradient(135deg, #ff3742, #ff2f3a);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(255, 71, 87, 0.4);
}


.control-divider {
    width: 1px;
    background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.1), transparent);
    margin: 16px 0;
}


.policy-section {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
}

.policy-controls {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
}

.period-input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    height: 44px;
    backdrop-filter: blur(5px);
}

.input-label {
    font-size: 13px;
    font-weight: 600;
    color: #606266;
    white-space: nowrap;
}

.period-input {
    width: 90px;
}

.period-input :deep(.el-input__wrapper) {
    height: 32px;
    border-radius: 6px;
}

.input-unit {
    font-size: 11px;
    color: #909399;
    font-weight: 500;
}

.control-buttons {
    display: flex;
    gap: 10px;
    align-items: center;
}

.control-buttons .el-button {
    height: 44px;
    padding: 0 18px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 8px;
}

.status-indicator {
    margin-left: auto;
}

.status-running,
.status-stopped {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 18px;
    font-size: 13px;
    font-weight: 600;
    height: 44px;
    backdrop-filter: blur(5px);
}

.status-running {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.15), rgba(103, 194, 58, 0.08));
    color: #67c23a;
    border: 1px solid rgba(103, 194, 58, 0.3);
}

.status-stopped {
    background: linear-gradient(135deg, rgba(144, 147, 153, 0.15), rgba(144, 147, 153, 0.08));
    color: #909399;
    border: 1px solid rgba(144, 147, 153, 0.3);
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: relative;
}

.status-dot.running {
    background: #67c23a;
    animation: pulse-running 2s infinite;
    box-shadow: 0 0 6px rgba(103, 194, 58, 0.6);
}

.status-dot.stopped {
    background: #909399;
}

@keyframes pulse-running {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.7;
        transform: scale(1.1);
    }
}

.status-text {
    font-weight: 600;
    letter-spacing: 0.5px;
}

.emergency-stop-btn:hover {
    background: linear-gradient(135deg, #ff3742, #ff2f3a);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 71, 87, 0.4);
}

.emergency-stop-btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
}


.map-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.map-type-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-group {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}


.device-info-panel {
    position: absolute;
    top: 20px;
    left: 20px;
    width: 280px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    z-index: 1000;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.panel-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.panel-content {
    padding: 20px;
}

.device-details {
    margin-bottom: 20px;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.detail-item .label {
    font-weight: 500;
    color: #666;
}

.detail-item .value {
    color: #333;
}

.device-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.device-controls-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}

.device-control-row {
    display: flex;
    gap: 8px;
    width: 100%;
}

.full-width-buttons-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}

.half-width-button {
    flex: 1;
    width: calc(50% - 4px);
    margin: 0;
    padding: 0;
}

.full-width-button {
    width: 100% !important;
    box-sizing: border-box;
    margin: 0 !important;
    padding: 0;
}


:deep(.full-width-button) {
    width: 100% !important;
    margin: 0 !important;
    box-sizing: border-box !important;
}

:deep(.half-width-button) {
    flex: 1 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
}


.runtime-info-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.runtime-info-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.runtime-info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(64, 158, 255, 0.03) 100%);
    border-radius: 8px;
    border-left: 4px solid #409eff;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.runtime-info-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #409eff, #67c23a);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.runtime-info-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.runtime-info-item:hover::before {
    opacity: 1;
}

.info-label {
    font-weight: 500;
    color: #666;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.info-label::before {
    content: '●';
    color: #409eff;
    font-size: 8px;
}

.info-value {
    font-weight: 600;
    color: #333;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(64, 158, 255, 0.2);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.info-value:hover {
    background: rgba(64, 158, 255, 0.1);
    border-color: #409eff;
}


.online-status-item {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.08) 0%, rgba(103, 194, 58, 0.03) 100%) !important;
    border-left: 4px solid #67c23a !important;
}

.online-status-item .status-icon {
    font-size: 14px;
    margin-right: 6px;
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
    font-weight: 700;
}

.online-status-item .info-value.offline {
    background: rgba(245, 108, 108, 0.1) !important;
    border-color: #f56c6c !important;
    color: #f56c6c !important;
    font-weight: 700;
}

.online-status-item .info-value.online:hover {
    background: rgba(103, 194, 58, 0.2) !important;
    border-color: #67c23a !important;
}

.online-status-item .info-value.offline:hover {
    background: rgba(245, 108, 108, 0.2) !important;
    border-color: #f56c6c !important;
}


.runtime-info-section.loading .runtime-info-item {
    opacity: 0.6;
    pointer-events: none;
}

.runtime-info-section.loading .info-value {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
    0% {
        background-position: -200% 0;
    }

    100% {
        background-position: 200% 0;
    }
}


.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.loading-overlay p {
    margin-top: 10px;
    color: #666;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #409eff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}


:deep(.device-marker) {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 25px;
    padding: 8px 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 2px solid #e0e0e0;
    backdrop-filter: blur(10px);
    min-width: 200px;
}

:deep(.device-marker:hover) {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    border-color: #409eff;
}

:deep(.marker-icon) {
    width: 50px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    flex-shrink: 0;
    background: #f8f9fa;
    border: 2px solid #dee2e6;
}

:deep(.marker-icon img) {
    width: 28px;
    height: 28px;
    object-fit: contain;
    border-radius: 50%;
}

:deep(.marker-info) {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

:deep(.device-name) {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #2c3e50;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
    line-height: 1.2;
}

:deep(.marker-name) {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #303133;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
    line-height: 1.2;
    margin-left: 4px;
}


:deep(.device-marker .marker-icon) {
    border-color: #dee2e6;
    background: #f8f9fa;
}


:deep(.device-marker.active) {
    border-color: #67c23a !important;
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

:deep(.device-marker.active .marker-icon) {
    border-color: #67c23a !important;
    background: rgba(103, 194, 58, 0.2) !important;
    animation: pulse-green 2s infinite;
}

:deep(.device-marker.inactive) {
    border-color: #f56c6c !important;
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

:deep(.device-marker.inactive .marker-icon) {
    border-color: #f56c6c !important;
    background: rgba(245, 108, 108, 0.2) !important;
}


:deep(.device-marker.online) {
    border-color: #67c23a !important;
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

:deep(.device-marker.online .marker-icon) {
    border-color: #67c23a !important;
    background: rgba(103, 194, 58, 0.2) !important;
    animation: pulse-green 2s infinite;
}

:deep(.device-marker.offline) {
    border-color: #f56c6c !important;
    box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

:deep(.device-marker.offline .marker-icon) {
    border-color: #f56c6c !important;
    background: rgba(245, 108, 108, 0.2) !important;
}


@keyframes pulse-green {
    0% {
        box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.4);
    }

    70% {
        box-shadow: 0 0 0 6px rgba(103, 194, 58, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(103, 194, 58, 0);
    }
}


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


.policy-config-dialog {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
}

.policy-config-dialog .el-dialog {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin: 0 !important;
    max-height: 90vh !important;
    overflow-y: auto !important;
}

.policy-config-dialog .el-dialog__wrapper {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 2000 !important;
}

.policy-config-wizard {
    padding: 20px 0;
}

.wizard-step-content {
    margin: 30px 0;
    min-height: 400px;
}

.step-header {
    margin-bottom: 24px;
    text-align: center;
}

.step-header h3 {
    margin: 0 0 8px 0;
    color: #303133;
    font-size: 20px;
    font-weight: 600;
}

.step-header p {
    margin: 0;
    color: #606266;
    font-size: 14px;
}

.no-devices-warning {
    margin-top: 16px;
}


.watering-groups-config {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
}

.groups-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    font-weight: 600;
    color: #303133;
}


.existing-groups-section {
    margin-bottom: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #e3f2fd 0%, #f5f7fa 100%);
    border-radius: 8px;
    border: 1px solid #b3d8ff;
}

.existing-groups-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: 600;
    color: #303133;
    font-size: 14px;
}

.groups-count {
    color: #409eff;
    font-size: 12px;
    font-weight: 500;
}

.existing-groups-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.existing-group-btn {
    transition: all 0.3s ease;
    flex: 1;
    min-width: 0;
}

.existing-group-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.existing-group-btn .btn-text {
    margin-left: 4px;
}

.existing-group-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    width: 100%;
}

.existing-group-item:last-child {
    margin-bottom: 0;
}

.view-group-btn {
    flex-shrink: 0;
    width: auto;
}


:deep(.group-detail-popover) {
    padding: 0 !important;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border: 1px solid #e4e7ed;
    overflow: hidden;
}

.group-detail-popover-content {
    padding: 12px;
    max-height: 60vh;
    overflow-y: auto;
}

.popover-header {
    margin: -12px -12px 12px -12px;
    padding: 10px 12px;
    border-bottom: 2px solid #409eff;
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
}

.popover-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.detail-section {
    margin-bottom: 12px;
    padding: 10px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.detail-section:last-child {
    margin-bottom: 0;
}

.detail-section .section-title {
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    padding-bottom: 6px;
    border-bottom: 2px solid #409eff;
    display: flex;
    align-items: center;
}

.detail-section .section-title::before {
    content: '';
    width: 3px;
    height: 14px;
    background: linear-gradient(135deg, #409eff, #67c23a);
    border-radius: 2px;
    margin-right: 6px;
}

.detail-row {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    padding: 6px 8px;
    background: #ffffff;
    border-radius: 4px;
    border-left: 2px solid #409eff;
    transition: all 0.2s ease;
}

.detail-row:hover {
    background: #f0f9ff;
    transform: translateX(1px);
}

.detail-row:last-child {
    margin-bottom: 0;
}

.detail-label {
    min-width: 110px;
    font-weight: 500;
    color: #606266;
    font-size: 13px;
    flex-shrink: 0;
}

.detail-value {
    color: #303133;
    font-size: 13px;
    font-weight: 500;
    flex: 1;
    text-align: right;
    padding-left: 8px;
}

.valves-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
    padding: 8px;
    background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
    border-radius: 6px;
    border: 1px solid #b3d8ff;
}

.valve-tag {
    margin: 0;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
}

.no-data {
    color: #909399;
    font-size: 12px;
    font-style: italic;
    padding: 10px;
    text-align: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #fafafa 100%);
    border-radius: 6px;
    border: 1px dashed #d3d4d6;
    margin-bottom: 8px;
}

.group-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    margin-bottom: 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    transition: all 0.2s ease;
}

.group-item:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.group-item:last-child {
    margin-bottom: 0;
}

.group-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.group-info .unit {
    color: #909399;
    font-size: 14px;
}

.recommended-area {
    margin-left: 10px;
    padding: 4px 8px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    color: #999;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s;
}

.recommended-area.has-recommendation {
    background-color: #fff3cd;
    border-color: #ffc107;
    color: #856404;
    font-weight: 500;
}

.recommended-area:hover {
    background-color: #ffc107;
    border-color: #ffc107;
    color: #fff;
}


:deep(.area-params-popover) {
    max-width: 400px;
}

.area-params-content {
    padding: 10px;
}

.params-header h4 {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: #333;
}

.params-formula {
    margin: 10px 0;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
}

.params-formula p {
    margin: 5px 0;
    font-size: 13px;
}

.formula-text {
    font-family: 'Courier New', monospace;
    color: #666;
    font-size: 12px;
}

.params-list {
    margin: 15px 0;
}

.param-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.param-label {
    width: 100px;
    font-size: 13px;
    color: #666;
    flex-shrink: 0;
}

.params-result {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
}

.params-result p {
    margin: 0;
    font-size: 14px;
}

.params-result strong {
    color: #409eff;
    font-size: 16px;
}


.device-allocation {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
}


.group-switcher {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding: 12px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
}

.group-counter {
    font-weight: 600;
    color: #303133;
    font-size: 14px;
    min-width: 60px;
    text-align: center;
}

.group-device-config {
    margin-bottom: 20px;
    padding: 16px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
    transition: all 0.3s ease;
}

.group-device-config.active {
    border-color: #409eff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.group-device-config.hidden {
    display: none;
}

.group-device-config:last-child {
    margin-bottom: 0;
}

.group-device-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.group-device-header h4 {
    margin: 0;
    color: #303133;
    font-size: 16px;
    font-weight: 600;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}


.display-mode-tabs {
    margin: 0;
}

:deep(.display-mode-tabs .el-tabs__header) {
    margin: 0;
}

:deep(.display-mode-tabs .el-tabs__nav-wrap) {
    margin: 0;
}

:deep(.display-mode-tabs .el-tabs__item) {
    padding: 0 16px;
    height: 32px;
    line-height: 32px;
    font-size: 13px;
}


.valve-selection-list-container {
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    background: white;
}

.valve-list-header {
    padding: 12px 16px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.valve-list-header .info-text {
    color: #606266;
    font-size: 14px;
    font-weight: 500;
}

.list-actions {
    display: flex;
    gap: 8px;
}

.valve-list-content {
    max-height: 500px;
    overflow-y: auto;
    padding: 8px;
}

.valve-checkbox-group {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.valve-list-item {
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    transition: all 0.2s ease;
    background: white;
}

.valve-list-item:hover {
    border-color: #409eff;
    background: #f0f9ff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.valve-list-item.selected {
    border-color: #409eff;
    background: #ecf5ff;
}

.valve-checkbox {
    width: 100%;
    margin: 0;
}

:deep(.valve-checkbox .el-checkbox__label) {
    width: 100%;
    padding-left: 8px;
}

.valve-item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.valve-item-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.valve-name {
    font-weight: 600;
    color: #303133;
    font-size: 14px;
}

.valve-label {
    font-size: 12px;
    color: #909399;
}

.valve-item-meta {
    display: flex;
    align-items: center;
    gap: 12px;
}

.valve-coords {
    font-size: 12px;
    color: #909399;
}

.valve-selection-map-container {
    margin-top: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
}

.valve-selection-map {
    width: 100%;
    height: 400px;
    min-height: 400px;
}

.selected-valves-info {
    padding: 12px 16px;
    background: #f5f7fa;
    border-top: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.selected-valves-info .info-text {
    color: #606266;
    font-size: 14px;
}


:deep(.device-marker.valve-selected) {
    border-color: #409eff !important;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5) !important;
}

:deep(.device-marker.valve-selected .marker-icon) {
    border-color: #409eff !important;
    background: rgba(64, 158, 255, 0.3) !important;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4) !important;
}

.group-device-config h4 {
    margin: 0 0 12px 0;
    color: #303133;
    font-size: 16px;
    font-weight: 600;
}


.fert-config {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
}

.group-fert-config {
    margin-bottom: 24px;
    padding: 20px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e4e7ed;
}

.group-fert-config:last-child {
    margin-bottom: 0;
}

.group-fert-config h4 {
    margin: 0 0 16px 0;
    color: #303133;
    font-size: 16px;
    font-weight: 600;
    padding-bottom: 8px;
    border-bottom: 1px solid #e4e7ed;
}

.fert-method {
    margin-bottom: 16px;
}

.fert-method label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #303133;
}

.fert-params {
    margin-bottom: 16px;
}

.time-params {
    display: flex;
    gap: 20px;
}

.param-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.param-item label {
    font-weight: 600;
    color: #303133;
    min-width: 80px;
}

.param-item .unit {
    color: #909399;
    font-size: 14px;
}


.wizard-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding-top: 24px;
    border-top: 1px solid #e4e7ed;
    margin-top: 30px;
}

.wizard-actions .el-button {
    min-width: 100px;
}


:deep(.fullscreen-map-dialog) {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
}

:deep(.fullscreen-map-dialog .el-dialog) {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
}

:deep(.fullscreen-map-dialog .el-dialog__body) {
    padding: 0 !important;
    height: calc(100vh - 60px) !important;
    overflow: hidden !important;
}

.fullscreen-map-container {
    width: 100%;
    height: 100%;
    position: relative;
}

.fullscreen-valve-map {
    width: 100%;
    height: calc(100vh - 120px);
    min-height: 600px;
}

.fullscreen-map-info {
    position: absolute;
    bottom: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    z-index: 1000;
    font-size: 14px;
    color: #303133;
    font-weight: 500;
}

.fullscreen-map-info span {
    margin-right: 20px;
}


@media (max-width: 768px) {
    .map-controls {
        top: 10px;
        right: 10px;
    }

    .emergency-stop-control {
        top: 10px;
        left: 10px;
    }

    .device-info-panel {
        top: 10px;
        left: 10px;
        width: calc(100% - 20px);
        max-width: 300px;
    }

    .control-group {
        flex-direction: column;
    }

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
</style>
