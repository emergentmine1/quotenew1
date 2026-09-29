package com.kwe.quote.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.kwe.quote.dto.CodeDetail;
import com.kwe.quote.dto.CodeDetailRow;
import com.kwe.quote.dto.CodeMaster;
import com.kwe.quote.repository.CodeDetailRepository;

/** Reshapes flat database rows into one entry per code category. */
@Service
public class CodeDetailService {

    private final CodeDetailRepository repository;

    public CodeDetailService(CodeDetailRepository repository) {
        this.repository = repository;
    }

    public List<CodeMaster> findCategories(List<String> requested) {
        List<CodeDetailRow> rows;
        if (requested == null || requested.isEmpty()) {
            rows = repository.findAll();
        } else {
            rows = repository.findByCategories(requested);
        }

        List<CodeMaster> result = new ArrayList<>();
        String currentCategory = null;
        String currentDescription = null;
        List<CodeDetail> currentItems = new ArrayList<>();

        // Rows arrive ordered by category, so one pass is enough to group them.
        for (CodeDetailRow row : rows) {
            boolean startsNewCategory = !row.category().equals(currentCategory);
            if (startsNewCategory) {
                if (currentCategory != null) {
                    result.add(new CodeMaster(currentCategory, currentDescription, currentItems));
                }
                currentCategory = row.category();
                currentDescription = row.categoryDescription();
                currentItems = new ArrayList<>();
            }
            if (row.code() != null) {
                currentItems.add(new CodeDetail(row.code(), row.codeDescription(), row.sequence()));
            }
        }

        if (currentCategory != null) {
            result.add(new CodeMaster(currentCategory, currentDescription, currentItems));
        }
        return result;
    }
}
