package com.quiz.quizsystem.service;

import com.quiz.quizsystem.model.*;
import com.quiz.quizsystem.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class UserService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;
    private final ResultRepository resultRepository;
    private final UserRepository userRepository;

    public UserService(QuizRepository quizRepository,
                       QuestionRepository questionRepository,
                       OptionRepository optionRepository,
                       ResultRepository resultRepository,
                       UserRepository userRepository) {
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.resultRepository = resultRepository;
        this.userRepository = userRepository;
    }

    public List<Quiz> getAvailableQuizzes() {
        return quizRepository.findAll();
    }

    public Optional<Quiz> getQuizById(Long id) {
        return quizRepository.findById(id);
    }

    @Transactional
    public Map<String, Object> submitQuiz(Long userId, Long quizId, Map<Long, Long> answers) {
        Quiz quiz = quizRepository.findById(quizId).orElseThrow();
        int total = 0;
        int score = 0;

        for (Question q : questionRepository.findByQuizId(quizId)) {
            total++;
            Long correctOptionId = optionRepository.findCorrectOptionIdByQuestionId(q.getId());
            Long answerOptionId = answers.get(q.getId());
            if (answerOptionId != null && answerOptionId.equals(correctOptionId)) {
                score++;
            }
        }

        Result r = new Result();
        r.setUser(userRepository.findById(userId).orElse(null));
        r.setQuiz(quiz);
        r.setScore(score);
        r.setTotalQuestions(total);
        resultRepository.save(r);

        Map<String, Object> resp = new HashMap<>();
        resp.put("score", score);
        resp.put("total", total);
        return resp;
    }
}
