import React, { useState, useEffect, useMemo, useRef } from "react";
import ApiSettingsForm from './ApiSettingsForm'; // 引入新组件
import QuestionAnswerForm from './QuestionAnswerForm'; // 引入新组件
import OcrComponent from './OcrComponent'; // 引入新组件
import ClueClaimingComponent from './ClueClaimingComponent'; // 引入线索认领组件
import TopicSplitComponent from './TopicSplitComponent'; // 引入题目切割组件
import FeedbackComponent from './FeedbackComponent'; // 引入问题反馈组件
import DocumentationComponent from './DocumentationComponent'; // 引入文档组件
import MobileWebComponent from './MobileWebComponent'; // 引入手机网页端组件
import { CozeService } from '../coze.js';

export default function Main() {
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [analysis, setAnalysis] = React.useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [isCompleteeing, setIsCompleteeing] = useState(false);
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [host, setHost] = React.useState('https://bedu.pingfury.top');
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState('solving');
  const [isImageQuestion, setIsImageQuestion] = useState(false);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [selectedValue, setSelectedValue] = useState('问答');
  const [subject, setSubject] = useState("shuxue");
  const [gradeLevel, setGradeLevel] = useState('小学');
  const [features, setFeatures] = useState({
    jieti: true,
    ocr: true,
    "clue-claiming": false,
    "topic_split": true,
    "documentation": true,
    "mobile-web": true
  });
  const [serverType, setServerType] = useState(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [cozeService, setCozeService] = React.useState(null);
  const [kouziConfig, setKouziConfig] = React.useState(null);

  // Load feature settings from Chrome storage on component mount
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(features, (items) => {
        setFeatures(items);
      });
    } else {
      // Fallback for development environment
      console.log("Chrome storage not available, using default feature settings");
      const storedSettings = localStorage.getItem("eduExpSettings");
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          setFeatures(parsedSettings);
        } catch (e) {
          console.error("Failed to parse stored settings:", e);
        }
      }
    }
  }, []);

  // Load server type from storage
  useEffect(() => {
    const loadServerType = async () => {
      try {
        setIsSettingsLoading(true);
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['serverType'], resolve);
        });

        console.log('Loading serverType from storage:', result);

        if (result.serverType) {
          console.log('Setting serverType to:', result.serverType);
          setServerType(result.serverType);
        } else {
          setServerType("官方服务器");
        }
      } catch (error) {
        console.error('Error loading serverType:', error);
        setServerType("官方服务器");
      } finally {
        setIsSettingsLoading(false);
      }
    };

    loadServerType();
  }, []);

  // Save serverType to storage when it changes
  useEffect(() => {
    if (serverType) {
      chrome.storage.sync.set({ serverType });
    }
  }, [serverType]);

  React.useEffect(() => {
    // 监听来自 background 的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SET_QUESTION') {
        setQuestion(message.data.trim());
        setIsImageQuestion(false);
        setSelectedImage(null);
      }
    });
  }, []);

  React.useEffect(() => {
    // 从 Chrome 存储中加载 host
    chrome.storage.sync.get(['host'], (result) => {
      if (result.host) {
        setHost(result.host);
      } else {
        // 如果没有存储值，将默认值保存到存储中
        chrome.storage.sync.set({ host: 'https://bedu.pingfury.top' });
      }
    });
  }, []);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value.trim());
  };

  const handleFormat = async () => {
    setIsFormatting(true);
    try {
      if (serverType === "扣子" && cozeService) {
        // Get workflow ID from storage
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['kouziSolveWorkflowId', 'kouziAppId'], resolve);
        });

        const workflowResult = await cozeService.executeWorkflow(result.kouziSolveWorkflowId, {
          app_id: result.kouziAppId,
          parameters: {
            type: 'format',
            topic: question,
            discipline: subject
          }
        });

        if (workflowResult && workflowResult.data) {
          try {
            const parsedData = typeof workflowResult.data === 'string'
              ? JSON.parse(workflowResult.data)
              : workflowResult.data;

            if (parsedData && parsedData.topic) {
              setQuestion(parsedData.topic);
            } else {
              console.error('Invalid workflow result format');
            }
          } catch (error) {
            console.error('Error parsing workflow result:', error);
          }
        }
      } else {
        const response = await chrome.runtime.sendMessage(
          { type: 'FORMAT_QUESTION', data: {'topic': question, 'discipline': subject}, host: host, uname: name }
        );
        if (response && response.formatted) {
          setQuestion(response.formatted);
        }
      }
    } finally {
      setIsFormatting(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleteeing(true);
    try {
      if (serverType === "扣子" && cozeService) {
        // Get workflow ID from storage
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['kouziSolveWorkflowId', 'kouziAppId'], resolve);
        });

        const workflowResult = await cozeService.executeWorkflow(result.kouziSolveWorkflowId, {
          app_id: result.kouziAppId,
          parameters: {
            type: 'complete',
            topic: question,
            discipline: subject
          }
        });

        if (workflowResult && workflowResult.data) {
          try {
            const parsedData = typeof workflowResult.data === 'string'
              ? JSON.parse(workflowResult.data)
              : workflowResult.data;

            if (parsedData && parsedData.topic) {
              setQuestion(parsedData.topic);
            } else {
              console.error('Invalid workflow result format');
            }
          } catch (error) {
            console.error('Error parsing workflow result:', error);
          }
        }
      } else {
        const response = await chrome.runtime.sendMessage(
          { type: 'TOPIC_COMPLETE', data: {'topic': question, 'discipline': subject}, host: host, uname: name }
        );
        if (response && response.formatted) {
          setQuestion(response.formatted);
        }
      }
    } finally {
      setIsCompleteeing(false);
    }
  };

  const handleHostChange = (e) => {
    const newHost = e.target.value.trim();
    setHost(newHost);
    // 更新 Chrome 存储
    chrome.storage.sync.set({ host: newHost }, () => {
    });
  };

  const handleGenerateAnswer = async () => {
    setIsGeneratingAnswer(true);
    try {
      if (serverType === "扣子" && cozeService && kouziConfig) {
        let imageFileId = null;
        if (selectedImage) {
          // Convert base64 to blob
          const base64Data = selectedImage.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const blob = new Blob(byteArrays, { type: 'image/jpeg' });
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

          // Upload file
          const uploadResult = await cozeService.uploadFile(file);
          imageFileId = uploadResult.id;
        }

        const workflowResult = await cozeService.executeWorkflow(kouziConfig.workflowId, {
          app_id: kouziConfig.appId,
          parameters: {
            type: 'answer',
            topic: question,
            discipline: subject,
            topic_type: selectedValue,
            school_level: gradeLevel,
            ...(imageFileId && {
              image: {
                type: "image",
                file_id: imageFileId
              }
            })
          }
        });

        if (workflowResult && workflowResult.data) {
          try {
            const parsedData = typeof workflowResult.data === 'string'
              ? JSON.parse(workflowResult.data)
              : workflowResult.data;

            if (parsedData && parsedData.topic) {
               setAnswer(parsedData.topic.trim());
            } else {
              console.error('Invalid workflow result format');
            }
          } catch (error) {
            console.error('Error parsing workflow result:', error);
          }
        }
      } else {
        const response = await chrome.runtime.sendMessage(
          {
            type: 'TOPIC_ANSWER',
            host: host,
            uname: name,
            data: {'topic': question, 'discipline': subject, 'image_data': selectedImage, 'topic_type': selectedValue, 'school_level': gradeLevel }
          }
        );
        if (response && response.formatted) {
          setAnswer(response.formatted.trim());
        }
      }
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    try {
      if (serverType === "扣子" && cozeService) {
        // Get workflow ID from storage
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['kouziSolveWorkflowId', 'kouziAppId'], resolve);
        });

        let imageFileId = null;
        if (selectedImage) {
          // Convert base64 to blob
          const base64Data = selectedImage.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteArrays = [];
          for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
            const slice = byteCharacters.slice(offset, offset + 1024);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          const blob = new Blob(byteArrays, { type: 'image/jpeg' });
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

          // Upload file
          const uploadResult = await cozeService.uploadFile(file);
          imageFileId = uploadResult.id;
        }

        const workflowResult = await cozeService.executeWorkflow(result.kouziSolveWorkflowId, {
          app_id: result.kouziAppId,
          parameters: {
            type: 'analysis',
            topic: question,
            answer: answer,
            discipline: subject,
            topic_type: selectedValue,
            school_level: gradeLevel,
            ...(imageFileId && {
              image: {
                type: "image",
                file_id: imageFileId
              }
            })
          }
        });

        if (workflowResult && workflowResult.data) {
          try {
            const parsedData = typeof workflowResult.data === 'string'
              ? JSON.parse(workflowResult.data)
              : workflowResult.data;

            if (parsedData && parsedData.topic) {
               setAnalysis(parsedData.topic.trim());
            } else {
              console.error('Invalid workflow result format');
            }
          } catch (error) {
            console.error('Error parsing workflow result:', error);
          }
        }
      } else {
        const response = await chrome.runtime.sendMessage(
          {
            type: 'TOPIC_ANALYSIS',
            host: host,
            uname: name,
            data: {'topic': question, 'answer': answer, 'discipline': subject, 'image_data': selectedImage, 'topic_type': selectedValue, 'school_level': gradeLevel}
          }
        );
        if (response && response.formatted) {
          setAnalysis(response.formatted.trim());
        }
      }
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value.trim());
    chrome.storage.sync.set({ name: e.target.value });
  };

  useEffect(() => {
    chrome.storage.sync.get(['name'], (result) => {
      if (result.name) {
        setName(result.name);
      }
    });
  }, []);


  useEffect(() => {
    // 从 Chrome 存储中加载上次选择的 tab
    chrome.storage.sync.get(['activeTab'], (result) => {
      if (result.activeTab) {
        setActiveTab(result.activeTab);
      }
    });
  }, []);

  // Switch to available tab if current active tab is disabled
  useEffect(() => {
    console.log("Checking active tab against feature flags:", { activeTab, features });

    if (
      (activeTab === 'solving' && !features.jieti) ||
        (activeTab === 'ocr' && !features.ocr) ||
        (activeTab === 'clue-claiming' && !features["clue-claiming"])
    ) {
      // Find the first enabled tab or default to settings
      if (features.jieti) {
        setActiveTab('solving');
      } else if (features.ocr) {
        setActiveTab('ocr');
      } else if (features["clue-claiming"]) {
        setActiveTab('clue-claiming');
      } else {
        setActiveTab('settings');
      }
    }
  }, [features.jieti, features.ocr, features["clue-claiming"], activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // 更新 Chrome 存储
    chrome.storage.sync.set({ activeTab: tab });
  };

  useEffect(() => {
    // 从 Chrome 存储中加载 isSwapActive
    chrome.storage.sync.get(['isSwapActive'], (result) => {
      if (result.isSwapActive !== undefined) {
        setIsSwapActive(result.isSwapActive);
      }
    });
  }, []);


  // Listen for changes in chrome.storage to update features in real-time
  useEffect(() => {
    const handleStorageChange = (changes, namespace) => {
      if (namespace === 'sync') {
        let hasChanges = false;
        let changedFeatureName = '';
        let status = false;

        // Create a copy of current features state
        const updatedFeatures = {...features};

        // Check each feature flag
        if ('jieti' in changes) {
          updatedFeatures.jieti = changes.jieti.newValue;
          hasChanges = true;
          changedFeatureName = '解题功能';
          status = changes.jieti.newValue;
        }

        if ('ocr' in changes) {
          updatedFeatures.ocr = changes.ocr.newValue;
          hasChanges = true;
          changedFeatureName = '文字识别';
          status = changes.ocr.newValue;
        }

        if ('clue-claiming' in changes) {
          updatedFeatures["clue-claiming"] = changes["clue-claiming"].newValue;
          hasChanges = true;
          changedFeatureName = '线索认领';
          status = changes["clue-claiming"].newValue;
        }

        // Update state and show toast if any changes
        if (hasChanges) {
          setFeatures(updatedFeatures);
          displayToast(`${changedFeatureName}已${status ? '启用' : '禁用'}`);
        }
      }
    };

    // Add listener
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    // Cleanup
    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [features]);

  // Initialize CozeService when serverType is "扣子"
  React.useEffect(() => {
    if (serverType === "扣子") {
      chrome.storage.sync.get(['kouziAccessKey', 'kouziSolveWorkflowId', 'kouziAppId'], (result) => {
        if (result.kouziAccessKey && result.kouziSolveWorkflowId && result.kouziAppId) {
          setCozeService(new CozeService(result.kouziAccessKey));
          setKouziConfig({
            workflowId: result.kouziSolveWorkflowId,
            appId: result.kouziAppId
          });
        } else {
          console.error('Missing required Kouzi configuration');
          // Optionally show an error message to the user
        }
      });
    }
  }, [serverType]);

  return (<div className="container max-auto px-1 mt-2">
            <div className="overflow-x-auto pb-1">
              <div className="tabs tabs-boxed inline-flex whitespace-nowrap min-w-full">
              <a className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`} onClick={() => handleTabChange('settings')}>设置</a>
              {features.jieti && (
                <a className={`tab ${activeTab === 'solving' ? 'tab-active' : ''}`} onClick={() => handleTabChange('solving')}>解题</a>
              )}
              {features.ocr && (
                <a className={`tab ${activeTab === 'ocr' ? 'tab-active' : ''}`} onClick={() => handleTabChange('ocr')}>文字识别</a>
              )}
              {features.topic_split && (
                <a className={`tab ${activeTab === 'topic_split' ? 'tab-active' : ''}`} onClick={() => handleTabChange('topic_split')}>题目切割</a>
              )}
              {/*
              {features["clue-claiming"] && (
                <a className={`tab ${activeTab === 'clue-claiming' ? 'tab-active' : ''}`} onClick={() => handleTabChange('clue-claiming')}>线索认领</a>
              )}
              */}
              {features.documentation && (
                <a className={`tab ${activeTab === 'documentation' ? 'tab-active' : ''}`} onClick={() => handleTabChange('documentation')}>文档</a>
              )}
              {features["mobile-web"] && (
                <a className={`tab ${activeTab === 'mobile-web' ? 'tab-active' : ''}`} onClick={() => handleTabChange('mobile-web')}>移动网页版</a>
              )}
              <a className={`tab ${activeTab === 'feedback' ? 'tab-active' : ''}`} onClick={() => handleTabChange('feedback')}>问题反馈</a>
              </div>
            </div>
            {activeTab === 'settings' && (
              <div className="w-full mt-2">
                <ApiSettingsForm
                  host={host}
                  handleHostChange={handleHostChange}
                  name={name}
                  handleNameChange={handleNameChange}
                  serverType={serverType}
                  setServerType={setServerType}
                  isSettingsLoading={isSettingsLoading}
                />
              </div>
            )}
            {activeTab === 'solving' && (
              <QuestionAnswerForm
                question={question}
                setQuestion={setQuestion}
                handleQuestionChange={handleQuestionChange}
                answer={answer}
                setAnswer={setAnswer}
                analysis={analysis}
                setAnalysis={setAnalysis}
                isFormatting={isFormatting}
                handleFormat={handleFormat}
                isCompleteeing={isCompleteeing}
                handleComplete={handleComplete}
                isGeneratingAnswer={isGeneratingAnswer}
                handleGenerateAnswer={handleGenerateAnswer}
                isGeneratingAnalysis={isGeneratingAnalysis}
                handleGenerateAnalysis={handleGenerateAnalysis}
                isImageQuestion={isImageQuestion}
                setIsImageQuestion={setIsImageQuestion}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                selectedValue={selectedValue}
                setSelectedValue={setSelectedValue}
                host={host}
                uname={name}
                subject={subject}
                setSubject={setSubject}
                serverType={serverType}
                gradeLevel={gradeLevel}
                setGradeLevel={setGradeLevel}
              />
            )}
            {activeTab === 'ocr' && (
              <OcrComponent
                host={host}
                uname={name}
                serverType={serverType}
              />
            )}
            {activeTab === 'clue-claiming' && (
              <ClueClaimingComponent />
            )}
            {activeTab === 'topic_split' && (
              <TopicSplitComponent
                host={host}
                uname={name}
                serverType={serverType}
              />
            )}
            {activeTab === 'documentation' && (
              <DocumentationComponent />
            )}
            {activeTab === 'mobile-web' && (
              <MobileWebComponent />
            )}
            {activeTab === 'feedback' && (
              <FeedbackComponent />
            )}
          </div>)
}
