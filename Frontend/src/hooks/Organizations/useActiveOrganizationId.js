import { useLocation, useParams } from "react-router-dom"

// Same detection logic the old Navbar used, shared by Sidebar and TopBar.
export const useActiveOrganizationId = () => {
  const { organizationId, organization_id } = useParams()
  const { pathname } = useLocation()

  const organizationRouteMatch = pathname.match(
    /^\/(?:dashboard|projects|project)\/([^/]+)/
  )
  const organizationPageMatch = pathname.match(
    /^\/organizations\/([^/]+)\/(?:members|my-work|settings)(?:\/|$)/
  )

  return (
    organizationId ||
    organization_id ||
    organizationRouteMatch?.[1] ||
    organizationPageMatch?.[1]
  )
}