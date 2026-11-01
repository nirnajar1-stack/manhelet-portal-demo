import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { FamilyPortal } from '@/pages/FamilyPortal'
import { Knowledge } from '@/pages/Knowledge'
import { MatamHome } from '@/pages/MatamHome'
import { MoleculeHome } from '@/pages/MoleculeHome'
import { NewTask } from '@/pages/NewTask'
import { OrgHome } from '@/pages/OrgHome'
import { TaskCenter } from '@/pages/TaskCenter'
import { TaskDetail } from '@/pages/TaskDetail'
import { UnitCase } from '@/pages/UnitCase'
import { UnitsList } from '@/pages/UnitsList'
import { AppProvider, useApp } from '@/state/AppContext'

function RoleHome() {
  const { currentUser } = useApp()
  if (currentUser.role === 'molecule') return <Navigate to="/molecule" replace />
  if (currentUser.role === 'family') return <Navigate to="/family" replace />
  return <MatamHome />
}

function Bootstrap() {
  const { refreshTasks } = useApp()
  useEffect(() => {
    void refreshTasks()
  }, [refreshTasks])
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<RoleHome />} />
        <Route path="tasks" element={<TaskCenter />} />
        <Route path="tasks/new" element={<NewTask />} />
        <Route path="tasks/:taskId" element={<TaskDetail />} />
        <Route path="units" element={<UnitsList />} />
        <Route path="units/:unitId" element={<UnitCase />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="org" element={<OrgHome />} />
        <Route path="molecule" element={<MoleculeHome />} />
        <Route path="family" element={<FamilyPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Bootstrap />
      </AppProvider>
    </BrowserRouter>
  )
}
