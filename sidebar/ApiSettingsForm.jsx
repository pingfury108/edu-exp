import React from 'react';

const ApiSettingsForm = ({ host, handleHostChange, name, handleNameChange }) => {
    return (
        <div className="flex flex-col items-center">
            <div className="form-control w-full max-w-xs mt-2">
                <label className="label">
                    <span className="label-text">API 地址</span>
                </label>
                <input
                    type="text"
                    value={host}
                    onChange={handleHostChange}
                    placeholder="输入 API 地址"
                    className="input input-bordered input-sm"
                />
            </div>
            <div className="form-control w-full max-w-xs mt-2">
                <label className="label">
                    <span className="label-text">用户名</span>
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="输入用户名"
                    className="input input-bordered input-sm"
                />
            </div>
        </div>
    );
};

export default ApiSettingsForm; 