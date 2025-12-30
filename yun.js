// 在yun.js开头添加
if (typeof window.currentUser === 'undefined') {
    window.currentUser = null;
}

// 修改权限检查函数，确保与quanxian.js兼容
function isAdmin() {
    // 先尝试使用quanxian.js中的方法
    if (typeof window.isAdmin === 'function' && window.isAdmin !== isAdmin) {
        return window.isAdmin();
    }
    // 备用检查
    return currentUser && (currentUser.username === 'qiyu' || currentUser.username === 'admin');
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

// 添加新的权限检查
function canManageGithubConfig() {
    return isAdmin(); // 只有管理员可以配置
}

// 权限管理按钮显示权限
function canShowPermissionManager() {
    return isAdmin() || (hasPermission ? hasPermission('showPermissionManager') : false);
}

// 更改日志按钮显示权限
function canShowChangeLog() {
    return isAdmin() || (hasPermission ? hasPermission('viewLogs') : false) || canClearLog();
}

// 暴露到全局
window.canManageGithubConfig = canManageGithubConfig;
window.canShowPermissionManager = canShowPermissionManager;
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
// ==================== 配置管理 ====================
async function loadGithubConfig() {
    // 如果已经加载过配置，直接返回
    if (GIST_CONFIG.configLoaded) {
        console.log('配置已加载，跳过重复加载');
        return true;
    }
    
    console.log('开始加载GitHub配置...');
    
    // 尝试从 localStorage 加载配置
    const savedConfig = localStorage.getItem('github_config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            GIST_CONFIG.GIST_ID = config.GIST_ID || '';
            GIST_CONFIG.GITHUB_TOKEN = config.GITHUB_TOKEN || '';
            
            // 验证配置是否完整
            if (GIST_CONFIG.GIST_ID && GIST_CONFIG.GITHUB_TOKEN) {
                GIST_CONFIG.configLoaded = true;
                console.log('从localStorage加载GitHub配置成功');
                console.log('GIST_ID:', GIST_CONFIG.GIST_ID.substring(0, 8) + '...');
                return true;
            } else {
                console.warn('localStorage中的配置不完整，需要重新配置');
                localStorage.removeItem('github_config');
                GIST_CONFIG.configLoaded = false;
            }
        } catch (e) {
            console.warn('解析保存的配置失败:', e);
            localStorage.removeItem('github_config');
            GIST_CONFIG.configLoaded = false;
        }
    }
    
    console.log('未找到本地配置，需要显示配置对话框');
    const result = await promptForConfigFile();
    
    if (result) {
        console.log('用户配置完成，配置已加载');
        return true;
    } else {
        console.log('用户跳过了配置或配置失败');
        return false;
    }
}

async function promptForConfigFile() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(5px);
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%;">
                <h2 style="margin-bottom: 20px; color: #333;">首次使用配置</h2>
                <p style="margin-bottom: 20px; color: #666;">
                    这是第一次使用GitHub同步功能，请加载包含GitHub密钥的配置文件。
                </p>
                <p style="margin-bottom: 20px; color: #666; font-size: 14px;">
                    请选择包含以下内容的TXT文件：<br>
                    GIST_ID=你的Gist_ID<br>
                    GITHUB_TOKEN=你的GitHub_Token
                </p>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                        选择配置文件：
                    </label>
                    <input type="file" id="configFileInput" accept=".txt" 
                           style="width: 100%; padding: 10px; border: 2px dashed #ddd; border-radius: 5px;">
                </div>
                <div style="text-align: right;">
                    <button id="manualConfigBtn" style="padding: 10px 20px; margin-right: 10px; 
                           background: #f8f9fa; border: 1px solid #ddd; border-radius: 5px; cursor: pointer;">
                        手动输入
                    </button>
                    <button id="skipConfigBtn" style="padding: 10px 20px; 
                           background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        跳过配置
                    </button>
                </div>
                <div id="manualConfig" style="display: none; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">Gist ID：</label>
                        <input type="text" id="manualGistId" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" 
                               placeholder="例如：097f8adbb3790f3a95ba586a0867699b">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">GitHub Token：</label>
                        <input type="text" id="manualToken" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" 
                               placeholder="例如：ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx">
                    </div>
                    <button id="saveManualConfig" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        保存配置
                    </button>
                </div>
                <p id="configError" style="color: #dc3545; margin-top: 10px; display: none;"></p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const fileInput = modal.querySelector('#configFileInput');
        const skipBtn = modal.querySelector('#skipConfigBtn');
        const manualBtn = modal.querySelector('#manualConfigBtn');
        const manualDiv = modal.querySelector('#manualConfig');
        const errorDiv = modal.querySelector('#configError');
        
        fileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) {
                console.log('未选择文件');
                return;
            }
            
            console.log('选择了文件:', file.name, '大小:', file.size);
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                console.log('文件读取完成，开始解析配置...');
                const content = e.target.result;
                console.log('文件内容前50字符:', content.substring(0, 50));
                
                const config = parseConfigFile(content);
                console.log('解析后的配置:', config);
                
                if (config.GIST_ID && config.GITHUB_TOKEN) {
                    GIST_CONFIG.GIST_ID = config.GIST_ID;
                    GIST_CONFIG.GITHUB_TOKEN = config.GITHUB_TOKEN;
                    GIST_CONFIG.configLoaded = true;
                    
                    console.log('配置验证成功，保存到localStorage');
                    
                    localStorage.setItem('github_config', JSON.stringify({
                        GIST_ID: config.GIST_ID,
                        GITHUB_TOKEN: config.GITHUB_TOKEN,
                        lastUpdate: new Date().toISOString()
                    }));
                    
                    console.log('配置已保存到localStorage');
                    
                    setTimeout(() => {
                        if (modal.parentNode) {
                            modal.remove();
                        }
                        showSimpleToast('配置加载成功！');
                        resolve(true);
                    }, 100);
                    
                } else {
                    console.warn('配置文件格式不正确');
                    errorDiv.textContent = '配置文件格式不正确，请确保包含GIST_ID和GITHUB_TOKEN';
                    errorDiv.style.display = 'block';
                }
            };
            
            reader.onerror = function(e) {
                console.error('文件读取失败:', e);
                errorDiv.textContent = '文件读取失败，请重试';
                errorDiv.style.display = 'block';
            };
            
            reader.readAsText(file);
        });
        
        skipBtn.addEventListener('click', function() {
            GIST_CONFIG.configLoaded = false;
            modal.remove();
            showSimpleToast('已跳过配置，GitHub同步功能不可用', 'warning');
            resolve(false);
        });
        
        manualBtn.addEventListener('click', function() {
            manualDiv.style.display = 'block';
            manualBtn.style.display = 'none';
        });
        
        modal.querySelector('#saveManualConfig').addEventListener('click', function() {
            const gistId = modal.querySelector('#manualGistId').value.trim();
            const token = modal.querySelector('#manualToken').value.trim();
            
            if (!gistId || !token) {
                errorDiv.textContent = '请填写完整的配置信息';
                errorDiv.style.display = 'block';
                return;
            }
            
            console.log('手动保存配置:', { gistId: gistId.substring(0, 8) + '...', token: token.substring(0, 8) + '...' });
            
            GIST_CONFIG.GIST_ID = gistId;
            GIST_CONFIG.GITHUB_TOKEN = token;
            GIST_CONFIG.configLoaded = true;
            
            localStorage.setItem('github_config', JSON.stringify({
                GIST_ID: gistId,
                GITHUB_TOKEN: token,
                lastUpdate: new Date().toISOString()
            }));
            
            console.log('手动配置已保存到localStorage');
            
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
                showSimpleToast('配置保存成功！');
                resolve(true);
            }, 100);
        });
    });
}

function parseConfigFile(content) {
    const config = { GIST_ID: '', GITHUB_TOKEN: '' };
    const lines = content.split('\n');
    
    console.log('开始解析配置文件，行数:', lines.length);
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        console.log(`第${index + 1}行: ${trimmed.substring(0, 50)}`);
        
        if (trimmed.startsWith('GIST_ID=')) {
            config.GIST_ID = trimmed.substring(8).trim();
            console.log('找到 GIST_ID:', config.GIST_ID.substring(0, 8) + '...');
        } else if (trimmed.startsWith('GITHUB_TOKEN=')) {
            config.GITHUB_TOKEN = trimmed.substring(13).trim();
            console.log('找到 GITHUB_TOKEN:', config.GITHUB_TOKEN.substring(0, 8) + '...');
        }
    });
    
    console.log('解析完成，配置:', config);
    return config;
}

function manageGithubConfig() {
    localStorage.removeItem('github_config');
    GIST_CONFIG = { GIST_ID: '', GITHUB_TOKEN: '', configLoaded: false };
    showSimpleToast('配置已重置，下次同步时将重新配置');
}

// ==================== GitHub同步函数 ====================
async function saveToGitHub() {
    console.log('=== 开始saveToGitHub函数 ===');
    console.log('当前GIST_CONFIG:', {
        GIST_ID: GIST_CONFIG.GIST_ID ? GIST_CONFIG.GIST_ID.substring(0, 8) + '...' : '空',
        GITHUB_TOKEN: GIST_CONFIG.GITHUB_TOKEN ? GIST_CONFIG.GITHUB_TOKEN.substring(0, 8) + '...' : '空',
        configLoaded: GIST_CONFIG.configLoaded
    });
    
    if (!GIST_CONFIG.configLoaded) {
        console.log('配置未加载，开始调用loadGithubConfig...');
        const loaded = await loadGithubConfig();
        console.log('loadGithubConfig返回:', loaded);
        if (!loaded) {
            console.log('配置加载失败，显示错误提示');
            showSimpleToast('GitHub配置未完成，无法同步', 'error');
            return false;
        }
        console.log('配置加载成功，继续执行同步');
    } else {
        console.log('配置已加载，直接执行同步');
    }

    if (isSyncing) {
        showSimpleToast('正在同步中，请稍后重试', 'warning');
        return false;
    }

    if (!confirm('即将保存到云端：\n1. 文本数据会上传到云端\n2. 图片及图片相关文件会打包为ZIP下载\n\n是否继续？')) {
        return;
    }

    isSyncing = true;

    try {
        const textData = {
            sites: JSON.parse(JSON.stringify(sites)),
            changeLog: JSON.parse(JSON.stringify(changeLog)),
            lastSync: new Date().toISOString(),
            user: currentUser.name,
            syncVersion: '2.2',
            hasSeparateFiles: true,
            note: '此文件仅包含文本数据，图片和文件请使用ZIP包'
        };

        removeAllBase64Data(textData.sites);

        const hasFiles = checkIfHasFiles(sites);

        const response = await fetch(`https://api.github.com/gists/${GIST_CONFIG.GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GIST_CONFIG.GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                description: `工地装饰管理系统数据 - ${new Date().toLocaleString()}`,
                files: {
                    'construction_data.json': {
                        content: JSON.stringify(textData, null, 2)
                    }
                }
            })
        });

        if (response.ok) {
            showSimpleToast('文本数据已保存到云端');

            if (hasFiles) {
                setTimeout(() => {
                    if (confirm('检测到图片和文件数据，即将下载图片数据包（仅包含图片和文件夹结构）')) {
                        saveImagesZipOnly();
                    }
                }, 500);
            }

            return true;
        } else {
            const error = await response.text();
            console.error('GitHub同步失败:', error);
            showSimpleToast('云端保存失败', 'error');
            return false;
        }

    } catch (error) {
        console.error('GitHub同步异常:', error);
        showSimpleToast('保存失败: ' + error.message, 'error');
        return false;
    } finally {
        isSyncing = false;
    }
}

async function loadFromGitHub() {
    if (!GIST_CONFIG.configLoaded) {
        const loaded = await loadGithubConfig();
        if (!loaded) {
            showSimpleToast('GitHub配置未完成，无法同步', 'error');
            return false;
        }
    }
    
    if (!confirm('从云端加载数据将与现有数据合并。相同ID的工地将被覆盖，新工地将被添加。是否继续？')) {
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
            throw new Error('Gist 中没有找到数据文件');
        }
        
        const data = JSON.parse(fileContent);
        const cloudSites = data.sites || [];
        const cloudChangeLog = data.changeLog || [];
        
        let addedCount = 0;
        let updatedCount = 0;
        
        for (const cloudSite of cloudSites) {
            const existingIndex = sites.findIndex(s => s.id === cloudSite.id);
            
            if (existingIndex >= 0) {
                const existingSite = sites[existingIndex];
                
                ['name', 'startDate', 'endDate', 'progress', 'basicQuote', 'materialQuote', 
                 'equipmentQuote', 'furnitureQuote', 'otherQuote'].forEach(field => {
                    if (cloudSite[field] !== undefined) {
                        existingSite[field] = cloudSite[field];
                    }
                });
                
                ['todos', 'expenses', 'requirements', 'repairs', 'workers', 
                 'addRemoveItems', 'drawings', 'experiences'].forEach(arrayField => {
                    if (cloudSite[arrayField] && Array.isArray(cloudSite[arrayField])) {
                        if (!existingSite[arrayField]) {
                            existingSite[arrayField] = [];
                        }
                        
                        const existingIds = new Set(existingSite[arrayField].map(item => item.id));
                        cloudSite[arrayField].forEach(cloudItem => {
                            if (!existingIds.has(cloudItem.id)) {
                                existingSite[arrayField].push(cloudItem);
                            }
                        });
                    }
                });
                
                updatedCount++;
            } else {
                sites.push(cloudSite);
                addedCount++;
            }
        }
        
        const existingLogKeys = new Set(changeLog.map(log => `${log.timestamp}-${log.user}-${log.action}`));
        cloudChangeLog.forEach(log => {
            const logKey = `${log.timestamp}-${log.user}-${log.action}`;
            if (!existingLogKeys.has(logKey)) {
                changeLog.unshift(log);
                existingLogKeys.add(logKey);
            }
        });
        
        if (changeLog.length > 1000) {
            changeLog = changeLog.slice(0, 1000);
        }
        
        saveData();
        renderSiteList();
        
        showSimpleToast(`云端数据已合并 (新增: ${addedCount}, 更新: ${updatedCount})`);
        
        if (currentSiteId) {
            const site = sites.find(s => s.id === currentSiteId);
            if (site) loadSiteData(site);
        }
        
        return true;
        
    } catch (error) {
        console.error('从GitHub加载失败:', error);
        showSimpleToast('云端加载失败', 'error');
        return false;
    }
}

// ==================== 文件导出导入 ====================
async function saveToJsFile() {
    try {
        if (!currentUser) {
            alert('请先登录！');
            return;
        }

        if (!confirm('即将下载完整数据备份ZIP包，包含：\n1. 无base64图片的文本数据(shuju_light.js)\n2. 所有图片和文件\n\n是否继续？')) {
            return;
        }

        const textData = {
            sites: [],
            changeLog: changeLog,
            exportTime: new Date().toLocaleString('zh-CN'),
            exportedBy: currentUser.name,
            dataVersion: '2.2',
            note: '此文件仅包含文本数据，图片和文件请查看ZIP包中的shuju文件夹'
        };

        for (const site of sites) {
            const siteCopy = {
                id: site.id,
                name: site.name,
                startDate: site.startDate,
                endDate: site.endDate,
                progress: site.progress,
                todos: site.todos || [],
                expenses: site.expenses || [],
                requirements: site.requirements || [],
                repairs: [],
                workers: site.workers || [],
                addRemoveItems: site.addRemoveItems || [],
                drawings: [],
                experiences: site.experiences || [],
                basicQuote: site.basicQuote || 0,
                materialQuote: site.materialQuote || 0,
                equipmentQuote: site.equipmentQuote || 0,
                furnitureQuote: site.furnitureQuote || 0,
                otherQuote: site.otherQuote || 0,
                addRemoveTotal: site.addRemoveTotal || 0,
                totalQuote: site.totalQuote || 0,
                maxImageDimension: site.maxImageDimension || 800,
                dataVersion: '2.2'
            };

            if (site.repairs && site.repairs.length > 0) {
                for (let i = 0; i < site.repairs.length; i++) {
                    const repair = site.repairs[i];
                    const repairCopy = { ...repair };

                    if (repair.photo && repair.photo.startsWith('data:')) {
                        const extension = getExtensionFromMimeType(repair.photo.match(/^data:([^;]+);/)?.[1]) || 'jpg';
                        repairCopy.photo = `[PHOTO:${site.name || site.id}/repairs/repair_${i + 1}.${extension}]`;
                        repairCopy.hasPhoto = true;
                    }

                    siteCopy.repairs.push(repairCopy);
                }
            }

            if (site.drawings && site.drawings.length > 0) {
                for (let i = 0; i < site.drawings.length; i++) {
                    const drawing = site.drawings[i];
                    const drawingCopy = { ...drawing };

                    if (drawing.file && drawing.file.startsWith('data:')) {
                        const extension = getExtensionFromMimeType(drawing.fileType) ||
                            getExtensionFromFileName(drawing.fileName) ||
                            'bin';
                        drawingCopy.file = `[FILE:${site.name || site.id}/drawings/${drawing.fileName || `drawing_${i + 1}.${extension}`}]`;
                        drawingCopy.hasFile = true;
                    }

                    siteCopy.drawings.push(drawingCopy);
                }
            }

            textData.sites.push(siteCopy);
        }

        await generateAndDownloadZip(textData);
        addChangeLog('备份完整数据', '下载了包含图片和无base64文本数据的完整ZIP包');

    } catch (error) {
        console.error('保存失败:', error);
        alert('保存失败：' + error.message);
    }
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

function downloadJsonData() {
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    try {
        const data = {
            sites: JSON.parse(JSON.stringify(sites)),
            changeLog: JSON.parse(JSON.stringify(changeLog)),
            exportTime: new Date().toLocaleString('zh-CN'),
            exportedBy: currentUser.name,
            dataVersion: '2.0'
        };

        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `工地数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addChangeLog('下载JSON数据', '下载了JSON格式的数据文件');
        alert('JSON数据下载成功！');
    } catch (error) {
        console.error('下载JSON数据失败:', error);
        alert('下载失败：' + error.message);
    }
}

async function loadFromJsFile() {
    if (!currentUser) {
        alert('请先登录！');
        return;
    }

    if (!confirm('警告：从文件加载数据将完全覆盖当前所有数据！\n请确保已经备份当前数据。\n是否继续？')) {
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,.js,.json';
    input.onchange = async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const reader = new FileReader();

            reader.onload = async function (e) {
                try {
                    const content = e.target.result;

                    if (file.name.toLowerCase().endsWith('.zip')) {
                        await loadFromZipFile(file);
                        showSimpleToast('完整数据包加载成功，所有文件已恢复');
                    } else if (file.name.toLowerCase().endsWith('.json')) {
                        await loadFromJsonContent(content, file.name);
                        showSimpleToast('JSON数据加载成功，图片需要单独恢复', 'warning');
                    } else if (file.name.toLowerCase().endsWith('.js')) {
                        await loadFromJsContent(content);
                        showSimpleToast('JS数据加载成功，图片需要单独恢复', 'warning');
                    } else {
                        alert('请选择 ZIP、JS 或 JSON 文件！');
                        return;
                    }

                    saveData();
                    renderSiteList();
                    addChangeLog('加载数据', `从文件 ${file.name} 加载数据`);
                    alert(`数据加载成功！\n已加载 ${sites.length} 个工地数据。`);

                } catch (error) {
                    console.error('加载失败:', error);
                    alert('加载失败：' + error.message);
                }
            };

            if (file.name.toLowerCase().endsWith('.zip')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }

        } catch (error) {
            console.error('文件读取失败:', error);
            alert('文件读取失败：' + error.message);
        }
    };
    input.click();
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

async function loadImagesZipOnly() {
    if (!currentUser) {
        alert('请先登录！');
        return;
    }
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let message = '请选择图片ZIP包，系统将根据路径将图片加载到现有数据中。\n注意：此操作不会覆盖文本数据，只更新图片。';
    
    if (isMobile) {
        message += '\n\n⚠️ 移动端提示：\n1. 文件选择可能需要较长时间\n2. 请确保ZIP包大小合适\n3. 加载完成后会提示您';
    }
    
    if (!confirm(message)) {
        return;
    }
    
    const filePromise = new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.style.cssText = 'position: fixed; top: -100px; left: -100px; width: 1px; height: 1px;';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                resolve(file);
            } else {
                reject(new Error('未选择文件'));
            }
            if (input.parentNode) {
                document.body.removeChild(input);
            }
        };
        
        input.oncancel = () => {
            reject(new Error('用户取消了文件选择'));
            if (input.parentNode) {
                document.body.removeChild(input);
            }
        };
        
        document.body.appendChild(input);
        
        setTimeout(() => {
            try {
                input.click();
            } catch (error) {
                reject(error);
            }
        }, 100);
        
        setTimeout(() => {
            if (input.parentNode && !input.files?.length) {
                document.body.removeChild(input);
                reject(new Error('文件选择超时'));
            }
        }, 30000);
    });
    
    try {
        let loadingDiv = null;
        if (isMobile) {
            loadingDiv = document.createElement('div');
            loadingDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 20px 30px;
                border-radius: 12px;
                z-index: 999999;
                text-align: center;
                min-width: 250px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            `;
            loadingDiv.innerHTML = `
                <div style="margin-bottom: 15px; font-size: 16px; font-weight: bold;">正在处理文件...</div>
                <div style="font-size: 13px; margin-bottom: 15px; opacity: 0.9;">请稍候，这可能需要一些时间</div>
                <div style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); 
                     border-radius: 50%; border-top-color: white; 
                     animation: spin 1s linear infinite; margin: 0 auto;"></div>
            `;
            document.body.appendChild(loadingDiv);
        }
        
        const file = await filePromise;
        console.log('开始处理文件:', file.name, '大小:', formatFileSize(file.size));
        
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip 库未加载');
        }
        
        if (isMobile && loadingDiv) {
            loadingDiv.querySelector('div:nth-child(1)').textContent = '正在解压文件...';
        }
        
        const zip = await JSZip.loadAsync(file);
        console.log('ZIP文件加载成功，包含文件数:', Object.keys(zip.files).length);
        
        if (isMobile && loadingDiv) {
            loadingDiv.querySelector('div:nth-child(1)').textContent = '正在恢复图片...';
        }
        
        const result = await restoreImagesFromZip(zip);
        console.log('图片恢复完成:', result);
        
        saveData();
        renderSiteList();
        if (currentSiteId) {
            const site = sites.find(s => s.id === currentSiteId);
            if (site) loadSiteData(site);
        }
        
        let resultMessage = `图片加载完成！\n成功加载: ${result.restoredCount} 个文件`;
        if (result.failedCount > 0) {
            resultMessage += `\n失败: ${result.failedCount} 个文件`;
        }
        
        addChangeLog('加载图片包', '从ZIP包加载了图片到现有数据');
        
        if (isMobile && loadingDiv && loadingDiv.parentNode) {
            document.body.removeChild(loadingDiv);
        }
        
        setTimeout(() => {
            alert(resultMessage);
            showSimpleToast('图片数据包加载成功');
        }, 300);
        
    } catch (error) {
        console.error('加载图片ZIP失败:', error);
        
        const loadingDiv = document.querySelector('div[style*="position: fixed; top: 50%"]');
        if (loadingDiv && loadingDiv.parentNode) {
            document.body.removeChild(loadingDiv);
        }
        
        let errorMessage = '加载失败：' + error.message;
        if (error.message.includes('用户取消了文件选择')) {
            errorMessage = '文件选择已取消';
        } else if (error.message.includes('超时')) {
            errorMessage = '文件选择超时，请重试';
        } else if (error.message.includes('memory') || error.message.includes('太大')) {
            errorMessage = '文件太大，请选择小于50MB的文件';
        }
        
        alert(errorMessage);
    }
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

function checkIfHasFiles(sitesArray) {
    let hasFiles = false;
    if (!sitesArray) return false;

    sitesArray.forEach(site => {
        if (site.repairs && site.repairs.some(repair => repair.photo && repair.photo.startsWith('data:'))) {
            hasFiles = true;
        }
        if (site.drawings && site.drawings.some(drawing => drawing.file && drawing.file.startsWith('data:'))) {
            hasFiles = true;
        }
    });

    return hasFiles;
}

function resizeImage(file, maxDimension, callback) {
    if (!maxDimension) maxDimension = 500;

    const reader = new FileReader();
    
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const originalWidth = img.width;
            const originalHeight = img.height;
            const scaleRatio = maxDimension / Math.max(originalWidth, originalHeight);

            if (scaleRatio >= 1) {
                callback(e.target.result);
                return;
            }

            const newWidth = Math.round(originalWidth * scaleRatio);
            const newHeight = Math.round(originalHeight * scaleRatio);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = newWidth;
            canvas.height = newHeight;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, newWidth, newHeight);
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            let dataUrl;
            const mimeType = file.type || 'image/jpeg';

            if (mimeType === 'image/jpeg') {
                dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            } else if (mimeType === 'image/png') {
                dataUrl = canvas.toDataURL('image/png');
            } else if (mimeType === 'image/webp') {
                dataUrl = canvas.toDataURL('image/webp', 0.6);
            } else {
                dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            }

            callback(dataUrl);
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
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
window.saveToJsFile = saveToJsFile;
window.downloadJsonData = downloadJsonData;
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