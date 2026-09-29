package com.kwe.quote.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.kwe.quote.dto.Country;
import com.kwe.quote.repository.CountryRepository;

/** Nothing to decide yet, but it keeps controllers off repositories and gives filtering a home. */
@Service
public class CountryService {

    private final CountryRepository repository;

    public CountryService(CountryRepository repository) {
        this.repository = repository;
    }

    public List<Country> findAllActive() {
        return repository.findAllActive();
    }
}
