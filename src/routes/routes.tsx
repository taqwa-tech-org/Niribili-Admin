import App from "@/App";
import BillingGenerator from "@/components/dashboard/BillGenaretor";
import MealControl from "@/components/dashboard/MealControl";
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
      { path: "/meals-control", element: <MealControl /> },
      { path: "/bill-generator", element: <BillingGenerator /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default appRoutes;
