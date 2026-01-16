import App from "@/App";
import DashboardLayout from "@/Layouts/DashboardLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import UserManagement from "@/pages/UserManagement";
import { createBrowserRouter } from "react-router-dom";

const appRoutes = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "/users-management", element: <UserManagement /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default appRoutes;
