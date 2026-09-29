package com.kwe.quote.repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import com.kwe.quote.dto.CodeDetailRow;

import static com.kwe.quote.jooq.tables.MdCodedetail.MD_CODEDETAIL;
import static com.kwe.quote.jooq.tables.MdCodemaster.MD_CODEMASTER;

@Repository
public class CodeDetailRepository {

    private final DSLContext dsl;

    public CodeDetailRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<CodeDetailRow> findAll() {
        return fetch(DSL.noCondition());
    }

    public List<CodeDetailRow> findByCategories(List<String> categories) {
        return fetch(MD_CODEMASTER.CMCODE.in(categories));
    }

    /**
     * Maps each active cdcode to its category. One call covers every code on a quote request,
     * however many line items it has. A code that does not exist is missing from the map.
     */
    public Map<String, String> findCategoryByCode(Collection<String> codes) {
        if (codes.isEmpty()) {
            return Map.of();
        }
        return dsl.select(MD_CODEDETAIL.CDCODE, MD_CODEDETAIL.CMCODE)
                .from(MD_CODEDETAIL)
                .join(MD_CODEMASTER)
                .on(MD_CODEMASTER.CMCODE.eq(MD_CODEDETAIL.CMCODE))
                .where(MD_CODEDETAIL.CDCODE.in(codes))
                .and(MD_CODEDETAIL.ISACTIVE.isTrue())
                .and(MD_CODEMASTER.ISACTIVE.isTrue())
                .fetchMap(MD_CODEDETAIL.CDCODE, MD_CODEDETAIL.CMCODE);
    }

    /** Maps each cdcode to its description, for display. Inactive codes are included on purpose. */
    public Map<String, String> findDescriptionByCode(Collection<String> codes) {
        if (codes.isEmpty()) {
            return Map.of();
        }
        return dsl.select(MD_CODEDETAIL.CDCODE, MD_CODEDETAIL.CDDESCRIPTION)
                .from(MD_CODEDETAIL)
                .where(MD_CODEDETAIL.CDCODE.in(codes))
                .fetchMap(MD_CODEDETAIL.CDCODE, MD_CODEDETAIL.CDDESCRIPTION);
    }

    private List<CodeDetailRow> fetch(Condition filter) {
        return dsl.select(MD_CODEMASTER.CMCODE, MD_CODEMASTER.CMDESCRIPTION,
                        MD_CODEDETAIL.CDCODE, MD_CODEDETAIL.CDDESCRIPTION, MD_CODEDETAIL.SEQUENCE)
                .from(MD_CODEMASTER)
                .leftJoin(MD_CODEDETAIL)
                .on(MD_CODEDETAIL.CMCODE.eq(MD_CODEMASTER.CMCODE)
                        .and(MD_CODEDETAIL.ISACTIVE.isTrue()))
                .where(MD_CODEMASTER.ISACTIVE.isTrue())
                .and(filter)
                .orderBy(MD_CODEMASTER.CMCODE.asc(),
                        MD_CODEDETAIL.SEQUENCE.asc().nullsLast(),
                        MD_CODEDETAIL.CDCODE.asc())
                .fetch(r -> new CodeDetailRow(r.value1(), r.value2(), r.value3(), r.value4(), r.value5()));
    }
}
