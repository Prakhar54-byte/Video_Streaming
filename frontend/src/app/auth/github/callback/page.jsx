'use client';

import { useEffect, useContext, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OAuthContext } from '@/context/OAuthContext';

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleGithubLogin } = useContext(OAuthContext);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error('GitHub OAuth error:', error);
      router.push('/auth/login?error=github_denied');
    } else if (code) {
      handleGithubLogin(code);
    } else {
      router.push('/auth/login');
    }
  }, [code, error]);

  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-white">Signing in with GitHub...</p>
    </div>
  );
}

export default function GitHubCallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b0e14]">
      <Suspense fallback={
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      }>
        <GitHubCallbackContent />
      </Suspense>
    </div>
  );
}