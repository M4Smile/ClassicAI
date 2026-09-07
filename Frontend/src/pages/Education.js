import React, { useState } from 'react';
import styles from './Education.module.css';
import { apiUrl, getAuthHeaders } from '../api';

export default function Education() {
  const [audioData, setAudioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp3')) {
      setError('Please upload an MP3 file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('prompt', prompt);

    try {
      const response = await fetch(apiUrl('/upload-audio'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process audio file');
      }

      const data = await response.json();
      setAudioData(data.audio_base64);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>CLASSICAI</h1>
        <div className={styles.uploadSection}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt"
            className={styles.promptInput}
          />
          <label className={styles.uploadButton}>
            <div className={styles.uploadText}>Нажмите чтобы загрузить или перетащите файл</div>
            <div className={styles.uploadIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="3" x2="12" y2="15"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
              </svg>
            </div>
            <input
              type="file"
              accept=".mp3"
              onChange={handleFileUpload}
              className={styles.fileInput}
            />
          </label>
          {loading && <div className={styles.loading}>Обработка...</div>}
          {error && <div className={styles.error}>{error}</div>}
        </div>
        {audioData && (
          <div className={styles.audioPlayer}>
            <audio controls src={`data:audio/mp3;base64,${audioData}`}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}
