package com.quiz.quizsystem.controller;

import com.quiz.quizsystem.dto.*;
import com.quiz.quizsystem.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;  // if you are using HashMap


@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            authService.register(req);
            return ResponseEntity.ok().body(Map.of("message", "Registered"));
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest req) {
    System.out.println("===== /api/auth/login endpoint HIT =====");
    System.out.println("Request email: " + req.getEmail());
    
    try {
        AuthResponse resp = authService.login(req);
        System.out.println("✅ AuthService returned response. Token present: " + (resp.token() != null));
        return ResponseEntity.ok(resp);
    } catch (Exception ex) {
        System.out.println("===== LOGIN FAILED =====");
        System.out.println("Exception type: " + ex.getClass().getName());
        System.out.println("Exception message: " + ex.getMessage());
        ex.printStackTrace();
        return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
    }
}
}
