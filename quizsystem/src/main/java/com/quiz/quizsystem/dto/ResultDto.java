package com.quiz.quizsystem.dto;

import java.time.Instant;
public class ResultDto {
    private Integer score;
    private Integer total;
    private Long quizId;
    private String quizTitle;
    private Instant takenAt;
    // getters/setters
    public Integer getScore(){return score;} public void setScore(Integer s){this.score=s;}
    public Integer getTotal(){return total;} public void setTotal(Integer t){this.total=t;}
    public Long getQuizId(){return quizId;} public void setQuizId(Long id){this.quizId=id;}
    public String getQuizTitle(){return quizTitle;} public void setQuizTitle(String t){this.quizTitle=t;}
    public Instant getTakenAt(){return takenAt;} public void setTakenAt(Instant i){this.takenAt=i;}
}
