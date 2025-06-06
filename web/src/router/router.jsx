import { createBrowserRouter, Outlet } from "react-router-dom";
import Home from "../pages/Home";
import Game from "../pages/Game";
import SignUp from "../pages/SignUp";
import SignIn from "../pages/SignIn";
import Leaderboard from "../pages/Leaderboard";
import Header from "../components/Header/Header";
import FooterCom from "../components/Footer/Footer";

const Layout = () => {
  return (
    <div>
      <div>
        <Header />
      </div>
      <div className="min-h-screen">
        <Outlet />
      </div>
      <FooterCom />
    </div>
  );
};

// Error boundary for route errors
const ErrorBoundary = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "game",
        element: <Game />,
      },
      {
        path: "sign-in",
        element: <SignIn />,
      },
      {
        path: "sign-up",
        element: <SignUp />,
      },
      {
        path: "leaderboard",
        element: <Leaderboard />,
      },
    ],
  },
  {
    path: "*",
    element: <ErrorBoundary />,
  },
]);

export default router;
