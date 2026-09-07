import { useState } from 'react';
import styles from './Composer.module.css';
import { apiUrl, getAuthHeaders } from '../api';

export default function Composer() {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mid') && !file.name.toLowerCase().endsWith('.midi')) {
      setError('Please upload a MIDI file (.mid or .midi)');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(apiUrl('/simplify_music'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process MIDI file');
      }

      const data = await response.json();
      setPdfData(data.pdf);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>CLASSICAI</h1>
      <div className={styles.centeredContent}>
        <div className={styles.uploadArea}>
          <label className={styles.uploadButton}>
            <span className={styles.uploadText}>Упрости произведение</span>
            <div className={styles.uploadIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <input
              type="file"
              accept=".mid,.midi"
              onChange={handleFileUpload}
              className={styles.fileInput}
            />
          </label>
          {loading && <div className={styles.loading}>Обработка...</div>}
          {error && <div className={styles.error}>{error}</div>}
        </div>
        {pdfData && (
          <div className={styles.previewArea}>
            <iframe
              src={`data:application/pdf;base64,${pdfData}`}
              title="PDF Preview"
              className={styles.pdfPreview}
            />
          </div>
        )}
      </div>
    </div>
  );
}
