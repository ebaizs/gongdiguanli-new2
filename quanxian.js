// 声明依赖 yun.js 中的函数（如果还没加载，稍后会有）
if (typeof window.ensureGitHubToken === 'undefined') {
    console.warn('ensureGitHubToken 函数未定义，yun.js 可能未加载');
    // 临时定义，实际会被 yun.js 中的覆盖
    window.ensureGitHubToken = async function() {
        alert('yun.js 未正确加载，请刷新页面');
        return null;
    };
}
// ==================== 管理员配置 ====================
// 管理员用户名列表（可以根据需要扩展）
if (typeof window.ADMIN_USERS === 'undefined') {
    window.ADMIN_USERS = ['admin', 'qiyu'];
}

// 本地内置管理员账户
const localAdminUser = {
    "username": "qiyu",
    "password": "8418", // 建议设置强密码
    "name": "系统管理员",
    "isLocal": true,
    "isAdmin": true
};
// ==================== 全局变量定义 ====================
// 确保这些变量只在全局声明一次
if (typeof window.builtInUsers === 'undefined') {
    window.builtInUsers = [];
}
if (typeof window.PERMISSION_CONFIG === 'undefined') {
    window.PERMISSION_CONFIG = {
        userPermissions: {},
        availableTabs: []
    };
}
if (typeof window.currentUser === 'undefined') {
    window.currentUser = null;
}


// ==================== 内置测试账户 ====================
const localBuiltInUsers = [
    {
        "username": "1",
        "password": "1234",
        "name": "测试",
        "isLocal": true,
        "isAdmin": false
    },
    localAdminUser  // 添加本地管理员
];
// 云端管理员账户（会在加载云端时自动添加）
window.adminUser = null;

// 初始化内置用户列表
window.builtInUsers = [...localBuiltInUsers];

// 初始化权限配置
    
window.PERMISSION_CONFIG.userPermissions['1'] = {
    name: '测试',
    description: '默认权限',
    permissions: {
        refreshCloudUsers: false,
        showPermissionManager: false,
        showChangeLog: false,  
        viewAllSites: false,
        addSite: false,
        deleteSite: false,
        editAll: true,
        exportData: false,
        importData: false,
        viewLogs: false,
        cloudSync: true,
        editQuote: true,
        deleteItems: false,
        viewAllTabs: true,
        addItems: true,
        allowedSites: ['site001'],
        allowedTabs: []
    }
};

window.PERMISSION_CONFIG.availableTabs = [
    { id: "progressTab", name: "进度" },
    { id: "todoTab", name: "待办" },
    { id: "expenseTab", name: "支出" },
    { id: "requirementTab", name: "客户要求" },
    { id: "repairTab", name: "待维修" },
    { id: "workerTab", name: "工人" },
    { id: "quoteTab", name: "报价" },
    { id: "addRemoveTab", name: "增减项" },
    { id: "drawingTab", name: "图纸" },
    { id: "experienceTab", name: "经验总结" }
];

// 添加简单的提示函数
if (typeof showSimpleToast === 'undefined') {
    window.showSimpleToast = function(message, type = 'info') {
        console.log(`${type}: ${message}`);
        alert(message);
    };
}


// ==================== 云端用户数据加载(用户账号及密码登录信息，指定至-/raw/yonghu.js) ====================
async function loadCloudUserData() {
    try {
        const url = 'https://gist.githubusercontent.com/ebaizs/097f8adbb3790f3a95ba586a0867699b/raw/yonghu.js';
        
        console.log('正在从云端加载用户数据:', url);
        
        const response = await fetch(url, { 
            cache: 'no-cache',
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const content = await response.text();
        console.log('云端数据加载成功，大小:', content.length);
        
        // 方法1: 使用Function构造函数创建独立作用域
        try {
            const parseCloudData = new Function(content + '\nreturn { builtInUsers, PERMISSION_CONFIG };');
            const cloudData = parseCloudData();
            
            console.log('成功解析云端数据:', {
                userCount: cloudData.builtInUsers ? cloudData.builtInUsers.length : 0,
                permissionCount: cloudData.PERMISSION_CONFIG ? Object.keys(cloudData.PERMISSION_CONFIG.userPermissions || {}).length : 0
            });
           // 合并用户数据
if (cloudData.builtInUsers && Array.isArray(cloudData.builtInUsers)) {
    const existingUsernames = new Set(window.builtInUsers.map(u => u.username));
    const newUsers = cloudData.builtInUsers.filter(user => 
        user && user.username && !existingUsernames.has(user.username)
    );
    
    window.builtInUsers.push(...newUsers);
    console.log('添加了', newUsers.length, '个新用户:', newUsers.map(u => u.username));
    
    
   // 保存云端管理员引用
const adminUser = newUsers.find(u => 
    u.isAdmin === true || window.ADMIN_USERS.includes(u.username)
);
if (adminUser) {
    window.adminUser = adminUser;
    // 确保管理员标志
    if (!adminUser.isAdmin) adminUser.isAdmin = true;
}
}
            
            // 合并权限配置
            if (cloudData.PERMISSION_CONFIG && cloudData.PERMISSION_CONFIG.userPermissions) {
                for (const [username, config] of Object.entries(cloudData.PERMISSION_CONFIG.userPermissions)) {
                    if (!window.PERMISSION_CONFIG.userPermissions[username]) {
                        window.PERMISSION_CONFIG.userPermissions[username] = config;
                    }
                }
                console.log('合并了权限配置，现有权限用户:', Object.keys(window.PERMISSION_CONFIG.userPermissions));
            }
            
            return true;
            
        } catch (parseError) {
            console.warn('方法1解析失败:', parseError);
            return false;
        }
        
    } catch (error) {
        console.warn('加载云端用户数据失败:', error);
        throw error;
    }
}

// ==================== 权限系统初始化 ====================
function initPermissionSystem() {
    // 先加载本地权限配置
    loadPermissionConfig();
    
    // 尝试从本地存储加载缓存的云端数据
try {
    const cachedData = localStorage.getItem('cloudUserData');
    if (cachedData) {
        const data = JSON.parse(cachedData);
        const cacheTime = new Date(data.timestamp);
        const now = new Date();
        const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
        
        // 如果缓存是12小时内的，使用缓存
        if (hoursDiff < 12) {
            console.log('使用缓存的云端用户数据（12小时内）');
            
            // 只接受完整的yonghu.js格式数据
            if (data.builtInUsers && data.PERMISSION_CONFIG) {
                const cloudUsers = data.builtInUsers;
                const localUsers = window.builtInUsers.filter(u => u.isLocal);
                window.builtInUsers = [...localUsers, ...cloudUsers];
                
                window.PERMISSION_CONFIG = {
                    ...data.PERMISSION_CONFIG,
                    userPermissions: {
                        ...data.PERMISSION_CONFIG.userPermissions
                    }
                };
            }
        } else {
            console.log('缓存过期，需要重新加载云端数据');
            localStorage.removeItem('cloudUserData');
        }
    }
} catch (e) {
    console.warn('加载缓存用户数据失败:', e);
    localStorage.removeItem('cloudUserData');
}
    
 

//////////////////////以下可能可删除///////////////////////////////////////////

// 异步尝试从云端加载最新数据
    setTimeout(async () => {
        try {
            console.log('开始异步加载云端用户数据...');
            const loaded = await loadCloudUserData();
            
            if (loaded) {
                console.log('云端账户数据已加载，可用账户:', window.builtInUsers.map(u => u.name));
                
                // 保存到本地存储
                const cloudUsers = window.builtInUsers.filter(u => !u.isLocal);
                localStorage.setItem('cloudUserData', JSON.stringify({
                    builtInUsers: cloudUsers,
                    PERMISSION_CONFIG: window.PERMISSION_CONFIG,
                    timestamp: new Date().toISOString()
                }));
                
                // 如果当前是测试用户登录，提示刷新
                if (window.currentUser && window.currentUser.username === '1') {
                    setTimeout(() => {
                        if (confirm('云端账户数据已加载成功！\n\n是否刷新页面使用云端账户登录？')) {
                            location.reload();
                        }
                    }, 2000);
                }
            } else {
                console.log('云端数据加载失败，继续使用本地账户');
            }
        } catch (e) {
            console.warn('异步加载云端数据失败:', e);
        }
    }, 3000);
}
//////////////////////以上可能可删除//////////////////////////////////////////////
// 确保管理员有所有权限
function ensureAdminPermissions() {
    // 从 ADMIN_USERS 获取管理员列表
    adminUsernames.forEach(username => {
        if (PERMISSION_CONFIG.userPermissions[username]) {
            const perms = PERMISSION_CONFIG.userPermissions[username].permissions;
            // 确保管理员有所有权限
            perms.refreshCloudUsers = true;
            perms.showPermissionManager = true;
            perms.viewLogs = true;
            perms.showChangeLog = true;
            perms.saveToJsFile = true;
            perms.downloadJsonData = true;
            perms.loadFromJsFile = true;
            perms.loadImagesZipOnly = true;
            perms.viewAllSites = true;
            perms.deleteSite = true;
            perms.addSite = true;
            perms.addItems = true;
            perms.deleteItems = true;
            perms.editAll = true;
            perms.editQuote = true;
            perms.editTime = true;
            perms.editStatus = true;
            perms.exportData = true;
            perms.importData = true;
            perms.cloudSync = true;
            // 添加管理员标志
            perms.isAdmin = true;
        }
    });
    // 另外检查所有 isAdmin 属性为 true 的用户
    Object.keys(PERMISSION_CONFIG.userPermissions).forEach(username => {
        const userPerms = PERMISSION_CONFIG.userPermissions[username];
        if (userPerms && userPerms.permissions && userPerms.permissions.isAdmin === true) {
            // 确保这些用户也有所有权限
            const perms = userPerms.permissions;
            perms.refreshCloudUsers = true;
            perms.showPermissionManager = true;
            // ... 设置所有权限为 true ...
        }
    });
}
// 修改 hasPermission 函数，确保它能在所有地方正确工作
function hasPermission(permissionName) {
    if (!currentUser) {
        console.log('hasPermission: 没有当前用户');
        return false;
    }
    
    // 确保 currentUser 对象存在
    if (!currentUser.username) {
        console.log('hasPermission: 当前用户没有用户名');
        return false;
    }
    
    // 使用新的 isAdmin 函数检查是否为管理员
    if (isAdmin()) {
        console.log(`hasPermission: ${currentUser.username} 是管理员，直接返回true`);
        return true;
    }
    
    // 获取用户权限
    const userPerms = PERMISSION_CONFIG.userPermissions[currentUser.username];
    if (!userPerms) {
        console.warn(`用户 ${currentUser.username} 没有权限配置`);
        return false;
    }
    
    const result = userPerms.permissions[permissionName] || false;
    console.log(`hasPermission: ${currentUser.username} 的 ${permissionName} 权限: ${result}`);
    return result;
}

// 确保 canShowPermissionManager 函数正确
function canShowPermissionManager() {
    const result = hasPermission('showPermissionManager');
    console.log(`canShowPermissionManager: ${result} (用户: ${currentUser ? currentUser.username : '无'})`);
    return result;
}
// 在DOMContentLoaded事件中调用
document.addEventListener('DOMContentLoaded', function() {
    // 等待主应用初始化完成后再初始化权限系统
    setTimeout(function() {
        if (typeof initPermissionSystem === 'function') {
            initPermissionSystem();
            // 确保管理员权限
            setTimeout(ensureAdminPermissions, 1000);
        }
    }, 300);
});
// 添加 isAdmin 函数到全局
function isAdmin() {
    if (!currentUser) return false;
    
    // 方法1：检查用户对象的 isAdmin 属性
    if (currentUser.isAdmin === true) {
        return true;
    }
    
    // 方法2：检查用户名是否在管理员列表中（向后兼容）
    if (window.ADMIN_USERS && window.ADMIN_USERS.includes(currentUser.username)) {
        return true;
    }
    
    // 方法3：检查权限配置中的管理员标志
    const userPerms = PERMISSION_CONFIG.userPermissions[currentUser.username];
    if (userPerms && userPerms.permissions && userPerms.permissions.isAdmin === true) {
        return true;
    }
    
    return false;
}
// ==================== 新增权限检查函数 ====================
function canRefreshCloudUsers() {
    return hasPermission('refreshCloudUsers');
}



function canSaveToJsFile() {
    return hasPermission('saveToJsFile');
}

function canDownloadJsonData() {
    return hasPermission('downloadJsonData');
}

function canLoadFromJsFile() {
    return hasPermission('loadFromJsFile');
}

function canLoadImagesZipOnly() {
    return hasPermission('loadImagesZipOnly');
}

// 暴露到全局
window.canRefreshCloudUsers = canRefreshCloudUsers;
window.canShowPermissionManager = canShowPermissionManager;
window.canSaveToJsFile = canSaveToJsFile;
window.canDownloadJsonData = canDownloadJsonData;
window.canLoadFromJsFile = canLoadFromJsFile;
window.canLoadImagesZipOnly = canLoadImagesZipOnly;

// 检查工地访问权限
function canViewSite(siteId) {
    if (!currentUser) return false;
    
    if (hasPermission('viewAllSites')) {
        return true;
    }
    
    const userPerms = PERMISSION_CONFIG.userPermissions[currentUser.username];
    if (!userPerms) return false;
    
    return userPerms.permissions.allowedSites?.includes(siteId) || false;
}

// 检查标签页访问权限
function canViewTab(tabId) {
    if (!currentUser) return false;
    
    if (hasPermission('viewAllTabs')) {
        return true;
    }
    
    const userPerms = PERMISSION_CONFIG.userPermissions[currentUser.username];
    if (!userPerms) return false;
    
    return userPerms.permissions.allowedTabs?.includes(tabId) || false;
}

// 获取用户可访问的标签页
function getAllowedTabs() {
    if (!currentUser) return [];
    
    if (hasPermission('viewAllTabs')) {
        return PERMISSION_CONFIG.availableTabs;
    }
    
    const userPerms = PERMISSION_CONFIG.userPermissions[currentUser.username];
    if (!userPerms || !userPerms.permissions.allowedTabs) {
        return [];
    }
    
    return PERMISSION_CONFIG.availableTabs.filter(tab => 
        userPerms.permissions.allowedTabs.includes(tab.id)
    );
}

// ==================== 权限配置管理 ====================
function loadPermissionConfig() {
    try {
        const savedConfig = localStorage.getItem('permission_config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            PERMISSION_CONFIG.userPermissions = config.userPermissions || {};
            console.log('权限配置已加载');
        }
    } catch (e) {
        console.warn('加载权限配置失败:', e);
    }
}

function savePermissionConfig() {
    try {
        localStorage.setItem('permission_config', JSON.stringify({
            userPermissions: PERMISSION_CONFIG.userPermissions,
            lastModified: new Date().toISOString()
        }));
    } catch (e) {
        console.error('保存权限配置失败:', e);
    }
}
// ==================== 权限模板 ====================
function getTemplateByType(templateType, username) {
    const templates = {
        // 超级管理员：全部权限
        'admin': {
            name: '超级管理员',
            description: '所有权限',
            permissions: {
                // 1. 刷新云端账户，权限管理，更改日志
                isAdmin: true,  // 添加这一行
                refreshCloudUsers: true,
                showPermissionManager: true,
                showChangeLog: true,
                
                // 2. 备份完整数据，下载json数据
                saveToJsFile: true,
                downloadJsonData: true,
                
                // 3. 从文件加载，加载图片包
                loadFromJsFile: true,
                loadImagesZipOnly: true,
                
                // 4. 所有工地删除
                deleteSite: true,
                deleteItems: true,
                
                // 5. 所有工地增加
                addSite: true,
                
                // 6. 所有项目的添加
                addItems: true,
                
                // 7. 所有项目的删除和状态变更
                deleteItems: true,
                editAll: true,
                
                // 8. 指定页面的打开权限 (通过allowedTabs控制)
                viewAllSites: true,
                viewAllTabs: true,
                
                // 10. 导入数据
                importData: true,
                
                // 11. 导出数据
                exportData: true,
                
                // 12. 云端同步
                cloudSync: true,
                
                allowedSites: [],
                allowedTabs: ['progressTab', 'todoTab', 'expenseTab', 'requirementTab', 'repairTab', 
                             'workerTab', 'quoteTab', 'addRemoveTab', 'drawingTab', 'experienceTab']
            }
        },
        
        // 项目经理/监理
        'manager': {
            name: '项目经理',
            description: '项目管理权限',
            permissions: {
                // 1. 刷新云端账户，权限管理，更改日志
                refreshCloudUsers: false,
                showPermissionManager: false,
                showChangeLog: false,
                
                // 2. 备份完整数据，下载json数据
                saveToJsFile: false,
                downloadJsonData: false,
                
                // 3. 从文件加载，加载图片包
                loadFromJsFile: true,
                loadImagesZipOnly: true,
                
                // 4. 所有工地删除
                deleteSite: false,
                deleteItems: false,
                
                // 5. 所有工地增加
                addSite: true,
                
                // 6. 所有项目的添加
                addItems: true,
                
                // 7. 所有项目的删除和状态变更
                deleteItems: false,
                editAll: false,
                
                // 8. 指定页面的打开权限
                viewAllSites: false,
                viewAllTabs: false,
                allowedSites: [],
                allowedTabs: ['progressTab', 'todoTab', 'expenseTab', 'requirementTab', 'repairTab', 
                             'workerTab', 'addRemoveTab', 'drawingTab', 'experienceTab'],
                
                // 10. 导入数据
                importData: true,
                
                // 11. 导出数据
                exportData: false,
                
                // 12. 云端同步
                cloudSync: true
            }
        },
        
        // 财务
        'accountant': {
            name: '财务',
            description: '财务权限',
            permissions: {
                // 1. 刷新云端账户，权限管理，更改日志
                refreshCloudUsers: false,
                showPermissionManager: false,
                showChangeLog: false,
                
                // 2. 备份完整数据，下载json数据
                saveToJsFile: false,
                downloadJsonData: false,
                
                // 3. 从文件加载，加载图片包
                loadFromJsFile: true,
                loadImagesZipOnly: true,
                
                // 4. 所有工地删除
                deleteSite: false,
                deleteItems: false,
                
                // 5. 所有工地增加
                addSite: false,
                
                // 6. 所有项目的添加
                addItems: true,
                
                // 7. 所有项目的删除和状态变更
                deleteItems: false,
                editAll: false,
                
                // 8. 指定页面的打开权限
                viewAllSites: false,
                viewAllTabs: false,
                allowedSites: [],
                allowedTabs: ['progressTab', 'expenseTab', 'workerTab', 'quoteTab', 'addRemoveTab', 'drawingTab'],
                
                // 10. 导入数据
                importData: true,
                
                // 11. 导出数据
                exportData: false,
                
                // 12. 云端同步
                cloudSync: true
            }
        },
        
        // 工人代表
        'worker': {
            name: '工人',
            description: '工人权限',
            permissions: {
                // 1. 刷新云端账户，权限管理，更改日志
                refreshCloudUsers: false,
                showPermissionManager: false,
                showChangeLog: false,
                
                // 2. 备份完整数据，下载json数据
                saveToJsFile: false,
                downloadJsonData: false,
                
                // 3. 从文件加载，加载图片包
                loadFromJsFile: true,
                loadImagesZipOnly: true,
                
                // 4. 所有工地删除
                deleteSite: false,
                deleteItems: false,
                
                // 5. 所有工地增加
                addSite: false,
                
                // 6. 所有项目的添加
                addItems: false,
                
                // 7. 所有项目的删除和状态变更
                deleteItems: false,
                editAll: false,
                
                // 8. 指定页面的打开权限
                viewAllSites: false,
                viewAllTabs: false,
                allowedSites: [],
                allowedTabs: ['progressTab', 'requirementTab', 'workerTab'],
                
                // 10. 导入数据
                importData: true,
                
                // 11. 导出数据
                exportData: false,
                
                // 12. 云端同步
                cloudSync: true
            }
        },
        
        // 客户
        'kehu': {
            name: '客户',
            description: '客户查看权限',
            permissions: {
                // 1. 刷新云端账户，权限管理，更改日志
                refreshCloudUsers: false,
                showPermissionManager: false,
                showChangeLog: false,
                
                // 2. 备份完整数据，下载json数据
                saveToJsFile: false,
                downloadJsonData: false,
                
                // 3. 从文件加载，加载图片包
                loadFromJsFile: true,
                loadImagesZipOnly: true,
                
                // 4. 所有工地删除
                deleteSite: false,
                deleteItems: false,
                
                // 5. 所有工地增加
                addSite: false,
                
                // 6. 所有项目的添加
                addItems: true,
                
                // 7. 所有项目的删除和状态变更
                deleteItems: false,
                editAll: false,
                
                // 8. 指定页面的打开权限
                viewAllSites: false,
                viewAllTabs: false,
                allowedSites: [],
                allowedTabs: ['progressTab','todoTab', 'requirementTab','repairTab', 'drawingTab'],
                
                // 10. 导入数据
                importData: true,
                
                // 11. 导出数据
                exportData: false,
                
                // 12. 云端同步
                cloudSync: true
            }
        },
        
        // 测试用户/默认用户
        'test': {
            name: '测试用户',
            description: '测试权限',
            permissions: {
                // 1. 刷新云端账户，权限管理，更改日志
                refreshCloudUsers: false,
                showPermissionManager: false,
                showChangeLog: false,
                
                // 2. 备份完整数据，下载json数据
                saveToJsFile: false,
                downloadJsonData: false,
                
                // 3. 从文件加载，加载图片包
                loadFromJsFile: true,
                loadImagesZipOnly: true,
                
                // 4. 所有工地删除
                deleteSite: false,
                deleteItems: false,
                
                // 5. 所有工地增加
                addSite: false,
                
                // 6. 所有项目的添加
                addItems: true,
                
                // 7. 所有项目的删除和状态变更
                deleteItems: false,
                editAll: false,
                
                // 8. 指定页面的打开权限（只能访问site001）
                viewAllSites: false,
                viewAllTabs: false,
                allowedSites: ['site001'],
                allowedTabs: ['progressTab', 'todoTab', 'expenseTab', 'requirementTab', 'repairTab', 
                             'workerTab', 'quoteTab', 'addRemoveTab', 'drawingTab', 'experienceTab'],
                
                // 10. 导入数据
                importData: true,
                
                // 11. 导出数据
                exportData: false,
                
                // 12. 云端同步
                cloudSync: false
            }
        }
    };
    
    return templates[templateType] || templates['test']; // 默认使用测试用户权限
}
// ==================== 权限管理界面 ====================
function showPermissionManager() {
    if (!isAdmin()) {
        alert('只有管理员可以管理权限！');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        z-index: 2000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        justify-content: center;
        align-items: center;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="width: 900px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3>用户权限管理</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4>权限配置操作</h4>
                    <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                        <button class="btn btn-primary" id="exportPermissionBtn">导出/上传权限配置</button>
                        <button class="btn btn-success" id="addUserBtn">添加用户</button>
                        <button class="btn btn-info" onclick="refreshCloudUsers()">刷新云端账户</button>
                    </div>
                    <p style="color: #666; font-size: 14px; margin-top: 10px;">
                        <strong>导出/上传权限配置：</strong>
                        - 可选择上传到云端直接替换 yonghu.js<br>
                        - 或下载到本地备份<br>
                        - 文件包含所有用户和权限配置
                    </p>
                </div>
                
                <div id="permissionUserList" style="margin-bottom: 20px;">
                    <!-- 用户列表会动态生成 -->
                </div>
                
                <div style="text-align: right;">
                    <button class="btn btn-secondary" id="closePermissionManager">关闭</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    renderPermissionUserList();
    
    // 绑定按钮事件
    document.getElementById('exportPermissionBtn').addEventListener('click', exportPermissionConfig);
    document.getElementById('addUserBtn').addEventListener('click', showAddUserModal);
    document.getElementById('closePermissionManager').addEventListener('click', () => {
        modal.remove();
    });
}

function renderPermissionUserList() {
    const container = document.getElementById('permissionUserList');
    if (!container) return;
    
    let html = '<h4>用户权限配置</h4>';
    html += '<div style="overflow-x: auto;">';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">用户名</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">姓名</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">权限模板</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">可访问工地</th>';
    html += '<th style="padding: 10px; border: 1px solid #ddd;">操作</th>';
    html += '</tr></thead><tbody>';
    
    window.builtInUsers.forEach(user => {
        const userPerms = window.PERMISSION_CONFIG.userPermissions[user.username] || getDefaultTemplate(user.username);
        
        html += `<tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${user.username}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${user.name}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${userPerms.name || '自定义'}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">
                ${userPerms.permissions.allowedSites ? userPerms.permissions.allowedSites.length + '个限制工地' : '所有工地'}
            </td>
            <td style="padding: 10px; border: 1px solid #ddd;">
                <button class="btn btn-sm btn-primary" onclick="editUserPermissions('${user.username}')" style="margin-left: 0px;margin-left: 1px;">编辑</button>
                ${user.username !== 'qiyu' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${user.username}')" style="margin-left: 1px;">删除</button>` : ''}
            </td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function showAddUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        z-index: 2002;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        justify-content: center;
        align-items: center;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="width: 500px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3>添加新用户</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div style="padding: 20px;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">用户名：</label>
                    <input type="text" id="newUsername" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" 
                           placeholder="只能使用字母、数字和下划线">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">姓名：</label>
                    <input type="text" id="newName" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" 
                           placeholder="显示姓名">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">密码：</label>
                    <input type="password" id="newPassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" 
                           placeholder="最少4位">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">确认密码：</label>
                    <input type="password" id="confirmPassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">权限模板：</label>
                    <select id="userTemplate" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="manager">项目经理</option>
                        <option value="supervisor">监理</option>
                        <option value="designer">设计师</option>
                        <option value="accountant">财务</option>
                        <option value="worker">工人</option>
                        <option value="kehu">客户</option>
                        <option value="custom">自定义</option>
                    </select>
                </div>
                
                <div id="customPermissions" style="display: none; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <h5 style="margin-bottom: 10px;">自定义权限</h5>
                    <div style="margin-bottom: 10px;">
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_viewAllSites">
                            查看所有工地
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_addSite">
                            添加工地
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_deleteSite">
                            删除工地
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_editAll">
                            编辑所有内容
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_exportData">
                            导出数据
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_importData">
                            导入数据
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_viewLogs">
                            查看日志
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_cloudSync">
                            云端同步
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_editQuote">
                            编辑报价
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_deleteItems">
                            删除分页项目
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_viewAllTabs">
                            查看所有标签页
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            <input type="checkbox" id="perm_addItems">
                            添加分页项目
                        </label>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: right;">
                    <button class="btn btn-primary" onclick="saveNewUser()">保存用户</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                </div>
                
                <div id="addUserError" style="color: #dc3545; margin-top: 10px; display: none;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('userTemplate').addEventListener('change', function() {
        const customDiv = document.getElementById('customPermissions');
        if (this.value === 'custom') {
            customDiv.style.display = 'block';
        } else {
            customDiv.style.display = 'none';
        }
    });
}

function saveNewUser() {
    const username = document.getElementById('newUsername').value.trim();
    const name = document.getElementById('newName').value.trim();
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const template = document.getElementById('userTemplate').value;
    const errorDiv = document.getElementById('addUserError');
    
    // 验证输入
    if (!username || !name || !password) {
        errorDiv.textContent = '请填写所有必填项！';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errorDiv.textContent = '用户名只能包含字母、数字和下划线！';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (builtInUsers.find(u => u.username === username)) {
        errorDiv.textContent = '用户名已存在！';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 4) {
        errorDiv.textContent = '密码最少需要4位！';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password !== confirmPassword) {
        errorDiv.textContent = '两次输入的密码不一致！';
        errorDiv.style.display = 'block';
        return;
    }
    
    // 添加用户到 builtInUsers
    builtInUsers.push({
        username: username,
        password: password,
        name: name
    });
    
    // 设置权限配置
    if (template === 'custom') {
        // 自定义权限...
    } else {
        const templatePermissions = getTemplateByType(template, username);
        PERMISSION_CONFIG.userPermissions[username] = {
            name: name,
            description: templatePermissions.description,
            permissions: { ...templatePermissions.permissions }
        };
    }
    
    savePermissionConfig();
    document.querySelector('.modal').remove();
    
    const userListModal = document.querySelector('.modal');
    if (userListModal) {
        renderPermissionUserList();
    }
    
    showSimpleToast('用户添加成功！');
}

function deleteUser(username) {
    if (!isAdmin()) {
        alert('只有管理员可以删除用户！');
        return;
    }
    
    if (username === 'qiyu') {
        alert('不能删除管理员账户！');
        return;
    }
    
    const user = builtInUsers.find(u => u.username === username);
    if (!user) return;
    
    if (!confirm(`确定要删除用户 "${user.name} (${username})" 吗？此操作不可恢复！`)) {
        return;
    }
    
    // 从 builtInUsers 中删除
    const userIndex = builtInUsers.findIndex(u => u.username === username);
    if (userIndex > -1) {
        builtInUsers.splice(userIndex, 1);
    }
    
    // 从权限配置中删除
    if (PERMISSION_CONFIG.userPermissions[username]) {
        delete PERMISSION_CONFIG.userPermissions[username];
    }
    
    // 如果当前用户被删除，强制登出
    if (currentUser && currentUser.username === username) {
        logout();
    }
    
    savePermissionConfig();
    
    const modal = document.querySelector('.modal');
    if (modal) {
        renderPermissionUserList();
    }
    
    showSimpleToast('用户删除成功！');
}
// ==================== 权限管理界面 ====================
function editUserPermissions(username) {
    const user = builtInUsers.find(u => u.username === username);
    if (!user) return;
    
    const userPerms = PERMISSION_CONFIG.userPermissions[username] || getDefaultTemplate(username);
    
    // 删除或注释掉这行代码
    // loadSitesFromStorage(); // 这行有问题，直接删除或注释掉
    
    // 直接使用已有的工地数据逻辑
    // 尝试从多个来源获取工地数据
    let siteList = [];
    
    // 来源1：全局变量 window.sites
    if (window.sites && Array.isArray(window.sites)) {
        siteList = window.sites;
    } 
    // 来源2：从 localStorage 加载
    else {
        try {
            const savedSites = localStorage.getItem('constructionSites');
            if (savedSites) {
                siteList = JSON.parse(savedSites);
            }
        } catch (e) {
            console.warn('从localStorage加载工地数据失败:', e);
        }
    }
    
    // 如果有工地数据，继续显示模态框
    const modal = document.createElement('div');
    
    modal.className = 'modal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        z-index: 2001;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        justify-content: center;
        align-items: center;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="width: 800px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3>编辑权限 - ${user.name} (${username})</h3>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4>用户权限配置</h4>
                    <p style="color: #666; font-size: 14px; margin-top: 5px;">
                        当前用户：${user.name} (${username})<br>
                        每个用户都有独立的权限配置
                    </p>
                </div>
                
                <div id="permissionControls" style="margin-bottom: 20px;"></div>
                
                <div id="siteSelection" style="margin-bottom: 20px; display: ${userPerms.permissions.viewAllSites ? 'none' : 'block'}">
                    <h4>选择可访问工地</h4>
                    <p style="color: #666; font-size: 12px; margin-bottom: 10px;">
                        选择该用户可以访问的工地。如果未选中任何工地，则无法查看任何工地。
                    </p>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: #f9f9f9;">
                        <div id="siteCheckboxes"></div>
                    </div>
                </div>
                
                <div id="tabSelection" style="margin-bottom: 20px; display: ${userPerms.permissions.viewAllTabs ? 'none' : 'block'}">
                    <h4>选择可访问标签页</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                        ${PERMISSION_CONFIG.availableTabs.map(tab => `
                            <label style="display: flex; align-items: center; gap: 5px; padding: 5px 10px; background: #f5f5f5; border-radius: 4px;">
                                <input type="checkbox" name="allowedTabs" value="${tab.id}" 
                                    ${userPerms.permissions.allowedTabs?.includes(tab.id) ? 'checked' : ''}>
                                ${tab.name}
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div style="text-align: right; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="saveUserPermissions('${username}')">保存</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 等待DOM渲染完成后渲染控件
    setTimeout(() => {
        renderPermissionControls(username, userPerms);
        renderSiteCheckboxes(username, userPerms);
    }, 50);
}

function renderPermissionControls(username, permissions) {
    const container = document.getElementById('permissionControls');
    if (!container) return;
    
    const controls = [
        { id: 'viewAllSites', label: '查看所有工地' },
        { id: 'addSite', label: '添加工地' },
        { id: 'deleteSite', label: '删除工地' },
        { id: 'editAll', label: '编辑所有内容' },
        { id: 'exportData', label: '导出数据' },
        { id: 'importData', label: '导入数据' },
        { id: 'viewLogs', label: '查看日志' },
        { id: 'cloudSync', label: '云端同步' },
        { id: 'editQuote', label: '编辑报价' },
        { id: 'deleteItems', label: '删除项目' },
        { id: 'viewAllTabs', label: '查看所有标签页' },
        { id: 'addItems', label: '添加项目' }
    ];
    
   let html = '<h4>详细权限设置</h4>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">';
     // 添加管理员选项
    html += `
        <label style="display: flex; align-items: center; gap: 5px; padding: 5px; background: #f5f5f5; border-radius: 4px; color: #d32f2f; font-weight: bold;">
            <input type="checkbox" name="isAdmin" 
                ${permissions.permissions.isAdmin ? 'checked' : ''}
                onchange="updatePermissionValue('${username}', 'isAdmin', this.checked)">
            设为系统管理员
        </label>
    `;
    controls.forEach(control => {
        html += `
            <label style="display: flex; align-items: center; gap: 5px; padding: 5px; background: #f5f5f5; border-radius: 4px;">
                <input type="checkbox" name="${control.id}" 
                    ${permissions.permissions[control.id] ? 'checked' : ''}
                    onchange="updatePermissionValue('${username}', '${control.id}', this.checked)">
                ${control.label}
            </label>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function updatePermissionValue(username, permission, value) {
    if (!PERMISSION_CONFIG.userPermissions[username]) {
        PERMISSION_CONFIG.userPermissions[username] = JSON.parse(JSON.stringify(getDefaultTemplate(username)));
    }
    
    PERMISSION_CONFIG.userPermissions[username].permissions[permission] = value;
    
    const siteSelection = document.getElementById('siteSelection');
    const tabSelection = document.getElementById('tabSelection');
    
    if (permission === 'viewAllSites' && siteSelection) {
        siteSelection.style.display = value ? 'none' : 'block';
    }
    
    if (permission === 'viewAllTabs' && tabSelection) {
        tabSelection.style.display = value ? 'none' : 'block';
    }
}
function renderSiteCheckboxes(username, permissions) {
    const container = document.getElementById('siteCheckboxes');
    if (!container) return;
    
    // 尝试从多个来源获取工地数据
    let siteList = [];
    
    // 来源1：全局变量 window.sites
    if (window.sites && Array.isArray(window.sites)) {
        siteList = window.sites;
    } 
    // 来源2：从 localStorage 加载
    else {
        try {
            const savedSites = localStorage.getItem('constructionSites');
            if (savedSites) {
                siteList = JSON.parse(savedSites);
            }
        } catch (e) {
            console.warn('从localStorage加载工地数据失败:', e);
        }
    }
    
    // 如果还是没有数据，显示提示
    if (siteList.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <div style="margin-bottom: 10px;">暂无工地数据</div>
                <small style="font-size: 12px;">
                    请先添加工地，或刷新页面后重试
                </small>
            </div>
        `;
        return;
    }
    
    // 渲染工地复选框
    let html = '<div style="display: flex; flex-direction: column; gap: 5px;">';
    
    siteList.forEach(site => {
        const isChecked = permissions.permissions.allowedSites?.includes(site.id) || false;
        const siteName = site.name || `未命名工地 (${site.id})`;
        
        html += `
            <label style="display: flex; align-items: center; gap: 8px; padding: 5px 10px; border: 1px solid #eee; border-radius: 4px; cursor: pointer;">
                <input type="checkbox" name="allowedSites" value="${site.id}" 
                    ${isChecked ? 'checked' : ''}
                    style="margin: 0;">
                <span style="flex: 1; font-size: 14px;">${siteName}</span>
                <span style="font-size: 12px; color: #666;">${site.id}</span>
            </label>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function saveUserPermissions(username) {
    if (!PERMISSION_CONFIG.userPermissions[username]) {
        PERMISSION_CONFIG.userPermissions[username] = {
            name: builtInUsers.find(u => u.username === username)?.name || username,
            description: '独立权限配置',
            permissions: {
                viewAllSites: false,
                addSite: false,
                deleteSite: false,
                editAll: false,
                exportData: false,
                importData: false,
                viewLogs: false,
                cloudSync: false,
                editQuote: false,
                deleteItems: false,
                viewAllTabs: false,
                addItems: false,
                allowedSites: [],
                allowedTabs: []
            }
        };
    }
    
    const siteCheckboxes = document.querySelectorAll('input[name="allowedSites"]:checked');
    PERMISSION_CONFIG.userPermissions[username].permissions.allowedSites = Array.from(siteCheckboxes).map(cb => cb.value);
    
    const tabCheckboxes = document.querySelectorAll('input[name="allowedTabs"]:checked');
    PERMISSION_CONFIG.userPermissions[username].permissions.allowedTabs = Array.from(tabCheckboxes).map(cb => cb.value);
    
    savePermissionConfig();
    document.querySelector('.modal').remove();
    
    setTimeout(() => {
        const userListModal = document.querySelector('.modal');
        if (userListModal) {
            renderPermissionUserList();
        }
    }, 100);
    
    showSimpleToast('权限已保存');
}

// ==================== 权限导出 ====================
function exportPermissionConfig() {
    if (!isAdmin()) {
        alert('只有管理员可以导出权限配置！');
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
// 修改 quanxian.js 中的 uploadToCloudDirectly 函数
async function uploadToCloudDirectly(content) {
    try {
        // 使用统一的 Token 管理函数
        const token = await ensureGitHubToken({
            checkDataSize: false,  // 权限配置不需要检查数据大小
            purpose: 'permission',
            showWarning: true
        });
        
        if (!token) {
            alert('上传权限配置需要 GitHub Token，请先配置！');
            return;
        }
        
        // 获取 GIST_ID（从 localStorage 或内置配置）
        let gistId = BUILT_IN_CONFIG.GIST_ID;
        const savedConfig = localStorage.getItem('github_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                if (config.GIST_ID) {
                    gistId = config.GIST_ID;
                }
            } catch (e) {
                console.warn('解析配置失败，使用内置 GIST_ID:', e);
            }
        }
        
        const uploadingDiv = document.createElement('div');
        uploadingDiv.innerHTML = '正在上传权限配置到云端...';
        uploadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            z-index: 9999;
            text-align: center;
            min-width: 200px;
        `;
        document.body.appendChild(uploadingDiv);
        
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                description: `权限配置文件更新 - ${new Date().toLocaleString()}`,
                files: {
                    'yonghu.js': {
                        content: content
                    }
                }
            })
        });
        
        if (uploadingDiv.parentNode) {
            uploadingDiv.remove();
        }
        
        if (response.ok) {
            alert('✅ 权限配置已成功上传到云端！');
        } else {
            const error = await response.text();
            console.error('上传失败:', error);
            
            if (response.status === 401) {
                alert('GitHub Token 已过期或无效！\n\n请重新配置 GitHub Token。');
                localStorage.removeItem('github_config');
                GIST_CONFIG.GITHUB_TOKEN = '';
                GIST_CONFIG.configLoaded = false;
            } else {
                alert(`上传失败：${response.status} ${response.statusText}`);
            }
        }
        
    } catch (error) {
        console.error('上传异常:', error);
        let errorMsg = '上传失败：';
        if (error.message.includes('Failed to fetch')) {
            errorMsg = '网络连接失败，请检查网络连接。';
        } else if (error.message.includes('token')) {
            errorMsg = 'GitHub Token 无效，请重新配置。';
        } else {
            errorMsg += error.message;
        }
        alert(errorMsg);
    }
}

function downloadToLocal(content) {
    const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yonghu_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`权限配置文件已下载！\n\n文件名：${a.download}\n\n您可以将此文件上传到云端替换原来的 yonghu.js 文件。`);
    
    try {
        navigator.clipboard.writeText(content).then(() => {
            showSimpleToast('权限配置已复制到剪贴板');
        }).catch(e => {
            console.log('复制失败:', e);
        });
    } catch (e) {
        console.log('剪贴板API不可用');
    }
}

// ==================== 权限应用 ====================
function applyUserPermissions() {
    if (!currentUser) return;
    
    console.log('应用用户权限:', currentUser.username);
    
    updateTopButtonsByPermission();
    updateTabsByPermission();
    updateSiteListByPermission();
    updateAddButtonByPermission();
    updateDataManagementByPermission();
    updateModalPermissions();
    
    // 应用新的权限检查
    applyNewPermissions();
}

function applyNewPermissions() {
    // 应用数据管理按钮权限
    updateDataManagementButtons();
    
    // 应用顶部按钮权限
    updateTopButtonsVisibility();
}

function updateDataManagementButtons() {
    const dataManagement = document.querySelector('.import-export');
    if (!dataManagement) return;
    
    // 备份完整数据
    const saveToJsFileBtn = dataManagement.querySelector('[onclick*="saveToJsFile"]');
    if (saveToJsFileBtn) {
        saveToJsFileBtn.style.display = canSaveToJsFile() ? '' : 'none';
    }
    
    // 下载JSON数据
    const downloadJsonDataBtn = dataManagement.querySelector('[onclick*="downloadJsonData"]');
    if (downloadJsonDataBtn) {
        downloadJsonDataBtn.style.display = canDownloadJsonData() ? '' : 'none';
    }
    
    // 从文件加载
    const loadFromJsFileBtn = dataManagement.querySelector('[onclick*="loadFromJsFile"]');
    if (loadFromJsFileBtn) {
        loadFromJsFileBtn.style.display = canLoadFromJsFile() ? '' : 'none';
    }
    
    // 加载图片包
    const loadImagesBtn = dataManagement.querySelector('[onclick*="loadImagesZipOnly"]');
    if (loadImagesBtn) {
        loadImagesBtn.style.display = canLoadImagesZipOnly() ? '' : 'none';
    }
}

function updateTopButtonsVisibility() {
    // 权限管理按钮
    const permissionBtn = document.querySelector('.permission-manager-btn');
    if (permissionBtn) {
        permissionBtn.style.display = canShowPermissionManager() ? '' : 'none';
    }
    
    // 更改日志按钮
    const changeLogBtn = document.querySelector('.change-log-btn');
    if (changeLogBtn) {
        changeLogBtn.style.display = hasPermission('viewLogs') ? '' : 'none';
    }
}

function updateTabsByPermission() {
    const tabsContainer = document.getElementById('siteTabs');
    if (!tabsContainer) return;
    
    const allowedTabs = getAllowedTabs();
    const currentTabs = Array.from(tabsContainer.querySelectorAll('.tab'));
    
    currentTabs.forEach(tab => {
        const tabId = tab.getAttribute('data-tab');
        const isAllowed = allowedTabs.some(allowed => allowed.id === tabId);
        tab.style.display = isAllowed ? '' : 'none';
    });
    
    const activeTab = tabsContainer.querySelector('.tab.active');
    if (activeTab && activeTab.style.display === 'none') {
        const firstVisibleTab = tabsContainer.querySelector('.tab[style=""]');
        if (firstVisibleTab) {
            switchTab(firstVisibleTab.getAttribute('data-tab'));
        }
    }
}

function updateSiteListByPermission() {
    if (!hasPermission('viewAllSites')) {
        const userPerms = PERMISSION_CONFIG.userPermissions[currentUser.username];
        if (userPerms && userPerms.permissions.allowedSites) {
            const siteCards = document.querySelectorAll('.site-card');
            siteCards.forEach(card => {
                const siteElement = card.closest('.site-card');
                if (siteElement && siteElement.onclick) {
                    const match = siteElement.onclick.toString().match(/showSiteDetails\('([^']+)'\)/);
                    if (match) {
                        const siteId = match[1];
                        const canView = userPerms.permissions.allowedSites.includes(siteId);
                        card.style.display = canView ? '' : 'none';
                    }
                }
            });
        }
    }
}

function updateAddButtonByPermission() {
    const addButton = document.querySelector('.add-site-btn');
    if (addButton) {
        addButton.style.display = hasPermission('addSite') ? '' : 'none';
    }
}

function updateDataManagementByPermission() {
    const dataManagement = document.querySelector('.import-export');
    if (!dataManagement) return;
    
    const buttons = {
        saveToJsFile: dataManagement.querySelector('[onclick*="saveToJsFile"]'),
        downloadJsonData: dataManagement.querySelector('[onclick*="downloadJsonData"]'),
        loadFromJsFile: dataManagement.querySelector('[onclick*="loadFromJsFile"]'),
        loadImagesZipOnly: dataManagement.querySelector('[onclick*="loadImagesZipOnly"]')
    };
    
    if (buttons.saveToJsFile) {
        buttons.saveToJsFile.style.display = hasPermission('exportData') ? '' : 'none';
    }
    if (buttons.downloadJsonData) {
        buttons.downloadJsonData.style.display = hasPermission('exportData') ? '' : 'none';
    }
    if (buttons.loadFromJsFile) {
        buttons.loadFromJsFile.style.display = hasPermission('importData') ? '' : 'none';
    }
    if (buttons.loadImagesZipOnly) {
        buttons.loadImagesZipOnly.style.display = hasPermission('importData') ? '' : 'none';
    }
}

function updateModalPermissions() {
    const quoteInputs = document.querySelectorAll('#quoteTab input[type="number"]');
    quoteInputs.forEach(input => {
        input.readOnly = !hasPermission('editQuote');
    });
    
    const saveQuoteBtn = document.querySelector('#quoteTab button[onclick="saveQuote()"]');
    if (saveQuoteBtn) {
        saveQuoteBtn.disabled = !hasPermission('editQuote');
    }
    
    const deleteButtons = document.querySelectorAll('.action-btn.delete-btn');
    deleteButtons.forEach(btn => {
        btn.style.display = hasPermission('deleteItems') ? '' : 'none';
    });
    
    const addButtons = document.querySelectorAll('.tab-content button[onclick*="add"]');
    addButtons.forEach(btn => {
        const tabContent = btn.closest('.tab-content');
        if (tabContent) {
            const tabId = tabContent.id;
            const canView = canViewTab(tabId);
            btn.style.display = (canView && hasPermission('addItems')) ? '' : 'none';
        }
    });
}

// ==================== 工具函数 ====================
function getDefaultTemplate(username) {
    return {
        name: '默认权限',
        description: '默认权限配置',
        permissions: {
            viewAllSites: false,
            addSite: false,
            deleteSite: false,
            editAll: false,
            exportData: false,
            importData: true,
            viewLogs: false,
            cloudSync: true,
            editQuote: false,
            deleteItems: false,
            viewAllTabs: false,
            addItems: true,
            allowedSites: [],
            allowedTabs: []
        }
    };
}
// ==================== 管理员管理函数 ====================
function addToAdminList(username) {
    if (!window.ADMIN_USERS.includes(username)) {
        window.ADMIN_USERS.push(username);
        console.log(`已将用户 ${username} 添加到管理员列表`);
    }
}

function removeFromAdminList(username) {
    const index = window.ADMIN_USERS.indexOf(username);
    if (index > -1) {
        window.ADMIN_USERS.splice(index, 1);
        console.log(`已将用户 ${username} 从管理员列表移除`);
    }
}

function setUserAsAdmin(username, isAdmin = true) {
    const user = builtInUsers.find(u => u.username === username);
    if (user) {
        user.isAdmin = isAdmin;
        
        // 更新权限配置
        if (PERMISSION_CONFIG.userPermissions[username]) {
            PERMISSION_CONFIG.userPermissions[username].permissions.isAdmin = isAdmin;
        }
        
        // 更新管理员列表
        if (isAdmin && !window.ADMIN_USERS.includes(username)) {
            window.ADMIN_USERS.push(username);
        } else if (!isAdmin) {
            removeFromAdminList(username);
        }
        
        savePermissionConfig();
        console.log(`已将用户 ${username} 设置为管理员: ${isAdmin}`);
    }
}

// 暴露到全局
window.addToAdminList = addToAdminList;
window.removeFromAdminList = removeFromAdminList;
window.setUserAsAdmin = setUserAsAdmin;
// 暴露函数到全局
window.showPermissionManager = showPermissionManager;
window.exportPermissionConfig = exportPermissionConfig;
window.editUserPermissions = editUserPermissions;
window.saveUserPermissions = saveUserPermissions;
window.updatePermissionValue = updatePermissionValue;
window.hasPermission = hasPermission;
window.canViewSite = canViewSite;
window.canViewTab = canViewTab;
window.showAddUserModal = showAddUserModal;
window.deleteUser = deleteUser;
window.getAllowedTabs = getAllowedTabs;
window.applyUserPermissions = applyUserPermissions;
window.initPermissionSystem = initPermissionSystem;
window.loadPermissionConfig = loadPermissionConfig;
window.savePermissionConfig = savePermissionConfig;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 等待主应用初始化完成后再初始化权限系统
    setTimeout(function() {
        if (typeof initPermissionSystem === 'function') {
            initPermissionSystem();
        }
    }, 300); // 增加延迟，确保 app.js 先初始化
});