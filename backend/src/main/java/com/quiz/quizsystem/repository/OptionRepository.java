package com.quiz.quizsystem.repository;

import com.quiz.quizsystem.model.Option;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OptionRepository extends JpaRepository<Option, Long> {
    List<Option> findByQuestionId(Long questionId);

    @Query("SELECT o.id FROM Option o WHERE o.question.id = :questionId AND o.isCorrect = true")
    Long findCorrectOptionIdByQuestionId(@Param("questionId") Long questionId);
}
