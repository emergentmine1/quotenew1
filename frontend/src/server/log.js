// Server side logging. One JSON line per event, so CloudWatch keeps a stack trace in a single log event.
// Field names follow the ECS format that quote-extui-service uses, so one query works for both.
// Never pass form data here: it holds customer contact details.

export function logError(message, error) {
  console.error(
    JSON.stringify({
      '@timestamp': new Date().toISOString(),
      log: { level: 'ERROR' },
      message,
      service: { name: 'quote-extui', version: process.env.NEXT_PUBLIC_APP_VERSION },
      error: {
        type: error?.name,
        message: error?.message,
        stack_trace: error?.stack,
        // Backend 400 answers list the rejected field names, which point at a mapping bug.
        fields: error?.fieldErrors?.length ? error.fieldErrors.map((field) => field.field) : undefined,
      },
      http: error?.status ? { response: { status_code: error.status } } : undefined,
    })
  );
}
