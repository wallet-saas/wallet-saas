import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spinner } from '@/components/ui/Spinner';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('stamply_token');
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner size="lg" />
    </div>
  );
}
