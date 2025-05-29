// drawerModule.js - 抽屉功能模块

let drawerContainer = null;
let isDrawerOpen = false;

// 当前激活的路由配置
let currentRouteConfig = null;
let currentRouteName = null;

// 数据管理和功能实现
let currentPage = 1;
let totalPages = 3;

// 模拟题目数据
const mockData = {
  1: [
    { id: '001', title: '数学题目一', status: 'approved', type: '选择题' },
    { id: '002', title: '物理题目二', status: 'pending', type: '填空题' },
    { id: '003', title: '化学题目三', status: 'rejected', type: '解答题' },
    { id: '004', title: '英语题目四', status: 'draft', type: '阅读题' },
    { id: '005', title: '语文题目五', status: 'approved', type: '作文题' }
  ],
  2: [
    { id: '006', title: '数学题目六', status: 'pending', type: '选择题' },
    { id: '007', title: '物理题目七', status: 'approved', type: '计算题' },
    { id: '008', title: '化学题目八', status: 'draft', type: '实验题' },
    { id: '009', title: '英语题目九', status: 'rejected', type: '翻译题' },
    { id: '010', title: '语文题目十', status: 'pending', type: '阅读题' }
  ],
  3: [
    { id: '011', title: '数学题目十一', status: 'approved', type: '证明题' },
    { id: '012', title: '物理题目十二', status: 'approved', type: '应用题' },
    { id: '013', title: '化学题目十三', status: 'pending', type: '分析题' },
    { id: '014', title: '英语题目十四', status: 'draft', type: '写作题' },
    { id: '015', title: '语文题目十五', status: 'rejected', type: '古文题' }
  ]
};

// 获取状态对应的样式类
function getStatusBadgeClass(status) {
  const statusMap = {
    'approved': 'badge-success',
    'pending': 'badge-warning', 
    'rejected': 'badge-error',
    'draft': 'badge-info'
  };
  return statusMap[status] || 'badge-secondary';
}

// 获取状态显示文本
function getStatusText(status) {
  const statusMap = {
    'approved': '已审核',
    'pending': '待审核',
    'rejected': '需修改',
    'draft': '草稿'
  };
  return statusMap[status] || '未知';
}

// 加载表格数据
function loadTableData(page) {
  const tbody = document.getElementById('data-table-body');
  if (!tbody) return;
  
  const data = mockData[page] || [];
  
  tbody.innerHTML = data.map(item => `
    <tr class="hover:bg-base-200 cursor-pointer" onclick="window.selectQuestion('${item.id}')">
      <td class="font-mono text-sm">${item.id}</td>
      <td class="font-medium">${item.title}</td>
      <td>
        <span class="badge ${getStatusBadgeClass(item.status)} badge-sm">
          ${getStatusText(item.status)}
        </span>
      </td>
      <td class="text-sm text-gray-600">${item.type}</td>
    </tr>
  `).join('');
  
  currentPage = page;
  updatePagination();
}

// 更新翻页按钮状态
function updatePagination() {
  const buttons = document.querySelectorAll('.btn-group .btn[data-page]');
  buttons.forEach(btn => {
    const page = parseInt(btn.dataset.page);
    if (page === currentPage) {
      btn.classList.add('btn-active');
    } else {
      btn.classList.remove('btn-active');
    }
  });
  
  // 更新前后翻页按钮状态
  const prevBtn = document.querySelector('.btn-group .btn[onclick*="prev"]');
  const nextBtn = document.querySelector('.btn-group .btn[onclick*="next"]');
  
  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
    prevBtn.classList.toggle('btn-disabled', currentPage === 1);
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.classList.toggle('btn-disabled', currentPage === totalPages);
  }
}

// 翻页功能
function changePage(page) {
  if (page === 'prev') {
    if (currentPage > 1) {
      loadTableData(currentPage - 1);
    }
  } else if (page === 'next') {
    if (currentPage < totalPages) {
      loadTableData(currentPage + 1);
    }
  } else if (typeof page === 'number' && page >= 1 && page <= totalPages) {
    loadTableData(page);
  }
}

// 选择题目
function selectQuestion(questionId) {
  console.log('选择题目:', questionId);
  
  // 高亮选中的行
  const rows = document.querySelectorAll('#data-table-body tr');
  rows.forEach(row => row.classList.remove('bg-primary', 'text-primary-content'));
  
  const selectedRow = document.querySelector(`#data-table-body tr[onclick*="${questionId}"]`);
  if (selectedRow) {
    selectedRow.classList.add('bg-primary', 'text-primary-content');
  }
  
  // 更新下一题按钮状态
  const nextButton = document.querySelector('.btn-primary.btn-wide');
  if (nextButton) {
    nextButton.textContent = `处理题目 ${questionId} →`;
    nextButton.classList.remove('btn-disabled');
  }
}

// 下一题功能
function goToNextQuestion() {
  const selectedRow = document.querySelector('#data-table-body tr.bg-primary');
  if (!selectedRow) {
    alert('请先选择一个题目');
    return;
  }
  
  const currentQuestionId = selectedRow.onclick.toString().match(/'(\d+)'/)?.[1];
  console.log('处理题目:', currentQuestionId);
  
  // 模拟跳转到下一题
  const toast = document.createElement('div');
  toast.className = 'toast toast-top toast-center z-50';
  toast.innerHTML = `
    <div class="alert alert-success">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>正在处理题目 ${currentQuestionId}...</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
    // 这里可以添加实际的页面跳转逻辑
    console.log(`跳转到题目 ${currentQuestionId} 的编辑页面`);
  }, 2000);
}

// 检查URL并添加圆形按钮
function checkURLAndAddDrawerButton() {
  const currentURL = window.location.href;
  console.log('🔍 检查URL:', currentURL);
  
  // 直接判断URL是否匹配目标页面
  if (currentURL.includes('/edu-shop-web/#/question-task/audit-pool-edit')) {
    currentRouteName = 'audit-pool-edit';
    currentRouteConfig = {
      title: '题目数据面板',
      position: { bottom: 30, right: 30 }
    };
    
    console.log('✅ URL匹配成功: 审核池编辑页面');
    
    // 检查是否已经添加过按钮
    if (!document.getElementById('drawer-float-button')) {
      console.log('🔘 添加浮动按钮');
      addDrawerButton(currentRouteConfig);
    } else {
      console.log('⚠️ 按钮已存在');
    }
  } else {
    // 如果URL不匹配，移除按钮和抽屉
    console.log('❌ 无匹配路由，移除元素');
    currentRouteConfig = null;
    currentRouteName = null;
    removeDrawerElements();
  }
}

// 创建抽屉
function createDrawer() {
  if (drawerContainer || !currentRouteConfig) return;
  
  drawerContainer = document.createElement('div');
  drawerContainer.id = 'drawer-container';
  drawerContainer.className = 'drawer-container';
  
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.addEventListener('click', closeDrawer);
  
  // 创建抽屉内容 - 右侧抽屉
  const drawer = document.createElement('div');
  drawer.className = 'drawer-content';
  
  // 强制设置右侧定位样式
  drawer.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    right: -400px !important;
    left: auto !important;
    width: 400px !important;
    height: 100vh !important;
    background: white !important;
    z-index: 100001 !important;
    transition: right 0.3s ease !important;
    border-left: 1px solid #e5e7eb !important;
    box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1) !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  `;
  
  // 创建抽屉头部
  const header = createDrawerHeader(currentRouteConfig);
  
  // 创建抽屉主体内容
  const body = createDrawerBody(currentRouteConfig);
  
  drawer.appendChild(header);
  drawer.appendChild(body);
  
  drawerContainer.appendChild(overlay);
  drawerContainer.appendChild(drawer);
  
  document.body.appendChild(drawerContainer);
  
  // 更新时间
  updateLastUpdateTime();
}

// 创建抽屉头部
function createDrawerHeader(config) {
  const header = document.createElement('div');
  header.className = 'card-header flex items-center justify-between p-4 border-b border-base-300';
  header.innerHTML = `
    <div class="w-1 h-12 bg-base-300 rounded-full absolute top-1/2 left-2 transform -translate-y-1/2"></div>
    <h3 class="card-title text-lg font-bold text-primary">${config.title || '数据面板'}</h3>
    <button class="btn btn-sm btn-circle btn-ghost hover:btn-error" onclick="window.closeDrawer()">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;
  return header;
}

// 创建抽屉主体
function createDrawerBody(config) {
  const body = document.createElement('div');
  body.className = 'card-body p-4 flex flex-col h-full';
  
  // 创建 Tab 导航
  const tabNav = document.createElement('div');
  tabNav.className = 'tabs tabs-bordered mb-4';
  tabNav.innerHTML = `
    <a class="tab tab-active" data-tab="data">数据表格</a>
  `;
  
  // 创建 Tab 内容容器
  const tabContent = document.createElement('div');
  tabContent.className = 'tab-content flex-1 flex flex-col';
  
  // 数据表格 Tab
  const dataTab = createDataTab();
  dataTab.className = 'tab-pane active flex-1 flex flex-col';
  dataTab.id = 'tab-data';
  
  tabContent.appendChild(dataTab);
  
  body.appendChild(tabNav);
  body.appendChild(tabContent);
  
  // 添加 Tab 切换事件
  addTabEvents(tabNav);
  
  return body;
}

// 创建数据表格 Tab
function createDataTab() {
  const container = document.createElement('div');
  
  // 表格容器
  const tableContainer = document.createElement('div');
  tableContainer.className = 'overflow-x-auto flex-1 mb-4';
  
  const table = document.createElement('table');
  table.className = 'table table-compact table-zebra w-full';
  table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>标题</th>
        <th>状态</th>
        <th>类型</th>
      </tr>
    </thead>
    <tbody id="data-table-body">
      <!-- 数据将通过 JavaScript 动态生成 -->
    </tbody>
  `;
  
  tableContainer.appendChild(table);
  
  // 翻页按钮组
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'flex justify-center mb-4';
  
  const pagination = document.createElement('div');
  pagination.className = 'btn-group';
  pagination.innerHTML = `
    <button class="btn btn-sm" onclick="window.changePage('prev')">«</button>
    <button class="btn btn-sm btn-active" data-page="1" onclick="window.changePage(1)">1</button>
    <button class="btn btn-sm" data-page="2" onclick="window.changePage(2)">2</button>
    <button class="btn btn-sm" data-page="3" onclick="window.changePage(3)">3</button>
    <button class="btn btn-sm" onclick="window.changePage('next')">»</button>
  `;
  
  paginationContainer.appendChild(pagination);
  
  // 下一题按钮
  const nextButtonContainer = document.createElement('div');
  nextButtonContainer.className = 'flex justify-center';
  
  const nextButton = document.createElement('button');
  nextButton.className = 'btn btn-primary btn-wide';
  nextButton.innerHTML = '下一题 →';
  nextButton.onclick = () => {
    console.log('下一题按钮被点击');
    window.goToNextQuestion();
  };
  
  nextButtonContainer.appendChild(nextButton);
  
  container.appendChild(tableContainer);
  container.appendChild(paginationContainer);
  container.appendChild(nextButtonContainer);
  
  // 初始化表格数据
  loadTableData(1);
  
  return container;
}

// 添加 Tab 切换事件
function addTabEvents(tabNav) {
  const tabs = tabNav.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 移除所有活动状态
      tabs.forEach(t => t.classList.remove('tab-active'));
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.add('hidden');
        pane.classList.remove('active');
      });
      
      // 添加当前活动状态
      tab.classList.add('tab-active');
      const targetTab = document.getElementById(`tab-${tab.dataset.tab}`);
      if (targetTab) {
        targetTab.classList.remove('hidden');
        targetTab.classList.add('active');
      }
    });
  });
}

// 切换抽屉状态
function toggleDrawer() {
  if (isDrawerOpen) {
    closeDrawer();
  } else {
    openDrawer();
  }
}

// 打开抽屉
function openDrawer() {
  if (!drawerContainer) {
    createDrawer();
  }
  
  drawerContainer.classList.add('drawer-open');
  isDrawerOpen = true;
  
  // 强制设置抽屉位置到右侧
  const drawerContent = drawerContainer.querySelector('.drawer-content');
  if (drawerContent) {
    drawerContent.style.right = '0px';
    drawerContent.style.left = 'auto';
  }
  
  // 更新按钮状态
  const button = document.getElementById('drawer-float-button');
  if (button) {
    button.classList.add('active');
    button.style.transform = 'scale(1.05) rotate(45deg)';
  }
}

// 关闭抽屉
function closeDrawer() {
  if (drawerContainer) {
    drawerContainer.classList.remove('drawer-open');
    
    // 强制设置抽屉隐藏到右侧外部
    const drawerContent = drawerContainer.querySelector('.drawer-content');
    if (drawerContent) {
      drawerContent.style.right = '-400px';
      drawerContent.style.left = 'auto';
    }
  }
  isDrawerOpen = false;
  
  // 更新按钮状态
  const button = document.getElementById('drawer-float-button');
  if (button) {
    button.classList.remove('active');
    button.style.transform = 'scale(1)';
  }
}

// 移除抽屉相关元素
function removeDrawerElements() {
  const button = document.getElementById('drawer-float-button');
  if (button) {
    button.remove();
  }
  
  if (drawerContainer) {
    drawerContainer.remove();
    drawerContainer = null;
  }
  
  isDrawerOpen = false;
}

// 处理工具按钮点击
function handleToolClick(toolId) {
  console.log('Tool clicked:', toolId, 'on route:', currentRouteName);
  // 可以在这里添加具体的工具处理逻辑
  alert(`功能 "${toolId}" 暂未实现`);
}

// 更新最后更新时间
function updateLastUpdateTime() {
  const timeElement = document.getElementById('last-update');
  if (timeElement) {
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString();
  }
}

// 添加样式
function addDrawerStyles() {
  if (document.getElementById('drawer-styles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'drawer-styles';
  styles.textContent = `
    /* 浮动按钮激活状态 - 静态样式 */
    .drawer-float-button.active {
      transform: scale(1.05) rotate(45deg) !important;
      background: #f5576c !important;
    }
    
    /* 禁用所有动画 */
    .drawer-float-button.no-animation,
    .drawer-float-button:not(.active) {
      animation: none !important;
    }
    
    /* 抽屉容器样式 - 固定在整个视窗 */
    .drawer-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 100000;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }
    
    .drawer-container.drawer-open {
      pointer-events: all;
      opacity: 1;
      visibility: visible;
    }
    
    /* 遮罩层样式 */
    .drawer-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .drawer-container.drawer-open .drawer-overlay {
      opacity: 1;
    }
    
    /* 右侧抽屉样式 - 强制右侧定位 */
    .drawer-content {
      position: fixed !important;
      top: 0 !important;
      right: -400px !important;
      left: auto !important;
      width: 400px !important;
      height: 100vh !important;
      border-radius: 0 !important;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border-left: 1px solid #e5e7eb;
      border-right: none !important;
      background: white !important;
      box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1) !important;
      transition: right 0.3s ease !important;
      z-index: 100001 !important;
      margin-left: auto !important;
      margin-right: 0 !important;
      transform: translateX(0) !important;
    }
    
    .drawer-container.drawer-open .drawer-content {
      right: 0 !important;
      left: auto !important;
      transform: translateX(0) !important;
    }
    
    /* 额外确保右侧定位的样式 */
    .drawer-container .drawer-content {
      right: -400px !important;
      left: auto !important;
      margin-left: auto !important;
      margin-right: 0 !important;
    }
    
    .drawer-container.drawer-open .drawer-content {
      right: 0 !important;
      left: auto !important;
    }
    
    /* 响应式设计 - 确保在小屏幕上也在右侧 */
    @media (max-width: 768px) {
      .drawer-content {
        width: calc(100% - 2rem) !important;
        right: calc(-100% + 2rem) !important;
      }
      
      .drawer-container.drawer-open .drawer-content {
        right: 0 !important;
      }
      
      .drawer-float-button {
        bottom: 20px !important;
        right: 20px !important;
        width: 50px !important;
        height: 50px !important;
      }
      
      .drawer-float-button svg {
        width: 24px !important;
        height: 24px !important;
      }
    }
    
    @media (max-width: 480px) {
      .drawer-content {
        width: 100% !important;
        right: -100% !important;
      }
      
      .drawer-container.drawer-open .drawer-content {
        right: 0 !important;
      }
    }
    
    /* 确保浮动按钮始终可见 - 关键样式 */
    #drawer-float-button {
      position: fixed !important;
      pointer-events: auto !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
    }
    
    #drawer-float-button:hover {
      cursor: pointer !important;
    }
    
    /* 表格滚动优化 - 补充DaisyUI */
    .overflow-x-auto {
      scrollbar-width: thin;
      scrollbar-color: rgba(0,0,0,0.2) transparent;
    }
    
    .overflow-x-auto::-webkit-scrollbar {
      height: 6px;
    }
    
    .overflow-x-auto::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.2);
      border-radius: 3px;
    }
    
    .overflow-x-auto::-webkit-scrollbar-thumb:hover {
      background: rgba(0,0,0,0.3);
    }
    
    /* 确保抽屉内容不被其他元素遮挡 */
    .drawer-content * {
      position: relative;
      z-index: 1;
    }
  `;
  
  document.head.appendChild(styles);
}

// 添加圆形浮动按钮
function addDrawerButton(config) {
  // 创建浮动按钮
  const floatButton = document.createElement('div');
  floatButton.id = 'drawer-float-button';
  floatButton.className = 'btn btn-circle btn-primary fixed shadow-lg no-animation';
  
  // 设置按钮的基本样式
  floatButton.style.cssText = `
    z-index: 999999 !important;
    width: 60px !important;
    height: 60px !important;
    background: #667eea !important;
    border: 2px solid rgba(255, 255, 255, 0.2) !important;
  `;
  
  floatButton.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: white;">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `;
  
  // 设置按钮位置
  if (config.position) {
    floatButton.style.bottom = `${config.position.bottom}px`;
    floatButton.style.right = `${config.position.right}px`;
  }
  
  // 添加点击事件
  floatButton.addEventListener('click', toggleDrawer);
  
  // 添加简单的悬停效果
  floatButton.addEventListener('mouseenter', () => {
    floatButton.style.transform = 'scale(1.05)';
  });
  
  floatButton.addEventListener('mouseleave', () => {
    if (!floatButton.classList.contains('active')) {
      floatButton.style.transform = 'scale(1)';
    }
  });
  
  // 添加样式
  addDrawerStyles();
  
  // 添加到页面
  document.body.appendChild(floatButton);
  
  console.log('✅ 浮动按钮已添加到页面');
}

// 导出模块函数
export {
  checkURLAndAddDrawerButton,
  toggleDrawer,
  openDrawer,
  closeDrawer,
  removeDrawerElements
}; 