const keysToCamel = (obj) => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    if (obj.constructor.name !== 'Object') {
        return obj;
    }
    
    return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        acc[camelKey] = keysToCamel(obj[key]);
        return acc;
    }, {});
};

const parseScriptOrFlow = (item) => {
    const camelItem = keysToCamel(item);
    if (typeof camelItem.pages === 'string') camelItem.pages = JSON.parse(camelItem.pages);
    if (typeof camelItem.nodes === 'string') camelItem.nodes = JSON.parse(camelItem.nodes);
    if (typeof camelItem.connections === 'string') camelItem.connections = JSON.parse(camelItem.connections);
    return camelItem;
};

module.exports = {
    keysToCamel,
    parseScriptOrFlow,
};
