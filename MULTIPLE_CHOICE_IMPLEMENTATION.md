# Multiple Choice Implementation Guide

This document outlines the necessary backend changes required to support multiple-choice questions that allow students to select multiple answers.

## Current Issue

Currently, the UserResponse entity only supports a single answer per question, which doesn't work for MULTIPLE_CHOICE type questions where a student should be able to select multiple correct answers.

## Required Changes

### 1. Update SubmitAnswerRequest DTO

Add an `isMultipleChoice` flag to the SubmitAnswerRequest:

```java
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SubmitAnswerRequest {
    private Long questionId;
    private Long answerId;
    private Integer responseTime;
    private Boolean isMultipleChoice;
}
```

### 2. Modify UserResponse Entity

There are two approaches to handle multiple answers for the same question:

#### Option A: Multiple UserResponse records per question (Recommended)

Allow multiple UserResponse records for the same question in a quiz attempt. This is simpler to implement with the existing data model.

- Update UserResponseRepository to find all responses for a question:
```java
List<UserResponse> findByQuizAttemptAttemptIdAndQuestionQuestionId(Long attemptId, Long questionId);
```

#### Option B: Add a junction table (More complex)

Create a new entity for multiple answers per response:
```java
@Entity
@Table(name = "user_response_answers")
public class UserResponseAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "response_id")
    private UserResponse userResponse;
    
    @ManyToOne
    @JoinColumn(name = "answer_id")
    private Answer answer;
    
    private Boolean isCorrect;
}
```

### 3. Update QuizAttemptService.submitAnswer Method

The `submitAnswer` method needs to be modified to handle multiple choice questions:

```java
public UserResponse submitAnswer(Long attemptId, Long userId, SubmitAnswerRequest request) {
    // ... existing validation code ...
    
    Question question = questionRepository.findById(request.getQuestionId())
            .orElseThrow(() -> new QuizAttemptException("Question not found"));
    
    // Check if this is a multiple choice question
    boolean isMultipleChoice = request.getIsMultipleChoice() != null && 
            request.getIsMultipleChoice() && 
            question.getType() == QuestionType.MULTIPLE_CHOICE;
    
    Answer selectedAnswer = answerRepository.findById(request.getAnswerId())
            .orElseThrow(() -> new QuizAttemptException("Answer not found"));
    
    // For multiple choice questions
    if (isMultipleChoice) {
        // Find all existing responses for this question
        List<UserResponse> existingResponses = userResponseRepository
                .findByQuizAttemptAttemptIdAndQuestionQuestionId(attemptId, question.getQuestionId());
        
        // Check if this answer is already selected
        Optional<UserResponse> existingResponse = existingResponses.stream()
                .filter(r -> r.getSelectedAnswer().getAnswerId().equals(selectedAnswer.getAnswerId()))
                .findFirst();
        
        if (existingResponse.isPresent()) {
            // If already selected, remove it (toggle behavior)
            userResponseRepository.delete(existingResponse.get());
            return existingResponse.get();
        } else {
            // Add a new response
            UserResponse response = UserResponse.builder()
                    .quizAttempt(attempt)
                    .question(question)
                    .selectedAnswer(selectedAnswer)
                    .isCorrect(selectedAnswer.getIsCorrect())
                    .responseTime(request.getResponseTime())
                    .build();
            return userResponseRepository.save(response);
        }
    } else {
        // For single choice questions, use the existing logic
        // ... existing single choice code ...
    }
}
```

### 4. Update Results Calculation

For multiple-choice questions, the correctness calculation needs to be modified:

```java
// In getAttemptResults method
Map<Long, List<UserResponse>> responseMap = responses.stream()
        .collect(Collectors.groupingBy(r -> r.getQuestion().getQuestionId()));

List<QuestionResultDto> questionResults = questions.stream()
        .map(question -> {
            List<Answer> answers = answerRepository.findByQuestionQuestionId(question.getQuestionId());
            List<UserResponse> userResponses = responseMap.getOrDefault(question.getQuestionId(), List.of());
            
            List<AnswerResultDto> answerResults = answers.stream()
                    .map(answer -> {
                        boolean isSelected = userResponses.stream()
                                .anyMatch(r -> r.getSelectedAnswer().getAnswerId().equals(answer.getAnswerId()));
                        
                        return AnswerResultDto.builder()
                                .id(answer.getAnswerId())
                                .text(answer.getAnswerText())
                                .isSelected(isSelected)
                                .isCorrect(answer.getIsCorrect())
                                .build();
                    })
                    .collect(Collectors.toList());
            
            // For multiple choice questions
            boolean isCorrect = false;
            if (question.getType() == QuestionType.MULTIPLE_CHOICE) {
                // All selected answers must be correct, and all correct answers must be selected
                List<Long> selectedAnswerIds = userResponses.stream()
                        .map(r -> r.getSelectedAnswer().getAnswerId())
                        .collect(Collectors.toList());
                
                List<Long> correctAnswerIds = answers.stream()
                        .filter(Answer::getIsCorrect)
                        .map(Answer::getAnswerId)
                        .collect(Collectors.toList());
                
                isCorrect = selectedAnswerIds.containsAll(correctAnswerIds) && 
                        correctAnswerIds.containsAll(selectedAnswerIds);
            } else {
                // For single choice, if the user selected an answer and it's correct
                isCorrect = !userResponses.isEmpty() && userResponses.get(0).getIsCorrect();
            }
            
            return QuestionResultDto.builder()
                    .id(question.getQuestionId())
                    .text(question.getQuestionText())
                    .type(question.getType().toString())
                    .isCorrect(isCorrect)
                    .answers(answerResults)
                    .build();
        })
        .collect(Collectors.toList());
```

### 5. Update Score Calculation

The score calculation in `submitAttempt` needs to be updated to handle multiple choice questions:

```java
// Calculate score
float totalCorrect = 0;
for (Question question : questions) {
    List<UserResponse> questionResponses = responses.stream()
            .filter(r -> r.getQuestion().getQuestionId().equals(question.getQuestionId()))
            .collect(Collectors.toList());
    
    if (question.getType() == QuestionType.MULTIPLE_CHOICE) {
        // Get all correct answers for this question
        List<Long> correctAnswerIds = answerRepository.findByQuestionQuestionIdAndIsCorrect(
                question.getQuestionId(), true).stream()
                .map(Answer::getAnswerId)
                .collect(Collectors.toList());
        
        // Get user selected answers
        List<Long> selectedAnswerIds = questionResponses.stream()
                .map(r -> r.getSelectedAnswer().getAnswerId())
                .collect(Collectors.toList());
        
        // All selected answers must be correct, and all correct answers must be selected
        if (selectedAnswerIds.containsAll(correctAnswerIds) && 
            correctAnswerIds.containsAll(selectedAnswerIds)) {
            totalCorrect++;
        }
    } else {
        // For single choice questions
        if (!questionResponses.isEmpty() && questionResponses.get(0).getIsCorrect()) {
            totalCorrect++;
        }
    }
}

float score = (totalCorrect / questions.size()) * 100;
```

## API Changes

The frontend expects the following changes:

1. The `SubmitAnswerRequest` now has an optional `isMultipleChoice` boolean field
2. For multiple-choice questions, the backend should handle adding or removing an answer based on user selection
3. When loading an attempt, all selected answers should be returned in the responses array

Please note these changes require database schema modifications, careful migration planning, and comprehensive testing to ensure proper functionality. 