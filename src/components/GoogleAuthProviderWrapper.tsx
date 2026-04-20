"use client";

import { GoogleOAuthProvider } from '@react-oauth/google';

export function GoogleAuthProviderWrapper({ children }: { children: React.ReactNode }) {
  // Using the provided Client ID
  return (
    <GoogleOAuthProvider clientId="323630120979-nsu1r0tf6d2u6jfngj51pcp3vqr5npo5.apps.googleusercontent.com">
      {children}
    </GoogleOAuthProvider>
  );
}
