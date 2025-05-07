// src/components/UserAvatar.jsx
// 这是一个包含用户信息和头像的复合组件，用于侧边栏和用户信息展示

import React from 'react';
import AvatarDisplay from './AvatarDisplay';
import { LogOut } from 'lucide-react';

const UserAvatar = ({ 
  user, 
  showLogout = false, 
  onLogout = () => {}, 
  size = 'md',
  interactive = false,
  onClick = null
}) => {
  // 为不同尺寸设置内容的大小
  const contentSizes = {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'md': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl'
  };
  
  // 默认用户数据
  const userData = {
    username: user?.username || 'User',
    email: user?.email || 'user@example.com',
    profile_image: user?.profile_image || null
  };
  
  return (
    <div 
      className={`flex items-center gap-3 ${interactive ? 'cursor-pointer hover:bg-base-200 rounded-lg p-2' : ''}`}
      onClick={interactive ? onClick : undefined}
    >
      <AvatarDisplay 
        src={userData.profile_image}
        username={userData.username}
        size={size}
      />
      
      <div className={`flex-1 ${contentSizes[size] || 'text-base'}`}>
        <div className="font-bold">{userData.username}</div>
        <div className="text-xs opacity-70">{userData.email}</div>
      </div>
      
      {showLogout && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onLogout();
          }} 
          className="btn btn-ghost btn-sm"
        >
          <LogOut size={16} />
        </button>
      )}
    </div>
  );
};

export default UserAvatar;