import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

// importe os bancos:
import questionsInfiltracao from "./data/infiltracao.json";
import questionsBacia from "./data/bacia.json";
import questionsETP from "./data/evaporatranpiracao.json";

/* componente Quiz genérico (o mesmo que já criamos) */
function Quiz({ title, questions, onExit, storageKey = "quizHistory" }) {
  const QUESTION_TIME = 30;
  const [shuffled, setShuffled] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [phase, setPhase] = useState("start"); // start | quiz | result
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  function handleStart() {
    setShuffled([...questions].sort(() => Math.random() - 0.5));
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setTimeLeft(QUESTION_TIME);
    setHistory([]);
    localStorage.removeItem(storageKey);
    setPhase("quiz");
  }

  useEffect(() => {
    if (phase !== "quiz" || answered) return;
    if (timeLeft <= 0) {
      handleSubmit(null);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, answered, timeLeft]);

  const currentQ = shuffled[current];
  const progress = useMemo(
    () => ((current + 1) / (shuffled.length || 1)) * 100,
    [current, shuffled.length]
  );
  const timePct = useMemo(() => (timeLeft / QUESTION_TIME) * 100, [timeLeft]);

  function handleSubmit(idx) {
    if (answered || !currentQ) return;
    setSelected(idx);
    setAnswered(true);
    if (idx !== null && idx === currentQ.correctIndex) setScore((s) => s + 1);
  }

  function handleNext() {
    const result = {
      question: currentQ.question,
      correct: selected === currentQ.correctIndex,
      selected,
      correctIndex: currentQ.correctIndex,
    };
    const newHistory = [...history, result];
    setHistory(newHistory);
    localStorage.setItem(storageKey, JSON.stringify(newHistory));

    const isLast = current + 1 >= shuffled.length;
    if (isLast) {
      setPhase("result");
      return;
    }

    setCurrent((c) => c + 1);
    setSelected(null);
    setAnswered(false);
    setTimeLeft(QUESTION_TIME);
  }

  function handleResetToStart() {
    setPhase("start");
  }

  const AnswerButton = ({ idx, children }) => {
    if (!currentQ) return null;
    const isCorrect = idx === currentQ.correctIndex;
    const isSelected = idx === selected;
    let cls = "option";
    if (answered) {
      if (isCorrect) cls += " option--correct";
      else if (isSelected) cls += " option--wrong";
      else cls += " option--dim";
    }
    return (
      <button
        type="button"
        className={cls}
        onClick={() => handleSubmit(idx)}
        disabled={answered}
        aria-pressed={isSelected}
      >
        {children}
      </button>
    );
  };

  if (phase === "start") {
    return (
      <div className="page hero-bg">
        <div className="hero">
          <h1>{title}</h1>
          <p>
            Você terá <b>{QUESTION_TIME}s</b> por questão. Boa sorte!
          </p>
          <ul className="hero-list">
            <li>✔ Múltipla escolha</li>
            <li>✔ Feedback imediato</li>
            <li>✔ Sem salvar em servidor</li>
          </ul>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn" onClick={onExit}>
              ⬅ Voltar
            </button>
            <button className="btn btn--primary btn--lg" onClick={handleStart}>
              ▶ Iniciar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="page gradient">
        <div className="result">
          <h2>🎉 Concluído</h2>
          <p>
            Você acertou <b>{score}</b> de <b>{shuffled.length}</b> questões.
          </p>
          <div className="history">
            <h3>📜 Histórico</h3>
            <ul>
              {history.map((h, i) => {
                const q = questions.find((q) => q.question === h.question);
                return (
                  <li key={i} className={h.correct ? "ok" : "bad"}>
                    <div className="q">{h.question}</div>
                    {typeof h.selected === "number" && q && (
                      <div className="detail">
                        Sua escolha: <b>{q.options[h.selected] ?? "—"}</b> ·
                        Correta: <b>{q.options[h.correctIndex]}</b>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button className="btn" onClick={handleResetToStart}>
              🔄 Refazer
            </button>
            <button className="btn btn--primary" onClick={onExit}>
              ⬅ Voltar ao menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!shuffled.length)
    return (
      <div className="page">
        <div className="card loading">Carregando…</div>
      </div>
    );

  return (
    <div className="page gradient">
      <div className="card">
        <header className="header">
          <div className="title">
            {title} — Questão {current + 1} de {shuffled.length}
          </div>
          <div className="badge" aria-live="polite">
            ⏱ {timeLeft}s
          </div>
        </header>

        <div className="bar bar--time">
          <div className="bar__fill" style={{ width: `${timePct}%` }} />
        </div>
        <div className="bar">
          <div className="bar__fill" style={{ width: `${progress}%` }} />
        </div>

        <h1 className="question">{currentQ.question}</h1>
        <div className="grid">
          {currentQ.options.map((opt, idx) => (
            <button
              key={idx}
              className={
                "option" +
                (answered
                  ? idx === currentQ.correctIndex
                    ? " option--correct"
                    : idx === selected
                    ? " option--wrong"
                    : " option--dim"
                  : "")
              }
              onClick={() => !answered && handleSubmit(idx)}
              disabled={answered}
            >
              {opt}
            </button>
          ))}
        </div>

        {answered && (
          <div
            className={
              "feedback " + (selected === currentQ.correctIndex ? "ok" : "bad")
            }
          >
            {selected === currentQ.correctIndex
              ? "✅ Resposta Correta!"
              : "❌ Resposta Incorreta!"}
          </div>
        )}

        <footer className="actions">
          <button className="btn" onClick={onExit}>
            Sair
          </button>
          {answered ? (
            <button className="btn btn--primary" onClick={handleNext}>
              Próxima →
            </button>
          ) : (
            <button className="btn" onClick={() => handleSubmit(null)}>
              Pular / Sem resposta
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

/* ===========================
   Menu para escolher o quiz
   =========================== */
export default function RootApp() {
  const [which, setWhich] = useState(null); // "inf" | "bacia"

  if (which === "inf") {
    return (
      <Quiz
        title="Quiz de Infiltração"
        questions={questionsInfiltracao}
        storageKey="quizHistory_infiltracao"
        onExit={() => setWhich(null)}
      />
    );
  }
  if (which === "bacia") {
    return (
      <Quiz
        title="Quiz: Bacia Hidrográfica"
        questions={questionsBacia}
        storageKey="quizHistory_bacia"
        onExit={() => setWhich(null)}
      />
    );
  }
  if (which === "etp") {
    return (
      <Quiz
        title="Quiz: Evapotranspiração"
        questions={questionsETP}
        storageKey="quizHistory_etp"
        onExit={() => setWhich(null)}
      />
    );
  }

  return (
    <div className="page hero-bg">
      <div className="hero">
        <h1>QuizzHidro</h1>
        <p>Escolha um tema para responder:</p>
        <div className="hero-list" style={{ justifyContent: "center" }}>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => setWhich("bacia")}
          >
            ▶ Bacia Hidrográfica
          </button>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => setWhich("inf")}
          >
            ▶ Infiltração
          </button>
          <button
            className="btn btn--primary btn--lg"
            onClick={() => setWhich("etp")}
          >
            ▶ Evapotranspiração
          </button>
        </div>
      </div>
    </div>
  );
}
