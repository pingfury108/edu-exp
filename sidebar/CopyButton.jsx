import React from 'react';

const CopyButton = ({ text }) => {
    const handleCopy = () => {
        if (text) {
            try {
                // 尝试解析 JSON
                const parsedText = JSON.parse(text);
                // 如果是 JSON 格式并且有 text 字段，只复制 text 内容
                const contentToCopy = parsedText.text || text;
                navigator.clipboard.writeText(contentToCopy)
                    .then(() => {
                        console.log('Copied text content to clipboard');
                    })
                    .catch(err => {
                        console.error('Failed to copy:', err);
                    });
            } catch (e) {
                // 如果不是 JSON 格式，直接复制原文本
                navigator.clipboard.writeText(text)
                    .then(() => {
                        console.log('Copied to clipboard');
                    })
                    .catch(err => {
                        console.error('Failed to copy:', err);
                    });
            }
        }
    };

    return (
        <button
            className="btn btn-sm btn-ghost"
            onClick={handleCopy}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
            </svg>
        </button>
    );
};

export default CopyButton;
