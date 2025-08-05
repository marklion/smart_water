<template>
    <div class="page-content-container">
        <div class="content-area">
            <slot :content="data_list"></slot>
        </div>
        <div class="pagination-area">
            <el-pagination layout="prev, pager, next" v-model:current-page="cur_page" :page-count="total"
                @current-change="show_content" :hide-on-single-page="true">
            </el-pagination>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
const props = defineProps({
    fetch_func: {
        type: Function,
        default: () => []
    },
    params: {
        type: Object,
        default: {}
    },
    content_name: {
        type: String,
        default: 'content'
    },
    total_name: {
        type: String,
        default: 'total'
    },
});
const cur_page = ref(1);
const data_list = ref([]);
const total = ref(0);
async function show_content() {
    let resp = await props.fetch_func(props.params, cur_page.value - 1);
    data_list.value = resp[props.content_name] || [];
    if (resp[props.total_name] !== undefined) {
        total.value = Math.ceil(resp[props.total_name] / 20);
    } else {
        total.value = 0;
    }
}
onMounted(async () => {
    await show_content();
});
</script>

<style scoped>
.page-content-container {
    display: flex;
    flex-direction: column;
    height: 100%; /* 使用全屏高度，您可以根据需要调整 */
}

.content-area {
    flex: 1;
    overflow-y: auto; /* 内容超出时显示滚动条 */
    padding-bottom: 10px; /* 给内容底部添加一些间距 */
}

.pagination-area {
    flex-shrink: 0; /* 确保分页区域不会被压缩 */
    padding: 10px 0;
    background-color: #fff; /* 可选：给分页区域添加背景色 */
    border-top: 1px solid #eee; /* 可选：添加上边框分隔线 */
    text-align: center;
}
</style>