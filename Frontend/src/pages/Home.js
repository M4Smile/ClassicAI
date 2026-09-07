import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Home.module.css';
import { apiUrl, getAuthHeaders } from '../api';

export default function Home() {
  const [inputMessage, setInputMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isTitleVisible, setIsTitleVisible] = useState(true);
  const [notePositions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedNoteInfo, setSelectedNoteInfo] = useState('');
  const canvasRef = useRef(null);
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const animationRef = useRef(null);
  const activeNoteIndexRef = useRef(-1);

  // Информация для каждой ноты
  const noteInfo = [
    `1. Краткая биография\n\nПётр Ильич Чайковский родился 7 мая 1840 года в городе Воткинске, в семье инженера.\n\n- В 1859 году окончил Училище правоведения в Санкт-Петербурге и начал работать в Министерстве юстиции.\n- В 1861 году поступил в Санкт-Петербургскую консерваторию, а в 1866 году окончил её с золотой медалью.\n- Работал профессором Московской консерватории, дирижёром и музыкальным критиком.\n- Умер 6 ноября 1893 года в Санкт-Петербурге.`,

    `2. Основные произведения\n\nБалеты:\n- «Лебединое озеро»\n- «Спящая красавица»\n- «Щелкунчик»\n\nОперы:\n- «Евгений Онегин»\n- «Пиковая дама»\n- «Иоланта»\n\nСимфонии:\n- Первая («Зимние грёзы»)\n- Четвёртая\n- Пятая\n- Шестая («Патетическая»)\n\nКонцерты:\n- Первый и Второй концерты для фортепиано с оркестром\n- Концерт для скрипки с оркестром\n\nРомансы:\n- «Мой гений, мой ангел, мой друг»\n- «Вечер»\n- «Средь шумного бала»`,

    `3. Стиль и влияние\n\n- Чайковский известен своим эмоциональным и мелодичным стилем, который сочетает в себе русскую народную музыку и западноевропейские традиции.\n- Его произведения отличаются глубиной чувств, лиричностью и драматизмом.\n- Чайковский оказал значительное влияние на развитие русской музыки и стал одним из самых известных композиторов в мире.`,

    `4. Интересные факты\n\n- Чайковский был одним из первых композиторов, кто использовал фортепиано как солирующий инструмент в концертах.\n- Он был известен своей любовью к путешествиям и часто посещал Европу, где изучал музыку и культуру других стран.\n- Чайковский написал более 80 произведений, включая оперы, балеты, симфонии, концерты и романсы.\n- Многие его произведения стали классикой и входят в репертуар ведущих театров и оркестров мира.`
  ];

  const handleNoteClick = useCallback((noteIndex) => {
    setSelectedNoteInfo(noteInfo[noteIndex]);
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (!formRef.current || !titleRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === formRef.current) {
            setIsTitleVisible(entry.isIntersecting);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '-50px 0px 0px 0px'
      }
    );

    observer.observe(formRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isAnimated || !canvasRef.current || !formRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const amplitude = canvas.height / 32;
    const frequency = 0.005;
    const speed = 0.0003;
    const numLines = 5;
    const staffSpacing = canvas.height / 30;
    const staffCenter = canvas.height / 2;
    const firstLineY = staffCenter - ((numLines - 1) / 2) * staffSpacing;
    const startX = -(canvas.width/4);
    const noteSize = staffSpacing * 1.2;
    const notesPerLine = 4;

    function drawNote(x, y, size, isHovered = false) {
      ctx.save();
      ctx.translate(x, y);
      
      // Рисуем штиль ноты
      ctx.beginPath();
      ctx.moveTo(size * 0.1, -size * 0.1);
      ctx.lineTo(size * 0.1, -size * 0.9);
      ctx.strokeStyle = isHovered ? '#ffcc88' : '#f5e6c7';
      ctx.lineWidth = size * 0.08;
      ctx.stroke();
      
      // Рисуем флажок ноты
      ctx.beginPath();
      ctx.moveTo(size * 0.1, -size * 0.9);
      ctx.bezierCurveTo(
        size * 0.4, -size * 0.85,
        size * 0.4, -size * 0.7,
        size * 0.1, -size * 0.65
      );
      ctx.strokeStyle = isHovered ? '#ffcc88' : '#f5e6c7';
      ctx.lineWidth = size * 0.08;
      ctx.stroke();

      ctx.beginPath();
      ctx.save();
      ctx.translate(0, 0);
      ctx.rotate(-Math.PI / 6);
      ctx.scale(1, 0.6);
      ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2);
      ctx.restore();
      ctx.fillStyle = isHovered ? '#ffcc88' : '#f5e6c7';
      ctx.fill();
      
      ctx.restore();
    }

    function drawWave(time, progressArray) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Рисуем линии
      for (let line = 0; line < numLines; line++) {
        const progress = progressArray[line];
        if (progress <= 0) continue;

        ctx.beginPath();
        const yBase = firstLineY + line * staffSpacing;
        ctx.moveTo(startX, yBase);

        const maxX = startX + (canvas.width - startX) * Math.min(progress, 1);

        for (let x = startX; x <= maxX; x += 2) {
          const y = yBase + Math.sin((x - startX) * frequency) * Math.cos(time * speed) * amplitude;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = '#f5e6c7';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Рисуем ноты
      const middleLineProgress = progressArray[Math.floor(numLines / 2)];
      if (middleLineProgress > 0) {
        const maxX = startX + (canvas.width - startX) * Math.min(middleLineProgress, 1);
        const noteSpacing = (maxX - startX - 300) / (notesPerLine + 1);
        
        for (let n = 1; n <= notesPerLine; n++) {
          const noteX = startX + 300 + noteSpacing * n;
          if (noteX <= maxX) {
            const baseY = notePositions[n-1];
            const waveOffset = Math.sin((noteX - startX) * frequency) * Math.cos(time * speed) * amplitude;
            const noteY = baseY + waveOffset;
            const isHovered = n - 1 === activeNoteIndexRef.current;
            drawNote(noteX, noteY, noteSize, isHovered);
          }
        }
      }
    }

    function isPointInNote(x, y, noteX, noteY, size) {
      const dx = x - noteX;
      const dy = y - noteY;
      return Math.sqrt(dx * dx + dy * dy) < size;
    }

    function handleCanvasClick(event) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const maxX = canvas.width;
      const noteSpacing = (maxX - startX - 300) / (notesPerLine + 1);

      for (let n = 1; n <= notesPerLine; n++) {
        const noteX = startX + 300 + noteSpacing * n;
        const baseY = notePositions[n-1];
        if (isPointInNote(x, y, noteX, baseY, noteSize)) {
          handleNoteClick(n-1);
          break;
        }
      }
    }

    function handleCanvasMove(event) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const maxX = canvas.width;
      const noteSpacing = (maxX - startX - 300) / (notesPerLine + 1);

      let newActiveNoteIndex = -1;
      for (let n = 1; n <= notesPerLine; n++) {
        const noteX = startX + 300 + noteSpacing * n;
        const baseY = notePositions[n-1];
        if (isPointInNote(x, y, noteX, baseY, noteSize)) {
          newActiveNoteIndex = n-1;
          break;
        }
      }

      if (newActiveNoteIndex !== activeNoteIndexRef.current) {
        activeNoteIndexRef.current = newActiveNoteIndex;
        canvas.style.cursor = newActiveNoteIndex !== -1 ? 'pointer' : 'default';
      }
    }

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMove);

    let startTime = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      const progressArray = Array(numLines).fill(0).map((_, i) => {
        const delay = i * 300;
        const localElapsed = elapsed - delay;
        let progress = localElapsed / 1000;
        return Math.min(Math.max(progress, 0), 1);
      });

      drawWave(timestamp, progressArray);
      animationRef.current = requestAnimationFrame(animate);
    }

    animate(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimated, notePositions, handleNoteClick]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    setLoading(true);
    setAnswer('');

    try {
      const response = await fetch(apiUrl('/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ prompt: inputMessage }),
      });
      if (!response.ok) throw new Error('Ошибка запроса');
      const data = await response.json();
      
      setIsAnimated(false);
      setAnswer(data.answer || 'Нет ответа');
    } catch (error) {
      setAnswer('Ошибка сервера');
    } finally {
      setLoading(false);
      setInputMessage('');
    }
  };

  return (
    <div className={`${styles.centerContainer} ${isAnimated ? styles.animated : ''}`}>
      <div 
        ref={titleRef}
        className={`${styles.title} ${!isTitleVisible ? styles.hidden : ''} ${isAnimated ? styles.hidden : ''}`}
      >
        CLASSICAI
      </div>
      <div style={{ position: 'relative', width: '800px', maxWidth: '95vw' }}>
        <form ref={formRef} onSubmit={handleSubmit} className={styles.inputForm}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Cпросите что-нибудь..."
            className={styles.input}
            disabled={loading}
          />
          <button
            type="submit"
            className={styles.button}
            aria-label="Send message"
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        {loading && (
          <div className={styles.loadingDots}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        )}
      </div>
      {isAnimated && (
        <canvas 
          ref={canvasRef} 
          className={styles.waveCanvas}
        />
      )}
      <div className={styles.answerArea}>
        {!loading && answer && <div className={styles.systemMessage}>{answer}</div>}
      </div>
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowModal(false)}>×</button>
            <div className={styles.modalContent}>
              {selectedNoteInfo.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
