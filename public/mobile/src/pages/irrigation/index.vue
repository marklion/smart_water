<template>
    <view class="page">
        <!-- 顶部标题栏 -->
        <PageHeader ref="pageHeaderRef" :show-farm-selector="true" @farm-change="onFarmChange" />
        <view class="top-add-btn" @click="openCreateForm(false)">
            <text class="plus-icon">+</text>
        </view>

        <!-- 主要内容区域 - 使用 scroll-view 支持滚动 -->
        <scroll-view class="content-scroll" scroll-y :enable-flex="true" :scroll-with-animation="true">
            <view class="content">
                <!-- 当前方案运行状态 -->
                <view class="current-scheme-card">
                    <view class="scheme-row">
                        <view class="scheme-title">当前方案</view>
                        <view class="scheme-name">{{ selectedSchemeId || '未选择' }}</view>
                        <view class="scheme-status" :class="isRunning ? 'running' : 'stopped'">
                            {{ isRunning ? '运行中' : '未运行' }}
                        </view>
                    </view>
                    <view class="scheme-progress">
                        <view class="progress-track">
                            <view class="progress-bar" :class="{ active: isRunning }" :style="{ width: isRunning ? '100%' : '0%' }"></view>
                        </view>
                    </view>
                </view>

                <!-- 方案控制部分 -->
                <view class="policy-control-section">
                    <view class="section-header">
                        <fui-text :text="'方案控制'" :size="30" :fontWeight="600" color="#303133"></fui-text>
                    </view>
                    <view class="policy-controls">
                        <view class="control-buttons-row">
                            <view class="control-btn info" @tap.stop="showSchemeDialog">
                                <fui-text :text="'查看所有方案'" :size="24" color="#fff"></fui-text>
                            </view>
                        </view>
                        <view class="control-buttons-row">
                            <view class="control-btn primary" @tap.stop="runSchemeNow" 
                                :class="{ disabled: !selectedSchemeId || isRunning, loading: runNowLoading }">
                                <fui-text :text="'立即运行'" :size="24" color="#fff"></fui-text>
                            </view>
                            <view class="control-btn warning" @tap.stop="showScheduleDialog" 
                                :class="{ disabled: !selectedSchemeId || isRunning }">
                                <fui-text :text="'定时运行'" :size="24" color="#fff"></fui-text>
                            </view>
                        </view>
                        <view class="control-buttons-row">
                            <view class="control-btn danger" @tap.stop="stopScheme" 
                                :class="{ disabled: !selectedSchemeId, loading: stopSchemeLoading }">
                                <fui-text :text="'停止'" :size="24" color="#fff"></fui-text>
                            </view>
                        </view>
                        <!-- 显示定时运行时间 -->
                        <view v-if="nextRunTime" class="schedule-time-info">
                            <text class="schedule-icon">🕐</text>
                            <fui-text :text="`定时运行：${nextRunTime}`" :size="24" color="#856404"></fui-text>
                            <text class="cancel-icon" @tap.stop="cancelScheduledRun">✕</text>
                        </view>
                    </view>
                </view>

                <!-- 搅拌策略部分 -->
                <view v-if="currentFarmName" class="mixing-strategy-section">
                    <view class="section-header">
                        <fui-text :text="'搅拌策略'" :size="30" :fontWeight="600" color="#303133"></fui-text>
                    </view>
                    <view class="mixing-strategy-card">
                        <view class="mixing-inputs-row">
                            <view class="mixing-input-item">
                                <view class="input-label">
                                    <fui-text :text="'搅拌间隔'" :size="24" color="#606266"></fui-text>
                                </view>
                                <fui-input v-model="mixingStartInterval" 
                                    type="number" placeholder="60" 
                                    :maxlength="4" :borderColor="'#e4e7ed'" />
                            </view>
                            <view class="mixing-input-item">
                                <view class="input-label">
                                    <fui-text :text="'持续时间'" :size="24" color="#606266"></fui-text>
                                </view>
                                <fui-input v-model="mixingDuration" 
                                    type="number" placeholder="6" 
                                    :maxlength="4" :borderColor="'#e4e7ed'" />
                            </view>
                        </view>

                        <!-- 显示定时运行时间 -->
                        <view v-if="mixingNextRunTime" class="mixing-schedule-info">
                            <text class="schedule-icon">🕐</text>
                            <fui-text :text="`定时运行：${mixingNextRunTime}`" :size="24" color="#856404"></fui-text>
                            <text class="cancel-icon" @tap.stop="cancelMixingScheduledRun">✕</text>
                        </view>

                        <view class="mixing-buttons-row">
                            <view class="control-btn primary" @tap.stop="startMixing" 
                                :class="{ disabled: isMixingRunning, loading: mixingStartLoading }">
                                <fui-text :text="'启动'" :size="24" color="#fff"></fui-text>
                            </view>
                            <view class="control-btn warning" @tap.stop="showMixingScheduleDialog" 
                                :class="{ disabled: isMixingRunning }">
                                <fui-text :text="'定时启动'" :size="24" color="#fff"></fui-text>
                            </view>
                        </view>
                        <view class="mixing-buttons-row">
                            <view class="control-btn danger" @tap.stop="stopMixing" 
                                :class="{ disabled: !isMixingRunning, loading: mixingStopLoading }">
                                <fui-text :text="'停止'" :size="24" color="#fff"></fui-text>
                            </view>
                            <view class="control-btn success" @tap.stop="applyMixingPolicy" 
                                :class="{ loading: mixingSaving }">
                                <fui-text :text="'保存'" :size="24" color="#fff"></fui-text>
                            </view>
                        </view>
                    </view>
                </view>

                <view class="section-title-row">
                    <fui-text :text="'轮灌组运行状态'" :size="30" :fontWeight="600" color="#303133"></fui-text>
                </view>

                <!-- 灌溉组搜索过滤 -->
                <view class="filter-bar">
                    <view class="filter-input">
                        <text class="search-icon">🔍</text>
                        <input v-model="groupSearch" placeholder="搜索: 灌溉名称" />
                        <view v-if="groupSearch" class="reset-btn" @click="groupSearch = ''">重置</view>
                    </view>
                    <view class="filter-status">
                        <view v-if="loading" class="mini-loading">
                            <view class="dot"></view>
                            <view class="dot"></view>
                            <view class="dot"></view>
                            <text>加载中</text>
                        </view>
                        <fui-text v-else :text="`共 ${filteredGroups.length} 组`" :size="22" color="#909399"></fui-text>
                    </view>
                </view>

                <view v-if="loading" class="loading-block">
                    <fui-text :text="'加载中...'" :size="28" color="#606266"></fui-text>
                </view>
                <view v-else-if="filteredGroups.length === 0" class="empty-block">
                    <image class="empty-icon" src="/static/tabbar/Irrigation.png" mode="widthFix" />
                    <fui-text :text="'暂无轮灌组，请先新增或在PC配置后刷新'" :size="26" color="#909399"></fui-text>
                </view>
                <view v-else class="group-list">
                    <view v-for="group in filteredGroups" :key="group.name" class="group-card" :class="getCardStatusClass(group.cur_state)">
                        <view class="group-header">
                            <view class="group-title">
                                <fui-text :text="group.name" :size="32" :fontWeight="600" :color="getTextColor(group.cur_state)"></fui-text>
                                <view class="view-config-btn" @click="viewPolicyConfig(group.name)">
                                    <text class="eye-icon">👁</text>
                                </view>
                            </view>
                            <view class="group-state" :class="statusClass(group.cur_state)">
                                <fui-text :text="group.cur_state || '未知'" :size="22" color="#fff"></fui-text>
                            </view>
                        </view>
                        <view class="group-meta">
                            <view class="meta-item">
                                <view class="meta-label">面积(亩)</view>
                                <fui-text :text="formatNumber(group.area)" :size="24" :color="getTextColor(group.cur_state)"></fui-text>
                            </view>
                            <view class="meta-item">
                                <view class="meta-label">方式</view>
                                <fui-text :text="group.method || '-'" :size="24" :color="getTextColor(group.cur_state)"></fui-text>
                            </view>
                            <view class="meta-item">
                                <view class="meta-label">施肥率(L/亩)</view>
                                <fui-text :text="formatNumber(group.fert_rate)" :size="24" :color="getTextColor(group.cur_state)"></fui-text>
                            </view>
                        </view>
                        <view class="group-meta">
                            <view class="meta-item">
                                <view class="meta-label">总水量(L)</view>
                                <fui-text :text="formatNumber(group.total_water)" :size="24" :color="getTextColor(group.cur_state)"></fui-text>
                            </view>
                            <view class="meta-item">
                                <view class="meta-label">总肥量(L)</view>
                                <fui-text :text="formatNumber(group.total_fert)" :size="24" :color="getTextColor(group.cur_state)"></fui-text>
                            </view>
                            <view class="meta-item">
                                <view class="meta-label">剩余时间(分)</view>
                                <fui-text :text="formatNumber(group.minute_left)" :size="24" :color="getTextColor(group.cur_state)"></fui-text>
                            </view>
                        </view>
                        <view class="valves-row">
                            <view class="meta-label">阀门</view>
                            <view class="valves-tags" v-if="group.valveList.length">
                                <view v-for="(v, idx) in group.valveList" :key="idx" class="valve-tag">{{ v }}</view>
                            </view>
                            <fui-text v-else :text="'-'" :size="24" color="#909399"></fui-text>
                        </view>

                        <view class="card-actions">
                            <view v-if="waterOnlyMode[group.name]" class="water-only-btn active">
                                <fui-text :text="'只浇水 ✓'" :size="24" color="#fff"></fui-text>
                            </view>
                            <view class="action-buttons-row">
                                <view class="action-btn success" @click="handleQuickAction(group.name, '启动')"
                                    :class="{ loading: quickActionLoading[`${group.name}-启动`] }">
                                    <fui-text :text="'启动'" :size="24" color="#fff"></fui-text>
                                </view>
                                <view class="action-btn warning" @click="handleQuickAction(group.name, '跳过')"
                                    :class="{ loading: quickActionLoading[`${group.name}-跳过`] }">
                                    <fui-text :text="'跳过'" :size="24" color="#fff"></fui-text>
                                </view>
                            </view>
                            <view class="action-btn danger" @click="handleQuickAction(group.name, '停止')"
                                :class="{ loading: quickActionLoading[`${group.name}-停止`] }">
                                <fui-text :text="'停止'" :size="24" color="#fff"></fui-text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>

        <!-- 轮灌组向导弹层 -->
        <view v-if="formVisible" class="form-mask" @click.self="closeForm">
            <view class="form-panel wide">
                <view class="form-header">
                    <fui-text :text="formMode === 'copy' ? '复制轮灌组' : '新增轮灌组'" :size="30" :fontWeight="600"
                        color="#303133"></fui-text>
                    <view class="close" @click="closeForm">×</view>
                </view>

                <view class="step-indicator">
                    <view :class="['step-dot', wizardStep === 1 ? 'active' : '']">1</view>
                    <view class="step-label">基础信息</view>
                    <view class="step-line"></view>
                    <view :class="['step-dot', wizardStep === 2 ? 'active' : '']">2</view>
                    <view class="step-label">分配阀门</view>
                    <view class="step-line"></view>
                    <view :class="['step-dot', wizardStep === 3 ? 'active' : '']">3</view>
                    <view class="step-label">确认下发</view>
                </view>

                <view class="form-body">
                    <!-- Step 1 基础信息 -->
                    <view v-if="wizardStep === 1" class="step-content step-page">
                        <view class="form-item">
                            <view class="form-label">名称</view>
                            <input class="form-input" v-model="formData.name" placeholder="请输入轮灌组名称" />
                        </view>
                        <view class="form-item">
                            <view class="form-label">面积(亩)</view>
                            <view class="inline-row">
                                <input class="form-input flex-1" v-model.number="formData.area" type="number"
                                    placeholder="必填，>0" />
                                <view v-if="suggestedArea" class="suggest-btn" @click="useSuggestedArea">
                                    <text>用建议值({{ suggestedArea }})</text>
                                </view>
                            </view>
                        </view>
                        <view class="form-item">
                            <view class="form-label">灌溉方式</view>
                            <picker mode="selector" :range="methodOptions" range-key="label" @change="onMethodChange">
                                <view class="picker-value">{{ getMethodLabel(formData.method) }}</view>
                            </picker>
                        </view>
                        <view v-if="formData.method === 'AreaBased'" class="form-item">
                            <view class="form-label">亩定量(L/亩)</view>
                            <input class="form-input" v-model.number="formData.AB_fert" type="number"
                                placeholder="亩定量模式时必填" />
                        </view>
                        <view v-if="formData.method === 'Total'" class="form-item">
                            <view class="form-label">总定量(L)</view>
                            <input class="form-input" v-model.number="formData.total_fert" type="number"
                                placeholder="总定量模式时必填" />
                        </view>
                        <view v-if="formData.method === 'WaterOnly'" class="form-item">
                            <view class="form-label">总灌溉时间(分钟)</view>
                            <input class="form-input" v-model.number="formData.total_time" type="number"
                                placeholder="只浇水模式时必填" />
                        </view>
                        <template v-else>
                            <view v-if="formData.method === 'Time'" class="form-item">
                                <view class="form-label">施肥时间(分钟)</view>
                                <input class="form-input" v-model.number="formData.fert_time" type="number"
                                    placeholder="定时模式时必填" />
                            </view>
                            <view class="form-item">
                                <view class="form-label">肥前时间(分钟)</view>
                                <input class="form-input" v-model.number="formData.pre_fert_time" type="number"
                                    placeholder="必填，>=0" />
                            </view>
                            <view class="form-item">
                                <view class="form-label">肥后时间(分钟)</view>
                                <input class="form-input" v-model.number="formData.post_fert_time" type="number"
                                    placeholder="必填，>=0" />
                            </view>
                        </template>
                    </view>

                    <!-- Step 2 分配阀门 -->
                    <view v-else-if="wizardStep === 2" class="step-content step-page">
                        <view class="form-item">
                            <view class="form-label">分配阀门</view>
                            <view class="tabs">
                                <view :class="['tab', valveView === 'list' ? 'active' : '']"
                                    @click="valveView = 'list'">
                                    列表
                                </view>
                                <view :class="['tab', valveView === 'map' ? 'active' : '']" @click="valveView = 'map'">
                                    地图
                                </view>
                            </view>
                            <view class="tips-text">从 WaterGroupValve / WaterGroupValve_v2 设备中选择，至少1个。</view>
                        </view>
                        <view v-if="valveLoading" class="loading-block small">
                            <fui-text :text="'加载阀门设备中...'" :size="26" color="#606266"></fui-text>
                        </view>
                        <view v-else-if="availableValves.length === 0" class="empty-block small">
                            <fui-text :text="'暂无可选阀门，请先在设备里配置 WaterGroupValve 类设备'" :size="24"
                                color="#909399"></fui-text>
                        </view>
                        <template v-else>
                            <view v-if="valveView === 'list'" class="valve-list">
                                <view v-for="v in availableValves" :key="v.device_name" class="valve-item"
                                    :class="{ checked: isValveSelected(v.device_name) }"
                                    @click="toggleValve(v.device_name)">
                                    <view class="valve-name">{{ v.device_name }}</view>
                                    <view class="valve-meta">经纬度: {{ v.longitude || '-' }}, {{ v.latitude || '-' }}
                                    </view>
                                    <view class="check-indicator">{{ isValveSelected(v.device_name) ? '✓' : '' }}</view>
                                </view>
                            </view>
                            <view v-else class="map-wrapper">
                                <map class="valve-map" :latitude="mapCenter.lat" :longitude="mapCenter.lng"
                                    :scale="mapScale" :markers="mapMarkers" @markertap="onMarkerTap"></map>
                                <view class="map-legend">点击标记以选择/取消阀门</view>
                            </view>
                        </template>
                    </view>

                    <!-- Step 3 确认 -->
                    <view v-else class="step-content step-page">
                        <view class="form-item">
                            <view class="form-label">开始时间</view>
                            <picker mode="time" :value="startTime" @change="onTimeChange">
                                <view class="picker-value">{{ startTime }}</view>
                            </picker>
                        </view>
                        <view class="summary-card">
                            <view class="summary-row">
                                <view class="summary-label">名称</view>
                                <view class="summary-value">{{ formData.name || '-' }}</view>
                            </view>
                            <view class="summary-row">
                                <view class="summary-label">面积(亩)</view>
                                <view class="summary-value">{{ formData.area || '-' }}</view>
                            </view>
                            <view class="summary-row">
                                <view class="summary-label">方式</view>
                                <view class="summary-value">{{ getMethodLabel(formData.method) }}</view>
                            </view>
                            <view v-if="formData.method === 'AreaBased'" class="summary-row">
                                <view class="summary-label">亩定量</view>
                                <view class="summary-value">{{ formData.AB_fert ?? '-' }}</view>
                            </view>
                            <view v-if="formData.method === 'Total'" class="summary-row">
                                <view class="summary-label">总定量</view>
                                <view class="summary-value">{{ formData.total_fert ?? '-' }}</view>
                            </view>
                            <view v-if="formData.method === 'WaterOnly'" class="summary-row">
                                <view class="summary-label">总灌溉时间</view>
                                <view class="summary-value">{{ formData.total_time ?? '-' }}</view>
                            </view>
                            <template v-else>
                                <view v-if="formData.method === 'Time'" class="summary-row">
                                    <view class="summary-label">施肥时间</view>
                                    <view class="summary-value">{{ formData.fert_time ?? '-' }}</view>
                                </view>
                                <view class="summary-row">
                                    <view class="summary-label">肥前时间</view>
                                    <view class="summary-value">{{ formData.pre_fert_time ?? 0 }}</view>
                                </view>
                                <view class="summary-row">
                                    <view class="summary-label">肥后时间</view>
                                    <view class="summary-value">{{ formData.post_fert_time ?? 0 }}</view>
                                </view>
                            </template>
                            <view class="summary-row">
                                <view class="summary-label">阀门</view>
                                <view class="summary-tags" v-if="selectedValves.length">
                                    <view v-for="v in selectedValves" :key="v" class="valve-tag small">{{ v }}</view>
                                </view>
                                <view class="summary-value" v-else>-</view>
                            </view>
                        </view>
                    </view>
                </view>

                <view class="form-actions fixed">
                    <view class="action-btn ghost" @click="closeForm">
                        <fui-text :text="'关闭'" :size="28" color="#606266"></fui-text>
                    </view>
                    <view v-if="wizardStep > 1" class="action-btn ghost" @click="prevWizardStep">
                        <fui-text :text="'上一步'" :size="28" color="#606266"></fui-text>
                    </view>
                    <view v-if="wizardStep < 3" class="action-btn primary" :class="{ disabled: submitting }"
                        @click="nextWizardStep">
                        <fui-text :text="submitting ? '处理中...' : '下一步'" :size="28" color="#fff"></fui-text>
                    </view>
                    <view v-else class="action-btn primary" :class="{ disabled: submitting }" @click="submitForm">
                        <fui-text :text="submitting ? '下发中...' : '下发策略'" :size="28" color="#fff"></fui-text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 加载组件 -->
        <Loading :show="pageLoading" text="加载中..." />

        <!-- 方案选择对话框 -->
        <fui-dialog :show="schemeDialogVisible" title="选择方案" :buttons="schemeDialogButtons"
            :maskClosable="true" @click="handleSchemeDialogClick" @close="closeSchemeDialog">
            <view class="scheme-dialog-content">
                <view v-if="schemeListLoading" class="scheme-loading">
                    <fui-text :text="'加载中...'" :size="28" color="#909399"></fui-text>
                </view>
                <view v-else-if="schemeList.length === 0" class="scheme-empty">
                    <fui-text :text="'暂无方案，请先创建方案'" :size="28" color="#909399"></fui-text>
                </view>
                <view v-else class="scheme-list">
                    <view v-for="scheme in schemeList" :key="scheme.name" 
                        class="scheme-item" 
                        :class="{ 'is-selected': String(tempSelectedSchemeId) === String(scheme.name) }"
                        @click="selectSchemeInDialog(scheme.name)">
                        <view class="scheme-name">{{ scheme.name }}</view>
                        <view v-if="scheme.wateringGroups && scheme.wateringGroups.length > 0" class="scheme-groups">
                            <fui-text :text="'轮灌组：'" :size="24" color="#909399"></fui-text>
                            <view class="groups-tags">
                                <view v-for="group in scheme.wateringGroups" :key="group" class="group-tag">
                                    <fui-text :text="group" :size="22" color="#409eff"></fui-text>
                                </view>
                            </view>
                        </view>
                        <view v-if="String(tempSelectedSchemeId) === String(scheme.name)" class="check-icon">✓</view>
                    </view>
                </view>
            </view>
        </fui-dialog>

        <!-- 搅拌策略定时启动对话框 -->
        <fui-dialog :show="mixingScheduleDialogVisible" title="搅拌策略定时启动设置" 
            :buttons="mixingScheduleDialogButtons"
            :maskClosable="true" @click="handleMixingScheduleDialogClick" @close="closeMixingScheduleDialog">
            <view class="schedule-dialog-content">
                <view class="form-item">
                    <view class="form-label">启动时间</view>
                    <picker mode="date" :value="mixingScheduledDate" @change="onMixingScheduleDateChange">
                        <view class="picker-value">{{ mixingScheduledDate || '选择日期' }}</view>
                    </picker>
                    <picker mode="time" :value="mixingScheduledTimeOnly" @change="onMixingScheduleTimeChange">
                        <view class="picker-value">{{ mixingScheduledTimeOnly || '选择时间' }}</view>
                    </picker>
                </view>
            </view>
        </fui-dialog>

        <!-- 定时运行对话框 -->
        <fui-dialog :show="scheduleDialogVisible" title="定时运行设置" :buttons="scheduleDialogButtons"
            :maskClosable="true" @click="handleScheduleDialogClick" @close="closeScheduleDialog">
            <view class="schedule-dialog-content">
                <view class="form-item">
                    <view class="form-label">运行时间</view>
                    <picker mode="date" :value="scheduleDate" @change="onScheduleDateChange">
                        <view class="picker-value">{{ scheduleDate || '选择日期' }}</view>
                    </picker>
                    <picker mode="time" :value="scheduleTime" @change="onScheduleTimeChange">
                        <view class="picker-value">{{ scheduleTime || '选择时间' }}</view>
                    </picker>
                </view>
            </view>
        </fui-dialog>

        <!-- 策略配置查看对话框 -->
        <fui-dialog :show="showPolicyConfigDialog" :title="policyConfigTitle" :buttons="policyConfigButtons"
            :maskClosable="true" @click="handlePolicyConfigDialogClick" @close="closePolicyConfigDialog">
            <view class="policy-config-content">
                <view v-if="policyConfigLoading" class="config-loading">
                    <fui-text :text="'加载中...'" :size="28" color="#909399"></fui-text>
                </view>
                <view v-else-if="policyConfigError" class="config-error">
                    <fui-text :text="policyConfigError" :size="28" color="#f56c6c"></fui-text>
                </view>
                <view v-else-if="policyConfigData" class="config-details">
                    <!-- 基本信息 -->
                    <view class="config-section">
                        <fui-text :text="'基本信息'" :size="30" :fontWeight="600" color="#303133"
                            :padding="[0, 0, 16, 0]"></fui-text>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'轮灌组名称：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="policyConfigData.name" :size="26" color="#303133"></fui-text>
                            </view>
                        </view>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'面积：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.area || 0) + ' 亩'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                    </view>

                    <!-- 阀门配置 -->
                    <view class="config-section">
                        <fui-text :text="'阀门配置'" :size="30" :fontWeight="600" color="#303133"
                            :padding="[0, 0, 16, 0]"></fui-text>
                        <view v-if="policyConfigData.valves && policyConfigData.valves.length > 0"
                            class="valves-config">
                            <view v-for="(valve, idx) in policyConfigData.valves" :key="idx" class="valve-config-tag">
                                <fui-text :text="valve" :size="24" color="#409eff"></fui-text>
                            </view>
                        </view>
                        <view v-else class="config-empty-item">
                            <fui-text :text="'未配置阀门'" :size="26" color="#909399"></fui-text>
                        </view>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'阀门数量：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.valves?.length || 0) + ' 个'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                    </view>

                    <!-- 施肥配置 -->
                    <view class="config-section">
                        <fui-text :text="'施肥配置'" :size="30" :fontWeight="600" color="#303133"
                            :padding="[0, 0, 16, 0]"></fui-text>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'施肥方式：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="getFertMethodLabel(policyConfigData.fertConfig?.method)" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view v-if="policyConfigData.fertConfig?.method === 'AreaBased'" class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'亩定量：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.AB_fert || 0) + ' L/亩'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view v-if="policyConfigData.fertConfig?.method === 'Total'" class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'总定量：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.total_fert || 0) + ' L'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view v-if="policyConfigData.fertConfig?.method === 'Time'" class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'施肥时间：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.fert_time || 0) + ' 分钟'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'肥前时间：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.pre_fert_time || 0) + ' 分钟'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'肥后时间：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.post_fert_time || 0) + ' 分钟'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                        <view class="config-item">
                            <view class="config-item-label">
                                <fui-text :text="'总灌溉时间：'" :size="26" color="#606266"></fui-text>
                            </view>
                            <view class="config-item-value">
                                <fui-text :text="(policyConfigData.fertConfig?.total_time || 0) + ' 分钟'" :size="26"
                                    color="#303133"></fui-text>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </fui-dialog>
    </view>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'
import fuiDialog from 'firstui-uni/firstui/fui-dialog/fui-dialog.vue'
import fuiInput from 'firstui-uni/firstui/fui-input/fui-input.vue'
import PageHeader from '../../components/PageHeader.vue'
import Loading from '../../components/Loading.vue'
import call_remote from '../../../../lib/call_remote.js'


const refreshing = ref(false)
const pageHeaderRef = ref(null)
const pageLoading = ref(false)
const loading = ref(false)
const currentFarmName = ref('')
const groupSearch = ref('')
const groups = ref([])
const waterOnlyMode = ref({})
const quickActionLoading = ref({})
const isFirstLoad = ref(true) // 标记是否是首次加载

// 方案控制相关
const schemeList = ref([])
const schemeListLoading = ref(false)
const selectedSchemeId = ref('')
const tempSelectedSchemeId = ref('')
const schemeDialogVisible = ref(false)
const schemeDialogButtons = ref([
    { text: '取消', color: '#909399' },
    { text: '编辑当前方案', color: '#909399' },
    { text: '应用', color: '#409eff' }
])
const applySchemeLoading = ref(false)
const runNowLoading = ref(false)
const stopSchemeLoading = ref(false)
const isRunning = ref(false)
const totalPolicyWarningShown = ref(false)
const scheduleDialogVisible = ref(false)
const scheduleDate = ref('')
const scheduleTime = ref('')
const scheduleDialogButtons = ref([
    { text: '取消', color: '#909399' },
    { text: '确定', color: '#409eff' }
])
const scheduleLoading = ref(false)
const nextRunTime = ref('') // 方案下次运行时间
let runningStatusTimer = null // 方案运行状态定时器

// 搅拌策略相关
const mixingStartInterval = ref(60) // 启动间隔，默认60分钟
const mixingDuration = ref(6) // 期望运行时间，默认6分钟
const mixingSaving = ref(false)
const mixingStartLoading = ref(false)
const mixingStopLoading = ref(false)
const mixingScheduleDialogVisible = ref(false) // 搅拌策略定时启动对话框显示状态
const mixingScheduleDialogButtons = ref([
    { text: '取消', color: '#909399' },
    { text: '确定', color: '#409eff' }
])
const mixingScheduledTime = ref('') // 搅拌策略定时启动时间（完整日期时间字符串）
const mixingScheduledDate = ref('') // 搅拌策略定时启动日期
const mixingScheduledTimeOnly = ref('') // 搅拌策略定时启动时间（仅时间部分）
const mixingScheduleLoading = ref(false) // 搅拌策略定时启动加载状态
const mixingNextRunTime = ref('') // 搅拌策略下次运行时间
const isMixingRunning = ref(false) // 搅拌策略是否正在运行
let mixingStatusTimer = null // 搅拌策略状态定时器

// 策略配置查看相关
const showPolicyConfigDialog = ref(false)
const policyConfigTitle = ref('策略配置')
const policyConfigLoading = ref(false)
const policyConfigError = ref('')
const policyConfigData = ref(null)
const policyConfigButtons = ref([
    { text: '确定', color: '#409eff' }
])

const formVisible = ref(false)
const formMode = ref('create') // create | copy
const submitting = ref(false)
const wizardStep = ref(1)
const valveLoading = ref(false)
const availableValves = ref([])
const selectedValves = ref([])
const startTime = ref('08:00')
const suggestedArea = ref(null)
const valveView = ref('list')
const mapCenter = ref({ lat: 23.1291, lng: 113.2644 })
const mapScale = ref(12)
const mapMarkers = ref([])
const farmAreaParams = ref({
    system_flow: 0,
    laying_spacing: 0,
    dripper_spacing: 0,
    dripper_flow: 0,
    coefficient: 0.9
})
const methodOptions = [
    { label: '只浇水', value: 'WaterOnly' },
    { label: '亩定量', value: 'AreaBased' },
    { label: '总定量', value: 'Total' },
    { label: '定时', value: 'Time' },
]
const formData = ref({
    name: '',
    area: null,
    method: 'WaterOnly',
    AB_fert: null,
    total_fert: null,
    fert_time: null,
    pre_fert_time: null,
    post_fert_time: null,
    total_time: null,
})

const filteredGroups = computed(() => {
    const keyword = groupSearch.value.trim().toLowerCase()
    if (!keyword) return groups.value
    return groups.value.filter(g => (g.name || '').toLowerCase().includes(keyword))
})

const formatNumber = (val) => {
    if (val === undefined || val === null || val === '-') return '-'
    if (val === '') return '-'
    return String(val)
}

const parseValves = (valveStr) => {
    if (!valveStr || valveStr === '-') return []
    const quoted = valveStr.match(/"([^"]+)"/g)
    if (quoted && quoted.length) {
        return quoted.map(i => i.replaceAll('"', ''))
    }
    return valveStr.split(/[,|\s]+/).map(v => v.trim()).filter(Boolean)
}

const parseValvesFromExpression = (expression) => {
    if (!expression || expression === '-') return []
    if (expression.includes('|')) {
        return expression.split('|').map(v => v.trim().replaceAll('"', '')).filter(Boolean)
    }
    const matches = expression.match(/"([^"]+)"/g)
    return matches ? matches.map(m => m.replaceAll('"', '')) : []
}

const parseFertMethod = (expression) => {
    const methodStr = (expression || '').replaceAll('"', '')
    if (methodStr === '只浇水' || methodStr === 'WaterOnly') return 'WaterOnly'
    if (methodStr === '亩定量' || methodStr === 'AreaBased') return 'AreaBased'
    if (methodStr === '总定量' || methodStr === 'Total') return 'Total'
    if (methodStr === '定时' || methodStr === 'Time') return 'Time'
    return 'WaterOnly'
}

const parseTimeValue = (expression) => {
    const value = Number.parseFloat(expression) || 0
    if (value > 1000) {
        return value / 60000
    }
    return value
}

// 从初始化变量中解析面积
const parseAreaFromVariable = (initVariables) => {
    if (!initVariables) return null
    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        if (varName === 'area' || varName === '面积') {
            const areaValue = Number.parseFloat(initVar.expression) || 0
            if (areaValue > 0) {
                return areaValue
            }
        }
    }
    return null
}

const parseFertConfigFromVariables = (initVariables, fertConfig, area = 0) => {
    if (!initVariables) return

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
        } else if (varName === '期望每亩施肥量' || varName === 'area_based_amount') {
            fertConfig.AB_fert = Number.parseFloat(expression) || 0
        } else if (varName === '期望施肥总量') {
            fertConfig.total_fert = Number.parseFloat(expression) || 0
        }
    }

    if (fertConfig.method === 'Total' && fertConfig.total_fert > 0 && area > 0) {
        fertConfig.AB_fert = fertConfig.total_fert / area
    }

    if (fertConfig.method === 'AreaBased' && fertConfig.AB_fert > 0 && area > 0) {
        fertConfig.total_fert = fertConfig.AB_fert * area
    }
}

const getFertMethodLabel = (method) => {
    if (method === 'WaterOnly') return '只浇水'
    if (method === 'AreaBased') return '亩定量'
    if (method === 'Total') return '总定量'
    if (method === 'Time') return '定时'
    return '未知'
}

const statusClass = (state) => {
    if (!state) return 'info'
    const statusTrimmed = state.toString().trim()
    switch (statusTrimmed) {
        case '空闲':
            return 'info'
        case '阀门响应':
            return 'info'  // 使用自定义颜色
        case '浇水':
            return 'primary'
        case '肥前':
            return 'warning'
        case '施肥':
            return 'purple'
        case '肥后':
            return 'success'
        case '收尾':
            return 'success'
        default:
            return 'info'
    }
}

const getCardStatusClass = (state) => {
    if (!state) return 'status-idle'
    const statusTrimmed = state.toString().trim()
    switch (statusTrimmed) {
        case '空闲':
            return 'status-idle'
        case '阀门响应':
            return 'status-waiting-valve'
        case '浇水':
            return 'status-watering'
        case '肥前':
            return 'status-pre-fert'
        case '施肥':
            return 'status-fertilizing'
        case '肥后':
            return 'status-post-fert'
        case '收尾':
            return 'status-finishing'
        default:
            return 'status-idle'
    }
}

const getTextColor = (state) => {
    return '#ffffff'
}

const onMethodChange = (e) => {
    const idx = Number(e.detail.value)
    const opt = methodOptions[idx]
    if (opt) formData.value.method = opt.value
}

const getMethodLabel = (val) => {
    const opt = methodOptions.find(o => o.value === val)
    return opt ? opt.label : '亩定量'
}

const openCreateForm = (isCopy, group = null) => {
    uni.removeStorageSync('edit_scheme_name')
    
    if (isCopy && group) {
        uni.setStorageSync('irrigation_copy_group', group)
        uni.navigateTo({ url: '/pages/irrigation/wizard?mode=copy' })
        return
    }
    uni.navigateTo({ url: '/pages/irrigation/wizard?mode=create' })
}

const closeForm = () => {
    if (submitting.value) return
    formVisible.value = false
}

const validateStep1 = () => {
    const name = (formData.value.name || '').trim()
    if (!name) {
        uni.showToast({ title: '名称必填', icon: 'none' })
        return false
    }
    if (!formData.value.area || Number(formData.value.area) <= 0) {
        uni.showToast({ title: '面积需大于0', icon: 'none' })
        return false
    }
    
    const method = formData.value.method
    if (method === 'WaterOnly') {
        if (!formData.value.total_time || Number(formData.value.total_time) <= 0) {
            uni.showToast({ title: '总灌溉时间需大于0', icon: 'none' })
            return false
        }
    } else {
        const preTime = Number(formData.value.pre_fert_time) || 0
        const fertTime = method === 'Time' ? (Number(formData.value.fert_time) || 0) : 0
        const postTime = Number(formData.value.post_fert_time) || 0
        const totalTime = preTime + fertTime + postTime
        
        if (totalTime <= 0) {
            uni.showToast({ title: '肥前时间、施肥时间、肥后时间总和需大于0', icon: 'none' })
            return false
        }
        
        if (method === 'AreaBased') {
            if (!formData.value.AB_fert || Number(formData.value.AB_fert) <= 0) {
                uni.showToast({ title: '亩定量需大于0', icon: 'none' })
                return false
            }
        } else if (method === 'Total') {
            if (!formData.value.total_fert || Number(formData.value.total_fert) <= 0) {
                uni.showToast({ title: '总定量需大于0', icon: 'none' })
                return false
            }
        } else if (method === 'Time') {
            if (!formData.value.fert_time || Number(formData.value.fert_time) <= 0) {
                uni.showToast({ title: '施肥时间需大于0', icon: 'none' })
                return false
            }
        }
    }
    
    return true
}

const loadValveDevices = async () => {
    valveLoading.value = true
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        let pageNo = 0
        let hasMore = true
        const allDevices = []
        while (hasMore) {
            const result = await call_remote('/device_management/list_device', { pageNo, farm_name: currentFarmName.value || undefined }, token)
            const devices = result?.devices || []
            allDevices.push(...devices)
            hasMore = devices.length >= 20
            pageNo++
        }
        availableValves.value = allDevices.filter(d => d.driver_name === 'WaterGroupValve' || d.driver_name === 'WaterGroupValve_v2')
            .map(d => ({
                device_name: d.device_name,
                longitude: d.longitude,
                latitude: d.latitude
            }))
        buildMapMarkers()
    } catch (error) {
        console.error('加载阀门设备失败', error)
        availableValves.value = []
    } finally {
        valveLoading.value = false
    }
}

const toggleValve = (deviceName) => {
    const idx = selectedValves.value.indexOf(deviceName)
    if (idx >= 0) {
        selectedValves.value.splice(idx, 1)
    } else {
        selectedValves.value.push(deviceName)
    }
}

const isValveSelected = (deviceName) => selectedValves.value.includes(deviceName)

const buildMapMarkers = () => {
    const markers = []
    const lats = []
    const lngs = []
    availableValves.value.forEach((d, idx) => {
        if (d.latitude !== undefined && d.longitude !== undefined) {
            lats.push(Number(d.latitude))
            lngs.push(Number(d.longitude))
            markers.push({
                id: idx,
                latitude: Number(d.latitude),
                longitude: Number(d.longitude),
                title: d.device_name,
                iconPath: isValveSelected(d.device_name) ? '/static/tabbar/Irrigation-active.png' : '/static/tabbar/Irrigation.png',
                width: 32,
                height: 32,
                callout: {
                    content: d.device_name,
                    display: 'ALWAYS',
                    bgColor: '#ffffff',
                    color: '#303133',
                    borderRadius: 8,
                    padding: 6
                },
                customCallout: {
                    anchorY: 0,
                    anchorX: 0
                }
            })
        }
    })
    if (lats.length && lngs.length) {
        const lat = lats.reduce((a, b) => a + b, 0) / lats.length
        const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length
        mapCenter.value = { lat, lng }
        mapScale.value = 12
    }
    mapMarkers.value = markers
}

const onMarkerTap = (e) => {
    const marker = mapMarkers.value.find(m => m.id === e.detail.markerId)
    if (!marker) return
    toggleValve(marker.title || marker.callout?.content || '')
    buildMapMarkers()
}

const onTimeChange = (e) => {
    startTime.value = e.detail.value || startTime.value
}

const nextWizardStep = async () => {
    if (wizardStep.value === 1) {
        if (!validateStep1()) return
        await loadValveDevices()
        wizardStep.value = 2
    } else if (wizardStep.value === 2) {
        if (!selectedValves.value.length) {
            uni.showToast({ title: '至少选择1个阀门', icon: 'none' })
            return
        }
        wizardStep.value = 3
    }
}

const prevWizardStep = () => {
    if (wizardStep.value > 1) {
        wizardStep.value -= 1
    }
}

const buildPayload = () => {
    const method = formData.value.method
    const groupData = {
        name: (formData.value.name || '').trim(),
        area: Number(formData.value.area),
        valves: selectedValves.value.slice(),
        method: method,
    }

    if (method === 'WaterOnly') {
        groupData.total_time = formData.value.total_time !== null ? Number(formData.value.total_time) : undefined
        groupData.post_fert_time = 0
    } else {
        const preTime = formData.value.pre_fert_time !== null ? Number(formData.value.pre_fert_time) : 0
        const fertTime = method === 'Time' ? (formData.value.fert_time !== null ? Number(formData.value.fert_time) : 0) : 0
        const postTime = formData.value.post_fert_time !== null ? Number(formData.value.post_fert_time) : 0
        groupData.pre_fert_time = preTime
        if (method === 'Time') {
            groupData.fert_time = fertTime
        }
        groupData.post_fert_time = postTime
        groupData.total_time = preTime + fertTime + postTime
        
        if (method === 'AreaBased') {
            groupData.AB_fert = formData.value.AB_fert !== null ? Number(formData.value.AB_fert) : undefined
        } else if (method === 'Total') {
            const abVal = Number(formData.value.total_fert || 0) / Number(formData.value.area || 1)
            groupData.AB_fert = abVal !== null ? Number(abVal) : undefined
            groupData.total_fert = formData.value.total_fert !== null ? Number(formData.value.total_fert) : undefined
        }
    }

    const payload = {
        groups: [groupData],
        farm_name: currentFarmName.value || undefined,
        start_time: startTime.value
    }

    if (selectedSchemeId.value) {
        payload.scheme_id = selectedSchemeId.value
        payload.scheme_name = selectedSchemeId.value
    }

    return payload
}

const submitForm = async () => {
    if (wizardStep.value !== 3 && !validateStep1()) {
        wizardStep.value = 1
        return
    }
    if (!selectedValves.value.length) {
        wizardStep.value = 2
        uni.showToast({ title: '请先分配阀门', icon: 'none' })
        return
    }
    const payload = buildPayload()
    submitting.value = true
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        await call_remote('/policy/apply_wizard_groups', payload, token)
        uni.showToast({ title: '下发成功', icon: 'success' })
        formVisible.value = false
        await loadGroups()
    } catch (error) {
        console.error('保存轮灌组失败', error)
        uni.showToast({ title: error.err_msg || '保存失败', icon: 'none' })
    } finally {
        submitting.value = false
    }
}

const mapGroup = (raw) => {
    const valveList = parseValves(raw.valves)
    return {
        ...raw,
        valveList
    }
}

const filterByFarm = async (groups) => {
    if (!currentFarmName.value) return groups
    const result = []
    for (const g of groups) {
        try {
            const match = await call_remote('/policy/get_matched_farm', { policy_name: g.name })
            if (!match || !match.farm_name || match.farm_name === currentFarmName.value) {
                result.push(g)
            }
        } catch (e) {
            // 忽略异常，默认不过滤
            console.warn(`获取策略 ${g.name} 的匹配农场失败:`, e)
            result.push(g)
        }
    }
    return result
}

const loadGroups = async () => {
    if (loading.value) return
    loading.value = true
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        let pageNo = 0
        let hasMore = true
        const allGroups = []
        while (hasMore) {
            // 只加载当前方案下的轮灌组：如果已选择方案，则带上 scheme_id 参数
            const params = { pageNo }
            if (selectedSchemeId.value) {
                params.scheme_id = selectedSchemeId.value
            }
            const resp = await call_remote('/policy/list_watering_groups', params, token)
            const list = resp && resp.groups ? resp.groups : []
            allGroups.push(...list)
            // 如果返回的数据少于20条，说明已经是最后一页了
            hasMore = list.length >= 20
            pageNo++
        }
        const filtered = await filterByFarm(allGroups)
        groups.value = filtered.map(mapGroup)
        await loadWaterOnlyStates()
    } catch (error) {
        console.error('加载轮灌组失败', error)
        groups.value = []
        uni.showToast({ title: '加载轮灌组失败', icon: 'none' })
    } finally {
        loading.value = false
    }
}

const fetchSuggestedArea = async () => {
    if (!currentFarmName.value) {
        suggestedArea.value = null
        return
    }
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const paramsResp = await call_remote('/resource/get_farm_area_params', { farm_name: currentFarmName.value }, token)
        if (paramsResp) {
            farmAreaParams.value = {
                system_flow: Number(paramsResp.system_flow) || 0,
                laying_spacing: Number(paramsResp.laying_spacing) || 0,
                dripper_spacing: Number(paramsResp.dripper_spacing) || 0,
                dripper_flow: Number(paramsResp.dripper_flow) || 0,
                coefficient: paramsResp.coefficient !== undefined ? Number(paramsResp.coefficient) : 0.9
            }
            suggestedArea.value = calcRecommendedArea()
        }
    } catch (e) {
        console.warn('获取农场面积参数失败', e)
        suggestedArea.value = null
    }
}

const calcRecommendedArea = () => {
    const p = farmAreaParams.value
    const system_flow = Number(p.system_flow) || 0
    const laying_spacing = Number(p.laying_spacing) || 0
    const dripper_spacing = Number(p.dripper_spacing) || 0
    const dripper_flow = Number(p.dripper_flow) || 0
    const coefficient = Number(p.coefficient) || 0.9

    if (system_flow <= 0 || laying_spacing <= 0 || dripper_spacing <= 0 || dripper_flow <= 0) return null

    const denominator = (667 / laying_spacing / dripper_spacing) * dripper_flow
    if (denominator === 0 || !Number.isFinite(denominator)) return null

    const result = (system_flow * 1000 / denominator) * coefficient
    if (!result || !Number.isFinite(result) || result <= 0) return null
    return Number(result.toFixed(2))
}

const useSuggestedArea = () => {
    if (suggestedArea.value && suggestedArea.value > 0) {
        formData.value.area = suggestedArea.value
    }
}

const loadWaterOnlyStates = async () => {
    const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
    for (const group of groups.value) {
        try {
            const runtimeResult = await call_remote('/policy/get_policy_runtime', {
                policy_name: group.name
            }, token)
            if (runtimeResult && runtimeResult.variables) {
                let variables = {}
                try {
                    variables = JSON.parse(runtimeResult.variables)
                } catch (e) {
                    console.warn(`解析策略 ${group.name} 变量数据失败:`, e)
                }
                waterOnlyMode.value[group.name] = variables['是否只浇水'] === true
            }
        } catch (error) {
            console.warn(`获取策略 ${group.name} 运行时状态失败:`, error)
            waterOnlyMode.value[group.name] = false
        }
    }
}


// 处理快速操作
const handleQuickAction = async (policyName, actionName) => {
    const loadingKey = `${policyName}-${actionName}`
    try {
        quickActionLoading.value[loadingKey] = true
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const result = await call_remote('/policy/do_quick_action', {
            policy_name: policyName,
            action_name: actionName
        }, token)
        if (result.result) {
            uni.showToast({ title: `快速操作 ${actionName} 执行成功`, icon: 'success' })
            // 重新加载轮灌组数据
            await loadGroups()
        } else {
            uni.showToast({ title: result?.err_msg || `执行快速操作 ${actionName} 失败`, icon: 'none' })
        }
    } catch (error) {
        console.error('执行快速操作失败:', error)
        uni.showToast({ title: error?.err_msg || `执行快速操作 ${actionName} 失败`, icon: 'none' })
    } finally {
        quickActionLoading.value[loadingKey] = false
    }
}

// 解析策略初始化变量中的时间值
const parseTimeValues = (initVariables) => {
    let preTimeMs = 0
    let fertTimeMs = 0
    let postTimeMs = 0

    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        const expression = initVar.expression || ''
        if (varName === '肥前时间') {
            preTimeMs = Number.parseFloat(expression) || 0
        } else if (varName === '施肥时间') {
            fertTimeMs = Number.parseFloat(expression) || 0
        } else if (varName === '肥后时间') {
            postTimeMs = Number.parseFloat(expression) || 0
        }
    }

    return { preTimeMs, fertTimeMs, postTimeMs }
}

// 从策略初始化变量中解析配置
const parsePolicyConfig = (initVariables, group, fertConfig) => {
    let area = group.area || 0
    let valves = []

    // 解析面积
    const areaFromVar = parseAreaFromVariable(initVariables)
    if (areaFromVar !== null) {
        area = areaFromVar
    }

    // 解析阀门
    for (const initVar of initVariables) {
        const varName = initVar.variable_name
        if (varName === 'valves' || varName === '组内阀门') {
            valves = parseValvesFromExpression(initVar.expression || '')
            break
        }
    }

    // 解析施肥配置
    parseFertConfigFromVariables(initVariables, fertConfig, area)

    // 计算总灌溉时间
    const { preTimeMs, fertTimeMs, postTimeMs } = parseTimeValues(initVariables)
    if (preTimeMs > 0 || fertTimeMs > 0 || postTimeMs > 0) {
        const totalMs = preTimeMs + fertTimeMs + postTimeMs
        fertConfig.total_time = totalMs / 60000 // 转换为分钟
    }

    return { area, valves }
}

// 查看策略配置（按照PC端逻辑）
const viewPolicyConfig = async (policyName) => {
    showPolicyConfigDialog.value = true
    policyConfigTitle.value = `${policyName} - 配置详情`
    policyConfigLoading.value = true
    policyConfigError.value = ''
    policyConfigData.value = null

    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')

        // 获取轮灌组列表
        const groupsResp = await call_remote('/policy/list_watering_groups', { pageNo: 0 }, token)
        const group = groupsResp?.groups?.find(g => g.name === policyName)

        // 获取策略列表
        const policyResp = await call_remote('/policy/list_policy', {}, token)
        const policy = policyResp?.policies?.find(p => p.name === policyName)

        if (!group || !policy) {
            policyConfigError.value = `未找到轮灌组 "${policyName}" 的配置信息`
            return
        }

        // 初始化配置数据
        const fertConfig = {
            method: 'AreaBased',
            AB_fert: 0,
            total_fert: 0,
            fert_time: 0,
            pre_fert_time: 0,
            post_fert_time: 0,
            total_time: group.total_time || 0,
        }

        let area = group.area || 0
        let valves = []

        // 从策略的初始化变量中解析配置
        if (policy.init_variables) {
            const parsed = parsePolicyConfig(policy.init_variables, group, fertConfig)
            area = parsed.area
            valves = parsed.valves
        }

        // 如果阀门列表为空，尝试从轮灌组数据中获取
        if (valves.length === 0 && group.valves && group.valves !== '-') {
            valves = parseValves(group.valves)
        }

        policyConfigData.value = {
            name: policyName,
            area: area,
            valves: valves,
            fertConfig: fertConfig
        }

    } catch (error) {
        console.error('获取策略配置失败:', error)
        policyConfigError.value = error?.err_msg || '获取策略配置失败'
    } finally {
        policyConfigLoading.value = false
    }
}

// 处理策略配置对话框按钮点击
const handlePolicyConfigDialogClick = (e) => {
    // 确定按钮，关闭对话框
    if (e.index === 0) {
        closePolicyConfigDialog()
    }
}

// 关闭策略配置对话框
const closePolicyConfigDialog = () => {
    showPolicyConfigDialog.value = false
    policyConfigData.value = null
    policyConfigError.value = ''
}

// 下拉刷新
const onRefresh = async () => {
    refreshing.value = true
    try {
        if (pageHeaderRef.value && pageHeaderRef.value.refresh) {
            await pageHeaderRef.value.refresh()
            currentFarmName.value = pageHeaderRef.value.getCurrentFarmName()
        }
        await loadGroups()
        uni.showToast({
            title: '刷新完成',
            icon: 'success',
            duration: 1500
        })
    } catch (error) {
        console.error('刷新失败:', error)
        uni.showToast({
            title: '刷新失败，请重试',
            icon: 'none',
            duration: 2000
        })
    } finally {
        refreshing.value = false
    }
}

const onFarmChange = async (farmName) => {
    currentFarmName.value = farmName
    // 重新启动搅拌策略状态定时器
    if (farmName) {
        startMixingStatusTimer()
    } else {
        stopMixingStatusTimer()
    }
    // 重新启动方案运行状态定时器
    if (selectedSchemeId.value) {
        startRunningStatusTimer()
    } else {
        stopRunningStatusTimer()
    }
    // 加载数据
    loadGroups()
    fetchSuggestedArea()
}

// 方案控制相关函数
// 解析方案文件内容，提取轮灌组信息
const parseWateringGroups = (content) => {
    const groups = new Set()
    const allGroupsMatch = content.match(/所有轮灌组[^[]*\[([^\]]+)\]/)
    if (allGroupsMatch) {
        const groupsStr = allGroupsMatch[1]
        const groupNames = groupsStr.match(/"([^"]+)"/g)
        if (groupNames) {
            groupNames.forEach(name => {
                const cleanName = name.replace(/"/g, '').trim()
                if (cleanName && (cleanName.includes('轮灌组') || cleanName.includes('组'))) {
                    groups.add(cleanName)
                }
            })
        }
    }
    if (groups.size === 0) {
        const policyMatches = content.matchAll(/policy\s+'([^']+)'/g)
        for (const match of policyMatches) {
            const policyName = match[1]
            if (policyName.includes('轮灌组') || policyName.includes('组')) {
                groups.add(policyName)
            }
        }
    }
    return Array.from(groups).sort()
}

// 从方案内容中解析农场名称
const parseFarmName = (content) => {
    const totalPolicyMatch = content.match(/policy\s+'([^']+-总策略)'/)
    if (totalPolicyMatch) {
        const totalPolicyName = totalPolicyMatch[1]
        const farmName = totalPolicyName.replace('-总策略', '')
        return farmName
    }
    const farmMatch = content.match(/add\s+farm\s+'([^']+)'/)
    if (farmMatch) {
        return farmMatch[1]
    }
    return null
}

// 获取总策略名称并验证存在性
const getTotalPolicyName = async (schemeName) => {
    let totalPolicyName = null
    const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')

    try {
        const response = await call_remote('/policy/get_scheme_content', { scheme_name: schemeName }, token)
        if (response && response.content) {
            const farmName = parseFarmName(response.content)
            if (farmName) {
                totalPolicyName = `${farmName}-总策略`
            }
        }
    } catch (error) {
        console.warn('获取方案内容失败:', error)
    }

    if (!totalPolicyName && currentFarmName.value) {
        totalPolicyName = `${currentFarmName.value}-总策略`
    }

    if (!totalPolicyName) {
        return null
    }

    try {
        await call_remote('/policy/get_policy_runtime', {
            policy_name: totalPolicyName
        }, token)
        return totalPolicyName
    } catch (error) {
        return null
    }
}

// 检查方案是否正在运行
const checkRunningStatus = async () => {
    if (!selectedSchemeId.value) {
        isRunning.value = false
        nextRunTime.value = ''
        return
    }

    try {
        const totalPolicyName = await getTotalPolicyName(selectedSchemeId.value)
        if (!totalPolicyName) {
            if (!totalPolicyWarningShown.value) {
                totalPolicyWarningShown.value = true
                uni.showToast({
                    title: '总策略未找到，请先应用方案或确认已加载',
                    icon: 'none'
                })
            }
            isRunning.value = false
            nextRunTime.value = ''
            return
        }
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const runtimeResponse = await call_remote('/policy/get_policy_runtime', {
            policy_name: totalPolicyName
        }, token)

        if (runtimeResponse && runtimeResponse.variables) {
            const variables = JSON.parse(runtimeResponse.variables)
            isRunning.value = variables['需要启动'] === true || variables['需要启动'] === 'true'
            
            // 获取下次启动时间
            const nextStartTime = variables['下次启动时间']
            if (nextStartTime && nextStartTime !== '' && nextStartTime !== '""' && nextStartTime !== 0 && nextStartTime !== '0') {
                // 处理时间戳（数字）或字符串格式
                let date
                if (typeof nextStartTime === 'number' || (typeof nextStartTime === 'string' && /^\d+$/.test(nextStartTime.replace(/"/g, '')))) {
                    const timestamp = typeof nextStartTime === 'number' ? nextStartTime : parseInt(nextStartTime.replace(/"/g, ''))
                    date = new Date(timestamp)
                } else {
                    const timeStr = nextStartTime.replace(/"/g, '')
                    date = new Date(timeStr)
                }
                if (!isNaN(date.getTime())) {
                    nextRunTime.value = date.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                } else {
                    nextRunTime.value = ''
                }
            } else {
                nextRunTime.value = ''
            }
        } else {
            isRunning.value = false
            nextRunTime.value = ''
        }
    } catch (error) {
        console.warn('检查运行状态失败:', error)
        isRunning.value = false
        nextRunTime.value = ''
    }
}

// 获取方案详情（包括轮灌组）
const getSchemeDetails = async (schemeName) => {
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const response = await call_remote('/policy/get_scheme_content', { scheme_name: schemeName }, token)
        if (response && response.content) {
            return parseWateringGroups(response.content)
        }
    } catch (error) {
        console.warn('获取方案详情失败:', error)
    }
    return []
}

// 加载方案列表
const loadSchemeList = async () => {
    schemeListLoading.value = true
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const response = await call_remote('/policy/list_schemes', {}, token)
        if (response?.schemes) {
            schemeList.value = response.schemes.map(scheme => ({
                ...scheme,
                wateringGroups: []
            }))
            
            // 优先从后端“当前方案”接口同步（PC / mobile 共用）
            try {
                const farmName = currentFarmName.value || (pageHeaderRef.value && pageHeaderRef.value.getCurrentFarmName && pageHeaderRef.value.getCurrentFarmName())
                if (farmName) {
                    const curResp = await call_remote('/policy/get_current_scheme', { farm_name: farmName }, token)
                    if (curResp?.scheme_id && schemeList.value.find(s => s.name === curResp.scheme_id)) {
                        selectedSchemeId.value = curResp.scheme_id
                        uni.setStorageSync('selectedSchemeId', selectedSchemeId.value)
                    }
                }
            } catch (e) {
                console.warn('从后端获取当前方案失败:', e)
            }

            // 如果后端没有记录当前方案，再使用本地记录或第一个方案兜底
            if (!selectedSchemeId.value) {
                const savedSchemeId = uni.getStorageSync('selectedSchemeId') || ''
                if (savedSchemeId && schemeList.value.find(s => s.name === savedSchemeId)) {
                    selectedSchemeId.value = savedSchemeId
                } else if (schemeList.value.length > 0) {
                    selectedSchemeId.value = schemeList.value[0].name
                }
                if (selectedSchemeId.value) {
                    uni.setStorageSync('selectedSchemeId', selectedSchemeId.value)
                }
            }
            
            // 检查运行状态
            if (selectedSchemeId.value) {
                await checkRunningStatus()
                // 启动方案运行状态定时器
                startRunningStatusTimer()
            }
        }
    } catch (error) {
        console.error('加载方案列表失败:', error)
    } finally {
        schemeListLoading.value = false
    }
}

// 启动方案运行状态定时器
const startRunningStatusTimer = () => {
    // 清除已有定时器
    if (runningStatusTimer) {
        clearInterval(runningStatusTimer)
    }
    // 立即检查一次状态
    checkRunningStatus()
    // 每5秒检查一次状态
    runningStatusTimer = setInterval(async () => {
        if (selectedSchemeId.value) {
            await checkRunningStatus()
        }
    }, 5000)
}

// 停止方案运行状态定时器
const stopRunningStatusTimer = () => {
    if (runningStatusTimer) {
        clearInterval(runningStatusTimer)
        runningStatusTimer = null
    }
}

// 显示方案选择对话框
const showSchemeDialog = async () => {
    tempSelectedSchemeId.value = selectedSchemeId.value ? String(selectedSchemeId.value) : ''
    schemeDialogVisible.value = true

    // 加载所有方案的轮灌组信息
    for (const scheme of schemeList.value) {
        scheme.wateringGroups = await getSchemeDetails(scheme.name)
    }
}

// 在对话框中选择方案
const selectSchemeInDialog = (schemeId) => {
    if (!schemeId) return
    tempSelectedSchemeId.value = String(schemeId)
}

// 应用选中的方案
const applyScheme = async () => {
    if (!tempSelectedSchemeId.value) {
        uni.showToast({ title: '请先选择一个方案', icon: 'none' })
        return
    }

    applySchemeLoading.value = true
    try {
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        // 1) 恢复方案配置（真正切换 sw_cli_config）
        await call_remote('/policy/restore_scheme', {
            scheme_id: tempSelectedSchemeId.value,
            farm_name: currentFarmName.value || undefined
        }, token)

        // 2) 显式设置后端“当前方案”，用于 PC / mobile 之间同步显示
        if (currentFarmName.value) {
            await call_remote('/policy/set_current_scheme', {
                farm_name: currentFarmName.value,
                scheme_id: tempSelectedSchemeId.value
            }, token)
        }

        selectedSchemeId.value = tempSelectedSchemeId.value
        uni.setStorageSync('selectedSchemeId', tempSelectedSchemeId.value)
        totalPolicyWarningShown.value = false

        await checkRunningStatus()
        // 启动方案运行状态定时器
        startRunningStatusTimer()

        uni.showToast({ title: `已应用方案: ${tempSelectedSchemeId.value}`, icon: 'success' })
        schemeDialogVisible.value = false
        await loadGroups()
    } catch (error) {
        uni.showToast({ title: error.err_msg || '应用方案失败', icon: 'none' })
    } finally {
        applySchemeLoading.value = false
    }
}

// 立即运行方案
const runSchemeNow = async () => {
    if (!selectedSchemeId.value || isRunning.value) return

    runNowLoading.value = true
    try {
        const totalPolicyName = await getTotalPolicyName(selectedSchemeId.value)
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        await call_remote('/policy/runtime_assignment', {
            policy_name: totalPolicyName,
            variable_name: '需要启动',
            expression: 'true',
            is_constant: true
        }, token)
        isRunning.value = true
        uni.showToast({ title: `方案 ${selectedSchemeId.value} 已启动`, icon: 'success' })
        await loadGroups()
    } catch (error) {
        uni.showToast({ title: error.err_msg || '启动方案失败', icon: 'none' })
    } finally {
        runNowLoading.value = false
    }
}

// 停止方案
const stopScheme = async () => {
    if (!selectedSchemeId.value) return

    stopSchemeLoading.value = true
    try {
        const totalPolicyName = await getTotalPolicyName(selectedSchemeId.value)
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        await call_remote('/policy/runtime_assignment', {
            policy_name: totalPolicyName,
            variable_name: '需要启动',
            expression: 'false',
            is_constant: true
        }, token)
        isRunning.value = false
        uni.showToast({ title: `方案 ${selectedSchemeId.value} 已停止`, icon: 'success' })
        await loadGroups()
    } catch (error) {
        uni.showToast({ title: error.err_msg || '停止方案失败', icon: 'none' })
    } finally {
        stopSchemeLoading.value = false
    }
}

// 显示定时运行对话框
const showScheduleDialog = () => {
    scheduleDate.value = ''
    scheduleTime.value = ''
    scheduleDialogVisible.value = true
}

// 设置定时运行
const setScheduledRun = async () => {
    if (!selectedSchemeId.value || !scheduleDate.value || !scheduleTime.value) {
        uni.showToast({ title: '请选择运行时间', icon: 'none' })
        return
    }

    scheduleLoading.value = true
    try {
        const scheduledTime = `${scheduleDate.value} ${scheduleTime.value}`
        // 将日期时间字符串转换为时间戳（数字）
        const timestamp = new Date(scheduledTime).getTime()
        if (isNaN(timestamp)) {
            uni.showToast({ title: '时间格式错误', icon: 'none' })
            return
        }
        const totalPolicyName = await getTotalPolicyName(selectedSchemeId.value)
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        await call_remote('/policy/runtime_assignment', {
            policy_name: totalPolicyName,
            variable_name: '下次启动时间',
            expression: String(timestamp), // 使用时间戳（数字字符串）
            is_constant: true
        }, token)
        uni.showToast({ title: `已设置定时运行: ${scheduledTime}`, icon: 'success' })
        scheduleDialogVisible.value = false
        // 设置后立即刷新状态
        await checkRunningStatus()
    } catch (error) {
        uni.showToast({ title: error.err_msg || '设置定时运行失败', icon: 'none' })
    } finally {
        scheduleLoading.value = false
    }
}

// 显示策略配置向导
const showPolicyConfigWizard = () => {
    uni.navigateTo({ url: '/pages/irrigation/wizard?mode=create' })
}

// 处理方案对话框按钮点击
const handleSchemeDialogClick = (e) => {
    if (e.index === 0) {
        // 取消
        closeSchemeDialog()
    } else if (e.index === 1) {
        // 编辑当前方案：直接跳转到向导第二步，便于增减轮灌组
        editCurrentScheme()
    } else if (e.index === 2) {
        // 应用
        applyScheme()
    }
}

// 编辑当前方案：从当前选择的方案进入向导第二步
const editCurrentScheme = () => {
    const schemeId = tempSelectedSchemeId.value || selectedSchemeId.value
    if (!schemeId) {
        uni.showToast({ title: '请先选择一个方案', icon: 'none' })
        return
    }
    const scheme = schemeList.value.find(s => String(s.id || s.name) === String(schemeId))
    const name = scheme?.name || schemeId

    // 将当前方案选择保存到本地，保持与运行页面状态一致
    selectedSchemeId.value = schemeId
    uni.setStorageSync('selectedSchemeId', schemeId)

    schemeDialogVisible.value = false

    // 跳转到向导页面，从第二步开始编辑当前方案的轮灌组
    const query = `mode=edit&schemeId=${encodeURIComponent(schemeId)}&schemeName=${encodeURIComponent(name)}&startStep=2`
    uni.navigateTo({
        url: `/pages/irrigation/wizard?${query}`
    })
}

// 关闭方案对话框
const closeSchemeDialog = () => {
    schemeDialogVisible.value = false
}

// 处理定时运行对话框按钮点击
const handleScheduleDialogClick = (e) => {
    if (e.index === 0) {
        // 取消
        closeScheduleDialog()
    } else if (e.index === 1) {
        // 确定
        setScheduledRun()
    }
}

// 关闭定时运行对话框
const closeScheduleDialog = () => {
    scheduleDialogVisible.value = false
}

// 定时日期变化
const onScheduleDateChange = (e) => {
    try {
        if (e && e.detail) {
            scheduleDate.value = e.detail.value
        }
    } catch (error) {
        console.error('日期选择错误:', error)
    }
}

// 撤销方案定时运行
const cancelScheduledRun = async () => {
    if (!selectedSchemeId.value) {
        return
    }

    try {
        const totalPolicyName = await getTotalPolicyName(selectedSchemeId.value)
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        await call_remote('/policy/runtime_assignment', {
            policy_name: totalPolicyName,
            variable_name: '下次启动时间',
            expression: '""',
            is_constant: true
        }, token)
        uni.showToast({ title: '已撤销定时运行', icon: 'success' })
        // 立即刷新状态
        await checkRunningStatus()
    } catch (error) {
        uni.showToast({ title: error.err_msg || '撤销定时运行失败', icon: 'none' })
    }
}

// 搅拌策略相关函数
// 启动搅拌（快速操作：开始）
const startMixing = async () => {
    try {
        if (!currentFarmName.value) {
            uni.showToast({ title: '请先选择农场', icon: 'none' })
            return
        }
        if (isMixingRunning.value) {
            return // 如果正在运行，不执行
        }
        const policyName = `${currentFarmName.value}-搅拌`
        mixingStartLoading.value = true
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const resp = await call_remote('/policy/do_quick_action', {
            policy_name: policyName,
            action_name: '开始'
        }, token)
        if (resp && resp.result) {
            isMixingRunning.value = true
            uni.showToast({ title: '搅拌已启动', icon: 'success' })
            // 立即刷新状态
            await loadMixingStatus()
        } else {
            uni.showToast({ title: resp?.err_msg || '启动搅拌失败', icon: 'none' })
        }
    } catch (error) {
        console.error('启动搅拌失败:', error)
        uni.showToast({ title: error.err_msg || '启动搅拌失败', icon: 'none' })
    } finally {
        mixingStartLoading.value = false
    }
}

// 停止搅拌（快速操作：停止）
const stopMixing = async () => {
    try {
        if (!currentFarmName.value) {
            uni.showToast({ title: '请先选择农场', icon: 'none' })
            return
        }
        if (!isMixingRunning.value) {
            return // 如果未运行，不执行
        }
        const policyName = `${currentFarmName.value}-搅拌`
        mixingStopLoading.value = true
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const resp = await call_remote('/policy/do_quick_action', {
            policy_name: policyName,
            action_name: '停止'
        }, token)
        if (resp && resp.result) {
            isMixingRunning.value = false
            uni.showToast({ title: '搅拌已停止', icon: 'success' })
            // 立即刷新状态
            await loadMixingStatus()
        } else {
            uni.showToast({ title: resp?.err_msg || '停止搅拌失败', icon: 'none' })
        }
    } catch (error) {
        console.error('停止搅拌失败:', error)
        uni.showToast({ title: error.err_msg || '停止搅拌失败', icon: 'none' })
    } finally {
        mixingStopLoading.value = false
    }
}

// 显示搅拌策略定时启动对话框
const showMixingScheduleDialog = () => {
    try {
        if (isMixingRunning.value) {
            uni.showToast({ title: '搅拌策略正在运行中，无法设置定时启动', icon: 'none' })
            return // 如果正在运行，不执行
        }
        mixingScheduledTime.value = ''
        mixingScheduledDate.value = ''
        mixingScheduledTimeOnly.value = ''
        mixingScheduleDialogVisible.value = true
    } catch (error) {
        console.error('显示定时启动对话框错误:', error)
        uni.showToast({ title: '打开对话框失败: ' + (error.message || '未知错误'), icon: 'none' })
    }
}

// 搅拌策略定时启动对话框按钮点击处理
const handleMixingScheduleDialogClick = (e) => {
    if (e.index === 0) {
        // 取消
        closeMixingScheduleDialog()
    } else if (e.index === 1) {
        // 确定
        setMixingScheduledStart()
    }
}

// 关闭搅拌策略定时启动对话框
const closeMixingScheduleDialog = () => {
    mixingScheduleDialogVisible.value = false
}

// 搅拌策略定时日期变化
const onMixingScheduleDateChange = (e) => {
    try {
        if (e && e.detail) {
            mixingScheduledDate.value = e.detail.value
            updateMixingScheduledTime()
        }
    } catch (error) {
        console.error('日期选择错误:', error)
    }
}

// 搅拌策略定时时间变化
const onMixingScheduleTimeChange = (e) => {
    try {
        if (e && e.detail) {
            mixingScheduledTimeOnly.value = e.detail.value
            updateMixingScheduledTime()
        }
    } catch (error) {
        console.error('时间选择错误:', error)
    }
}

// 更新搅拌策略定时时间字符串
const updateMixingScheduledTime = () => {
    try {
        if (mixingScheduledDate.value && mixingScheduledTimeOnly.value) {
            mixingScheduledTime.value = `${mixingScheduledDate.value} ${mixingScheduledTimeOnly.value}`
        } else {
            mixingScheduledTime.value = ''
        }
    } catch (error) {
        console.error('更新定时时间字符串错误:', error)
    }
}

// 设置搅拌策略定时启动
const setMixingScheduledStart = async () => {
    try {
        if (!currentFarmName.value) {
            uni.showToast({ title: '请先选择农场', icon: 'none' })
            return
        }
        if (!mixingScheduledTime.value) {
            uni.showToast({ title: '请选择启动时间', icon: 'none' })
            return
        }

        mixingScheduleLoading.value = true
        const policyName = `${currentFarmName.value}-搅拌`
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        
        // 将日期时间字符串转换为时间戳（数字）
        const timestamp = new Date(mixingScheduledTime.value).getTime()
        if (isNaN(timestamp)) {
            uni.showToast({ title: '时间格式错误', icon: 'none' })
            return
        }
        
        await call_remote('/policy/runtime_assignment', {
            policy_name: policyName,
            variable_name: '下次运行时间',
            expression: String(timestamp), // 使用时间戳（数字字符串）
            is_constant: true
        }, token)
        uni.showToast({ title: `已设置定时启动: ${mixingScheduledTime.value}`, icon: 'success' })
        mixingScheduleDialogVisible.value = false
        // 设置后立即刷新状态
        await loadMixingStatus()
    } catch (error) {
        console.error('设置搅拌策略定时启动失败:', error)
        uni.showToast({ title: error.err_msg || '设置定时启动失败', icon: 'none' })
    } finally {
        mixingScheduleLoading.value = false
    }
}

// 加载搅拌策略状态（获取下次运行时间和运行状态）
const loadMixingStatus = async () => {
    if (!currentFarmName.value) return
    
    try {
        const policyName = `${currentFarmName.value}-搅拌`
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        const runtimeResponse = await call_remote('/policy/get_policy_runtime', {
            policy_name: policyName
        }, token)
        
        if (runtimeResponse && runtimeResponse.variables) {
            const variables = JSON.parse(runtimeResponse.variables)
            
            // 检查运行状态
            const needStart = variables['需要启动']
            isMixingRunning.value = needStart === true || needStart === 'true'
            
            // 获取下次运行时间
            const nextRunTime = variables['下次运行时间']
            if (nextRunTime && nextRunTime !== '' && nextRunTime !== '""' && nextRunTime !== 0 && nextRunTime !== '0') {
                // 处理时间戳或字符串格式
                let date
                if (typeof nextRunTime === 'number' || (typeof nextRunTime === 'string' && /^\d+$/.test(nextRunTime.replace(/"/g, '')))) {
                    const timestamp = typeof nextRunTime === 'number' ? nextRunTime : parseInt(nextRunTime.replace(/"/g, ''))
                    date = new Date(timestamp)
                } else {
                    const timeStr = nextRunTime.replace(/"/g, '')
                    date = new Date(timeStr)
                }
                if (!isNaN(date.getTime())) {
                    mixingNextRunTime.value = date.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                } else {
                    mixingNextRunTime.value = ''
                }
            } else {
                mixingNextRunTime.value = ''
            }
        } else {
            isMixingRunning.value = false
            mixingNextRunTime.value = ''
        }
    } catch (error) {
        console.warn('获取搅拌策略状态失败:', error)
        isMixingRunning.value = false
        mixingNextRunTime.value = ''
    }
}

// 启动搅拌策略状态定时器
const startMixingStatusTimer = () => {
    // 清除已有定时器
    if (mixingStatusTimer) {
        clearInterval(mixingStatusTimer)
    }
    // 立即加载一次
    loadMixingStatus()
    // 每5秒检查一次状态
    mixingStatusTimer = setInterval(async () => {
        if (currentFarmName.value) {
            await loadMixingStatus()
        }
    }, 5000)
}

// 停止搅拌策略状态定时器
const stopMixingStatusTimer = () => {
    if (mixingStatusTimer) {
        clearInterval(mixingStatusTimer)
        mixingStatusTimer = null
    }
}

// 撤销搅拌策略定时运行
const cancelMixingScheduledRun = async () => {
    try {
        if (!currentFarmName.value) {
            return
        }

        const policyName = `${currentFarmName.value}-搅拌`
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        await call_remote('/policy/runtime_assignment', {
            policy_name: policyName,
            variable_name: '下次运行时间',
            expression: '""',
            is_constant: true
        }, token)
        uni.showToast({ title: '已撤销定时运行', icon: 'success' })
        // 立即刷新状态
        await loadMixingStatus()
    } catch (error) {
        console.error('撤销定时运行失败:', error)
        uni.showToast({ title: error.err_msg || '撤销定时运行失败', icon: 'none' })
    }
}

// 应用搅拌策略（保存配置）
const applyMixingPolicy = async () => {
    try {
        if (!currentFarmName.value) {
            uni.showToast({ title: '请先选择农场', icon: 'none' })
            return
        }

        mixingSaving.value = true
        const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : '')
        // 更新搅拌策略配置
        await call_remote('/config/init_fert_mixing_policy', {
            farm_name: currentFarmName.value,
            start_interval: mixingStartInterval.value || 60,
            duration: mixingDuration.value || 6
        }, token)
        
        // 保存当前配置到方案文件
        await call_remote('/config/save_config', {}, token)
        
        // 如果有选中的方案，保存到方案文件
        if (selectedSchemeId.value) {
            try {
                const schemeContent = await call_remote('/policy/get_scheme_content', {
                    scheme_id: selectedSchemeId.value
                }, token)
                if (schemeContent && schemeContent.farm_name) {
                    await call_remote('/policy/restore_scheme', {
                        scheme_id: selectedSchemeId.value,
                        farm_name: schemeContent.farm_name
                    }, token)
                }
            } catch (schemeError) {
                console.warn('保存到方案文件失败:', schemeError)
                // 即使保存到方案失败，也不影响搅拌策略的更新
            }
        }
        
        uni.showToast({ title: '搅拌策略已保存', icon: 'success' })
    } catch (error) {
        console.error('保存搅拌策略失败:', error)
        uni.showToast({ title: error.err_msg || '保存搅拌策略失败', icon: 'none' })
    } finally {
        mixingSaving.value = false
    }
}

// 定时时间变化
const onScheduleTimeChange = (e) => {
    try {
        if (e && e.detail) {
            scheduleTime.value = e.detail.value
        }
    } catch (error) {
        console.error('时间选择错误:', error)
    }
}

// 输入框值变化监听（使用watch来验证和限制值，避免无限循环）
let isUpdatingStartInterval = false
watch(mixingStartInterval, (newVal, oldVal) => {
    if (isUpdatingStartInterval) return
    try {
        // 避免初始化时触发
        if (oldVal === undefined) return
        
        // 如果值没有变化，不处理
        if (newVal === oldVal) return
        
        if (newVal !== null && newVal !== undefined && newVal !== '') {
            const numValue = parseInt(String(newVal)) || 0
            if (numValue > 1440) {
                isUpdatingStartInterval = true
                mixingStartInterval.value = 1440
                nextTick(() => { isUpdatingStartInterval = false })
            } else if (numValue < 1 && numValue !== 0) {
                isUpdatingStartInterval = true
                mixingStartInterval.value = 1
                nextTick(() => { isUpdatingStartInterval = false })
            }
        }
    } catch (error) {
        console.warn('搅拌间隔值验证错误:', error)
        isUpdatingStartInterval = false
    }
})

let isUpdatingDuration = false
watch(mixingDuration, (newVal, oldVal) => {
    if (isUpdatingDuration) return
    try {
        // 避免初始化时触发
        if (oldVal === undefined) return
        
        // 如果值没有变化，不处理
        if (newVal === oldVal) return
        
        if (newVal !== null && newVal !== undefined && newVal !== '') {
            const numValue = parseInt(String(newVal)) || 0
            if (numValue > 1440) {
                isUpdatingDuration = true
                mixingDuration.value = 1440
                nextTick(() => { isUpdatingDuration = false })
            } else if (numValue < 1 && numValue !== 0) {
                isUpdatingDuration = true
                mixingDuration.value = 1
                nextTick(() => { isUpdatingDuration = false })
            }
        }
    } catch (error) {
        console.warn('持续时间值验证错误:', error)
        isUpdatingDuration = false
    }
})

// 页面显示时加载/刷新数据
onShow(async () => {
    // 检查登录状态
    const token = uni.getStorageSync('auth_token') || (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null)
    if (!token) {
        uni.redirectTo({
            url: '/pages/login'
        })
        return
    }

    // 首次加载时显示全屏加载动画
    if (isFirstLoad.value) {
        pageLoading.value = true
        isFirstLoad.value = false
    }

    try {
        if (pageHeaderRef.value) {
            await pageHeaderRef.value.refresh()
            currentFarmName.value = pageHeaderRef.value.getCurrentFarmName()
        }
        // 加载方案列表
        await loadSchemeList()
        // 首次加载时获取建议面积
        if (pageLoading.value) {
            await fetchSuggestedArea()
        }
        await loadGroups()
        // 启动搅拌策略状态定时器
        if (currentFarmName.value) {
            startMixingStatusTimer()
        }
    } catch (error) {
        console.error('加载数据失败:', error)
    } finally {
        if (pageLoading.value) {
            // 延迟一下再隐藏加载，确保数据已经渲染
            setTimeout(() => {
                pageLoading.value = false
            }, 300)
        }
    }
})
</script>

<style lang="scss" scoped>
.page {
    height: 100vh;
    width: 100vw;
    background: linear-gradient(180deg, #f0f4f8 0%, #e8edf2 50%, #dde5ec 100%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}

/* 内容滚动区域 - scroll-view 需要明确高度 */
.content-scroll {
    flex: 1;
    position: relative;
    margin-top: calc(168rpx + env(safe-area-inset-top));
    padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
    overflow-y: auto;
    box-sizing: border-box;
    width: 100%;
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
    padding-right: 0;
}

/* 内容区域 */
.content {
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 32rpx;
    box-sizing: border-box;
    padding-bottom: 32rpx;
    /* 底部留出一些间距即可，不需要为 tabBar 留空间，因为 scroll-view 已经限制了底部 */
}

.filter-bar {
    margin: 8rpx 0 16rpx;
}

.filter-input {
    display: flex;
    align-items: center;
    gap: 12rpx;
    background: #ffffff;
    border-radius: 999rpx;
    padding: 16rpx 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.05);
}

.reset-btn {
    padding: 10rpx 18rpx;
    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecf3 100%);
    border-radius: 999rpx;
    font-size: 24rpx;
    color: #606266;
    border: 1px solid #e0e6ed;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.filter-status {
    margin-top: 8rpx;
    min-height: 36rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
}

.mini-loading {
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    font-size: 24rpx;
    color: #606266;
}

.mini-loading .dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #409eff;
    animation: pulse 1s infinite ease-in-out;
}

.mini-loading .dot:nth-child(2) {
    animation-delay: 0.2s;
}

.mini-loading .dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes pulse {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1.2); }
}

.filter-input input {
    flex: 1;
    font-size: 28rpx;
    color: #303133;
}

.search-icon {
    font-size: 28rpx;
    color: #909399;
}

.top-add-btn {
    position: fixed;
    bottom: 120rpx;
    right: 40rpx;
    width: 104rpx;
    height: 104rpx;
    border-radius: 50%;
    background: #409eff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12rpx 28rpx rgba(64, 158, 255, 0.35);
    z-index: 2000;
}

.plus-icon {
    color: #fff;
    font-size: 56rpx;
    line-height: 1;
}

.section-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.loading-block,
.empty-block {
    background: #fff;
    border-radius: 20rpx;
    padding: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.empty-icon {
    width: 100rpx;
    height: 100rpx;
}

.group-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.current-scheme-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 24rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.05);
}

.scheme-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex-wrap: wrap;
    margin-bottom: 12rpx;
}

.scheme-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #303133;
}

.scheme-name {
    font-size: 26rpx;
    color: #409eff;
    font-weight: 600;
}

.scheme-status {
    padding: 6rpx 14rpx;
    border-radius: 999rpx;
    font-size: 22rpx;
    color: #fff;
}

.scheme-status.running {
    background: #67c23a;
}

.scheme-status.stopped {
    background: #c0c4cc;
}

.scheme-progress {
    margin-top: 4rpx;
}

.progress-track {
    height: 16rpx;
    border-radius: 999rpx;
    background: #f2f6fc;
    overflow: hidden;
    position: relative;
}

.progress-bar {
    height: 100%;
    border-radius: 999rpx;
    background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
    transition: width 0.3s ease;
}

.progress-bar.active {
    animation: progress-stripe 1.2s linear infinite;
    background-size: 40rpx 40rpx;
}

@keyframes progress-stripe {
    0% {
        background-position: 0 0;
    }
    100% {
        background-position: 40rpx 0;
    }
}

.group-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
}

.group-card.status-idle {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
    border-left: 4px solid #475569;
    color: #ffffff;
}

.group-card.status-watering {
    background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
    border-left: 4px solid #0e7490;
    color: #ffffff;
}

.group-card.status-pre-fert {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border-left: 4px solid #b45309;
    color: #ffffff;
}

.group-card.status-fertilizing {
    background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
    border-left: 4px solid #7e22ce;
    color: #ffffff;
}

.group-card.status-post-fert {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-left: 4px solid #047857;
    color: #ffffff;
}

.group-card.status-waiting-valve {
    background: #10b981; /* 青绿色 - 等待阀门 */
    border-left: 4px solid #047857;
    color: #ffffff;
}

.group-card.status-finishing {
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    border-left: 4px solid #0f766e;
    color: #ffffff;
}

.group-card.status-idle,
.group-card.status-watering,
.group-card.status-pre-fert,
.group-card.status-fertilizing,
.group-card.status-post-fert,
.group-card.status-waiting-valve,
.group-card.status-finishing {
    color: #ffffff !important;
}

.group-card.status-idle .meta-label,
.group-card.status-watering .meta-label,
.group-card.status-pre-fert .meta-label,
.group-card.status-fertilizing .meta-label,
.group-card.status-post-fert .meta-label,
.group-card.status-waiting-valve .meta-label,
.group-card.status-finishing .meta-label {
    color: rgba(255, 255, 255, 0.9) !important;
}


.group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
}

.group-title {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex: 1;
}

.view-config-btn {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #f0f7ff;
    border: 1px solid #c6e2ff;
    cursor: pointer;
    transition: all 0.3s;
}

.view-config-btn:active {
    background: #e8f3ff;
    transform: scale(0.95);
}

.eye-icon {
    font-size: 28rpx;
    line-height: 1;
}

.group-state {
    padding: 8rpx 16rpx;
    border-radius: 999rpx;
    background: #909399; /* 默认灰色（空闲） */
}

.group-state.info {
    background: #909399; /* 灰色 - 空闲 */
}

.group-state.info.status-waiting-valve {
    background: #10b981; /* 青绿色 - 等待阀门（与其他状态区分明显） */
}

.group-state.primary {
    background: #409eff; /* 蓝色 - 浇水 */
}

.group-state.warning {
    background: #e6a23c; /* 橙色 - 肥前 */
}

.group-state.purple {
    background: #a855f7; /* 紫色 - 施肥 */
}

.group-state.success {
    background: #67c23a; /* 绿色 - 肥后、收尾 */
}

.group-meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14rpx 12rpx;
    margin-bottom: 12rpx;
}

.meta-item {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
}

.meta-label {
    font-size: 22rpx;
    color: #909399;
}

.valves-row {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    margin-top: 8rpx;
}

.valves-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10rpx;
    flex: 1;
}

.valve-tag {
    padding: 8rpx 14rpx;
    background: #f0f7ff;
    color: #409eff;
    border-radius: 12rpx;
    font-size: 22rpx;
}

.card-actions {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    margin-top: 20rpx;
}

.water-only-btn {
    padding: 14rpx 24rpx;
    border-radius: 12rpx;
    background: #f0f9ff;
    border: 1px solid #67C23A;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
}

.water-only-btn.active {
    background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%);
    border-color: #67C23A;
    box-shadow: 0 4rpx 12rpx rgba(103, 194, 58, 0.3);
}

.water-only-btn {
    pointer-events: none;
}

.action-buttons-row {
    display: flex;
    gap: 12rpx;
    width: 100%;
}

.action-btn {
    padding: 16rpx 24rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
}

.action-buttons-row .action-btn {
    flex: 1;
}

.action-btn.success {
    background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%);
}

.action-btn.warning {
    background: linear-gradient(135deg, #E6A23C 0%, #f0c78a 100%);
}

.action-btn.danger {
    background: linear-gradient(135deg, #F56C6C 0%, #f89898 100%);
    width: 100%;
    box-sizing: border-box;
}

.action-btn.loading {
    opacity: 0.6;
    pointer-events: none;
}

.action-btn:active:not(.loading) {
    transform: scale(0.98);
    box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.15);
}

.form-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    padding: 24rpx;
    box-sizing: border-box;
}

.form-panel {
    background: #fff;
    border-radius: 20rpx;
    width: 92%;
    max-width: 760rpx;
    padding: 28rpx;
    box-sizing: border-box;
}

.form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18rpx;
}

.form-panel.wide {
    max-width: 900rpx;
}

.close {
    font-size: 36rpx;
    padding: 8rpx 16rpx;
    color: #909399;
}

.form-body {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    max-height: 60vh;
    overflow-y: auto;
    padding-bottom: 120rpx;
}

.form-item {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.form-label {
    font-size: 24rpx;
    color: #606266;
}

.form-input {
    border: 1px solid #ebeef5;
    border-radius: 12rpx;
    padding: 16rpx;
    font-size: 26rpx;
    background: #f8fafc;
}

.form-textarea {
    border: 1px solid #ebeef5;
    border-radius: 12rpx;
    padding: 16rpx;
    min-height: 120rpx;
    font-size: 26rpx;
    background: #f8fafc;
}

.picker-value {
    border: 1px solid #ebeef5;
    border-radius: 12rpx;
    padding: 16rpx;
    font-size: 26rpx;
    background: #f8fafc;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16rpx;
    margin-top: 16rpx;
}

.form-actions.fixed {
    position: sticky;
    bottom: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), #fff);
    padding: 16rpx 0;
}

.step-indicator {
    display: grid;
    grid-template-columns: auto auto 1fr auto auto 1fr auto auto;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 12rpx;
}

.step-dot {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #e8f3ff;
    color: #909399;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
}

.step-dot.active {
    background: #409eff;
    color: #fff;
}

.step-label {
    font-size: 24rpx;
    color: #606266;
}

.step-line {
    height: 2rpx;
    background: linear-gradient(90deg, #c6e2ff, #409eff);
}

.step-content {
    display: flex;
    flex-direction: column;
    gap: 14rpx;
}

.step-page {
    min-height: 320rpx;
    justify-content: flex-start;
}

.valve-list {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
}

.valve-item {
    border: 1px solid #ebeef5;
    border-radius: 16rpx;
    padding: 18rpx;
    background: #f8fafc;
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.valve-item.checked {
    border-color: #409eff;
    background: #e8f3ff;
}

.valve-name {
    font-size: 28rpx;
    color: #303133;
    flex: 1;
}

.valve-meta {
    font-size: 22rpx;
    color: #909399;
}

.check-indicator {
    width: 32rpx;
    height: 32rpx;
    border-radius: 50%;
    border: 1px solid #409eff;
    color: #409eff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
}

.summary-card {
    border: 1px solid #ebeef5;
    border-radius: 16rpx;
    padding: 18rpx;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 10rpx;
}

.summary-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.summary-label {
    width: 180rpx;
    font-size: 24rpx;
    color: #606266;
}

.summary-value {
    font-size: 26rpx;
    color: #303133;
    flex: 1;
}

.summary-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
}

.valve-tag.small {
    padding: 6rpx 12rpx;
    font-size: 22rpx;
}

.tips-text {
    font-size: 22rpx;
    color: #909399;
}

.loading-block.small,
.empty-block.small {
    padding: 24rpx;
    min-height: 0;
}

.steps {
    margin-bottom: 12rpx;
}

.inline-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
}

.flex-1 {
    flex: 1;
}

.suggest-btn {
    padding: 12rpx 18rpx;
    border-radius: 12rpx;
    background: #e8f3ff;
    color: #409eff;
    font-size: 24rpx;
    white-space: nowrap;
}

.tabs {
    display: inline-flex;
    border: 1px solid #dcdfe6;
    border-radius: 999rpx;
    overflow: hidden;
    margin-top: 8rpx;
}

.tab {
    padding: 10rpx 20rpx;
    font-size: 24rpx;
    color: #606266;
    background: #f5f7fa;
}

.tab.active {
    background: #409eff;
    color: #fff;
}

.map-wrapper {
    border: 1px solid #ebeef5;
    border-radius: 16rpx;
    overflow: hidden;
}

.valve-map {
    width: 100%;
    height: 420rpx;
}

.map-legend {
    padding: 12rpx 16rpx;
    font-size: 22rpx;
    color: #606266;
    background: #f8fafc;
}

/* 策略配置对话框样式 */
.policy-config-content {
    max-height: 60vh;
    overflow-y: auto;
    padding: 20rpx 0;
}

.config-loading,
.config-error {
    padding: 40rpx 0;
    text-align: center;
}

.config-section {
    margin-bottom: 32rpx;
}

.config-section:last-child {
    margin-bottom: 0;
}

/* 阀门配置样式 */
.valves-config {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 12rpx;
}

.valve-config-tag {
    padding: 12rpx 20rpx;
    background: #f0f7ff;
    border: 1px solid #c6e2ff;
    border-radius: 12rpx;
}

.config-empty-item {
    padding: 20rpx 0;
    text-align: center;
}

/* 配置参数样式 */
.config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16rpx 0;
    border-bottom: 1px solid #ebeef5;
}

.config-item:last-child {
    border-bottom: none;
}

.config-item-label {
    flex: 1;
    min-width: 200rpx;
}

.config-item-value {
    flex: 1;
    text-align: right;
    word-break: break-all;
}

/* 方案控制部分样式 */
.policy-control-section {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 32rpx;
    margin-bottom: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.policy-control-section .section-header {
    margin-bottom: 24rpx;
}

.policy-controls {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.control-buttons-row {
    display: flex;
    gap: 16rpx;
    width: 100%;
}

.control-btn {
    flex: 1;
    padding: 20rpx 24rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.control-btn.success {
    background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%);
}

.control-btn.info {
    background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
}

.control-btn.primary {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.control-btn.warning {
    background: linear-gradient(135deg, #E6A23C 0%, #f0c78a 100%);
}

.control-btn.danger {
    background: linear-gradient(135deg, #F56C6C 0%, #f89898 100%);
}

.control-btn.disabled {
    opacity: 0.5;
    pointer-events: none;
}

.control-btn.loading {
    opacity: 0.6;
    pointer-events: none;
}

.control-btn:active:not(.disabled):not(.loading) {
    transform: scale(0.98);
    box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.15);
}

/* 方案对话框样式 */
.scheme-dialog-content {
    max-height: 60vh;
    overflow-y: auto;
    padding: 20rpx 0;
}

.scheme-loading,
.scheme-empty {
    padding: 40rpx 0;
    text-align: center;
}

.scheme-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.scheme-item {
    padding: 24rpx;
    border: 2rpx solid #e4e7ed;
    border-radius: 16rpx;
    background: #ffffff;
    position: relative;
    transition: all 0.3s;
}

.scheme-item:active {
    transform: scale(0.98);
}

.scheme-item.is-selected {
    border-color: #409eff;
    background: #ecf5ff;
}

.scheme-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12rpx;
}

.scheme-groups {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8rpx;
    margin-top: 8rpx;
}

.groups-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
}

.group-tag {
    padding: 6rpx 12rpx;
    background: #f0f7ff;
    border: 1rpx solid #c6e2ff;
    border-radius: 8rpx;
}

.check-icon {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #409eff;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: bold;
}

/* 定时运行对话框样式 */
.schedule-dialog-content {
    padding: 20rpx 0;
}

.schedule-dialog-content .form-item {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
}

.schedule-dialog-content .picker-value {
    border: 1px solid #ebeef5;
    border-radius: 12rpx;
    padding: 16rpx;
    font-size: 26rpx;
    background: #f8fafc;
    margin-bottom: 12rpx;
}

/* 搅拌策略样式 */
.mixing-strategy-section {
    margin-top: 24rpx;
}

.mixing-strategy-card {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
    position: relative;
    z-index: 1;
    pointer-events: auto;
}

.mixing-inputs-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 24rpx;
}

.mixing-input-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
}

.mixing-input-item .input-label {
    font-size: 24rpx;
    color: #606266;
}

.mixing-input {
    width: 100%;
    padding: 16rpx;
    border: 2rpx solid #e4e7ed;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #303133;
    background: #ffffff;
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
    position: relative;
    z-index: 10;
    pointer-events: auto;
}

.mixing-input:focus {
    border-color: #409eff;
    outline: none;
}

.mixing-input::-webkit-inner-spin-button,
.mixing-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.mixing-input {
    width: 100%;
    padding: 16rpx;
    border: 2rpx solid #e4e7ed;
    border-radius: 12rpx;
    font-size: 26rpx;
    color: #303133;
    background: #ffffff;
    box-sizing: border-box;
}

.mixing-input:focus {
    border-color: #409eff;
    outline: none;
}

.mixing-schedule-info {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 16rpx;
    margin-bottom: 24rpx;
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
    border-radius: 12rpx;
    border-left: 6rpx solid #ffc107;
}

.mixing-schedule-info .schedule-icon {
    font-size: 28rpx;
    flex-shrink: 0;
}

.mixing-schedule-info .cancel-icon {
    font-size: 32rpx;
    color: #909399;
    cursor: pointer;
    flex-shrink: 0;
    padding: 4rpx;
    border-radius: 8rpx;
    transition: all 0.2s;
    margin-left: auto;
}

.mixing-schedule-info .cancel-icon:active {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.1);
}

.mixing-buttons-row {
    display: flex;
    gap: 16rpx;
    margin-bottom: 16rpx;
}

.mixing-buttons-row:last-child {
    margin-bottom: 0;
}

.mixing-buttons-row .control-btn {
    flex: 1;
    position: relative;
    z-index: 1;
}

.schedule-time-info {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 16rpx;
    margin-top: 24rpx;
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%);
    border-radius: 12rpx;
    border-left: 6rpx solid #ffc107;
}

.schedule-time-info .schedule-icon {
    font-size: 28rpx;
    flex-shrink: 0;
}

.schedule-time-info .cancel-icon {
    font-size: 32rpx;
    color: #909399;
    cursor: pointer;
    flex-shrink: 0;
    padding: 4rpx;
    border-radius: 8rpx;
    transition: all 0.2s;
    margin-left: auto;
}

.schedule-time-info .cancel-icon:active {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.1);
}

.picker-view {
    padding: 16rpx;
    border: 2rpx solid #e4e7ed;
    border-radius: 12rpx;
    background: #f8fafc;
    margin-bottom: 12rpx;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 24rpx;
    padding: 24rpx;
    border-top: 2rpx solid #e4e7ed;
}

.dialog-btn {
    padding: 16rpx 32rpx;
    border-radius: 12rpx;
    cursor: pointer;
    transition: all 0.2s;
}

.dialog-btn.cancel {
    background: #f5f7fa;
}

.dialog-btn.cancel:active {
    background: #e4e7ed;
}

.dialog-btn.confirm {
    background: #ecf5ff;
}

.dialog-btn.confirm:active {
    background: #d9ecff;
}

.dialog-btn.loading {
    opacity: 0.6;
    pointer-events: none;
}

@media (max-width: 375px) {

    .content {
        padding: 24rpx;
    }
}
</style>
