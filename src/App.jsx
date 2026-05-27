import React, { useState, useEffect } from 'react';

// Automatically swaps between local server and production server URLs
const API_BASE = import.meta.env.PROD
  ? "https://your-backend-deployed-link.onrender.com/api"
  : "http://localhost:8000/api";

export default function App() {
  // Navigation & User State
  const [view, setView] = useState('exam'); // exam, subject, chapter, quiz, dashboard
  const [userId] = useState(() => `user_${Math.random().toString(36).substring(2, 11)}`);

  // Data State
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);

  // Active Selections
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);

  // Active Quiz State
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [shownAt, setShownAt] = useState(null);

  // Analytics Dashboard State
  const [analytics, setAnalytics] = useState(null);

  // Fetch initial exams on mount
  useEffect(() => {
    fetch(`${API_BASE}/exams`)
      .then(res => res.json())
      .then(data => setExams(data))
      .catch(err => console.error("Error loading exams:", err));
  }, []);

  // Fetch subjects when an exam is selected
  const handleSelectExam = (exam) => {
    setSelectedExam(exam);
    fetch(`${API_BASE}/exams/${exam.id}/subjects`)
      .then(res => res.json())
      .then(data => {
        setSubjects(data);
        setView('subject');
      });
  };

  // Fetch chapters when a subject is selected
  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    fetch(`${API_BASE}/subjects/${subject.id}/chapters`)
      .then(res => res.json())
      .then(data => {
        setChapters(data);
        setView('chapter');
      });
  };

  // Start Quiz Session
  const handleSelectChapter = (chapter) => {
    setSelectedChapter(chapter);
    fetch(`${API_BASE}/quiz/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, chapter_id: chapter.id })
    })
      .then(res => res.json())
      .then(data => {
        setSessionId(data.session_id);
        setCurrentQuestion(data.question);
        setCurrentIndex(data.current_index);
        setTotalQuestions(data.total_questions);
        setSelectedOption(null);
        setShownAt(new Date().toISOString()); // Track exact timestamp question was displayed
        setView('quiz');
      });
  };

  // Submit Answer & Fetch Next Question
  const handleNextQuestion = () => {
    if (selectedOption === null) return alert("Please pick an option first!");

    const submittedAt = new Date().toISOString();

    fetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        question_id: currentQuestion.id,
        selected_option: selectedOption,
        shown_at: shownAt,
        submitted_at: submittedAt
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'completed') {
          alert("🎉 Quiz completed successfully!");
          handleViewDashboard();
        } else {
          setCurrentQuestion(data.next_question);
          setCurrentIndex(data.current_index);
          setSelectedOption(null);
          setShownAt(new Date().toISOString()); // Reset display timestamp for next question
        }
      });
  };

  // Fetch Analytics Metrics
  const handleViewDashboard = () => {
    fetch(`${API_BASE}/analytics/dashboard`)
      .then(res => res.json())
      .then(data => {
        setAnalytics(data);
        setView('dashboard');
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col items-center">
      {/* Universal Top Branding Header */}
      <header className="w-full max-w-md bg-[#075E54] text-white px-4 py-3 shadow flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="font-bold text-lg">SkillBytes Quiz</h1>
          <p className="text-xs text-emerald-200">Active User: {userId}</p>
        </div>
        <button
          onClick={view === 'dashboard' ? () => setView('exam') : handleViewDashboard}
          className="bg-[#128C7E] hover:bg-emerald-600 px-3 py-1.2 rounded text-xs font-semibold tracking-wide transition shadow-sm"
        >
          {view === 'dashboard' ? "🏠 Home" : "📊 Dashboard"}
        </button>
      </header>

      {/* Main Container Simulated Phone Wrapper */}
      <main className="w-full max-w-md flex-1 bg-[#E5DDD5] flex flex-col shadow-inner overflow-y-auto relative pb-8">

        {/* STEP 1: EXAM NAVIGATION VIEW */}
        {view === 'exam' && (
          <div className="p-4 flex flex-col gap-3">
            <div className="bg-emerald-50 border-l-4 border-[#075E54] p-3 rounded text-sm text-gray-700 font-medium">
              Welcome! Please select an examination path below to start your assessment. No signup required.
            </div>
            <h2 className="text-gray-600 font-bold uppercase text-xs tracking-wider px-1 mt-2">Available Exams</h2>
            {exams.map(exam => (
              <button key={exam.id} onClick={() => handleSelectExam(exam)} className="w-full bg-white p-4 rounded-lg shadow-sm hover:shadow transition border border-gray-200 text-left">
                <div className="font-bold text-gray-800 text-base">{exam.name}</div>
                {exam.description && <div className="text-xs text-gray-500 mt-1">{exam.description}</div>}
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: SUBJECT NAVIGATION VIEW */}
        {view === 'subject' && (
          <div className="p-4 flex flex-col gap-3">
            <button onClick={() => setView('exam')} className="text-xs text-[#075E54] font-semibold flex items-center gap-1 hover:underline">← Change Exam ({selectedExam?.name})</button>
            <h2 className="text-gray-600 font-bold uppercase text-xs tracking-wider px-1 mt-1">Select Subject</h2>
            {subjects.map(subject => (
              <button key={subject.id} onClick={() => handleSelectSubject(subject)} className="w-full bg-white p-4 rounded-lg shadow-sm hover:shadow text-left border border-gray-200 font-semibold text-gray-700">
                📚 {subject.name}
              </button>
            ))}
          </div>
        )}

        {/* STEP 3: CHAPTER NAVIGATION VIEW */}
        {view === 'chapter' && (
          <div className="p-4 flex flex-col gap-3">
            <button onClick={() => setView('subject')} className="text-xs text-[#075E54] font-semibold flex items-center gap-1 hover:underline">← Change Subject ({selectedSubject?.name})</button>
            <h2 className="text-gray-600 font-bold uppercase text-xs tracking-wider px-1 mt-1">Select Chapter</h2>
            {chapters.map(chapter => (
              <button key={chapter.id} onClick={() => handleSelectChapter(chapter)} className="w-full bg-white p-4 rounded-lg shadow-sm hover:shadow text-left border border-gray-200 font-semibold text-gray-700 hover:border-emerald-500 transition">
                📝 {chapter.name}
              </button>
            ))}
          </div>
        )}

        {/* STEP 4: WHATSAPP STYLE INTERACTIVE CHAT ROOM */}
        {view === 'quiz' && currentQuestion && (
          <div className="flex-1 flex flex-col h-full">
            {/* Contact Status Sub-Bar */}
            <div className="bg-[#edf2f0] px-4 py-2 border-b border-gray-200 text-xs text-gray-600 font-medium flex justify-between items-center">
              <span>🎯 {selectedChapter?.name} ({currentIndex + 1}/{totalQuestions})</span>
              <span className="flex items-center gap-1 text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Assessment Active</span>
            </div>

            {/* Chat Messages Scrolling Window */}
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
              {/* Question: Incoming System Message Bubble */}
              <div className="max-w-[85%] bg-white rounded-lg rounded-tl-none p-3.5 shadow-sm text-gray-800 relative self-start border border-gray-100">
                <div className="text-xs font-bold text-amber-600 mb-1">System Examiner</div>
                <div className="text-sm font-medium leading-relaxed">{currentQuestion.question_text}</div>
                <span className="block text-[10px] text-gray-400 text-right mt-1.5">Delivered</span>
              </div>

              {/* Options Selection Bubble Menu */}
              <div className="w-full flex flex-col gap-2 mt-2">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-[85%] p-3 rounded-lg text-sm font-medium text-left transition shadow-sm border ${isSelected
                          ? 'bg-[#DCF8C6] border-emerald-400 text-emerald-900 ml-auto rounded-tr-none'
                          : 'bg-white border-gray-200 text-gray-700 rounded-tl-none self-start hover:bg-gray-50'
                        }`}
                    >
                      <span className="inline-block bg-gray-100 font-bold rounded px-1.5 py-0.5 text-xs mr-2 text-gray-500">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Footer Typing/Action Bar */}
            <div className="p-3 bg-[#f0f0f0] border-t border-gray-200 flex items-center justify-between gap-2 sticky bottom-0">
              <div className="flex-1 bg-white rounded-full px-4 py-2 text-xs text-gray-400 shadow-sm border border-gray-100">
                {selectedOption !== null ? `Selected Option ${String.fromCharCode(65 + selectedOption)}` : "Pick an answer response bubble..."}
              </div>
              <button
                onClick={handleNextQuestion}
                disabled={selectedOption === null}
                className={`px-5 py-2 rounded-full font-bold text-sm text-white shadow transition flex items-center gap-1 ${selectedOption !== null ? 'bg-[#128C7E] hover:bg-[#075E54]' : 'bg-gray-300 cursor-not-allowed'
                  }`}
              >
                Next ➔
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: CORE ANALYTICS INSIGHTS DASHBOARD */}
        {view === 'dashboard' && analytics && (
          <div className="p-4 flex flex-col gap-4">
            <h2 className="text-gray-800 font-extrabold text-lg border-b border-gray-300 pb-1">Analytics Dashboard</h2>

            {/* Metrics High Value Grid Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Served / Answered</div>
                <div className="text-xl font-black text-gray-800 mt-1">{analytics.summary.questions_answered}</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Avg Duration</div>
                <div className="text-xl font-black text-emerald-600 mt-1">{analytics.summary.average_response_time_seconds}s</div>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 col-span-2">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Quiz Completion Rate</div>
                <div className="text-xl font-black text-blue-600 mt-1">{analytics.summary.quiz_completion_rate_percentage}%</div>
              </div>
            </div>

            {/* Daily Active Users Log Table */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📈 Daily Active Users (7D Window)</h3>
              <div className="text-xs divide-y divide-gray-100 max-h-32 overflow-y-auto">
                {analytics.daily_active_users.map((row, i) => (
                  <div key={i} className="py-2 flex justify-between">
                    <span className="text-gray-600 font-medium">{row.date}</span>
                    <span className="font-bold text-gray-900">{row.count} users</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Drop-Off Points Analysis Tracker Table */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📉 Drop-Off Analysis Map</h3>
              <p className="text-[11px] text-gray-400 mb-2 leading-tight">Shows precisely where users abandoned the quiz chat thread prematurely.</p>
              <div className="text-xs divide-y divide-gray-100">
                {analytics.dropoff_analysis.length === 0 ? (
                  <div className="py-2 text-gray-400 italic">No historical abandonments recorded! All users completed quizzes.</div>
                ) : (
                  analytics.dropoff_analysis.map((row, i) => (
                    <div key={i} className="py-2 flex justify-between">
                      <span className="text-gray-600 font-medium">Left after Question #{row.questions_completed_before_leaving}</span>
                      <span className="font-bold text-red-500">{row.count} checkouts</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Hourly Peak Loads Display Table */}
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">⏰ Peak Activity Traffic Hours</h3>
              <div className="text-xs divide-y divide-gray-100 max-h-32 overflow-y-auto">
                {analytics.peak_activity_hours.map((row, i) => (
                  <div key={i} className="py-2 flex justify-between">
                    <span className="text-gray-600 font-medium">{row.hour}:00 hrs</span>
                    <span className="font-bold text-indigo-600">{row.sessions} quiz loads</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setView('exam')} className="w-full bg-[#075E54] text-white p-2.5 rounded-lg text-sm font-bold shadow hover:bg-emerald-800 transition mt-2">
              Back to Start Screen
            </button>
          </div>
        )}
      </main>
    </div>
  );
}