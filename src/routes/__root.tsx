import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-light dark:bg-dark text-dark dark:text-light">
      <Outlet />
    </div>
  ),
});
