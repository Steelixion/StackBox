"use client";

import { useGoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function GoogleLoginButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google login success returned:', tokenResponse);
      setLoading(true);
      try {
        console.log('Sending token to backend API...');
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ access_token: tokenResponse.access_token })
        });
        
        if (res.ok) {
          console.log('Backend authentication successful. Redirecting to dashboard...');
          router.push('/dashboard');
        } else {
          console.error('Failed to log in with Google on backend. Response:', await res.text());
          setLoading(false);
        }
      } catch (err) {
        console.error('Login error calling backend API:', err);
        setLoading(false);
      }
    },
    onError: errorResponse => {
      console.error('Google Login Popup Error', errorResponse);
      setLoading(false);
    }
  });

  return (
    <button
      type="button"
      onClick={() => {
        console.log('Google Login Button Clicked! Attempting to launch popup...');
        login();
      }}
      disabled={loading}
      className={`w-full inline-flex justify-center py-3 px-4 border border-steel/30 rounded-lg shadow-sm bg-white text-sm font-medium text-deep-ink hover:bg-porcelain focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jade transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <span className="mr-2">Loading...</span>
      ) : (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
        </svg>
      )}
      {loading ? 'Signing in...' : 'Google'}
    </button>
  );
}
