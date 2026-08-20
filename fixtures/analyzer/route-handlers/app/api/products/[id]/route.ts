export function GET() {
  return Response.json({});
}

export const DELETE = () => new Response(null);

const updateProduct = () => new Response(null);
export { updateProduct as PATCH };

export const CONNECT = () => new Response(null);
export default function fallback() {
  return new Response(null);
}
