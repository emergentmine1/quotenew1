package com.kwe.quote.exception;

import java.util.ArrayList;
import java.util.List;

import com.kwe.quote.dto.ApiFieldError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/** Renders errors as RFC 9457 problem details. A field level 400 adds an {@code errors} array. */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(InvalidRequestException.class)
    public ProblemDetail handleInvalidRequest(InvalidRequestException exception) {
        logRejected(exception.fieldErrors());
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Bad Request");
        problem.setDetail(exception.getMessage());
        if (!exception.fieldErrors().isEmpty()) {
            problem.setProperty("errors", exception.fieldErrors());
        }
        return problem;
    }

    /** The cause is already logged where it happened, so only the answer is built here. */
    @ExceptionHandler(ServiceUnavailableException.class)
    public ProblemDetail handleServiceUnavailable(ServiceUnavailableException exception) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.SERVICE_UNAVAILABLE);
        problem.setTitle("Service Unavailable");
        problem.setDetail(exception.getMessage());
        return problem;
    }

    /** Gives bean validation failures the same shape as the handler above. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        List<ApiFieldError> errors = new ArrayList<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            errors.add(new ApiFieldError(fieldError.getField(), messageOf(fieldError)));
        }
        for (ObjectError globalError : exception.getBindingResult().getGlobalErrors()) {
            errors.add(new ApiFieldError(globalError.getObjectName(), messageOf(globalError)));
        }
        logRejected(errors);

        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Bad Request");
        problem.setDetail("The request body has " + errors.size() + " validation error(s).");
        problem.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(problem);
    }

    // Once Spring Security is added, handle AccessDeniedException explicitly or it turns into a 500 here instead of a 403.
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception exception) {
        log.error("Unhandled exception", exception);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        problem.setTitle("Internal Server Error");
        problem.setDetail("The request could not be processed.");
        return problem;
    }

    /** The only caller is our own frontend, so a 400 usually means a bug there. Field names only, no values. */
    private void logRejected(List<ApiFieldError> errors) {
        List<String> fields = new ArrayList<>();
        for (ApiFieldError error : errors) {
            fields.add(error.field());
        }
        log.warn("Request rejected, fields={}", fields);
    }

    private String messageOf(ObjectError error) {
        if (error.getDefaultMessage() == null) {
            return "is not valid";
        }
        return error.getDefaultMessage();
    }
}
