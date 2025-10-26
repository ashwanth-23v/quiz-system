package com.quiz.quizsystem.dto;

import java.util.Map;

public class SubmitAnswerDto {
    private Long quizId;
    private Map<Long, Long> answers;
    // getters/setters
    public Long getQuizId(){return quizId;} public void setQuizId(Long quizId){this.quizId=quizId;}
    public Map<Long, Long> getAnswers(){return answers;} public void setAnswers(Map<Long, Long> answers){this.answers = answers;}
}
