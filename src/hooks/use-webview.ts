
"use client";

import { useState, useEffect } from 'react';

export function useWebView() {
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    // This code will only run on the client side.
    if (typeof window !== "undefined") {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Android-specific check for "wv" which is a strong indicator of a WebView.
        const isAndroidWebView = userAgent.includes('; wv)');

        // For iOS, it's trickier. A common heuristic is to check if it's an iOS device
        // but not running in standalone (PWA) or Safari.
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        // @ts-ignore
        const isIOSStandalone = !!window.navigator.standalone;
        const isSafari = userAgent.includes('safari') && !userAgent.includes('crios') && !userAgent.includes('fxios');
        
        // If it's iOS and not standalone and not Safari, it's likely a WebView.
        const isIOSWebView = isIOS && !isIOSStandalone && !isSafari;
        
        if (isAndroidWebView || isIOSWebView) {
            setIsWebView(true);
        }
    }
  }, []);

  return isWebView;
}
