package com.quiz.quizsystem.dto;

import java.util.List;
public class QuestionDto {
    private Long id;
    private String text;
    private List<OptionDto> options;
    // getters/setters
    public Long getId(){return id;} public void setId(Long id){this.id = id;}
    public String getText(){return text;} public void setText(String t){this.text=t;}
    public List<OptionDto> getOptions(){return options;} public void setOptions(List<OptionDto> o){this.options=o;}
}
