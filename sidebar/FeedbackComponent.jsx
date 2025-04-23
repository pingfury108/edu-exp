import React from 'react';

export default function FeedbackComponent() {
  return (
    <div className="w-full h-full flex flex-col">
      <iframe 
        src="https://owihgx5cvaf.feishu.cn/share/base/form/shrcncF5f0hyTPrW5dhFNofLHBJ" 
        width="100%" 
        height="100%" 
        className="flex-grow"
        style={{ minHeight: "calc(100vh - 60px)" }}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
} 