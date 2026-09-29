package com.kwe.quote.dto;

import java.time.Instant;

public record PingResponse(String status, String version, Instant timestamp) {
}
