package com.quiz.quizsystem.controller;

import com.quiz.quizsystem.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/debug")
public class DebugController {
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwt;

    public DebugController(PasswordEncoder passwordEncoder, JwtTokenProvider jwt) {
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
    }

    // returns bcrypt hash of provided password
    @GetMapping("/hash")
    public Map<String, String> hash(@RequestParam String pwd) {
        return Map.of("hash", passwordEncoder.encode(pwd));
    }

    // checks match between raw and hash
    @GetMapping("/match")
    public Map<String, Object> match(@RequestParam String raw, @RequestParam String hash) {
        boolean m = passwordEncoder.matches(raw, hash);
        return Map.of("matches", m);
    }

    // generate token from email+role
    @GetMapping("/token")
    public Map<String, String> token(@RequestParam String email, @RequestParam String role) {
        return Map.of("token", jwt.generateToken(email, role));
    }
}
