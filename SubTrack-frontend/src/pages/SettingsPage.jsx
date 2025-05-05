// src/pages/SettingsPage.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, CreditCard, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { currentUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
    profile_image: currentUser?.profile_image || ''
  });
  const [preferences, setPreferences] = useState({
    theme_preference: 'light',
    currency_preference: 'USD',
    notification_preferences: {
      email_notifications: true,
      payment_reminders: true
    }
  });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // In a real app, this would call your API
      // await api.put('/users/profile', profileData);
      
      // For demo purposes, simulate a successful update
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        setLoading(false);
      }, 1000);
      
      // Update the user in context
      refreshUser();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to update profile' 
      });
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // In a real app, this would call your API
      // await api.put('/users/preferences', preferences);
      
      // For demo purposes, simulate a successful update
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Preferences updated successfully' });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to update preferences' 
      });
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    // Password change implementation
    setMessage({ type: 'success', text: 'Password updated successfully' });
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
                  <span className="label-text">Profile Image URL</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={profileData.profile_image}
                  onChange={(e) => setProfileData({...profileData, profile_image: e.target.value})}
                  placeholder="https://example.com/profile.jpg"
                />
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
                  className="input input-bordered" 
                  required
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <input 
                  type="password" 
                  className="input input-bordered" 
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
                  className="input input-bordered" 
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
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