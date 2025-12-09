<template>
  <view class="header">
    <view class="header-left">
      <image src="/static/logo.png" class="header-logo" mode="aspectFit" />
      <fui-text :text="systemName" :size="40" :fontWeight="700" color="#303133"></fui-text>
    </view>
    <view v-if="showFarmSelector" class="header-right">
      <picker :value="farmIndex" :range="farmList" range-key="name" @change="onFarmChange" class="farm-picker">
        <view class="farm-selector">
          <fui-text :text="currentFarmName || '选择农场'" :size="28" color="#409eff"></fui-text>
          <text class="picker-arrow">▼</text>
        </view>
      </picker>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import call_remote from '../../../lib/call_remote.js'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'

const props = defineProps({
  showFarmSelector: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['farm-change'])

const systemName = ref('no_name') // 默认值
const farmList = ref([])
const currentFarmName = ref('')
const farmIndex = ref(0)

// 加载系统名称
const loadSystemName = async () => {
  try {
    const result = await call_remote('/get_sys_name', {})
    if (result && result.sys_name && result.sys_name !== 'no name' && result.sys_name !== 'no_name') {
      systemName.value = result.sys_name
    }
  } catch (error) {
    console.error('加载系统名称失败:', error)
    // 保持默认值
  }
}

// 加载农场列表
const loadFarmList = async () => {
  if (!props.showFarmSelector) return

  try {
    const farmResult = await call_remote('/resource/list_farm', { pageNo: 0 })
    const farms = farmResult.farms || []
    farmList.value = farms

    if (farms.length > 0 && !currentFarmName.value) {
      currentFarmName.value = farms[0].name
      farmIndex.value = 0
      emit('farm-change', farms[0].name)
    }
  } catch (error) {
    console.error('加载农场列表失败:', error)
  }
}

// 农场切换事件
const onFarmChange = (e) => {
  const index = e.detail.value
  farmIndex.value = index
  currentFarmName.value = farmList.value[index].name
  emit('farm-change', farmList.value[index].name)
}

// 暴露方法供父组件调用
defineExpose({
  refresh: async () => {
    await loadSystemName()
    if (props.showFarmSelector) {
      await loadFarmList()
    }
  },
  getCurrentFarmName: () => currentFarmName.value,
  setFarmName: (name) => {
    const index = farmList.value.findIndex(farm => farm.name === name)
    if (index !== -1) {
      farmIndex.value = index
      currentFarmName.value = name
    }
  }
})

onMounted(async () => {
  await loadSystemName()
  if (props.showFarmSelector) {
    await loadFarmList()
  }
})
</script>

<style lang="scss" scoped>
/* 顶部标题栏 */
.header {
  padding: 40rpx 40rpx 24rpx 40rpx;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.header-logo {
  width: 48rpx;
  height: 48rpx;
  border-radius: 8rpx;
}

.header-right {
  display: flex;
  align-items: center;
}

.farm-picker {
  display: flex;
  align-items: center;
}

.farm-selector {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 20rpx;
  border: 1px solid rgba(64, 158, 255, 0.3);
}

.picker-arrow {
  font-size: 20rpx;
  color: #409eff;
  margin-left: 4rpx;
}
</style>
