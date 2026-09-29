package com.kwe.quote.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String PROBLEM_JSON = "application/problem+json";
    private static final String ERROR_SCHEMA_REF = "#/components/schemas/ApiError";

    @Bean
    public OpenAPI kweQuoteOpenApi() {
        Info info = new Info()
                .title("Instant Quote Service (quote-extui-service)")
                .version("v1")
                .description("""
                        Instant Quote backend: form defaults, master data, city and zip code suggestions, and quote submission.

                        Every code field holds an md_codedetail.cdcode exactly as \
                        /api/v1/masterdata/codes returned it, for example TPMA and not AIR. \
                        Codes are case sensitive. Build the dropdowns from that endpoint rather \
                        than hardcoding values.""");
        return new OpenAPI().info(info);
    }

    /** Every endpoint can fail the same way, so 500 is added here instead of on each one. */
    @Bean
    public OpenApiCustomizer defaultErrorResponses() {
        return openApi -> {
            if (openApi.getPaths() == null) {
                return;
            }
            for (var pathItem : openApi.getPaths().values()) {
                for (Operation operation : pathItem.readOperations()) {
                    addServerError(operation);
                }
            }
        };
    }

    private void addServerError(Operation operation) {
        ApiResponses responses = operation.getResponses();
        if (responses == null || responses.containsKey("500")) {
            return;
        }
        Content content = new Content().addMediaType(PROBLEM_JSON,
                new MediaType().schema(new Schema<>().$ref(ERROR_SCHEMA_REF)));
        responses.addApiResponse("500", new ApiResponse()
                .description("Unexpected failure. The body never carries internal detail.")
                .content(content));
    }
}
