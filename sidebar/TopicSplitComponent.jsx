import React from 'react';
import CopyButton from './CopyButton.jsx';
import { CozeService } from '../coze.js';
import { topic_split } from '../lib.js';

// 图片压缩和转换函数
async function compressAndConvertToBase64(blob, quality = 0.7, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // 从blob创建一个临时URL
    const url = URL.createObjectURL(blob);
    img.src = url;
    
    // 使用后释放URL
    img.onload = function() {
      URL.revokeObjectURL(url);
      
      // 计算新的尺寸，保持宽高比
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.floor(height * ratio);
      }
      
      // 创建canvas并绘制调整大小后的图片
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // 将canvas转换为压缩后的base64字符串
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = reject;
  });
}

const TopicSplitComponent = ({ host, uname, serverType }) => {
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [splitResult, setSplitResult] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [cozeService, setCozeService] = React.useState(null);
  const [imagePreviewSize, setImagePreviewSize] = React.useState({ width: 300, height: 'auto' });
  const [appendMode, setAppendMode] = React.useState(true); // 默认为追加模式

  // Initialize CozeService when serverType is "扣子"
  React.useEffect(() => {
    if (serverType === "扣子") {
      chrome.storage.sync.get(['kouziAccessKey', 'kouziQuestionSplitWorkflowId'], (result) => {
        console.log('TopicSplitComponent: Attempting to init CozeService with keys:', result); // Add log
        if (result.kouziAccessKey && result.kouziQuestionSplitWorkflowId) {
          console.log('TopicSplitComponent: Initializing CozeService.');
          setCozeService(new CozeService(result.kouziAccessKey));
        } else {
          console.error('TopicSplitComponent: Missing required Kouzi configuration (kouziAccessKey or kouziQuestionSplitWorkflowId)');
          setCozeService(null); // Ensure service is null if keys are missing
        }
      });
    } else {
      setCozeService(null); // Reset service if not Kouzi type
    }
  }, [serverType]);
  
  // 监听来自 background 的 TOPIC_SPLIT_IMAGE 消息
  React.useEffect(() => {
    const messageListener = (message) => {
      if (message.type === 'TOPIC_SPLIT_IMAGE' && message.data) {
        // 记录接收到的图片数据大小和类型
        console.log('TopicSplitComponent received image data size:', message.data.length, 'bytes');
        console.log('Received image type:', message.data.substring(0, message.data.indexOf(';')));
        
        // 直接设置图片数据
        setSelectedImage(message.data);
        
        // 创建图像对象获取尺寸信息
        const img = new Image();
        img.onload = () => {
          console.log('Received image original dimensions:', img.width, 'x', img.height, 'pixels');
          
          // 计算预览尺寸
          const maxWidth = 300;
          const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
          const previewWidth = Math.floor(img.width * ratio);
          const previewHeight = Math.floor(img.height * ratio);
          
          console.log('Received image preview dimensions:', previewWidth, 'x', previewHeight, 'pixels');
          
          setImagePreviewSize({
            width: previewWidth,
            height: previewHeight
          });
        };
        img.src = message.data;
      }
    };
    
    // 添加消息监听器
    chrome.runtime.onMessage.addListener(messageListener);
    
    // 组件卸载时移除监听器
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);



  const onPaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => {
          // 记录粘贴的图片数据大小
          console.log('Pasted image data size:', reader.result.length, 'bytes');
          console.log('Pasted image type:', reader.result.substring(0, reader.result.indexOf(';')));
          
          setSelectedImage(reader.result);
          // Create an image to get dimensions
          const img = new Image();
          img.onload = () => {
            // Calculate appropriate preview size (max width 300px)
            const maxWidth = 300;
            const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
            const previewWidth = Math.floor(img.width * ratio);
            const previewHeight = Math.floor(img.height * ratio);
            
            // 记录图片原始尺寸和预览尺寸
            console.log('Pasted image original dimensions:', img.width, 'x', img.height, 'pixels');
            console.log('Pasted image preview dimensions:', previewWidth, 'x', previewHeight, 'pixels');
            
            setImagePreviewSize({
              width: previewWidth,
              height: previewHeight
            });
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
        event.preventDefault();
        break;
      }
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // 记录上传的图片数据大小
        console.log('Uploaded image data size:', reader.result.length, 'bytes');
        console.log('Uploaded image type:', reader.result.substring(0, reader.result.indexOf(';')));
        
        setSelectedImage(reader.result);
        // Create an image to get dimensions
        const img = new Image();
        img.onload = () => {
          // Calculate appropriate preview size (max width 300px)
          const maxWidth = 300;
          const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
          const previewWidth = Math.floor(img.width * ratio);
          const previewHeight = Math.floor(img.height * ratio);
          
          // 记录图片原始尺寸和预览尺寸
          console.log('Uploaded image original dimensions:', img.width, 'x', img.height, 'pixels');
          console.log('Uploaded image preview dimensions:', previewWidth, 'x', previewHeight, 'pixels');
          
          setImagePreviewSize({
            width: previewWidth,
            height: previewHeight
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSplitTopic = async () => {
    if (selectedImage) {
      setIsLoading(true);
      try {
        // 检查图片大小并在需要时进行压缩
        let processedImage = selectedImage;
        
        // 计算base64图片大小（近似值，以字节为单位）
        const base64Data = selectedImage.split(',')[1];
        const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        console.log(`原始图片大小: ${sizeInMB.toFixed(2)}MB`);
        
        // 如果图片大于1MB，执行压缩
        if (sizeInMB > 1) {
          console.log('图片大于1MB，执行压缩...');
          
          try {
            // 从base64转换为Blob
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
            
            // 直接使用blob进行压缩，不需要创建File对象
            processedImage = await compressAndConvertToBase64(blob, 0.6); // 降低质量参数以0.6，增强压缩效果
            
            // 计算压缩后的大小
            const compressedBase64Data = processedImage.split(',')[1];
            const compressedSizeInBytes = Math.ceil((compressedBase64Data.length * 3) / 4);
            const compressedSizeInMB = compressedSizeInBytes / (1024 * 1024);
            console.log(`压缩后图片大小: ${compressedSizeInMB.toFixed(2)}MB`);
            
            // 如果压缩后反而更大，则使用原始图片
            if (compressedSizeInMB >= sizeInMB) {
              console.log('压缩后图片反而更大，使用原始图片');
              processedImage = selectedImage;
            }
          } catch (error) {
            console.error('图片压缩失败:', error);
            // 如果压缩失败，使用原始图片
            processedImage = selectedImage;
          }
        }
        
        if (serverType === "扣子" && cozeService) {
          // Convert base64 to blob
          const base64Data = processedImage.split(',')[1];
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

          // Get Topic Split specific workflow ID and App ID from storage
          const result = await new Promise((resolve) => {
            // NOTE: Assuming kouziAppId is needed, like in Sidebar.jsx. If not, remove it.
            // IMPORTANT: Verify that kouziAppId is actually stored and intended for use here.
            // If only workflowId is needed, adjust the get call and executeWorkflow call.
            chrome.storage.sync.get(['kouziQuestionSplitWorkflowId', 'kouziAppId'], resolve); // Fetch the correct workflow ID
          });

          // Check if required IDs were fetched
          if (!result.kouziQuestionSplitWorkflowId || !result.kouziAppId) { // Adjust check if kouziAppId is not needed
            throw new Error("扣子题目切割 Workflow ID 或 App ID 未配置");
          }

          // Upload file and execute workflow
          const uploadResult = await cozeService.uploadFile(file);
          const workflowResult = await cozeService.executeWorkflow(result.kouziQuestionSplitWorkflowId, {
            app_id: result.kouziAppId,
            parameters: {
              img: {
                type: "image",
                file_id: uploadResult.id
              }
            }
          });

          // Handle the workflow result
          if (workflowResult && workflowResult.data) {
            try {
              const parsedData = typeof workflowResult.data === 'string' 
                ? JSON.parse(workflowResult.data) 
                : workflowResult.data;
              
              if (parsedData) {
                // 确保响应格式符合要求，包含 text 和 list 字段
                const formattedResult = JSON.stringify({
                  text: parsedData.text || '',
                  list: parsedData.list || []
                }, null, 2);
                setSplitResult(formattedResult);
              } else {
                setSplitResult('切割失败：未获取到切割结果');
              }
            } catch (error) {
              console.error('Error parsing workflow result:', error);
              setSplitResult('切割失败：数据解析错误');
            }
          } else {
            setSplitResult('切割失败：未获取到切割结果');
          }
        } else {
           // Explicitly check if Kouzi was intended but failed initialization
           if (serverType === "扣子") { // No need to check !cozeService here, as the previous check already covers it
               console.error("Kouzi server type selected, but Coze service not initialized. Check settings for kouziAccessKey and kouziQuestionSplitWorkflowId.");
               throw new Error("扣子服务配置不完整，请检查设置。"); // Prevent fallback
           }

          // Official server logic (using chrome.runtime.sendMessage)
          try {
            // 发送消息到 background.js
            const result = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage({
                type: 'TOPIC_SPLIT',
                data: { 'image_data': processedImage },
                host,
                uname
              }, response => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else if (response.error) {
                  reject(new Error(response.error));
                } else {
                  resolve(response.formatted);
                }
              });
            });
            
            if (result) {
            // 处理新的响应格式，包含 text 和 list 字段
            // 将结果转换为 JSON 字符串以便在文本区域中显示
            const formattedResult = JSON.stringify({
              text: result.text || '',
              list: result.list || []
            }, null, 2);
            setSplitResult(formattedResult);
            } else {
              setSplitResult('切割失败：未获取到切割结果');
            }
          } catch (error) {
            console.error('Error in topic split:', error);
            setSplitResult('切割失败：' + (error.message || '未知错误'));
          }  
        }
      } catch (error) {
        console.error('Error in topic split:', error);
        setSplitResult('切割失败：' + (error.message || '未知错误'));
      } finally {
        setIsLoading(false);
      }
    }
  };



  return (
    <div className="container max-auto w-full">
      <div className="flex flex-col gap-2">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center"
          onPaste={onPaste}
          tabIndex="0"
        >
          <input
            type="text"
            className="input input-bordered input-sm w-full mb-2"
            placeholder="可以直接粘贴图片"
            onPaste={onPaste}
          />
          {selectedImage ? (
            <div className="flex flex-col items-center">
              <img
                src={selectedImage}
                alt="Selected"
                style={{
                  width: `${imagePreviewSize.width}px`,
                  height: imagePreviewSize.height === 'auto' ? 'auto' : `${imagePreviewSize.height}px`,
                  maxHeight: '180px',
                  objectFit: 'contain'
                }}
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
                className="btn btn-xs btn-error mt-2 text-xs"
              >
                删除图片
              </button>
            </div>
          ) : (
            <div className="text-gray-500 py-3">
              <p>直接粘贴图片</p>
              <p className="text-xs mt-1">支持截图直接粘贴</p>
            </div>
          )}
        </div>
        <button
          onClick={handleSplitTopic}
          disabled={!selectedImage || isLoading}
          className={`btn btn-primary btn-sm w-full ${isLoading ? 'opacity-90' : ''}`}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-xs mr-2"></span>
              <span>处理中...</span>
            </>
          ) : (
            "切割题目"
          )}
        </button>
      </div>
      <div className="mt-2">
        <div className="label">
          <span className="label-text">题目列表</span>
        </div>
        <div className="space-y-3">
          {(() => {
            try {
              const parsed = JSON.parse(splitResult);
              if (parsed.list && Array.isArray(parsed.list) && parsed.list.length > 0) {
                return parsed.list.map((item, index) => (
                  <div key={index} className="border rounded-lg p-2">
                    <div className="font-medium mb-1 flex justify-between items-center">
                      <span>题目 {index + 1}</span>
                      <div className="flex gap-1 items-center">
                        <div className="flex items-center mr-1" title={appendMode ? "追加模式" : "替换模式"}>
                          <input 
                            type="checkbox" 
                            className="toggle toggle-xs toggle-success" 
                            checked={appendMode}
                            onChange={() => setAppendMode(!appendMode)}
                          />
                        </div>
                        <button
                          onClick={() => {
                            try {
                              // 发送当前题目项到浏览器，添加append参数
                              chrome.runtime.sendMessage({
                                type: "documentassistant",
                                text: item,
                                append: appendMode // 根据开关状态决定是追加还是替换
                              });
                            } catch (error) {
                              console.error('Error sending list item:', error);
                            }
                          }}
                          className="btn btn-ghost btn-xs btn-sm flex items-center text-xs"
                        >
                          填入
                        </button>
                        <CopyButton text={item} />
                      </div>
                    </div>
                    <textarea
                      value={item}
                      onChange={(e) => {
                        try {
                          const currentData = JSON.parse(splitResult);
                          const newList = [...currentData.list];
                          newList[index] = e.target.value;
                          setSplitResult(JSON.stringify({
                            ...currentData,
                            list: newList
                          }, null, 2));
                        } catch (e) {
                          console.error('Error updating list item:', e);
                        }
                      }}
                      className="textarea textarea-bordered textarea-sm w-full"
                      rows="2"
                    ></textarea>
                  </div>
                ));
              } else {
                return (
                  <div className="text-center py-3 text-gray-500">
                    <p className="text-sm">暂无题目列表数据</p>
                  </div>
                );
              }
            } catch (e) {
              return (
                <div className="text-center py-3 text-gray-500">
                  <p className="text-sm">暂无题目列表数据</p>
                </div>
              );
            }
          })()}

        </div>
      </div>
      <div className="mt-2">
        <div className="label flex justify-between items-center py-1">
          <span className="label-text text-sm font-medium">结果</span>
          <div className="flex gap-1 items-center">
            <div className="flex items-center mr-1" title={appendMode ? "追加模式" : "替换模式"}>
              <input 
                type="checkbox" 
                className="toggle toggle-xs toggle-success" 
                checked={appendMode}
                onChange={() => setAppendMode(!appendMode)}
              />
            </div>
            <button
              onClick={() => {
                try {
                  // 解析当前的 splitResult JSON 字符串
                  const parsedResult = JSON.parse(splitResult);
                  // 只发送text字段内容，添加append参数
                  chrome.runtime.sendMessage({
                    type: "documentassistant",
                    text: parsedResult.text || '',
                    append: appendMode // 根据开关状态决定是追加还是替换
                  });
                } catch (error) {
                  console.error('Error parsing split result:', error);
                  // 如果解析失败，则直接发送当前文本
                  chrome.runtime.sendMessage({
                    type: "documentassistant",
                    text: splitResult,
                    append: appendMode // 根据开关状态决定是追加还是替换
                  });
                }
              }}
              className="btn btn-ghost btn-xs btn-sm flex items-center text-xs"
            >
              填入
            </button>
            <CopyButton text={splitResult} />
          </div>
        </div>
        <textarea
          value={(() => {
            try {
              // 尝试解析 JSON 并只显示 text 字段内容
              const parsed = JSON.parse(splitResult);
              return parsed.text || '';
            } catch (e) {
              // 如果解析失败，则显示原始内容
              return splitResult;
            }
          })()}
          onChange={(e) => {
            try {
              // 检查 splitResult 是否为空字符串
              if (!splitResult.trim()) {
                // 如果为空，创建一个新的包含 text 字段的 JSON 对象
                setSplitResult(JSON.stringify({
                  text: e.target.value,
                  list: []
                }, null, 2));
              } else {
                // 尝试解析当前的 splitResult
                const currentData = JSON.parse(splitResult);
                // 更新 text 字段，保留 list 字段
                setSplitResult(JSON.stringify({
                  ...currentData,
                  text: e.target.value
                }, null, 2));
              }
            } catch (e) {
              // 如果解析失败，创建一个新的有效 JSON 对象
              setSplitResult(JSON.stringify({
                text: e.target.value,
                list: []
              }, null, 2));
            }
          }}
          placeholder="题目切割后的内容"
          className="textarea textarea-bordered textarea-md w-full h-full min-h-32"
        >
        </textarea>
      </div>
    </div>
  );
};

export default TopicSplitComponent;
