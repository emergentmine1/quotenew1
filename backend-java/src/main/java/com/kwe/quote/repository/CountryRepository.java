package com.kwe.quote.repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

import com.kwe.quote.dto.Country;

import static com.kwe.quote.jooq.tables.MdCountries.MD_COUNTRIES;

@Repository
public class CountryRepository {

    private final DSLContext dsl;

    public CountryRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /** Every active country, ordered by name. */
    public List<Country> findAllActive() {
        return dsl.select(MD_COUNTRIES.COUNTRYCODE, MD_COUNTRIES.COUNTRYNAME, MD_COUNTRIES.REGION)
                .from(MD_COUNTRIES)
                .where(MD_COUNTRIES.ISACTIVE.isTrue())
                .orderBy(MD_COUNTRIES.COUNTRYNAME.asc())
                .fetch(r -> new Country(r.value1(), r.value2(), r.value3()));
    }

    /** Maps each country code to its name. For display. */
    public Map<String, String> findNameByCode(Collection<String> countryCodes) {
        if (countryCodes.isEmpty()) {
            return Map.of();
        }
        return dsl.select(MD_COUNTRIES.COUNTRYCODE, MD_COUNTRIES.COUNTRYNAME)
                .from(MD_COUNTRIES)
                .where(MD_COUNTRIES.COUNTRYCODE.in(countryCodes))
                .fetchMap(MD_COUNTRIES.COUNTRYCODE, MD_COUNTRIES.COUNTRYNAME);
    }

    /** Which of these country codes exist and are active. One query validates all three fields. */
    public Set<String> findExistingCodes(Collection<String> countryCodes) {
        if (countryCodes.isEmpty()) {
            return Set.of();
        }
        return dsl.select(MD_COUNTRIES.COUNTRYCODE)
                .from(MD_COUNTRIES)
                .where(MD_COUNTRIES.COUNTRYCODE.in(countryCodes))
                .and(MD_COUNTRIES.ISACTIVE.isTrue())
                .fetchSet(MD_COUNTRIES.COUNTRYCODE);
    }
}
