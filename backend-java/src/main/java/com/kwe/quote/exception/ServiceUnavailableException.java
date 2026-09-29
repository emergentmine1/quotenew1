package com.kwe.quote.exception;

/** An outside service that a request depends on is down or not set up. Becomes an HTTP 503. */
public class ServiceUnavailableException extends RuntimeException {

    public ServiceUnavailableException(String message) {
        super(message);
    }
}
