<template>
    <view v-if="show" class="loading-overlay">
        <view class="loading-container">
            <view class="loading-spinner">
                <view class="spinner-circle"></view>
                <view class="spinner-circle"></view>
                <view class="spinner-circle"></view>
            </view>
            <fui-text v-if="text" :text="text" :size="28" color="#909399"></fui-text>
        </view>
    </view>
</template>

<script setup>
import { defineProps } from 'vue'
import fuiText from 'firstui-uni/firstui/fui-text/fui-text.vue'

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    text: {
        type: String,
        default: '加载中...'
    }
})
</script>

<style lang="scss" scoped>
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4rpx);
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24rpx;
}

.loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
}

.spinner-circle {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #409eff 0%, #6a8dff 100%);
    animation: loading-bounce 1.4s ease-in-out infinite;
}

.spinner-circle:nth-child(1) {
    animation-delay: 0s;
}

.spinner-circle:nth-child(2) {
    animation-delay: 0.2s;
}

.spinner-circle:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes loading-bounce {

    0%,
    80%,
    100% {
        transform: scale(0.8);
        opacity: 0.5;
    }

    40% {
        transform: scale(1.2);
        opacity: 1;
    }
}
</style>
