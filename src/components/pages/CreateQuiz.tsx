import React from "react";
import { useQuizForm } from "../../hooks/useQuizForm";
import {
  Header,
  ErrorMessage,
  QuizInfoForm,
  QuestionsList,
  AddQuestionForm,
} from "../QuizFormComponents";

const CreateQuiz = () => {
  const {
    title,
    setTitle,
    status,
    setStatus,
    questions,
    error,
    isSaving,
    currentQuestion,
    setCurrentQuestion,
    currentAnswer,
    setCurrentAnswer,
    handleAddAnswer,
    handleRemoveAnswer,
    handleAddQuestion,
    handleRemoveQuestion,
    handleCreateQuiz,
    navigate,
  } = useQuizForm();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleCreateQuiz();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Create Quiz"
        onBack={() => navigate("/teacher/dashboard")}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage error={error} />

        <form onSubmit={handleSubmit}>
          <QuizInfoForm
            title={title}
            setTitle={setTitle}
            status={status}
            setStatus={setStatus}
          />

          <QuestionsList
            questions={questions}
            onRemoveQuestion={handleRemoveQuestion}
          />

          <AddQuestionForm
            currentQuestion={currentQuestion}
            setCurrentQuestion={setCurrentQuestion}
            currentAnswer={currentAnswer}
            setCurrentAnswer={setCurrentAnswer}
            handleAddAnswer={handleAddAnswer}
            handleRemoveAnswer={handleRemoveAnswer}
            handleAddQuestion={handleAddQuestion}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !title || questions.length === 0}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
            >
              {isSaving ? "Creating..." : "Create Quiz"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateQuiz;
