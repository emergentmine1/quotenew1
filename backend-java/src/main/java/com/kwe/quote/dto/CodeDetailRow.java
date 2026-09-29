package com.kwe.quote.dto;

// One joined row from md_codemaster and md_codedetail. Left join: code, codeDescription and
// sequence are null for a category with no active values.
public record CodeDetailRow(
        String category,
        String categoryDescription,
        String code,
        String codeDescription,
        Integer sequence) {
}
