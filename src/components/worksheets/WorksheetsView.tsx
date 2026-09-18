import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../services/apiClient';
import {
  Worksheet,
  WorksheetQuestion,
  GradeLevel,
  SubjectArea,
  DifficultyLevel,
  TribalLanguage
} from '../../types';
import {
  FileText,
  Plus,
  Printer,
  Search,
  Filter,
  Trash2,
  Edit,
  Copy,
  CheckCircle2,
  Sparkles,
  X,
  Eye,
  Star,
  Layers
} from 'lucide-react';

const LOCAL_CONTEXTS = [
  'Village Haat & Vegetables',
  'Forest Mahua & Tamarind Seeds',
  'Sal Leaves & Forest Animals',
  'Household Clay Pots & Baskets'
];

export const WorksheetsView: React.FC = () => {
  const {
    worksheets,
    saveWorksheet,
    updateWorksheet,
    deleteWorksheet,
    duplicateWorksheet,
    activeWorksheetPreset,
    clearWorksheetPreset,
    settings,
    showToast
  } = useApp();
  const [targetLanguage, setTargetLanguage] = useState<TribalLanguage>('Santhali');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  // Generator & Modals
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [activeViewingWorksheet, setActiveViewingWorksheet] = useState<Worksheet | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [grade, setGrade] = useState<GradeLevel>(activeWorksheetPreset?.grade || 'Grade 1');
  const [subject, setSubject] = useState<SubjectArea>(
    activeWorksheetPreset?.subject || 'Foundational Numeracy'
  );
  const [topic, setTopic] = useState<string>(
    activeWorksheetPreset?.topic || 'Counting Forest Seeds 1 to 5'
  );
  const [questionType, setQuestionType] = useState<'count' | 'match' | 'fill' | 'wordPair'>('count');
  const [itemCount, setItemCount] = useState<number>(3);
  const [localContext, setLocalContext] = useState(LOCAL_CONTEXTS[0]);

  // Draft generated worksheet in modal
  const [generatedDraft, setGeneratedDraft] = useState<Worksheet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // If preset arrives from lesson or classroom session, open generator or prep form
  useEffect(() => {
    if (activeWorksheetPreset) {
      setGrade(activeWorksheetPreset.grade);
      setSubject(activeWorksheetPreset.subject);
      setTopic(activeWorksheetPreset.topic);
      setShowGeneratorModal(true);
    }
  }, [activeWorksheetPreset]);

  const handleGenerateWorksheet = async () => {
    if (!topic.trim()) {
      showToast('Please enter a worksheet topic.', 'warning');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await apiFetch('generate-worksheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grade,
          subject,
          topic: topic.trim(),
          questionType,
          itemCount,
          localContext,
          targetLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`Backend returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.worksheet) {
        throw new Error(data.error || 'Invalid Gemini worksheet response');
      }

      const now = new Date().toISOString();

      const questions: WorksheetQuestion[] = Array.isArray(data.worksheet.questions)
        ? data.worksheet.questions.map((question: WorksheetQuestion, index: number) => ({
            ...question,
            id: `q-${Date.now()}-${index + 1}`,
            questionNumber: index + 1
          }))
        : [];

      const newWorksheet: Worksheet = {
        id: `ws-${Date.now()}`,
        title: `${topic.trim()} Worksheet`,
        grade,
        subject,
        topic: topic.trim(),
        difficulty: 'Beginner',
        localContext,
        instructionsHindi: data.worksheet.instructionsHindi || '',
        instructionsSanthali: data.worksheet.instructionsSanthali || '',
        instructionsTargetLanguage: data.worksheet.instructionsTargetLanguage || data.worksheet.instructionsSanthali || '',
        questions,
        activityInstructions: data.worksheet.activityInstructions || '',
        answerKeyNotes: data.worksheet.answerKeyNotes || '',
        targetLanguage,
        nipunOutcome: data.worksheet.nipunOutcome || `${subject} foundational competency`,
        createdAt: now,
        updatedAt: now
      };

      setGeneratedDraft(newWorksheet);

      showToast(
        'Worksheet generated with Gemini. Review before classroom use.',
        'info'
      );
    } catch (error) {
      console.error('Gemini worksheet generation failed:', error);

      showToast(
        'Gemini worksheet generation failed. Check that the backend is running.',
        'warning'
      );
    } finally {
      setIsGenerating(false);
    }
  };
  const handleSaveDraft = () => {
    if (!generatedDraft) return;
    saveWorksheet(generatedDraft);
    setGeneratedDraft(null);
    setShowGeneratorModal(false);
    clearWorksheetPreset();
  };

  const handlePrint = (worksheet: Worksheet) => {
    setActiveViewingWorksheet(worksheet);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const filteredWorksheets = worksheets.filter((ws) => {
    const matchesGrade = filterGrade === 'all' || ws.grade === filterGrade;
    const matchesSubject = filterSubject === 'all' || ws.subject === filterSubject;
    const matchesSearch =
      !searchQuery.trim() ||
      ws.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.localContext.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesSubject && matchesSearch;
  });

  return (
    <div id="worksheets-view" className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Printable Area Styling (Injected for window.print()) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-worksheet-content, #printable-worksheet-content * {
            visibility: visible;
          }
          #printable-worksheet-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Worksheets & Printables
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            Primary school practice sheets with bilingual Hindi-tribal-language instructions and local visuals.
          </p>
        </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-stone-700">Target Mother Tongue</label>
                <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value as TribalLanguage)} className="w-full p-2.5 rounded-xl border border-stone-200">
                  <option value="Santhali">Santhali</option>
                  <option value="Ho">Ho</option>
                  <option value="Mundari">Mundari</option>
                </select>
              </div>

        <button
          id="open-worksheet-generator-btn"
          onClick={() => {
            setGeneratedDraft(null);
            setShowGeneratorModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Worksheet</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            id="search-worksheets-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worksheets by topic..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Grade filter */}
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 font-medium focus:outline-none"
          >
            <option value="all">All Grades</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
          </select>

          {/* Subject filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 font-medium focus:outline-none"
          >
            <option value="all">All Subjects</option>
            <option value="Foundational Numeracy">Foundational Numeracy</option>
            <option value="Foundational Literacy">Foundational Literacy</option>
          </select>
        </div>
      </div>

      {/* Worksheets Grid */}
      {filteredWorksheets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <FileText className="w-10 h-10 text-stone-300 mx-auto" />
          <p className="text-sm font-semibold text-stone-700">No worksheets created yet.</p>
          <p className="text-xs text-stone-400">
            Create a child-friendly printable worksheet for your students.
          </p>
          <button
            onClick={() => setShowGeneratorModal(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Create First Worksheet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorksheets.map((ws) => (
            <div
              key={ws.id}
              id={`worksheet-card-${ws.id}`}
              className="bg-white rounded-2xl p-5 border border-stone-200 hover:border-emerald-300 transition-all shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-100">
                    {ws.grade} • {ws.subject}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    {ws.questions?.length || 0} Questions
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-base leading-snug">{ws.title}</h3>

                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                  {ws.instructionsHindi}
                </p>

                {/* Sample visual item preview */}
                {ws.questions?.[0]?.visualSymbol && (
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-center text-lg">
                    {ws.questions[0].visualSymbol}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    id={`view-worksheet-${ws.id}`}
                    onClick={() => setActiveViewingWorksheet(ws)}
                    className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    title="View Full Worksheet"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    id={`duplicate-worksheet-${ws.id}`}
                    onClick={() => duplicateWorksheet(ws.id)}
                    className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    title="Duplicate Worksheet"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    id={`delete-worksheet-${ws.id}`}
                    onClick={() => setDeleteConfirmId(ws.id)}
                    className="p-2 rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete Worksheet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  id={`print-worksheet-${ws.id}`}
                  onClick={() => handlePrint(ws)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GENERATOR MODAL */}
      {showGeneratorModal && (
        <div
          id="worksheet-generator-modal"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-stone-900">Worksheet Generator</h3>
                <p className="text-xs text-stone-500">
                  Generate printable FLN practice sheets with local visuals and bilingual questions.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowGeneratorModal(false);
                  clearWorksheetPreset();
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Grade Level</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as GradeLevel)}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                >
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Subject Area</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as SubjectArea)}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                >
                  <option value="Foundational Numeracy">Foundational Numeracy</option>
                  <option value="Foundational Literacy">Foundational Literacy</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Counting 1 to 5"
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Question Pattern</label>
                <select
                  value={questionType}
                  onChange={(e) =>
                    setQuestionType(e.target.value as 'count' | 'match' | 'fill' | 'wordPair')
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                >
                  <option value="count">Counting Visual Objects</option>
                  <option value="match">Matching Words with Realia</option>
                  <option value="fill">Fill in the Blanks</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Number of Questions</label>
                <select
                  value={itemCount}
                  onChange={(e) => setItemCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                >
                  <option value={3}>3 Questions (Quick Practice)</option>
                  <option value={4}>4 Questions (Standard Slate Sheet)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Local Realia Context</label>
                <select
                  value={localContext}
                  onChange={(e) => setLocalContext(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                >
                  {LOCAL_CONTEXTS.map((ctx) => (
                    <option key={ctx} value={ctx}>
                      {ctx}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                id="generate-worksheet-action-btn"
                onClick={handleGenerateWorksheet}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Worksheet</span>
              </button>
            </div>

            {/* Generated Preview inside modal */}
            {generatedDraft && (
              <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">{generatedDraft.title}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    {generatedDraft.questions.length} Questions Ready
                  </span>
                </div>

                <div className="space-y-2">
                  {generatedDraft.questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl bg-white border border-stone-200 space-y-1"
                    >
                      <div className="font-semibold text-stone-900">
                        Q{q.questionNumber}: {q.promptHindi}
                      </div>
                      <div className="text-emerald-800 font-sans">{q.promptTargetLanguage || q.promptSanthali}</div>
                      {q.visualSymbol && (
                        <div className="text-lg py-1 text-stone-700">{q.visualSymbol}</div>
                      )}
                      <div className="flex gap-2 text-stone-500 text-[11px] pt-1">
                        {q.options?.map((opt, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200"
                          >
                            [ ] {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    onClick={handleGenerateWorksheet}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 font-medium"
                  >
                    Regenerate
                  </button>
                  <button
                    id="save-generated-worksheet-btn"
                    onClick={handleSaveDraft}
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-xs"
                  >
                    Save Worksheet to Library
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WORKSHEET PRINT PREVIEW MODAL */}
      {activeViewingWorksheet && (
        <div
          id="worksheet-view-modal"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto shadow-2xl border border-stone-200">
            {/* Modal Controls (Hidden in Print) */}
            <div className="no-print flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900">Worksheet Print Preview</span>
                <span className="text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-600">
                  A4 Ready
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(activeViewingWorksheet)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet Now</span>
                </button>
                <button
                  onClick={() => setActiveViewingWorksheet(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE CONTENT SHEET CONTAINER */}
            <div
              id="printable-worksheet-content"
              className="p-6 border-2 border-stone-300 rounded-xl space-y-6 bg-white text-stone-900 font-sans"
            >
              {/* Header Box */}
              <div className="border-b-2 border-stone-800 pb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight uppercase">
                      NeuroPathshala
                    </h1>
                    <p className="text-xs text-stone-600">
                      PALASH Mother-Tongue Based Multilingual Education (MTB-MLE)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-1 border border-stone-800 rounded">
                      {activeViewingWorksheet.grade}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-stone-200">
                  <div>
                    <span className="font-semibold">Student Name:</span> ___________________
                  </div>
                  <div>
                    <span className="font-semibold">Roll No:</span> _______
                  </div>
                  <div>
                    <span className="font-semibold">Date:</span> ____________
                  </div>
                </div>
              </div>

              {/* Title & Bilingual Instructions */}
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold">{activeViewingWorksheet.title}</h2>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-0.5">
                  <p className="font-semibold text-stone-800">
                    निर्देश: {activeViewingWorksheet.instructionsHindi}
                  </p>
                  <p className="text-stone-700 italic">
                    {activeViewingWorksheet.targetLanguage || 'Santhali'}: {activeViewingWorksheet.instructionsTargetLanguage || activeViewingWorksheet.instructionsSanthali}
                  </p>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-5">
                {activeViewingWorksheet.questions?.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 border border-stone-300 rounded-xl space-y-2 text-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-bold">
                        {q.questionNumber}. {q.promptHindi}
                      </div>
                      <div className="text-xs font-mono px-2 py-0.5 border border-stone-300 rounded">
                        Marks: [ &nbsp; / 1 ]
                      </div>
                    </div>

                    <div className="text-xs text-stone-700 font-sans pl-4 italic">
                      {q.promptTargetLanguage || q.promptSanthali}
                    </div>

                    {q.visualSymbol && (
                      <div className="p-3 my-2 bg-stone-50 rounded-lg text-2xl tracking-widest text-center border border-dashed border-stone-300">
                        {q.visualSymbol}
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                      {q.options?.map((opt, i) => (
                        <div
                          key={i}
                          className="p-2 border border-stone-300 rounded-lg flex items-center gap-2"
                        >
                          <div className="w-3.5 h-3.5 rounded-full border border-stone-400" />
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Teacher Evaluation & Rubric Box */}
              <div className="border-t-2 border-stone-300 pt-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold block">Teacher Rubric & Feedback:</span>
                  <span className="text-stone-600">{activeViewingWorksheet.answerKeyNotes}</span>
                </div>
                <div className="flex items-center gap-1 text-stone-400">
                  <Star className="w-4 h-4" />
                  <Star className="w-4 h-4" />
                  <Star className="w-4 h-4" />
                  <Star className="w-4 h-4" />
                  <Star className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="no-print flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveViewingWorksheet(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-medium"
              >
                Close
              </button>
              <button
                onClick={() => handlePrint(activeViewingWorksheet)}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Worksheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200">
            <h3 className="font-bold text-stone-900 text-base">Delete Worksheet?</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete this worksheet from local storage?
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
                  deleteWorksheet(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Delete Worksheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

