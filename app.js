// ==================== 依赖声明 ====================
// 本文件依赖 base.js 中定义的公共函数和配置
// 请确保 base.js 在 app.js 之前加载
// ==================== 全局变量共享 ====================
// 确保全局变量在应用间共享
window.sites = window.sites || [];
window.changeLog = window.changeLog || [];
window.currentUser = window.currentUser || null;
window.currentSiteId = window.currentSiteId || null;

// ==================== 页面初始化 ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('页面加载完成，开始初始化...');
    
    // 初始化全局变量
    if (!window.sites) {
        window.sites = [];
    }
    
    // 先初始化权限系统（确保在 initTabs 之前）
    if (typeof initPermissionSystem === 'function') {
        initPermissionSystem();
    }
    
    // 等待权限系统初始化完成
    setTimeout(() => {
        // 初始化标签页
        if (typeof initTabs === 'function') {
            initTabs();
        }
    }, 100);
    
    // 设置移动端返回手势锁定
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setupBackGestureLock();
        updateTopButtonsLayout();
    }
    
    // 修改登录事件处理
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // 检查是否是本地测试账户
        const isTestUser = username === '1' && password === '1234';
        
        let user = null;
        
        // 优先从当前可用的用户列表中查找
        if (window.builtInUsers && Array.isArray(window.builtInUsers)) {
            user = window.builtInUsers.find(u => u.username === username && u.password === password);
        }
        
        // 如果没有找到，尝试检查是否是本地测试账户
        if (!user && isTestUser) {
            user = {
                username: '1',
                password: '1234',
                name: '测试',
                isLocal: true
            };
            
           // 如果是测试用户登录，尝试加载云端配置
console.log('测试用户登录，自动加载云端配置...');
try {
    await window.loadCloudUserData();
    
    // 重新查找用户
    user = window.builtInUsers.find(u => u.username === username && u.password === password);
    
    if (user && !user.isLocal) {
        console.log('云端账户加载成功，使用云端账户登录:', user.name);
    } else {
        // 保持测试用户登录
        console.log('保持测试用户登录');
    }
} catch (error) {
    console.warn('测试用户无法连接云端:', error);
    showSimpleToast('无法连接到云端配置，请检查网络连接', 'warning');
}
        }
        
        if (user) {
        currentUser = user;
        document.getElementById('currentUser').textContent = `当前用户：${user.name}${user.isLocal ? ' (本地测试)' : ''}`;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainContainer').classList.remove('hidden');
        
        localStorage.setItem('lastUser', JSON.stringify({
            username: user.username,
            password: user.password,
            name: user.name,
            loginTime: new Date().toISOString(),
            isLocal: user.isLocal || false
        }));
            
            // 在这里添加：
            updateTopButtonsByPermission();  // 更新顶部按钮权限
            
            // 加载并应用权限
            if (typeof loadPermissionConfig === 'function') {
                loadPermissionConfig();
            }
            
            if (typeof applyUserPermissions === 'function') {
                applyUserPermissions();
            }
            
            autoLoadData();
            renderSiteList();
            addChangeLog('登录系统', '用户登录成功');
            // 在 app.js 的登录事件处理中，登录成功后添加：
            if (user) {
                currentUser = user;
                document.getElementById('currentUser').textContent = `当前用户：${user.name}${user.isLocal ? ' (本地测试)' : ''}`;
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('mainContainer').classList.remove('hidden');
                
                localStorage.setItem('lastUser', JSON.stringify({
                    username: user.username,
                    password: user.password,
                    name: user.name,
                    loginTime: new Date().toISOString(),
                    isLocal: user.isLocal || false
                }));
                
                // 应用用户权限
                if (typeof applyUserPermissions === 'function') {
                    applyUserPermissions();
                }
                
                // 更新顶部按钮权限（这个函数会检查并显示/隐藏权限按钮）
                updateTopButtonsByPermission();
                
                // 加载并应用权限
                if (typeof loadPermissionConfig === 'function') {
                    loadPermissionConfig();
                }
                
                autoLoadData();
                renderSiteList();
                addChangeLog('登录系统', '用户登录成功');
                
                
                // 移动端欢迎提示
                if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                    setTimeout(() => {
                        showSimpleToast(`欢迎回来，${user.name}！`);
                    }, 500);
                }
                
            } else {
                // 登录失败处理
            }
            
           
            
           
        } else {
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = '用户名或密码错误！';
            errorDiv.style.display = 'block';
            
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && navigator.vibrate) {
                navigator.vibrate(200);
            }
        }
    });
    
    // 自动填充上次登录用户
    const lastUser = localStorage.getItem('lastUser');
    if (lastUser) {
        try {
            const userData = JSON.parse(lastUser);
            if (userData.username !== '1') {
                document.getElementById('username').value = userData.username;
            }
        } catch (e) {
            console.log('自动登录信息无效');
        }
    }
});
function testAdminPermissions() {
    console.log('=== 管理员权限测试 ===');
    console.log('当前用户:', currentUser);
    console.log('isAdmin():', isAdmin ? isAdmin() : '函数未定义');
    console.log('canShowPermissionManager():', canShowPermissionManager ? canShowPermissionManager() : '函数未定义');
    console.log('canShowChangeLog():', canShowChangeLog ? canShowChangeLog() : '函数未定义');
    console.log('canClearLog():', canClearLog ? canClearLog() : '函数未定义');
    console.log('hasPermission:', typeof hasPermission);
    
    // 强制显示按钮用于测试
    const permissionBtn = document.querySelector('.permission-manager-btn');
    const changeLogBtn = document.querySelector('.change-log-btn');
    
    if (permissionBtn) {
        console.log('权限管理按钮:', permissionBtn.style.display);
        permissionBtn.style.display = '';
    }
    
    if (changeLogBtn) {
        console.log('更改日志按钮:', changeLogBtn.style.display);
        changeLogBtn.style.display = '';
    }
}
function updateTopButtonsLayout() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        const topButtons = document.querySelectorAll('.top-btn');
        topButtons.forEach(btn => {
            const text = btn.textContent.trim();
            if (text === '保存云端') btn.textContent = '云端保存';
            if (text === '加载云端') btn.textContent = '云端加载';
            if (text === '配置管理') btn.textContent = '配置';
            if (text === '更改日志') btn.textContent = '日志';
        });
    }
}
function debugPermissionButtons() {
    console.log('=== 权限按钮调试信息 ===');
    console.log('当前用户:', currentUser);
    console.log('canShowPermissionManager:', typeof canShowPermissionManager, canShowPermissionManager ? canShowPermissionManager() : '函数未定义');
    console.log('canShowChangeLog:', typeof canShowChangeLog, canShowChangeLog ? canShowChangeLog() : '函数未定义');
    console.log('isAdmin:', typeof isAdmin, isAdmin ? isAdmin() : '函数未定义');
    
    const permissionBtn = document.querySelector('.permission-manager-btn');
    const changeLogBtn = document.querySelector('.change-log-btn');
    
    console.log('权限按钮元素:', {
        permissionBtn: permissionBtn,
        changeLogBtn: changeLogBtn,
        permissionBtnDisplay: permissionBtn ? permissionBtn.style.display : '未找到',
        changeLogBtnDisplay: changeLogBtn ? changeLogBtn.style.display : '未找到'
    });
}
function initTabs() {
    const tabsContainer = document.getElementById('siteTabs');
    if (!tabsContainer) {
        console.error('找不到 siteTabs 容器');
        return;
    }
    
    // 确保权限配置已加载
    if (!window.PERMISSION_CONFIG) {
        console.warn('权限配置未加载，延迟初始化标签页');
        setTimeout(initTabs, 100);
        return;
    }
    
    // 获取允许的标签页
    let allowedTabs = [];
    
    if (currentUser) {
        if (typeof getAllowedTabs === 'function') {
            allowedTabs = getAllowedTabs();
        } else {
            // 如果 getAllowedTabs 不存在，使用默认权限
            allowedTabs = window.PERMISSION_CONFIG.availableTabs || [];
        }
    } else {
        // 未登录时显示所有标签页
        allowedTabs = window.PERMISSION_CONFIG.availableTabs || [];
    }
    
    console.log('初始化标签页，用户:', currentUser?.username, '允许的标签:', allowedTabs);
    
    // 如果没有允许的标签页，显示一条消息
    if (allowedTabs.length === 0) {
        tabsContainer.innerHTML = '<p style="color: #999; padding: 10px;">没有可用的标签页</p>';
        return;
    }
    
    tabsContainer.innerHTML = '';

    allowedTabs.forEach((tab, index) => {
        const tabElement = document.createElement('div');
        tabElement.className = `tab ${index === 0 ? 'active' : ''}`;
        tabElement.textContent = tab.name;
        tabElement.setAttribute('data-tab', tab.id);
        tabElement.onclick = (e) => {
            e.stopPropagation();
            console.log('切换标签页:', tab.id);
            switchTab(tab.id);
        };
        tabsContainer.appendChild(tabElement);
    });

    // 显示第一个标签页的内容
    const firstTabContent = document.getElementById(allowedTabs[0]?.id);
    if (firstTabContent) {
        firstTabContent.classList.add('active');
    }
}

function switchTab(tabId) {
    console.log('切换到标签页:', tabId);
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        console.log('已激活标签内容:', tabId);
    } else {
        console.error('找不到标签内容:', tabId);
    }

    const targetTabButton = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (targetTabButton) {
        targetTabButton.classList.add('active');
        targetTabButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
}

// ==================== 工地列表相关函数 ====================
function renderSiteList() {
    const siteList = document.getElementById('siteList');
    siteList.innerHTML = '';

    if (sites.length === 0) {
        siteList.innerHTML = '<p class="loading">暂无工地数据，请添加工地</p>';
        return;
    }

    // 过滤可访问的工地
    const accessibleSites = sites.filter(site => {
        return canViewSite ? canViewSite(site.id) : true;
    });

    if (accessibleSites.length === 0) {
        siteList.innerHTML = '<p class="loading">您没有可访问的工地</p>';
        return;
    }

    accessibleSites.forEach(site => {
        const progress = site.progress || 0;
        const daysLeft = calculateDaysLeft(site.endDate);
        const status = getSiteStatus(progress, daysLeft);

        const deleteBtnHtml = canDelete() ?
            `<button class="site-delete-btn" onclick="event.stopPropagation(); deleteSite('${site.id}')" title="删除工地">×</button>` :
            '';

        const siteCard = document.createElement('div');
        siteCard.className = 'site-card';
        siteCard.innerHTML = `
            <div class="site-card-header">
                <div class="site-name">${site.name || '未命名工地'}</div>
                <div class="site-card-actions">
                    <div class="site-status status-${status.class}">${status.text}</div>
                    ${deleteBtnHtml}
                </div>
            </div>
            <div class="site-info">
                <div>开工：${formatDate(site.startDate) || '未设置'}</div>
                <div>计划完工：${formatDate(site.endDate) || '未设置'}</div>
                <div>进度：${progress}%</div>
                <div>剩余：${daysLeft > 0 ? daysLeft + '天' : '已逾期'}</div>
            </div>
            <div class="progress-bar" style="margin-top: 10px; height: 16px;">
                <div class="progress-fill" style="width: ${progress}%; font-size: 10px; line-height: 16px;">${progress}%</div>
            </div>
        `;
siteCard.onclick = (e) => {
    e.stopPropagation();
    console.log('=== 工地卡片点击事件 ===');
    console.log('工地ID:', site.id);
    console.log('工地名称:', site.name);
    console.log('所有工地:', sites.map(s => ({id: s.id, name: s.name})));
    console.log('当前用户:', currentUser);
    console.log('canViewSite函数:', typeof canViewSite);
    
    // 检查工地是否存在
    const foundSite = sites.find(s => s.id === site.id);
    if (!foundSite) {
        console.error('错误：工地不存在于sites数组中');
        alert('工地数据异常，请刷新页面重试');
        return;
    }
    
    // 检查权限
    if (typeof canViewSite === 'function' && !canViewSite(site.id)) {
        alert('您没有权限查看此工地');
        return;
    }
    
    // 检查模态框元素
    const siteModal = document.getElementById('siteModal');
    if (!siteModal) {
        console.error('错误：siteModal元素不存在');
        alert('页面加载异常，请刷新页面');
        return;
    }
    
    // 显示工地详情
    showSiteDetails(site.id);
};
        // 修复：确保正确绑定点击事件
        siteCard.onclick = (e) => {
            e.stopPropagation();
            console.log('点击工地卡片，ID:', site.id, '名称:', site.name);
            
            // 检查工地是否存在
            const foundSite = sites.find(s => s.id === site.id);
            if (!foundSite) {
                console.error('工地不存在，ID:', site.id);
                alert('工地不存在！');
                return;
            }
            
            if (canViewSite && !canViewSite(site.id)) {
                alert('您没有权限查看此工地');
                return;
            }
            
            showSiteDetails(site.id);
        };
        siteList.appendChild(siteCard);
    });
}

function showAddSiteModal() {
    currentSiteId = null;
    document.getElementById('modalTitle').textContent = '添加工地';
    document.getElementById('siteModal').style.display = 'block';

    clearSiteForm();
    switchTab('progressTab');
    clearAllLists();
}

function clearAllLists() {
    const site = { 
        todos: [], expenses: [], requirements: [], repairs: [], 
        workers: [], addRemoveItems: [], drawings: [], experiences: [] 
    };
    
    renderTodoList(site);
    renderExpenseList(site);
    renderRequirementList(site);
    renderRepairList(site);
    renderWorkerList(site);
    renderAddRemoveList(site);
    renderDrawingList(site);
    renderExperienceList(site);
    
    updateQuoteSummary(site);
    updateAddRemoveSummary(site);
}
function showSiteDetails(siteId) {
    console.log('显示工地详情，ID:', siteId);
    
    // 设置当前工地ID到全局变量
    window.currentSiteId = siteId;
    currentSiteId = siteId;
    
    // 先确保模态框元素存在
    const siteModal = document.getElementById('siteModal');
    if (!siteModal) {
        console.error('siteModal 元素不存在');
        alert('页面元素加载异常，请刷新页面重试');
        return;
    }
    
    const site = sites.find(s => s.id === siteId);

    if (!site) {
        console.error('工地不存在，ID:', siteId, '所有工地ID:', sites.map(s => s.id));
        alert('工地不存在！');
        return;
    }

    // 检查元素是否存在
    const modalTitle = document.getElementById('modalTitle');
    if (!modalTitle) {
        console.error('modalTitle 元素不存在');
        // 尝试通过其他方式查找
        const modalHeader = siteModal.querySelector('.modal-header h3');
        if (modalHeader) {
            modalHeader.textContent = `工地详情 - ${site.name}`;
        } else {
            alert('页面元素加载异常，请刷新页面重试');
            return;
        }
    } else {
        modalTitle.textContent = `工地详情 - ${site.name}`;
    }
    
    // 显示模态框
    siteModal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // 加载工地数据
    loadSiteData(site);
    switchTab('progressTab');
    
    // 移动端优化
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        setTimeout(() => {
            optimizeMobileTables();
        }, 100);
    }
    
    console.log('工地详情已显示:', site.name);
}
function clearSiteForm() {
    document.getElementById('siteName').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('progress').value = '0';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressFill').textContent = '0%';

    document.getElementById('todoItem').value = '';
    document.getElementById('todoNote').value = '';
}

function loadSiteData(site) {
    document.getElementById('siteName').value = site.name || '';
    document.getElementById('startDate').value = formatDate(site.startDate) || '';
    document.getElementById('endDate').value = formatDate(site.endDate) || '';
    document.getElementById('progress').value = site.progress || 0;
    updateProgressBar(site.progress || 0);

    document.getElementById('basicQuote').value = site.basicQuote || 0;
    document.getElementById('materialQuote').value = site.materialQuote || 0;
    document.getElementById('equipmentQuote').value = site.equipmentQuote || 0;
    document.getElementById('furnitureQuote').value = site.furnitureQuote || 0;
    document.getElementById('otherQuote').value = site.otherQuote || 0;

    renderTodoList(site);
    renderExpenseList(site);
    renderRequirementList(site);
    renderRepairList(site);
    renderWorkerList(site);
    renderAddRemoveList(site);
    renderDrawingList(site);
    renderExperienceList(site);

    updateQuoteSummary(site);
    updateAddRemoveSummary(site);
}

function updateProgressValue(value) {
    document.getElementById('progressValue').textContent = value;
    updateProgressBar(value);
}

function updateProgressBar(progress) {
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = progress + '%';
    progressFill.textContent = progress + '%';
}

// ==================== 工地管理函数 ====================
function saveSiteInfo() {
    if (!currentSiteId) {
        const newSite = {
            id: generateId(),
            name: document.getElementById('siteName').value || '未命名工地',
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            progress: parseInt(document.getElementById('progress').value) || 0,
            todos: [],
            expenses: [],
            requirements: [],
            repairs: [],
            workers: [],
            addRemoveItems: [],
            drawings: [],
            experiences: [],
            basicQuote: 0,
            materialQuote: 0,
            equipmentQuote: 0,
            furnitureQuote: 0,
            otherQuote: 0,
            addRemoveTotal: 0,
            totalQuote: 0,
            maxImageDimension: 800,
            dataVersion: '2.0'
        };

        sites.push(newSite);
        currentSiteId = newSite.id;
        addChangeLog('创建工地', `创建了工地：${newSite.name}`);
    } else {
        const site = sites.find(s => s.id === currentSiteId);
        if (site) {
            const oldProgress = site.progress;
            site.name = document.getElementById('siteName').value || site.name;
            site.startDate = document.getElementById('startDate').value;
            site.endDate = document.getElementById('endDate').value;
            site.progress = parseInt(document.getElementById('progress').value) || 0;

            if (!site.maxImageDimension) {
                site.maxImageDimension = 800;
            }

            if (oldProgress !== site.progress) {
                addChangeLog('更新进度', `工地"${site.name}"进度从${oldProgress}%更新到${site.progress}%`);
            }
        }
    }

    saveData();
    renderSiteList();
    alert('工地信息保存成功！');
}

function deleteSite(siteId) {
    if (!canDelete()) {
        alert('只有管理员可以删除工地！');
        return;
    }

    if (!confirm('确定要删除这个工地吗？此操作将删除该工地的所有相关数据（支出、工人、维修项等），且不可恢复！')) {
        return;
    }

    const siteIndex = sites.findIndex(s => s.id === siteId);
    if (siteIndex === -1) {
        alert('工地不存在！');
        return;
    }

    const siteName = sites[siteIndex].name;

    sites.splice(siteIndex, 1);
    saveData();

    if (currentSiteId === siteId) {
        closeSiteModal();
        currentSiteId = null;
    }

    renderSiteList();
    addChangeLog('删除工地', `删除了工地："${siteName}"`);
    alert('工地删除成功！');
}

// ==================== 各模块添加函数 ====================
function addTodo() {
    if (!currentSiteId) {
        alert('请先保存工地基本信息！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const item = document.getElementById('todoItem').value;
    const note = document.getElementById('todoNote').value;

    if (!item) {
        alert('请填写事项名称！');
        return;
    }

    const todo = {
        id: generateId(),
        item: item,
        operator: currentUser.name,
        status: 'pending',
        time: new Date().toISOString().split('T')[0],
        note: note
    };

    if (!site.todos) site.todos = [];
    site.todos.push(todo);
    saveData();

    document.getElementById('todoItem').value = '';
    document.getElementById('todoNote').value = '';

    renderTodoList(site);
    addChangeLog('添加待办事项', `添加了待办事项：${item}`);
    alert('待办事项添加成功！');
}

function addExpense() {
    if (!currentSiteId) {
        alert('请先保存工地基本信息！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const item = document.getElementById('expenseItem').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value) || 0;
    const unit = '项';
    const note = document.getElementById('expenseNote').value;

    if (!item || amount <= 0) {
        alert('请填写完整的支出信息！');
        return;
    }

    const expense = {
        id: generateId(),
        item: item,
        amount: amount,
        unit: unit,
        note: note,
        time: new Date().toISOString().split('T')[0],
        operator: currentUser.name
    };

    site.expenses.push(expense);
    saveData();

    document.getElementById('expenseItem').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseNote').value = '';

    renderExpenseList(site);
    addChangeLog('添加支出', `添加了支出项：${item}，金额：¥${amount}`);
    alert('支出添加成功！');
}

function addRequirement() {
    if (!currentSiteId) {
        alert('请先保存工地基本信息！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const content = document.getElementById('requirementContent').value;
    const type = document.getElementById('requirementType').value;
    const note = document.getElementById('requirementNote').value;

    if (!content) {
        alert('请填写要求内容！');
        return;
    }

    const requirement = {
        id: generateId(),
        content: content,
        type: type,
        note: note,
        status: 'pending',
        time: new Date().toISOString().split('T')[0],
        operator: currentUser.name
    };

    if (!site.requirements) site.requirements = [];
    site.requirements.push(requirement);
    saveData();

    document.getElementById('requirementContent').value = '';
    document.getElementById('requirementNote').value = '';
    document.getElementById('requirementType').value = 'need';

    renderRequirementList(site);
    addChangeLog('添加客户要求', `添加了客户要求：${content.substring(0, 12)}...（类型：${type === 'need' ? '需要' : '排除'}）`);
    alert('客户要求添加成功！');
}
function addRepair() {
    if (!currentSiteId) {
        alert('请先保存工地基本信息！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const content = document.getElementById('repairContent').value;
    const note = document.getElementById('repairNote').value;
    const preview = document.getElementById('repairPhotoPreview');
    const photoData = preview.dataset.originalData;

    if (!content) {
        alert('请填写维修内容！');
        return;
    }

    const repair = {
        id: generateId(),
        content: content,
        note: note,
        photo: photoData || '',
        photoName: preview.dataset.fileName || '',
        status: 'pending',
        time: new Date().toISOString().split('T')[0],
        operator: currentUser.name
    };

    if (!site.repairs) site.repairs = [];
    site.repairs.push(repair);
    saveData();

    // 清空表单
    document.getElementById('repairContent').value = '';
    document.getElementById('repairNote').value = '';
    document.getElementById('repairPhoto').value = '';
    document.getElementById('repairPhotoPreview').innerHTML = '';
    delete preview.dataset.originalData;
    delete preview.dataset.fileName;

    renderRepairList(site);
    addChangeLog('添加维修项', `添加了维修项：${content.substring(0, 20)}...`);
    alert('维修项添加成功！');
}
function previewDrawing(event) {
    const file = event.target.files[0];
    if (!file) return;

    const preview = document.getElementById('drawingPreview');
    
    // 修复：先清空预览
    preview.innerHTML = '<div style="text-align: center; padding: 10px; color: #666;">正在处理文件...</div>';
    
    if (file.type.startsWith('image/')) {
        // 使用 base.js 中的 compressImageToSize 函数
        if (typeof compressImageToSize === 'function') {
            compressImageToSize(file, 500)
                .then((compressedDataUrl) => {
                    preview.innerHTML = `
                        <div style="text-align: center; padding: 10px;">
                            <img src="${compressedDataUrl}" class="image-preview" onclick="viewImage('${compressedDataUrl}')" style="max-width: 200px; max-height: 150px;">
                            <div style="margin-top: 5px; font-size: 12px; color: #666;">
                                ${file.name}<br>
                                <small>已压缩</small>
                            </div>
                        </div>
                    `;
                    preview.dataset.originalData = compressedDataUrl;
                    preview.dataset.fileName = file.name;
                    preview.dataset.fileType = file.type;
                    preview.dataset.fileSize = file.size;
                    
                    console.log('图片压缩完成，数据已准备');
                })
                .catch((error) => {
                    console.error('图片压缩失败:', error);
                    alert('图片处理失败，请重试');
                    preview.innerHTML = '';
                    event.target.value = '';
                });
        } else {
            // 备用方案：使用 FileReader
            const reader = new FileReader();
            reader.onload = function (e) {
                const dataUrl = e.target.result;
                preview.innerHTML = `
                    <div style="text-align: center; padding: 10px;">
                        <img src="${dataUrl}" class="image-preview" onclick="viewImage('${dataUrl}')" style="max-width: 200px; max-height: 150px;">
                        <div style="margin-top: 5px; font-size: 12px; color: #666;">
                            ${file.name}<br>
                            <small>原始文件</small>
                        </div>
                    </div>
                `;
                preview.dataset.originalData = dataUrl;
                preview.dataset.fileName = file.name;
                preview.dataset.fileType = file.type;
                preview.dataset.fileSize = file.size;
            };
            reader.readAsDataURL(file);
        }
    } else {
        // 非图片文件
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
                    <div style="word-break: break-all; font-size: 12px;">${file.name}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                        ${(file.size / 1024).toFixed(1)} KB
                    </div>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}
function addWorker() {
    if (!currentSiteId) {
        alert('请先保存工地基本信息！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const name = document.getElementById('workerName').value;
    const type = document.getElementById('workerType').value;
    const startTime = document.getElementById('workerStartTime').value;
    const endTime = document.getElementById('workerEndTime').value;
    const note = document.getElementById('workerNote').value;

    if (!name || !type || !startTime) {
        alert('请填写完整的工人信息！');
        return;
    }

    const worker = {
        id: generateId(),
        name: name,
        type: type,
        startTime: startTime,
        endTime: endTime,
        note: note,
        rating: 1,
        time: new Date().toISOString().split('T')[0],
        operator: currentUser.name
    };

    site.workers.push(worker);
    saveData();

    document.getElementById('workerName').value = '';
    document.getElementById('workerType').value = '';
    document.getElementById('workerStartTime').value = '';
    document.getElementById('workerEndTime').value = '';
    document.getElementById('workerNote').value = '';

    renderWorkerList(site);
    addChangeLog('添加工人', `添加了工人：${name}（${type}）`);
    alert('工人添加成功！');
}

function addAddRemoveItem() {
    if (!currentSiteId) {
        alert('请先保存工地基本信息！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const item = document.getElementById('addRemoveItem').value;
    const type = document.getElementById('addRemoveType').value;
    const amount = parseFloat(document.getElementById('addRemoveAmount').value) || 0;
    const unit = '项';
    const note = document.getElementById('addRemoveNote').value;

    if (!item || amount <= 0) {
        alert('请填写完整的增减项信息！');
        return;
    }

    const addRemoveItem = {
        id: generateId(),
        item: item,
        type: type,
        amount: amount,
        unit: unit,
        note: note,
        time: new Date().toISOString().split('T')[0],
        operator: currentUser.name
    };

    site.addRemoveItems.push(addRemoveItem);
    saveData();

    document.getElementById('addRemoveItem').value = '';
    document.getElementById('addRemoveAmount').value = '';
    document.getElementById('addRemoveNote').value = '';

    renderAddRemoveList(site);
    updateAddRemoveSummary(site);
    updateQuoteSummary(site);
    addChangeLog('添加增减项', `添加了${type === 'add' ? '增加' : '减少'}项：${item}，金额：¥${amount}`);
    alert('增减项添加成功！');
}
function uploadDrawing() {
    if (!currentSiteId) {
        alert('请先保存工地基本信息！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const type = document.getElementById('drawingType').value;
    const note = document.getElementById('drawingNote').value;
    const preview = document.getElementById('drawingPreview');

    // 修复：确保获取到正确的文件数据
    const fileData = preview.dataset.originalData;
    const fileName = preview.dataset.fileName;

    if (!fileData) {
        alert('请上传图纸文件！');
        return;
    }

    const drawing = {
        id: generateId(),
        type: type,
        note: note,
        file: fileData,
        fileName: fileName || '未命名文件',
        fileType: preview.dataset.fileType || 'application/octet-stream',
        fileSize: preview.dataset.fileSize || 0,
        time: new Date().toISOString().split('T')[0],
        operator: currentUser.name,
        siteName: site.name
    };

    if (!site.drawings) site.drawings = [];
    site.drawings.push(drawing);
    saveData();

    // 修复：清空预览和表单
    document.getElementById('drawingFile').value = '';
    document.getElementById('drawingPreview').innerHTML = '';
    
    // 清除所有数据集属性
    const previewElement = document.getElementById('drawingPreview');
    delete previewElement.dataset.originalData;
    delete previewElement.dataset.fileName;
    delete previewElement.dataset.fileType;
    delete previewElement.dataset.fileSize;
    
    document.getElementById('drawingNote').value = '';

    renderDrawingList(site);
    addChangeLog('上传图纸', `上传了${getDrawingTypeText(type)}图纸：${fileName || '未命名文件'}`);
    
    // 修复：添加成功提示
    setTimeout(() => {
        showSimpleToast('图纸上传成功！', 'success');
    }, 100);
}

function addExperience() {
    if (!currentSiteId) {
        alert('请先保存工地基本信息！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const content = document.getElementById('experienceContent').value;

    if (!content) {
        alert('请填写经验总结内容！');
        return;
    }

    const experience = {
        id: generateId(),
        content: content,
        time: new Date().toISOString().split('T')[0],
        operator: currentUser.name
    };

    if (!site.experiences) site.experiences = [];
    site.experiences.push(experience);
    saveData();

    document.getElementById('experienceContent').value = '';

    renderExperienceList(site);
    addChangeLog('添加经验总结', `添加了经验总结`);
    alert('经验总结添加成功！');
}

// ==================== 状态更新函数 ====================
function updateTodoStatus(todoId, newStatus) {
    if (!canEditStatus()) {
        alert('只有管理员可以更改状态！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const todo = site.todos.find(t => t.id === todoId);
    if (todo) {
        const oldStatus = todo.status;
        todo.status = newStatus;
        saveData();
        renderTodoList(site);
        addChangeLog('更新待办状态', `将待办事项"${todo.item}"从${oldStatus}改为${newStatus}`);
    }
}

function updateRequirementStatus(reqId, newStatus) {
    if (!canEditStatus()) {
        alert('只有管理员可以更改状态！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const req = site.requirements.find(r => r.id === reqId);
    if (req) {
        const oldStatus = req.status;
        req.status = newStatus;
        saveData();
        renderRequirementList(site);
        const typeText = req.type === 'need' ? '需要' : '排除';
        addChangeLog('更新客户要求状态', `将客户要求"${req.content}"（${typeText}）从${oldStatus}改为${newStatus}`);
    }
}

function completeRepair(repairId) {
    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const repair = site.repairs.find(r => r.id === repairId);
    if (repair) {
        repair.status = 'completed';
        saveData();
        renderRepairList(site);
        addChangeLog('完成维修', `完成了维修项：${repair.content.substring(0, 20)}...`);
        alert('维修项已标记为完成！');
    }
}

function updateRepairStatus(repairId, newStatus) {
    if (!canEditStatus()) {
        alert('只有管理员可以更改状态！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const repair = site.repairs.find(r => r.id === repairId);
    if (repair) {
        const oldStatus = repair.status;
        repair.status = newStatus;
        saveData();
        renderRepairList(site);
        addChangeLog('更新维修状态', `将维修项"${repair.content}"从${oldStatus}改为${newStatus}`);
    }
}

function updateWorkerRating(workerId, rating) {
    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const worker = site.workers.find(w => w.id === workerId);
    if (worker) {
        worker.rating = rating;
        saveData();
        renderWorkerList(site);
        addChangeLog('更新工人评价', `更新了工人"${worker.name}"的评价为${rating}星`);
    }
}

function editWorkerTime(workerId, cell, type) {
    const display = cell.querySelector('.date-display');
    const input = cell.querySelector('.date-edit');

    display.style.display = 'none';
    input.style.display = 'inline-block';
    input.focus();
}

function saveWorkerTime(workerId, newTime, type) {
    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const worker = site.workers.find(w => w.id === workerId);
    if (worker) {
        if (type === 'startTime') {
            worker.startTime = newTime;
            addChangeLog('编辑工人开始时间', `修改了工人"${worker.name}"的开始时间为：${newTime}`);
        } else if (type === 'endTime') {
            worker.endTime = newTime;
            addChangeLog('编辑工人结束时间', `修改了工人"${worker.name}"的结束时间为：${newTime}`);
        }
        saveData();
        renderWorkerList(site);
    }
}

function changeRepairPhoto(repairId, button) {
    const fileInput = button.parentElement.querySelector('.repair-photo-input');
    fileInput.click();
}
function uploadNewRepairPhoto(repairId, fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
    }

    // 使用宽度不超过500像素的压缩
    resizeImage(file, 500, function(resizedDataUrl) {
        const site = sites.find(s => s.id === currentSiteId);
        if (!site) return;

        const repair = site.repairs.find(r => r.id === repairId);
        if (repair) {
            const oldPhotoInfo = repair.photo ? '有图片' : '无图片';

            repair.photo = resizedDataUrl;
            repair.photoName = file.name;

            saveData();
            renderRepairList(site);
            addChangeLog('更换维修图片', `更换了维修项"${repair.content}"的图片（旧：${oldPhotoInfo}）`);
            alert('维修图片更换成功！');
        }
    });
}

function changeDrawingFile(drawingId, button) {
    const fileInput = button.parentElement.querySelector('.drawing-file-input');
    fileInput.click();
}

function uploadNewDrawingFile(drawingId, fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    console.log('开始上传文件:', file.name, '类型:', file.type, '大小:', file.size);

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) {
        console.error('未找到当前工地');
        return;
    }

    const drawing = site.drawings.find(d => d.id === drawingId);
    if (!drawing) {
        console.error('未找到图纸');
        return;
    }

    const oldFileName = drawing.fileName || '未命名';

    if (file.type.startsWith('image/')) {
    console.log('处理图片文件');
    // 使用宽度不超过500像素的压缩
    resizeImage(file, 500, function(resizedDataUrl) {
        console.log('图片压缩完成，开始更新图纸数据');
        
        drawing.file = resizedDataUrl;
        drawing.fileName = file.name;
        drawing.fileType = file.type;
        drawing.fileSize = file.size;

        saveData();
        renderDrawingList(site);
        addChangeLog('更换图纸文件', `更换了${getDrawingTypeText(drawing.type)}图纸：${oldFileName} → ${file.name}`);
        console.log('图纸文件更换成功！');
        alert('图纸文件更换成功！');
    });

    } else {
        console.log('处理非图片文件');
        const reader = new FileReader();

        reader.onload = function (e) {
            console.log('文件读取完成');
            drawing.file = e.target.result;
            drawing.fileName = file.name;
            drawing.fileType = file.type;
            drawing.fileSize = file.size;

            saveData();
            renderDrawingList(site);
            addChangeLog('更换图纸文件', `更换了${getDrawingTypeText(drawing.type)}图纸：${oldFileName} → ${file.name}`);
            console.log('图纸文件更换成功！');
            alert('图纸文件更换成功！');
        };

        reader.onerror = function (e) {
            console.error('文件读取失败:', e);
            alert('文件读取失败，请重试');
        };

        reader.readAsDataURL(file);
    }
}

// ==================== 报价管理函数 ====================
function saveQuote() {
    if (!currentSiteId) {
        alert('请先保存工地基本信息！');
        return;
    }

    if (!canEditQuote()) {
        alert('只有管理员可以填写报价！');
        return;
    }

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const basicQuote = parseFloat(document.getElementById('basicQuote').value) || 0;
    const materialQuote = parseFloat(document.getElementById('materialQuote').value) || 0;
    const equipmentQuote = parseFloat(document.getElementById('equipmentQuote').value) || 0;
    const furnitureQuote = parseFloat(document.getElementById('furnitureQuote').value) || 0;
    const otherQuote = parseFloat(document.getElementById('otherQuote').value) || 0;
    const addRemoveTotal = parseFloat(document.getElementById('addRemoveTotalQuote').value) || 0;

    site.basicQuote = basicQuote;
    site.materialQuote = materialQuote;
    site.equipmentQuote = equipmentQuote;
    site.furnitureQuote = furnitureQuote;
    site.otherQuote = otherQuote;
    site.addRemoveTotal = addRemoveTotal;

    site.totalQuote = basicQuote + materialQuote + equipmentQuote + furnitureQuote + otherQuote + addRemoveTotal;

    saveData();
    updateQuoteSummary(site);
    addChangeLog('更新报价', `更新了工地"${site.name}"的报价信息`);
    alert('报价保存成功！');
}

function updateQuoteSummary(site) {
    if (!site) return;

    const addRemoveTotal = site.addRemoveItems?.reduce((sum, item) => {
        return sum + (item.type === 'add' ? item.amount : -item.amount);
    }, 0) || 0;

    site.addRemoveTotal = addRemoveTotal;

    const basicQuote = site.basicQuote || 0;
    const materialQuote = site.materialQuote || 0;
    const equipmentQuote = site.equipmentQuote || 0;
    const furnitureQuote = site.furnitureQuote || 0;
    const otherQuote = site.otherQuote || 0;

    const totalQuote = basicQuote + materialQuote + equipmentQuote + furnitureQuote + otherQuote + addRemoveTotal;
    site.totalQuote = totalQuote;

    document.getElementById('basicQuoteDisplay').textContent = `¥${basicQuote.toFixed(2)}`;
    document.getElementById('materialQuoteDisplay').textContent = `¥${materialQuote.toFixed(2)}`;
    document.getElementById('equipmentQuoteDisplay').textContent = `¥${equipmentQuote.toFixed(2)}`;
    document.getElementById('furnitureQuoteDisplay').textContent = `¥${furnitureQuote.toFixed(2)}`;
    document.getElementById('otherQuoteDisplay').textContent = `¥${otherQuote.toFixed(2)}`;
    document.getElementById('addRemoveTotalQuoteDisplay').textContent = `${addRemoveTotal >= 0 ? '+' : ''}¥${addRemoveTotal.toFixed(2)}`;
    document.getElementById('totalQuoteDisplay').textContent = `¥${totalQuote.toFixed(2)}`;

    document.getElementById('addRemoveTotalQuote').value = addRemoveTotal;
}

function updateAddRemoveSummary(site) {
    if (!site || !site.addRemoveItems) {
        document.getElementById('addRemoveSummary').textContent = '¥0.00';
        return;
    }

    const addTotal = site.addRemoveItems
        .filter(item => item.type === 'add')
        .reduce((sum, item) => sum + (item.amount || 0), 0);

    const removeTotal = site.addRemoveItems
        .filter(item => item.type === 'remove')
        .reduce((sum, item) => sum + (item.amount || 0), 0);

    const total = addTotal - removeTotal;

    document.getElementById('addRemoveSummary').textContent = `¥${total.toFixed(2)}`;

    site.addRemoveTotal = total;

    document.getElementById('addRemoveTotalQuote').value = total;
    document.getElementById('addRemoveTotalQuoteDisplay').textContent = `¥${total.toFixed(2)}`;
}

// ==================== 文件加载和导出函数 ====================
async function autoLoadData() {
    console.log('开始自动加载数据...');

    try {
        console.log('从 localStorage 加载...');
        loadFromLocalStorage();

        // 同步到 window 对象
        window.sites = sites;
        window.changeLog = changeLog;

        if (sites.length > 0 || changeLog.length > 0) {
            console.log(`从 localStorage 加载了 ${sites.length} 个工地数据`);
            saveData();

            if (currentUser) {
                renderSiteList();
            }

            console.log('从 localStorage 加载完成');
            return;
        }

        console.log('localStorage 中无数据，尝试从 shuju.js 加载...');
        const jsLoaded = await tryLoadJsFile();

        if (jsLoaded) {
            console.log('从 shuju.js 文件加载成功！');
            saveData();

            if (currentUser) {
                renderSiteList();
            }
        } else {
            console.log('shuju.js 文件不存在，初始化空数据');
            sites = [];
            changeLog = [];
            saveData();
        }

    } catch (error) {
        console.error('自动加载失败:', error);
        if (!Array.isArray(sites)) sites = [];
        if (!Array.isArray(changeLog)) changeLog = [];
        saveData();
    }

    console.log('自动加载完成');
}

async function tryLoadJsFile() {
    return new Promise((resolve) => {
        if (window.location.protocol === 'file:') {
            console.log('在本地文件环境下运行，跳过 JS 文件加载');
            resolve(false);
            return;
        }

       const jsFilesToTry = [CLOUD_CONFIG.DATA_FILES.LOCAL_JS, CLOUD_CONFIG.DATA_FILES.LOCAL_LIGHT_JS];
        let currentIndex = 0;

        function tryNextFile() {
            if (currentIndex >= jsFilesToTry.length) {
                console.log('所有 JS 文件尝试加载失败');
                resolve(false);
                return;
            }

            const fileName = jsFilesToTry[currentIndex];
            console.log(`尝试加载文件: ${fileName}`);

            const script = document.createElement('script');
            script.src = fileName;

            script.onload = function () {
                try {
                    if (typeof savedData !== 'undefined') {
                        console.log(`成功从 ${fileName} 加载数据`);

                        const isLightVersion = fileName === 'shuju_light.js' ||
                            (savedData.dataVersion && savedData.dataVersion.includes('light')) ||
                            (savedData.note && savedData.note.includes('无base64'));

                        sites = savedData.sites || [];
                        changeLog = savedData.changeLog || [];

                        convertAllTimesToDate();

                        console.log(`从 ${fileName} 加载了 ${sites.length} 个工地数据`);
                        console.log(`数据版本: ${savedData.dataVersion || '未知'}`);

                        if (isLightVersion) {
                            console.log('检测到轻量版数据（无base64图片）');
                            setTimeout(() => {
                                showSimpleToast('已加载文本数据，请加载图片ZIP包以恢复图片', 'warning');
                            }, 1000);
                        }

                        delete window.savedData;

                        resolve(true);
                    } else {
                        console.log(`${fileName} 中没有找到 savedData 变量`);
                        currentIndex++;
                        setTimeout(tryNextFile, 100);
                    }
                } catch (error) {
                    console.error(`加载 ${fileName} 时出错:`, error);
                    currentIndex++;
                    setTimeout(tryNextFile, 100);
                }
            };

            script.onerror = function () {
                console.log(`${fileName} 文件不存在或加载失败`);
                currentIndex++;
                setTimeout(tryNextFile, 100);
            };

            setTimeout(() => {
                if (script.parentNode) {
                    document.head.removeChild(script);
                    console.log(`加载 ${fileName} 超时`);
                    currentIndex++;
                    setTimeout(tryNextFile, 100);
                }
            }, 5000);

            script.loaded = false;
            const originalOnload = script.onload;
            const originalOnerror = script.onerror;

            script.onload = function () {
                script.loaded = true;
                originalOnload.call(this);
            };

            script.onerror = function () {
                script.loaded = true;
                originalOnerror.call(this);
            };

            document.head.appendChild(script);
        }

        tryNextFile();
    });
}

// ==================== 图片和文件查看函数 ====================
function viewImage(src) {
    document.getElementById('viewerImage').src = src;
    document.getElementById('imageViewer').style.display = 'block';
}

function hideImageViewer() {
    document.getElementById('imageViewer').style.display = 'none';
}

function downloadDrawing(drawingId) {
    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const drawing = site.drawings.find(d => d.id === drawingId);
    if (drawing && drawing.file) {
        const a = document.createElement('a');
        a.href = drawing.file;

        let fileName = drawing.fileName;
        if (!fileName) {
            const match = drawing.file.match(/^data:([^;]+);/);
            if (match) {
                const mimeType = match[1];
                const extension = getExtensionFromMimeType(mimeType);
                fileName = `${getDrawingTypeText(drawing.type)}_${drawing.time.replace(/[\/:]/g, '-')}.${extension}`;
            } else {
                fileName = `${getDrawingTypeText(drawing.type)}_${drawing.time.replace(/[\/:]/g, '-')}`;
            }
        }

        a.download = fileName;
        a.click();
        addChangeLog('下载图纸', `下载了${getDrawingTypeText(drawing.type)}图纸：${fileName}`);
    }
}
// 修改 app.js 中的 tryLoadMissingFile 函数
function tryLoadMissingFile(filePath) {
    const input = document.createElement('input');
    input.type = 'file';
    
    // 根据文件路径判断接受什么类型的文件
    if (filePath.includes('repairs')) {
        input.accept = 'image/*';
    } else if (filePath.includes('drawings')) {
        input.accept = '.pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx,.csv,.txt,.json';
    } else {
        input.accept = '.jpg,.jpeg,.png,.gif,.pdf,.xls,.xlsx,.doc,.docx,.csv';
    }
    
    input.onchange = async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // 如果是图片文件，使用 resizeImage 压缩
            if (file.type.startsWith('image/')) {
                // 使用修改后的 resizeImage 函数，最大宽度500像素，质量0.6
                resizeImage(file, 500, function (compressedDataUrl) {
                    updateFileData(filePath, compressedDataUrl);
                });
            } else {
                // 非图片文件直接读取
                const reader = new FileReader();
                reader.onload = function (e) {
                    updateFileData(filePath, e.target.result);
                };
                reader.onerror = function (e) {
                    console.error('文件读取失败:', e);
                    alert('文件读取失败，请重试');
                };
                reader.readAsDataURL(file);
            }
        } catch (error) {
            console.error('加载文件失败:', error);
            alert('加载文件失败：' + error.message);
        }
    };
    input.click();
}

// 确保 updateFileData 函数也能正确处理压缩后的图片
function updateFileData(filePath, base64Data) {
    let updated = false;
    let siteUpdated = false;

    sites.forEach(site => {
        // 处理维修图片
        if (site.repairs) {
            site.repairs.forEach(repair => {
                if (repair.photo && repair.photo.includes(filePath)) {
                    // 确保图片已经压缩过
                    if (base64Data.startsWith('data:image/')) {
                        // 检查是否需要压缩（判断宽度是否超过500像素）
                        const img = new Image();
                        img.onload = function() {
                            // 如果宽度超过500像素，进行压缩
                            if (img.width > 500) {
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                
                                // 计算新的尺寸
                                const ratio = 500 / img.width;
                                canvas.width = 500;
                                canvas.height = img.height * ratio;
                                
                                // 绘制并压缩
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                                
                                repair.photo = compressedDataUrl;
                            } else {
                                repair.photo = base64Data;
                            }
                            
                            delete repair.photoMissing;
                            updated = true;
                            siteUpdated = true;
                            console.log(`已更新维修图片: ${filePath}`);
                            
                            // 保存数据并刷新显示
                            saveData();
                            if (currentSiteId && siteUpdated) {
                                const currentSite = sites.find(s => s.id === currentSiteId);
                                if (currentSite) {
                                    loadSiteData(currentSite);
                                }
                            }
                        };
                        img.src = base64Data;
                    } else {
                        repair.photo = base64Data;
                        delete repair.photoMissing;
                        updated = true;
                        siteUpdated = true;
                        console.log(`已更新维修图片: ${filePath}`);
                    }
                }
            });
        }

        // 处理图纸文件
        if (site.drawings) {
            site.drawings.forEach(drawing => {
                if (drawing.file && drawing.file.includes(filePath)) {
                    drawing.file = base64Data;
                    delete drawing.fileMissing;
                    updated = true;
                    siteUpdated = true;
                    console.log(`已更新图纸文件: ${filePath}`);
                }
            });
        }
    });

    if (updated) {
        saveData();
        if (currentSiteId && siteUpdated) {
            const site = sites.find(s => s.id === currentSiteId);
            if (site) loadSiteData(site);
        }
        showSimpleToast('文件已加载并更新');
    } else {
        showSimpleToast('未找到对应的文件路径', 'error');
    }
}
function closeSiteModal() {
    document.getElementById('siteModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 清除当前工地ID
    window.currentSiteId = null;
    currentSiteId = null;
    
    const previews = ['repairPhotoPreview', 'drawingPreview'];
    previews.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '';
            delete element.dataset.originalData;
            delete element.dataset.fileName;
        }
    });
}

function logout() {
    if (confirm('确定要退出登录吗？')) {    
        addChangeLog('退出系统', '用户退出登录');
        currentUser = null;
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainContainer').classList.add('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('loginError').style.display = 'none';
    }
}

window.onclick = function (event) {
    const modal = document.getElementById('siteModal');
    if (event.target === modal) {
        closeSiteModal();
    }
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('siteModal');
        if (modal.style.display === 'block') {
            closeSiteModal();
        }
    }
});

// ==================== 工具函数 ====================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveData() {
    try {
        localStorage.setItem('constructionSites', JSON.stringify(sites));
        localStorage.setItem('changeLog', JSON.stringify(changeLog));
    } catch (error) {
        console.error('保存数据失败:', error);
        alert('保存数据失败，请检查浏览器存储权限');
    }
}

function loadFromLocalStorage() {
    try {
        const savedSites = localStorage.getItem('constructionSites');
        const savedLog = localStorage.getItem('changeLog');

        if (savedSites) {
            sites = JSON.parse(savedSites);
        }

        if (savedLog) {
            changeLog = JSON.parse(savedLog);
        }
    } catch (error) {
        console.error('从 localStorage 加载数据失败:', error);
        sites = [];
        changeLog = [];
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toISOString().split('T')[0];
}

function calculateDaysLeft(endDate) {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = end - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getSiteStatus(progress, daysLeft) {
    if (progress >= 100) {
        return { class: 'completed', text: '已完成' };
    } else if (daysLeft < 0) {
        return { class: 'delayed', text: '已逾期' };
    } else {
        return { class: 'active', text: '进行中' };
    }
}

// ==================== 表格渲染函数 ====================
function renderTodoList(site) {
    const list = document.getElementById('todoList');
    
    if (!site.todos || site.todos.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px; padding: 20px;">暂无待办事项</p>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>' +
        '<th>事项名称</th>' +
        '<th class="status-col">状态</th>' +
        '<th>时间</th>' +
        '<th>操作人</th>' +
        '<th class="action-col">操作</th>' +
        '</tr></thead><tbody>';
    
    site.todos.forEach(todo => {
        let statusCell = '';
        if (canEditStatus()) {
            statusCell = `<td>
                <select class="todo-status-select" data-id="${todo.id}" onchange="updateTodoStatus('${todo.id}', this.value)">
                    <option value="pending" ${todo.status === 'pending' ? 'selected' : ''}>待办</option>
                    <option value="in-progress" ${todo.status === 'in-progress' ? 'selected' : ''}>进行中</option>
                    <option value="completed" ${todo.status === 'completed' ? 'selected' : ''}>已完成</option>
                </select>
            </td>`;
        } else {
           const statusText = { 'pending': '待办', 'in-progress': '进行中', 'completed': '已完成' };
const statusColor = { 'pending': '#ff6b6b', 'in-progress': '#4caf50', 'completed': '#9e9e9e' };
           statusCell = `<td><span style="color: ${statusColor[todo.status]} !important;">${statusText[todo.status]}</span></td>`;
        }
        
        html += `<tr>
            <td class="multi-line" title="${todo.item}">${todo.item}</td>
            ${statusCell}
            <td>${formatDate(todo.time)}</td>
            <td class="multi-line">${todo.operator}</td>
            <td>
                <div class="action-btns compact">
                    ${canDelete() ? `<button class="action-btn delete-btn compact-btn" onclick="deleteItem('${todo.id}', 'todo')">删除</button>` : ''}
                </div>
            </td>
        </tr>`;
        
        if (todo.note && todo.note.trim()) {
            html += `<tr class="note-row">
                <td colspan="5" class="note-cell" onclick="editNoteAutoSave('todo', '${todo.id}', this)" title="点击编辑备注" style="cursor: pointer;">
                    <div class="note-display multi-line">备注：${todo.note}</div>
                    <textarea class="note-edit-auto" 
                              style="display: none;"
                              data-type="todo" 
                              data-id="${todo.id}"
                              onblur="saveNoteAutoSave(event)"
                              onkeydown="handleNoteKeydown(event)">${todo.note}</textarea>
                </td>
            </tr>`;
        }
    });
    
    html += '</tbody></table>';
    list.innerHTML = html;
}

function renderExpenseList(site) {
    const list = document.getElementById('expenseList');
    
    if (!site.expenses || site.expenses.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px; padding: 20px;">暂无支出记录</p>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>' +
        '<th>项目名称</th>' +
        '<th class="unit-col">单位</th>' +
        '<th>金额</th>' +
        '<th>时间</th>' +
        '<th>操作人</th>' +
        '<th class="action-col">操作</th>' +
        '</tr></thead><tbody>';
    
    site.expenses.forEach(expense => {
        let timeCell = '';
        if (canEditTime()) {
            timeCell = `<td onclick="editTime(this, '${expense.id}')" title="点击编辑日期" style="cursor: pointer;">
                <span class="date-display">${formatDate(expense.time)}</span>
                <input type="date" class="date-edit" value="${formatDate(expense.time)}" 
                       style="display: none;" 
                       onblur="saveTime('${expense.id}', this.value, 'time')">
            </td>`;
        } else {
            timeCell = `<td>${formatDate(expense.time)}</td>`;
        }
        
        html += `<tr>
            <td class="multi-line" title="${expense.item}">${expense.item}</td>
            <td class="unit-col">${expense.unit || '项'}</td>
            <td>¥${expense.amount.toFixed(2)}</td>
            ${timeCell}
            <td class="multi-line">${expense.operator || '-'}</td>
            <td>
                <div class="action-btns compact">
                    ${canDelete() ? `<button class="action-btn delete-btn compact-btn" onclick="deleteItem('${expense.id}', 'expense')">删除</button>` : ''}
                </div>
            </td>
        </tr>`;
        
        if (expense.note && expense.note.trim()) {
            html += `<tr class="note-row">
                <td colspan="6" class="note-cell" onclick="editNoteAutoSave('expense', '${expense.id}', this)" title="点击编辑备注" style="cursor: pointer;">
                    <div class="note-display multi-line">备注：${expense.note}</div>
                    <textarea class="note-edit-auto" 
                              style="display: none;"
                              data-type="expense" 
                              data-id="${expense.id}"
                              onblur="saveNoteAutoSave(event)"
                              onkeydown="handleNoteKeydown(event)">${expense.note}</textarea>
                </td>
            </tr>`;
        }
    });
    
    html += '</tbody></table>';
    list.innerHTML = html;
}
function renderRequirementList(site) {
    const list = document.getElementById('requirementList');
    
    if (!site.requirements || site.requirements.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px; padding: 20px;">暂无客户要求</p>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>' +
        '<th style="max-width: 80px;">要求内容</th>' +
        '<th style="width: 60px;">类型</th>' +
        '<th class="status-col">状态</th>' +
        '<th>时间</th>' +
        '<th>操作人</th>' +
        '<th class="action-col">操作</th>' +
        '</tr></thead><tbody>';
    
    site.requirements.forEach(req => {
        const typeText = req.type === 'need' ? '需要' : '排除';
        // 使用 CSS 变量，确保在深色模式下颜色不变
        const typeStyle = `style="color: ${req.type === 'need' ? '#4caf50' : '#ff6b6b'} !important;"`;
        
        let statusCell = '';
        if (canEditStatus()) {
            statusCell = `<td>
                <select class="requirement-status-select" data-id="${req.id}" onchange="updateRequirementStatus('${req.id}', this.value)">
                    <option value="pending" ${req.status === 'pending' ? 'selected' : ''}>待完成</option>
                    <option value="in-progress" ${req.status === 'in-progress' ? 'selected' : ''}>进行中</option>
                    <option value="completed" ${req.status === 'completed' ? 'selected' : ''}>已完成</option>
                </select>
            </td>`;
        } else {
           const statusText = { 'pending': '待完成', 'in-progress': '进行中', 'completed': '已完成' };
const statusColor = { 'pending': '#ff6b6b', 'in-progress': '#4caf50', 'completed': '#9e9e9e' };
            statusCell = `<td><span style="color: ${statusColor[req.status]} !important;">${statusText[req.status]}</span></td>`;
        }
        
        let timeCell = '';
        if (canEditTime()) {
            timeCell = `<td onclick="editTime(this, '${req.id}')" title="点击编辑日期" style="cursor: pointer;">
                <span class="date-display">${formatDate(req.time)}</span>
                <input type="date" class="date-edit" value="${formatDate(req.time)}" 
                       style="display: none;" 
                       onblur="saveTime('${req.id}', this.value, 'time')">
            </td>`;
        } else {
            timeCell = `<td>${formatDate(req.time)}</td>`;
        }
        
        html += `<tr>
            <td class="compact-text multi-line" title="${req.content}">${req.content}</td>
            <td ${typeStyle} class="requirement-type-cell">${typeText}</td>
            ${statusCell}
            ${timeCell}
            <td class="compact-text multi-line">${req.operator}</td>
            <td>
                <div class="action-btns compact">
                    ${canDelete() ? `<button class="action-btn delete-btn compact-btn" onclick="deleteItem('${req.id}', 'requirement')">删除</button>` : ''}
                </div>
            </td>
        </tr>`;
        
        if (req.note && req.note.trim()) {
            html += `<tr class="note-row">
                <td colspan="6" class="note-cell" onclick="editNoteAutoSave('requirement', '${req.id}', this)" title="点击编辑备注" style="cursor: pointer;">
                    <div class="note-display multi-line">备注：${req.note}</div>
                    <textarea class="note-edit-auto" 
                              style="display: none;"
                              data-type="requirement" 
                              data-id="${req.id}"
                              onblur="saveNoteAutoSave(event)"
                              onkeydown="handleNoteKeydown(event)">${req.note}</textarea>
                </td>
            </tr>`;
        }
    });
    
    html += '</tbody></table>';
    list.innerHTML = html;
}

function renderRepairList(site) {
    const list = document.getElementById('repairList');
    
    if (!site.repairs || site.repairs.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px; padding: 20px;">暂无维修项</p>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>' +
        '<th>图片信息</th>' +
        '<th class="status-col">状态</th>' +
        '<th>维修内容</th>' +
        '<th>时间</th>' +
        '<th>操作人</th>' +
        '<th class="action-col">操作</th>' +
        '</tr></thead><tbody>';
    
    site.repairs.forEach(repair => {
        let photoHtml = '';
        
        if (!repair.photo) {
            photoHtml = `<div class="photo-placeholder">
                <div>📷</div>
                <div>无图片</div>
                <button onclick="addPhotoToRepair('${repair.id}')">添加图片</button>
                <input type="file" accept="image/*" style="display: none;" id="addPhotoInput_${repair.id}" 
                       onchange="uploadPhotoForRepair('${repair.id}', this)">
            </div>`;
        } else if (repair.photo.startsWith('[PHOTO:')) {
            const fileName = repair.photo.match(/\[PHOTO:(.+?)\]/)[1];
            photoHtml = `<div class="photo-missing">
                <div>⚠️</div>
                <div>图片缺失<br><small>需要单独加载</small></div>
                <button onclick="tryLoadMissingFile('${fileName}')">加载图片</button>
            </div>`;
        } else {
            photoHtml = `<div class="photo-container">
                <img src="${repair.photo}" onclick="viewImage('${repair.photo}')">
                <button onclick="changeRepairPhoto('${repair.id}', this)">↻</button>
                <input type="file" accept="image/*" style="display: none;" 
                       onchange="uploadNewRepairPhoto('${repair.id}', this)" class="repair-photo-input">
            </div>`;
        }
        
        let statusCell = '';
        if (canEditStatus()) {
            statusCell = `<td>
                <select class="repair-status-select" data-id="${repair.id}" onchange="updateRepairStatus('${repair.id}', this.value)">
                    <option value="pending" ${repair.status === 'pending' ? 'selected' : ''}>待维修</option>
                    <option value="completed" ${repair.status === 'completed' ? 'selected' : ''}>已完成</option>
                </select>
            </td>`;
        } else {
          statusCell = `<td><span style="color: ${repair.status === 'completed' ? '#9e9e9e' : '#ff6b6b'} !important;">${repair.status === 'completed' ? '已完成' : '待维修'}</span></td>`;
        }
        
        let timeCell = '';
        if (canEditTime()) {
            timeCell = `<td onclick="editTime(this, '${repair.id}')" title="点击编辑日期" style="cursor: pointer;">
                <span class="date-display">${formatDate(repair.time)}</span>
                <input type="date" class="date-edit" value="${formatDate(repair.time)}" 
                       style="display: none;" 
                       onblur="saveTime('${repair.id}', this.value, 'time')">
            </td>`;
        } else {
            timeCell = `<td>${formatDate(repair.time)}</td>`;
        }
        
        const completeButton = repair.status === 'pending' ? 
            `<button class="action-btn btn-success compact-btn" onclick="completeRepair('${repair.id}')">完成</button>` : '';
        
        html += `<tr>
            <td>${photoHtml}</td>
            ${statusCell}
            <td class="multi-line" title="${repair.content}">${repair.content}</td>
            ${timeCell}
            <td class="multi-line">${repair.operator}</td>
            <td>
                <div class="action-btns compact">
                    ${canDelete() ? `<button class="action-btn delete-btn compact-btn" onclick="deleteItem('${repair.id}', 'repair')">删除</button>` : ''}
                    ${completeButton}
                </div>
            </td>
        </tr>`;
        
        if (repair.note && repair.note.trim()) {
            html += `<tr class="note-row">
                <td colspan="6" class="note-cell" onclick="editNoteAutoSave('repair', '${repair.id}', this)" title="点击编辑备注" style="cursor: pointer;">
                    <div class="note-display multi-line">备注：${repair.note}</div>
                    <textarea class="note-edit-auto" 
                              style="display: none;"
                              data-type="repair" 
                              data-id="${repair.id}"
                              onblur="saveNoteAutoSave(event)"
                              onkeydown="handleNoteKeydown(event)">${repair.note}</textarea>
                </td>
            </tr>`;
        }
    });
    
    html += '</tbody></table>';
    list.innerHTML = html;
}

function addPhotoToRepair(repairId) {
    const input = document.getElementById(`addPhotoInput_${repairId}`);
    if (input) input.click();
}
// 修改 uploadPhotoForRepair 函数
function uploadPhotoForRepair(repairId, fileInput) {
    const file = fileInput.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
    }
    
    // 使用修改后的 resizeImage 函数
    resizeImage(file, 500, function(resizedDataUrl) {
        const site = sites.find(s => s.id === currentSiteId);
        if (!site) return;
        
        const repair = site.repairs.find(r => r.id === repairId);
        if (repair) {
            repair.photo = resizedDataUrl;
            repair.photoName = file.name;
            
            saveData();
            renderRepairList(site);
            addChangeLog('添加维修图片', `为维修项"${repair.content}"添加了图片`);
            alert('图片添加成功！');
        }
    });
}

function renderWorkerList(site) {
    const list = document.getElementById('workerList');
    
    if (!site.workers || site.workers.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px;">暂无工人记录</p>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>' +
        '<th>施工项目</th>' +
        '<th>姓名</th>' +
        '<th>开始时间</th>' +
        '<th>结束时间</th>' +
        '<th>操作人</th>' +
        '<th class="action-col">操作</th>' +
        '</tr></thead><tbody>';
    
    site.workers.forEach(worker => {
        const startTimeCell = canEditWorkerTime() ? 
            `<td onclick="editWorkerTime('${worker.id}', this, 'startTime')" title="点击编辑日期" style="cursor: pointer;">
                <span class="date-display">${formatDate(worker.startTime)}</span>
                <input type="date" class="date-edit" value="${formatDate(worker.startTime)}" 
                       style="display: none;" 
                       onblur="saveWorkerTime('${worker.id}', this.value, 'startTime')">
            </td>` :
            `<td>${formatDate(worker.startTime)}</td>`;
        
        const endTimeCell = canEditWorkerTime() ? 
            `<td onclick="editWorkerTime('${worker.id}', this, 'endTime')" title="点击编辑日期" style="cursor: pointer;">
                <span class="date-display">${formatDate(worker.endTime)}</span>
                <input type="date" class="date-edit" value="${formatDate(worker.endTime)}" 
                       style="display: none;" 
                       onblur="saveWorkerTime('${worker.id}', this.value, 'endTime')">
            </td>` :
            `<td>${worker.endTime ? formatDate(worker.endTime) : '未结束'}</td>`;
        
        html += `<tr>
            <td>${worker.type}</td>
            <td>${worker.name}</td>
            ${startTimeCell}
            ${endTimeCell}
            <td>${worker.operator}</td>
            <td>
                <div class="action-btns">
                    ${canDelete() ? `<button class="action-btn delete-btn" onclick="deleteItem('${worker.id}', 'worker')">删除</button>` : ''}
                </div>
            </td>
        </tr>`;
        
        if (worker.note && worker.note.trim()) {
            html += `<tr class="note-row">
                <td colspan="6" class="note-cell" onclick="editNoteAutoSave('worker', '${worker.id}', this)" title="点击编辑备注" style="cursor: pointer;">
                    <div class="note-display">备注：${worker.note}</div>
                    <textarea class="note-edit-auto" 
                              style="display: none;"
                              data-type="worker" 
                              data-id="${worker.id}"
                              onblur="saveNoteAutoSave(event)"
                              onkeydown="handleNoteKeydown(event)">${worker.note}</textarea>
                </td>
            </tr>`;
        }
    });
    
    html += '</tbody></table>';
    list.innerHTML = html;
}

function renderAddRemoveList(site) {
    const list = document.getElementById('addRemoveList');
    
    if (!site.addRemoveItems || site.addRemoveItems.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px; padding: 20px;">暂无增减项</p>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>' +
        '<th>项目名称</th>' +
        '<th>类型</th>' +
        '<th>金额</th>' +
        '<th>时间</th>' +
        '<th>操作人</th>' +
        '<th class="action-col">操作</th>' +
        '</tr></thead><tbody>';
    
    site.addRemoveItems.forEach(item => {
        let timeCell = '';
        if (canEditTime()) {
            timeCell = `<td onclick="editTime(this, '${item.id}')" title="点击编辑日期" style="cursor: pointer;">
                <span class="date-display">${formatDate(item.time)}</span>
                <input type="date" class="date-edit" value="${formatDate(item.time)}" 
                       style="display: none;" 
                       onblur="saveTime('${item.id}', this.value, 'time')">
            </td>`;
        } else {
            timeCell = `<td>${formatDate(item.time)}</td>`;
        }
        
        html += `<tr>
            <td class="multi-line" title="${item.item}">${item.item}</td>
            <td><span style="color: ${item.type === 'add' ? '#4caf50' : '#ff6b6b'}">${item.type === 'add' ? '增加' : '减少'}</span></td>
            <td>${item.type === 'add' ? '+' : '-'}¥${item.amount.toFixed(2)}</td>
            ${timeCell}
            <td class="multi-line">${item.operator || '-'}</td>
            <td>
                <div class="action-btns compact">
                    ${canDelete() ? `<button class="action-btn delete-btn compact-btn" onclick="deleteItem('${item.id}', 'addRemove')">删除</button>` : ''}
                </div>
            </td>
        </tr>`;
        
        if (item.note && item.note.trim()) {
            html += `<tr class="note-row">
                <td colspan="6" class="note-cell" onclick="editNoteAutoSave('addRemove', '${item.id}', this)" title="点击编辑备注" style="cursor: pointer;">
                    <div class="note-display multi-line">备注：${item.note}</div>
                    <textarea class="note-edit-auto" 
                              style="display: none;"
                              data-type="addRemove" 
                              data-id="${item.id}"
                              onblur="saveNoteAutoSave(event)"
                              onkeydown="handleNoteKeydown(event)">${item.note}</textarea>
                </td>
            </tr>`;
        }
    });
    
    html += '</tbody></table>';
    list.innerHTML = html;
}

function renderDrawingList(site) {
    const list = document.getElementById('drawingList');
    
    if (!site.drawings || site.drawings.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px; padding: 20px;">暂无图纸</p>';
        return;
    }
    
    let html = '<table class="data-table"><thead><tr>' +
        '<th style="min-height: 80px; width: 120px;">文件信息</th>' +
        '<th>图纸类型</th>' +
        '<th>文件名</th>' +
        '<th>时间</th>' +
        '<th>操作人</th>' +
        '<th class="action-col">操作</th>' +
        '</tr></thead><tbody>';
    
    site.drawings.forEach(drawing => {
        let fileHtml = '';
        
        if (drawing.file) {
            if (drawing.file.startsWith('[FILE:')) {
                const fileName = drawing.file.match(/\[FILE:(.+?)\]/)[1];
                fileHtml = `<div class="file-missing">
                    <div>📄</div>
                    <div>文件缺失<br><small>需单独加载</small></div>
                    <button onclick="tryLoadMissingFile('${fileName}')">加载文件</button>
                </div>`;
            } else {
                if (drawing.fileType && drawing.fileType.startsWith('image/')) {
                    fileHtml = `<div class="file-container">
                        <img src="${drawing.file}" onclick="viewImage('${drawing.file}')">
                        <button class="image-change-btn" onclick="changeDrawingFile('${drawing.id}', this)" title="更换文件">↻</button>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx,.csv" 
                               style="display: none;" onchange="uploadNewDrawingFile('${drawing.id}', this)" 
                               class="drawing-file-input">
                    </div>`;
                } else {
                    const fileIcon = getFileIcon(drawing.fileType);
                    const fileNameDisplay = drawing.fileName || '未命名文件';
                    const shortName = fileNameDisplay.length > 12 ? 
                        fileNameDisplay.substring(0, 12) + '...' : fileNameDisplay;
                    
                    fileHtml = `<div class="file-container non-image">
                        <div>${fileIcon}</div>
                        <div>${shortName}</div>
                        <button class="image-change-btn" onclick="changeDrawingFile('${drawing.id}', this)" title="更换文件">↻</button>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx,.csv" 
                               style="display: none;" onchange="uploadNewDrawingFile('${drawing.id}', this)" 
                               class="drawing-file-input">
                    </div>`;
                }
            }
        } else {
            fileHtml = `<div class="file-placeholder">
                <div>📄</div>
                <div>无文件</div>
                <button onclick="addFileToDrawing('${drawing.id}')">添加文件</button>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx,.csv" 
                       style="display: none;" id="addDrawingFile_${drawing.id}" 
                       onchange="uploadFileForDrawing('${drawing.id}', this)">
            </div>`;
        }
        
        let timeCell = '';
        if (canEditTime()) {
            timeCell = `<td onclick="editTime(this, '${drawing.id}')" title="点击编辑日期" style="cursor: pointer;">
                <span class="date-display">${formatDate(drawing.time)}</span>
                <input type="date" class="date-edit" value="${formatDate(drawing.time)}" 
                       style="display: none;" 
                       onblur="saveTime('${drawing.id}', this.value, 'time')">
            </td>`;
        } else {
            timeCell = `<td>${formatDate(drawing.time)}</td>`;
        }
        
        html += `<tr style="min-height: 80px;">`;
        html += `<td>${fileHtml}</td>`;
        html += `<td class="multi-line" title="${getDrawingTypeText(drawing.type)}">${getDrawingTypeText(drawing.type)}</td>`;
        html += `<td class="multi-line" title="${drawing.fileName || '未命名'}">${drawing.fileName || '未命名'}</td>`;
        html += `${timeCell}`;
        html += `<td class="multi-line">${drawing.operator}</td>`;
        html += `<td>
            <div class="action-btns compact">
                ${canDelete() ? `<button class="action-btn delete-btn compact-btn" onclick="deleteItem('${drawing.id}', 'drawing')">删除</button>` : ''}
                <button class="action-btn btn-primary compact-btn" onclick="downloadDrawing('${drawing.id}')">下载</button>
            </div>
        </td>`;
        html += `</tr>`;
        
        if (drawing.note && drawing.note.trim()) {
            html += `<tr class="note-row">
                <td colspan="6" class="note-cell" onclick="editNoteAutoSave('drawing', '${drawing.id}', this)" title="点击编辑备注" style="cursor: pointer;">
                    <div class="note-display multi-line">备注：${drawing.note}</div>
                    <textarea class="note-edit-auto" 
                              style="display: none;"
                              data-type="drawing" 
                              data-id="${drawing.id}"
                              onblur="saveNoteAutoSave(event)"
                              onkeydown="handleNoteKeydown(event)">${drawing.note}</textarea>
                </td>
            </tr>`;
        }
    });
    
    html += '</tbody></table>';
    list.innerHTML = html;
}

function addFileToDrawing(drawingId) {
    const input = document.getElementById(`addDrawingFile_${drawingId}`);
    if (input) input.click();
}

function uploadFileForDrawing(drawingId, fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;

    const drawing = site.drawings.find(d => d.id === drawingId);
    if (!drawing) return;

    if (file.type.startsWith('image/')) {
    // 使用修改后的 resizeImage 函数
    resizeImage(file, 500, function(resizedDataUrl) {
        drawing.file = resizedDataUrl;
        drawing.fileName = file.name;
        drawing.fileType = file.type;
        drawing.fileSize = file.size;
        
        saveData();
        renderDrawingList(site);
        addChangeLog('添加图纸文件', `为图纸"${drawing.fileName || '未命名'}"添加了文件`);
        alert('文件添加成功！');
    });
    } else {
        const reader = new FileReader();
        reader.onload = function (e) {
            drawing.file = e.target.result;
            drawing.fileName = file.name;
            drawing.fileType = file.type;
            drawing.fileSize = file.size;

            saveData();
            renderDrawingList(site);
            addChangeLog('添加图纸文件', `为图纸"${drawing.fileName || '未命名'}"添加了文件`);
            alert('文件添加成功！');
        };
        reader.readAsDataURL(file);
    }
}

function renderExperienceList(site) {
    const list = document.getElementById('experienceList');

    if (!site.experiences || site.experiences.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px;">暂无经验总结</p>';
        return;
    }

    list.innerHTML = '';

    site.experiences.forEach(exp => {
        const expItem = document.createElement('div');
        expItem.className = 'experience-item';
        
        const contentDiv = document.createElement('div');
        contentDiv.style.flex = '1';
        contentDiv.style.minWidth = '0';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'experience-header';
        headerDiv.innerHTML = `
            <span>${exp.operator} - 经验总结</span>
            <span class="experience-time">${exp.time}</span>
        `;
        
        const contentText = document.createElement('div');
        contentText.className = 'experience-content';
        contentText.textContent = exp.content;
        contentText.title = exp.content;
        
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(contentText);
        
        const actionDiv = document.createElement('div');
        if (canDelete()) {
            actionDiv.innerHTML = `<button class="action-btn delete-btn" onclick="deleteItem('${exp.id}', 'experience')">删除</button>`;
        }
        
        expItem.appendChild(contentDiv);
        expItem.appendChild(actionDiv);
        
        list.appendChild(expItem);
    });
}

// ==================== 备注实时保存相关函数 ====================
function editNoteAutoSave(type, id, cell) {
    if (!canEditNote()) return;
    
    const display = cell.querySelector('.note-display');
    const input = cell.querySelector('.note-edit-auto');
    
    if (display) display.style.display = 'none';
    if (input) {
        input.style.display = 'block';
        input.focus();
        const length = input.value.length;
        input.setSelectionRange(length, length);
        
        if (display && display.textContent.includes('点击添加备注')) {
            input.value = '';
        }
    }
}

function saveNoteAutoSave(event) {
    const input = event.target;
    const type = input.getAttribute('data-type');
    const id = input.getAttribute('data-id');
    
    if (!type || !id) return;
    
    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;
    
    const collections = {
        'todo': site.todos,
        'expense': site.expenses,
        'requirement': site.requirements,
        'repair': site.repairs,
        'worker': site.workers,
        'addRemove': site.addRemoveItems,
        'drawing': site.drawings
    };
    
    const collection = collections[type];
    if (!collection) return;
    
    const item = collection.find(item => item.id === id);
    if (!item) return;
    
    const oldNote = item.note || '';
    const newNote = input.value.trim();
    
    if (!newNote) {
        const display = input.parentElement.querySelector('.note-display');
        if (display) {
            display.textContent = '点击添加备注（20字符以内）';
            display.style.display = '';
        }
        input.style.display = 'none';
        
        if (oldNote) {
            item.note = '';
            saveData();
            addChangeLog(`清除${getCollectionName(type)}备注`, `清除了${item.item || item.content || item.name || '未命名'}的备注`);
        }
        return;
    }
    
    if (oldNote === newNote) {
        input.style.display = 'none';
        const display = input.parentElement.querySelector('.note-display');
        if (display) display.style.display = '';
        return;
    }
    
    item.note = newNote;
    saveData();
    
    const display = input.parentElement.querySelector('.note-display');
    if (display) {
        display.textContent = `备注：${newNote}`;
        display.style.display = '';
    }
    input.style.display = 'none';
    
    const itemName = item.item || item.content || item.name || '未命名';
    addChangeLog(`编辑${getCollectionName(type)}备注`, `修改了${itemName}的备注`);
    
    showSimpleToast('备注已保存', 'success');
}

function handleNoteKeydown(event) {
    if (event.key === 'Escape') {
        const input = event.target;
        input.value = input.defaultValue;
        input.style.display = 'none';
        const display = input.parentElement.querySelector('.note-display');
        if (display) display.style.display = '';
    } else if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault();
        event.target.blur();
    }
}

function getCollectionName(type) {
    const names = {
        'todo': '待办事项',
        'expense': '支出',
        'requirement': '客户要求',
        'repair': '维修项',
        'worker': '工人',
        'addRemove': '增减项',
        'drawing': '图纸'
    };
    return names[type] || '项目';
}

function editTime(element, id, timeField = 'time') {
    if (!canEditTime()) return;
    
    const display = element.querySelector('.date-display');
    const input = element.querySelector('.date-edit');
    
    if (display) display.style.display = 'none';
    if (input) {
        input.style.display = 'inline-block';
        input.focus();
    }
}

function saveTime(id, newTime, timeField = 'time') {
    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return;
    
    const searchCollections = [
        { collection: site.todos, type: 'todo' },
        { collection: site.expenses, type: 'expense' },
        { collection: site.requirements, type: 'requirement' },
        { collection: site.repairs, type: 'repair' },
        { collection: site.workers, type: 'worker' },
        { collection: site.addRemoveItems, type: 'addRemove' },
        { collection: site.drawings, type: 'drawing' }
    ];
    
    for (const { collection, type } of searchCollections) {
        if (collection) {
            const found = collection.find(item => item.id === id);
            if (found) {
                const itemName = found.item || found.content || found.name || '未命名';
                found[timeField] = newTime;
                saveData();
                addChangeLog('编辑时间', `修改了${itemName}的时间为：${newTime}`);
                return true;
            }
        }
    }
    return false;
}
// 确保管理员变量已初始化
if (typeof window.ADMIN_USERS === 'undefined') {
    window.ADMIN_USERS = ['admin', 'qiyu'];
}

// 如果当前登录的是管理员，确保 isAdmin 属性正确
if (currentUser) {
    if (window.ADMIN_USERS.includes(currentUser.username) && !currentUser.isAdmin) {
        currentUser.isAdmin = true;
    }
}
function deleteItem(itemId, collectionName) {
    if (!canDelete()) {
        alert('只有管理员可以删除数据！');
        return false;
    }
    
    if (!confirm('确定要删除这条记录吗？')) return false;
    
    const site = sites.find(s => s.id === currentSiteId);
    if (!site) return false;
    
    const collections = {
        'todo': { data: site.todos, name: '待办事项' },
        'expense': { data: site.expenses, name: '支出' },
        'requirement': { data: site.requirements, name: '客户要求' },
        'repair': { data: site.repairs, name: '维修项' },
        'worker': { data: site.workers, name: '工人' },
        'addRemove': { data: site.addRemoveItems, name: '增减项' },
        'drawing': { data: site.drawings, name: '图纸' },
        'experience': { data: site.experiences, name: '经验总结' }
    };
    
    const collection = collections[collectionName];
    if (!collection || !collection.data) return false;
    
    const index = collection.data.findIndex(item => item.id === itemId);
    if (index > -1) {
        const item = collection.data[index];
        const itemName = item.item || item.content || item.name || '未命名';
        
        collection.data.splice(index, 1);
        saveData();
        
        addChangeLog(`删除${collection.name}`, `删除了${collection.name}：${itemName}`);
        
        switch (collectionName) {
            case 'todo': renderTodoList(site); break;
            case 'expense': renderExpenseList(site); break;
            case 'requirement': renderRequirementList(site); break;
            case 'repair': renderRepairList(site); break;
            case 'worker': renderWorkerList(site); break;
            case 'addRemove': renderAddRemoveList(site); break;
            case 'drawing': renderDrawingList(site); break;
            case 'experience': renderExperienceList(site); break;
        }
        
        alert('删除成功！');
        return true;
    }
    return false;
}

function updateTopButtonsByPermission() {
    const topButtons = document.querySelector('.header-top-buttons');
    if (!topButtons) return;
    
    // 查找或创建权限管理按钮
    let permissionBtn = topButtons.querySelector('.permission-manager-btn');
    if (!permissionBtn) {
        permissionBtn = document.createElement('button');
        permissionBtn.className = 'top-btn btn-danger permission-manager-btn';
        permissionBtn.onclick = showPermissionManager;
        permissionBtn.textContent = '权限管理';
        permissionBtn.title = '权限管理';
        topButtons.appendChild(permissionBtn);
    }
    
    // 查找或创建更改日志按钮
    let changeLogBtn = topButtons.querySelector('.change-log-btn');
    if (!changeLogBtn) {
        changeLogBtn = document.createElement('button');
        changeLogBtn.className = 'top-btn btn-primary change-log-btn';
        changeLogBtn.onclick = showChangeLog;
        changeLogBtn.textContent = '更改日志';
        topButtons.appendChild(changeLogBtn);
    }
    
    // 根据权限显示/隐藏按钮
    if (typeof window.canShowPermissionManager === 'function') {
        permissionBtn.style.display = window.canShowPermissionManager() ? '' : 'none';
    }
    
    if (typeof window.canShowChangeLog === 'function') {
        changeLogBtn.style.display = window.canShowChangeLog() ? '' : 'none';
    }
    
    console.log('按钮状态更新完成:', {
        permissionBtnVisible: permissionBtn.style.display !== 'none',
        changeLogBtnVisible: changeLogBtn.style.display !== 'none'
    });
}
// 在 app.js 末尾添加这些函数：

// 数据管理相关函数
function downloadJsonData() {
    if (!canDownloadJsonData()) {
        alert('您没有权限下载JSON数据！');
        return;
    }
    
    try {
        const dataToExport = {
            sites: sites,
            changeLog: changeLog,
            exportTime: new Date().toISOString(),
            exportedBy: currentUser?.name || 'Unknown',
            dataVersion: '2.3'
        };
        
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `工地数据_${new Date().toLocaleDateString('zh-CN')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addChangeLog('导出数据', '下载了JSON格式的数据文件');
        showSimpleToast('JSON数据下载成功！', 'success');
        
    } catch (error) {
        console.error('下载JSON数据失败:', error);
        alert('下载失败：' + error.message);
    }
}

function loadImagesZipOnly() {
    if (!canLoadImagesZipOnly()) {
        alert('您没有权限加载图片包！');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    
    input.onchange = async function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.zip')) {
            alert('请选择ZIP文件！');
            return;
        }
        
        try {
            if (typeof JSZip === 'undefined') {
                alert('JSZip库未加载，无法处理ZIP文件');
                return;
            }
            
            const zip = await JSZip.loadAsync(file);
            
            // 检查是否是包含图片的ZIP包
            const hasShujuFolder = zip.folder('shuju');
            if (!hasShujuFolder) {
                alert('ZIP包中没有找到图片文件夹（shuju）');
                return;
            }
            
            // 恢复图片文件
            const result = await restoreFilesFromZip(zip);
            
            if (result.restoredCount > 0) {
                alert(`图片恢复成功！\n恢复 ${result.restoredCount} 个文件`);
                
                // 刷新当前显示
                if (currentSiteId) {
                    const site = sites.find(s => s.id === currentSiteId);
                    if (site) {
                        loadSiteData(site);
                    }
                }
                
                addChangeLog('加载图片包', `从ZIP文件恢复了${result.restoredCount}个图片文件`);
            } else {
                alert('未找到可恢复的图片文件');
            }
            
        } catch (error) {
            console.error('加载图片包失败:', error);
            alert('加载失败：' + error.message);
        }
    };
    
    input.click();
}

// 暴露新函数到全局
window.downloadJsonData = downloadJsonData;
window.loadImagesZipOnly = loadImagesZipOnly;
// 然后在登录成功后调用这个函数
// 在 app.js 的登录事件处理中，登录成功后添加：
// updateTopButtonsByPermission();
// 暴露到全局
// 暴露函数到全局
// 暴露新函数到全局
window.downloadJsonDataWithImages = downloadJsonDataWithImages;
window.importJsonDataFromFile = importJsonDataFromFile;
window.downloadLightweightZip = downloadLightweightZip;
window.saveToJsFile = saveToJsFile;
window.loadFromJsFile = loadFromJsFile;
window.restoreFilesFromZip = restoreFilesFromZip;

window.saveSiteInfo = saveSiteInfo;
window.addTodo = addTodo;
window.addExpense = addExpense;
window.addRequirement = addRequirement;
window.addRepair = addRepair;
window.addWorker = addWorker;
window.addAddRemoveItem = addAddRemoveItem;
window.uploadDrawing = uploadDrawing;
window.addExperience = addExperience;
window.updateTodoStatus = updateTodoStatus;
window.updateRequirementStatus = updateRequirementStatus;
window.completeRepair = completeRepair;
window.updateRepairStatus = updateRepairStatus;
window.updateWorkerRating = updateWorkerRating;
window.editWorkerTime = editWorkerTime;
window.saveWorkerTime = saveWorkerTime;
window.previewRepairPhoto = previewRepairPhoto;
window.previewDrawing = previewDrawing;
window.changeRepairPhoto = changeRepairPhoto;
window.uploadNewRepairPhoto = uploadNewRepairPhoto;
window.changeDrawingFile = changeDrawingFile;
window.uploadNewDrawingFile = uploadNewDrawingFile;
window.saveQuote = saveQuote;
window.updateQuoteSummary = updateQuoteSummary;
window.updateAddRemoveSummary = updateAddRemoveSummary;
window.viewImage = viewImage;
window.hideImageViewer = hideImageViewer;
window.closeSiteModal = closeSiteModal;
window.downloadDrawing = downloadDrawing;
window.tryLoadMissingFile = tryLoadMissingFile;
window.updateFileData = updateFileData;
window.deleteSite = deleteSite;
window.switchTab = switchTab;
window.showAddSiteModal = showAddSiteModal;
window.showSiteDetails = showSiteDetails;
window.updateProgressValue = updateProgressValue;
window.logout = logout;
window.initTabs = initTabs;