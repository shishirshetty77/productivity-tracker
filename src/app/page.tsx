import { auth } from '@/auth';
import Dashboard from '@/components/Dashboard';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <Dashboard user={session.user} />;
}
