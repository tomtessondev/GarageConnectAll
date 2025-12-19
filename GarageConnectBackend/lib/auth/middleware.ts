import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './jwt';

/**
 * Verify authentication middleware
 * Returns user payload if authenticated, null otherwise
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload;
}

/**
 * Create authenticated response or error
 */
export function createAuthResponse(
  authenticated: boolean,
  data?: unknown,
  message?: string
): NextResponse {
  if (!authenticated) {
    return NextResponse.json(
      { error: 'Unauthorized', message: message || 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.json(data || { success: true });
}

/**
 * Verify admin role
 */
export function isAdmin(payload: JWTPayload | null): boolean {
  return payload?.role === 'admin';
}

/**
 * Protected route wrapper
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await authenticateRequest(request);

  if (!user) {
    return createAuthResponse(false, undefined, 'Authentication required');
  }

  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Admin access required' },
      { status: 403 }
    );
  }

  return handler(request, user);
}
