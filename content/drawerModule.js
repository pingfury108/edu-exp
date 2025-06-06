// drawerModule.js - 抽屉功能模块

// 全局API函数变量
let getMyAuditTaskList = null;
let getMyProduceTaskList = null;
let dropProduceTask = null;

// 初始化API函数
async function initializeAPI() {
  try {
    // 优先从全局作用域获取API函数
    if (window.getMyAuditTaskList && window.getMyProduceTaskList && window.dropProduceTask) {
      getMyAuditTaskList = window.getMyAuditTaskList;
      getMyProduceTaskList = window.getMyProduceTaskList;
      dropProduceTask = window.dropProduceTask;
      console.log('✅ 从全局作用域获取API函数成功');
      return;
    }
    
    // 如果全局作用域没有，尝试动态导入
    const libModule = await import('../lib.js');
    getMyAuditTaskList = libModule.getMyAuditTaskList;
    getMyProduceTaskList = libModule.getMyProduceTaskList;
    dropProduceTask = libModule.dropProduceTask;
    console.log('✅ 动态导入API函数成功');
  } catch (error) {
    console.error('❌ API函数初始化失败:', error);
  }
}

// 立即初始化API
initializeAPI();

// 添加延迟初始化，确保全局函数已设置
setTimeout(() => {
  if (!getMyAuditTaskList || !getMyProduceTaskList || !dropProduceTask) {
    console.log('🔄 延迟重新初始化API函数...');
    initializeAPI();
  }
}, 1000);

let drawerContainer = null;
let isDrawerOpen = false;

// 当前激活的路由配置
let currentRouteConfig = null;
let currentRouteName = null;

// 数据管理和功能实现
let currentPage = 1;
let totalPages = 1;
let totalRecords = 0;
let pageSize = 20; // 默认值，将被动态计算覆盖

// 存储当前数据
let currentData = [];

// 存储两种状态的数据统计
let state1Records = 0;
let state4Records = 0;

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

// 获取URL中的查询参数
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
  return urlParams.get(name) || hashParams.get(name);
}

// 获取当前任务ID
function getCurrentTaskId() {
  return getUrlParameter('taskid');
}

// 获取当前线索ID (如果URL中有的话)
function getCurrentClueId() {
  return getUrlParameter('clueID');
}

// 获取当前任务的完整信息
function getCurrentTaskInfo() {
  const taskId = getCurrentTaskId();
  const clueId = getCurrentClueId();
  return {
    taskId,
    clueId,
    hasTaskId: !!taskId,
    hasClueId: !!clueId
  };
}

// 高亮当前任务 - 增强版本，支持 taskId 和 clueID 双重匹配
function highlightCurrentTask(taskInfo = null) {
  // 如果没有传入参数，自动获取当前任务信息
  if (!taskInfo) {
    taskInfo = getCurrentTaskInfo();
  }
  
  console.log('🎯 开始高亮当前任务，输入参数:', taskInfo);
  console.log('🎯 当前路由名称:', currentRouteName);
  
  // 如果既没有 taskId 也没有 clueId，直接返回
  if (!taskInfo.hasTaskId && !taskInfo.hasClueId) {
    console.log('📋 未检测到 taskid 或 clueID 参数，将显示所有数据');
    return false;
  }
  
  // 移除之前的高亮
  const previousHighlight = document.querySelector('#data-table-body tr.current-task');
  if (previousHighlight) {
    console.log('🔄 移除之前的高亮:', previousHighlight.dataset.taskId);
    previousHighlight.classList.remove('current-task');
  }
  
  let currentTaskRow = null;
  let matchCriteria = '';
  
  // 先检查数据表格是否存在
  const tableBody = document.getElementById('data-table-body');
  if (!tableBody) {
    console.error('❌ 数据表格不存在');
    return false;
  }
  
  // 检查表格中的所有行，用于调试
  const allRows = tableBody.querySelectorAll('tr[data-task-id]');
  console.log(`🔍 表格中共有 ${allRows.length} 行数据`);
  
  if (allRows.length > 0) {
    console.log('🔍 表格中的任务列表（排序后）:');
    allRows.forEach((row, index) => {
      const rowTaskId = row.getAttribute('data-task-id');
      const rowClueId = row.getAttribute('data-clue-id');
      const rowState = row.getAttribute('data-state');
      console.log(`  行 ${index + 1}: taskID=${rowTaskId}, clueID=${rowClueId}, state=${rowState}`);
    });
  }
  
  // 优先使用 taskId 匹配，然后使用 clueId 匹配
  if (taskInfo.hasTaskId) {
    console.log(`🔍 使用 taskId 查找: ${taskInfo.taskId}`);
    currentTaskRow = document.querySelector(`#data-table-body tr[data-task-id="${taskInfo.taskId}"]`);
    matchCriteria = `taskId: ${taskInfo.taskId}`;
    console.log(`🔍 taskId 匹配结果:`, currentTaskRow ? '找到' : '未找到');
    
    // 如果找到了匹配的任务行，验证其他信息
    if (currentTaskRow) {
      const rowTaskId = currentTaskRow.getAttribute('data-task-id');
      const rowClueId = currentTaskRow.getAttribute('data-clue-id');
      const rowState = currentTaskRow.getAttribute('data-state');
      
      console.log(`🔍 找到的任务行详情: taskID=${rowTaskId}, clueID=${rowClueId}, state=${rowState}`);
      
      // 如果同时有 clueId，验证是否匹配
      if (taskInfo.hasClueId) {
        console.log(`🔍 验证 clueId: 期望=${taskInfo.clueId}, 实际=${rowClueId}`);
        if (rowClueId && rowClueId !== taskInfo.clueId) {
          console.warn(`⚠️ 任务ID ${taskInfo.taskId} 匹配，但线索ID不匹配: 期望 ${taskInfo.clueId}, 实际 ${rowClueId}`);
          // 可以选择是否继续高亮，这里选择继续，但给出警告
        }
        matchCriteria += `, clueId: ${taskInfo.clueId}`;
      }
    }
  } else if (taskInfo.hasClueId) {
    // 如果只有 clueId，通过 clueId 匹配
    console.log(`🔍 使用 clueId 查找: ${taskInfo.clueId}`);
    currentTaskRow = document.querySelector(`#data-table-body tr[data-clue-id="${taskInfo.clueId}"]`);
    matchCriteria = `clueId: ${taskInfo.clueId}`;
    console.log(`🔍 clueId 匹配结果:`, currentTaskRow ? '找到' : '未找到');
  }
  
  if (currentTaskRow) {
    currentTaskRow.classList.add('current-task');
    console.log(`✅ 高亮当前任务成功 (${matchCriteria})`);
    console.log(`✅ 高亮的行:`, currentTaskRow);
    
    // 获取当前任务在列表中的位置信息
    const allTaskRows = tableBody.querySelectorAll('tr[data-task-id]');
    const currentTaskIndex = Array.from(allTaskRows).indexOf(currentTaskRow);
    console.log(`📍 当前任务在排序后列表中的位置: 第 ${currentTaskIndex + 1} 行 / 共 ${allTaskRows.length} 行`);
    console.log(`📍 当前页码: ${currentPage} / 共 ${totalPages} 页`);
    
    // 滚动到当前任务位置
    const tableContainer = currentTaskRow.closest('.overflow-auto');
    if (tableContainer) {
      setTimeout(() => {
        currentTaskRow.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        console.log(`🎯 已滚动到当前任务位置`);
      }, 100);
    }
    
    return true;
  }
  
  console.log(`📋 当前页面未找到匹配任务 (${matchCriteria})，显示所有数据`);
  console.log(`📋 可能的原因: 
    1. 任务不在当前页面（当前第 ${currentPage} 页）
    2. API返回的数据结构不同
    3. taskID或clueID不匹配
    4. 任务在其他页面中`);
  return false;
}

// 加载表格数据
async function loadTableData(page = 1) {
  const tbody = document.getElementById('data-table-body');
  if (!tbody) return;
  
  // 检查API函数是否可用
  if (!getMyAuditTaskList || !getMyProduceTaskList || !dropProduceTask) {
    console.warn('⚠️ API函数未初始化，尝试重新初始化...');
    await initializeAPI();
    
    // 如果仍然不可用，显示错误
    if (!getMyAuditTaskList || !getMyProduceTaskList || !dropProduceTask) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-8">
            <div class="text-error mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              API函数未初始化
            </div>
            <div class="text-sm text-gray-500 mb-4">无法加载数据，请检查扩展配置</div>
            <button class="btn btn-sm btn-primary" data-action="retry-load" data-page="${page}">
              重试
            </button>
          </td>
        </tr>
      `;
      
      // 为重试按钮添加事件监听器
      const retryBtn = tbody.querySelector('[data-action="retry-load"]');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          const retryPage = parseInt(retryBtn.dataset.page) || 1;
          loadTableData(retryPage);
        });
      }
      return;
    }
  }
  
  // 显示加载状态
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="text-center py-8">
        <div class="loading loading-spinner loading-md"></div>
        <div class="mt-2">正在加载数据...</div>
      </td>
    </tr>
  `;
  
  try {
    console.log('🔄 开始请求数据...', { page, pageSize, currentRouteName });
    
    // 根据当前页面类型选择API函数
    const apiFunction = currentRouteName === 'lead-pool-edit' ? getMyProduceTaskList : getMyAuditTaskList;
    
    // 同时请求state为1和state为4的数据
    const [response1, response4] = await Promise.all([
      apiFunction({
        pn: page,
        rn: pageSize,
        clueID: '',
        clueType: '',
        step: '',
        subject: '',
        state: 1
      }),
      apiFunction({
        pn: page,
        rn: pageSize,
        clueID: '',
        clueType: '',
        step: '',
        subject: '',
        state: 4
      })
    ]);
    
    console.log('📡 State 1 API响应:', response1);
    console.log('📡 State 4 API响应:', response4);
    
    // 验证两个响应都是有效的
    if ((response1 && response1.errno === 0 && response1.data) ||
        (response4 && response4.errno === 0 && response4.data)) {
      
      // 提取数据列表
      const list1 = (response1 && response1.errno === 0 && response1.data) ? response1.data.list || [] : [];
      const list4 = (response4 && response4.errno === 0 && response4.data) ? response4.data.list || [] : [];
      
      // 合并两个状态的数据
      const combinedList = [...list1, ...list4];
      
      // 为数据项添加状态标识，便于区分
      const processedList = combinedList.map(item => ({
        ...item,
        originalState: list1.includes(item) ? 1 : 4
      }));
      
      // 稳定排序：多重排序条件确保同一任务位置一致
      processedList.sort((a, b) => {
        // 第一排序条件：按 taskID 数字排序（升序）
        const taskIdA = parseInt(a.taskID) || 0;
        const taskIdB = parseInt(b.taskID) || 0;
        if (taskIdA !== taskIdB) {
          return taskIdA - taskIdB;
        }
        
        // 第二排序条件：按 clueID 字符串排序（确保相同taskID时位置稳定）
        const clueIdComparison = (a.clueID || '').localeCompare(b.clueID || '');
        if (clueIdComparison !== 0) {
          return clueIdComparison;
        }
        
        // 第三排序条件：按 originalState 排序（state 1 在前，state 4 在后）
        if (a.originalState !== b.originalState) {
          return a.originalState - b.originalState;
        }
        
        // 第四排序条件：按 stepName 排序（确保完全稳定）
        const stepNameComparison = (a.stepName || '').localeCompare(b.stepName || '');
        if (stepNameComparison !== 0) {
          return stepNameComparison;
        }
        
        // 第五排序条件：按 subjectName 排序（最终保证）
        return (a.subjectName || '').localeCompare(b.subjectName || '');
      });
      
      console.log('📊 数据已按多重条件稳定排序:', {
        firstFew: processedList.slice(0, 3).map(item => ({
          taskID: item.taskID,
          clueID: item.clueID,
          state: item.originalState,
          stepName: item.stepName,
          subjectName: item.subjectName
        })),
        totalCount: processedList.length
      });
      
      // 计算总记录数（两个状态的数据总和）
      const total1 = (response1 && response1.errno === 0 && response1.data) ? response1.data.total || 0 : 0;
      const total4 = (response4 && response4.errno === 0 && response4.data) ? response4.data.total || 0 : 0;
      const combinedTotal = total1 + total4;
      
      // 更新分页信息
      totalRecords = combinedTotal;
      totalPages = Math.ceil(combinedTotal / pageSize);
      currentData = processedList;
      currentPage = page;
      
      // 更新状态统计信息
      state1Records = total1;
      state4Records = total4;
      
      console.log('📊 合并数据统计:', { 
        total1, 
        total4, 
        combinedTotal, 
        totalPages, 
        currentPage, 
        dataLength: currentData.length 
      });
      
      // 渲染数据
      if (currentData.length > 0) {
        // 根据当前页面类型决定按钮文本和操作
        const buttonText = currentRouteName === 'lead-pool-edit' ? '生产' : '审核';
        const actionType = currentRouteName === 'lead-pool-edit' ? 'edit-task' : 'audit-task';
        
        console.log('🔧 表格按钮配置:', { currentRouteName, buttonText, actionType });
        
        tbody.innerHTML = currentData.map(item => `
          <tr class="hover:bg-base-200" data-task-id="${item.taskID}" data-clue-id="${item.clueID}" data-state="${item.originalState}">
            <td class="font-mono text-sm">${item.clueID}</td>
            <td class="font-medium max-w-xs truncate" title="${item.brief.replace(/\n/g, ' ')}">${item.brief.replace(/\n/g, ' ').substring(0, 50)}${item.brief.length > 50 ? '...' : ''}</td>
            <td class="text-sm">${item.stepName}</td>
            <td class="text-sm">${item.subjectName}</td>
            <td>
              <div class="flex items-center gap-2">
                <span class="badge badge-xs ${item.originalState === 1 ? 'badge-primary' : 'badge-secondary'}" title="状态: ${item.originalState}">
                  ${item.originalState === 1 ? 'S1' : 'S4'}
                </span>
                <button class="btn btn-primary btn-sm" data-action="${actionType}" data-task-id="${item.taskID}" data-clue-id="${item.clueID}">
                  ${buttonText}
                </button>
              </div>
            </td>
          </tr>
        `).join('');
        
        // 为操作按钮添加事件监听器
        const actionButtons = tbody.querySelectorAll(`[data-action="${actionType}"]`);
        actionButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            if (actionType === 'edit-task') {
              const taskId = btn.dataset.taskId;
              editTask(taskId);
            } else {
              const taskId = btn.dataset.taskId;
              auditTask(taskId);
            }
          });
        });
        
        // 验证并确保表格中的按钮文本正确
        actionButtons.forEach((btn, index) => {
          if (btn.textContent.trim() !== buttonText) {
            console.warn(`⚠️ 检测到按钮文本错误，第${index + 1}个按钮文本为: "${btn.textContent.trim()}"，应该为: "${buttonText}"`);
            btn.textContent = buttonText; // 强制修正按钮文本
          }
        });
        console.log(`✅ 表格中共生成 ${actionButtons.length} 个"${buttonText}"按钮`);
        
        // 为表格行添加点击事件，用于选择
        const tableRows = tbody.querySelectorAll('tr[data-task-id]');
        tableRows.forEach(row => {
          row.addEventListener('click', () => {
            const taskId = row.dataset.taskId;
            selectQuestion(taskId);
          });
        });
        
        // 高亮当前任务（如果在当前页面）
        const currentTaskInfo = getCurrentTaskInfo();
        if (currentTaskInfo.hasTaskId || currentTaskInfo.hasClueId) {
          console.log(`🎯 检测到当前任务信息:`, currentTaskInfo);
          console.log(`🎯 当前页面类型: ${currentRouteName}`);
          console.log(`🎯 数据加载完成，尝试在当前页面高亮任务`);
          setTimeout(() => {
            const highlightResult = highlightCurrentTask(currentTaskInfo);
            if (highlightResult) {
              console.log(`✅ 在当前页面找到并高亮了任务`);
            } else {
              console.log(`📋 当前页面没有该任务，需要手动翻页查找`);
            }
          }, 100);
        } else {
          console.log('📋 当前URL中没有taskid或clueID参数');
        }
        
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center py-8 text-gray-500">
              暂无数据
            </td>
          </tr>
        `;
      }
      
      // 更新分页控件
      updatePagination();
      
      // 更新数据统计信息
      updateDataStats();
      
      // 触发pageSize重新计算
      triggerPageSizeRecalculation();
      
    } else {
      throw new Error('两个状态的数据都请求失败');
    }
    
  } catch (error) {
    console.error('❌ 加载数据失败:', error);
    
    // 显示错误状态
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-8">
          <div class="text-error mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            加载失败
          </div>
          <div class="text-sm text-gray-500 mb-4">${error.message}</div>
          <button class="btn btn-sm btn-primary" data-action="reload" data-page="${page}">
            重新加载
          </button>
        </td>
      </tr>
    `;
    
    // 为重新加载按钮添加事件监听器
    const reloadBtn = tbody.querySelector('[data-action="reload"]');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        const reloadPage = parseInt(reloadBtn.dataset.page) || 1;
        loadTableData(reloadPage);
      });
    }
    
    // 即使加载失败也调整高度
    setTimeout(() => {
      adjustTableHeight();
    }, 100);
  }
}

// 审核任务功能
function auditTask(taskID) {
  console.log('审核任务:', taskID);
  
  // 修改当前访问路径
  const newPath = `/edu-shop-web/#/question-task/audit-pool-edit?taskid=${taskID}`;
  
  // 先关闭抽屉，提升用户体验
  closeDrawer();
  
  // 显示提示信息
  const toast = document.createElement('div');
  toast.className = 'toast toast-top toast-center z-50';
  toast.innerHTML = `
    <div class="alert alert-info">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>正在跳转到审核页面 (任务ID: ${taskID})...</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // 延迟一小段时间显示提示，然后强制刷新页面
  setTimeout(() => {
    toast.remove();
    console.log(`跳转到审核页面: ${newPath}`);
    
    // 先替换URL到新页面
    window.location.replace(newPath);
    
    // 然后执行强制刷新，确保页面完全重新加载
    setTimeout(() => {
      window.location.reload();
    }, 100); // 短暂延迟确保URL替换完成
  }, 800); // 减少等待时间，提升用户体验
}

// 编辑任务功能
function editTask(taskID) {
  console.log('编辑任务:', taskID);
  
  // 修改当前访问路径
  const newPath = `/edu-shop-web/#/question-task/lead-pool-edit?taskid=${taskID}`;
  
  // 先关闭抽屉，提升用户体验
  closeDrawer();
  
  // 显示提示信息
  const toast = document.createElement('div');
  toast.className = 'toast toast-top toast-center z-50';
  toast.innerHTML = `
    <div class="alert alert-info">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>正在跳转到编辑页面 (任务ID: ${taskID})...</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // 延迟一小段时间显示提示，然后强制刷新页面
  setTimeout(() => {
    toast.remove();
    console.log(`跳转到编辑页面: ${newPath}`);
    
    // 先替换URL到新页面
    window.location.replace(newPath);
    
    // 然后执行强制刷新，确保页面完全重新加载
    setTimeout(() => {
      window.location.reload();
    }, 100); // 短暂延迟确保URL替换完成
  }, 800); // 减少等待时间，提升用户体验
}

// 更新翻页按钮状态
function updatePagination() {
  const paginationContainer = document.querySelector('.btn-group');
  if (!paginationContainer) return;
  
  // 重新生成分页按钮
  let paginationHTML = `<button class="btn btn-sm" data-action="page-prev">«</button>`;
  
  // 计算显示的页码范围
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  // 如果结束页码不足5个，调整开始页码
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  // 如果不是从第1页开始，显示第1页和省略号
  if (startPage > 1) {
    paginationHTML += `<button class="btn btn-sm" data-action="page-number" data-page="1">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<button class="btn btn-sm btn-disabled">...</button>`;
    }
  }
  
  // 显示页码按钮
  for (let i = startPage; i <= endPage; i++) {
    const activeClass = i === currentPage ? 'btn-active' : '';
    paginationHTML += `<button class="btn btn-sm ${activeClass}" data-action="page-number" data-page="${i}">${i}</button>`;
  }
  
  // 如果不是到最后一页，显示省略号和最后一页
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<button class="btn btn-sm btn-disabled">...</button>`;
    }
    paginationHTML += `<button class="btn btn-sm" data-action="page-number" data-page="${totalPages}">${totalPages}</button>`;
  }
  
  paginationHTML += `<button class="btn btn-sm" data-action="page-next">»</button>`;
  
  paginationContainer.innerHTML = paginationHTML;
  
  // 为分页按钮添加事件监听器
  const pageButtons = paginationContainer.querySelectorAll('button[data-action]');
  pageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'page-prev') {
        changePage('prev');
      } else if (action === 'page-next') {
        changePage('next');
      } else if (action === 'page-number') {
        const page = parseInt(btn.dataset.page);
        changePage(page);
      }
    });
  });
  
  // 更新前后翻页按钮状态
  const prevBtn = paginationContainer.querySelector('[data-action="page-prev"]');
  const nextBtn = paginationContainer.querySelector('[data-action="page-next"]');
  
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
function selectQuestion(taskId) {
  console.log('选择任务:', taskId);
  
  // 移除之前的选中状态（但保留当前任务的高亮）
  const rows = document.querySelectorAll('#data-table-body tr');
  rows.forEach(row => {
    if (!row.classList.contains('current-task')) {
      row.classList.remove('bg-primary', 'text-primary-content');
    }
  });
  
  // 高亮选中的行（如果不是当前任务）
  const selectedRow = document.querySelector(`#data-table-body tr[data-task-id="${taskId}"]`);
  if (selectedRow && !selectedRow.classList.contains('current-task')) {
    selectedRow.classList.add('bg-primary', 'text-primary-content');
  }
  
  // 注意：表格中的操作按钮应该始终保持为"审核"或"生产"，不需要修改
  // 只有抽屉底部的下一题按钮需要保持状态
}

// 下一题功能 - 修改为找到当前任务的下一个任务
function goToNextQuestion() {
  const currentTaskInfo = getCurrentTaskInfo();
  
  // 根据当前页面类型决定操作类型
  const actionType = currentRouteName === 'lead-pool-edit' ? 'edit-task' : 'audit-task';
  
  // 如果没有当前任务信息，选择第一个任务
  if (!currentTaskInfo.hasTaskId && !currentTaskInfo.hasClueId) {
    const firstRow = document.querySelector('#data-table-body tr[data-task-id]');
    if (!firstRow) {
      alert('暂无数据可处理');
      return;
    }
    
    const firstTaskButton = firstRow.querySelector(`[data-action="${actionType}"]`);
    if (firstTaskButton) {
      if (actionType === 'edit-task') {
        const taskId = firstTaskButton.dataset.taskId;
        console.log('处理第一个任务:', taskId);
        editTask(taskId);
      } else {
        const taskId = firstTaskButton.dataset.taskId;
        console.log('处理第一个任务:', taskId);
        auditTask(taskId);
      }
      return;
    }
    
    alert('无法获取任务信息');
    return;
  }
  
  // 找到当前任务在列表中的位置
  let currentTaskRow = null;
  if (currentTaskInfo.hasTaskId) {
    currentTaskRow = document.querySelector(`#data-table-body tr[data-task-id="${currentTaskInfo.taskId}"]`);
  } else if (currentTaskInfo.hasClueId) {
    currentTaskRow = document.querySelector(`#data-table-body tr[data-clue-id="${currentTaskInfo.clueId}"]`);
  }
  
  if (!currentTaskRow) {
    // 如果当前任务不在当前页面，选择第一个任务
    const firstRow = document.querySelector('#data-table-body tr[data-task-id]');
    if (!firstRow) {
      alert('暂无数据可处理');
      return;
    }
    
    const firstTaskButton = firstRow.querySelector(`[data-action="${actionType}"]`);
    if (firstTaskButton) {
      if (actionType === 'edit-task') {
        const taskId = firstTaskButton.dataset.taskId;
        console.log('当前任务不在此页面，处理第一个任务:', taskId);
        editTask(taskId);
      } else {
        const taskId = firstTaskButton.dataset.taskId;
        console.log('当前任务不在此页面，处理第一个任务:', taskId);
        auditTask(taskId);
      }
      return;
    }
    
    alert('无法获取任务信息');
    return;
  }
  
  // 找到下一个任务
  const nextTaskRow = currentTaskRow.nextElementSibling;
  if (nextTaskRow && nextTaskRow.hasAttribute('data-task-id')) {
    // 如果有下一个任务，处理下一个任务
    const nextTaskButton = nextTaskRow.querySelector(`[data-action="${actionType}"]`);
    if (nextTaskButton) {
      if (actionType === 'edit-task') {
        const nextTaskId = nextTaskButton.dataset.taskId;
        console.log('处理下一个任务:', nextTaskId);
        editTask(nextTaskId);
      } else {
        const nextTaskId = nextTaskButton.dataset.taskId;
        console.log('处理下一个任务:', nextTaskId);
        auditTask(nextTaskId);
      }
      return;
    }
  }
  
  // 如果当前任务是最后一个，尝试翻到下一页
  if (currentPage < totalPages) {
    console.log('当前任务是最后一个，翻到下一页');
    // 翻到下一页后，处理第一个任务
    loadTableData(currentPage + 1).then(() => {
      setTimeout(() => {
        const firstRowInNewPage = document.querySelector('#data-table-body tr[data-task-id]');
        if (firstRowInNewPage) {
          const firstTaskButton = firstRowInNewPage.querySelector(`[data-action="${actionType}"]`);
          if (firstTaskButton) {
            if (actionType === 'edit-task') {
              const taskId = firstTaskButton.dataset.taskId;
              console.log('下一页第一个任务:', taskId);
              editTask(taskId);
            } else {
              const taskId = firstTaskButton.dataset.taskId;
              console.log('下一页第一个任务:', taskId);
              auditTask(taskId);
            }
          }
        }
      }, 100);
    });
  } else {
    // 如果已经是最后一页的最后一个任务，提示用户
    alert('已经是最后一个任务了');
  }
}

// 处理残缺废弃任务
async function handleDropProduceTask() {
  const currentTaskInfo = getCurrentTaskInfo();
  
  // 检查是否有当前任务ID
  if (!currentTaskInfo.hasTaskId) {
    alert('无法获取当前任务ID，请先选择一个任务');
    return;
  }
  
  const taskId = currentTaskInfo.taskId;
  
  // 确认操作
  if (!confirm(`确定要废弃任务 ${taskId} 吗？`)) {
    return;
  }
  
  // 检查dropProduceTask函数是否可用
  if (!dropProduceTask) {
    console.error('❌ dropProduceTask函数未初始化');
    alert('功能未初始化，请稍后重试');
    return;
  }
  
  try {
    console.log('开始废弃任务:', taskId);
    
    // 显示加载提示
    const loadingToast = document.createElement('div');
    loadingToast.className = 'toast toast-top toast-center z-50';
    loadingToast.innerHTML = `
      <div class="alert alert-info">
        <span class="loading loading-spinner loading-sm"></span>
        <span>正在废弃任务 ${taskId}...</span>
      </div>
    `;
    document.body.appendChild(loadingToast);
    
    // 调用废弃任务API
    const result = await dropProduceTask(taskId);
    
    // 移除加载提示
    loadingToast.remove();
    
    console.log('废弃任务结果:', result);
    
    // 检查结果
    if (result && result.errno === 0) {
      // 显示成功提示
      const successToast = document.createElement('div');
      successToast.className = 'toast toast-top toast-center z-50';
      successToast.innerHTML = `
        <div class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>任务 ${taskId} 废弃成功</span>
        </div>
      `;
      document.body.appendChild(successToast);
      
      // 3秒后移除成功提示
      setTimeout(() => {
        successToast.remove();
      }, 3000);
      
      // 刷新数据并自动跳转到下一题
      console.log('废弃成功，刷新数据并跳转下一题');
      await loadTableData(currentPage);
      
      // 延迟执行下一题，确保数据已刷新
      setTimeout(() => {
        goToNextQuestion();
      }, 500);
      
    } else {
      throw new Error(result ? result.errmsg || '废弃失败' : '废弃失败');
    }
    
  } catch (error) {
    console.error('❌ 废弃任务失败:', error);
    
    // 显示错误提示
    const errorToast = document.createElement('div');
    errorToast.className = 'toast toast-top toast-center z-50';
    errorToast.innerHTML = `
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>废弃任务失败: ${error.message}</span>
      </div>
    `;
    document.body.appendChild(errorToast);
    
    // 5秒后移除错误提示
    setTimeout(() => {
      errorToast.remove();
    }, 5000);
  }
}

// 刷新数据
function refreshData() {
  loadTableData(currentPage);
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

// 检查URL并添加圆形按钮
function checkURLAndAddDrawerButton() {
  const currentURL = window.location.href;
  console.log('🔍 检查URL:', currentURL);
  
  // 检查是否匹配审核池编辑页面
  if (currentURL.includes('/edu-shop-web/#/question-task/audit-pool-edit')) {
    currentRouteName = 'audit-pool-edit';
    currentRouteConfig = {
      title: 'edu-exp',
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
  } 
  // 检查是否匹配生产任务编辑页面
  else if (currentURL.includes('/edu-shop-web/#/question-task/lead-pool-edit')) {
    currentRouteName = 'lead-pool-edit';
    currentRouteConfig = {
      title: 'edu-exp',
      position: { bottom: 30, right: 30 }
    };
    
    console.log('✅ URL匹配成功: 生产任务编辑页面');
    
    // 检查是否已经添加过按钮
    if (!document.getElementById('drawer-float-button')) {
      console.log('🔘 添加浮动按钮');
      addDrawerButton(currentRouteConfig);
    } else {
      console.log('⚠️ 按钮已存在');
    }
  } 
  else {
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
  
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.addEventListener('click', (e) => {
    // 确保点击的不是浮动按钮
    if (e.target === overlay) {
      closeDrawer();
    }
  });
  
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
    z-index: 100002 !important;
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
  
  // 确保浮动按钮在抽屉之后添加，保持在最上层
  const floatButton = document.getElementById('drawer-float-button');
  if (floatButton) {
    document.body.appendChild(floatButton);
  }
  
  // 更新时间
  updateLastUpdateTime();
  
  // 添加窗口大小改变的监听器
  if (!window.drawerResizeListener) {
    window.drawerResizeListener = () => {
      if (isDrawerOpen) {
        console.log('🔄 窗口大小改变，重新调整表格高度和页面大小');
        adjustTableHeight();
      }
    };
    window.addEventListener('resize', window.drawerResizeListener);
  }
}

// 创建抽屉头部
function createDrawerHeader(config) {
  const header = document.createElement('div');
  header.className = 'card-header flex items-center justify-between px-3 py-2 border-b border-base-300';
  header.innerHTML = `
    <h3 class="card-title text-base font-bold text-primary">${config.title || '数据面板'}</h3>
    <button class="btn btn-xs btn-circle btn-ghost hover:btn-error" data-action="close-drawer">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  `;
  
  // 为关闭按钮添加事件监听器
  const closeBtn = header.querySelector('[data-action="close-drawer"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }
  
  return header;
}

// 创建抽屉主体
function createDrawerBody(config) {
  const body = document.createElement('div');
  body.className = 'card-body px-3 py-2 flex flex-col h-full';
  
  // 直接创建数据表格内容，不使用标签导航
  const dataContent = createDataTab();
  dataContent.className = 'flex-1 flex flex-col';
  
  body.appendChild(dataContent);
  
  return body;
}

// 创建数据表格 Tab
function createDataTab() {
  const container = document.createElement('div');
  
  // 数据统计信息
  const statsContainer = document.createElement('div');
  statsContainer.className = 'flex justify-between items-center mb-2 text-sm text-gray-600';
  statsContainer.innerHTML = `
    <div id="data-stats" class="flex flex-col gap-1">
      <div>总计: <span id="total-records">0</span> 条记录</div>
      <div class="flex gap-4 text-xs">
        <span>状态1: <span id="state1-records" class="text-primary font-medium">0</span> 条</span>
        <span>状态4: <span id="state4-records" class="text-secondary font-medium">0</span> 条</span>
        <span>每页: <span id="current-page-size" class="text-info font-medium">${pageSize}</span> 条</span>
      </div>
    </div>
    <button class="btn btn-xs btn-ghost" data-action="refresh-data" title="刷新数据">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      刷新
    </button>
  `;
  
  // 为刷新按钮添加事件监听器
  const refreshBtn = statsContainer.querySelector('[data-action="refresh-data"]');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshData);
  }
  
  // 表格容器
  const tableContainer = document.createElement('div');
  tableContainer.className = 'overflow-auto flex-1 mb-2';
  tableContainer.style.cssText = `
    overflow-y: auto;
    overflow-x: auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  `;
  
  const table = document.createElement('table');
  table.className = 'table table-compact table-zebra w-full';
  table.innerHTML = `
    <thead>
      <tr>
        <th>线索ID</th>
        <th>线索内容</th>
        <th>学段</th>
        <th>学科</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody id="data-table-body">
      <!-- 数据将通过 JavaScript 动态生成 -->
    </tbody>
  `;
  
  tableContainer.appendChild(table);
  
  // 添加鼠标滚轮事件处理，优化滚动体验
  tableContainer.addEventListener('wheel', (e) => {
    // 防止滚动事件冒泡到父容器
    e.stopPropagation();
    
    // 确保在表格内部滚动
    const { scrollTop, scrollHeight, clientHeight } = tableContainer;
    const { scrollLeft, scrollWidth, clientWidth } = tableContainer;
    
    // 垂直滚动处理
    if (e.deltaY !== 0) {
      const atTop = scrollTop === 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      
      // 如果不在边界，阻止默认行为，让容器内部滚动
      if (!atTop && !atBottom) {
        e.preventDefault();
      } else if (atTop && e.deltaY < 0) {
        // 在顶部且向上滚动，阻止默认行为
        e.preventDefault();
      } else if (atBottom && e.deltaY > 0) {
        // 在底部且向下滚动，阻止默认行为
        e.preventDefault();
      }
    }
    
    // 水平滚动处理
    if (e.deltaX !== 0) {
      const atLeft = scrollLeft === 0;
      const atRight = scrollLeft + clientWidth >= scrollWidth - 1;
      
      if (!atLeft && !atRight) {
        e.preventDefault();
      }
    }
  }, { passive: false });
  
  // 翻页按钮组
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'flex justify-center mb-2';
  
  const pagination = document.createElement('div');
  pagination.className = 'btn-group';
  // 分页按钮将由 updatePagination 函数动态生成
  
  paginationContainer.appendChild(pagination);
  
  // 下一题按钮
  const nextButtonContainer = document.createElement('div');
  nextButtonContainer.className = 'flex justify-center items-center flex-col gap-2';
  
  const nextButton = document.createElement('button');
  nextButton.id = 'next-question-button'; // 添加唯一ID
  nextButton.className = 'btn btn-primary btn-block h-10';
  nextButton.innerHTML = '下一题 →';
  nextButton.addEventListener('click', () => {
    console.log('下一题按钮被点击');
    goToNextQuestion();
  });
  
  nextButtonContainer.appendChild(nextButton);
  
  // 只在生产任务编辑页面显示 "残缺废弃下一题" 按钮
  if (currentRouteName === 'lead-pool-edit') {
    const dropButton = document.createElement('button');
    dropButton.className = 'btn btn-error btn-block h-10 mt-2';
    dropButton.innerHTML = '残缺废弃下一题 ×';
    dropButton.addEventListener('click', () => {
      console.log('残缺废弃下一题按钮被点击');
      handleDropProduceTask();
    });
    
    nextButtonContainer.appendChild(dropButton);
  }
  
  container.appendChild(statsContainer);
  container.appendChild(tableContainer);
  container.appendChild(paginationContainer);
  container.appendChild(nextButtonContainer);
  
  // 延迟初始化表格数据，确保API函数已经初始化
  setTimeout(() => {
    console.log('🚀 开始初始化抽屉数据');
    const currentTaskInfo = getCurrentTaskInfo();
    if (currentTaskInfo.hasTaskId || currentTaskInfo.hasClueId) {
      console.log(`🎯 检测到当前任务信息:`, currentTaskInfo, `，将在第一页尝试高亮`);
    } else {
      console.log('📋 没有当前任务信息，显示第一页数据');
    }
    loadTableData(1);
  }, 100);
  
  return container;
}

// 更新数据统计信息
function updateDataStats() {
  const totalRecordsElement = document.getElementById('total-records');
  const state1RecordsElement = document.getElementById('state1-records');
  const state4RecordsElement = document.getElementById('state4-records');
  const currentPageSizeElement = document.getElementById('current-page-size');
  
  if (totalRecordsElement) {
    totalRecordsElement.textContent = totalRecords;
  }
  
  if (state1RecordsElement) {
    state1RecordsElement.textContent = state1Records;
  }
  
  if (state4RecordsElement) {
    state4RecordsElement.textContent = state4Records;
  }
  
  if (currentPageSizeElement) {
    currentPageSizeElement.textContent = pageSize;
  }
  
  // 调整表格高度
  adjustTableHeight();
}

// 更新当前任务显示信息
function updateCurrentTaskDisplay() {
  // 功能已禁用
}

// 动态调整表格高度
function adjustTableHeight() {
  const tableContainer = document.querySelector('.overflow-auto.flex-1.mb-2');
  if (!tableContainer) return;
  
  // 获取视窗高度
  const viewportHeight = window.innerHeight;
  
  // 获取抽屉容器
  const drawerContent = document.querySelector('.drawer-content');
  if (!drawerContent) return;
  
  // 计算其他元素的高度 - 添加空值检查
  const header = drawerContent.querySelector('.card-header');
  
  // 安全地获取元素，添加空值检查
  const dataStatsElement = drawerContent.querySelector('#data-stats');
  const statsContainer = dataStatsElement ? dataStatsElement.closest('div') : null;
  
  const btnGroupElement = drawerContent.querySelector('.btn-group');
  const paginationContainer = btnGroupElement ? btnGroupElement.closest('div') : null;
  
  // 修正选择器 - 应该是 .btn-primary 而不是 .btn-primary.btn-wide
  const nextButtonElement = drawerContent.querySelector('.btn-primary');
  const nextButtonContainer = nextButtonElement ? nextButtonElement.closest('div') : null;
  
  let usedHeight = 0;
  
  // 计算已使用的高度
  if (header) usedHeight += header.offsetHeight;
  if (statsContainer) usedHeight += statsContainer.offsetHeight;
  if (paginationContainer) usedHeight += paginationContainer.offsetHeight;
  if (nextButtonContainer) usedHeight += nextButtonContainer.offsetHeight;
  
  // 添加一些padding和margin的估算
  usedHeight += 60; // 预留空间用于各种padding、margin和边框
  
  // 计算可用于表格的最大高度（留出一些缓冲空间）
  const maxTableHeight = Math.max(300, viewportHeight - usedHeight - 100);
  
  // 设置表格容器的最大高度
  tableContainer.style.maxHeight = `${maxTableHeight}px`;
  
  console.log(`📐 动态调整表格高度: ${maxTableHeight}px (视窗高度: ${viewportHeight}px, 已用高度: ${usedHeight}px)`);
  
  // 调整高度后，延迟更新页面大小（确保高度变化已生效）
  setTimeout(() => {
    updatePageSizeAndReload();
  }, 150);
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
  
  // 更新按钮状态，确保按钮保持可见
  const button = document.getElementById('drawer-float-button');
  if (button) {
    button.classList.add('active');
    button.style.transform = 'scale(1.05) rotate(45deg)';
    // 强制确保按钮可见性
    button.style.zIndex = '999999';
    button.style.visibility = 'visible';
    button.style.opacity = '1';
    button.style.pointerEvents = 'auto';
  }
  
  // 延迟调整表格高度，确保DOM元素已经渲染完成
  setTimeout(() => {
    adjustTableHeight();
  }, 100);
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
    /* CSS作用域限制 - 确保样式只影响抽屉相关元素 */
    /* 重置可能影响全局的属性 */
    
    /* 浮动按钮激活状态 - 静态样式 */
    #drawer-float-button.active {
      transform: scale(1.05) rotate(45deg) !important;
      background: #f5576c !important;
    }
    
    /* 禁用所有动画 */
    #drawer-float-button.no-animation,
    #drawer-float-button:not(.active) {
      animation: none !important;
    }
    
    /* 抽屉容器样式 - 固定在整个视窗 */
    #drawer-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 100000 !important;
      pointer-events: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transition: opacity 0.3s ease, visibility 0.3s ease !important;
      /* 确保不影响页面布局 */
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: transparent !important;
      color: inherit !important;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      text-align: inherit !important;
      text-decoration: inherit !important;
      vertical-align: inherit !important;
      white-space: inherit !important;
      word-spacing: inherit !important;
      letter-spacing: inherit !important;
    }
    
    #drawer-container.drawer-open {
      pointer-events: all !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    
    /* 遮罩层样式 */
    #drawer-container .drawer-overlay {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.5) !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease !important;
      z-index: 100001 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }
    
    #drawer-container.drawer-open .drawer-overlay {
      opacity: 1 !important;
    }
    
    /* 右侧抽屉样式 - 强制右侧定位 */
    #drawer-container .drawer-content {
      position: fixed !important;
      top: 0 !important;
      right: -400px !important;
      left: auto !important;
      width: 400px !important;
      height: 100vh !important;
      border-radius: 0 !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      border-left: 1px solid #e5e7eb !important;
      border-right: none !important;
      background: white !important;
      box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1) !important;
      transition: right 0.3s ease !important;
      z-index: 100002 !important;
      margin-left: auto !important;
      margin-right: 0 !important;
      transform: translateX(0) !important;
      box-sizing: border-box !important;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      padding: 0 !important;
      border-top: none !important;
      border-bottom: none !important;
      color: #333 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      text-align: left !important;
      text-decoration: none !important;
      vertical-align: baseline !important;
      white-space: normal !important;
      word-spacing: normal !important;
      letter-spacing: normal !important;
    }
    
    #drawer-container.drawer-open .drawer-content {
      right: 0 !important;
      left: auto !important;
      transform: translateX(0) !important;
    }
    
    /* 额外确保右侧定位的样式 */
    #drawer-container .drawer-content {
      right: -400px !important;
      left: auto !important;
      margin-left: auto !important;
      margin-right: 0 !important;
    }
    
    #drawer-container.drawer-open .drawer-content {
      right: 0 !important;
      left: auto !important;
    }
    
    /* 响应式设计 - 确保在小屏幕上也在右侧 */
    @media (max-width: 768px) {
      #drawer-container .drawer-content {
        width: calc(100% - 2rem) !important;
        right: calc(-100% + 2rem) !important;
      }
      
      #drawer-container.drawer-open .drawer-content {
        right: 0 !important;
      }
      
      #drawer-float-button {
        bottom: 20px !important;
        right: 20px !important;
        width: 50px !important;
        height: 50px !important;
      }
      
      #drawer-float-button svg {
        width: 24px !important;
        height: 24px !important;
      }
    }
    
    @media (max-width: 480px) {
      #drawer-container .drawer-content {
        width: 100% !important;
        right: -100% !important;
      }
      
      #drawer-container.drawer-open .drawer-content {
        right: 0 !important;
      }
    }
    
    /* 确保浮动按钮始终可见 - 关键样式 */
    #drawer-float-button {
      position: fixed !important;
      z-index: 999999 !important;
      pointer-events: auto !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      visibility: visible !important;
      opacity: 1 !important;
      display: flex !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: #667eea !important;
      color: white !important;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      text-align: center !important;
      text-decoration: none !important;
      vertical-align: baseline !important;
      white-space: normal !important;
      word-spacing: normal !important;
      letter-spacing: normal !important;
    }
    
    /* 确保按钮在抽屉打开时也保持可见 */
    #drawer-container.drawer-open ~ #drawer-float-button,
    #drawer-container.drawer-open + #drawer-float-button {
      z-index: 999999 !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    
    #drawer-float-button:hover {
      cursor: pointer !important;
    }
    
    /* 表格滚动优化 - 仅针对抽屉内的表格容器 */
    #drawer-container .drawer-content .overflow-auto {
      scrollbar-width: thin !important;
      scrollbar-color: rgba(0,0,0,0.2) transparent !important;
      scroll-behavior: smooth !important;
      /* 确保平滑滚动 */
      -webkit-overflow-scrolling: touch !important;
    }
    
    /* 水平滚动条样式 - 仅针对抽屉内元素 */
    #drawer-container .drawer-content .overflow-auto::-webkit-scrollbar {
      height: 6px !important;
      width: 6px !important;
    }
    
    #drawer-container .drawer-content .overflow-auto::-webkit-scrollbar-track {
      background: transparent !important;
      border-radius: 3px !important;
    }
    
    #drawer-container .drawer-content .overflow-auto::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.2) !important;
      border-radius: 3px !important;
    }
    
    #drawer-container .drawer-content .overflow-auto::-webkit-scrollbar-thumb:hover {
      background: rgba(0,0,0,0.3) !important;
    }
    
    /* 表格固定头部 - 仅针对抽屉内的表格 */
    #drawer-container .drawer-content .overflow-auto table thead th {
      position: sticky !important;
      top: 0 !important;
      background: white !important;
      z-index: 10 !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
    }
    
    /* 当前任务高亮样式 - 简化版本，使用DaisyUI样式 */
    #drawer-container #data-table-body tr.current-task {
      background-color: #fef3c7 !important;
      color: inherit !important;
    }
    
    #drawer-container #data-table-body tr.current-task:hover {
      background-color: #fde68a !important;
    }
    
    #drawer-container #data-table-body tr.current-task td {
      color: inherit !important;
    }
    
    /* 确保抽屉内容不被其他元素遮挡 - 仅针对关键元素 */
    #drawer-container .drawer-content > .card-header {
      position: relative !important;
      z-index: 2 !important;
    }
    
    #drawer-container .drawer-content > .card-body {
      position: relative !important;
      z-index: 1 !important;
    }
    
    /* 确保抽屉内的所有元素都不会影响外部布局 */
    #drawer-container * {
      box-sizing: border-box !important;
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
    visibility: visible !important;
    opacity: 1 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: auto !important;
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

// 将关键函数暴露到全局作用域，确保可以在HTML中调用
window.closeDrawer = closeDrawer;
window.refreshData = refreshData;
window.goToNextQuestion = goToNextQuestion;
window.changePage = changePage;
window.auditTask = auditTask;
window.editTask = editTask;
window.loadTableData = loadTableData;
window.toggleDrawer = toggleDrawer;
window.openDrawer = openDrawer;
window.removeDrawerElements = removeDrawerElements;
window.checkURLAndAddDrawerButton = checkURLAndAddDrawerButton;
window.selectQuestion = selectQuestion;
window.getCurrentTaskId = getCurrentTaskId;
window.getCurrentClueId = getCurrentClueId;
window.getCurrentTaskInfo = getCurrentTaskInfo;
window.highlightCurrentTask = highlightCurrentTask;
window.navigateToCurrentTask = navigateToCurrentTask;
window.adjustTableHeight = adjustTableHeight;
window.calculateDynamicPageSize = calculateDynamicPageSize;
window.updatePageSizeAndReload = updatePageSizeAndReload;
window.triggerPageSizeRecalculation = triggerPageSizeRecalculation;

console.log('✅ 抽屉模块函数已添加到全局作用域'); 

// 导出模块函数 - 用于ES6模块导入
export {
  checkURLAndAddDrawerButton,
  toggleDrawer,
  openDrawer,
  closeDrawer,
  removeDrawerElements,
  getCurrentTaskId,
  getCurrentClueId,
  getCurrentTaskInfo,
  highlightCurrentTask,
  navigateToCurrentTask,
  calculateDynamicPageSize,
  updatePageSizeAndReload,
  triggerPageSizeRecalculation
};

// 动态计算每页显示数量
function calculateDynamicPageSize() {
  const tableContainer = document.querySelector('#drawer-container .overflow-auto.flex-1.mb-2');
  if (!tableContainer) {
    console.log('📏 表格容器不存在，使用默认pageSize: 20');
    return 20; // 默认值
  }
  
  // 获取表格容器的实际可用高度
  const containerHeight = tableContainer.clientHeight;
  
  // 如果容器高度太小或为0，返回默认值
  if (containerHeight < 100) {
    console.log('📏 表格容器高度太小，使用默认pageSize: 20');
    return 20;
  }
  
  // 获取表头高度
  const tableHeader = tableContainer.querySelector('thead tr');
  const headerHeight = tableHeader ? tableHeader.offsetHeight : 40; // 默认40px
  
  // 创建一个临时行来测量单行高度
  let rowHeight = 48; // 默认行高
  const tbody = tableContainer.querySelector('tbody');
  if (tbody && tbody.children.length > 0) {
    // 如果有现有行，使用第一行的高度
    rowHeight = tbody.children[0].offsetHeight;
  } else {
    // 如果没有现有行，创建一个临时行来测量
    const tempRow = document.createElement('tr');
    tempRow.style.visibility = 'hidden';
    tempRow.style.position = 'absolute';
    tempRow.innerHTML = `
      <td class="font-mono text-sm">TEST12345</td>
      <td class="font-medium max-w-xs truncate">测试内容测试内容测试内容</td>
      <td class="text-sm">测试学段</td>
      <td class="text-sm">测试学科</td>
      <td>
        <div class="flex items-center gap-2">
          <span class="badge badge-xs badge-primary">S1</span>
          <button class="btn btn-primary btn-sm">测试</button>
        </div>
      </td>
    `;
    
    if (tbody) {
      tbody.appendChild(tempRow);
      rowHeight = tempRow.offsetHeight;
      tbody.removeChild(tempRow);
    }
  }
  
  // 计算可用于显示数据行的高度
  const availableHeight = containerHeight - headerHeight - 20; // 减去20px的缓冲和滚动条
  
  // 计算能显示的行数
  const maxRows = Math.floor(availableHeight / rowHeight);
  
  // 确保至少显示5行，最多不超过50行
  const calculatedPageSize = Math.max(5, Math.min(50, maxRows));
  
  console.log(`📏 动态计算pageSize:`, {
    containerHeight,
    headerHeight,
    rowHeight,
    availableHeight,
    maxRows,
    calculatedPageSize,
    currentPageSize: pageSize
  });
  
  return calculatedPageSize;
}

// 更新页面大小并重新加载数据
function updatePageSizeAndReload() {
  const newPageSize = calculateDynamicPageSize();
  
  // 如果页面大小有显著变化，更新并重新加载
  if (Math.abs(newPageSize - pageSize) > 2) { // 允许2行的差异避免频繁重载
    console.log(`📏 pageSize变化: ${pageSize} -> ${newPageSize}`);
    
    // 计算当前数据在新分页下应该在第几页
    const currentFirstItemIndex = (currentPage - 1) * pageSize;
    const newPage = Math.floor(currentFirstItemIndex / newPageSize) + 1;
    
    pageSize = newPageSize;
    
    // 加载新的页面
    loadTableData(Math.max(1, newPage));
  } else {
    pageSize = newPageSize;
    console.log(`📏 pageSize保持: ${pageSize} (变化幅度小于阈值)`);
    
    // 更新显示的pageSize数字
    const currentPageSizeElement = document.getElementById('current-page-size');
    if (currentPageSizeElement) {
      currentPageSizeElement.textContent = pageSize;
    }
  }
}

// 在表格数据加载完成后触发pageSize重新计算
function triggerPageSizeRecalculation() {
  setTimeout(() => {
    const newPageSize = calculateDynamicPageSize();
    if (newPageSize !== pageSize) {
      console.log(`📏 表格渲染后检测到pageSize需要调整: ${pageSize} -> ${newPageSize}`);
      updatePageSizeAndReload();
    }
  }, 200); // 等待DOM完全渲染
}

// 导航到当前任务 - 极简版本：仅加载第一页数据
async function navigateToCurrentTask() {
  console.log('🚀 开始加载抽屉数据');
  console.log('🚀 当前路由名称:', currentRouteName);
  
  // 直接加载第一页数据，不进行任何查找和高亮操作
  console.log('📋 加载第一页数据');
  await loadTableData(1);
}