import { useState } from "react";
import Card from "../components/ui/Card";

export default function Profile() {
  const [form, setForm] = useState({
    fullName: "Dr. Sarah Johnson",
    email: "sarah.johnson@wildlife.org",
    phone: "+91 98765 43210",
    organization: "Wildlife Research Institute",
    role: "Wildlife Researcher",
    location: "Dehradun, Uttarakhand",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: PATCH to your user profile API
    console.log("profile update", form);
  };

  const fields = [
    { name: "fullName", label: "Full Name" },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone" },
    { name: "organization", label: "Organization" },
    { name: "role", label: "Role" },
    { name: "location", label: "Location" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-forest-900">Profile</h1>
        <p className="text-sm text-forest-400">Manage your profile information</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center text-center">
          <img
            src="https://i.pravatar.cc/120?img=47"
            alt={form.fullName}
            className="h-24 w-24 rounded-full object-cover"
          />
          <p className="mt-3 font-display font-semibold text-forest-900">{form.fullName}</p>
          <p className="text-xs text-forest-400">{form.role}</p>
          <button className="mt-4 w-full rounded-lg border border-surface-border py-2 text-sm font-medium text-forest-600">
            Edit Photo
          </button>
        </Card>

        <Card title="Personal Information" className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="mb-1 block text-xs font-medium text-forest-500">{field.label}</label>
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-forest-500"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-forest-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-forest-700"
              >
                Change Password
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
