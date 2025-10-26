package com.quiz.quizsystem.controller;

import com.quiz.quizsystem.dto.*;
import com.quiz.quizsystem.service.QuizService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final QuizService quizService;

    public UserController(QuizService quizService) {
        this.quizService = quizService;
    }

    // used by frontend: GET /api/user/quizzes
    @GetMapping("/quizzes")
    public ResponseEntity<List<QuizDto>> listQuizzes() {
        return ResponseEntity.ok(quizService.listAll());
    }

    // used by frontend: GET /api/user/quizzes/{id}
    @GetMapping("/quizzes/{id}")
    public ResponseEntity<QuizDto> getQuiz(@PathVariable Long id) {
        QuizDto dto = quizService.getQuizForUser(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    // used by frontend: POST /api/user/quizzes/submit
    // body: { "quizId": 1, "answers": { "1": 2, "2": 5 } }
    @PostMapping("/quizzes/submit")
    public ResponseEntity<ResultDto> submitQuiz(@RequestBody SubmitAnswerDto dto,
                                                @AuthenticationPrincipal String email) {
        
        ResultDto res = quizService.submit(dto, email);
        return ResponseEntity.ok(res);
    }

    // optional: user can view their results
    @GetMapping("/results")
    public ResponseEntity<List<ResultDto>> myResults(@AuthenticationPrincipal String email) {
        var list = quizService.getUserResultsByEmail(email);
        return ResponseEntity.ok(list);
    }
}
