package com.quiz.quizsystem.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, CustomUserDetailsService uds) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = uds;
    }

 @Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain)
        throws ServletException, IOException {

    String path = request.getServletPath();
    String method = request.getMethod();
    System.out.println("🔹 Request: " + method + " " + path);
    
    // Skip auth endpoints
    if (path.startsWith("/api/auth/")) {
        System.out.println("   ✅ Skipping /api/auth/ endpoint");
        filterChain.doFilter(request, response);
        return;
    }

    // Extract token
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
        String token = header.substring(7);
        System.out.println("   🔑 Token found");
        
        if (tokenProvider.validateToken(token)) {
            Authentication auth = tokenProvider.getAuthentication(token);
            SecurityContextHolder.getContext().setAuthentication(auth);
            System.out.println("   ✅ Auth set: " + auth.getName() + " | Authorities: " + auth.getAuthorities());
        } else {
            System.out.println("   ❌ Token validation FAILED");
        }
    } else {
        System.out.println("   ❌ No Authorization header");
    }

    filterChain.doFilter(request, response);
}
}
