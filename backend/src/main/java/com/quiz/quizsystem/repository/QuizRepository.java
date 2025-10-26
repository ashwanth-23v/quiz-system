package com.quiz.quizsystem.repository;

import com.quiz.quizsystem.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizRepository extends JpaRepository<Quiz, Long> {}
