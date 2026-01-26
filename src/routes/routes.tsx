import App from "@/App";
import AuthComponent from "@/Auth/AuthComponent";
import BillingGenerator from "@/components/dashboard/BillGenaretor";
import MealControl from "@/components/dashboard/MealControl";
import DashboardLayout from "@/Layouts/DashboardLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import UserManagement from "@/pages/UserManagement";
import { createBrowserRouter } from "react-router-dom";


const appRoutes = createBrowserRouter([
  {path : "/",
   element: <App/>,
   children: [
    {index: true, element : <AuthComponent/>}
   ]
  },
  {
    path: "admin-dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "/admin-dashboard/users-management", element: <UserManagement /> },
      { path: "/admin-dashboard/meals-control", element: <MealControl /> },
      { path: "/admin-dashboard/bill-generator", element: <BillingGenerator /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default appRoutes;
