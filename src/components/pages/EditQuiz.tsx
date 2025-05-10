import { useQuizForm } from "../../hooks/useQuizForm";
import {
  Header,
  ErrorMessage,
  QuizInfoForm,
  QuestionsList,
  AddQuestionForm
} from "../QuizFormComponents";

const EditQuiz = () => {
  const {
    quiz,
    title,
    setTitle,
    status,
    setStatus,
    questions,
    isLoading,
    isSaving,
    error,
    handleUpdateQuiz,
    handleEditQuestion,
    handleEditAnswer,
    navigate,
    currentQuestion,
    setCurrentQuestion,
    currentAnswer,
    setCurrentAnswer,
    handleAddQuestion,
    handleAddAnswer,
    handleRemoveAnswer,
    handleRemoveQuestion
  } = useQuizForm(true); // true indicates edit mode

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Edit Quiz" onBack={() => navigate("/teacher/dashboard")} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">Loading quiz...</p>
          </div>
        ) : error && !quiz ? (
          <ErrorMessage error={error} />
        ) : !quiz ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Quiz not found.</p>
          </div>
        ) : (
          <>
            <ErrorMessage error={error} />

            <QuizInfoForm
              title={title}
              setTitle={setTitle}
              status={status}
              setStatus={setStatus}
            />

            <QuestionsList
              questions={questions}
              onEditQuestion={handleEditQuestion}
              onEditAnswer={handleEditAnswer}
              onRemoveQuestion={handleRemoveQuestion}
              readOnly={false}
            />

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
              <AddQuestionForm
                currentQuestion={currentQuestion}
                setCurrentQuestion={setCurrentQuestion}
                currentAnswer={currentAnswer}
                setCurrentAnswer={setCurrentAnswer}
                handleAddAnswer={handleAddAnswer}
                handleRemoveAnswer={handleRemoveAnswer}
                handleAddQuestion={handleAddQuestion}
              />
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={handleUpdateQuiz}
                disabled={isSaving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
              >
                {isSaving ? "Saving..." : "Save Quiz"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default EditQuiz;
