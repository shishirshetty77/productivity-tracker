import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session || session.user.role !== 'ADMIN') {
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
    <div className="min-h-screen bg-[#191919] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
        
        <div className="bg-[#202020] rounded-xl border border-[#373737] overflow-hidden">
          <table className="w-full text-left text-sm text-[#ddd]">
            <thead className="bg-[#2a2a2a] text-[#aaa]">
              <tr>
                <th className="px-6 py-3 font-medium">Username</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium">Days Tracked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#373737]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#2a2a2a] transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'ADMIN' 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                        {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#9b9b9b]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-[#9b9b9b]">
                    {user._count.days}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
