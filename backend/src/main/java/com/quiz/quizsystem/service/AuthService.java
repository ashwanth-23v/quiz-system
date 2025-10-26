package com.quiz.quizsystem.service;

import com.quiz.quizsystem.dto.AuthResponse;
import com.quiz.quizsystem.dto.LoginRequest;
import com.quiz.quizsystem.dto.RegisterRequest;
import com.quiz.quizsystem.model.User;
import com.quiz.quizsystem.repository.UserRepository;
import com.quiz.quizsystem.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

   public AuthResponse login(LoginRequest req) {
    System.out.println("=== LOGIN ATTEMPT ===");
    System.out.println("Email: " + req.getEmail());
    
    try {
        // Use Spring Security's AuthenticationManager
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );
        
        System.out.println("✅ Authentication successful!");
        
        // Get user from DB to get role
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        
        System.out.println("User found: email=" + user.getEmail() + ", role=" + user.getRole());
        
        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());
        
        System.out.println("✅ Token generated successfully! Length: " + token.length());
        System.out.println("Token preview: " + token.substring(0, Math.min(50, token.length())) + "...");
        
        AuthResponse response = new AuthResponse(token, user.getRole().name());
        System.out.println("✅ Returning AuthResponse");
        return response;
        
    } catch (AuthenticationException e) {
        System.out.println("❌ Authentication failed: " + e.getMessage());
        e.printStackTrace();
        throw new BadCredentialsException("Invalid credentials");
    } catch (Exception e) {
        System.out.println("❌ Unexpected error during login: " + e.getMessage());
        e.printStackTrace();
        throw new RuntimeException("Login failed: " + e.getMessage());
    }
}
    public void register(RegisterRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new RuntimeException("Email already taken");
        }

        User u = new User();
        u.setEmail(req.getEmail());
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));

        try {
            if (req.getRole() != null && !req.getRole().isBlank()) {
                u.setRole(User.Role.valueOf(req.getRole()));
            } else {
                u.setRole(User.Role.USER);
            }
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid role: must be USER or ADMIN");
        }

        userRepository.save(u);
        System.out.println("[DEBUG] Registered new user: " + u.getEmail() + " role=" + u.getRole());
    }
}