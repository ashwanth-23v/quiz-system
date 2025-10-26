package com.quiz.quizsystem.controller;

import com.quiz.quizsystem.model.Quiz;
import com.quiz.quizsystem.model.Question;
import com.quiz.quizsystem.model.Option;
import com.quiz.quizsystem.model.Result;
import com.quiz.quizsystem.repository.QuizRepository;
import com.quiz.quizsystem.repository.QuestionRepository;
import com.quiz.quizsystem.repository.OptionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    @Autowired
    private QuizRepository quizRepo;

    @Autowired
    private QuestionRepository questionRepo;

    @Autowired
    private OptionRepository optionRepo;

    // --- 1. Get all quizzes ---
    @GetMapping
    public List<Map<String, Object>> getAllQuizzes() {
        List<Quiz> quizzes = quizRepo.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Quiz q : quizzes) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", q.getId());
            map.put("title", q.getTitle());
            response.add(map);
        }
        return response;
    }

    // --- 2. Get quiz with questions and options ---
    @GetMapping("/{id}")
    public Map<String, Object> getQuizById(@PathVariable Long id) {
        Optional<Quiz> quizOpt = quizRepo.findById(id);
        if (!quizOpt.isPresent()) return Map.of("error", "Quiz not found");

        Quiz quiz = quizOpt.get();
        List<Question> questions = questionRepo.findByQuizId(quiz.getId());

        List<Map<String, Object>> questionsList = new ArrayList<>();
        for (Question q : questions) {
            List<Option> options = optionRepo.findByQuestionId(q.getId());
            List<Map<String, Object>> optList = new ArrayList<>();
            for (Option o : options) {
                optList.add(Map.of("id", o.getId(), "text", o.getOptionText()));
            }
            questionsList.add(Map.of("id", q.getId(), "text", q.getQuestionText(), "options", optList));
        }

        return Map.of(
                "id", quiz.getId(),
                "title", quiz.getTitle(),
                "questions", questionsList
        );
    }

    // --- 3. Submit quiz ---
    @PostMapping("/submit")
    public Map<String, Object> submitQuiz(@RequestBody Map<String, Object> payload) {
        Long quizId = Long.valueOf(payload.get("quizId").toString());
        Map<String, Object> answers = (Map<String, Object>) payload.get("answers");

        List<Question> questions = questionRepo.findByQuizId(quizId);
        int total = questions.size();
        int score = 0;

        for (Question q : questions) {
            Long correctOptionId = optionRepo.findCorrectOptionIdByQuestionId(q.getId());
            if (answers.containsKey(q.getId().toString())) {
                Long selected = Long.valueOf(answers.get(q.getId().toString()).toString());
                if (selected.equals(correctOptionId)) score++;
            }
        }

        return Map.of(
                "score", score,
                "total", total
        );
    }
}
