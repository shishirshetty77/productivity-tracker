'use client';

import { login } from '@/app/actions/auth';
import Link from 'next/link';
import { useState } from 'react';

export default function Login() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    
    if (result?.error) {
        setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#191919]">
      <div className="w-full max-w-md p-8 bg-[#202020] rounded-2xl border border-[#373737]">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Login</h1>
        
        {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#aaa] mb-2">Username</label>
            <input
              name="username"
              type="text"
              required
              className="w-full px-4 py-2.5 bg-[#373737] border border-[#4a4a4a] rounded-lg text-white focus:outline-none focus:border-[#2383e2]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#aaa] mb-2">Password</label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-2.5 bg-[#373737] border border-[#4a4a4a] rounded-lg text-white focus:outline-none focus:border-[#2383e2]"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-3 bg-[#2383e2] hover:bg-[#1a6cb8] text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-[#aaa]">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#2383e2] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
