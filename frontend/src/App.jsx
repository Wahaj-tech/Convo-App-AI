import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import ChatHubPage from './pages/ChatHubPage'
import PreviewIndexPage from './pages/PreviewIndexPage'
import PreviewRoutePage from './pages/PreviewRoutePage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import { useAuthStore } from './store/useAuthStore'
import PageLoader from './components/PageLoader'
import { Toaster } from "react-hot-toast";

// Decorated background (grid + glow) — used for the auth pages and design previews.
// The real chat app renders full-screen (no centered card), so it is NOT wrapped in this.
const DecoratedBg = ({ children }) => (
  <div className='min-h-screen bg-slate-900 relative flex items-center justify-center p-4 overflow-hidden'>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] -z-10" />
    <div className="absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px]" />
    <div className="absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px]" />
    {children}
  </div>
);

const App = () => {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return <PageLoader />;
  }

  return (
    <>
      <Routes>
        {/* Real app — full-screen, no decorated background */}
        <Route path='/' element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />

        {/* Auth pages — full-screen editorial light theme (own background) */}
        <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />

        {/* Figma design previews — public routes for review */}
        <Route path='/hub' element={<DecoratedBg><ChatHubPage /></DecoratedBg>} />
        <Route path='/preview' element={<DecoratedBg><PreviewIndexPage /></DecoratedBg>} />
        <Route path='/preview/:slug' element={<DecoratedBg><PreviewRoutePage /></DecoratedBg>} />
      </Routes>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
};

export default App;
