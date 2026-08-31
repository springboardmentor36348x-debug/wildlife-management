import React, { useEffect, useState, useContext } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";

ChartJS.register(ArcElement, Tooltip, Legend);

function AdminPanel() {
  useContext(AuthContext);
  const [users, setUsers] = useState([]);

  const loadUsers = () => {
    api.get("/auth/users").then((res) => setUsers(res.data)).catch((err) => console.log(err));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleActive = (user) => {
    const action = user.is_active ? "deactivate" : "activate";
    api.patch(`/auth/users/${user.id}/${action}`).then(() => loadUsers()).catch((err) => console.log(err));
  };

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.length - activeCount;

  const donutData = {
    labels: ["Active", "Deactivated"],
    datasets: [
      {
        data: [activeCount, inactiveCount],
        backgroundColor: ["#17d97b", "#232b36"],
        borderWidth: 0,
      },
    ],
  };

  const donutOptions = {
    cutout: "72%",
    plugins: { legend: { labels: { color: "#8a95a1" } } },
  };

  return (
    <DashboardLayout title="Admin Panel">
      <div className="stat-grid">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard label="Deactivated" value={inactiveCount} />
      </div>

      <div className="dl-panels">
        <div className="panel">
          <div className="panel-title">All Users</div>

          {users.length === 0 && <p style={{ color: "#8a95a1" }}>No users found</p>}

          {users.length > 0 && (
            <table className="dl-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td style={{ textTransform: "capitalize" }}>{user.role.replace(/_/g, " ")}</td>
                    <td>
                      <span className={"badge " + (user.is_active ? "active" : "inactive")}>
                        {user.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>
                      <button className="toggle-btn" onClick={() => toggleActive(user)}>
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">User Status</div>
          {users.length > 0 ? (
            <Doughnut data={donutData} options={donutOptions} />
          ) : (
            <p style={{ color: "#8a95a1" }}>No data yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminPanel;