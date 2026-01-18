import { useState, useEffect } from 'react';

export function useUser() {
  const [user, setUser] = useState<{ id: string; username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We can't actually read the HttpOnly cookie on client.
    // Instead we trust the parent or an API call.
    // For now, simpler: we will just reload or check a public "me" endpoint if strictly needed.
    // BUT since we are using simple state in Dashboard, we'll pass user down or fetching it.
    // Let's create a simple /api/auth/me endpoint.
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { user, loading, setUser };
}
