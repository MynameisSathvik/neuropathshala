import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../services/apiClient';
import { Lesson, GradeLevel, SubjectArea, DifficultyLevel, TribalLanguage } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Radio,
  FileText,
  Copy,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  Sparkles,
  X,
  ArrowRight,
  Eye,
  Calendar
} from 'lucide-react';

const LOCAL_CONTEXT_OPTIONS = [
  'Village Haat & Market Barter',
  'Forest Mahua & Tamarind Seeds',
  'Sal Trees & Local Birds',
  'River & Well Water Daily Life',
  'Farming & Rice Paddy Fieldwork',
  'Clay Pottery & Household Objects',
  'Sarhul & Nature Festivals'
];

export const LessonsView: React.FC = () => {
  const {
    lessons,
    saveLesson,
    updateLesson,
    deleteLesson,
    duplicateLesson,
    startLiveClassFromLesson,
    createWorksheetFromLesson,
    showToast
  } = useApp();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // Modal / Detail States
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [activeViewingLesson, setActiveViewingLesson] = useState<Lesson | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Generator Form State
  const [genGrade, setGenGrade] = useState<GradeLevel>('Grade 2');
  const [genSubject, setGenSubject] = useState<SubjectArea>('Foundational Numeracy');
  const [genTopic, setGenTopic] = useState('Counting with Sal Leaves');
  const [genDifficulty, setGenDifficulty] = useState<DifficultyLevel>('Beginner');
  const [genDuration, setGenDuration] = useState<number>(35);
  const [genLocalContext, setGenLocalContext] = useState(LOCAL_CONTEXT_OPTIONS[0]);
  const [genLanguage, setGenLanguage] = useState<TribalLanguage>('Santhali');

  // Draft generated lesson inside modal
  const [generatedDraft, setGeneratedDraft] = useState<Lesson | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateLesson = async () => {
    if (!genTopic.trim()) {
      showToast('Please enter a lesson topic.', 'warning');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await apiFetch('generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grade: genGrade,
          subject: genSubject,
          topic: genTopic.trim(),
          difficulty: genDifficulty,
          durationMinutes: genDuration,
          localContext: genLocalContext,
          targetLanguage: genLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.lesson) {
        throw new Error(data.error || 'Invalid Gemini lesson response');
      }

      const now = new Date().toISOString();

      const newLesson: Lesson = {
        id: `les-${Date.now()}`,
        title:
          data.lesson.title ||
          `${genTopic} (${genSubject === 'Foundational Numeracy' ? 'Numeracy FLN' : 'Literacy FLN'})`,
        grade: genGrade,
        subject: genSubject,
        topic: genTopic.trim(),
        difficulty: genDifficulty,
        durationMinutes: genDuration,
        localContext: genLocalContext,
        objective: data.lesson.objective || '',
        materials: Array.isArray(data.lesson.materials)
          ? data.lesson.materials
          : [],
        warmUp: data.lesson.warmUp || '',
        teacherExplanation: data.lesson.teacherExplanation || '',
        localContextExample: data.lesson.localContextExample || '',
        classroomActivity: data.lesson.classroomActivity || '',
        practice: data.lesson.practice || '',
        assessment: data.lesson.assessment || '',
        motherTongueSupport: {
          language: genLanguage,
          keyPhrases:
            Array.isArray(data.lesson.motherTongueSupport?.keyPhrases)
              ? data.lesson.motherTongueSupport.keyPhrases
              : []
        },
        createdAt: now,
        updatedAt: now,
        targetLanguage: genLanguage,
        nipunOutcome: data.lesson.nipunOutcome || `${genSubject} foundational competency`
      };

      setGeneratedDraft(newLesson);

      showToast(
        'Lesson generated with Gemini. Review it before classroom use.',
        'info'
      );
    } catch (error) {
      console.error('Gemini lesson generation failed:', error);

      showToast(
        'Gemini lesson generation failed. Check that the backend is running.',
        'warning'
      );
    } finally {
      setIsGenerating(false);
    }
  };
  const handleSaveDraft = () => {
    if (!generatedDraft) return;
    saveLesson(generatedDraft);
    setGeneratedDraft(null);
    setShowGeneratorModal(false);
  };

  const handleSaveEditedLesson = () => {
    if (!editingLesson) return;
    updateLesson(editingLesson);
    setEditingLesson(null);
    if (activeViewingLesson?.id === editingLesson.id) {
      setActiveViewingLesson(editingLesson);
    }
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesGrade = filterGrade === 'all' || lesson.grade === filterGrade;
    const matchesSubject = filterSubject === 'all' || lesson.subject === filterSubject;
    const matchesSearch =
      !searchQuery.trim() ||
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.localContext.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesSubject && matchesSearch;
  });

  return (
    <div id="lessons-view" className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Foundational Lesson Library
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Multilingual lesson plans grounded in local Jharkhand tribal contexts.
          </p>
        </div>

        <button
          id="open-lesson-generator-btn"
          onClick={() => {
            setGeneratedDraft(null);
            setShowGeneratorModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Lesson</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            id="search-lessons-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons by topic or context..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Grade filter */}
          <select
            id="filter-grade-select"
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 font-medium focus:outline-none"
          >
            <option value="all">All Grades</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
          </select>

          {/* Subject filter */}
          <select
            id="filter-subject-select"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 font-medium focus:outline-none"
          >
            <option value="all">All Subjects</option>
            <option value="Foundational Literacy">Foundational Literacy</option>
            <option value="Foundational Numeracy">Foundational Numeracy</option>
          </select>
        </div>
      </div>

      {/* Lesson Cards Grid */}
      {filteredLessons.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-semibold text-stone-700">No lessons match your search.</p>
          <p className="text-xs text-stone-400">
            Create your first classroom-ready lesson using the lesson generator above.
          </p>
          <button
            onClick={() => setShowGeneratorModal(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Create Lesson
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson.id}
              id={`lesson-card-${lesson.id}`}
              className="min-w-0 bg-white rounded-2xl p-5 border border-stone-200 hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    {lesson.grade}
                  </span>
                  <span className="text-xs text-stone-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {lesson.durationMinutes} mins
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-base leading-snug line-clamp-2">
                  {lesson.title}
                </h3>

                <div className="text-xs text-stone-600 space-y-1">
                  <p className="line-clamp-1">
                    <strong className="text-stone-700">Context:</strong> {lesson.localContext}
                  </p>
                  <p className="text-stone-500 line-clamp-2 leading-relaxed">
                    {lesson.objective}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    id={`view-lesson-${lesson.id}`}
                    onClick={() => setActiveViewingLesson(lesson)}
                    className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    title="View Full Lesson"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    id={`edit-lesson-${lesson.id}`}
                    onClick={() => setEditingLesson(lesson)}
                    className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    title="Edit Lesson"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    id={`duplicate-lesson-${lesson.id}`}
                    onClick={() => duplicateLesson(lesson.id)}
                    className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    title="Duplicate Lesson"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    id={`delete-lesson-${lesson.id}`}
                    onClick={() => setDeleteConfirmId(lesson.id)}
                    className="p-2 rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete Lesson"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <button
                    id={`teach-lesson-btn-${lesson.id}`}
                    onClick={() => startLiveClassFromLesson(lesson)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs whitespace-nowrap"
                    title="Start Live Class with this topic"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Teach</span>
                  </button>

                  <button
                    id={`worksheet-lesson-btn-${lesson.id}`}
                    onClick={() => createWorksheetFromLesson(lesson)}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
                    title="Create Worksheet from this lesson"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Worksheet</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GENERATOR MODAL */}
      {showGeneratorModal && (
        <div
          id="generator-modal-backdrop"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-stone-900">MTB-MLE Lesson Generator</h3>
                <p className="text-xs text-stone-500">
                  Generate foundational lesson plans with Jharkhand tribal mother-tongue bridges.
                </p>
              </div>
              <button
                onClick={() => setShowGeneratorModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Grade Level</label>
                <select
                  value={genGrade}
                  onChange={(e) => setGenGrade(e.target.value as GradeLevel)}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                >
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Subject Area</label>
                <select
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value as SubjectArea)}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                >
                  <option value="Foundational Literacy">Foundational Literacy</option>
                  <option value="Foundational Numeracy">Foundational Numeracy</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Lesson Topic</label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Counting with Mahua seeds..."
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Duration (Minutes)</label>
                <input
                  type="number"
                  min={15}
                  max={60}
                  step={5}
                  value={genDuration}
                  onChange={(e) => setGenDuration(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-stone-700">Local Tribal Context (Jharkhand)</label>
                <select
                  value={genLocalContext}
                  onChange={(e) => setGenLocalContext(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                >
                  {LOCAL_CONTEXT_OPTIONS.map((ctx) => (
                    <option key={ctx} value={ctx}>
                      {ctx}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-stone-700">Target Mother Tongue</label>
                <select value={genLanguage} onChange={(e) => setGenLanguage(e.target.value as TribalLanguage)} className="w-full p-2.5 rounded-xl border border-stone-200">
                  <option value="Santhali">Santhali</option>
                  <option value="Ho">Ho</option>
                  <option value="Mundari">Mundari</option>
                </select>
                <p className="text-[11px] text-stone-500">AI-generated language support requires native-speaker verification.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                id="generate-lesson-action-btn"
                onClick={handleGenerateLesson}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? "Generating with Gemini..." : "Generate Lesson Plan"}</span>
              </button>
            </div>

            {/* Generated Preview inside modal */}
            {generatedDraft && (
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">{generatedDraft.title}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    Draft Ready
                  </span>
                </div>

                <p className="text-stone-600">
                  <strong className="text-stone-800">Objective:</strong> {generatedDraft.objective}
                </p>

                <p className="text-stone-600">
                  <strong className="text-stone-800">Warm-up:</strong> {generatedDraft.warmUp}
                </p>

                <p className="text-stone-600">
                  <strong className="text-stone-800">Classroom Activity:</strong>{' '}
                  {generatedDraft.classroomActivity}
                </p>

                <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                  <span className="font-bold text-emerald-900">
                    {generatedDraft.motherTongueSupport.language} Mother-Tongue Support Phrases:
                  </span>
                  <ul className="space-y-1 text-stone-700 pl-4 list-disc">
                    {generatedDraft.motherTongueSupport.keyPhrases.map((phrase, idx) => (
                      <li key={idx}>
                        {phrase.hindi} → <span className="font-bold">{phrase.translatedText || phrase.santhali}</span> (
                        {phrase.phonetic})
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    id="regenerate-lesson-btn"
                    onClick={handleGenerateLesson}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 font-medium"
                  >
                    Regenerate
                  </button>
                  <button
                    id="save-generated-lesson-btn"
                    onClick={handleSaveDraft}
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-xs"
                  >
                    Save Lesson to Library
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LESSON DETAIL VIEW MODAL */}
      {activeViewingLesson && (
        <div
          id="view-lesson-modal-backdrop"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                    {activeViewingLesson.grade}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {activeViewingLesson.subject} • {activeViewingLesson.durationMinutes} mins
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-900">{activeViewingLesson.title}</h3>
              </div>
              <button
                onClick={() => setActiveViewingLesson(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed divide-y divide-stone-100">
              <div className="pt-2">
                <span className="font-bold text-stone-900 block mb-1">Learning Objective:</span>
                <p className="text-stone-600">{activeViewingLesson.objective}</p>
              </div>

              <div className="pt-3">
                <span className="font-bold text-stone-900 block mb-1">Local Context & Realia:</span>
                <p className="text-stone-600">{activeViewingLesson.localContextExample}</p>
              </div>

              <div className="pt-3">
                <span className="font-bold text-stone-900 block mb-1">Classroom Warm-up:</span>
                <p className="text-stone-600">{activeViewingLesson.warmUp}</p>
              </div>

              <div className="pt-3">
                <span className="font-bold text-stone-900 block mb-1">Teacher Explanation & Modeling:</span>
                <p className="text-stone-600">{activeViewingLesson.teacherExplanation}</p>
              </div>

              <div className="pt-3">
                <span className="font-bold text-stone-900 block mb-1">Student Group Activity:</span>
                <p className="text-stone-600">{activeViewingLesson.classroomActivity}</p>
              </div>

              <div className="pt-3">
                <span className="font-bold text-stone-900 block mb-1">Assessment Observation Rubric:</span>
                <p className="text-stone-600">{activeViewingLesson.assessment}</p>
              </div>

              <div className="pt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-950 block mb-1">
                  Mother-Tongue Key Support Phrases ({activeViewingLesson.motherTongueSupport.language}):
                </span>
                <div className="space-y-1.5 pt-1">
                  {activeViewingLesson.motherTongueSupport.keyPhrases.map((kp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-stone-700">{kp.hindi}</span>
                      <span className="font-bold text-emerald-950 font-sans">
                        {kp.translatedText || kp.santhali} ({kp.phonetic})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    startLiveClassFromLesson(activeViewingLesson);
                    setActiveViewingLesson(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Start Live Class</span>
                </button>

                <button
                  onClick={() => {
                    createWorksheetFromLesson(activeViewingLesson);
                    setActiveViewingLesson(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Create Worksheet</span>
                </button>
              </div>

              <button
                onClick={() => setActiveViewingLesson(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LESSON MODAL */}
      {editingLesson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-bold text-stone-900 text-lg">Edit Lesson</h3>
              <button
                onClick={() => setEditingLesson(null)}
                className="p-1 text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Title</label>
                <input
                  type="text"
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Objective</label>
                <textarea
                  rows={3}
                  value={editingLesson.objective}
                  onChange={(e) => setEditingLesson({ ...editingLesson, objective: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Classroom Activity</label>
                <textarea
                  rows={3}
                  value={editingLesson.classroomActivity}
                  onChange={(e) =>
                    setEditingLesson({ ...editingLesson, classroomActivity: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setEditingLesson(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedLesson}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200">
            <h3 className="font-bold text-stone-900 text-base">Delete Lesson?</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete this lesson plan from local storage? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteLesson(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Delete Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


