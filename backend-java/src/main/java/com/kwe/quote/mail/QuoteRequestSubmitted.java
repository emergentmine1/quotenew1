package com.kwe.quote.mail;

import com.kwe.quote.dto.QuoteRequestCreated;
import com.kwe.quote.dto.QuoteRequestPayload;

/** Published when a quote request is saved. The emails go out after the transaction commits. */
public record QuoteRequestSubmitted(QuoteRequestPayload payload, QuoteRequestCreated created) {
}
