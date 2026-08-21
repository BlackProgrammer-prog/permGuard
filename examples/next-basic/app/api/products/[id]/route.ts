import { authorization } from "../../../../src/auth/authorization";

export const DELETE = authorization.withAuthorization(
  ["delete", "Product"],
  async (_request, { params }) => {
    const { id } = await params;

    // Replace this demonstration response with a validated data operation.
    return Response.json({ deleted: id });
  },
);
