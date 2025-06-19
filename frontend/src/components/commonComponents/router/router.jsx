import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ChatLayout from "../../layouts/chatLayout/chatLayout";
import ProtectedRoute from "../protectedRoute/protectedRoute";
import Login from "../../pages/login/login";
import Signup from "../../pages/signup/signup";
import Homepage from "../../pages/homepage/homepage";
import Profile from "../../pages/profile/profile";
import Settings from "../../pages/settings/settings";
import NotFound from "../../pages/notFound/notFound";

const Router = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes with Chat Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<ChatLayout />}>
          {/* Main chat interface */}
          <Route index element={<Homepage />} />
          <Route path="/chat" element={<Homepage />} />
          <Route path="/chat/:chatId" element={<Homepage />} />

          {/* User profile */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />

          {/* Settings */}
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Redirect root to chat */}
      <Route path="/" element={<Navigate to="/chat" replace />} />

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Router;
