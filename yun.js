
// （保留原有的 ensureGitHubToken 和 promptForGitHubToken 函数）
// ==================== GitHub Token 管理函数 ====================

async function ensureGitHubToken(options = {}) {
    const {
        checkDataSize = true,      // 是否检查数据大小
        purpose = 'upload',        // 用途: 'upload'|'config'|'permission'
        showWarning = true         // 是否显示警告
    } = options;
    
    // 1. 先检查是否已有 Token
    if (GIST_CONFIG.GITHUB_TOKEN && GIST_CONFIG.GITHUB_TOKEN.length > 10) {
        console.log('已有 Token，直接使用');
        return GIST_CONFIG.GITHUB_TOKEN;
    }
    
    // 2. 检查 localStorage
    const savedConfig = localStorage.getItem('github_config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            if (config.GITHUB_TOKEN && config.GITHUB_TOKEN.length > 10) {
                GIST_CONFIG.GITHUB_TOKEN = config.GITHUB_TOKEN;
                GIST_CONFIG.configLoaded = true;
                console.log('从 localStorage 加载 Token');
                return GIST_CONFIG.GITHUB_TOKEN;
            }
        } catch (e) {
            console.warn('解析 localStorage 配置失败:', e);
        }
    }
    
    // 3. 如果没有 Token，提示用户输入
    return await promptForGitHubToken({ checkDataSize, purpose, showWarning });
}

// 独立的 Token 输入函数
async function promptForGitHubToken(options = {}) {
    return new Promise((resolve) => {
        const {
            checkDataSize = true,
            purpose = 'upload',
            showWarning = true
        } = options;
        
        // 根据用途显示不同的提示
        const purposeText = {
            'upload': '备份数据到云端',
            'config': '同步云端配置',
            'permission': '上传权限配置'
        }[purpose] || '操作';
        
        // 创建输入模态框
        const modal = document.createElement('div');
        modal.className = 'github-token-modal';
        modal.style.cssText = `
            display: flex;
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            justify-content: center;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        // 检查数据大小（只在需要时）
        let sizeCheck = { canUpload: true, humanSize: '0 MB' };
        let warningHtml = '';
        
        if (checkDataSize) {
            sizeCheck = checkDataSizeBeforeUpload();
            
            if (!sizeCheck.canUpload) {
                warningHtml = `
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        ⚠️ <strong>数据过大警告</strong><br>
                        当前数据大小：${sizeCheck.humanSize}<br>
                        GitHub Gist 单个文件限制为10MB。<br>
                        请先清理数据再尝试上传。
                    </div>
                `;
            } else if (sizeCheck.totalSize > 5 * 1024 * 1024) {
                warningHtml = `
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; border-radius: 5px; margin-bottom: 15px;">
                        ⚠️ <strong>数据较大提醒</strong><br>
                        当前数据大小：${sizeCheck.humanSize}<br>
                        包含 ${sizeCheck.imageCount} 个图片文件。<br>
                        建议压缩图片后再上传。
                    </div>
                `;
            }
        }
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; width: 90%; max-width: 500px; box-shadow: 0 5px 30px rgba(0,0,0,0.3);">
                <h3 style="margin: 0 0 20px 0; color: #333;"> Token秘钥 配置</h3>
                
                ${warningHtml}
                
                <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                    <strong>需要 Token 才能 ${purposeText}。</strong><br>
                    ${
                        purpose === 'upload' 
                            ? '从云端加载数据不需要 Token。' 
                            : '从云端加载配置不需要 Token。'
                    }
                    
                </p>
                
                <div style="margin-bottom: 15px;">
                    <input type="password" 
                           id="githubTokenInput" 
                           style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box;"
                           placeholder="请输入 GitHub Token，如：ghp_xxxxxxxxxxxxxxxxxxxx"
                           autocomplete="off">
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 25px;">
                    <button id="saveTokenBtn" 
                            style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; flex: 1; margin-right: 10px;">
                        保存 Token
                    </button>
                    <button id="cancelBtn" 
                            style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; flex: 1; margin-left: 10px;">
                        取消
                    </button>
                </div>
                
                ${!sizeCheck.canUpload ? `
                <div style="margin-top: 15px; text-align: center;">
                    <button id="cleanDataBtn" 
                            style="padding: 8px 16px; background: #fd7e14; color: white; border: none; border-radius: 4px; font-size: 14px; cursor: pointer;">
                        先去清理数据
                    </button>
                </div>
                ` : ''}
                
               
                
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const tokenInput = document.getElementById('githubTokenInput');
        const saveBtn = document.getElementById('saveTokenBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const cleanDataBtn = document.getElementById('cleanDataBtn');
        
        // 如果数据过大，禁用保存按钮
        if (!sizeCheck.canUpload) {
            saveBtn.disabled = true;
            saveBtn.style.backgroundColor = '#6c757d';
            saveBtn.style.cursor = 'not-allowed';
            saveBtn.title = '数据过大，请先清理';
        }
        
        setTimeout(() => tokenInput.focus(), 100);
        
        saveBtn.onclick = () => {
            if (!sizeCheck.canUpload) {
                alert('数据过大，无法上传！请先清理数据。');
                return;
            }
            
            const token = tokenInput.value.trim();
            
            if (!token) {
                alert('请输入 GitHub Token');
                return;
            }
            
            // 验证 Token 格式
            if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
                if (!confirm('警告：Token 格式看起来不正确！\n正确的 Token 通常以 "ghp_" 或 "github_pat_" 开头。\n是否继续使用此 Token？')) {
                    return;
                }
            }
            
            // 保存 Token
            GIST_CONFIG.GITHUB_TOKEN = token;
            GIST_CONFIG.configLoaded = true;
            
            localStorage.setItem('github_config', JSON.stringify({
                GIST_ID: BUILT_IN_CONFIG.GIST_ID,
                GITHUB_TOKEN: token,
                configLoaded: true,
                lastUpdated: new Date().toISOString(),
                purpose: purpose
            }));
            
            modal.remove();
            resolve(token); // 返回 Token
        };
        
        cancelBtn.onclick = () => {
            modal.remove();
            resolve(null); // 返回 null 表示取消
        };
        
        if (cleanDataBtn) {
            cleanDataBtn.onclick = () => {
                modal.remove();
                alert('建议清理以下数据：\n1. 删除不需要的维修图片\n2. 删除旧的图纸文件\n3. 压缩现有图片\n\n清理完成后重新尝试。');
                resolve(null);
            };
        }
        
        tokenInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                cancelBtn.click();
            }
        });
    });
}
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
    //要更改的内容如下：------------------------------------------
    GIST_ID: CLOUD_CONFIG.GIST_ID, // 使用base.js中的GIST_ID
    GITHUB_TOKEN: '', // Token 改为空，需要用户输入
    configLoaded: false // 初始状态为未加载
};

// 不再自动初始化配置

// 在yun.js开头添加
if (typeof window.currentUser === 'undefined') {
    window.currentUser = null;
}
async function saveToJsFile() {
    try {
        if (!currentUser) {
            alert('请先登录！');
            return;
        }

        if (!confirm('即将下载完整数据备份ZIP包，包含所有文本和图片数据。文本数据不包含base64，图片以文件形式保存。是否继续？')) {
            return;
        }

        // 创建完整数据对象（包含所有数据）
        const fullData = {
            sites: JSON.parse(JSON.stringify(sites)), // 深拷贝原始数据
            changeLog: changeLog,
            exportTime: new Date().toLocaleString('zh-CN'),
            exportedBy: currentUser.name,
            dataVersion: '2.3',
            note: '完整数据备份（图片以文件形式保存）'
        };

        await generateAndDownloadZip(fullData);
        addChangeLog('备份完整数据', '下载了包含完整数据的ZIP包（图片以文件形式保存）');

    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败：' + error.message);
    }
}

// 重新配置 GitHub Token
function resetGithubConfig() {
    localStorage.removeItem('github_config');
    GIST_CONFIG.configLoaded = false;
    GIST_CONFIG.GITHUB_TOKEN = '';
    
    promptForGithubToken().then((success) => {
        if (success) {
            showSimpleToast('GitHub 配置已重置并重新配置');
        }
    });
}
// ==================== 权限检查函数（统一格式） ====================

// 删除权限
function canDelete() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('deleteItems');
    return false;
}

// 编辑时间权限
function canEditTime() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('editAll');
    return false;
}

// 编辑状态权限
function canEditStatus() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('editAll');
    return false;
}

// 编辑报价权限
function canEditQuote() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('editQuote');
    return false;
}

// 清空日志权限
function canClearLog() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('viewLogs');
    return false;
}

// 添加项目权限
function canAdd() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('addItems');
    return false;
}

// 编辑工人评分权限
function canEditWorkerRating() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('editAll');
    return false;
}

// 编辑工人时间权限
function canEditWorkerTime() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('editAll');
    return false;
}

// 编辑备注权限
function canEditNote() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('editAll');
    return false;
}

// 显示权限管理器权限
function canShowPermissionManager() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('showPermissionManager');
    return false;
}

// 显示更改日志权限
function canShowChangeLog() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('viewLogs');
    return false;
}

// 管理GitHub配置权限
function canManageGithubConfig() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('cloudSync');
    return false;
}

// 刷新云端用户权限
function canRefreshCloudUsers() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('refreshCloudUsers');
    return false;
}

function canSaveToJsFile() {
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('exportData');
    return false;
}

// 下载JSON数据权限
function canDownloadJsonData() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('exportData');
    return false;
}

// 从文件加载权限
function canLoadFromJsFile() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('importData');
    return false;
}

// 加载图片包权限
function canLoadImagesZipOnly() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('importData');
    return false;
}

// 查看工地权限
function canViewSite(siteId) { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    
    if (typeof window.hasPermission === 'function') {
        if (window.hasPermission('viewAllSites')) return true;
        
        const userPerms = window.PERMISSION_CONFIG && window.PERMISSION_CONFIG.userPermissions;
        if (userPerms && window.currentUser && userPerms[window.currentUser.username]) {
            return userPerms[window.currentUser.username].permissions.allowedSites?.includes(siteId) || false;
        }
    }
    return false;
}

// 查看标签页权限
function canViewTab(tabId) { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    
    if (typeof window.hasPermission === 'function') {
        if (window.hasPermission('viewAllTabs')) return true;
        
        const userPerms = window.PERMISSION_CONFIG && window.PERMISSION_CONFIG.userPermissions;
        if (userPerms && window.currentUser && userPerms[window.currentUser.username]) {
            return userPerms[window.currentUser.username].permissions.allowedTabs?.includes(tabId) || false;
        }
    }
    return false;
}

// 云端同步权限
function canCloudSync() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('cloudSync');
    return false;
}

// 导出数据权限
function canExportData() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('exportData');
    return false;
}

// 导入数据权限
function canImportData() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('importData');
    return false;
}

// 添加工地权限
function canAddSite() { 
    if (typeof window.isAdmin === 'function' && window.isAdmin()) return true;
    if (typeof window.hasPermission === 'function') return window.hasPermission('addSite');
    return false;
}

// ==================== 暴露到全局 ====================

// 核心权限函数
window.canDelete = canDelete;
window.canEditTime = canEditTime;
window.canEditStatus = canEditStatus;
window.canEditQuote = canEditQuote;
window.canClearLog = canClearLog;
window.canAdd = canAdd;
window.canEditWorkerRating = canEditWorkerRating;
window.canEditWorkerTime = canEditWorkerTime;
window.canEditNote = canEditNote;

// 界面权限函数
window.canShowPermissionManager = canShowPermissionManager;
window.canShowChangeLog = canShowChangeLog;
window.canManageGithubConfig = canManageGithubConfig;

// 数据管理权限函数
window.canRefreshCloudUsers = canRefreshCloudUsers;
window.canSaveToJsFile = canSaveToJsFile;
window.canDownloadJsonData = canDownloadJsonData;
window.canLoadFromJsFile = canLoadFromJsFile;
window.canLoadImagesZipOnly = canLoadImagesZipOnly;
window.canCloudSync = canCloudSync;
window.canExportData = canExportData;
window.canImportData = canImportData;
window.canAddSite = canAddSite;

// 访问控制函数
window.canViewSite = canViewSite;
window.canViewTab = canViewTab;

// 管理员检查函数（确保存在）
if (typeof window.isAdmin === 'undefined') {
    window.isAdmin = function() {
        if (!window.currentUser) return false;
        
        // 检查用户对象的 isAdmin 属性
        if (window.currentUser.isAdmin === true) return true;
        
        // 检查管理员列表
        if (window.ADMIN_USERS && window.ADMIN_USERS.includes(window.currentUser.username)) return true;
        
        // 检查权限配置中的管理员标志
        const userPerms = window.PERMISSION_CONFIG && window.PERMISSION_CONFIG.userPermissions;
        if (userPerms && userPerms[window.currentUser.username]) {
            return userPerms[window.currentUser.username].permissions.isAdmin === true;
        }
        
        return false;
    };
}

// 权限检查函数（确保存在）
if (typeof window.hasPermission === 'undefined') {
    window.hasPermission = function(permissionName) {
        if (!window.currentUser) return false;
        
        // 首先检查是否为管理员
        if (window.isAdmin && window.isAdmin()) return true;
        
        // 获取用户权限
        const userPerms = window.PERMISSION_CONFIG && window.PERMISSION_CONFIG.userPermissions;
        if (!userPerms || !userPerms[window.currentUser.username]) return false;
        
        return userPerms[window.currentUser.username].permissions[permissionName] || false;
    };
}

// ==================== 权限应用函数 ====================

/**
 * 更新顶部按钮权限显示
 */
function updateTopButtonsByPermission() {
    const topButtons = document.querySelector('.header-top-buttons');
    if (!topButtons) return;
    
    // 权限管理按钮
    let permissionBtn = topButtons.querySelector('.permission-manager-btn');
    if (!permissionBtn) {
        permissionBtn = document.createElement('button');
        permissionBtn.className = 'top-btn btn-danger permission-manager-btn';
        permissionBtn.onclick = window.showPermissionManager || function() { alert('权限管理功能未加载'); };
        permissionBtn.textContent = '权限管理';
        permissionBtn.title = '权限管理';
        topButtons.appendChild(permissionBtn);
    }
    
    // 更改日志按钮
    let changeLogBtn = topButtons.querySelector('.change-log-btn');
    if (!changeLogBtn) {
        changeLogBtn = document.createElement('button');
        changeLogBtn.className = 'top-btn btn-primary change-log-btn';
        changeLogBtn.onclick = window.showChangeLog || function() { alert('更改日志功能未加载'); };
        changeLogBtn.textContent = '更改日志';
        changeLogBtn.title = '更改日志';
        topButtons.appendChild(changeLogBtn);
    }
    
    // 根据权限显示/隐藏按钮
    if (typeof window.canShowPermissionManager === 'function') {
        permissionBtn.style.display = window.canShowPermissionManager() ? '' : 'none';
    } else {
        permissionBtn.style.display = 'none';
    }
    
    if (typeof window.canShowChangeLog === 'function') {
        changeLogBtn.style.display = window.canShowChangeLog() ? '' : 'none';
    } else {
        changeLogBtn.style.display = 'none';
    }
}

/**
 * 获取用户可访问的标签页
 */
function getAllowedTabs() {
    if (!window.currentUser) return [];
    
    if (window.hasPermission && window.hasPermission('viewAllTabs')) {
        return window.PERMISSION_CONFIG.availableTabs || [];
    }
    
    const userPerms = window.PERMISSION_CONFIG && window.PERMISSION_CONFIG.userPermissions;
    if (!userPerms || !userPerms[window.currentUser.username] || !userPerms[window.currentUser.username].permissions.allowedTabs) {
        return [];
    }
    
    const availableTabs = window.PERMISSION_CONFIG.availableTabs || [];
    return availableTabs.filter(tab => 
        userPerms[window.currentUser.username].permissions.allowedTabs.includes(tab.id)
    );
}

/**
 * 应用用户权限到界面
 */
function applyUserPermissions() {
    if (!window.currentUser) return;
    
    console.log('应用用户权限:', window.currentUser.username);
    
    // 更新顶部按钮
    updateTopButtonsByPermission();
    
    // 更新标签页
    if (typeof window.initTabs === 'function') {
        window.initTabs();
    }
    
    // 更新工地列表
    if (typeof window.renderSiteList === 'function') {
        setTimeout(() => window.renderSiteList(), 100);
    }
    
    // 更新添加按钮
    const addButton = document.querySelector('.add-site-btn');
    if (addButton && typeof window.canAddSite === 'function') {
        addButton.style.display = window.canAddSite() ? '' : 'none';
    }
    
    // 更新数据管理按钮
    updateDataManagementButtons();
}

/**
 * 更新数据管理按钮权限
 */
function updateDataManagementButtons() {
    const dataManagement = document.querySelector('.import-export');
    if (!dataManagement) return;
    
    // 备份完整数据按钮
    const saveToJsFileBtn = dataManagement.querySelector('[onclick*="saveToJsFile"]');
    if (saveToJsFileBtn && typeof window.canSaveToJsFile === 'function') {
        saveToJsFileBtn.style.display = window.canSaveToJsFile() ? '' : 'none';
    }
    
    // 下载JSON数据按钮
    const downloadJsonDataBtn = dataManagement.querySelector('[onclick*="downloadJsonData"]');
    if (downloadJsonDataBtn && typeof window.canDownloadJsonData === 'function') {
        downloadJsonDataBtn.style.display = window.canDownloadJsonData() ? '' : 'none';
    }
    
    // 从文件加载按钮
    const loadFromJsFileBtn = dataManagement.querySelector('[onclick*="loadFromJsFile"]');
    if (loadFromJsFileBtn && typeof window.canLoadFromJsFile === 'function') {
        loadFromJsFileBtn.style.display = window.canLoadFromJsFile() ? '' : 'none';
    }
    
    // 加载图片包按钮
    const loadImagesBtn = dataManagement.querySelector('[onclick*="loadImagesZipOnly"]');
    if (loadImagesBtn && typeof window.canLoadImagesZipOnly === 'function') {
        loadImagesBtn.style.display = window.canLoadImagesZipOnly() ? '' : 'none';
    }
}

// 暴露权限应用函数
window.updateTopButtonsByPermission = updateTopButtonsByPermission;
window.getAllowedTabs = getAllowedTabs;
window.applyUserPermissions = applyUserPermissions;
window.updateDataManagementButtons = updateDataManagementButtons;

// 可选：添加一个查看配置的函数
function showCurrentConfig() {
    alert(`当前GitHub配置：
Gist ID: ${GIST_CONFIG.GIST_ID.substring(0, 8)}...
Token: ${GIST_CONFIG.GITHUB_TOKEN.substring(0, 8)}...
配置状态: ${GIST_CONFIG.configLoaded ? '已加载' : '未加载'}`);
}





// ==================== 配置管理 ====================
async function loadGithubConfig() {
    console.log('开始加载 GitHub 配置...');
    
    // 先尝试从 localStorage 读取
    const savedConfig = localStorage.getItem('github_config');
    
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            GIST_CONFIG.GIST_ID = config.GIST_ID || BUILT_IN_CONFIG.GIST_ID;
            GIST_CONFIG.GITHUB_TOKEN = config.GITHUB_TOKEN;
            GIST_CONFIG.configLoaded = true;
            console.log('已从 localStorage 加载 GitHub 配置');
            return true;
        } catch (e) {
            console.warn('解析 localStorage 配置失败:', e);
            localStorage.removeItem('github_config');
        }
    }
    
    // 如果没有保存的配置，弹出输入框要求用户输入
    return await promptForGithubToken();
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

// 添加数据清理提示
function showDataCleanupTips() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        display: flex;
        position: fixed;
        z-index: 9999;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        justify-content: center;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;">
            <h3 style="margin: 0 0 20px 0; color: #333;">数据清理指南</h3>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #d63031;">⚠️ 数据过大，需要清理</h4>
                <p>您的数据大小超过了GitHub Gist的10MB限制，无法上传。</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4>清理建议：</h4>
                <ul style="margin-left: 20px; color: #666;">
                    <li><strong>删除不需要的图片：</strong>删除维修记录中的旧照片</li>
                    <li><strong>压缩现有图片：</strong>点击图片旁边的"更换"按钮重新上传压缩版</li>
                    <li><strong>删除旧的图纸文件：</strong>删除不再需要的设计图纸</li>
                    <li><strong>清理历史数据：</strong>删除已完成的工地的相关数据</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4>操作步骤：</h4>
                <ol style="margin-left: 20px; color: #666;">
                    <li>进入各个工地详情页面</li>
                    <li>在"待维修"标签页，删除不需要的维修图片</li>
                    <li>在"图纸"标签页，删除大的图纸文件</li>
                    <li>使用"备份完整数据ZIP"功能先本地备份</li>
                    <li>清理完成后重新尝试云端备份</li>
                </ol>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-top: 25px;">
                <button id="closeBtn" 
                        style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; flex: 1;">
                    关闭
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('closeBtn').onclick = () => {
        modal.remove();
    };
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
        alert('请先配置GitHub同步！');
        
        // 尝试显示配置管理按钮
        ensureGitHubToken();
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
        //要更改的内容如下：------------------------------------------
        const fileContent = gist.files[CLOUD_CONFIG.DATA_FILES.CLOUD_JSON]?.content;
        
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

// 在 yun.js 中找到 saveToGitHub 函数，修改如下：

async function saveToGitHub() {
    console.log('=== 开始 saveToGitHub 函数 ===');
    
    // 使用新的 Token 管理函数
    const token = await ensureGitHubToken({
        checkDataSize: true,
        purpose: 'upload',
        showWarning: true
    });
    
    if (!token) {
        showSimpleToast('备份到云端需要 GitHub Token，请先配置', 'error');
        return false;
    }
    
    // 确保 Token 已设置
    GIST_CONFIG.GITHUB_TOKEN = token;
    
    if (isSyncing) {
        showSimpleToast('正在同步中，请稍后重试', 'warning');
        return false;
    }
    
    // 检查数据大小
    const dataSizeCheck = checkDataSizeBeforeUpload();
    if (!dataSizeCheck.canUpload) {
        alert(`数据过大，无法上传！\n\n当前数据大小：${dataSizeCheck.humanSize}\n建议删除部分图片或清理数据后再试。`);
        return false;
    }

    // 修改确认提示，包含大小信息
    if (!confirm(`即将备份数据到云端。\n\n当前数据大小：${dataSizeCheck.humanSize}\n包含所有文本和图片数据，是否继续？`)) {
        return false;
    }

    isSyncing = true;

    try {
        // 准备完整数据（含图片）
        const fullData = {
            sites: JSON.parse(JSON.stringify(sites)),
            changeLog: JSON.parse(JSON.stringify(changeLog)),
            lastSync: new Date().toISOString(),
            user: currentUser.name,
            syncVersion: '2.3',
            note: '完整数据备份（含图片）'
        };

        // 准备轻量数据（不含图片）
        const lightData = JSON.parse(JSON.stringify(fullData));
        removeAllBase64Data(lightData.sites);
        lightData.note = '轻量数据备份（不含图片base64）';
        lightData.isLight = true;

        const fullDataString = JSON.stringify(fullData);
        const lightDataString = JSON.stringify(lightData);
        
        console.log('JSON数据大小:', {
            full: (fullDataString.length / 1024 / 1024).toFixed(2) + ' MB',
            light: (lightDataString.length / 1024 / 1024).toFixed(2) + ' MB'
        });
        
        // 检查完整数据大小
        if (fullDataString.length > 8 * 1024 * 1024) { // 8MB，留一些余量
            alert('警告：完整数据大小超过8MB，上传到GitHub可能会失败！\n\n建议先备份轻量数据。');
            isSyncing = false;
            return false;
        }

        const response = await fetch(`https://api.github.com/gists/${GIST_CONFIG.GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GIST_CONFIG.GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                description: `工地数据备份 - ${new Date().toLocaleString()} (完整:${dataSizeCheck.humanSize})`,
                files: {
                    "your-all.json": {  // 完整数据文件
                        content: fullDataString
                    },
                    "your-lightdata.json": {  // 轻量数据文件
                        content: lightDataString
                    }
                }
            })
        });

        if (response.ok) {
            showSimpleToast(`数据已备份到云端！\n完整数据(${dataSizeCheck.humanSize})和轻量数据已保存。`);
            addChangeLog('云端备份', `备份了完整数据和轻量数据到云端`);
            return true;
        } else {
            const error = await response.text();
            console.error('云端备份失败:', error);
            
            if (response.status === 422) {
                const errorObj = JSON.parse(error);
                if (errorObj.message && errorObj.message.includes('too large')) {
                    alert('上传失败：文件过大！\n\nGitHub Gist 单个文件限制为10MB。\n请压缩图片或删除部分数据后重试。');
                } else {
                    alert('上传失败：' + errorObj.message);
                }
            } else if (response.status === 401) {
                alert('GitHub Token 已过期或无效！\n\n请重新配置GitHub Token。');
                GIST_CONFIG.GITHUB_TOKEN = '';
                GIST_CONFIG.configLoaded = false;
                localStorage.removeItem('github_config');
            } else {
                alert(`上传失败：${response.status} ${response.statusText}`);
            }
            return false;
        }

    } catch (error) {
        console.error('云端备份异常:', error);
        
        let errorMsg = '备份失败：';
        if (error.message.includes('Failed to fetch')) {
            errorMsg = '网络连接失败，请检查网络连接。';
        } else if (error.message.includes('token')) {
            errorMsg = 'GitHub Token 无效，请重新配置。';
        } else {
            errorMsg += error.message;
        }
        
        showSimpleToast(errorMsg, 'error');
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
    input.accept = '.zip,.js';
    input.onchange = async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // 如果是JS文件，直接加载
            if (file.name.endsWith('.js')) {
                const text = await file.text();
                await loadFromJsContent(text);
                saveData();
                renderSiteList();
                addChangeLog('从文件加载数据', `从文件 ${file.name} 加载数据`);
                alert(`数据加载成功！\n已加载 ${sites.length} 个工地数据。`);
                return;
            }
            
            // 如果是ZIP文件，使用JSZip处理
            if (typeof JSZip === 'undefined') {
                alert('JSZip 库未加载，无法处理 ZIP 文件');
                return;
            }

            // 清空现有数据（覆盖）
            sites = [];
            changeLog = [];
            
            const zip = await JSZip.loadAsync(file);
            
            // 查找数据文件（优先查找shuju_light.js）
            let dataFile = null;
            const possibleDataFiles = [
                'shuju_light.js',  // 新格式：轻量版数据
                'shuju.js',        // 旧格式：完整数据
                CLOUD_CONFIG.DATA_FILES.CLOUD_JSON
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

            // 恢复图片文件（从shuju文件夹）
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
        CLOUD_CONFIG.DATA_FILES.CLOUD_JSON
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

// ==================== 工具函数 ====================
function extractIndexFromFileName(fileName, prefix) {
    const regex = new RegExp(`${prefix}_(\\d+)\\.`);
    const match = fileName.match(regex);
    return match ? parseInt(match[1], 10) - 1 : null;
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
    try {
        console.log('直接从 raw URL 加载数据...');
        
        // 定义两个文件的 raw URL
        const fullDataUrl = 'https://gist.githubusercontent.com/ebaizs/097f8adbb3790f3a95ba586a0867699b/raw/your-all.json';
        const lightDataUrl = 'https://gist.githubusercontent.com/ebaizs/097f8adbb3790f3a95ba586a0867699b/raw/your-lightdata.json';
        
        let selectedFileUrl = null;
        let selectedFileName = '';
        
        // 让用户选择加载哪个文件
        const choice = prompt(
            '云端有两个数据文件：\n\n' +
            '1. your-all.json - 完整数据（含图片）\n' +
            '2. your-lightdata.json - 轻量数据（不含图片）\n\n' +
            '请输入数字选择要还原的数据（1 或 2）：'
        );
        
        if (choice === '1') {
            selectedFileUrl = fullDataUrl;
            selectedFileName = 'your-all.json';
        } else if (choice === '2') {
            selectedFileUrl = lightDataUrl;
            selectedFileName = 'your-lightdata.json';
        } else {
            alert('选择无效，已取消');
            return false;
        }
        
        console.log('正在加载文件:', selectedFileName);
        
        // 直接通过 raw URL 加载数据
        const rawResponse = await fetch(selectedFileUrl, {
            cache: 'no-cache',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!rawResponse.ok) {
            throw new Error(`HTTP ${rawResponse.status}: ${rawResponse.statusText}`);
        }
        
        const rawContent = await rawResponse.text();
        const cloudData = JSON.parse(rawContent);
        const cloudSites = cloudData.sites || [];
        const cloudChangeLog = cloudData.changeLog || [];
        
        console.log('从云端加载数据成功，站点数量:', cloudSites.length);
        
        if (cloudSites.length === 0) {
            alert('云端数据为空，没有可加载的数据！');
            return false;
        }
        
        // 确认是否合并数据（非覆盖）
        const confirmMessage = `云端有 ${cloudSites.length} 个工地数据，${cloudChangeLog.length} 条更改日志。\n\n` +
                              '这将把云端数据合并到本地（不会删除本地数据）。\n' +
                              '是否继续？';
        
        if (!confirm(confirmMessage)) {
            return false;
        }
        
        // 合并工地数据
        if (typeof window.mergeCloudData === 'function') {
            const result = window.mergeCloudData(cloudSites, cloudChangeLog);
            
            // 保存数据
            if (typeof window.saveData === 'function') {
                window.saveData();
            }
            
            // 刷新显示
            if (typeof window.renderSiteList === 'function') {
                window.renderSiteList();
            }
            
            let message = `云端数据已成功加载并合并到本地！\n\n` +
                         `新增工地: ${result.addedCount} 个\n` +
                         `更新工地: ${result.updatedCount} 个`;
            
            if (result.imageCount > 0) {
                message += `\n包含图片: ${result.imageCount} 个`;
            }
            
            if (selectedFileName === 'your-lightdata.json') {
                message += '\n\n注意：这是轻量数据，不含图片的base64编码。';
                message += '\n如需加载图片，请使用"加载图片包"功能。';
            }
            
            alert(message);
            
            // 刷新当前工地
            if (window.currentSiteId && window.sites) {
                const site = window.sites.find(s => s.id === window.currentSiteId);
                if (site && typeof window.loadSiteData === 'function') {
                    window.loadSiteData(site);
                }
            }
            
            // 添加更改日志
            if (typeof window.addChangeLog === 'function') {
                window.addChangeLog('从云端加载数据', `从云端${selectedFileName}加载并合并了数据`);
            }
            
            return true;
        } else {
            throw new Error('mergeCloudData 函数未找到');
        }
        
    } catch (error) {
        console.error('从云端加载失败:', error);
        
        let errorMsg = '云端加载失败: ';
        if (error.message.includes('Failed to fetch')) {
            errorMsg = '网络连接失败，请检查网络连接。';
        } else if (error.message.includes('JSON')) {
            errorMsg = '云端数据格式错误，请检查云端文件。';
        } else {
            errorMsg += error.message;
        }
        
        alert(errorMsg);
        return false;
    }
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
window.ensureGitHubToken = ensureGitHubToken;
window.promptForGitHubToken = promptForGitHubToken;

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
