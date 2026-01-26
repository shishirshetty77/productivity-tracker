import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
        _count: {
            select: { days: true }
        }
    }
  });

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Admin Dashboard</h1>
        
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--text-primary)] min-w-[600px]">
              <thead className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                <tr>
                  <th className="px-6 py-3 font-medium">Username</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                  <th className="px-6 py-3 font-medium">Days Tracked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {users.map((user: { id: string; username: string; role: string; createdAt: Date; _count: { days: number } }) => (
                  <tr key={user.id} className="hover:bg-[var(--card-hover)] transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'ADMIN' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                          {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">
                      {user._count.days}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
