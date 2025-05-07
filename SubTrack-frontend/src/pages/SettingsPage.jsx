import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, CreditCard, Bell, Shield, Upload } from 'lucide-react';
import api from '../services/api'; // Use the configured API instance

export default function SettingsPage() {
  const { currentUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    profile_image: currentUser?.profile_image || ''
  });
  
  // File upload state
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentUser?.profile_image || '');
  const fileInputRef = useRef(null);
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    theme_preference: currentUser?.theme_preference || 'light',
    currency_preference: currentUser?.currency_preference || 'USD',
    notification_preferences: {
      email_notifications: currentUser?.notification_preferences?.email_notifications ?? true,
      payment_reminders: currentUser?.notification_preferences?.payment_reminders ?? true
    }
  });
  
  // Security state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Image upload handlers
  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.match('image.*')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should not exceed 5MB' });
      return;
    }

    setProfileImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Create FormData object to handle the file upload
      const formData = new FormData();
      formData.append('username', profileData.username);
      formData.append('email', profileData.email);
      
      if (profileImage) {
        formData.append('profile_image', profileImage);
      } else if (profileData.profile_image) {
        formData.append('profile_image_url', profileData.profile_image);
      }

      // Don't set Content-Type header manually - browser will set it correctly with boundary
      const response = await api.put('/users/profile', formData);
      
      // Handle successful response
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      // Update the user in context with the new data from the server
      refreshUser(response.data);
      
    } catch (error) {
      // Handle error properly
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      // Always stop loading regardless of success or failure
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Using API instance for preferences
      const response = await api.put('/users/preferences', preferences);
      
      // Handle successful response
      setMessage({ type: 'success', text: 'Preferences updated successfully' });
      
      // Update the user context if needed
      refreshUser(response.data);
      
    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update preferences' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    // Validate password match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setLoading(false);
      return;
    }
    
    try {
      // Using API instance for password
      await api.put('/users/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      // Handle successful response
      setMessage({ type: 'success', text: 'Password updated successfully' });
      
      // Clear password fields
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update password' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler for password field changes
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span>{message.text}</span>
        </div>
      )}
      
      <div className="bg-base-100 shadow rounded-lg">
        <div className="tabs tabs-bordered">
          <button 
            className={`tab tab-lg ${activeTab === 'profile' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="mr-2" size={18} />
            Profile
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'preferences' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <CreditCard className="mr-2" size={18} />
            Preferences
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'notifications' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="mr-2" size={18} />
            Notifications
          </button>
          <button 
            className={`tab tab-lg ${activeTab === 'security' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield className="mr-2" size={18} />
            Security
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Profile Information</h2>
              
              <div className="flex flex-col items-center mb-6">
                <div 
                  onClick={handleImageClick}
                  className="w-32 h-32 rounded-full border-2 border-primary overflow-hidden cursor-pointer relative"
                >
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <User size={48} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
                    <Upload size={24} className="text-white opacity-0 hover:opacity-100" />
                  </div>
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline mt-2"
                  onClick={handleImageClick}
                >
                  Change Photo
                </button>
                {profileImage && (
                  <p className="text-sm text-gray-500 mt-1">
                    Selected: {profileImage.name}
                  </p>
                )}
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={profileData.username}
                  onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input 
                  type="email" 
                  className="input input-bordered" 
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Profile Image URL (Alternative to upload)</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={profileData.profile_image}
                  onChange={(e) => {
                    setProfileData({...profileData, profile_image: e.target.value});
                    if (!profileImage && e.target.value) {
                      setImagePreview(e.target.value);
                    }
                  }}
                  placeholder="https://example.com/profile.jpg"
                  disabled={profileImage !== null}
                />
                {profileImage && (
                  <label className="label">
                    <span className="label-text-alt text-warning">Disabled while you have an image selected for upload</span>
                  </label>
                )}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : 'Save Changes'}
              </button>
            </form>
          )}
          
          {activeTab === 'preferences' && (
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Preferences</h2>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Theme</span>
                </label>
                <select 
                  className="select select-bordered" 
                  value={preferences.theme_preference}
                  onChange={(e) => setPreferences({...preferences, theme_preference: e.target.value})}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Default Currency</span>
                </label>
                <select 
                  className="select select-bordered" 
                  value={preferences.currency_preference}
                  onChange={(e) => setPreferences({...preferences, currency_preference: e.target.value})}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CNY">CNY (¥)</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : 'Save Preferences'}
              </button>
            </form>
          )}
          
          {activeTab === 'notifications' && (
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary" 
                    checked={preferences.notification_preferences.email_notifications}
                    onChange={(e) => setPreferences({
                      ...preferences, 
                      notification_preferences: {
                        ...preferences.notification_preferences,
                        email_notifications: e.target.checked
                      }
                    })}
                  />
                  <span className="label-text">Email Notifications</span>
                </label>
                <p className="text-sm text-gray-500 ml-14">Receive emails about your account activity</p>
              </div>
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary" 
                    checked={preferences.notification_preferences.payment_reminders}
                    onChange={(e) => setPreferences({
                      ...preferences, 
                      notification_preferences: {
                        ...preferences.notification_preferences,
                        payment_reminders: e.target.checked
                      }
                    })}
                  />
                  <span className="label-text">Payment Reminders</span>
                </label>
                <p className="text-sm text-gray-500 ml-14">Get notified before upcoming subscription payments</p>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : 'Save Notification Settings'}
              </button>
            </form>
          )}
          
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Change Password</h2>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Current Password</span>
                </label>
                <input 
                  type="password" 
                  name="current_password"
                  className="input input-bordered" 
                  value={passwordData.current_password}
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <input 
                  type="password" 
                  name="new_password"
                  className="input input-bordered" 
                  value={passwordData.new_password}
                  onChange={handlePasswordInputChange}
                  required
                  minLength={6}
                />
                <label className="label">
                  <span className="label-text-alt">Password must be at least 6 characters</span>
                </label>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Confirm New Password</span>
                </label>
                <input 
                  type="password" 
                  name="confirm_password"
                  className="input input-bordered" 
                  value={passwordData.confirm_password}
                  onChange={handlePasswordInputChange}
                  required
                />
                {passwordData.new_password !== passwordData.confirm_password && 
                 passwordData.confirm_password && (
                  <label className="label">
                    <span className="label-text-alt text-error">Passwords do not match</span>
                  </label>
                )}
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || (passwordData.new_password !== passwordData.confirm_password && passwordData.confirm_password)}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}