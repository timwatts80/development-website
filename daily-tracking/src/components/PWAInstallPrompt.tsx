'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as unknown as { standalone?: boolean }).standalone === true) {
        setIsInstalled(true);
      }
    };

    // Check if on mobile
    const checkMobile = () => {
      setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };

    checkInstalled();
    checkMobile();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired');
      console.log('PWA: Is mobile device:', isMobile);
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
      console.log('PWA: Install prompt should show');
    };

    // For mobile devices without beforeinstallprompt, show install info after a delay
    const showMobileInstallInfo = () => {
      if (isMobile && !deferredPrompt && !sessionStorage.getItem('installPromptDismissed')) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000); // Show after 3 seconds on mobile
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    showMobileInstallInfo();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Hide for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
    console.log('PWA: Install prompt dismissed');
  };

  // Don't show if already installed or dismissed
  // Temporarily disable session storage check for debugging
  // if (isInstalled || !showInstallPrompt || sessionStorage.getItem('installPromptDismissed')) {
  if (isInstalled || !showInstallPrompt) {
    console.log('PWA: Install prompt hidden because:', {
      isInstalled,
      showInstallPrompt,
      dismissed: !!sessionStorage.getItem('installPromptDismissed')
    });
    return null;
  }

  console.log('PWA: Rendering install prompt', { isMobile, deferredPrompt: !!deferredPrompt });

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Install Daily Tracker
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isMobile && !deferredPrompt ? 
              'Tap your browser menu and select "Add to Home Screen"' :
              'Add to your home screen for quick access and offline use'
            }
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleDismiss}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Not now
          </button>
          {deferredPrompt ? (
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md transition-colors"
            >
              Install
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-md transition-colors"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
