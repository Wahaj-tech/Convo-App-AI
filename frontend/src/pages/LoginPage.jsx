import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import AuthShell, { AuthField, AuthButton } from "../components/AuthShell";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <AuthShell
      kicker="[ WELCOME BACK ]"
      title="Log in to"
      accent="ConvoApp."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#ea580c", fontWeight: 600 }}>
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          label="EMAIL"
          icon={Mail}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="johndoe@gmail.com"
        />
        <AuthField
          label="PASSWORD"
          icon={Lock}
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Enter your password"
        />
        <div className="mt-2">
          <AuthButton type="submit" loading={isLoggingIn}>Log In</AuthButton>
        </div>
      </form>
    </AuthShell>
  );
}

export default LoginPage;
