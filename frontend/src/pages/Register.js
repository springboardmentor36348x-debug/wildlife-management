import React, { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "wildlife_researcher"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/register", formData);
      alert("Registration Successful ✅");
      navigate("/login");
    } catch {
      alert("Registration Failed ❌");
    }
  };

  return (
    <div className="container">
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        <input name="full_name" placeholder="Full Name" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} />

        <select name="role" onChange={handleChange}>
          <option value="wildlife_researcher">Wildlife Researcher</option>
          <option value="conservation_officer">Conservation Officer</option>
          <option value="forest_officer">Forest Officer</option>
        </select>

        <button type="submit">Register</button>
      </form>

      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;