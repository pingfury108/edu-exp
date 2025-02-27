import {ocr_text, run_llm, getAuditTaskLabel} from "./lib.js";

console.log('Hello from the background script!')

const isFirefoxLike =
  process.env.EXTENSION_PUBLIC_BROWSER === 'firefox' ||
    process.env.EXTENSION_PUBLIC_BROWSER === 'gecko-based'

if (isFirefoxLike) {
  browser.browserAction.onClicked.addListener(() => {
    browser.sidebarAction.open()
  })
} else {
  chrome.action.onClicked.addListener(() => {
    chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true})
  })
}

// 添加一个变量来存储复制的HTML
let storedHTML = '';

// 添加全局变量声明
let autoClaimingTimer = null;
let autoClaimingActive = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "baidu-edu-tools",
    title: "百度教育",
    contexts: ["all"] // 可选：all, page, selection, image, link, editable, video, audio
  }, function() {
    chrome.contextMenus.create({
      id: "font-format",
      title: "字体格式化",
      parentId: "baidu-edu-tools",
      contexts: ["all"]
    });
    chrome.contextMenus.create({
      id: "copy-html",
      title: "复制HTML",
      parentId: "baidu-edu-tools",
      contexts: ["selection"]
    });
    chrome.contextMenus.create({
      id: "paste-html",
      title: "粘贴HTML",
      parentId: "baidu-edu-tools",
      contexts: ["all"]
    });
    chrome.contextMenus.create({
      id: "send-topic",
      title: "发送题干到侧边栏",
      parentId: "baidu-edu-tools",
      contexts: ["all"]
    });
    chrome.contextMenus.create({
      id: "format-math",
      title: "渲染数学公式",
      parentId: "baidu-edu-tools",
      contexts: ["all"]
    });
    chrome.contextMenus.create({
      id: "math-img",
      title: "渲染竖式计算",
      parentId: "baidu-edu-tools",
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "font-format") {
    chrome.tabs.sendMessage(tab.id, { action: "font_format" });
  }
  if (info.menuItemId === "copy-html") {
    chrome.tabs.sendMessage(tab.id, { action: "copy_html" });
  }
  if (info.menuItemId === "paste-html") {
    chrome.tabs.sendMessage(tab.id, { action: "paste_html" });
  }
  if (info.menuItemId === "send-topic") {
    chrome.tabs.sendMessage(tab.id, { action: "send_topic" });
  }
  if (info.menuItemId === "format-math") {
    chrome.tabs.sendMessage(tab.id, { action: "format_math" });
  }
  if (info.menuItemId === "math-img") {
    chrome.tabs.sendMessage(tab.id, { action: "math_img" });
  }
});

// 添加消息监听器来处理HTML的存储和获取
// 添加快捷键命令监听器
chrome.commands.onCommand.addListener((command) => {
  // 获取当前活动标签页
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      const tab = tabs[0];
      switch (command) {
        case 'send-topic':
          chrome.tabs.sendMessage(tab.id, { action: "send_topic" });
          break;
        case 'format-math':
          chrome.tabs.sendMessage(tab.id, { action: "format_math" });
          break;
        case 'math-img':
          chrome.tabs.sendMessage(tab.id, { action: "math_img" });
          break;
      }
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "store_copied_html") {
    storedHTML = request.html;
    return true;
  }
  if (request.action === "get_copied_html") {
    sendResponse({ html: storedHTML });
    return true;
  }
  if (request.action === "store_topic_html") {
    // 转发给 sidebar
    chrome.runtime.sendMessage({
      type: 'SET_QUESTION',
      data: request.html
    });
  }
  
  // 处理认领任务响应的转发
  if (request.action === "claimAuditTaskResponse") {
    chrome.runtime.sendMessage({
      type: 'CLAIM_AUDIT_TASK_RESPONSE',
      data: request.data
    });
    return true;
  }

  // 处理自动认领的开始和停止
  if (request.action === "start_auto_claiming") {
    chrome.storage.local.get(['autoClaimingInterval'], (result) => {
      const interval = request.interval || (result.autoClaimingInterval * 1000) || 1000;
      autoClaimingActive = true;
      chrome.storage.local.set({ 
        autoClaimingActive: true,
        autoClaimingInterval: interval / 1000  // 保存为秒
      });
      
      if (autoClaimingTimer) {
        clearInterval(autoClaimingTimer);
        autoClaimingTimer = null;
      }
      
      console.log('[Background] Polling interval:', interval, 'ms');
      autoClaimingTimer = setInterval(() => {
        // 获取所有标签页
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            // 向每个标签页发送消息
            chrome.tabs.sendMessage(tab.id, {
              action: "periodic_message",
              message: "自动认领中",
              timestamp: new Date().toISOString(),
              params: request.params,
            });
          });
        });
      }, interval);
      
      sendResponse({ status: "started" });
    });
    return true;  // 保持消息通道开放
  }
  
  if (request.action === "stop_auto_claiming") {
    autoClaimingActive = false;
    chrome.storage.local.set({ autoClaimingActive: false });
    if (autoClaimingTimer) {
      clearInterval(autoClaimingTimer);
      autoClaimingTimer = null;
    }
    sendResponse({ status: "stopped" });
    return true;
  }

  if (request.action === "get_auto_claiming_status") {
    sendResponse({ autoClaimingActive });
    return true;
  }
  
  const formatMessage = async (type, data, host, uname) => {
    try {
      let formatted;
      if (type === 'FORMAT_QUESTION') {
        formatted = await run_llm(host, uname, 'topic_format', data);
      } else if (type === 'TOPIC_ANSWER') {
        formatted = await run_llm(host, uname, 'topic_answer', data);
      } else if (type === 'TOPIC_ANALYSIS') {
        formatted = await run_llm(host, uname, 'topic_analysis', data)
      } else if (type === 'TOPIC_COMPLETE') {
        formatted = await run_llm(host, uname, 'topic_complete', data)
      } else if (type === 'OCR') {
        formatted = await ocr_text(data, host, uname);
      }
      sendResponse({ formatted });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  };

  if (['FORMAT_QUESTION', 'TOPIC_ANSWER', 'TOPIC_ANALYSIS', 'TOPIC_COMPLETE', 'OCR'].includes(request.type)) {
    formatMessage(request.type, request.data, request.host, request.uname);
    return true; // 保持消息通道开放以等待异步响应
  }
});

// 添加连接端口监听器
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'audit-task-label') {
    port.onMessage.addListener(async (message) => {
      if (message.type === 'GET_AUDIT_TASK_LABEL') {
        try {
          // 获取当前活动的标签页
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          // 发送消息到 content script 并等待响应
          const response = await chrome.tabs.sendMessage(activeTab.id, {
            type: 'GET_AUDIT_TASK_LABEL_RESPONSE',
            data: message.data,
            selectedTaskType: message.selectedTaskType
          });
          // 将内容脚本的响应发送回端口
          port.postMessage(response);
        } catch (error) {
          console.error('Error in audit task label handler:', error);
          port.postMessage({ errno: 1, errmsg: error.message });
        }
      }
    });
  }
});
