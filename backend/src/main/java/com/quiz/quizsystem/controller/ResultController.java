package com.quiz.quizsystem.controller;

import com.quiz.quizsystem.repository.ResultRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/results")
public class ResultController {

    private final ResultRepository resultRepository;

    public ResultController(ResultRepository resultRepository) {
        this.resultRepository = resultRepository;
    }

    // DELETE a result by ID (only admins)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteResult(@PathVariable Long id) {
        if (!resultRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        resultRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}