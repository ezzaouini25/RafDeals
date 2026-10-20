import { dbGetUsers } from '@/lib/admin-db';

export default async function TestDBPage() {
  try {
    const users = await dbGetUsers();
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Database Connection Test</h1>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-green-400">✅ Connected to database</p>
          <p className="text-white mt-2">Users found: {users.length}</p>
          <ul className="mt-4 space-y-2">
            {users.map((user) => (
              <li key={user.id} className="text-white/70">
                {user.username} - {user.role} ({user.email})
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Database Connection Failed</h1>
        <div className="bg-slate-800 rounded-lg p-4 text-red-300">
          <p>Error: {error.message}</p>
          <p className="mt-2 text-white/50 text-sm">Check your .env.local file and make sure MySQL is running.</p>
        </div>
      </div>
    );
  }
}