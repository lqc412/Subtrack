// components/AvatarDisplay.jsx
import React from 'react';
import { User } from 'lucide-react';

const AvatarDisplay = ({ 
  src, 
  username = 'User', 
  size = 'md', 
  onClick = null,
  showStatus = false,
  status = 'offline' // 'online', 'offline', 'away', 'busy'
}) => {
  // 定义不同尺寸类
  const sizeClasses = {
    'xs': 'w-8 h-8',
    'sm': 'w-10 h-10',
    'md': 'w-12 h-12',
    'lg': 'w-16 h-16',
    'xl': 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };
  
  // 状态颜色
  const statusColors = {
    'online': 'bg-green-500',
    'offline': 'bg-gray-400',
    'away': 'bg-yellow-500',
    'busy': 'bg-red-500'
  };
  
  // 处理图片加载错误
  const handleImageError = (e) => {
    e.target.onerror = null; // 防止循环触发错误
    // 回退到使用基于名称的头像
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
  };
  
  return (
    <div className={`relative ${sizeClasses[size] || sizeClasses.md}`}>
      <div 
        className={`
          ${sizeClasses[size] || sizeClasses.md} 
          rounded-full overflow-hidden border border-gray-200
          ${onClick ? 'cursor-pointer' : ''}
        `}
        onClick={onClick}
      >
        {src ? (
          <img 
            src={src} 
            alt={`${username}'s avatar`} 
            onError={handleImageError}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <User 
              className="text-gray-400" 
              size={size === 'xs' ? 16 : size === 'sm' ? 20 : size === 'md' ? 24 : size === 'lg' ? 32 : 48} 
            />
          </div>
        )}
      </div>
      
      {/* 在线状态指示器 */}
      {showStatus && (
        <div 
          className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[status]} rounded-full border-2 border-white`}
        ></div>
      )}
    </div>
  );
};

export default AvatarDisplay;