import App from "@/App";
import AuthComponent from "@/Auth/AuthComponent";
import AllProfile from "@/components/dashboard/AllProfile";
import AllUser from "@/components/dashboard/AllUser";
import BillingGenerator from "@/components/dashboard/BillGenaretor";
import MealControl from "@/components/dashboard/MealControl";
import LockExpired from "@/pages/LockExpired";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/Layouts/DashboardLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import UserManagement from "@/pages/UserManagement";
import { createBrowserRouter } from "react-router-dom";
import BuildingManagement from "@/pages/BuildingManagement";


const appRoutes = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <AuthComponent /> }
    ]
  },
  {
    path: "admin-dashboard",
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "/admin-dashboard/users-management", element: <UserManagement /> },
      { path: "/admin-dashboard/building-management", element: <BuildingManagement /> },
      { path: "/admin-dashboard/meals-control", element: <MealControl /> },
      { path: "/admin-dashboard/lock-expired", element: <LockExpired /> },
      { path: "/admin-dashboard/bill-generator", element: <BillingGenerator /> },
      { path: "/admin-dashboard/user", element: <AllUser /> },
      { path: "/admin-dashboard/Profile", element: <AllProfile /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default appRoutes;
