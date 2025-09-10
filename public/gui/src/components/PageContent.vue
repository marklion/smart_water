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

// 重新加载数据（重置到第一页）
async function reload() {
    cur_page.value = 1;
    await show_content();
}

// 暴露方法给父组件
defineExpose({
    show_content,
    reload
});
</script>

<style scoped>
.page-content-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.content-area {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 10px;
}

.pagination-area {
    flex-shrink: 0;
    padding: 10px 0;
    background-color: #fff;
    border-top: 1px solid #eee;
    text-align: center;
}
</style>