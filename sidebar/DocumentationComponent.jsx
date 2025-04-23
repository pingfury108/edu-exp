import React from 'react';

const DocumentationComponent = () => {
  return (
    <div className="w-full h-full flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>
      <iframe 
        src="https://doc-edu.pingfury.top/" 
        className="w-full h-full border-none flex-grow" 
        title="百度教育兼职文档"
        sandbox="allow-scripts allow-same-origin allow-popups"
      ></iframe>
    </div>
  );
};

export default DocumentationComponent; 