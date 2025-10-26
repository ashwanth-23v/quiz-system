package com.quiz.quizsystem.controller;

import com.quiz.quizsystem.model.*;
import com.quiz.quizsystem.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;
    public AdminController(AdminService adminService) { this.adminService = adminService; }

    @PostMapping("/quizzes")
    public Quiz createQuiz(@RequestBody Map<String, String> body, @AuthenticationPrincipal String email) {
        System.out.println("createQuiz called by: " + email);
        return adminService.createQuiz(body.get("title"), body.get("description"), email);
    }

    @PutMapping("/quizzes/{id}")
    public Quiz updateQuiz(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return adminService.updateQuiz(id, body.get("title"), body.get("description"));
    }

    @DeleteMapping("/quizzes/{id}")
    public ResponseEntity<?> deleteQuiz(@PathVariable Long id) {
        adminService.deleteQuiz(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

@PostMapping("/quizzes/{quizId}/questions")
public Question addQuestion(@PathVariable Long quizId, @RequestBody Map<String, Object> body) {    
    var options = (List<Map<String, Object>>) body.get("options");
    String questionText = (String) body.get("text");
    return adminService.addQuestion(quizId, questionText, options);
}

@GetMapping("/results")
public List<Result> allResults() {
    System.out.println("🔍 getAllResults called");
    List<Result> results = adminService.getAllResults();
    return results;
}

    @GetMapping("/quizzes")
    public List<Quiz> allQuizzes() {
        return adminService.getAllQuizzes();
    }
}