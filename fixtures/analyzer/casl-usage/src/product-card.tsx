import { Can as Allowed, useCan as usePermission } from "@permguard/react";

export function ProductCard() {
  const mayEdit = usePermission("update", "Product");

  return (
    <Allowed action="delete" subject={"Product"} field="status">
      {mayEdit ? "edit" : "read"}
    </Allowed>
  );
}
