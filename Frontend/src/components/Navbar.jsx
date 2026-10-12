// Navbar contain : TeamFlow logo , dashboard , projects , Tasks , username and logout button
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NavBar = () => {
    const { user, logout } = useAuth()
    const { organizationId, organization_id } = useParams()
    const { pathname } = useLocation()
    const isCreatingOrganization = pathname === "/create-organization"
    const organizationRouteMatch = pathname.match(
        /^\/(?:dashboard|projects|project)\/([^/]+)/
    )
    const organizationPageMatch = pathname.match(
        /^\/organizations\/([^/]+)\/(?:members|my-work|settings)(?:\/|$)/
    )
    const activeOrganizationId =
        organizationId ||
        organization_id ||
        organizationRouteMatch?.[1] ||
        organizationPageMatch?.[1]

    return (
        <nav aria-label="Main navigation">
            <Link
                to={
                    activeOrganizationId
                        ? `/dashboard/${activeOrganizationId}`
                        : "/organizations"
                }
            >
                <h1 className="text-3xl font-bold text-blue-600">
                    TeamFlow
                </h1>
            </Link>


            {activeOrganizationId && !isCreatingOrganization ? (
                <>
                    <Link to={`/dashboard/${activeOrganizationId}`}>Dashboard</Link>
                    <Link to={`/projects/${activeOrganizationId}`}>Projects</Link>
                    <Link to={`/organizations/${activeOrganizationId}/members`}>Members</Link>
                    <Link to={`/organizations/${activeOrganizationId}/my-work`}>My Work</Link>
                </>
            ) : !isCreatingOrganization ? (
                <Link to="/organizations">Organizations</Link>
            ) : null}

            <span>{user?.name}</span>
            <button type="button" onClick={logout}>Logout</button>
        </nav>
    )
}

export default NavBar
