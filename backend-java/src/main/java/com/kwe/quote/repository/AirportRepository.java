package com.kwe.quote.repository;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.jooq.Condition;
import org.jooq.Field;
import org.jooq.SortField;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

import com.kwe.quote.dto.Airport;

import static com.kwe.quote.jooq.tables.MdAirports.MD_AIRPORTS;

@Repository
public class AirportRepository {

    private static final String TYPE_LARGE = "APTLRG";
    private static final String TYPE_MEDIUM = "APTMED";
    private static final String TYPE_SMALL = "APTSML";

    private final DSLContext dsl;

    public AirportRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /**
     * Finds airports for a type ahead field. Both filters are optional. The service has already
     * checked that {@code query} holds no LIKE wildcard, so it is used literally.
     *
     * <p>Best text match first, then largest airport. The size key matters: without it a search
     * for "chi" in the US returns Childress and Chicopee ahead of Chicago O'Hare, because all
     * three are city prefix matches and ORD loses on alphabetical order.
     */
    public List<Airport> search(String query, String countryCode, int limit) {
        Condition condition = MD_AIRPORTS.ISACTIVE.isTrue();
        if (countryCode != null) {
            condition = condition.and(MD_AIRPORTS.ISOCOUNTRY.equalIgnoreCase(countryCode));
        }

        List<SortField<?>> ordering = new ArrayList<>();
        if (query != null) {
            String prefix = query + "%";
            String contains = "%" + query + "%";
            condition = condition.and(
                    MD_AIRPORTS.IATACODE.likeIgnoreCase(prefix)
                            .or(MD_AIRPORTS.MUNICIPALITY.likeIgnoreCase(contains))
                            .or(MD_AIRPORTS.NAME.likeIgnoreCase(contains)));

            Field<Integer> matchRank = DSL
                    .when(MD_AIRPORTS.IATACODE.equalIgnoreCase(query), DSL.inline(0))
                    .when(MD_AIRPORTS.IATACODE.likeIgnoreCase(prefix), DSL.inline(1))
                    .when(MD_AIRPORTS.MUNICIPALITY.likeIgnoreCase(prefix), DSL.inline(2))
                    .otherwise(DSL.inline(3));
            ordering.add(matchRank.asc());
        }
        ordering.add(sizeRank().asc());
        ordering.add(MD_AIRPORTS.IATACODE.asc());

        return dsl.select(MD_AIRPORTS.IATACODE, MD_AIRPORTS.ICAOCODE, MD_AIRPORTS.NAME,
                        MD_AIRPORTS.MUNICIPALITY, MD_AIRPORTS.ISOREGION, MD_AIRPORTS.ISOCOUNTRY,
                        MD_AIRPORTS.LATITUDE, MD_AIRPORTS.LONGITUDE)
                .from(MD_AIRPORTS)
                .where(condition)
                .orderBy(ordering)
                .limit(limit)
                .fetch(r -> new Airport(r.value1(), r.value2(), r.value3(),
                        r.value4(), r.value5(), r.value6(), r.value7(), r.value8()));
    }

    /** Largest first. Heliports and seaplane bases sort last. */
    private Field<Integer> sizeRank() {
        return DSL
                .when(MD_AIRPORTS.TYPE.eq(TYPE_LARGE), DSL.inline(0))
                .when(MD_AIRPORTS.TYPE.eq(TYPE_MEDIUM), DSL.inline(1))
                .when(MD_AIRPORTS.TYPE.eq(TYPE_SMALL), DSL.inline(2))
                .otherwise(DSL.inline(3));
    }

    /** Maps each IATA code to its city, or to the airport name when the city is empty. For display. */
    public Map<String, String> findCityByCode(Collection<String> iataCodes) {
        if (iataCodes.isEmpty()) {
            return Map.of();
        }
        return dsl.select(MD_AIRPORTS.IATACODE, DSL.coalesce(MD_AIRPORTS.MUNICIPALITY, MD_AIRPORTS.NAME))
                .from(MD_AIRPORTS)
                .where(MD_AIRPORTS.IATACODE.in(iataCodes))
                .fetchMap(r -> r.value1(), r -> r.value2());
    }

    /** Which of these IATA codes exist and are active. One query validates both port codes. */
    public Set<String> findExistingCodes(Collection<String> iataCodes) {
        if (iataCodes.isEmpty()) {
            return Set.of();
        }
        return dsl.select(MD_AIRPORTS.IATACODE)
                .from(MD_AIRPORTS)
                .where(MD_AIRPORTS.IATACODE.in(iataCodes))
                .and(MD_AIRPORTS.ISACTIVE.isTrue())
                .fetchSet(MD_AIRPORTS.IATACODE);
    }
}
