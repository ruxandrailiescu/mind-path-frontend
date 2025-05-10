package ro.ase.acs.mind_path.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ro.ase.acs.mind_path.entity.Quiz;
import ro.ase.acs.mind_path.entity.QuizAttempt;
import ro.ase.acs.mind_path.entity.enums.AttemptStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUserUserIdAndQuizQuizId(Long userId, Long quizId);
    Optional<QuizAttempt> findByAttemptIdAndUserUserId(Long attemptId, Long userId);
    List<QuizAttempt> findByUserUserIdAndStatus(Long userId, AttemptStatus status);
    
    /**
     * Find all quiz attempts with the given status
     * @param status the status to search for
     * @return a list of quiz attempts with the matching status
     */
    List<QuizAttempt> findByStatus(AttemptStatus status);
}
