// Health check for the container and the ALB target group. It does not call the backend,
// so a backend outage does not make ECS replace healthy quote-extui tasks.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'UP' });
}
