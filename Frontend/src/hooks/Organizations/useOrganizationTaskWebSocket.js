import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function getActiveOrganizationId(pathname) {
    const organizationRoute = pathname.match(
        /^\/(?:dashboard|projects|project)\/([^/]+)(?:\/|$)/
    );
    const organizationPageRoute = pathname.match(
        /^\/organizations\/([^/]+)\/(?:members|my-work|settings)(?:\/|$)/
    );

    return organizationRoute?.[1] ?? organizationPageRoute?.[1] ?? null;
}

export function useOrganizationTaskWebSocket() {
    const { pathname } = useLocation();
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const organizationId = getActiveOrganizationId(pathname);

    useEffect(() => {
        if (!isAuthenticated || !organizationId) {
            return undefined;
        }

        let isActive = true;
        let connectTimer;
        let reconnectTimer;
        let reconnectDelay = 1000;
        let socket;

        const invalidateOrganizationTaskQueries = () => {
            const queryKeys = [
                ["tasks", organizationId],
                ["task", organizationId],
                ["dashboard", organizationId],
                ["task-summary", organizationId],
                ["task-priority", organizationId],
                ["overdue-tasks", organizationId],
                ["unassign-tasks", organizationId],
                ["tasks-dueSoon", organizationId],
                ["recent-Tasks", organizationId],
                ["recent-updated-tasks", organizationId],
                ["search-tasks", organizationId],
                ["myTasks", organizationId],
                ["myProjects", organizationId],
                ["memberTasks", organizationId]
            ];

            return Promise.all(
                queryKeys.map((queryKey) =>
                    queryClient.invalidateQueries({ queryKey })
                )
            );
        };

        const connect = () => {
            if (!isActive) {
                return;
            }

            const websocketUrl = new URL(
                `/ws/${encodeURIComponent(organizationId)}`,
                api.defaults.baseURL
            );
            websocketUrl.protocol =
                websocketUrl.protocol === "https:" ? "wss:" : "ws:";

            const currentSocket = new WebSocket(websocketUrl);
            socket = currentSocket;

            currentSocket.onopen = () => {
                if (socket === currentSocket) {
                    reconnectDelay = 1000;
                }
            };

            currentSocket.onmessage = (messageEvent) => {
                let event;
                try {
                    event = JSON.parse(messageEvent.data);
                } catch {
                    return;
                }

                if (
                    !["Task Created", "Task Updated", "Task Deleted"].includes(
                        event?.event
                    ) ||
                    (event.organization_id !== undefined &&
                        String(event.organization_id) !== String(organizationId))
                ) {
                    return;
                }

                void invalidateOrganizationTaskQueries();
            };

            currentSocket.onclose = () => {
                if (socket !== currentSocket) {
                    return;
                }

                socket = undefined;
                if (!isActive) {
                    return;
                }

                reconnectTimer = window.setTimeout(connect, reconnectDelay);
                reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            };

            currentSocket.onerror = () => {
                currentSocket.close();
            };
        };

        connectTimer = window.setTimeout(connect, 0);

        return () => {
            isActive = false;
            window.clearTimeout(connectTimer);
            window.clearTimeout(reconnectTimer);
            socket?.close();
        };
    }, [isAuthenticated, organizationId, queryClient]);
}
