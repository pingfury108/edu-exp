import React from 'react';

const MobileWebComponent = () => {
  const handleOpenWebVersion = () => {
    window.open('https://bedu-web.pingfury.top/', '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 mt-8">
      <h2 className="text-xl font-bold mb-4">移动网页版</h2>
      <p className="text-center mb-6">
        通过网页版可在手机、平板等任何设备上使功能，无需安装插件。
      </p>
      <button 
        className="btn btn-primary btn-lg w-full max-w-xs" 
        onClick={handleOpenWebVersion}
      >
        立即访问网页版
      </button>
    </div>
  );
};

export default MobileWebComponent; 