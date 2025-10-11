
"use client";

import { useState, useEffect } from 'react';

export function useWebView() {
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    // This code will only run on the client side.
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent.toLowerCase();
      
      const isIOS = /iphone|ipad|ipod/.test(userAgent);

      // A reliable way to check for Android WebView
      const isAndroidWebView = /; wv\)/.test(userAgent);

      // A reliable way to check for iOS WebView
      // Standard Safari on iOS will not have 'wv' but will have 'safari'.
      // An iOS WebView will often identify as Safari but lack other browser chrome signals.
      // A common heuristic is to check if it's an iOS device but NOT Safari.
      // A standalone PWA will also not be a webview.
      // @ts-ignore
      const isIOSStandalone = !!window.navigator.standalone;
      const isSafari = userAgent.includes('safari');
      const isIOSChrome = userAgent.includes('crios');
      const isIOSFirefox = userAgent.includes('fxios');
      
      // If it's iOS and not standalone, not regular Safari, and not another browser like Chrome or Firefox.
      const isIOSWebView = isIOS && !isIOSStandalone && !isSafari && !isIOSChrome && !isIOSFirefox;
      
      if (isAndroidWebView || isIOSWebView) {
        setIsWebView(true);
      }
    }
  }, []);

  return isWebView;
}
