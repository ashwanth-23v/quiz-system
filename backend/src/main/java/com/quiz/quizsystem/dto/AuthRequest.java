package com.quiz.quizsystem.dto;

public record AuthRequest(String email, String password, String role) {}
