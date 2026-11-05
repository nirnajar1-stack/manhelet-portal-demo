import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { FamilyPortal } from '@/pages/FamilyPortal'
import { Knowledge } from '@/pages/Knowledge'
import { MatamHome } from '@/pages/MatamHome'
import { MoleculeHome } from '@/pages/MoleculeHome'
import { NewTask } from '@/pages/NewTask'
import { OrgHome } from '@/pages/OrgHome'
import { Programs } from '@/pages/Programs'
import { TaskCenter } from '@/pages/TaskCenter'
import { TaskDetail } from '@/pages/TaskDetail'
import { UnitCase } from '@/pages/UnitCase'
import { UnitsList } from '@/pages/UnitsList'
import { RehabDemoLayout } from '@/pages/rehab-demo/RehabDemoLayout'
import { RehabErd } from '@/pages/rehab-demo/RehabErd'
import { RehabHouseholds } from '@/pages/rehab-demo/RehabHouseholds'
import { RehabOverview } from '@/pages/rehab-demo/RehabOverview'
import { RehabPermissions } from '@/pages/rehab-demo/RehabPermissions'
import { RehabProgramDetail } from '@/pages/rehab-demo/RehabProgramDetail'
import { RehabPrograms } from '@/pages/rehab-demo/RehabPrograms'
import { RehabScenarios } from '@/pages/rehab-demo/RehabScenarios'
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
        <Route path="programs" element={<Programs />} />
        <Route path="org" element={<OrgHome />} />
        <Route path="molecule" element={<MoleculeHome />} />
        <Route path="family" element={<FamilyPortal />} />
        <Route path="rehab-demo" element={<RehabDemoLayout />}>
          <Route index element={<RehabOverview />} />
          <Route path="erd" element={<RehabErd />} />
          <Route path="households" element={<RehabHouseholds />} />
          <Route path="programs" element={<RehabPrograms />} />
          <Route path="programs/:programId" element={<RehabProgramDetail />} />
          <Route path="scenarios" element={<RehabScenarios />} />
          <Route path="permissions" element={<RehabPermissions />} />
        </Route>
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
