package ro.ase.acs.mind_path.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ro.ase.acs.mind_path.entity.QuizSession;
import ro.ase.acs.mind_path.entity.enums.SessionStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizSessionRepository extends JpaRepository<QuizSession, Long> {
    Optional<QuizSession> findByQuizQuizIdAndStatus(Long quizId, SessionStatus status);
    Optional<QuizSession> findByAccessCodeAndStatus(String accessCode, SessionStatus status);

    QuizSession findByAccessCode(String accessCode);
    
    /**
     * Find all quiz sessions with the given status
     * @param status the session status to search for
     * @return a list of quiz sessions with the matching status
     */
    List<QuizSession> findByStatus(SessionStatus status);
}
