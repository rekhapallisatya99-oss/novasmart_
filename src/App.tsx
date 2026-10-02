import { useState } from 'react';
import { RoleSelector } from '@/components/RoleSelector';
import { AppShell } from '@/components/AppShell';
import { AdminDashboard } from '@/modules/admin/AdminDashboard';
import { StoreManagerModule } from '@/modules/store/StoreManagerModule';
import { CustomerModule } from '@/modules/customer/CustomerModule';
import type { AppRole } from '@/types';

function App() {
  const [role, setRole] = useState<AppRole | null>(null);

  if (!role) {
    return <RoleSelector onSelect={setRole} />;
  }

  return (
    <AppShell role={role} onSwitchRole={() => setRole(null)}>
      {role === 'admin' && <AdminDashboard />}
      {role === 'store_manager' && <StoreManagerModule />}
      {role === 'customer' && <CustomerModule />}
    </AppShell>
  );
}

export default App;
