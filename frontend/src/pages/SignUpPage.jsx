import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { User, Mail, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import AuthShell, { AuthField, AuthButton } from "../components/AuthShell";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const { signup, isSigningUp } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData);
  };

  return (
    <AuthShell
      kicker="[ START YOUR JOURNEY ]"
      title="Create your"
      accent="account."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#ea580c", fontWeight: 600 }}>
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          label="FULL NAME"
          icon={User}
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="John Doe"
        />
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
          <AuthButton type="submit" loading={isSigningUp}>Create Account</AuthButton>
        </div>
      </form>
    </AuthShell>
  );
}

export default SignUpPage;
