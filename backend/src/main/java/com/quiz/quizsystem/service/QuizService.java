package com.quiz.quizsystem.service;

import com.quiz.quizsystem.dto.*;
import com.quiz.quizsystem.model.*;
import com.quiz.quizsystem.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.time.ZoneId;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;
    private final ResultRepository resultRepository;
    private final UserRepository userRepository;

    public QuizService(QuizRepository quizRepository,
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

    // List lightweight quiz DTOs (no questions) for index list
    public List<QuizDto> listAll() {
        return quizRepository.findAll().stream()
                .map(q -> {
                    QuizDto dto = new QuizDto();
                    dto.setId(q.getId());
                    dto.setTitle(q.getTitle());
                    dto.setDescription(q.getDescription());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Return full quiz with questions + options for user to attempt
public QuizDto getQuizForUser(Long id) {
    return quizRepository.findById(id).map(q -> {
        QuizDto dto = new QuizDto();
        dto.setId(q.getId());
        dto.setTitle(q.getTitle());
        dto.setDescription(q.getDescription());

        System.out.println("🔍 Loading quiz: " + q.getTitle());
        List<Question> questions = questionRepository.findByQuizId(q.getId());
        System.out.println("🔍 Found " + questions.size() + " questions");
        
        List<QuestionDto> qdto = questions.stream().map(qq -> {
            QuestionDto qd = new QuestionDto();
            qd.setId(qq.getId());
            qd.setText(qq.getQuestionText());
            
            List<Option> opts = optionRepository.findByQuestionId(qq.getId());
            System.out.println("🔍 Question " + qq.getId() + " (" + qq.getQuestionText() + ") has " + opts.size() + " options");
            
            if (!opts.isEmpty()) {
                System.out.println("   First option: id=" + opts.get(0).getId() + ", text=" + opts.get(0).getOptionText());
            }
            
            qd.setOptions(opts.stream().map(o -> {
                OptionDto od = new OptionDto();
                od.setId(o.getId());
                od.setText(o.getOptionText());
                System.out.println("     Mapped option: " + od.getId() + " -> " + od.getText());
                return od;
            }).collect(Collectors.toList()));
            
            return qd;
        }).collect(Collectors.toList());

        dto.setQuestions(qdto);
        return dto;
    }).orElse(null);
}

    // Submit: compute score and save result
@Transactional
public ResultDto submit(SubmitAnswerDto dto, String userEmail) {
    System.out.println("🎯 SUBMIT called! userEmail=" + userEmail + ", quizId=" + dto.getQuizId());
    
    Long quizId = dto.getQuizId();
    @SuppressWarnings("unchecked")
    Map<Long, Long> answers = dto.getAnswers() == null ? Map.of() : dto.getAnswers();
    
    System.out.println("🎯 Answers received: " + answers);

    Quiz quiz = quizRepository.findById(quizId).orElseThrow();
    List<Question> questions = questionRepository.findByQuizId(quizId);

    int total = questions.size();
    int score = 0;

    for (Question q : questions) {
        Long correctId = optionRepository.findCorrectOptionIdByQuestionId(q.getId());
        Long userOpt = answers.get(q.getId());
        System.out.println("   Question " + q.getId() + ": correct=" + correctId + ", user=" + userOpt);
        if (userOpt != null && userOpt.equals(correctId)) score++;
    }

    // persist result
    Result r = new Result();
    r.setQuiz(quiz);
    r.setScore(score);
    r.setTotalQuestions(total);
    
    Optional<User> userOpt = userRepository.findByEmail(userEmail);
    if (userOpt.isPresent()) {
        r.setUser(userOpt.get());
        System.out.println(" User found and set: " + userOpt.get().getEmail());
    } else {
        System.out.println("❌ User NOT found for email: " + userEmail);
    }
    
    Result saved = resultRepository.save(r);
    System.out.println(" Result saved with ID: " + saved.getId());

    ResultDto rd = new ResultDto();
    rd.setScore(score);
    rd.setTotal(total);
    return rd;
}

    public List<ResultDto> getUserResultsByEmail(String email) {
        var user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return List.of();
        return resultRepository.findByUserId(user.getId()).stream().map(r -> {
            ResultDto rd = new ResultDto();
            rd.setScore(r.getScore());
            rd.setTotal(r.getTotalQuestions());
            rd.setQuizId(r.getQuiz().getId());
            rd.setQuizTitle(r.getQuiz().getTitle());
            rd.setTakenAt(r.getTakenAt().atZone(ZoneId.systemDefault()).toInstant());
            return rd;
        }).collect(Collectors.toList());
    }
}
