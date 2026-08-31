import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

const FEATURES = [
  { icon: "📷", title: "Wildlife Image Analysis", desc: "Upload camera trap or drone images to automatically identify species with confidence scoring." },
  { icon: "🎧", title: "Bioacoustic Recognition", desc: "Identify species from audio recordings — bird calls, mammal vocalizations, and more." },
  { icon: "📊", title: "Biodiversity Analytics", desc: "Shannon and Simpson diversity indices, species richness, and evenness — computed in real time." },
  { icon: "🧬", title: "Species Catalog", desc: "A growing reference database of species, taxonomy, and conservation status." },
  { icon: "👥", title: "Role-Based Dashboards", desc: "Purpose-built views for researchers, conservation officers, forest officers, and admins." },
  { icon: "📄", title: "Monitoring Reports", desc: "Combined summaries of observations, detections, and biodiversity trends." },
];

function Home() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <nav className="home-navbar">
        <div className="home-navbar-brand">🌿 Wildlife PIS</div>
        <div className="home-navbar-links">
          <button onClick={() => scrollTo("home-top")}>Home</button>
          <button onClick={() => scrollTo("features")}>Features</button>
          <button onClick={() => scrollTo("about")}>About</button>
          <Link to="/login"><button className="home-navbar-login">Login</button></Link>
          <Link to="/register"><button className="home-navbar-register">Register</button></Link>
        </div>
      </nav>

      <div
        id="home-top"
        className="home-container"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/wildlife.png)`
        }}
      >
        <div className="overlay">
          <h1>Wildlife Population Intelligence System</h1>
          <p>AI-powered wildlife monitoring and biodiversity analysis platform</p>

          <div className="home-buttons">
            <Link to="/login">
              <button>Login</button>
            </Link>

            <Link to="/register">
              <button>Register</button>
            </Link>
          </div>
        </div>
      </div>

      <section id="features" className="home-features">
        <h2>Platform Capabilities</h2>
        <p className="home-features-subtitle">
          AI-powered tools for identifying species, tracking populations, and assessing habitat health
        </p>

        <div className="home-features-grid">
          {FEATURES.map((f, i) => (
            <div className="home-feature-card" key={i}>
              <div className="home-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="home-about">
        <h2>About This Platform</h2>
        <p>
          The Wildlife Population Intelligence System combines computer vision, bioacoustic
          analysis, and machine learning to help researchers, conservation officers, and forest
          departments monitor wildlife populations, detect endangered species, and assess habitat
          health — all from camera trap images, drone imagery, and field audio recordings.
        </p>
      </section>

      <footer className="home-footer">
        Wildlife Population Intelligence System — Built with FastAPI, React, TensorFlow &amp; PostgreSQL
      </footer>
    </div>
  );
}

export default Home;