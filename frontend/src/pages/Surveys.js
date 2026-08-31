import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "../App.css";
import DashboardLayout from "../components/DashboardLayout";

function Surveys() {
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    survey_code: "",
    title: "",
    habitat_type: "",
    protected_area: "",
    survey_date: ""
  });

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = () => {
    api.get("/surveys/")
      .then(res => setSurveys(res.data))
      .catch(err => console.log(err));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ✅ Create or Update
  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEditing && selectedSurvey) {
      api.put(`/surveys/${selectedSurvey.id}`, formData)
        .then(() => {
          alert("Survey Updated ✅");
          resetForm();
          loadSurveys();
        })
        .catch(err => console.log(err));
    } else {
      api.post("/surveys/", formData)
        .then(() => {
          alert("Survey Created ✅");
          resetForm();
          loadSurveys();
        })
        .catch(err => {
          console.log(err);
          alert("Not authorized ❌");
        });
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete?")) return;

    api.delete(`/surveys/${id}`)
      .then(() => {
        alert("Survey Deleted ✅");
        setSelectedSurvey(null);
        loadSurveys();
      })
      .catch(err => console.log(err));
  };

  const handleEdit = (survey) => {
    setSelectedSurvey(survey);
    setFormData({
      survey_code: survey.survey_code,
      title: survey.title,
      habitat_type: survey.habitat_type,
      protected_area: survey.protected_area,
      survey_date: survey.survey_date
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setFormData({
      survey_code: "",
      title: "",
      habitat_type: "",
      protected_area: "",
      survey_date: ""
    });
    setIsEditing(false);
    setSelectedSurvey(null);
  };

  return (
    <DashboardLayout title="Surveys">
      <div className="dashboard-container">
        <h2>My Surveys</h2>

        {/* ✅ Survey List */}
        <ul>
          {surveys.map((survey) => (
            <li
              key={survey.id}
              style={{ cursor: "pointer", marginBottom: "8px" }}
              onClick={() => setSelectedSurvey(survey)}
            >
              {survey.title} ({survey.habitat_type})
            </li>
          ))}
        </ul>

        {/* ✅ Survey Details */}
        {selectedSurvey && (
          <div style={{ marginTop: "20px", padding: "15px", border: "1px solid #ccc", borderRadius: "8px" }}>
            <h3>Survey Details</h3>
            <p><strong>Survey Code:</strong> {selectedSurvey.survey_code}</p>
            <p><strong>Title:</strong> {selectedSurvey.title}</p>
            <p><strong>Habitat Type:</strong> {selectedSurvey.habitat_type}</p>
            <p><strong>Protected Area:</strong> {selectedSurvey.protected_area}</p>
            <p><strong>Survey Date:</strong> {selectedSurvey.survey_date}</p>

            <button onClick={() => handleEdit(selectedSurvey)}>Edit</button>
            <button
              style={{ marginLeft: "10px", backgroundColor: "#dc2626" }}
              onClick={() => handleDelete(selectedSurvey.id)}
            >
              Delete
            </button>
          </div>
        )}

        <hr />

        {/* ✅ Create / Edit Form */}
        <h3>{isEditing ? "Edit Survey" : "Create Survey"}</h3>

        <form onSubmit={handleSubmit}>
          <input
            name="survey_code"
            placeholder="Survey Code"
            value={formData.survey_code}
            onChange={handleChange}
          />
          <br /><br />

          <input
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
          />
          <br /><br />

          <input
            name="habitat_type"
            placeholder="Habitat Type"
            value={formData.habitat_type}
            onChange={handleChange}
          />
          <br /><br />

          <input
            name="protected_area"
            placeholder="Protected Area"
            value={formData.protected_area}
            onChange={handleChange}
          />
          <br /><br />

          <input
            type="date"
            name="survey_date"
            value={formData.survey_date}
            onChange={handleChange}
          />
          <br /><br />

          <button type="submit">
            {isEditing ? "Update Survey" : "Create Survey"}
          </button>

          {isEditing && (
            <button
              type="button"
              style={{ marginLeft: "10px", backgroundColor: "#6b7280" }}
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}

export default Surveys;