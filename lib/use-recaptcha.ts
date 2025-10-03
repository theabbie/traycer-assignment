"use client";

import { useEffect, useState, useRef } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (widgetId: number) => void;
      render: (container: string | HTMLElement, parameters: {
        sitekey: string;
        size: string;
        callback?: (token: string) => void;
      }) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

export function useRecaptcha() {
  const [isReady, setIsReady] = useState(false);
  const scriptLoadedRef = useRef(false);
  const widgetIdRef = useRef<number | null>(null);
  const tokenResolverRef = useRef<((token: string) => void) | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error("RECAPTCHA_SITE_KEY not configured");
      return;
    }

    const existingScript = document.querySelector(
      `script[src*="google.com/recaptcha/api.js"]`
    );

    if (existingScript) {

      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          initializeWidget(siteKey);
        });
      }
      return;
    }

    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
    script.async = true;
    script.defer = true;
    

    (window as Window & { onRecaptchaLoad?: () => void }).onRecaptchaLoad = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          initializeWidget(siteKey);
        });
      }
    };

    script.onerror = () => {
      console.error("Failed to load reCAPTCHA script");
      scriptLoadedRef.current = false;
    };

    document.head.appendChild(script);

    return () => {

    };
  }, []);

  const initializeWidget = (siteKey: string) => {

    let container = document.getElementById("recaptcha-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "recaptcha-container";
      document.body.appendChild(container);
    }

    if (widgetIdRef.current === null && window.grecaptcha) {
      try {
        widgetIdRef.current = window.grecaptcha.render(container, {
          sitekey: siteKey,
          size: "invisible",
          callback: (token: string) => {
            console.log("reCAPTCHA token received");
            if (tokenResolverRef.current) {
              tokenResolverRef.current(token);
              tokenResolverRef.current = null;
            }

            if (widgetIdRef.current !== null) {
              window.grecaptcha.reset(widgetIdRef.current);
            }
          },
        });
        console.log("reCAPTCHA widget rendered with ID:", widgetIdRef.current);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to render reCAPTCHA widget:", error);
      }
    }
  };

  const executeRecaptcha = async (action: string): Promise<string | null> => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error("RECAPTCHA_SITE_KEY not configured");
      return null;
    }

    if (!isReady || !window.grecaptcha || widgetIdRef.current === null) {
      console.log("Waiting for reCAPTCHA to load...");
      

      const maxWait = 10000;
      const startTime = Date.now();
      
      while ((!window.grecaptcha || widgetIdRef.current === null) && Date.now() - startTime < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.grecaptcha || widgetIdRef.current === null) {
        console.error("reCAPTCHA failed to load or render");
        return null;
      }
    }

    try {

      if (widgetIdRef.current !== null) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      

      await new Promise(resolve => setTimeout(resolve, 100));
      

      return new Promise<string>((resolve) => {

        const timeout = setTimeout(() => {
          tokenResolverRef.current = null;
          console.warn("reCAPTCHA execution timeout - silently ignoring");
          resolve("");
        }, 15000);
        

        tokenResolverRef.current = (token: string) => {
          clearTimeout(timeout);
          tokenResolverRef.current = null;
          resolve(token);
        };
        

        window.grecaptcha.execute(widgetIdRef.current!);
      });
    } catch (error) {
      console.error("reCAPTCHA execution error:", error);
      return null;
    }
  };

  return { isReady, executeRecaptcha };
}
