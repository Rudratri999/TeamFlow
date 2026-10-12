import { Routes, Route, Navigate } from 'react-router-dom'
import Register from "./pages/Register"
import Login from "./pages/Login"
import ProtectedRoutes from './components/ProtectedRoutes'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Organization from './pages/Organization'
import CreateOrganization from './pages/CreateOrganization'
import Projects from './pages/Projects'
import CreateProject from './pages/CreateProject'
import ProjectDetails from './pages/ProjectDetails'
import UpdateProject from './pages/UpdateProject'
import CreateTask from './pages/CreateTask'
import UpdateTask from './pages/UpdateTask'
import Members from './pages/Members'
import MemberDetails from './pages/MemberDetails'
import MyWork from './pages/MyWork'
import OrganizationSettings from './pages/OrganizationSettings'

const App = () => {
  return (

    <Routes>
      {/* <Route path='/' element={<h1>TeamFlow</h1>}/> */}
      <Route path='/' element={<Register />} />
      <Route path='/login' element={<Login />} />

      <Route
        element={
          <ProtectedRoutes>
            <MainLayout />
          </ProtectedRoutes>
        }
      >
        <Route path="/dashboard" element={<Navigate to="/organizations" replace />} />
        <Route path="/dashboard/:organizationId" element={<Dashboard />} />
        <Route path="/organizations" element={<Organization />} />
        <Route path="/create-organization" element={<CreateOrganization />} />
        <Route path="/organizations/:organization_id/members" element={<Members />} />
        <Route path="/organizations/:organization_id/members/:userId" element={<MemberDetails />} />
        <Route path="/organizations/:organization_id/my-work" element={<MyWork />} />
        <Route path="/projects/:organization_id" element={<Projects />} />
        <Route path="/projects/:organization_id/create" element={<CreateProject />} />
        <Route path="/project/:organization_id/:projectId" element={<ProjectDetails />} />
        <Route path="/project/:organization_id/:projectId/edit" element={<UpdateProject />} />
        <Route path="/project/:organization_id/:projectId/create" element={<CreateTask />} />
        <Route path="/project/:organization_id/:projectId/task/:taskId/edit" element={<UpdateTask />} />
        <Route
    path="/organizations/:organization_id/settings"
    element={<OrganizationSettings />}
/>
      </Route>

    </Routes>

  )
}

export default App
