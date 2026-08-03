"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

type Site = {
  id: number;
  location_name: string;
  latitude: number;
  longitude: number;
};

type Survey = {
  id: number;
  site_id: number;
  survey_date: string;
  status: string;
};

type Device = {
  id: number;
  site_id: number;
  device_type: string;
  serial_number: string;
};

type Observation = {
  id: number;
  survey_id: number;
  file_type: string;
  uploaded_at: string;
  processing_status: string;
};

export default function UnifiedDashboard() {

  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");

  // Dashboard Data

  const [sites, setSites] = useState<Site[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Site Form

  const [siteForm, setSiteForm] = useState({
    location_name: "",
    latitude: "",
    longitude: "",
    habitat_type: "",
    protected_area: "",
    monitoring_device_type: "",
  });

  // Survey Form

  const [surveyForm, setSurveyForm] = useState({
    site_id: "",
    survey_date: "",
    notes: "",
  });

  // Device Form

  const [deviceForm, setDeviceForm] = useState({
    site_id: "",
    device_type: "camera_trap",
    serial: "",
  });

  // Upload Form

  const [uploadForm, setUploadForm] = useState({
    survey_id: "",
    file: null as File | null,
  });

  // Load dashboard

  const fetchData = async () => {
    try {

      const [
        sitesRes,
        surveysRes,
        devicesRes,
        obsRes
      ] = await Promise.all([

        api.get("/monitoring/sites"),
        api.get("/monitoring/surveys"),
        api.get("/monitoring/devices"),
        api.get("/observations"),

      ]);

      setSites(sitesRes.data);
      setSurveys(surveysRes.data);
      setDevices(devicesRes.data);
      setObservations(obsRes.data);

    } catch (err) {

      console.error(err);

    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create Site

  const handleCreateSite = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);

    try {

      await api.post("/monitoring/sites", {

        ...siteForm,

        latitude: parseFloat(siteForm.latitude),

        longitude: parseFloat(siteForm.longitude),

      });

      setMessage("Monitoring Site Created");

      fetchData();

      setSiteForm({

        location_name: "",
        latitude: "",
        longitude: "",
        habitat_type: "",
        protected_area: "",
        monitoring_device_type: "",

      });

    } catch {

      setMessage("Unable to create site");

    }

    setLoading(false);

  };

  // Register Survey

  const handleCreateSurvey = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);

    try {

      await api.post("/monitoring/surveys", {

        ...surveyForm,

        site_id: Number(surveyForm.site_id),

      });

      setMessage("Survey Registered");

      fetchData();

      setSurveyForm({

        site_id: "",
        survey_date: "",
        notes: "",

      });

    } catch {

      setMessage("Unable to register survey");

    }

    setLoading(false);

  };

  // Register Device

  const handleRegisterDevice = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setLoading(true);

    try {

      await api.post("/monitoring/devices", {

        ...deviceForm,

        site_id: Number(deviceForm.site_id),

      });

      fetchData();

      setMessage("Device Registered");

      setDeviceForm({

        site_id: "",
        device_type: "camera_trap",
        serial: "",

      });

    } catch {

      setMessage("Unable to register device");

    }

    setLoading(false);

  };

  // Upload Observation

  const handleUpload = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!uploadForm.file || !uploadForm.survey_id) {

      setMessage("Select survey and file");

      return;

    }

    const formData = new FormData();

    formData.append(
      "survey_id",
      uploadForm.survey_id
    );

    formData.append(
      "file",
      uploadForm.file
    );

    setLoading(true);

    try {

      await api.post(

        "/observations/upload",

        formData,

        {

          headers: {

            "Content-Type":
              "multipart/form-data",

          },

        }

      );

      fetchData();

      setMessage("Observation Uploaded");

      setUploadForm({

        survey_id: "",

        file: null,

      });

    } catch {

      setMessage("Upload Failed");

    }

    setLoading(false);

  };

  const renderContent = () => {
        switch (activeTab) {

      case "dashboard":
        return (

          <>

            {message && (
              <div className="mb-6 rounded-lg bg-green-100 border border-green-300 p-4 text-green-800">
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-gray-500">Monitoring Sites</h2>
                <p className="text-4xl font-bold text-green-700 mt-3">
                  {sites.length}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-gray-500">Surveys</h2>
                <p className="text-4xl font-bold text-blue-700 mt-3">
                  {surveys.length}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-gray-500">Devices</h2>
                <p className="text-4xl font-bold text-orange-600 mt-3">
                  {devices.length}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-gray-500">Observations</h2>
                <p className="text-4xl font-bold text-purple-700 mt-3">
                  {observations.length}
                </p>
              </div>

            </div>

          </>

        );

      case "sites":

        return (

          <div className="bg-white rounded-xl shadow p-8">

            <h2 className="text-2xl font-bold mb-6">
              Create Monitoring Site
            </h2>

            <form
              onSubmit={handleCreateSite}
              className="grid md:grid-cols-2 gap-4"
            >

              <input
                placeholder="Location Name"
                className="border rounded-lg p-3"
                value={siteForm.location_name}
                onChange={(e) =>
                  setSiteForm({
                    ...siteForm,
                    location_name: e.target.value,
                  })
                }
              />

              <input
                placeholder="Latitude"
                className="border rounded-lg p-3"
                value={siteForm.latitude}
                onChange={(e) =>
                  setSiteForm({
                    ...siteForm,
                    latitude: e.target.value,
                  })
                }
              />

              <input
                placeholder="Longitude"
                className="border rounded-lg p-3"
                value={siteForm.longitude}
                onChange={(e) =>
                  setSiteForm({
                    ...siteForm,
                    longitude: e.target.value,
                  })
                }
              />

              <button
                disabled={loading}
                className="bg-green-700 text-white rounded-lg p-3"
              >
                Create Site
              </button>

            </form>

            <hr className="my-8"/>

            <h2 className="text-xl font-bold mb-4">
              Existing Monitoring Sites
            </h2>

            <table className="w-full border">

              <thead>

                <tr className="bg-gray-100">

                  <th className="border p-2">ID</th>
                  <th className="border p-2">Location</th>
                  <th className="border p-2">Latitude</th>
                  <th className="border p-2">Longitude</th>

                </tr>

              </thead>

              <tbody>

                {sites.map(site => (

                  <tr key={site.id}>

                    <td className="border p-2">{site.id}</td>
                    <td className="border p-2">{site.location_name}</td>
                    <td className="border p-2">{site.latitude}</td>
                    <td className="border p-2">{site.longitude}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        );

      case "surveys":

        return (

          <div className="bg-white rounded-xl shadow p-8">

            <h2 className="text-2xl font-bold mb-6">
              Register Survey
            </h2>

            <form
              onSubmit={handleCreateSurvey}
              className="grid md:grid-cols-2 gap-4"
            >

              <select
                className="border rounded-lg p-3"
                value={surveyForm.site_id}
                onChange={(e)=>
                  setSurveyForm({
                    ...surveyForm,
                    site_id:e.target.value
                  })
                }
              >

                <option value="">Select Site</option>

                {sites.map(site=>(
                  <option
                    key={site.id}
                    value={site.id}
                  >
                    {site.location_name}
                  </option>
                ))}

              </select>

              <input
                type="date"
                className="border rounded-lg p-3"
                value={surveyForm.survey_date}
                onChange={(e)=>
                  setSurveyForm({
                    ...surveyForm,
                    survey_date:e.target.value
                  })
                }
              />

              <textarea
                placeholder="Survey Notes"
                className="border rounded-lg p-3 md:col-span-2"
                rows={4}
                value={surveyForm.notes}
                onChange={(e)=>
                  setSurveyForm({
                    ...surveyForm,
                    notes:e.target.value
                  })
                }
              />

              <button
                className="bg-blue-700 text-white rounded-lg p-3"
              >
                Register Survey
              </button>

            </form>

            <hr className="my-8"/>

            <table className="w-full border">

              <thead>

                <tr className="bg-gray-100">

                  <th className="border p-2">ID</th>
                  <th className="border p-2">Site</th>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Status</th>

                </tr>

              </thead>

              <tbody>

                {surveys.map(s=>(
                  <tr key={s.id}>

                    <td className="border p-2">{s.id}</td>
                    <td className="border p-2">{s.site_id}</td>
                    <td className="border p-2">{s.survey_date}</td>
                    <td className="border p-2">{s.status}</td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        );
              case "devices":

        return (

          <div className="bg-white rounded-xl shadow p-8">

            <h2 className="text-2xl font-bold mb-6">
              Register Device
            </h2>

            <form
              onSubmit={handleRegisterDevice}
              className="grid md:grid-cols-2 gap-4"
            >

              <select
                className="border rounded-lg p-3"
                value={deviceForm.site_id}
                onChange={(e) =>
                  setDeviceForm({
                    ...deviceForm,
                    site_id: e.target.value,
                  })
                }
              >
                <option value="">Select Site</option>

                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.location_name}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-lg p-3"
                value={deviceForm.device_type}
                onChange={(e) =>
                  setDeviceForm({
                    ...deviceForm,
                    device_type: e.target.value,
                  })
                }
              >
                <option value="camera_trap">Camera Trap</option>
                <option value="audio_recorder">Audio Recorder</option>
                <option value="drone">Drone</option>
                <option value="satellite">Satellite</option>
              </select>

              <input
                placeholder="Serial Number"
                className="border rounded-lg p-3"
                value={deviceForm.serial}
                onChange={(e) =>
                  setDeviceForm({
                    ...deviceForm,
                    serial: e.target.value,
                  })
                }
              />

              <button
                className="bg-orange-600 text-white rounded-lg p-3"
              >
                Register Device
              </button>

            </form>

            <hr className="my-8"/>

            <h2 className="text-xl font-bold mb-4">
              Registered Devices
            </h2>

            <table className="w-full border">

              <thead>

                <tr className="bg-gray-100">

                  <th className="border p-2">ID</th>
                  <th className="border p-2">Site</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Serial</th>

                </tr>

              </thead>

              <tbody>

                {devices.map((device) => (

                  <tr key={device.id}>

                    <td className="border p-2">{device.id}</td>
                    <td className="border p-2">{device.site_id}</td>
                    <td className="border p-2">{device.device_type}</td>
                    <td className="border p-2">{device.serial_number}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        );

      case "observations":

        return (

          <div className="bg-white rounded-xl shadow p-8">

            <h2 className="text-2xl font-bold mb-6">
              Upload Observation
            </h2>

            <form
              onSubmit={handleUpload}
              className="grid md:grid-cols-2 gap-4"
            >

              <select
                className="border rounded-lg p-3"
                value={uploadForm.survey_id}
                onChange={(e)=>
                  setUploadForm({
                    ...uploadForm,
                    survey_id:e.target.value
                  })
                }
              >

                <option value="">Select Survey</option>

                {surveys.map((survey)=>(

                  <option
                    key={survey.id}
                    value={survey.id}
                  >
                    Survey #{survey.id}
                  </option>

                ))}

              </select>

              <input
                type="file"
                className="border rounded-lg p-3"
                onChange={(e)=>
                  setUploadForm({
                    ...uploadForm,
                    file:e.target.files?.[0] || null
                  })
                }
              />

              <button
                className="bg-purple-700 text-white rounded-lg p-3"
              >
                Upload Observation
              </button>

            </form>

            <hr className="my-8"/>

            <h2 className="text-xl font-bold mb-4">
              Observation History
            </h2>

            <table className="w-full border">

              <thead>

                <tr className="bg-gray-100">

                  <th className="border p-2">ID</th>
                  <th className="border p-2">Survey</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Uploaded</th>
                  <th className="border p-2">Status</th>

                </tr>

              </thead>

              <tbody>

                {observations.map((obs)=>(

                  <tr key={obs.id}>

                    <td className="border p-2">{obs.id}</td>

                    <td className="border p-2">
                      {obs.survey_id}
                    </td>

                    <td className="border p-2">
                      {obs.file_type}
                    </td>

                    <td className="border p-2">
                      {new Date(obs.uploaded_at).toLocaleDateString()}
                    </td>

                    <td className="border p-2">
                      {obs.processing_status}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        );

      default:
        return null;
          }
        };

  const menuItems = [
    { key: "dashboard", label: "🏠 Dashboard" },
    { key: "sites", label: "📍 Monitoring Sites" },
    { key: "surveys", label: "📝 Surveys" },
    { key: "devices", label: "📷 Devices" },
    { key: "observations", label: "🦁 Observations" },
    { key: "administration", label: "👤 Administration" },
    { key: "forest", label: "🌳 Forest Officer" },
    { key: "conservation", label: "🌿 Conservation Officer" },
  ];

  return (
    <ProtectedRoute
      allowedRoles={[
        "Wildlife Researcher",
        "Conservation Officer",
        "Forest Department Officer",
        "Administrator",
      ]}
    >
      <div className="min-h-screen flex bg-gray-100">

        {/* Sidebar */}

        <aside className="w-72 bg-green-900 text-white">

          <div className="p-6 border-b border-green-700">

            <h1 className="text-2xl font-bold">
              Wildlife Population Intelligence System
            </h1>

            <p className="text-green-200 mt-3">
              {user?.name}
            </p>

            <p className="text-sm text-green-300">
              {user?.role}
            </p>

          </div>

          <nav className="p-4">

            {menuItems.map((item) => (

              <button

                key={item.key}

                onClick={() => setActiveTab(item.key)}

                className={`w-full text-left px-5 py-3 rounded-lg mb-2 transition

                ${
                  activeTab === item.key
                    ? "bg-green-600"
                    : "hover:bg-green-800"
                }`}

              >

                {item.label}

              </button>

            ))}

          </nav>

        </aside>

        {/* Main */}

        <div className="flex-1">

          <header className="bg-white shadow px-8 py-6 flex justify-between items-center">

            <div>

              <h2 className="text-3xl font-bold text-green-700">

                Wildlife Population Intelligence Dashboard

              </h2>

              <p className="text-gray-500 mt-2">

                Unified Biodiversity Monitoring Platform

              </p>

            </div>

            <button

              onClick={logout}

              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"

            >

              Sign Out

            </button>

          </header>

          <main className="p-8">

            {activeTab === "administration" && (

              <div className="bg-white rounded-xl shadow p-8">

                <h2 className="text-2xl font-bold mb-4">

                  Administrator Panel

                </h2>

                <div className="grid grid-cols-4 gap-6">

                  <div className="bg-blue-100 rounded-lg p-6">

                    <h3>Total Users</h3>

                    <p className="text-4xl font-bold mt-3">

                      24

                    </p>

                  </div>

                  <div className="bg-green-100 rounded-lg p-6">

                    <h3>Researchers</h3>

                    <p className="text-4xl font-bold mt-3">

                      10

                    </p>

                  </div>

                  <div className="bg-yellow-100 rounded-lg p-6">

                    <h3>Forest Officers</h3>

                    <p className="text-4xl font-bold mt-3">

                      8

                    </p>

                  </div>

                  <div className="bg-purple-100 rounded-lg p-6">

                    <h3>Conservation Officers</h3>

                    <p className="text-4xl font-bold mt-3">

                      6

                    </p>

                  </div>

                </div>

              </div>

            )}

            {activeTab === "forest" && (

              <div className="bg-white rounded-xl shadow p-8">

                <h2 className="text-2xl font-bold mb-4">

                  Forest Department Officer

                </h2>

                <ul className="list-disc ml-6 space-y-2">

                  <li>Assigned Monitoring Sites</li>

                  <li>Forest Patrol Records</li>

                  <li>Incident Reports</li>

                  <li>Camera Trap Status</li>

                  <li>Protected Area Monitoring</li>

                </ul>

              </div>

            )}

            {activeTab === "conservation" && (

              <div className="bg-white rounded-xl shadow p-8">

                <h2 className="text-2xl font-bold mb-4">

                  Conservation Officer

                </h2>

                <ul className="list-disc ml-6 space-y-2">

                  <li>Habitat Health Overview</li>

                  <li>Biodiversity Trends</li>

                  <li>Species Distribution</li>

                  <li>Conservation Alerts</li>

                  <li>Population Monitoring Summary</li>

                </ul>

              </div>

            )}

            {!["administration", "forest", "conservation"].includes(activeTab) &&
              renderContent()}

          </main>

        </div>

      </div>

    </ProtectedRoute>
  );

}