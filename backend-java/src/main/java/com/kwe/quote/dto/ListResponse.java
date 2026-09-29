package com.kwe.quote.dto;

import java.util.List;

/** Shell every list endpoint returns. An object can gain fields later, a bare array cannot. */
public record ListResponse<T>(List<T> items) {
}
