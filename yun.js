
// 对于其他权限检查函数，同样避免直接覆盖
function checkAndWrapFunction(funcName, fallbackFunc) {
    if (typeof window[funcName] === 'undefined') {
        window[funcName] = function() {
            // 先检查是否是管理员
            if (isAdmin && isAdmin()) {
                return true;
            }
            // 使用quanxian.js中的hasPermission函数
            if (window.hasPermission && typeof window.hasPermission === 'function') {
                return window.hasPermission(funcName);
            }
            // 使用备用函数
            return fallbackFunc ? fallbackFunc() : false;
        };
    }
}

// 包装权限函数
checkAndWrapFunction('canShowPermissionManager', function() {
    return window.hasPermission ? window.hasPermission('showPermissionManager') : false;
});

checkAndWrapFunction('canShowChangeLog', function() {
    return window.hasPermission ? window.hasPermission('viewLogs') : false;
});
// ==================== 内置GitHub配置 ====================
const BUILT_IN_CONFIG = {
    GIST_ID: '097f8adbb3790f3a95ba586a0867699b',
    GITHUB_TOKEN: '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', // 这里替换为你的实际token
    configLoaded: true
};

// 初始化时直接使用内置配置
GIST_CONFIG.GIST_ID = BUILT_IN_CONFIG.GIST_ID;
GIST_CONFIG.GITHUB_TOKEN = BUILT_IN_CONFIG.GITHUB_TOKEN;
GIST_CONFIG.configLoaded = true;

// 在yun.js开头添加
if (typeof window.currentUser === 'undefined') {
    window.currentUser = null;
}
// 在 yun.js 开头部分添加这个函数
async function saveToJsFile() {
    try {
        if (!currentUser) {
            alert('请先登录！');
            return;
        }

        if (!confirm('即将下载完整数据备份ZIP包，包含所有文本和图片数据。是否继续？')) {
            return;
        }

        // 创建完整数据对象（包含所有图片的base64）
        const fullData = {
            sites: JSON.parse(JSON.stringify(sites)),
            changeLog: changeLog,
            exportTime: new Date().toLocaleString('zh-CN'),
            exportedBy: currentUser.name,
            dataVersion: '2.3',
            note: '完整数据备份'
        };

        await generateAndDownloadZip(fullData);
        addChangeLog('备份完整数据', '下载了包含完整数据的ZIP包');

    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败：' + error.message);
    }
}




// 修改所有权限检查函数，先检查管理员权限
function canDelete() { 
    return isAdmin() || (hasPermission ? hasPermission('deleteItems') : false); 
}

function canEditTime() { 
    return isAdmin() || (hasPermission ? hasPermission('editAll') : false); 
}

function canEditStatus() { 
    return isAdmin() || (hasPermission ? hasPermission('editAll') : false); 
}

function canEditQuote() { 
    return isAdmin() || (hasPermission ? hasPermission('editQuote') : false); 
}

function canClearLog() { 
    return isAdmin() || (hasPermission ? hasPermission('viewLogs') : false); 
}

function canAdd() { 
    return isAdmin() || (hasPermission ? hasPermission('addItems') : false); 
}

function canEditWorkerRating() { 
    return isAdmin() || (hasPermission ? hasPermission('editAll') : false); 
}

function canEditWorkerTime() { 
    return isAdmin() || (hasPermission ? hasPermission('editAll') : false); 
}

function canEditNote() { 
    return isAdmin() || (hasPermission ? hasPermission('editAll') : false); 
}


// 可选：添加一个查看配置的函数
function showCurrentConfig() {
    alert(`当前GitHub配置：
Gist ID: ${GIST_CONFIG.GIST_ID.substring(0, 8)}...
Token: ${GIST_CONFIG.GITHUB_TOKEN.substring(0, 8)}...
配置状态: ${GIST_CONFIG.configLoaded ? '已加载' : '未加载'}`);
}





// ==================== 配置管理 ====================
// 在 yun.js 的 loadGithubConfig 函数中确保内置配置被保存
async function loadGithubConfig() {
    console.log('开始加载 GitHub 配置...');
    
    // 先尝试从 localStorage 读取
    const savedConfig = localStorage.getItem('github_config');
    
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            GIST_CONFIG.GIST_ID = config.GIST_ID || BUILT_IN_CONFIG.GIST_ID;
            GIST_CONFIG.GITHUB_TOKEN = config.GITHUB_TOKEN || BUILT_IN_CONFIG.GITHUB_TOKEN;
            GIST_CONFIG.configLoaded = true;
            console.log('已从 localStorage 加载 GitHub 配置');
            return true;
        } catch (e) {
            console.warn('解析 localStorage 配置失败:', e);
            localStorage.removeItem('github_config');
        }
    }
    
    // 使用内置配置
    console.log('使用内置 GitHub 配置');
    
    // 确保内置配置被保存到 localStorage，以便权限模块使用
    const configToSave = {
        GIST_ID: BUILT_IN_CONFIG.GIST_ID,
        GITHUB_TOKEN: BUILT_IN_CONFIG.GITHUB_TOKEN,
        configLoaded: true
    };
    
    localStorage.setItem('github_config', JSON.stringify(configToSave));
    
    GIST_CONFIG.GIST_ID = BUILT_IN_CONFIG.GIST_ID;
    GIST_CONFIG.GITHUB_TOKEN = BUILT_IN_CONFIG.GITHUB_TOKEN;
    GIST_CONFIG.configLoaded = true;
    
    console.log('内置 GitHub 配置已保存到 localStorage');
    return true;
}
// 在 quanxian.js 中添加一个检查 GitHub 配置的函数
function checkGitHubConfig() {
    // 首先检查 localStorage
    const savedConfig = localStorage.getItem('github_config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            if (config.GIST_ID && config.GITHUB_TOKEN) {
                return config;
            }
        } catch (e) {
            console.warn('解析 GitHub 配置失败:', e);
        }
    }
    
    // 检查全局变量
    if (window.GIST_CONFIG && window.GIST_CONFIG.configLoaded) {
        return {
            GIST_ID: window.GIST_CONFIG.GIST_ID,
            GITHUB_TOKEN: window.GIST_CONFIG.GITHUB_TOKEN
        };
    }
    
    // 检查 BUILT_IN_CONFIG
    if (window.BUILT_IN_CONFIG && window.BUILT_IN_CONFIG.GIST_ID) {
        return {
            GIST_ID: window.BUILT_IN_CONFIG.GIST_ID,
            GITHUB_TOKEN: window.BUILT_IN_CONFIG.GITHUB_TOKEN
        };
    }
    
    return null;
}

// 修改 exportPermissionConfig 函数，添加配置检查
function exportPermissionConfig() {
    if (!isAdmin()) {
        alert('只有管理员可以导出权限配置！');
        return;
    }
    
    // 检查 GitHub 配置
    const config = checkGitHubConfig();
    if (!config) {
        alert('请先配置GitHub同步！\n\n点击"配置管理"按钮进行配置。');
        
        // 尝试显示配置管理按钮
        const manageConfigBtn = document.querySelector('[onclick*="manageGithubConfig"]');
        if (manageConfigBtn) {
            alert('请点击页面顶部的"配置管理"按钮进行GitHub配置。');
        }
        return;
    }
    
    const yonghuJsContent = `// 权限配置数据结构
const PERMISSION_CONFIG = ${JSON.stringify(PERMISSION_CONFIG, null, 4)};

// ==================== 权限管理系统 ====================
// 内置用户列表
const builtInUsers = ${JSON.stringify(builtInUsers, null, 2)};
`;
    
    // 只保留导出到云端功能
    uploadToCloudDirectly(yonghuJsContent);
}
// 添加获取云端数据的函数
async function fetchCloudData() {
    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_CONFIG.GIST_ID}`, {
            headers: {
                'Authorization': `token ${GIST_CONFIG.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const gist = await response.json();
        const fileContent = gist.files['construction_data.json']?.content;
        
        if (!fileContent) {
            return { sites: [], changeLog: [] };
        }
        
        return JSON.parse(fileContent);
    } catch (error) {
        console.warn('获取云端数据失败:', error);
        return { sites: [], changeLog: [] };
    }
}

// 添加合并工地数据的函数
function mergeSites(cloudSites, localSites) {
    const mergedSites = [...cloudSites];
    
    for (const localSite of localSites) {
        const existingIndex = mergedSites.findIndex(s => s.id === localSite.id);
        
        if (existingIndex >= 0) {
            // 合并现有工地（本地数据优先）
            const cloudSite = mergedSites[existingIndex];
            
            // 基础信息用本地数据覆盖
            cloudSite.name = localSite.name || cloudSite.name;
            cloudSite.startDate = localSite.startDate || cloudSite.startDate;
            cloudSite.endDate = localSite.endDate || cloudSite.endDate;
            cloudSite.progress = localSite.progress !== undefined ? localSite.progress : cloudSite.progress;
            
            // 报价信息
            const quoteFields = ['basicQuote', 'materialQuote', 'equipmentQuote', 'furnitureQuote', 'otherQuote', 'totalQuote'];
            quoteFields.forEach(field => {
                if (localSite[field] !== undefined) {
                    cloudSite[field] = localSite[field];
                }
            });
            
            // 合并数组数据
            ['todos', 'expenses', 'requirements', 'repairs', 'workers', 
             'addRemoveItems', 'drawings', 'experiences'].forEach(arrayField => {
                if (localSite[arrayField] && Array.isArray(localSite[arrayField])) {
                    if (!cloudSite[arrayField]) {
                        cloudSite[arrayField] = [];
                    }
                    
                    // 创建ID集合用于快速查找
                    const existingIds = new Set(cloudSite[arrayField].map(item => item.id));
                    
                    // 添加本地特有的项目
                    localSite[arrayField].forEach(localItem => {
                        if (!existingIds.has(localItem.id)) {
                            cloudSite[arrayField].push(localItem);
                        } else {
                            // 如果已存在，用本地数据更新（基于时间戳判断哪个更新）
                            const cloudItem = cloudSite[arrayField].find(item => item.id === localItem.id);
                            if (cloudItem && localItem.time) {
                                const localTime = new Date(localItem.time);
                                const cloudTime = new Date(cloudItem.time || '2000-01-01');
                                if (localTime > cloudTime) {
                                    Object.assign(cloudItem, localItem);
                                }
                            }
                        }
                    });
                    
                    // 按时间排序
                    cloudSite[arrayField].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
                }
            });
        } else {
            // 添加新工地
            mergedSites.push({ ...localSite });
        }
    }
    
    return mergedSites;
}

// 添加合并更改日志的函数
function mergeChangeLogs(cloudLogs, localLogs) {
    const mergedLogs = [...cloudLogs];
    const logKeys = new Set(cloudLogs.map(log => `${log.timestamp}-${log.user}-${log.action}`));
    
    // 添加本地特有的日志
    localLogs.forEach(localLog => {
        const logKey = `${localLog.timestamp}-${localLog.user}-${localLog.action}`;
        if (!logKeys.has(logKey)) {
            mergedLogs.unshift(localLog);
            logKeys.add(logKey);
        }
    });
    
    // 限制日志数量并排序
    return mergedLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 1000);
}


// ==================== GitHub同步函数 ====================
// 修改 yun.js 中的 saveToGitHub 函数
async function saveToGitHub() {
    console.log('=== 开始saveToGitHub函数 ===');
    
    if (!GIST_CONFIG.configLoaded) {
        const loaded = await loadGithubConfig();
        if (!loaded) {
            showSimpleToast('GitHub配置未完成，无法同步', 'error');
            return false;
        }
    }

    if (isSyncing) {
        showSimpleToast('正在同步中，请稍后重试', 'warning');
        return false;
    }

    // 修改确认提示，明确说明会包含图片
    if (!confirm('即将备份完整数据到云端，包含所有文本和图片数据（图片以base64格式包含在JSON中）。是否继续？')) {
        return false;
    }

    isSyncing = true;

    try {
        // 准备完整数据（包含所有图片的base64）
        const fullData = {
            sites: JSON.parse(JSON.stringify(sites)),
            changeLog: JSON.parse(JSON.stringify(changeLog)),
            lastSync: new Date().toISOString(),
            user: currentUser.name,
            syncVersion: '2.3',
            hasFiles: true,
            note: '完整数据备份（包含图片base64）',
            backupType: 'full_with_images'
        };

        // 不删除base64数据，因为这是完整备份
        // removeAllBase64Data(fullData.sites); // 确保这行被注释掉

        console.log('准备上传数据，站点数量:', fullData.sites.length);
        console.log('数据是否包含图片base64:', checkIfHasFiles(fullData.sites));
        
        // 计算数据大小
        const dataString = JSON.stringify(fullData);
        console.log('JSON数据大小:', (dataString.length / 1024).toFixed(2), 'KB');
        
        // 如果数据太大，可能需要分块，但这里先直接上传
        if (dataString.length > 10 * 1024 * 1024) { // 大于10MB
            if (!confirm('警告：数据大小超过10MB，上传可能会失败。是否继续？')) {
                isSyncing = false;
                return false;
            }
        }

        const response = await fetch(`https://api.github.com/gists/${GIST_CONFIG.GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GIST_CONFIG.GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                description: `工地装饰管理系统完整数据备份 - ${new Date().toLocaleString()}（包含图片）`,
                files: {
                    'construction_data.json': {
                        content: dataString
                    }
                }
            })
        });

        if (response.ok) {
            showSimpleToast('完整数据（含图片）已备份到云端！');
            addChangeLog('云端备份', '备份了完整数据（包含图片base64）到云端');
            return true;
        } else {
            const error = await response.text();
            console.error('云端备份失败:', error);
            showSimpleToast('云端备份失败', 'error');
            return false;
        }

    } catch (error) {
        console.error('云端备份异常:', error);
        showSimpleToast('备份失败: ' + error.message, 'error');
        return false;
    } finally {
        isSyncing = false;
    }
}

// 添加检查函数
function checkIfHasFiles(sitesArray) {
    if (!sitesArray) return false;
    
    let hasFiles = false;
    let totalSize = 0;
    
    sitesArray.forEach(site => {
        if (site.repairs) {
            site.repairs.forEach(repair => {
                if (repair.photo && repair.photo.startsWith('data:')) {
                    hasFiles = true;
                    // 估算base64大小
                    totalSize += Math.floor(repair.photo.length * 3 / 4);
                }
            });
        }
        
        if (site.drawings) {
            site.drawings.forEach(drawing => {
                if (drawing.file && drawing.file.startsWith('data:')) {
                    hasFiles = true;
                    totalSize += Math.floor(drawing.file.length * 3 / 4);
                }
            });
        }
    });
    
    console.log('图片数据估算大小:', (totalSize / 1024 / 1024).toFixed(2), 'MB');
    return hasFiles;
}

// 在 yun.js 中添加这个函数
function convertAllTimesToDate() {
    if (!sites) return;
    
    sites.forEach(site => {
        if (site.todos) {
            site.todos.forEach(todo => {
                if (todo.time && !todo.time.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    todo.time = formatDate(todo.time);
                }
            });
        }

        function convertAllTimesToDate() {
    sites.forEach(site => {
        if (site.todos) {
            site.todos.forEach(todo => {
                if (todo.time && !todo.time.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    todo.time = formatDate(todo.time);
                }
            });
        }

        if (site.expenses) {
            site.expenses.forEach(expense => {
                if (expense.time && !expense.time.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    expense.time = formatDate(expense.time);
                }
            });
        }

        if (site.requirements) {
            site.requirements.forEach(req => {
                if (req.time && !req.time.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    req.time = formatDate(req.time);
                }
            });
        }

        if (site.repairs) {
            site.repairs.forEach(repair => {
                if (repair.time && !repair.time.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    repair.time = formatDate(repair.time);
                }
            });
        }

        if (site.workers) {
            site.workers.forEach(worker => {
                if (worker.time && !worker.time.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    worker.time = formatDate(worker.time);
                }
                if (worker.startTime && !worker.startTime.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    worker.startTime = formatDate(worker.startTime);
                }
                if (worker.endTime && !worker.endTime.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    worker.endTime = formatDate(worker.endTime);
                }
            });
        }

        if (site.addRemoveItems) {
            site.addRemoveItems.forEach(item => {
                if (item.time && !item.time.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    item.time = formatDate(item.time);
                }
            });
        }

        if (site.drawings) {
            site.drawings.forEach(drawing => {
                if (drawing.time && !drawing.time.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    drawing.time = formatDate(drawing.time);
                }
            });
        }

        if (site.experiences) {
            site.experiences.forEach(exp => {
                if (exp.time && !exp.time.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    exp.time = formatDate(exp.time);
                }
            });
        }
    });
}

    });
}
async function generateAndDownloadZip(textData) {
    try {
        if (typeof JSZip === 'undefined') {
            alert('JSZip 库未加载，无法生成 ZIP 文件');
            return;
        }

        const zip = new JSZip();

        const jsContent = `// 工地装饰管理系统数据文件（文本版）
// 生成时间：${new Date().toLocaleString('zh-CN')}
// 生成用户：${currentUser.name}
// 数据版本：${textData.dataVersion}
// 说明：此文件只包含路径信息，需要配合shuju文件夹中的文件使用
const savedData = ${JSON.stringify(textData, null, 2)};`;

        zip.file('shuju_light.js', jsContent);

        const shujuFolder = zip.folder('shuju');
        const locationInfo = {
            info: '图片和文件位置信息',
            generated: new Date().toLocaleString('zh-CN'),
            user: currentUser.name,
            totalSites: sites.length,
            sites: []
        };

        for (let i = 0; i < sites.length; i++) {
            const site = sites[i];
            const siteName = (site.name || `工地_${site.id}`).replace(/[\\/:*?"<>|]/g, '_');
            const siteFolder = shujuFolder.folder(siteName);

            const siteInfo = {
                id: site.id,
                name: site.name,
                folder: siteName,
                repairs: [],
                drawings: []
            };

            if (site.repairs && site.repairs.length > 0) {
                const repairsFolder = siteFolder.folder('repairs');
                for (let j = 0; j < site.repairs.length; j++) {
                    const repair = site.repairs[j];
                    if (repair.photo && repair.photo.startsWith('data:')) {
                        const match = repair.photo.match(/^data:([^;]+);base64,(.+)$/);
                        if (match) {
                            const mimeType = match[1];
                            const base64Data = match[2];
                            const extension = getExtensionFromMimeType(mimeType) || 'jpg';
                            const fileName = `repair_${j + 1}.${extension}`;

                            repairsFolder.file(fileName, base64Data, { base64: true });

                            siteInfo.repairs.push({
                                index: j,
                                repairId: repair.id,
                                repairContent: repair.content,
                                fileName: fileName,
                                path: `${siteName}/repairs/${fileName}`,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
            }

            if (site.drawings && site.drawings.length > 0) {
                const drawingsFolder = siteFolder.folder('drawings');
                for (let j = 0; j < site.drawings.length; j++) {
                    const drawing = site.drawings[j];
                    if (drawing.file && drawing.file.startsWith('data:')) {
                        const match = drawing.file.match(/^data:([^;]+);base64,(.+)$/);
                        if (match) {
                            const mimeType = match[1];
                            const base64Data = match[2];
                            const extension = getExtensionFromMimeType(mimeType) ||
                                getExtensionFromFileName(drawing.fileName) ||
                                'bin';
                            let fileName = drawing.fileName ||
                                `drawing_${j + 1}.${extension}`;
                            fileName = fileName.replace(/[\\/:*?"<>|]/g, '_');

                            drawingsFolder.file(fileName, base64Data, { base64: true });

                            siteInfo.drawings.push({
                                index: j,
                                drawingId: drawing.id,
                                drawingType: drawing.type,
                                fileName: fileName,
                                originalName: drawing.fileName,
                                path: `${siteName}/drawings/${fileName}`,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
            }

            if (siteInfo.repairs.length > 0 || siteInfo.drawings.length > 0) {
                locationInfo.sites.push(siteInfo);
            }
        }

        zip.file('文件位置信息.json', JSON.stringify(locationInfo, null, 2));

        const readmeContent = `工地装饰管理系统完整数据备份包

文件结构：
├── shuju_light.js            # 文本数据文件（不包含base64）
├── 文件位置信息.json         # 图片和文件位置信息
└── shuju/                    # 文件和图片文件夹
    ├── 工地1/                # 第一个工地文件夹
    │   ├── repairs/         # 维修图片
    │   └── drawings/        # 图纸文件
    ├── 工地2/
    │   ├── repairs/
    │   └── drawings/
    └── ...

恢复说明：
1. 将此ZIP包解压到网站根目录
2. 系统会自动加载 shuju_light.js 和对应的图片文件
3. 如需手动加载，可使用"从文件加载数据"功能

生成时间：${new Date().toLocaleString('zh-CN')}
生成用户：${currentUser.name}
数据版本：${textData.dataVersion}`;

        zip.file('README_恢复说明.txt', readmeContent);

        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `工地完整数据备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}_${currentUser.name}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('完整数据ZIP包已生成并下载');

    } catch (error) {
        console.error('生成ZIP包失败:', error);
        throw new Error('生成ZIP包失败：' + error.message);
    }
}

async function saveImagesZipOnly() {
    try {
        if (typeof JSZip === 'undefined') {
            alert('JSZip 库未加载，无法生成 ZIP 文件');
            return;
        }

        const zip = new JSZip();

        const readmeContent = `工地装饰管理系统图片数据包

文件说明：
1. 此ZIP包仅包含图片和文件数据
2. 文本数据已上传到GitHub Gist云端
3. 文件夹结构：
  工地名称/
    ├── repairs/          # 维修图片文件夹
    │   ├── repair_1.jpg
    │   └── repair_2.jpg
    └── drawings/         # 图纸文件夹
        ├── drawing_1.pdf
        └── drawing_2.xlsx

恢复说明：
1. 请确保已从云端同步文本数据
2. 系统会自动根据路径加载对应的图片文件
3. 如需手动加载，可使用"手动加载"功能

生成时间：${new Date().toLocaleString('zh-CN')}
生成用户：${currentUser.name}`;

        zip.file('README_图片包说明.txt', readmeContent);

        let locationInfo = {
            info: '图片位置信息文件 - 用于系统定位图片',
            generated: new Date().toLocaleString('zh-CN'),
            user: currentUser.name,
            totalSites: sites.length,
            sites: []
        };

        for (let i = 0; i < sites.length; i++) {
            const site = sites[i];
            const siteName = (site.name || `工地_${site.id}`).replace(/[\\/:*?"<>|]/g, '_');
            const siteFolder = zip.folder(siteName);

            const siteInfo = {
                id: site.id,
                name: site.name,
                folder: siteName,
                repairs: [],
                drawings: []
            };

            if (site.repairs && site.repairs.length > 0) {
                const repairsFolder = siteFolder.folder('repairs');
                for (let j = 0; j < site.repairs.length; j++) {
                    const repair = site.repairs[j];
                    if (repair.photo && repair.photo.startsWith('data:')) {
                        const match = repair.photo.match(/^data:([^;]+);base64,(.+)$/);
                        if (match) {
                            const mimeType = match[1];
                            const base64Data = match[2];
                            const extension = getExtensionFromMimeType(mimeType) || 'jpg';
                            const fileName = `repair_${j + 1}.${extension}`;

                            repairsFolder.file(fileName, base64Data, { base64: true });

                            siteInfo.repairs.push({
                                index: j,
                                repairId: repair.id,
                                fileName: fileName,
                                path: `${siteName}/repairs/${fileName}`,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
            }

            if (site.drawings && site.drawings.length > 0) {
                const drawingsFolder = siteFolder.folder('drawings');
                for (let j = 0; j < site.drawings.length; j++) {
                    const drawing = site.drawings[j];
                    if (drawing.file && drawing.file.startsWith('data:')) {
                        const match = drawing.file.match(/^data:([^;]+);base64,(.+)$/);
                        if (match) {
                            const mimeType = match[1];
                            const base64Data = match[2];
                            const extension = getExtensionFromMimeType(mimeType) ||
                                getExtensionFromFileName(drawing.fileName) ||
                                'bin';
                            let fileName = drawing.fileName ||
                                `drawing_${j + 1}.${extension}`;
                            fileName = fileName.replace(/[\\/:*?"<>|]/g, '_');

                            drawingsFolder.file(fileName, base64Data, { base64: true });

                            siteInfo.drawings.push({
                                index: j,
                                drawingId: drawing.id,
                                fileName: fileName,
                                originalName: drawing.fileName,
                                path: `${siteName}/drawings/${fileName}`,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
            }

            if (siteInfo.repairs.length > 0 || siteInfo.drawings.length > 0) {
                locationInfo.sites.push(siteInfo);
            }
        }

        zip.file('文件位置信息.json', JSON.stringify(locationInfo, null, 2));

        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `工地图片数据包_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addChangeLog('保存云端图片包', '保存了仅包含图片的ZIP数据包');
        showSimpleToast('图片数据包已保存！此ZIP仅包含图片，文本数据已在云端。');

    } catch (error) {
        console.error('保存图片ZIP失败:', error);
        alert('保存图片数据包失败：' + error.message);
    }
}

async function loadFromJsFile() {
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    // 修改为覆盖导入提示
    if (!confirm('警告：从文件加载数据将完全覆盖当前所有数据！\n请确保已经备份当前数据。\n是否继续？')) {
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            if (typeof JSZip === 'undefined') {
                alert('JSZip 库未加载，无法处理 ZIP 文件');
                return;
            }

            // 清空现有数据（覆盖）
            sites = [];
            changeLog = [];
            
            const zip = await JSZip.loadAsync(file);
            
            // 查找数据文件
            let dataFile = null;
            const possibleDataFiles = [
                'shuju.js',
                'shuju_light.js',
                'construction_data.json'
            ];

            for (const fileName of possibleDataFiles) {
                const fileInZip = zip.file(fileName);
                if (fileInZip) {
                    dataFile = fileInZip;
                    console.log(`在ZIP中找到数据文件: ${fileName}`);
                    break;
                }
            }

            if (!dataFile) {
                throw new Error('ZIP 文件中未找到数据文件');
            }

            const content = await dataFile.async('text');

            if (dataFile.name.endsWith('.js')) {
                await loadFromJsContent(content);
            } else if (dataFile.name.endsWith('.json')) {
                await loadFromJsonContent(content, dataFile.name);
            }

            // 恢复图片文件
            await restoreFilesFromZip(zip);

            saveData();
            renderSiteList();
            
            addChangeLog('从文件加载数据', `从文件 ${file.name} 覆盖导入数据`);
            alert(`数据加载成功！\n已加载 ${sites.length} 个工地数据。`);

        } catch (error) {
            console.error('加载失败:', error);
            alert('加载失败：' + error.message);
        }
    };
    input.click();
}

async function restoreFilesFromZip(zip) {
    console.log('开始从ZIP恢复文件...');
    
    let restoredCount = 0;
    let failedCount = 0;
    
    // 首先尝试从位置信息文件恢复
    const locationInfoFile = zip.file('文件位置信息.json');
    if (locationInfoFile) {
        try {
            const locationInfo = JSON.parse(await locationInfoFile.async('text'));
            console.log('找到位置信息文件:', locationInfo);
            
            for (const siteInfo of locationInfo.sites || []) {
                const site = sites.find(s => {
                    if (s.id === siteInfo.id) return true;
                    const siteNameNormalized = (s.name || `site_${s.id}`).replace(/[\\/:*?"<>|]/g, '_');
                    return siteNameNormalized === siteInfo.folder;
                });
                
                if (site) {
                    // 恢复维修图片
                    for (const repairInfo of siteInfo.repairs || []) {
                        const file = zip.file(repairInfo.path);
                        if (file) {
                            try {
                                const base64 = await file.async('base64');
                                const mimeType = getMimeTypeFromFileName(repairInfo.fileName);
                                const dataUrl = `data:${mimeType};base64,${base64}`;
                                
                                // 压缩图片到50KB以下
                                const compressedDataUrl = await compressImageTo50KB(dataUrl);
                                
                                // 更新维修项
                                if (site.repairs && site.repairs[repairInfo.index]) {
                                    site.repairs[repairInfo.index].photo = compressedDataUrl;
                                    restoredCount++;
                                }
                            } catch (e) {
                                console.warn('恢复维修图片失败:', e);
                                failedCount++;
                            }
                        }
                    }
                    
                    // 恢复图纸文件
                    for (const drawingInfo of siteInfo.drawings || []) {
                        const file = zip.file(drawingInfo.path);
                        if (file) {
                            try {
                                const base64 = await file.async('base64');
                                const mimeType = getMimeTypeFromFileName(drawingInfo.fileName);
                                const dataUrl = `data:${mimeType};base64,${base64}`;
                                
                                // 更新图纸
                                if (site.drawings && site.drawings[drawingInfo.index]) {
                                    site.drawings[drawingInfo.index].file = dataUrl;
                                    site.drawings[drawingInfo.index].fileName = drawingInfo.fileName;
                                    restoredCount++;
                                }
                            } catch (e) {
                                console.warn('恢复图纸文件失败:', e);
                                failedCount++;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('解析位置信息文件失败:', error);
        }
    }
    
    // 如果没有位置信息文件，尝试按文件夹结构恢复
    if (restoredCount === 0) {
        console.log('按文件夹结构恢复文件...');
        
        const filePromises = [];
        zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                filePromises.push(processZipFile(zipEntry, relativePath));
            }
        });
        
        const results = await Promise.allSettled(filePromises);
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                restoredCount++;
            } else if (result.status === 'rejected') {
                failedCount++;
            }
        });
    }
    
    console.log(`文件恢复完成: 成功 ${restoredCount} 个, 失败 ${failedCount} 个`);
    return { restoredCount, failedCount };
}
// 替换原来的 compressImageTo50KB 函数
async function compressImageTo50KB(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置最大宽度为500像素
            let width = img.width;
            let height = img.height;
            const MAX_WIDTH = 500;
            
            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 绘制图片，质量为0.6
            ctx.drawImage(img, 0, 0, width, height);
            
            // 根据原始图片类型输出
            const mimeType = dataUrl.split(';')[0].split(':')[1];
            let quality = 0.6;
            
            if (mimeType === 'image/jpeg') {
                // JPEG使用0.6质量
                resolve(canvas.toDataURL('image/jpeg', quality));
            } else if (mimeType === 'image/png') {
                // PNG不需要质量参数
                resolve(canvas.toDataURL('image/png'));
            } else if (mimeType === 'image/webp') {
                // WebP使用0.6质量
                resolve(canvas.toDataURL('image/webp', quality));
            } else {
                // 其他格式转为JPEG
                resolve(canvas.toDataURL('image/jpeg', quality));
            }
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}
function previewRepairPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        event.target.value = '';
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('图片太大，请选择小于10MB的图片！');
        event.target.value = '';
        return;
    }

    compressImageTo50KB(URL.createObjectURL(file)).then((compressedDataUrl) => {
        const preview = document.getElementById('repairPhotoPreview');
        preview.innerHTML = `
            <div style="text-align: center; padding: 10px;">
                <img src="${compressedDataUrl}" class="image-preview" onclick="viewImage('${compressedDataUrl}')">
                <div style="margin-top: 5px; font-size: 12px; color: #666;">
                    ${file.name}<br>
                    <small>已压缩: ${(compressedDataUrl.length / 1024).toFixed(1)}KB</small>
                </div>
            </div>
        `;
        preview.dataset.originalData = compressedDataUrl;
        preview.dataset.fileName = file.name;
    });
}

function previewDrawing(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('drawingPreview');
    
    if (file.type.startsWith('image/')) {
        compressImageTo50KB(URL.createObjectURL(file)).then((compressedDataUrl) => {
            preview.innerHTML = `
                <div style="text-align: center; padding: 10px;">
                    <img src="${compressedDataUrl}" class="image-preview" onclick="viewImage('${compressedDataUrl}')">
                    <div style="margin-top: 5px; font-size: 12px; color: #666;">
                        ${file.name} (${(file.size / 1024).toFixed(1)} KB)
                        <br><small>已压缩: ${(compressedDataUrl.length / 1024).toFixed(1)}KB</small>
                    </div>
                </div>
            `;
            preview.dataset.originalData = compressedDataUrl;
            preview.dataset.fileName = file.name;
            preview.dataset.fileType = file.type;
            preview.dataset.fileSize = file.size;
        });
    } else {
        // 非图片文件直接预览
        const reader = new FileReader();
        reader.onload = function (e) {
            const dataUrl = e.target.result;
            
            preview.dataset.originalData = dataUrl;
            preview.dataset.fileName = file.name;
            preview.dataset.fileType = file.type;
            preview.dataset.fileSize = file.size;

            let icon = '📄';
            let typeText = '文档';

            if (file.type.includes('pdf')) {
                icon = '📕';
                typeText = 'PDF文件';
            } else if (file.type.includes('excel') || file.type.includes('sheet')) {
                icon = '📊';
                typeText = 'Excel文件';
            } else if (file.type.includes('word')) {
                icon = '📝';
                typeText = 'Word文件';
            } else if (file.type.includes('csv')) {
                icon = '📋';
                typeText = 'CSV文件';
            }

            preview.innerHTML = `
                <div style="text-align: center; padding: 10px;">
                    <div style="font-size: 48px; color: #667eea;">${icon}</div>
                    <div style="font-weight: bold; margin: 10px 0;">${typeText}</div>
                    <div style="word-break: break-all;">${file.name}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        ${(file.size / 1024).toFixed(1)} KB
                    </div>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}
async function loadFromZipFile(file) {
    if (typeof JSZip === 'undefined') {
        alert('JSZip 库未加载，无法处理 ZIP 文件');
        throw new Error('JSZip 库未加载');
    }

    const zip = await JSZip.loadAsync(file);

    let dataFile = null;
    const possibleDataFiles = [
        'shuju.js',
        'shuju_light.js',
        'construction_data.json'
    ];

    for (const fileName of possibleDataFiles) {
        const fileInZip = zip.file(fileName);
        if (fileInZip) {
            dataFile = fileInZip;
            console.log(`在ZIP中找到数据文件: ${fileName}`);
            break;
        }
    }

    if (!dataFile) {
        const allFiles = Object.keys(zip.files);
        const jsFiles = allFiles.filter(name => name.endsWith('.js'));
        const jsonFiles = allFiles.filter(name => name.endsWith('.json'));

        if (jsFiles.length > 0) {
            dataFile = zip.file(jsFiles[0]);
        } else if (jsonFiles.length > 0) {
            dataFile = zip.file(jsonFiles[0]);
        }
    }

    if (!dataFile) {
        throw new Error('ZIP 文件中未找到数据文件');
    }

    const content = await dataFile.async('text');

    if (dataFile.name.endsWith('.js')) {
        await loadFromJsContent(content);
    } else if (dataFile.name.endsWith('.json')) {
        await loadFromJsonContent(content, dataFile.name);
    }

    await restoreFilesFromZip(zip);

    console.log('从 ZIP 文件加载完整数据成功');
}

async function restoreImagesFromZip(zip) {
    let restoredCount = 0;
    let failedCount = 0;

    const locationInfoFile = zip.file('文件位置信息.json');
    if (locationInfoFile) {
        try {
            const locationInfo = JSON.parse(await locationInfoFile.async('text'));
            console.log('找到位置信息文件:', locationInfo);

            for (const siteInfo of locationInfo.sites) {
                const site = sites.find(s => {
                    if (s.id === siteInfo.id) return true;
                    const siteNameNormalized = (s.name || `site_${s.id}`).replace(/[\\/:*?"<>|]/g, '_');
                    return siteNameNormalized === siteInfo.folder;
                });

                if (site) {
                    for (const repairInfo of siteInfo.repairs) {
                        const repair = site.repairs && site.repairs.find(r => {
                            return r.id === repairInfo.repairId ||
                                (r.photo && r.photo.includes(repairInfo.fileName));
                        });

                        if (repair) {
                            const file = zip.file(repairInfo.path);
                            if (file) {
                                const base64 = await file.async('base64');
                                const mimeType = getMimeTypeFromFileName(repairInfo.fileName);
                                repair.photo = `data:${mimeType};base64,${base64}`;
                                console.log(`恢复维修图片: ${repairInfo.path}`);
                                restoredCount++;
                            } else {
                                console.warn(`ZIP中未找到文件: ${repairInfo.path}`);
                                failedCount++;
                            }
                        }
                    }

                    for (const drawingInfo of siteInfo.drawings) {
                        const drawing = site.drawings && site.drawings.find(d => {
                            return d.id === drawingInfo.drawingId ||
                                (d.file && d.file.includes(drawingInfo.fileName));
                        });

                        if (drawing) {
                            const file = zip.file(drawingInfo.path);
                            if (file) {
                                const base64 = await file.async('base64');
                                const mimeType = getMimeTypeFromFileName(drawingInfo.fileName);
                                drawing.file = `data:${mimeType};base64,${base64}`;
                                console.log(`恢复图纸文件: ${drawingInfo.path}`);
                                restoredCount++;
                            } else {
                                console.warn(`ZIP中未找到文件: ${drawingInfo.path}`);
                                failedCount++;
                            }
                        }
                    }
                } else {
                    console.warn(`未找到对应的工地: ${siteInfo.folder}`);
                }
            }
        } catch (error) {
            console.warn('解析位置信息文件失败:', error);
        }
    }

    if (restoredCount === 0) {
        console.log('未找到位置信息文件，按文件夹结构恢复...');

        const filePromises = [];
        zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                filePromises.push(processZipFile(zipEntry, relativePath));
            }
        });

        const results = await Promise.allSettled(filePromises);
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                if (result.value) restoredCount++;
            } else {
                console.warn('处理文件失败:', result.reason);
                failedCount++;
            }
        });
    }

    saveData();

    console.log(`图片恢复完成: 成功 ${restoredCount} 个, 失败 ${failedCount} 个`);

    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setTimeout(() => {
            if (currentSiteId) {
                const site = sites.find(s => s.id === currentSiteId);
                if (site) {
                    loadSiteData(site);
                    fixMobileUI();
                }
            }
        }, 100);
    }

    return { restoredCount, failedCount };
}

async function processZipFile(zipEntry, relativePath) {
    const pathParts = relativePath.split('/');
    if (pathParts.length < 3) return false;

    const siteFolder = pathParts[0];
    const type = pathParts[1];
    const fileName = pathParts.slice(2).join('/');

    const site = sites.find(s => {
        const siteNameNormalized = (s.name || `site_${s.id}`).replace(/[\\/:*?"<>|]/g, '_');
        return siteNameNormalized === siteFolder;
    });

    if (!site) {
        console.warn(`未找到对应工地: ${siteFolder}`);
        return false;
    }

    const base64 = await zipEntry.async('base64');
    const mimeType = getMimeTypeFromFileName(fileName);

    if (type === 'repairs') {
        const repairIndex = extractIndexFromFileName(fileName, 'repair');
        if (repairIndex !== null && site.repairs && site.repairs[repairIndex]) {
            site.repairs[repairIndex].photo = `data:${mimeType};base64,${base64}`;
            console.log(`恢复维修图片: ${relativePath} -> 工地 ${site.name} 的第 ${repairIndex + 1} 个维修项`);
            return true;
        }

        if (site.repairs) {
            const repair = site.repairs.find(r => {
                return r.photo && (r.photo.includes(fileName) || r.photo.includes(siteFolder));
            });
            if (repair) {
                repair.photo = `data:${mimeType};base64,${base64}`;
                console.log(`通过文件名匹配恢复维修图片: ${relativePath}`);
                return true;
            }
        }
    } else if (type === 'drawings') {
        const drawingIndex = extractIndexFromFileName(fileName, 'drawing');
        if (drawingIndex !== null && site.drawings && site.drawings[drawingIndex]) {
            site.drawings[drawingIndex].file = `data:${mimeType};base64,${base64}`;
            site.drawings[drawingIndex].fileName = fileName;
            console.log(`恢复图纸文件: ${relativePath} -> 工地 ${site.name} 的第 ${drawingIndex + 1} 个图纸`);
            return true;
        }

        if (site.drawings) {
            const drawing = site.drawings.find(d => {
                return d.file && (d.file.includes(fileName) || d.file.includes(siteFolder));
            });
            if (drawing) {
                drawing.file = `data:${mimeType};base64,${base64}`;
                drawing.fileName = fileName;
                console.log(`通过文件名匹配恢复图纸文件: ${relativePath}`);
                return true;
            }
        }
    }

    console.warn(`无法匹配文件: ${relativePath}`);
    return false;
}

// ==================== 工具函数 ====================
function extractIndexFromFileName(fileName, prefix) {
    const regex = new RegExp(`${prefix}_(\\d+)\\.`);
    const match = fileName.match(regex);
    return match ? parseInt(match[1], 10) - 1 : null;
}

function removeAllBase64Data(sitesArray) {
    if (!sitesArray) return;

    sitesArray.forEach(site => {
        const siteName = (site.name || `site_${site.id}`).replace(/[\\/:*?"<>|]/g, '_');

        if (site.repairs) {
            site.repairs.forEach((repair, index) => {
                if (repair.photo && repair.photo.startsWith('data:')) {
                    const extension = repair.photo.match(/^data:image\/(\w+);/)?.[1] || 'jpg';
                    repair.photo = `[PHOTO:${siteName}/repairs/repair_${index + 1}.${extension}]`;
                    repair.hasPhoto = true;
                }
            });
        }

        if (site.drawings) {
            site.drawings.forEach((drawing, index) => {
                if (drawing.file && drawing.file.startsWith('data:')) {
                    const match = drawing.file.match(/^data:([^;]+);/);
                    if (match) {
                        const mimeType = match[1];
                        const extension = getExtensionFromMimeType(mimeType) || 'bin';
                        let fileName = drawing.fileName || `drawing_${index + 1}.${extension}`;
                        fileName = fileName.replace(/[\\/:*?"<>|]/g, '_');
                        drawing.file = `[FILE:${siteName}/drawings/${fileName}]`;
                        drawing.hasFile = true;
                    }
                }
            });
        }
    });
}



function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getMimeTypeFromFileName(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
        'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
        'gif': 'image/gif', 'webp': 'image/webp', 'bmp': 'image/bmp',
        'pdf': 'application/pdf', 'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'csv': 'text/csv', 'txt': 'text/plain', 'json': 'application/json'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

function getExtensionFromMimeType(mimeType) {
    const mimeMap = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
        'image/webp': 'webp', 'image/bmp': 'bmp', 'application/pdf': 'pdf',
        'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'text/csv': 'csv', 'text/plain': 'txt', 'application/json': 'json'
    };
    return mimeMap[mimeType] || 'bin';
}

function getExtensionFromFileName(fileName) {
    if (!fileName) return null;
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : null;
}

function getDrawingTypeText(type) {
    const types = { 'design': '设计图纸', 'quote': '报价表', 'other': '其他' };
    return types[type] || '未知';
}

function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('csv')) return '📋';
    if (fileType.includes('image')) return '🖼️';
    return '📄';
}

// ==================== 移动端UI修复函数 ====================
function fixMobileUI() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!isMobile) return;

    console.log('检测到移动端，修复界面交互...');

    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflowY = 'auto';
        modalContent.style.WebkitOverflowScrolling = 'touch';
    }

    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.style.fontSize = '16px';
        input.addEventListener('focus', function () {
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });

    const buttons = document.querySelectorAll('.btn, .action-btn');
    buttons.forEach(btn => {
        btn.style.minHeight = '44px';
        btn.style.minWidth = '44px';
        btn.style.cursor = 'pointer';
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-label', btn.textContent || '按钮');
    });

    const tables = document.querySelectorAll('.data-table');
    tables.forEach(table => {
        table.style.WebkitOverflowScrolling = 'touch';
        table.style.overflowX = 'auto';
    });

    const imagePreviews = document.querySelectorAll('.image-preview');
    imagePreviews.forEach(img => {
        img.style.minHeight = '44px';
        img.style.minWidth = '44px';
        img.style.cursor = 'pointer';
    });

    const fileUploads = document.querySelectorAll('.file-upload-label');
    fileUploads.forEach(label => {
        label.style.minHeight = '60px';
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.justifyContent = 'center';
    });

    console.log('移动端界面修复完成');
}

function optimizeMobileTables() {
    const tables = document.querySelectorAll('.data-table');
    if (tables.length === 0) return;
    
    tables.forEach(table => {
        table.style.tableLayout = 'fixed';
        table.style.width = '100%';
        
        const ths = table.querySelectorAll('th');
        ths.forEach(th => {
            th.style.position = 'sticky';
            th.style.top = '0';
            th.style.zIndex = '1';
            th.style.backgroundColor = '#f8f9fa';
            th.style.padding = '8px 6px';
            th.style.fontSize = '12px';
        });
        
        const tds = table.querySelectorAll('td');
        tds.forEach(td => {
            td.style.padding = '8px 6px';
            td.style.fontSize = '12px';
            td.style.lineHeight = '1.3';
            td.style.wordBreak = 'break-word';
        });
        
        const actionBtns = table.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.style.padding = '4px 8px';
            btn.style.fontSize = '11px';
            btn.style.margin = '2px';
            btn.style.minHeight = '24px';
        });
    });
    
    const containers = document.querySelectorAll('.data-table-container');
    containers.forEach(container => {
        container.style.overflowX = 'auto';
        container.style.WebkitOverflowScrolling = 'touch';
        container.style.scrollbarWidth = 'none';
        container.style.maxHeight = '60vh';
        container.style.borderRadius = '8px';
        container.style.border = '1px solid #dee2e6';
    });
}

function setupBackGestureLock() {
    let backGestureCount = 0;
    let backGestureTimer = null;
    
    history.pushState(null, null, window.location.href);
    
    window.addEventListener('popstate', function(e) {
        e.preventDefault();
        
        backGestureCount++;
        
        if (backGestureCount === 1) {
            const lockDiv = document.getElementById('backGestureLock');
            if (lockDiv) {
                lockDiv.classList.add('show');
                
                setTimeout(() => {
                    lockDiv.classList.remove('show');
                }, 3000);
            }
            
            if (backGestureTimer) clearTimeout(backGestureTimer);
            backGestureTimer = setTimeout(() => {
                backGestureCount = 0;
            }, 1000);
        } else if (backGestureCount >= 2) {
            if (confirm('确定要退出系统吗？')) {
                logout();
            } else {
                backGestureCount = 0;
            }
        }
        
        history.pushState(null, null, window.location.href);
    });
}

// ==================== 更改日志相关函数 ====================
function addChangeLog(action, details) {
    if (!currentUser) return;

    const logEntry = {
        timestamp: new Date().toLocaleString('zh-CN'),
        user: currentUser.name,
        action: action,
        details: details,
        siteId: currentSiteId,
        siteName: currentSiteId ? sites.find(s => s.id === currentSiteId)?.name : ''
    };

    changeLog.unshift(logEntry);

    if (changeLog.length > 1000) {
        changeLog = changeLog.slice(0, 1000);
    }

    saveData();
}

function showChangeLog() {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('changeLogPage').style.display = 'block';

    const logList = document.getElementById('changeLogList');
    logList.innerHTML = '';

    if (changeLog.length === 0) {
        logList.innerHTML = '<p class="loading">暂无更改日志</p>';
        return;
    }

    changeLog.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = 'change-log-item';
        logItem.innerHTML = `
            <div class="change-log-header">
                <span>${log.user} - ${log.action}</span>
                <span class="change-log-time">${log.timestamp}</span>
            </div>
            <div class="change-log-content">
                ${log.details}
                ${log.siteName ? `<br><small>工地：${log.siteName}</small>` : ''}
            </div>
        `;
        logList.appendChild(logItem);
    });
}

function hideChangeLog() {
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('changeLogPage').style.display = 'none';
}

function exportChangeLog() {
    const logText = changeLog.map(log =>
        `[${log.timestamp}] ${log.user} - ${log.action}: ${log.details}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `更改日志_${new Date().toLocaleDateString('zh-CN')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
// 在 yun.js 中添加以下函数（可以放在文件末尾的“工具函数”部分）

async function loadFromJsContent(content) {
    try {
        // 使用 Function 构造函数解析 JS 文件内容
        const func = new Function(content + '\nreturn savedData;');
        const data = func();
        
        if (!data) {
            throw new Error('JS 文件中没有找到 savedData 变量');
        }
        
        // 覆盖现有数据
        sites = data.sites || [];
        changeLog = data.changeLog || [];
        
        // 同步到 window 对象
        window.sites = sites;
        window.changeLog = changeLog;
        
        convertAllTimesToDate();
        return true;
        
    } catch (error) {
        console.error('解析 JS 文件失败:', error);
        throw new Error('解析 JS 文件失败: ' + error.message);
    }
}

async function loadFromJsonContent(content, fileName) {
    try {
        const data = JSON.parse(content);
        
        // 覆盖现有数据
        sites = data.sites || [];
        changeLog = data.changeLog || [];
        
        // 同步到 window 对象
        window.sites = sites;
        window.changeLog = changeLog;
        
        convertAllTimesToDate();
        return true;
        
    } catch (error) {
        console.error('解析 JSON 文件失败:', error);
        throw new Error('解析 JSON 文件失败: ' + error.message);
    }
}
function clearChangeLog() {
    if (!canClearLog()) {
        alert('只有管理员可以清空日志！');
        return;
    }

    if (confirm('确定要清空所有更改日志吗？此操作不可恢复！')) {
        changeLog = [];
        saveData();
        // 修复：清空后重新显示日志列表
        showChangeLog();
        addChangeLog('清空日志', '用户清空了所有更改日志');
    }
}
// 修改 yun.js 中的 loadFromGitHub 函数
async function loadFromGitHub() {
    if (!GIST_CONFIG.configLoaded) {
        const loaded = await loadGithubConfig();
        if (!loaded) {
            showSimpleToast('GitHub配置未完成，无法同步', 'error');
            return false;
        }
    }
    
    // 修改提示为合并数据
    if (!confirm('从云端加载数据将与现有数据合并。相同ID的工地将被合并，新工地将被添加。是否继续？')) {
        return;
    }
    
    try {
        let response;
        
        if (GIST_CONFIG.GITHUB_TOKEN) {
            response = await fetch(`https://api.github.com/gists/${GIST_CONFIG.GIST_ID}`, {
                headers: {
                    'Authorization': `token ${GIST_CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
        } else {
            response = await fetch(`https://api.github.com/gists/${GIST_CONFIG.GIST_ID}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const gist = await response.json();
        const fileContent = gist.files['construction_data.json']?.content;
        
        if (!fileContent) {
            throw new Error('云端没有找到数据文件');
        }
        
        const cloudData = JSON.parse(fileContent);
        const cloudSites = cloudData.sites || [];
        const cloudChangeLog = cloudData.changeLog || [];
        
        console.log('从云端加载数据成功，站点数量:', cloudSites.length);
        console.log('数据版本:', cloudData.syncVersion || cloudData.dataVersion || '未知');
        console.log('是否包含图片:', cloudData.hasFiles || checkIfHasFiles(cloudSites));
        
        // 合并工地数据
        mergeCloudData(cloudSites, cloudChangeLog);
        
        saveData();
        renderSiteList();
        
        showSimpleToast('云端数据已合并到本地！');
        
        if (currentSiteId) {
            const site = sites.find(s => s.id === currentSiteId);
            if (site) loadSiteData(site);
        }
        
        return true;
        
    } catch (error) {
        console.error('从云端加载失败:', error);
        showSimpleToast('云端加载失败: ' + error.message, 'error');
        return false;
    }
}

// 确保 mergeCloudData 函数能正确处理图片数据
function mergeCloudData(cloudSites, cloudChangeLog) {
    let addedCount = 0;
    let updatedCount = 0;
    let imageCount = 0;
    
    // 合并工地
    cloudSites.forEach(cloudSite => {
        const existingIndex = sites.findIndex(s => s.id === cloudSite.id);
        
        if (existingIndex >= 0) {
            // 合并现有工地
            const existingSite = sites[existingIndex];
            
            // 基础信息（如果云端有则更新）
            existingSite.name = cloudSite.name || existingSite.name;
            existingSite.startDate = cloudSite.startDate || existingSite.startDate;
            existingSite.endDate = cloudSite.endDate || existingSite.endDate;
            existingSite.progress = cloudSite.progress !== undefined ? cloudSite.progress : existingSite.progress;
            
            // 合并数组数据，图片数据优先使用云端的
            ['todos', 'expenses', 'requirements', 'repairs', 'workers', 
             'addRemoveItems', 'drawings', 'experiences'].forEach(arrayField => {
                if (cloudSite[arrayField] && Array.isArray(cloudSite[arrayField])) {
                    if (!existingSite[arrayField]) {
                        existingSite[arrayField] = [];
                    }
                    
                    // 创建ID集合用于快速查找
                    const existingIds = new Set(existingSite[arrayField].map(item => item.id));
                    
                    // 添加云端特有的项目
                    cloudSite[arrayField].forEach(cloudItem => {
                        const existingItem = existingSite[arrayField].find(item => item.id === cloudItem.id);
                        
                        if (!existingItem) {
                            // 新项目，直接添加
                            existingSite[arrayField].push(cloudItem);
                            // 统计图片数量
                            if (arrayField === 'repairs' && cloudItem.photo && cloudItem.photo.startsWith('data:')) {
                                imageCount++;
                            }
                            if (arrayField === 'drawings' && cloudItem.file && cloudItem.file.startsWith('data:')) {
                                imageCount++;
                            }
                        } else {
                            // 已存在项目，如果云端有图片数据，优先使用云端的
                            if (arrayField === 'repairs' && cloudItem.photo && cloudItem.photo.startsWith('data:')) {
                                existingItem.photo = cloudItem.photo;
                                existingItem.photoName = cloudItem.photoName;
                                imageCount++;
                            }
                            if (arrayField === 'drawings' && cloudItem.file && cloudItem.file.startsWith('data:')) {
                                existingItem.file = cloudItem.file;
                                existingItem.fileName = cloudItem.fileName;
                                existingItem.fileType = cloudItem.fileType;
                                imageCount++;
                            }
                        }
                    });
                }
            });
            
            updatedCount++;
        } else {
            // 添加新工地
            sites.push(cloudSite);
            addedCount++;
            
            // 统计新工地中的图片数量
            if (cloudSite.repairs) {
                cloudSite.repairs.forEach(repair => {
                    if (repair.photo && repair.photo.startsWith('data:')) {
                        imageCount++;
                    }
                });
            }
            if (cloudSite.drawings) {
                cloudSite.drawings.forEach(drawing => {
                    if (drawing.file && drawing.file.startsWith('data:')) {
                        imageCount++;
                    }
                });
            }
        }
    });
    
    // 合并更改日志
    const existingLogKeys = new Set(changeLog.map(log => `${log.timestamp}-${log.user}-${log.action}`));
    cloudChangeLog.forEach(log => {
        const logKey = `${log.timestamp}-${log.user}-${log.action}`;
        if (!existingLogKeys.has(logKey)) {
            changeLog.unshift(log);
            existingLogKeys.add(logKey);
        }
    });
    
    // 限制日志数量
    if (changeLog.length > 1000) {
        changeLog = changeLog.slice(0, 1000);
    }
    
    console.log(`数据合并完成: 新增工地 ${addedCount}, 更新工地 ${updatedCount}, 包含图片 ${imageCount} 个`);
    showSimpleToast(`数据合并成功！新增${addedCount}个工地，更新${updatedCount}个工地，包含${imageCount}个图片文件。`);
}
// 添加手动刷新云端账户功能
function refreshCloudUsers() {
    if (confirm('确定要刷新云端账户数据吗？当前登录状态不会改变。')) {
        const loadingDiv = document.createElement('div');
        loadingDiv.innerHTML = '正在连接云端...';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 9999;
        `;
        document.body.appendChild(loadingDiv);
        
        setTimeout(async () => {
            try {
                console.log('开始刷新云端账户数据...');
                const loaded = await loadCloudUserData();
                
                if (loadingDiv.parentNode) {
                    loadingDiv.remove();
                }
                
                if (loaded) {
                    const cloudUsers = window.builtInUsers.filter(u => !u.isLocal);
                    localStorage.setItem('cloudUserData', JSON.stringify({
                        builtInUsers: cloudUsers,
                        PERMISSION_CONFIG: window.PERMISSION_CONFIG,
                        timestamp: new Date().toISOString()
                    }));
                    
                    const userList = cloudUsers.map(u => `• ${u.name} (${u.username})`).join('\n');
                    alert(`✅ 云端账户数据刷新成功！已加载 ${cloudUsers.length}个账户 `);
                    
                    if (window.currentUser && window.currentUser.username === '1') {
                        if (confirm('云端账户已加载，是否刷新页面使用云端账户登录？')) {
                            location.reload();
                        }
                    }
                } else {
                    showSimpleToast('刷新失败，请检查网络连接或云端配置', 'error');
                }
            } catch (error) {
                console.error('刷新失败:', error);
                
                if (loadingDiv.parentNode) {
                    loadingDiv.remove();
                }
                
                let errorMsg = '加载失败：';
                if (error.message.includes('所有解析方法都失败')) {
                    errorMsg = '云端数据格式不正确，请检查yonghu.js文件格式';
                } else if (error.message.includes('HTTP')) {
                    errorMsg = '网络错误，请检查网络连接';
                } else {
                    errorMsg += error.message;
                }
                
                alert(errorMsg);
                showSimpleToast('刷新失败', 'error');
            }
        }, 100);
    }
}

// 暴露函数到全局
window.loadGithubConfig = loadGithubConfig;
window.manageGithubConfig = manageGithubConfig;
window.saveToGitHub = saveToGitHub;
window.loadFromGitHub = loadFromGitHub;


window.loadFromJsFile = loadFromJsFile;
window.loadImagesZipOnly = loadImagesZipOnly;
window.showChangeLog = showChangeLog;
window.hideChangeLog = hideChangeLog;
window.exportChangeLog = exportChangeLog;
window.clearChangeLog = clearChangeLog;
window.fixMobileUI = fixMobileUI;
window.optimizeMobileTables = optimizeMobileTables;
window.setupBackGestureLock = setupBackGestureLock;
window.refreshCloudUsers = refreshCloudUsers;
// 暴露到全局
window.canManageGithubConfig = canManageGithubConfig;
window.canShowPermissionManager = canShowPermissionManager;
window.canShowChangeLog = canShowChangeLog;
window.isAdmin = isAdmin;


// 暴露到全局
window.canManageGithubConfig = canManageGithubConfig;

window.canShowChangeLog = canShowChangeLog;
window.isAdmin = isAdmin;
window.canDelete = canDelete;
window.canEditTime = canEditTime;
window.canEditStatus = canEditStatus;
window.canEditQuote = canEditQuote;
window.canClearLog = canClearLog;
window.canAdd = canAdd;
window.canEditWorkerRating = canEditWorkerRating;
window.canEditWorkerTime = canEditWorkerTime;
window.canEditNote = canEditNote;
