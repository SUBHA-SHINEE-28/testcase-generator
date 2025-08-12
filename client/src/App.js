import { useState } from 'react';
import axios from 'axios';
import './style.css';

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState([])
  const [generatedCode, setGeneratedCode] = useState('');
  const [showFiles, setShowFiles] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');

  const formSubmit = async () => {
    try {
      const res = await axios.post(`http://localhost:5000/files`, {
        owner,
        repo
      });
      setFiles(res.data.files);
      setShowFiles(true);

    } catch (err) {
      console.error("Error generating summary:", err);
    }
  };

  const handleCheckboxChange = (file) => {
    setSelectedFiles(prev =>
      prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]
    );
  };

  const handleGenerateSummary = async () => {
    try {
      const res = await axios.post(`http://localhost:5000/generate-summary`, {
        files: selectedFiles,
        owner,
        repo
      });
      setSummaries(res.data.summaries);
      setShowSummary(true);
    }
    catch (err) {
      console.error("error gnerating summary:", err)
    }
  };

  const handleRadiobuttonChange = (summary) => {
    setSelectedSummary(prev =>
      prev[0] === summary ? [] : [summary]
    );
  };

  const handleGenerateCode = async () => {
    try {
      const res = await axios.post('http://localhost:5000/generate-code', { summary: selectedSummary });
      setGeneratedCode(res.data.generatedCode);
      setShowCode(true);
    }
    catch (err) {
      console.error(err);
      alert('Failed to generate code');
    }
  };

  return (
    <div style={{ padding: '25px', fontFamily: 'sans-serif',color: "white" }}>
      <center>   <h1 style={{ color: "white" }}>Test Case Generator</h1>      </center>

      <div class="row">
        <div class="col">
          <input type="text"
            class="form-control"
            value={owner}
            placeholder="Owner name"
            onChange={(e) => setOwner(e.target.value)}
            aria-label="First name" />
        </div>
        <div class="col">
          <input type="text"
            className="form-control"
            placeholder="Repo name"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            aria-label="Last name" />
        </div>
      </div>

      <br />

      <div className="d-grid gap-2 col-6 mx-auto">
        <button className="btn btn-info" onClick={formSubmit} type="button">Show Files</button>
      </div>

      {showFiles && (
        <>
          <h2>Select Files:</h2>
          {files.length > 0 ? (
            <ul>
              {files.map(file => (
                <li key={file}>
                  <label>
                    <input
                      type="checkbox"
                      onChange={() => handleCheckboxChange(file)}
                      checked={selectedFiles.includes(file)}
                    />
                    {file}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p>loading files ....</p>
          )}
          <button className="btn btn-info" onClick={() => handleGenerateSummary()}>Generate Summary</button>

        </>
      )}

      {showSummary && (
        <div style={{ marginTop: '20px' }}>
          <h2>Summary:</h2>
          {summaries.map(summary => (
            <label>
              <p>
                <input
                  type="radio"
                  name="summary"
                  onChange={() => handleRadiobuttonChange(summary)}
                  checked={selectedSummary.includes(summary)}
                />
                Topic: {summary.topic}
                <br />
                Decription:{summary.description}
                <br />
              </p>
            </label>

          ))}

          <p><button className="btn btn-info" onClick={() => handleGenerateCode(summaries)}>Generate Code</button></p>
        </div>
      )
      }

      {showCode && (
        <div>
          <h2>Generated Test Case Code</h2>
          <pre>{generatedCode}</pre>
        </div>
      )
      }
    </div >
  );
};

export default App;