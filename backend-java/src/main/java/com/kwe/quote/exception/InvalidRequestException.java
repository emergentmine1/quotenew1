package com.kwe.quote.exception;

import java.util.List;

import com.kwe.quote.dto.ApiFieldError;

/** Thrown when client supplied input fails validation. Becomes an HTTP 400. */
public class InvalidRequestException extends RuntimeException {

    private final List<ApiFieldError> fieldErrors;

    public InvalidRequestException(String message) {
        super(message);
        this.fieldErrors = List.of();
    }

    /** Reports every rejected field at once, so a caller can fix a whole form in one go. */
    public InvalidRequestException(String message, List<ApiFieldError> fieldErrors) {
        super(message);
        this.fieldErrors = List.copyOf(fieldErrors);
    }

    public List<ApiFieldError> fieldErrors() {
        return fieldErrors;
    }
}
