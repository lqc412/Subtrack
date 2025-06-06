// Fix for incomplete circle avatar display
// File: SubTrack-frontend/src/components/AvatarDisplay.jsx

import React from 'react';
import { User } from 'lucide-react';

const AvatarDisplay = ({ 
  src, 
  username = 'User', 
  size = 'md', 
  onClick = null,
  showStatus = false,
  status = 'offline'
}) => {
  // Define different size classes
  const sizeClasses = {
    'xs': 'w-8 h-8',
    'sm': 'w-10 h-10',
    'md': 'w-12 h-12',
    'lg': 'w-16 h-16',
    'xl': 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };
  
  // Status colors
  const statusColors = {
    'online': 'bg-green-500',
    'offline': 'bg-gray-400',
    'away': 'bg-yellow-500',
    'busy': 'bg-red-500'
  };
  
  // Handle image loading errors
  const handleImageError = (e) => {
    e.target.onerror = null; // Prevent infinite loop
    // Fallback to name-based avatar
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
  };
  
  return (
    <div className={`relative ${sizeClasses[size] || sizeClasses.md}`}>
      <div 
        className={`
          ${sizeClasses[size] || sizeClasses.md} 
          rounded-full overflow-hidden border-2 border-gray-200
          flex items-center justify-center
          ${onClick ? 'cursor-pointer' : ''}
        `}
        onClick={onClick}
      >
        {src ? (
          <img 
            src={src} 
            alt={`${username}'s avatar`} 
            onError={handleImageError}
            className="w-full h-full object-cover rounded-full"
            style={{
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
            <User 
              className="text-gray-400" 
              size={size === 'xs' ? 16 : size === 'sm' ? 20 : size === 'md' ? 24 : size === 'lg' ? 32 : 48} 
            />
          </div>
        )}
      </div>
      
      {/* Online status indicator */}
      {showStatus && (
        <div 
          className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[status]} rounded-full border-2 border-white`}
        ></div>
      )}
    </div>
  );
};

export default AvatarDisplay;

// Alternative fix for MainLayout.jsx navbar section:
// If the issue is in the navbar container, try this modification:

// In MainLayout.jsx, find the avatar section and modify it:
{/*
<div className="flex-none mr-4">
  <div className="dropdown dropdown-end">
    <label tabIndex={0} className="btn btn-ghost btn-circle avatar p-1">
      <div className="w-10 h-10 rounded-full overflow-hidden">
        <AvatarDisplay 
          src={currentUser?.profile_image} 
          username={currentUser?.username} 
          size="md"
        />
      </div>
    </label>
    <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
      <li><a onClick={() => navigate('/settings')}>Profile</a></li>
      <li><a onClick={handleLogout}>Logout</a></li>
    </ul>
  </div>
</div>
*/}

// OR try this simpler approach in MainLayout.jsx:
{/*
<div className="flex-none mr-4">
  <div className="dropdown dropdown-end">
    <div tabIndex={0} className="avatar cursor-pointer" onClick={() => {}}>
      <div className="w-10 h-10 rounded-full border-2 border-gray-300 overflow-hidden">
        <img 
          src={currentUser?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'User')}&background=random`}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
    <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
      <li><a onClick={() => navigate('/settings')}>Profile</a></li>
      <li><a onClick={handleLogout}>Logout</a></li>
    </ul>
  </div>
</div>
*/}