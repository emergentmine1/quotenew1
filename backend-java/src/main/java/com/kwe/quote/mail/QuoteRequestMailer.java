package com.kwe.quote.mail;

import java.util.ArrayList;
import java.util.List;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

/**
 * Sends two emails for every saved quote request: a confirmation to the customer and a summary to
 * the internal KWE addresses. The content comes from templates/email/*.html.
 *
 * <p>Runs after the transaction commits, so an email never goes out for a request that was rolled
 * back. A failed email is logged and does not affect the saved request.
 */
@Component
public class QuoteRequestMailer {

    static final String CUSTOMER_TEMPLATE = "email/quote-request-customer";
    static final String INTERNAL_TEMPLATE = "email/quote-request-internal";

    private static final Logger log = LoggerFactory.getLogger(QuoteRequestMailer.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final ITemplateEngine templateEngine;
    private final QuoteRequestEmailBuilder emailBuilder;
    private final QuoteMailProperties properties;

    public QuoteRequestMailer(ObjectProvider<JavaMailSender> mailSender, ITemplateEngine templateEngine,
            QuoteRequestEmailBuilder emailBuilder, QuoteMailProperties properties) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.emailBuilder = emailBuilder;
        this.properties = properties;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onQuoteRequestSubmitted(QuoteRequestSubmitted event) {
        String reference = event.created().qrref();
        // No SMTP host is set, for example on a developer machine. Saving still works.
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || isBlank(properties.from())) {
            log.warn("Mail is not configured, no email sent, qrref={}", reference);
            return;
        }

        QuoteRequestEmail email;
        try {
            email = emailBuilder.build(event.payload(), event.created());
        } catch (RuntimeException exception) {
            log.error("Quote request email could not be prepared, qrref={}", reference, exception);
            return;
        }

        send(sender, "customer", List.of(email.email()), null,
                "We received your quote request " + reference, CUSTOMER_TEMPLATE, email);

        List<String> internalTo = internalRecipients();
        if (internalTo.isEmpty()) {
            log.warn("No internal recipients are set, internal email not sent, qrref={}", reference);
            return;
        }
        // Reply-To is the customer, so the internal team can answer them straight from the email.
        send(sender, "internal", internalTo, email.email(),
                "New quote request " + reference + ": " + email.originCode() + " to " + email.destinationCode(),
                INTERNAL_TEMPLATE, email);
    }

    private void send(JavaMailSender sender, String type, List<String> to, String replyTo, String subject,
            String template, QuoteRequestEmail email) {
        try {
            Context context = new Context();
            context.setVariable("quote", email);
            String html = templateEngine.process(template, context);

            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(properties.from());
            helper.setTo(to.toArray(new String[0]));
            if (replyTo != null) {
                helper.setReplyTo(replyTo);
            }
            helper.setSubject(subject);
            helper.setText(html, true);
            sender.send(message);
            // Addresses are personal data, so only the reference and the email type are logged.
            log.info("Quote request email sent, qrref={}, type={}", email.reference(), type);
        } catch (Exception exception) {
            log.error("Quote request email failed, qrref={}, type={}", email.reference(), type, exception);
        }
    }

    private List<String> internalRecipients() {
        List<String> recipients = new ArrayList<>();
        if (properties.internalTo() == null) {
            return recipients;
        }
        for (String address : properties.internalTo()) {
            if (!isBlank(address)) {
                recipients.add(address.trim());
            }
        }
        return recipients;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
