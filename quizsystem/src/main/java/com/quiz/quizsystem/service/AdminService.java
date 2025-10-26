package com.quiz.quizsystem.service;

import com.quiz.quizsystem.model.*;
import com.quiz.quizsystem.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AdminService {
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;
    private final UserRepository userRepository;
    private final ResultRepository resultRepository;

    public AdminService(QuizRepository quizRepository, QuestionRepository questionRepository,
                        OptionRepository optionRepository, UserRepository userRepository,
                        ResultRepository resultRepository) {
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.userRepository = userRepository;
        this.resultRepository = resultRepository;
    }

    public Quiz createQuiz(String title, String description, String creatorEmail) {
        var user = userRepository.findByEmail(creatorEmail).orElse(null);
        Quiz q = new Quiz();
        q.setTitle(title);
        q.setDescription(description);
        q.setCreatedBy(user);
        return quizRepository.save(q);
    }

    public Quiz updateQuiz(Long id, String title, String description) {
        Quiz q = quizRepository.findById(id).orElseThrow();
        q.setTitle(title);
        q.setDescription(description);
        return quizRepository.save(q);
    }

    public void deleteQuiz(Long id) {
        quizRepository.deleteById(id);
    }

public Question addQuestion(Long quizId, String text, List<Map<String, Object>> options) {
    Quiz q = quizRepository.findById(quizId).orElseThrow();
    Question question = new Question();
    question.setQuiz(q);
    question.setQuestionText(text);
    Question saved = questionRepository.save(question);

    for (var opt : options) {
        Option o = new Option();
        o.setQuestion(saved);
        // Changed from opt.get("text") to opt.get("optionText")
        o.setOptionText((String) opt.get("optionText"));  // ✅ Correct key!
        o.setIsCorrect((Boolean) opt.getOrDefault("isCorrect", false));
        optionRepository.save(o);
    }
    return saved;
}

    public List<Result> getAllResults() {
        return resultRepository.findAll();
    }

    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }
}
