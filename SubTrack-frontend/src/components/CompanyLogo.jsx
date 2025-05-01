import React, { useState } from "react";
import { Cloud, FileText, Music, Film, CreditCard, Zap, Coffee, ShoppingCart, MessageSquare, LayoutGrid } from "lucide-react";

// Icon mapping for common subscription services
const serviceIcons = {
  'google': <Cloud className="text-blue-500" />,
  'notion': <FileText className="text-gray-800" />,
  'spotify': <Music className="text-green-500" />,
  'netflix': <Film className="text-red-600" />,
  'amazon': <ShoppingCart className="text-orange-500" />,
  'youtube': <Film className="text-red-500" />,
  'apple': <Zap className="text-gray-800" />,
  'microsoft': <LayoutGrid className="text-blue-500" />, // Changed from Window to LayoutGrid
  'adobe': <FileText className="text-red-500" />,
  'dropbox': <Cloud className="text-blue-400" />,
  'slack': <MessageSquare className="text-purple-500" />,
  'starbucks': <Coffee className="text-green-700" />,
};

// General function to extract domain from company name
function getDomainFromCompany(company) {
  // Simple domain conversion logic
  const normalized = company.toLowerCase()
    .replace(/\s+/g, '')  // Remove spaces
    .replace(/\./g, '')   // Remove dots
    .replace(/,/g, '');   // Remove commas
  
  // Handle special cases
  const domainMap = {
    'google': 'google.com',
    'googlecloud': 'cloud.google.com',
    'googledrive': 'drive.google.com',
    'notion': 'notion.so',
    'netflix': 'netflix.com',
    'spotify': 'spotify.com',
    'amazon': 'amazon.com',
    'amazonprime': 'amazon.com',
    'hbo': 'hbo.com',
    'hbomax': 'hbomax.com',
    'disney': 'disney.com',
    'disneyplus': 'disneyplus.com',
    'youtube': 'youtube.com',
    'youtubepremium': 'youtube.com',
    'apple': 'apple.com',
    'applemusic': 'music.apple.com',
    'appletv': 'tv.apple.com',
    'icloud': 'icloud.com',
    'microsoft': 'microsoft.com',
    'office365': 'office.com',
    'microsoftoffice': 'office.com',
    'onedrive': 'onedrive.live.com',
    'adobe': 'adobe.com',
    'adobecreativecloud': 'adobe.com',
    'dropbox': 'dropbox.com',
    'slack': 'slack.com',
    'github': 'github.com',
    'zoom': 'zoom.us',
    'hulu': 'hulu.com',
  };
  
  return domainMap[normalized] || `${normalized}.com`;
}

// Generate color based on company name
function getColorForCompany(company) {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500'];
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function CompanyLogo({ company, logo, size = "medium" }) {
  const [imgError, setImgError] = useState(false);
  
  // Set size classes based on size prop
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8",
    large: "w-10 h-10"
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.medium;
  
  // If custom logo is provided
  if (logo && logo.trim() !== '') {
    return <img 
      src={logo} 
      alt={company} 
      className={`${sizeClass} rounded-full object-cover`} 
    />;
  }
  
  // Try to use Clearbit API to fetch logo
  if (!imgError) {
    const domain = getDomainFromCompany(company);
    return (
      <img 
        src={`https://logo.clearbit.com/${domain}`} 
        alt={company} 
        className={`${sizeClass} rounded-full object-cover`}
        onError={() => setImgError(true)}
      />
    );
  }
  
  // If Clearbit fails, check for predefined icons
  const normalizedName = company.toLowerCase();
  if (serviceIcons[normalizedName]) {
    return (
      <div className={`${sizeClass} flex items-center justify-center`}>
        {serviceIcons[normalizedName]}
      </div>
    );
  }
  
  // Finally use first letter with color as fallback
  const color = getColorForCompany(company);
  return (
    <div className={`${sizeClass} rounded-full ${color} flex items-center justify-center`}>
      <span className="text-white font-semibold">
        {company.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}