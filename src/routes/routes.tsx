import App from "@/App";
import AuthComponent from "@/Auth/AuthComponent";
import AllProfile from "@/components/dashboard/AllProfile";
import AllUser from "@/components/dashboard/Edituser";
import MealControl from "@/components/dashboard/MealControl";
import LockExpired from "@/pages/LockExpired";
import LockedMeals from "@/pages/LockedMeals";
import MealSettings from "@/pages/MealSettings";
import BazarHisab from "@/pages/BazarHisab";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/Layouts/DashboardLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import UserManagement from "@/pages/UserManagement";
import { createBrowserRouter } from "react-router-dom";
import BuildingManagement from "@/pages/BuildingManagement";
import AllUserWalletBalance from "@/components/dashboard/AllUserWalletBalance";


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
      { path: "users-management", element: <UserManagement /> },
      { path: "building-management", element: <BuildingManagement /> },
      { path: "meals-control", element: <MealControl /> },
      { path: "lock-expired", element: <LockExpired /> },
      { path: "user", element: <AllUser /> },
      { path: "Profile", element: <AllProfile /> },
      { path: "userbalance", element: <AllUserWalletBalance /> },
      { path: "locked-meals", element: <LockedMeals /> },
      { path: "meal-settings", element: <MealSettings /> },
      { path: "bazar-hisab", element: <BazarHisab /> },
    ],
  },

  {
    path: "*",
    element: <NotFound />,
  },
]);

export default appRoutes;
