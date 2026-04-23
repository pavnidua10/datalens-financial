import { useState } from "react";
import axios from "axios";
import Landing from "./pages/landing";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [page, setPage] = useState("landing");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setResult(null);
    setPage("dashboard");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
       const res = await axios.post(`${API_URL}/api/analyze`, formData);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {page === "landing" && (
        <Landing onLaunch={() => setPage("dashboard")} onAnalyze={handleAnalyze} />
      )}
      {page === "dashboard" && (
        <Dashboard
          result={result}
          loading={loading}
          error={error}
          fileName={file?.name}
          onBack={() => setPage("landing")}
          onAnalyze={handleAnalyze}
        />
      )}
    </>
  );
}