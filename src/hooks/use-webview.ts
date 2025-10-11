
"use client";

import { useState, useEffect } from 'react';

// Common identifiers found in WebView user agent strings.
const WEBVIEW_IDENTIFIERS = [
  // Android
  'wv',
  'WebView',
  'Crosswalk',
  // iOS
  'AppleWebKit', // It's generic, but we can combine it with other checks
  // Other
  'Mobile', // Often present
  'Android',
  'iPhone',
  'iPad',
];

export function useWebView() {
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    // This code only runs on the client.
    const userAgent = navigator.userAgent;

    // A more specific check for Android WebView
    const isAndroidWebView = /wv\)/.test(userAgent);

    // A way to infer iOS WebView: it's an iOS device but not Safari.
    const isIOS = /iPhone|iPad|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(userAgent);
    const isIOSWebView = isIOS && !isSafari;
    
    // A more generic check that might catch other WebViews
    const hasGenericIdentifier = WEBVIEW_IDENTIFIERS.some(id => userAgent.includes(id));
    const seemsLikeWebView = hasGenericIdentifier && !/Chrome|Firefox|Safari/.test(userAgent.split(') ')[0]);


    if (isAndroidWebView || isIOSWebView || seemsLikeWebView) {
      setIsWebView(true);
    }
  }, []);

  return isWebView;
}
