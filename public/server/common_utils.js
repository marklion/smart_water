// 公共验证函数
export function validateItemExists(array, name, itemName = '项目') {
    let item = array.find(p => p.name === name);
    if (!item) {
        throw { err_msg: `${itemName}不存在` };
    }
    return item;
}

// 公共工具函数
export function ensureArrayExists(obj, arrayName) {
    if (!obj[arrayName]) {
        obj[arrayName] = [];
    }
    return obj[arrayName];
}

export function getPaginatedResult(array, pageNo, pageSize = 20) {
    let current_page_content = array.slice(pageNo * pageSize, (pageNo + 1) * pageSize);
    return {
        items: current_page_content,
        total: array.length,
    };
}

export function findAndRemoveFromArray(array, predicate) {
    let index = array.findIndex(predicate);
    if (index !== -1) {
        array.splice(index, 1);
        return true;
    }
    return false;
}

export function findExistingItem(array, predicate) {
    return array.find(predicate);
}

export function addItemIfNotExists(array, item, predicate) {
    let existing = findExistingItem(array, predicate);
    if (!existing) {
        array.push(item);
        return true;
    }
    return false;
}

export function mapArrayToNameOnly(array) {
    return array ? array.map(item => ({ name: item.name })) : [];
}

export function mapArrayToFields(array, fields) {
    return array ? array.map(item => {
        let mapped = {};
        fields.forEach(field => {
            if (item[field] !== undefined) {
                mapped[field] = item[field];
            }
        });
        return mapped;
    }) : [];
}
