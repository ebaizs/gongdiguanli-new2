// 修复脚本 - 解决页面显示和权限问题

document.addEventListener('DOMContentLoaded', function() {
    console.log('运行修复脚本...');
    
    // 修复权限配置
    setTimeout(function() {
        if (window.PERMISSION_CONFIG) {
            console.log('修复权限配置...');
            
            // 确保 availableTabs 存在
            if (!window.PERMISSION_CONFIG.availableTabs) {
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
            }
            
            // 确保测试用户有权限
            if (window.PERMISSION_CONFIG.userPermissions['1']) {
                window.PERMISSION_CONFIG.userPermissions['1'].permissions.viewAllTabs = true;
                window.PERMISSION_CONFIG.userPermissions['1'].permissions.viewAllSites = true;
                window.PERMISSION_CONFIG.userPermissions['1'].permissions.addSite = true;
                window.PERMISSION_CONFIG.userPermissions['1'].permissions.addItems = true;
            }
            
            console.log('权限配置修复完成');
        }
    }, 500);
    
    // 监听登录成功
    const originalLoginHandler = document.getElementById('loginForm').onsubmit;
    document.getElementById('loginForm').onsubmit = async function(e) {
        e.preventDefault();
        
        // 执行原始登录逻辑
        if (originalLoginHandler) {
            await originalLoginHandler.call(this, e);
        }
        
        // 登录后重新初始化标签页
        setTimeout(function() {
            if (window.currentUser && typeof window.initTabs === 'function') {
                console.log('登录后重新初始化标签页');
                window.initTabs();
            }
        }, 100);
    };
    
    console.log('修复脚本加载完成');
});